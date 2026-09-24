/**
 * Digital Lecturer Engine - Core Teaching Engine
 * Coordinates lesson delivery at the atomic TeachingPoint level,
 * slide synchronization, state transitions, question interactions, and provenance.
 */

import { LecturePackage, SlideMapItem, LectureObjective } from '../../types/lecture';
import { 
  TeachingBlock, 
  TeachingState, 
  TeachingMode, 
  StudentInteractionRecord, 
  QuestionCategory,
  TeachingEvent,
  TeachingEventType,
  TeachingPointDelivery
} from '../../types/teaching';
import { TeachingPoint, TeachingPointProvenance } from '../../types/teachingPoint';
import { TeachingStateMachine } from './teachingStateMachine';
import { build1MD1TeachingPoints } from '../teachingScript/teachingPointScriptBuilder';
import { findLectureScriptByPointId } from '../teachingScript/teachingPointLectureScript';
import { normalizeSpokenLectureText } from '../ttsGateway/ttsSanitizer';
import { resolveLectureSequence } from '../lectureSequence/lectureSequenceResolver';

export interface TeachingEngineStatus {
  state: TeachingState;
  mode: TeachingMode;
  currentBlockIndex: number;
  currentBlock?: TeachingBlock;
  currentTeachingBlockId?: string;
  previousBlock?: TeachingBlock;
  nextBlock?: TeachingBlock;
  currentSlideNumber: number;
  currentSlide?: SlideMapItem;
  previousSlide?: SlideMapItem;
  nextSlide?: SlideMapItem;
  currentTeachingPointIndex: number; // 0-based index across all points
  currentTeachingPointId?: string;
  currentTeachingPoint?: TeachingPoint;
  totalPoints: number;
  totalPointsOnCurrentSlide: number;
  pointIndexOnCurrentSlide: number; // 1-based index on current slide
  currentObjective?: LectureObjective;
  lessonFocus: string;
  elapsedSeconds: number;
  remainingSeconds: number;
  totalPlannedSeconds: number;
  pointElapsedSeconds: number;
  pointRemainingSeconds: number;
  isPaused: boolean;
  pointDeliveryScript?: TeachingPointDelivery;
  currentProvenance?: {
    packageId: string;
    teachingBlockId: string;
    slideNumber: number;
    teachingPointId: string;
    sourceId: string;
    sourceLocator: TeachingPointProvenance['locator'];
  };
  activeQuestion?: {
    questionText: string;
    waitSeconds: number;
    timeRemainingSeconds: number;
  };
}

export class TeachingEngine {
  private pkg: LecturePackage;
  private stateMachine: TeachingStateMachine;
  private currentMode: TeachingMode = 'FULL_LECTURE';
  private allTeachingPoints: TeachingPoint[] = [];
  private currentPointIndex = 0;
  private elapsedSeconds = 0;
  private pointElapsedSeconds = 0;
  private interactionHistory: StudentInteractionRecord[] = [];
  private eventsHistory: TeachingEvent[] = [];
  private questionTimerRemaining = 0;

  constructor(
    lecturePackage: LecturePackage, 
    initialMode: TeachingMode = 'FULL_LECTURE',
    customTeachingPoints?: TeachingPoint[]
  ) {
    if (lecturePackage.status !== 'APPROVED' && lecturePackage.status !== 'LOCKED' && lecturePackage.status !== 'TEACHING') {
      console.warn(`[TeachingEngine] Initializing with package in "${lecturePackage.status}" state.`);
    }
    this.pkg = lecturePackage;
    this.currentMode = initialMode;
    this.stateMachine = new TeachingStateMachine();

    // Initialize Teaching Points via production sequence resolver:
    // Block -> Slide -> TeachingPoint (monotonic)
    const resolved = resolveLectureSequence(lecturePackage, customTeachingPoints);
    this.allTeachingPoints = resolved.teachingPoints;
  }

  public getPackage(): LecturePackage {
    return this.pkg;
  }

  public getMode(): TeachingMode {
    return this.currentMode;
  }

  public setMode(mode: TeachingMode): void {
    this.currentMode = mode;
  }

  public getTeachingPoints(): TeachingPoint[] {
    return [...this.allTeachingPoints];
  }

  public getAllTeachingPoints(): TeachingPoint[] {
    return [...this.allTeachingPoints];
  }

  public getCurrentPointIndex(): number {
    return this.currentPointIndex;
  }

  public getCurrentTeachingPoint(): TeachingPoint | undefined {
    return this.allTeachingPoints[this.currentPointIndex];
  }

  public getCurrentTeachingBlock(): TeachingBlock | undefined {
    const curPoint = this.getCurrentTeachingPoint();
    if (curPoint) {
      return this.pkg.teachingBlocks.find(b => b.id === curPoint.teachingBlockId) || this.pkg.teachingBlocks[0];
    }
    return this.pkg.teachingBlocks[0];
  }

  public getCurrentBlockIndex(): number {
    const curPoint = this.getCurrentTeachingPoint();
    if (curPoint) {
      const idx = this.pkg.teachingBlocks.findIndex(b => b.id === curPoint.teachingBlockId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  }

  public getTeachingPointsForSlide(slideNumber: number): TeachingPoint[] {
    return this.allTeachingPoints.filter(p => p.slideNumber === slideNumber);
  }

  public getTeachingPointsForBlock(blockId: string): TeachingPoint[] {
    return this.allTeachingPoints.filter(p => p.teachingBlockId === blockId);
  }

  public getEventsHistory(): TeachingEvent[] {
    return [...this.eventsHistory];
  }

  public getStatus(): TeachingEngineStatus {
    const curPoint = this.getCurrentTeachingPoint();
    const currentBlock = this.getCurrentTeachingBlock();
    const currentBlockIndex = this.getCurrentBlockIndex();

    const blocks = this.pkg.teachingBlocks;
    const previousBlock = currentBlockIndex > 0 ? blocks[currentBlockIndex - 1] : undefined;
    const nextBlock = currentBlockIndex < blocks.length - 1 ? blocks[currentBlockIndex + 1] : undefined;

    const currentSlideNumber = curPoint?.slideNumber || (currentBlock?.slideStart || 1);
    const currentSlide = this.pkg.slideMap.find(s => s.slideNumber === currentSlideNumber) || this.pkg.slideMap[0];
    const previousSlide = this.pkg.slideMap.find(s => s.slideNumber === currentSlideNumber - 1);
    const nextSlide = this.pkg.slideMap.find(s => s.slideNumber === currentSlideNumber + 1);

    const pointsOnSlide = this.getTeachingPointsForSlide(currentSlideNumber);
    const pointIndexOnCurrentSlide = curPoint 
      ? Math.max(1, pointsOnSlide.findIndex(p => p.id === curPoint.id) + 1)
      : 1;

    const currentObjective = this.pkg.objectives.find(o => 
      currentBlock?.objectiveIds.includes(o.id)
    ) || this.pkg.objectives[0];

    const totalPlanned = this.pkg.timingPlan.totalPlannedSeconds || 3600;
    const remainingSeconds = Math.max(0, totalPlanned - this.elapsedSeconds);

    const pointDuration = curPoint?.durationSeconds || 60;
    const pointRemainingSeconds = Math.max(0, pointDuration - this.pointElapsedSeconds);

    const deliveryScript = curPoint ? this.getPointDelivery(curPoint) : undefined;

    const currentProvenance = curPoint ? {
      packageId: this.pkg.id,
      teachingBlockId: curPoint.teachingBlockId,
      slideNumber: curPoint.slideNumber,
      teachingPointId: curPoint.id,
      sourceId: curPoint.provenance.sourceId,
      sourceLocator: curPoint.provenance.locator
    } : undefined;

    return {
      state: this.stateMachine.getState(),
      mode: this.currentMode,
      currentBlockIndex,
      currentBlock,
      currentTeachingBlockId: currentBlock?.id,
      previousBlock,
      nextBlock,
      currentSlideNumber,
      currentSlide,
      previousSlide,
      nextSlide,
      currentTeachingPointIndex: this.currentPointIndex,
      currentTeachingPointId: curPoint?.id,
      currentTeachingPoint: curPoint,
      totalPoints: this.allTeachingPoints.length,
      totalPointsOnCurrentSlide: pointsOnSlide.length,
      pointIndexOnCurrentSlide,
      currentObjective,
      lessonFocus: this.pkg.metadata.pedagogicalFocus,
      elapsedSeconds: this.elapsedSeconds,
      remainingSeconds,
      totalPlannedSeconds: totalPlanned,
      pointElapsedSeconds: this.pointElapsedSeconds,
      pointRemainingSeconds,
      isPaused: this.stateMachine.getState() === 'PAUSED',
      pointDeliveryScript: deliveryScript,
      currentProvenance,
      activeQuestion: this.questionTimerRemaining > 0 && currentBlock?.question ? {
        questionText: currentBlock.question,
        waitSeconds: currentBlock.waitSeconds || 10,
        timeRemainingSeconds: this.questionTimerRemaining
      } : undefined
    };
  }

  /**
   * Constructs the structured delivery according to Pedagogical Rules A-E:
   * A. Nêu luận điểm
   * B. Giải thích luận điểm
   * C. Nhấn mạnh nội dung cốt lõi
   * D. Đưa ví dụ/liên hệ nếu có dữ liệu (không tự bịa)
   * E. Chuyển sang luận điểm tiếp theo
   */
  public getPointDelivery(point: TeachingPoint): TeachingPointDelivery {
    const hasExample = Boolean(point.example && point.example.trim().length > 0);
    const hasApplication = Boolean(point.application && point.application.trim().length > 0);

    const statement = `Luận điểm: ${point.title}`;
    const explanation = point.explanation;
    const emphasis = point.emphasis;
    const example = hasExample ? point.example : undefined;
    const application = hasApplication ? point.application : undefined;
    const transition = point.transition;

    const parts: string[] = [statement, explanation];
    if (emphasis) parts.push(`Nhấn mạnh cốt lõi: ${emphasis}`);
    if (example) parts.push(`Ví dụ: ${example}`);
    if (application) parts.push(`Liên hệ vận dụng: ${application}`);
    if (transition) parts.push(transition);

    // Check if canonical sanitized spoken script is registered (e.g. Slides 15-18 canonical scripts)
    const canonicalScript = findLectureScriptByPointId(point.id);
    const rawSpokenScript = canonicalScript?.fullLectureScript || (
      // For other points, build clean spoken voice output without structural metadata tags
      [
        point.title,
        explanation,
        emphasis ? `Cần ghi nhớ: ${emphasis}` : '',
        example ? `Ví dụ: ${example}` : '',
        application ? `Vận dụng thực tiễn: ${application}` : '',
        transition || ''
      ].filter(Boolean).join('. ')
    );
    const spokenLectureScript = normalizeSpokenLectureText(rawSpokenScript);

    return {
      pointId: point.id,
      pointType: point.pointType,
      title: point.title,
      statement,
      explanation,
      emphasis,
      example,
      application,
      transition,
      hasExample,
      hasApplication,
      fullLectureScript: spokenLectureScript
    };
  }

  public startLecture(): boolean {
    this.currentPointIndex = 0;
    this.elapsedSeconds = 0;
    this.pointElapsedSeconds = 0;
    this.questionTimerRemaining = 0;

    const firstPoint = this.getCurrentTeachingPoint();
    if (firstPoint) {
      this.logTeachingEvent('TEACHING_POINT_STARTED', 'START_LECTURE');
      return this.stateMachine.transition('CURRENT_TEACHING_POINT', 'START_LECTURE', {
        pointId: firstPoint.id,
        slideNumber: firstPoint.slideNumber,
        blockId: firstPoint.teachingBlockId
      });
    }

    return this.stateMachine.transition('CURRENT_TEACHING_POINT', 'START_LECTURE');
  }

  public proceedToExplaining(): boolean {
    const curPoint = this.getCurrentTeachingPoint();
    return this.stateMachine.transition('CURRENT_TEACHING_POINT', 'BEGIN_EXPLANATION', {
      pointId: curPoint?.id,
      blockId: curPoint?.teachingBlockId
    });
  }

  /**
   * Advances strictly to the next TeachingPoint in sequence:
   * TeachingBlock -> Slide -> TeachingPoint 1 -> 2 -> ... -> next Slide -> ...
   */
  public nextTeachingPoint(): boolean {
    const currentPoint = this.getCurrentTeachingPoint();
    if (currentPoint) {
      this.logTeachingEvent('TEACHING_POINT_COMPLETED', 'NORMAL_COMPLETION');
    }

    if (this.currentPointIndex < this.allTeachingPoints.length - 1) {
      const prevSlide = currentPoint?.slideNumber;
      const prevBlock = currentPoint?.teachingBlockId;

      this.currentPointIndex++;
      this.pointElapsedSeconds = 0;
      this.questionTimerRemaining = 0;

      const newPoint = this.getCurrentTeachingPoint()!;

      if (prevSlide !== newPoint.slideNumber) {
        this.logTeachingEvent('SLIDE_CHANGED', `ADVANCE_TO_SLIDE_${newPoint.slideNumber}`);
      }
      if (prevBlock !== newPoint.teachingBlockId) {
        this.logTeachingEvent('BLOCK_CHANGED', `ADVANCE_TO_BLOCK_${newPoint.teachingBlockId}`);
      }

      this.logTeachingEvent('TEACHING_POINT_STARTED', 'ADVANCE_NEXT_POINT');

      return this.stateMachine.transition('CURRENT_TEACHING_POINT', 'NEXT_TEACHING_POINT', {
        pointId: newPoint.id,
        slideNumber: newPoint.slideNumber,
        blockId: newPoint.teachingBlockId
      });
    } else {
      return this.stateMachine.transition('CONCLUDING', 'FINISH_ALL_POINTS');
    }
  }

  public previousTeachingPoint(): boolean {
    if (this.currentPointIndex > 0) {
      this.currentPointIndex--;
      this.pointElapsedSeconds = 0;
      this.questionTimerRemaining = 0;

      const point = this.getCurrentTeachingPoint()!;
      this.logTeachingEvent('TEACHING_POINT_REPEATED', 'PREVIOUS_POINT_REQUEST');
      this.logTeachingEvent('TEACHING_POINT_STARTED', 'RETURN_PREVIOUS_POINT');

      return this.stateMachine.transition('CURRENT_TEACHING_POINT', 'PREVIOUS_TEACHING_POINT', {
        pointId: point.id,
        slideNumber: point.slideNumber,
        blockId: point.teachingBlockId
      });
    }
    return false;
  }

  public skipTeachingPoint(reason = 'LECTURER_SKIPPED'): boolean {
    const currentPoint = this.getCurrentTeachingPoint();
    if (currentPoint) {
      this.logTeachingEvent('TEACHING_POINT_SKIPPED', reason);
    }

    if (this.currentPointIndex < this.allTeachingPoints.length - 1) {
      this.currentPointIndex++;
      this.pointElapsedSeconds = 0;
      this.questionTimerRemaining = 0;

      const newPoint = this.getCurrentTeachingPoint()!;
      this.logTeachingEvent('TEACHING_POINT_STARTED', 'AFTER_SKIP');

      return this.stateMachine.transition('CURRENT_TEACHING_POINT', 'SKIP_TEACHING_POINT', {
        pointId: newPoint.id,
        slideNumber: newPoint.slideNumber,
        blockId: newPoint.teachingBlockId
      });
    } else {
      return this.stateMachine.transition('CONCLUDING', 'FINISH_ALL_POINTS');
    }
  }

  public repeatTeachingPoint(reason = 'LECTURER_REPEATED'): boolean {
    const currentPoint = this.getCurrentTeachingPoint();
    if (currentPoint) {
      this.logTeachingEvent('TEACHING_POINT_REPEATED', reason);
      this.pointElapsedSeconds = 0;
      return true;
    }
    return false;
  }

  /**
   * Jumps to the first TeachingPoint of the next slide.
   */
  public nextSlide(): boolean {
    const currentPoint = this.getCurrentTeachingPoint();
    if (!currentPoint) return false;

    const currentSlide = currentPoint.slideNumber;
    const targetIndex = this.allTeachingPoints.findIndex(p => p.slideNumber > currentSlide);
    if (targetIndex !== -1) {
      this.logTeachingEvent('TEACHING_POINT_COMPLETED', 'SLIDE_ADVANCED');
      this.currentPointIndex = targetIndex;
      this.pointElapsedSeconds = 0;
      this.questionTimerRemaining = 0;

      const newPoint = this.getCurrentTeachingPoint()!;
      this.logTeachingEvent('SLIDE_CHANGED', `ADVANCE_TO_SLIDE_${newPoint.slideNumber}`);
      this.logTeachingEvent('TEACHING_POINT_STARTED', 'NEXT_SLIDE_FIRST_POINT');

      return this.stateMachine.transition('CURRENT_TEACHING_POINT', 'NEXT_SLIDE', {
        slideNumber: newPoint.slideNumber,
        pointId: newPoint.id
      });
    }
    return false;
  }

  /**
   * Jumps to the first TeachingPoint of the previous slide.
   */
  public previousSlide(): boolean {
    const currentPoint = this.getCurrentTeachingPoint();
    if (!currentPoint) return false;

    const currentSlide = currentPoint.slideNumber;
    const prevSlidePoints = this.allTeachingPoints.filter(p => p.slideNumber < currentSlide);
    if (prevSlidePoints.length > 0) {
      const prevSlideNumber = prevSlidePoints[prevSlidePoints.length - 1].slideNumber;
      const targetIndex = this.allTeachingPoints.findIndex(p => p.slideNumber === prevSlideNumber);
      if (targetIndex !== -1) {
        this.currentPointIndex = targetIndex;
        this.pointElapsedSeconds = 0;
        this.questionTimerRemaining = 0;

        const newPoint = this.getCurrentTeachingPoint()!;
        this.logTeachingEvent('SLIDE_CHANGED', `BACK_TO_SLIDE_${newPoint.slideNumber}`);
        this.logTeachingEvent('TEACHING_POINT_STARTED', 'PREV_SLIDE_FIRST_POINT');

        return this.stateMachine.transition('CURRENT_TEACHING_POINT', 'PREVIOUS_SLIDE', {
          slideNumber: newPoint.slideNumber,
          pointId: newPoint.id
        });
      }
    }
    return false;
  }

  public jumpToSlide(slideNumber: number): boolean {
    const targetIndex = this.allTeachingPoints.findIndex(p => p.slideNumber === slideNumber);
    if (targetIndex !== -1) {
      this.currentPointIndex = targetIndex;
      this.pointElapsedSeconds = 0;
      this.questionTimerRemaining = 0;

      const newPoint = this.getCurrentTeachingPoint()!;
      this.logTeachingEvent('SLIDE_CHANGED', `JUMP_TO_SLIDE_${newPoint.slideNumber}`);
      this.logTeachingEvent('TEACHING_POINT_STARTED', 'JUMP_SLIDE_FIRST_POINT');

      return this.stateMachine.transition('CURRENT_TEACHING_POINT', 'JUMP_TO_SLIDE', {
        slideNumber: newPoint.slideNumber,
        pointId: newPoint.id
      });
    }
    return false;
  }

  public jumpToTeachingPoint(pointId: string): boolean {
    const targetIndex = this.allTeachingPoints.findIndex(p => p.id === pointId);
    if (targetIndex !== -1) {
      this.currentPointIndex = targetIndex;
      this.pointElapsedSeconds = 0;
      this.questionTimerRemaining = 0;

      const newPoint = this.getCurrentTeachingPoint()!;
      this.logTeachingEvent('TEACHING_POINT_STARTED', 'JUMP_TO_POINT');

      return this.stateMachine.transition('CURRENT_TEACHING_POINT', 'JUMP_TO_POINT', {
        pointId: newPoint.id,
        slideNumber: newPoint.slideNumber
      });
    }
    return false;
  }

  public jumpToBlock(blockId: string): boolean {
    const targetIndex = this.allTeachingPoints.findIndex(p => p.teachingBlockId === blockId);
    if (targetIndex !== -1) {
      this.currentPointIndex = targetIndex;
      this.pointElapsedSeconds = 0;
      this.questionTimerRemaining = 0;

      const newPoint = this.getCurrentTeachingPoint()!;
      this.logTeachingEvent('BLOCK_CHANGED', `JUMP_TO_BLOCK_${blockId}`);
      this.logTeachingEvent('TEACHING_POINT_STARTED', 'JUMP_BLOCK_FIRST_POINT');

      return this.stateMachine.transition('CURRENT_TEACHING_POINT', 'JUMP_TO_BLOCK', { blockId, pointId: newPoint.id });
    }
    return false;
  }

  public nextBlock(): boolean {
    const currentPoint = this.getCurrentTeachingPoint();
    if (!currentPoint) return false;

    const currentBlockIndex = this.pkg.teachingBlocks.findIndex(b => b.id === currentPoint.teachingBlockId);
    if (currentBlockIndex < this.pkg.teachingBlocks.length - 1) {
      const nextBlock = this.pkg.teachingBlocks[currentBlockIndex + 1];
      return this.jumpToBlock(nextBlock.id);
    } else {
      return this.stateMachine.transition('CONCLUDING', 'FINISH_ALL_BLOCKS');
    }
  }

  public previousBlock(): boolean {
    const currentPoint = this.getCurrentTeachingPoint();
    if (!currentPoint) return false;

    const currentBlockIndex = this.pkg.teachingBlocks.findIndex(b => b.id === currentPoint.teachingBlockId);
    if (currentBlockIndex > 0) {
      const prevBlock = this.pkg.teachingBlocks[currentBlockIndex - 1];
      return this.jumpToBlock(prevBlock.id);
    }
    return false;
  }

  public askCheckpointQuestion(): boolean {
    const curPoint = this.getCurrentTeachingPoint();
    const currentBlock = this.getCurrentTeachingBlock();
    if (!currentBlock || !currentBlock.question) return false;

    this.questionTimerRemaining = currentBlock.waitSeconds || 10;
    return this.stateMachine.transition('WAITING_FOR_POINT_RESPONSE', 'ASK_CHECKPOINT_QUESTION', {
      pointId: curPoint?.id,
      question: currentBlock.question,
      waitSeconds: currentBlock.waitSeconds
    });
  }

  public waitForResponse(): boolean {
    return this.stateMachine.transition('WAITING_FOR_POINT_RESPONSE', 'AWAITING_STUDENT_RESPONSE');
  }

  public handleStudentInteraction(studentQuestion: string): {
    category: QuestionCategory;
    response: string;
    returnTransition: string;
  } {
    const curPoint = this.getCurrentTeachingPoint();
    const currentBlock = this.getCurrentTeachingBlock() || this.pkg.teachingBlocks[0];
    const category = this.classifyQuestion(studentQuestion, currentBlock, curPoint);

    let response = '';
    let returnTransition = '';

    switch (category) {
      case 'ON_TOPIC':
      case 'CLARIFICATION':
        response = curPoint
          ? `Về luận điểm "${curPoint.title}": ${curPoint.explanation} Nền tảng học thuật của bài học khẳng định rõ điều này.`
          : `Về câu hỏi này trong phần "${currentBlock.topic}": ${currentBlock.lectureText.slice(0, 200)}... Nền tảng tài liệu khẳng định rõ điều này.`;
        returnTransition = curPoint
          ? `Bây giờ chúng ta quay trở lại luận điểm "${curPoint.title}" để tiếp tục làm rõ.`
          : `Bây giờ chúng ta quay trở lại nội dung tiếp theo của "${currentBlock.topic}".`;
        break;
      case 'APPLICATION':
        response = (curPoint && curPoint.application)
          ? `Vận dụng thực tiễn của luận điểm này: ${curPoint.application}`
          : currentBlock.application
          ? `Ứng dụng thực tế của vấn đề này: ${currentBlock.application}`
          : `Trong thực tiễn, nguyên lý này được vận hành trực tiếp như chúng ta thấy qua ví dụ: ${curPoint?.example || currentBlock.example || 'trong hoạt động thực tiễn'}.`;
        returnTransition = `Chúng ta tiếp tục với các luận điểm chính tiếp theo.`;
        break;
      case 'EXTENSION':
        response = `Đây là một hướng mở rộng thú vị. Tuy nhiên trong phạm vi bài học hôm nay, chúng ta ưu tiên nắm chắc nguyên lý cơ bản trước.`;
        returnTransition = `Giảng viên sẽ giải thích thêm vào cuối giờ hoặc giờ tự học. Bây giờ chúng ta trở lại bài.`;
        break;
      case 'OFF_TOPIC':
        response = `Câu hỏi này nằm ngoài phạm vi bài giảng về "${this.pkg.metadata.lectureTitle}".`;
        returnTransition = `Để đảm bảo thời lượng và mục tiêu bài học, chúng ta quay lại trọng tâm: ${curPoint ? curPoint.title : currentBlock.topic}.`;
        break;
      case 'UNSUPPORTED':
      default:
        response = `Nội dung này hiện chưa có cơ sở xác thực trong các tài liệu giáo trình được duyệt của học phần. Giảng viên sẽ không suy đoán ngoài tài liệu.`;
        returnTransition = `Chúng ta tiếp tục với luận điểm có trong tài liệu quy định.`;
        break;
    }

    const record: StudentInteractionRecord = {
      id: `INT-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      blockId: currentBlock.id,
      slideNumber: curPoint?.slideNumber || currentBlock.slideStart,
      studentQuestion,
      category,
      lecturerResponse: response,
      sourceReferences: curPoint ? [curPoint.provenance.sourceId] : currentBlock.sources.map(s => s.sourceId),
      returnTransition,
      timeSpentSeconds: 30
    };

    this.interactionHistory.push(record);
    this.stateMachine.transition('RESPONDING', 'ANSWER_STUDENT_QUERY', { 
      recordId: record.id,
      pointId: curPoint?.id 
    });

    return {
      category,
      response,
      returnTransition
    };
  }

  public returnToSequence(): boolean {
    const curPoint = this.getCurrentTeachingPoint();
    return this.stateMachine.transition('CURRENT_TEACHING_POINT', 'RETURN_TO_SEQUENCE', {
      pointId: curPoint?.id
    });
  }

  public pause(): boolean {
    const curPoint = this.getCurrentTeachingPoint();
    if (curPoint) {
      this.logTeachingEvent('TEACHING_POINT_INTERRUPTED', 'LECTURER_PAUSE');
    }
    return this.stateMachine.pause();
  }

  public resume(): boolean {
    return this.stateMachine.resume();
  }

  public tickSecond(): void {
    const state = this.stateMachine.getState();
    if (state !== 'PAUSED' && state !== 'IDLE' && state !== 'CONCLUDING' && state !== 'ERROR') {
      this.elapsedSeconds++;
      this.pointElapsedSeconds++;
      if (this.questionTimerRemaining > 0) {
        this.questionTimerRemaining--;
        if (this.questionTimerRemaining === 0) {
          this.waitForResponse();
        }
      }
    }
  }

  public getInteractionHistory(): StudentInteractionRecord[] {
    return [...this.interactionHistory];
  }

  private logTeachingEvent(type: TeachingEventType, reason?: string, metadata?: Record<string, unknown>): void {
    const curPoint = this.getCurrentTeachingPoint();
    if (!curPoint) return;
    this.eventsHistory.push({
      type,
      packageId: this.pkg.id,
      blockId: curPoint.teachingBlockId,
      slideNumber: curPoint.slideNumber,
      teachingPointId: curPoint.id,
      timestamp: new Date().toISOString(),
      reason,
      metadata
    });
  }

  private synthesizePointsFromPackage(pkg: LecturePackage): TeachingPoint[] {
    const synthesized: TeachingPoint[] = [];

    pkg.teachingBlocks.forEach(block => {
      const slideSpan = Math.max(1, block.slideEnd - block.slideStart + 1);
      const pointDuration = Math.round(block.durationSeconds / slideSpan);

      for (let sNum = block.slideStart; sNum <= block.slideEnd; sNum++) {
        const slide = pkg.slideMap.find(s => s.slideNumber === sNum);
        synthesized.push({
          id: `TP-${block.id}-S${sNum.toString().padStart(2, '0')}-01`,
          packageId: pkg.id,
          teachingBlockId: block.id,
          slideNumber: sNum,
          sequence: 1,
          title: slide?.title || block.topic,
          pointType: 'CONCEPT_DEFINITION',
          sourceText: slide?.sourceText || block.lectureText,
          explanation: block.lectureText,
          emphasis: block.keyPoints[0] || block.topic,
          example: block.example || undefined,
          application: block.application || undefined,
          transition: block.transition || '',
          durationSeconds: pointDuration,
          provenance: {
            sourceId: block.sources[0]?.sourceId || 'SRC-001',
            locator: { slideNumber: sNum }
          }
        });
      }
    });

    return synthesized;
  }

  private classifyQuestion(question: string, block: TeachingBlock, point?: TeachingPoint): QuestionCategory {
    const q = question.toLowerCase();
    const topic = block.topic.toLowerCase();
    const keyPoints = block.keyPoints.map(k => k.toLowerCase()).join(' ');
    const pointTitle = point ? point.title.toLowerCase() : '';

    if (q.includes('khác gì') || q.includes('là gì') || q.includes('tại sao') || q.includes('giải thích lại') || q.includes('rõ hơn')) {
      return 'CLARIFICATION';
    }
    if (q.includes('ứng dụng') || q.includes('thực tế') || q.includes('thực hành') || q.includes('ví dụ')) {
      return 'APPLICATION';
    }
    if (q.includes('sau này') || q.includes('tương lai') || q.includes('liệu có') || q.includes('nghiên cứu sâu')) {
      return 'EXTENSION';
    }
    if (q.includes('thời tiết') || q.includes('bóng đá') || q.includes('ăn trưa') || q.includes('điểm danh')) {
      return 'OFF_TOPIC';
    }

    const words = `${topic} ${pointTitle}`.split(/\s+/).filter(w => w.length > 3);
    const hasOverlap = words.some(w => q.includes(w)) || keyPoints.split(/\s+/).filter(w => w.length > 4).some(w => q.includes(w));

    if (hasOverlap) {
      return 'ON_TOPIC';
    }

    return 'RELATED';
  }
}
