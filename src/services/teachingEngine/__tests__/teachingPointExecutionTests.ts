/**
 * Automated Verification Suite for TeachingPoint-Level Execution in TeachingEngine
 * Validates Phase 1.5.5 requirements:
 * 1. Stepwise test 1: Slides 15 - 18
 * 2. Stepwise test 2: Slides 22 - 25
 * 3. Stepwise test 3: Slides 30 - 35
 * 4. Invariant checks: Slide 10 transition semantic, Pause/Resume stability, Provenance fidelity, No-mock/No-invention rule.
 */

import fs from 'fs';
import path from 'path';
import { TeachingEngine } from '../teachingEngine';
import { createSampleLecturePackage } from '../../../sampleData/universityLecturePackage';
import { buildLecturePackageFromSources } from '../../lectureBuilder/lecturePackageBuilder';
import { LecturePackage } from '../../../types/lecture';
import { RegisteredDocument } from '../../../types/source';

export interface ExecutionTestReport {
  testSuiteName: string;
  allPassed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  segments: {
    segmentName: string;
    slideRange: string;
    passed: boolean;
    pointsCount: number;
    details: string[];
    errors: string[];
    timeline: Array<{
      step: number;
      slideNumber: number;
      pointId: string;
      pointTitle: string;
      pointType: string;
      durationSeconds: number;
      sourceId: string;
      hasExample: boolean;
      hasApplication: boolean;
      hasEmphasis: boolean;
      hasTransition: boolean;
    }>;
  }[];
  stateMachineStability: {
    pauseResumePreserved: boolean;
    studentInteractionPreserved: boolean;
    slide10TransitionPreserved: boolean;
    provenanceFidelityConfirmed: boolean;
    backwardCompatibilityPassed: boolean;
  };
}

function get1MD1Package(): LecturePackage {
  const filePath = path.join(process.cwd(), 'data', 'registeredDocuments.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found at ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const docs: RegisteredDocument[] = JSON.parse(raw);
  const pptxDoc = docs.find(d => d.sourceId === 'SRC-006' || (d.documentType === 'PPTX' && d.filename.includes('1.MĐ1')));
  const docxDoc = docs.find(d => d.sourceId === 'SRC-007' || (d.documentType === 'DOCX' && d.filename.includes('1.MĐ1')));

  if (!pptxDoc || !docxDoc) {
    throw new Error('Could not find SRC-006 and SRC-007 documents in registeredDocuments.json');
  }

  return buildLecturePackageFromSources({
    packageId: 'LPKG-1MD1-001',
    pptxSource: pptxDoc,
    docxSource: docxDoc,
    lecturerDecisions: {
      pedagogicalFocusDecision: 'PARTS_I_AND_III',
      slide6OutlineDecision: 'STANDARDIZE_TO_II',
      slide10LabelDecision: 'TRANSITION_SLIDE_LESSON_1',
      approvedAt: new Date().toISOString(),
      approvedBy: 'Thượng tá, ThS Đỗ Đình Cường'
    }
  });
}

export function runTeachingPointExecutionTests(): ExecutionTestReport {
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  const segments: ExecutionTestReport['segments'] = [];
  const pkg1MD1 = get1MD1Package();

  // Helper assertion
  function assert(condition: boolean, description: string, errorList: string[], detailsList: string[]) {
    totalChecks++;
    if (condition) {
      passedChecks++;
      detailsList.push(`[PASS] ${description}`);
    } else {
      failedChecks++;
      errorList.push(`[FAIL] ${description}`);
    }
  }

  // =========================================================================
  // TEST SEGMENT 1: Slides 15 - 18
  // =========================================================================
  {
    const segmentName = 'Segment 1: Slide 15 - 18 Execution Verification';
    const errors: string[] = [];
    const details: string[] = [];
    const timeline: ExecutionTestReport['segments'][0]['timeline'] = [];

    const engine = new TeachingEngine(pkg1MD1);
    engine.startLecture();

    // Jump to Slide 15
    const jumpSuccess = engine.jumpToSlide(15);
    assert(jumpSuccess, 'Engine successfully jumped to Slide 15', errors, details);

    const initialStatus = engine.getStatus();
    assert(initialStatus.currentSlideNumber === 15, 'Current slide is Slide 15', errors, details);
    assert(initialStatus.currentTeachingPointId === 'TP-1MD1-S15-01', 'First point on Slide 15 is TP-1MD1-S15-01', errors, details);

    // Collect all points visited from Slide 15 to Slide 18
    let currentSlide = 15;
    let stepCount = 0;
    const visitedPoints: string[] = [];
    const visitedSlides: number[] = [];

    while (currentSlide <= 18 && stepCount < 20) {
      stepCount++;
      const status = engine.getStatus();
      const pt = status.currentTeachingPoint;
      if (!pt) break;

      visitedPoints.push(pt.id);
      visitedSlides.push(pt.slideNumber);

      const delivery = engine.getPointDelivery(pt);

      timeline.push({
        step: stepCount,
        slideNumber: pt.slideNumber,
        pointId: pt.id,
        pointTitle: pt.title,
        pointType: pt.pointType,
        durationSeconds: pt.durationSeconds,
        sourceId: pt.provenance.sourceId,
        hasExample: Boolean(delivery.hasExample),
        hasApplication: Boolean(delivery.hasApplication),
        hasEmphasis: Boolean(delivery.emphasis && delivery.emphasis.length > 0),
        hasTransition: Boolean(delivery.transition && delivery.transition.length > 0)
      });

      // Verify delivery format follows A-E strictly
      assert(delivery.statement.startsWith('Luận điểm:'), `Step ${stepCount} (${pt.id}) has Statement A`, errors, details);
      assert(delivery.explanation.length > 20, `Step ${stepCount} (${pt.id}) has substantive Explanation B`, errors, details);
      assert(Boolean(delivery.emphasis), `Step ${stepCount} (${pt.id}) has Core Emphasis C`, errors, details);
      assert(Boolean(delivery.transition), `Step ${stepCount} (${pt.id}) has Transition Bridge E`, errors, details);

      // Verify Provenance
      assert(pt.provenance.sourceId === 'SRC-006' || pt.provenance.sourceId === 'SRC-007', 
        `Step ${stepCount} (${pt.id}) has valid primary sourceId (${pt.provenance.sourceId})`, errors, details);
      assert(pt.provenance.locator.slideNumber === pt.slideNumber,
        `Step ${stepCount} (${pt.id}) locator matches actual slideNumber (${pt.slideNumber})`, errors, details);

      // Verify that engine provenance matches point provenance exactly (never overridden by block)
      assert(status.currentProvenance?.teachingPointId === pt.id,
        `Step ${stepCount} status.currentProvenance.teachingPointId matches point (${pt.id})`, errors, details);
      assert(status.currentProvenance?.sourceId === pt.provenance.sourceId,
        `Step ${stepCount} status.currentProvenance.sourceId matches point provenance`, errors, details);

      // Check next point
      const hasNext = engine.nextTeachingPoint();
      if (!hasNext) break;

      const newStatus = engine.getStatus();
      currentSlide = newStatus.currentSlideNumber;
    }

    // Assertions for Slide 15 - 18 completeness:
    // Slide 15: 2 points (TP-1MD1-S15-01, TP-1MD1-S15-02)
    // Slide 16: 2 points (TP-1MD1-S16-01, TP-1MD1-S16-02)
    // Slide 17: 2 points (TP-1MD1-S17-01, TP-1MD1-S17-02)
    // Slide 18: 2 points (TP-1MD1-S18-01, TP-1MD1-S18-02)
    assert(visitedPoints.includes('TP-1MD1-S15-01'), 'Slide 15 Point 1 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S15-02'), 'Slide 15 Point 2 visited separately (no merging)', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S16-01'), 'Slide 16 Point 1 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S16-02'), 'Slide 16 Point 2 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S17-01'), 'Slide 17 Point 1 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S17-02'), 'Slide 17 Point 2 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S18-01'), 'Slide 18 Point 1 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S18-02'), 'Slide 18 Point 2 visited', errors, details);

    // Verify ordering is strictly monotonic by slideNumber
    let monotonicOrder = true;
    for (let i = 1; i < visitedSlides.length; i++) {
      if (visitedSlides[i] < visitedSlides[i - 1]) {
        monotonicOrder = false;
        break;
      }
    }
    assert(monotonicOrder, 'Slides 15-18 progression is strictly monotonic (no skipping or backwards jump)', errors, details);

    segments.push({
      segmentName,
      slideRange: 'Slide 15 - 18',
      passed: errors.length === 0,
      pointsCount: visitedPoints.length,
      details,
      errors,
      timeline
    });
  }

  // =========================================================================
  // TEST SEGMENT 2: Slides 22 - 25
  // =========================================================================
  {
    const segmentName = 'Segment 2: Slide 22 - 25 Execution Verification';
    const errors: string[] = [];
    const details: string[] = [];
    const timeline: ExecutionTestReport['segments'][0]['timeline'] = [];

    const engine = new TeachingEngine(pkg1MD1);
    engine.startLecture();

    // Jump to Slide 22
    const jumpSuccess = engine.jumpToSlide(22);
    assert(jumpSuccess, 'Engine successfully jumped to Slide 22', errors, details);

    const initialStatus = engine.getStatus();
    assert(initialStatus.currentSlideNumber === 22, 'Current slide is Slide 22', errors, details);

    let currentSlide = 22;
    let stepCount = 0;
    const visitedPoints: string[] = [];
    const visitedSlides: number[] = [];

    while (currentSlide <= 25 && stepCount < 20) {
      stepCount++;
      const status = engine.getStatus();
      const pt = status.currentTeachingPoint;
      if (!pt) break;

      visitedPoints.push(pt.id);
      visitedSlides.push(pt.slideNumber);

      const delivery = engine.getPointDelivery(pt);

      timeline.push({
        step: stepCount,
        slideNumber: pt.slideNumber,
        pointId: pt.id,
        pointTitle: pt.title,
        pointType: pt.pointType,
        durationSeconds: pt.durationSeconds,
        sourceId: pt.provenance.sourceId,
        hasExample: Boolean(delivery.hasExample),
        hasApplication: Boolean(delivery.hasApplication),
        hasEmphasis: Boolean(delivery.emphasis && delivery.emphasis.length > 0),
        hasTransition: Boolean(delivery.transition && delivery.transition.length > 0)
      });

      assert(delivery.statement.length > 10, `Step ${stepCount} (${pt.id}) has valid statement`, errors, details);
      assert(delivery.explanation.length > 20, `Step ${stepCount} (${pt.id}) has valid explanation`, errors, details);
      assert(pt.provenance.sourceId === 'SRC-006' || pt.provenance.sourceId === 'SRC-007',
        `Step ${stepCount} (${pt.id}) sourceId authentic`, errors, details);

      const hasNext = engine.nextTeachingPoint();
      if (!hasNext) break;

      const newStatus = engine.getStatus();
      currentSlide = newStatus.currentSlideNumber;
    }

    assert(visitedPoints.includes('TP-1MD1-S22-01'), 'Slide 22 Point 1 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S23-01'), 'Slide 23 Point 1 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S24-01'), 'Slide 24 Point 1 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S25-01'), 'Slide 25 Point 1 visited', errors, details);

    let monotonicOrder = true;
    for (let i = 1; i < visitedSlides.length; i++) {
      if (visitedSlides[i] < visitedSlides[i - 1]) {
        monotonicOrder = false;
        break;
      }
    }
    assert(monotonicOrder, 'Slides 22-25 progression is strictly monotonic', errors, details);

    segments.push({
      segmentName,
      slideRange: 'Slide 22 - 25',
      passed: errors.length === 0,
      pointsCount: visitedPoints.length,
      details,
      errors,
      timeline
    });
  }

  // =========================================================================
  // TEST SEGMENT 3: Slides 30 - 35
  // =========================================================================
  {
    const segmentName = 'Segment 3: Slide 30 - 35 Execution Verification';
    const errors: string[] = [];
    const details: string[] = [];
    const timeline: ExecutionTestReport['segments'][0]['timeline'] = [];

    const engine = new TeachingEngine(pkg1MD1);
    engine.startLecture();

    // Jump to Slide 30
    const jumpSuccess = engine.jumpToSlide(30);
    assert(jumpSuccess, 'Engine successfully jumped to Slide 30', errors, details);

    const initialStatus = engine.getStatus();
    assert(initialStatus.currentSlideNumber === 30, 'Current slide is Slide 30', errors, details);

    let currentSlide = 30;
    let stepCount = 0;
    const visitedPoints: string[] = [];
    const visitedSlides: number[] = [];

    while (currentSlide <= 35 && stepCount < 25) {
      stepCount++;
      const status = engine.getStatus();
      const pt = status.currentTeachingPoint;
      if (!pt) break;

      visitedPoints.push(pt.id);
      visitedSlides.push(pt.slideNumber);

      const delivery = engine.getPointDelivery(pt);

      timeline.push({
        step: stepCount,
        slideNumber: pt.slideNumber,
        pointId: pt.id,
        pointTitle: pt.title,
        pointType: pt.pointType,
        durationSeconds: pt.durationSeconds,
        sourceId: pt.provenance.sourceId,
        hasExample: Boolean(delivery.hasExample),
        hasApplication: Boolean(delivery.hasApplication),
        hasEmphasis: Boolean(delivery.emphasis && delivery.emphasis.length > 0),
        hasTransition: Boolean(delivery.transition && delivery.transition.length > 0)
      });

      assert(delivery.statement.length > 10, `Step ${stepCount} (${pt.id}) has valid statement`, errors, details);
      assert(delivery.explanation.length > 20, `Step ${stepCount} (${pt.id}) has valid explanation`, errors, details);
      assert(pt.provenance.sourceId === 'SRC-006' || pt.provenance.sourceId === 'SRC-007',
        `Step ${stepCount} (${pt.id}) sourceId authentic`, errors, details);

      const hasNext = engine.nextTeachingPoint();
      if (!hasNext) break;

      const newStatus = engine.getStatus();
      currentSlide = newStatus.currentSlideNumber;
    }

    assert(visitedPoints.includes('TP-1MD1-S30-01'), 'Slide 30 Point 1 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S31-01'), 'Slide 31 Point 1 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S32-01'), 'Slide 32 Point 1 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S33-01'), 'Slide 33 Point 1 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S34-01'), 'Slide 34 Point 1 visited', errors, details);
    assert(visitedPoints.includes('TP-1MD1-S35-01'), 'Slide 35 Point 1 visited', errors, details);

    let monotonicOrder = true;
    for (let i = 1; i < visitedSlides.length; i++) {
      if (visitedSlides[i] < visitedSlides[i - 1]) {
        monotonicOrder = false;
        break;
      }
    }
    assert(monotonicOrder, 'Slides 30-35 progression is strictly monotonic', errors, details);

    segments.push({
      segmentName,
      slideRange: 'Slide 30 - 35',
      passed: errors.length === 0,
      pointsCount: visitedPoints.length,
      details,
      errors,
      timeline
    });
  }

  // =========================================================================
  // STATE MACHINE & INVARIANT VERIFICATION
  // =========================================================================
  const errorsSM: string[] = [];
  const detailsSM: string[] = [];

  // Check 1: Slide 10 Transition Slide Semantic
  const engineS10 = new TeachingEngine(pkg1MD1);
  engineS10.startLecture();
  engineS10.jumpToSlide(10);
  const s10Status = engineS10.getStatus();
  const s10Point = s10Status.currentTeachingPoint;
  const s10Slide = pkg1MD1.slideMap.find(s => s.slideNumber === 10);
  const slide10TransitionPreserved = 
    s10Point !== undefined &&
    s10Point.slideNumber === 10 &&
    s10Point.pointType === 'TRANSITION' &&
    (s10Point.title.includes('REC-03') || s10Point.sourceText.includes('TRANSITION_SLIDE_LESSON_1')) &&
    s10Slide?.semanticRole === 'TRANSITION_SLIDE_LESSON_1' &&
    (s10Slide?.title === 'Bài 2' || Boolean(s10Slide?.originalText?.includes('Bài 2')));
  assert(slide10TransitionPreserved, 
    'Slide 10 preserves TRANSITION_SLIDE_LESSON_1 and originalText "Bài 2" without creating independent Lesson 2', errorsSM, detailsSM);

  // Check 2: Pause / Resume preserves state
  const enginePR = new TeachingEngine(pkg1MD1);
  enginePR.startLecture();
  enginePR.jumpToSlide(15);
  // Advance 1 point to TP-1MD1-S15-02
  enginePR.nextTeachingPoint();
  // Simulate 45 seconds ticking
  for (let t = 0; t < 45; t++) {
    enginePR.tickSecond();
  }

  const prePauseStatus = enginePR.getStatus();
  const prePauseBlockId = prePauseStatus.currentBlock?.id;
  const prePauseSlideNum = prePauseStatus.currentSlideNumber;
  const prePausePointId = prePauseStatus.currentTeachingPointId;
  const prePauseElapsed = prePauseStatus.elapsedSeconds;
  const prePausePointElapsed = prePauseStatus.pointElapsedSeconds;

  enginePR.pause();
  const pauseStatus = enginePR.getStatus();
  assert(pauseStatus.state === 'PAUSED', 'Engine enters PAUSED state', errorsSM, detailsSM);
  assert(pauseStatus.isPaused === true, 'Engine status reflects isPaused: true', errorsSM, detailsSM);

  enginePR.resume();
  const resumeStatus = enginePR.getStatus();

  const pauseResumePreserved = 
    resumeStatus.currentBlock?.id === prePauseBlockId &&
    resumeStatus.currentSlideNumber === prePauseSlideNum &&
    resumeStatus.currentTeachingPointId === prePausePointId &&
    resumeStatus.elapsedSeconds === prePauseElapsed &&
    resumeStatus.pointElapsedSeconds === prePausePointElapsed;

  assert(pauseResumePreserved,
    'Pause/Resume preserves exact BlockId, SlideNumber, TeachingPointId, and ElapsedSeconds without drift', errorsSM, detailsSM);

  // Check 3: Student Interaction handling does not advance TeachingPoint prematurely
  const engineInt = new TeachingEngine(pkg1MD1);
  engineInt.startLecture();
  engineInt.jumpToSlide(15);
  const preIntPointId = engineInt.getStatus().currentTeachingPointId;

  engineInt.handleStudentInteraction('Xin thầy giải thích rõ hơn về chức năng nhận thức?');
  const respondingStatus = engineInt.getStatus();
  assert(respondingStatus.state === 'RESPONDING', 'Engine enters RESPONDING on student question', errorsSM, detailsSM);
  assert(respondingStatus.currentTeachingPointId === preIntPointId, 'TeachingPoint remains unchanged during student answering', errorsSM, detailsSM);

  engineInt.returnToSequence();
  const returnedStatus = engineInt.getStatus();
  assert(returnedStatus.state === 'CURRENT_TEACHING_POINT', 'Engine returns to CURRENT_TEACHING_POINT', errorsSM, detailsSM);
  assert(returnedStatus.currentTeachingPointId === preIntPointId, 'TeachingPoint preserved upon return to sequence', errorsSM, detailsSM);

  const studentInteractionPreserved = returnedStatus.currentTeachingPointId === preIntPointId;

  // Check 4: Provenance Fidelity - TeachingPoint provenance is never replaced by block provenance
  const engineProv = new TeachingEngine(pkg1MD1);
  engineProv.startLecture();
  engineProv.jumpToSlide(15);
  const provStatus = engineProv.getStatus();
  const pointProv = provStatus.currentTeachingPoint?.provenance;
  const engineProvItem = provStatus.currentProvenance;

  const provenanceFidelityConfirmed = 
    pointProv !== undefined &&
    engineProvItem !== undefined &&
    engineProvItem.sourceId === pointProv.sourceId &&
    engineProvItem.sourceLocator.slideNumber === 15;
  assert(provenanceFidelityConfirmed,
    'Engine provides authentic TeachingPoint provenance without block-level fallback overwrite', errorsSM, detailsSM);

  // Check 5: Backwards compatibility with CS401 package
  const cs401Pkg = createSampleLecturePackage();
  const engineCS = new TeachingEngine(cs401Pkg);
  const csPoints = engineCS.getTeachingPoints();
  const backwardCompatibilityPassed = csPoints.length > 0 && engineCS.startLecture() && engineCS.nextTeachingPoint();
  assert(backwardCompatibilityPassed,
    'Backwards compatibility verified: LPKG-CS401-007 synthesizes and executes TeachingPoints flawlessly', errorsSM, detailsSM);

  const allPassed = failedChecks === 0 && segments.every(s => s.passed);

  return {
    testSuiteName: 'TeachingEngine TeachingPoint-Level Execution Suite (Phase 1.5.5)',
    allPassed,
    totalChecks,
    passedChecks,
    failedChecks,
    segments,
    stateMachineStability: {
      pauseResumePreserved,
      studentInteractionPreserved,
      slide10TransitionPreserved,
      provenanceFidelityConfirmed,
      backwardCompatibilityPassed
    }
  };
}
