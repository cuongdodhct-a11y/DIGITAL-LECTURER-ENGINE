/**
 * Phase 1.5.7 — Continuous Lecture Playback Engine
 * Coordinates continuous lecture execution from the current position:
 * TeachingBlock -> TeachingPoint -> Spoken LectureScript -> TTS -> Play -> Next TeachingPoint -> Next Slide -> Next Block -> Lecture Completed
 */

import {
  ContinuousPlaybackState,
  ContinuousPlaybackStatus,
  ContinuousLectureEvent,
  ContinuousLectureEventType,
  TTSQueueItem,
  AudioPlaybackController
} from '../../types/continuousPlayback';
import { TeachingEngine } from '../teachingEngine/teachingEngine';
import { TeachingPoint } from '../../types/teachingPoint';
import { TeachingPointLectureScript, findLectureScriptByPointId } from '../teachingScript/teachingPointLectureScript';
import { TTSQueueManager } from './ttsQueueManager';
import { BrowserAudioController } from './audioPlaybackController';
import { VoiceProfile, TTSModelName, VoiceStatus, FallbackPolicy, LectureVoiceSession, AudioSourceType } from '../../types/audio';
import { OFFICIAL_LECTURER_VOICE_PROFILE, OFFICIAL_TTS_MODEL } from '../ttsGateway/voiceProfiles';

export interface ContinuousLectureEngineOptions {
  teachingEngine: TeachingEngine;
  audioController?: AudioPlaybackController;
  ttsQueueManager?: TTSQueueManager;
  voiceProfile?: VoiceProfile;
  ttsModel?: TTSModelName;
  fallbackPolicy?: FallbackPolicy;
  onStatusChange?: (status: ContinuousPlaybackStatus) => void;
  onEvent?: (event: ContinuousLectureEvent) => void;
}

export class ContinuousLectureEngine {
  private teachingEngine: TeachingEngine;
  private audioController: AudioPlaybackController;
  private ttsQueue: TTSQueueManager;
  private state: ContinuousPlaybackState = 'IDLE';

  private voiceProfile: VoiceProfile;
  private ttsModel: TTSModelName;
  private fallbackPolicy: FallbackPolicy;
  private lectureVoiceSession?: LectureVoiceSession;

  private eventLog: ContinuousLectureEvent[] = [];
  private onStatusChangeCallback?: (status: ContinuousPlaybackStatus) => void;
  private onEventCallback?: (event: ContinuousLectureEvent) => void;

  private currentAudioRequestId?: string;
  private errorMessage?: string;
  private isProcessingTransition: boolean = false;

  constructor(options: ContinuousLectureEngineOptions) {
    this.teachingEngine = options.teachingEngine;
    this.voiceProfile = options.voiceProfile || OFFICIAL_LECTURER_VOICE_PROFILE;
    this.ttsModel = options.ttsModel || OFFICIAL_TTS_MODEL;
    this.fallbackPolicy = options.fallbackPolicy || 'DENY';

    this.audioController = options.audioController || new BrowserAudioController(this.voiceProfile);
    this.ttsQueue = options.ttsQueueManager || new TTSQueueManager(undefined, this.voiceProfile, this.ttsModel);
    this.ttsQueue.setFallbackPolicy(this.fallbackPolicy);
    this.ttsQueue.setPackageId(this.teachingEngine.getPackage()?.id || 'LPKG-1MD1-001');

    this.onStatusChangeCallback = options.onStatusChange;
    this.onEventCallback = options.onEvent;

    this.setupAudioListeners();
  }

  private setupAudioListeners(): void {
    this.audioController.setOnPlay(() => {
      const curPoint = this.teachingEngine.getCurrentTeachingPoint();
      if (curPoint && this.state === 'PLAYING') {
        this.logEvent('AUDIO_PLAY_STARTED', {
          teachingPointId: curPoint.id,
          slideNumber: curPoint.slideNumber,
          blockId: curPoint.teachingBlockId
        });
        this.notifyStatusChange();
      }
    });

    this.audioController.setOnPause(() => {
      this.notifyStatusChange();
    });

    this.audioController.setOnEnded(() => {
      this.handleCurrentAudioEnded();
    });

    this.audioController.setOnError((err) => {
      console.error('[ContinuousLectureEngine] Audio Controller error:', err);
      this.handlePlaybackError(err);
    });
  }

  public getStatus(): ContinuousPlaybackStatus {
    const curPoint = this.teachingEngine.getCurrentTeachingPoint();
    const curPointIndex = this.teachingEngine.getCurrentPointIndex();
    const totalPoints = this.teachingEngine.getAllTeachingPoints().length;
    const currentQueueItem = curPoint ? this.ttsQueue.getItem(curPoint.id) : undefined;
    const spokenText = currentQueueItem?.text || (curPoint ? this.resolveSpokenDelivery(curPoint).fullLectureScript : undefined);

    const isLocalVieNeu = this.voiceProfile.id === 'voice_pham_tuyen';
    let audioSourceType: AudioSourceType = isLocalVieNeu ? 'LOCAL_VIENEUV3' : 'GEMINI_TTS';
    let voiceStatus: VoiceStatus = isLocalVieNeu ? 'LOCAL' : 'OFFICIAL';

    if (currentQueueItem?.audioSource) {
      audioSourceType = currentQueueItem.audioSource;
      voiceStatus = currentQueueItem.voiceStatus || (audioSourceType === 'GEMINI_TTS' ? 'OFFICIAL' : 'FALLBACK');
    } else if (this.fallbackPolicy === 'ALLOW_BROWSER_TTS' && this.state !== 'IDLE') {
      audioSourceType = 'BROWSER_TTS';
      voiceStatus = 'FALLBACK';
    }

    return {
      state: this.state,
      currentTeachingBlockId: curPoint?.teachingBlockId,
      currentSlideNumber: curPoint?.slideNumber || 1,
      currentTeachingPointId: curPoint?.id,
      currentPointTitle: curPoint?.title,
      currentPointIndex: curPointIndex,
      totalPoints,
      currentScriptId: currentQueueItem?.scriptId || (curPoint ? `SCRIPT-${curPoint.id}` : undefined),
      spokenText,
      ttsModel: currentQueueItem?.modelUsed || this.lectureVoiceSession?.ttsModel || this.ttsModel,
      voiceProfileId: this.lectureVoiceSession?.voiceProfileId || this.voiceProfile.id,
      voiceName: this.lectureVoiceSession?.voiceName || this.voiceProfile.name,
      voiceStatus,
      audioSourceType,
      fallbackPolicy: this.fallbackPolicy,
      lectureVoiceSession: this.lectureVoiceSession,
      audioMimeType: currentQueueItem?.mimeType || 'audio/wav',
      currentAudioRequestId: this.currentAudioRequestId,
      audioCurrentTime: this.audioController.getCurrentTime(),
      audioDuration: this.audioController.getDuration() || currentQueueItem?.durationEstimateSeconds || 0,
      activeAudioCount: this.audioController.getActiveAudioCount ? this.audioController.getActiveAudioCount() : (this.state === 'PLAYING' ? 1 : 0),
      queue: this.ttsQueue.getQueueItems(),
      errorMessage: this.errorMessage
    };
  }

  public getEventHistory(): ContinuousLectureEvent[] {
    return [...this.eventLog];
  }

  public onEvent(callback: (event: ContinuousLectureEvent) => void): void {
    this.onEventCallback = callback;
  }

  public onStatusChange(callback: (status: ContinuousPlaybackStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  public setFallbackPolicy(policy: FallbackPolicy): void {
    this.fallbackPolicy = policy;
    if (this.lectureVoiceSession) {
      this.lectureVoiceSession.fallbackPolicy = policy;
    }
    this.ttsQueue.setFallbackPolicy(policy);
  }

  public getFallbackPolicy(): FallbackPolicy {
    return this.fallbackPolicy;
  }

  public getVoiceSession(): LectureVoiceSession | undefined {
    return this.lectureVoiceSession;
  }

  public async allowBrowserFallbackAndResume(): Promise<void> {
    this.setFallbackPolicy('ALLOW_BROWSER_TTS');
    await this.retryCurrentTeachingPoint();
  }

  private logEvent(type: ContinuousLectureEventType, context?: {
    teachingPointId?: string;
    slideNumber?: number;
    blockId?: string;
    message?: string;
    details?: Record<string, unknown>;
  }): void {
    const curPoint = this.teachingEngine.getCurrentTeachingPoint();
    const event: ContinuousLectureEvent = {
      type,
      timestamp: new Date().toISOString(),
      teachingPointId: context?.teachingPointId || curPoint?.id || 'UNKNOWN',
      slideNumber: context?.slideNumber || curPoint?.slideNumber || 1,
      teachingBlockId: context?.blockId || curPoint?.teachingBlockId || 'UNKNOWN',
      message: context?.message,
      details: context?.details
    };

    this.eventLog.push(event);
    this.onEventCallback?.(event);
  }

  private notifyStatusChange(): void {
    this.onStatusChangeCallback?.(this.getStatus());
  }

  /**
   * Main Action: "PHÁT BÀI GIẢNG"
   * Starts or resumes continuous playback from current position.
   * Initializes pinned LectureVoiceSession for official voice continuity.
   */
  public async play(): Promise<void> {
    if (this.state === 'PLAYING') {
      return;
    }

    if (this.state === 'PAUSED') {
      return this.resume();
    }

    // Initialize pinned LectureVoiceSession if not yet established
    if (!this.lectureVoiceSession) {
      const pkgId = this.teachingEngine.getPackage()?.id || 'LPKG-1MD1-001';
      this.lectureVoiceSession = {
        sessionId: `lvs_${pkgId}_${Date.now()}`,
        packageId: pkgId,
        voiceProfileId: this.voiceProfile.id,
        voiceName: this.voiceProfile.name,
        ttsModel: this.ttsModel,
        language: this.voiceProfile.language[0] || 'vi-VN',
        speakingStyle: this.voiceProfile.style,
        fallbackPolicy: this.fallbackPolicy,
        createdAt: Date.now()
      };
    }

    // Guarantee queue manager is synchronized with the fixed official voice session
    this.ttsQueue.setVoiceProfile(this.voiceProfile);
    this.ttsQueue.setModel(this.lectureVoiceSession.ttsModel);
    this.ttsQueue.setFallbackPolicy(this.fallbackPolicy);
    this.ttsQueue.setPackageId(this.lectureVoiceSession.packageId);

    let curPoint = this.teachingEngine.getCurrentTeachingPoint();
    if (!curPoint) {
      this.teachingEngine.startLecture();
      curPoint = this.teachingEngine.getCurrentTeachingPoint();
    }

    if (!curPoint) {
      this.state = 'ERROR';
      this.errorMessage = 'Không tìm thấy TeachingPoint hợp lệ để phát bài giảng';
      this.notifyStatusChange();
      return;
    }

    this.state = 'PLAYING';
    this.errorMessage = undefined;

    this.logEvent('LECTURE_STARTED', {
      teachingPointId: curPoint.id,
      slideNumber: curPoint.slideNumber,
      blockId: curPoint.teachingBlockId,
      details: {
        voiceSessionId: this.lectureVoiceSession.sessionId,
        voiceProfileId: this.lectureVoiceSession.voiceProfileId,
        ttsModel: this.lectureVoiceSession.ttsModel
      }
    });

    await this.playTeachingPoint(curPoint);
  }

  /**
   * Internal routine to execute an individual TeachingPoint in the continuous sequence.
   */
  private async playTeachingPoint(point: TeachingPoint): Promise<void> {
    if (this.state !== 'PLAYING') {
      return;
    }

    this.logEvent('TEACHING_POINT_STARTED', {
      teachingPointId: point.id,
      slideNumber: point.slideNumber,
      blockId: point.teachingBlockId
    });

    // 1. Resolve canonical spoken delivery text
    const lectureScript = this.resolveSpokenDelivery(point);
    const spokenText = lectureScript.fullLectureScript;

    // 2. Enqueue into TTS Queue
    const queueItem = this.ttsQueue.enqueue({
      teachingPointId: point.id,
      slideNumber: point.slideNumber,
      teachingBlockId: point.teachingBlockId,
      scriptId: `SCRIPT-${point.id}`,
      packageId: this.lectureVoiceSession?.packageId,
      text: spokenText
    });

    this.currentAudioRequestId = queueItem.requestId;
    this.notifyStatusChange();

    this.logEvent('AUDIO_SYNTHESIS_STARTED', {
      teachingPointId: point.id,
      slideNumber: point.slideNumber,
      blockId: point.teachingBlockId,
      details: { requestId: queueItem.requestId }
    });

    // 3. Synthesize / get audio with retry
    let preparedItem: TTSQueueItem;
    try {
      preparedItem = await this.ttsQueue.prepareAudio(point.id);
    } catch (err: any) {
      console.error(`[ContinuousLectureEngine] Failed to prepare audio for ${point.id}:`, err);

      // Phase 1.5.8A: Strict Voice Protection
      // If official Gemini TTS fails/quota exhausted and fallbackPolicy is DENY:
      // Must NOT silently switch voice or skip TeachingPoint.
      if (this.fallbackPolicy === 'DENY') {
        this.state = 'VOICE_UNAVAILABLE';
        this.errorMessage = this.voiceProfile.id === 'voice_pham_tuyen'
          ? 'VieNeu v3 Turbo không khả dụng. Kiểm tra VIENEU_TTS_URL và runtime cục bộ.'
          : 'Giọng giảng chuẩn hiện không khả dụng.';
        this.audioController.stop();

        this.logEvent('LECTURE_ERROR', {
          teachingPointId: point.id,
          slideNumber: point.slideNumber,
          blockId: point.teachingBlockId,
          message: this.errorMessage
        });

        this.notifyStatusChange();
        return;
      }

      this.handlePlaybackError(err);
      return;
    }

    if (this.state !== 'PLAYING') {
      return; // was stopped or paused while synthesizing
    }

    this.logEvent('AUDIO_READY', {
      teachingPointId: point.id,
      slideNumber: point.slideNumber,
      blockId: point.teachingBlockId,
      details: {
        cached: Boolean(preparedItem.audioBase64),
        audioSource: preparedItem.audioSource,
        voiceStatus: preparedItem.voiceStatus
      }
    });

    // 4. Prefetch next TeachingPoint audio to minimize gap
    this.prefetchNextPointAudio();

    // 5. Load audio into AudioController & Play
    this.ttsQueue.markPlaying(point.id);

    try {
      await this.audioController.loadAudio({
        audioBase64: preparedItem.audioBase64,
        audioUrl: preparedItem.audioUrl,
        audioSource: preparedItem.audioSource,
        mimeType: preparedItem.mimeType,
        text: preparedItem.text,
        durationEstimateSeconds: preparedItem.durationEstimateSeconds
      });

      await this.audioController.play();
    } catch (playErr: any) {
      console.error(`[ContinuousLectureEngine] Audio play failed for ${point.id}:`, playErr);
      this.handlePlaybackError(playErr);
    }
  }

  /**
   * Lookahead helper: Prefetches the subsequent TeachingPoint's audio
   * using the exact same official voice session parameters.
   */
  private prefetchNextPointAudio(): void {
    const allPoints = this.teachingEngine.getAllTeachingPoints();
    const currentIndex = this.teachingEngine.getCurrentPointIndex();

    if (currentIndex < allPoints.length - 1) {
      const nextPoint = allPoints[currentIndex + 1];
      const nextScript = this.resolveSpokenDelivery(nextPoint);
      this.ttsQueue.prefetch({
        teachingPointId: nextPoint.id,
        slideNumber: nextPoint.slideNumber,
        teachingBlockId: nextPoint.teachingBlockId,
        scriptId: `SCRIPT-${nextPoint.id}`,
        packageId: this.lectureVoiceSession?.packageId,
        text: nextScript.fullLectureScript
      });
    }
  }

  /**
   * Audio ended handler: Automatically transitions to the next TeachingPoint.
   */
  private async handleCurrentAudioEnded(): Promise<void> {
    if (this.state !== 'PLAYING' || this.isProcessingTransition) {
      return;
    }

    this.isProcessingTransition = true;
    const completedPoint = this.teachingEngine.getCurrentTeachingPoint();

    if (completedPoint) {
      this.ttsQueue.markCompleted(completedPoint.id);

      this.logEvent('AUDIO_PLAY_ENDED', {
        teachingPointId: completedPoint.id,
        slideNumber: completedPoint.slideNumber,
        blockId: completedPoint.teachingBlockId
      });

      this.logEvent('TEACHING_POINT_COMPLETED', {
        teachingPointId: completedPoint.id,
        slideNumber: completedPoint.slideNumber,
        blockId: completedPoint.teachingBlockId
      });
    }

    // Determine if more TeachingPoints remain
    const currentIndex = this.teachingEngine.getCurrentPointIndex();
    const allPoints = this.teachingEngine.getAllTeachingPoints();

    if (currentIndex < allPoints.length - 1) {
      const prevSlide = completedPoint?.slideNumber;
      const prevBlock = completedPoint?.teachingBlockId;

      // Advance TeachingEngine
      this.teachingEngine.nextTeachingPoint();
      const nextPoint = this.teachingEngine.getCurrentTeachingPoint();

      if (nextPoint) {
        if (prevSlide !== nextPoint.slideNumber) {
          this.logEvent('SLIDE_CHANGED', {
            teachingPointId: nextPoint.id,
            slideNumber: nextPoint.slideNumber,
            blockId: nextPoint.teachingBlockId,
            message: `Chuyển trực quan sang Slide ${nextPoint.slideNumber}`
          });
        }

        if (prevBlock !== nextPoint.teachingBlockId) {
          this.logEvent('TEACHING_BLOCK_CHANGED', {
            teachingPointId: nextPoint.id,
            slideNumber: nextPoint.slideNumber,
            blockId: nextPoint.teachingBlockId,
            message: `Chuyển sang Khối ${nextPoint.teachingBlockId}`
          });
        }

        this.notifyStatusChange();

        // Immediately trigger next audio playback
        this.isProcessingTransition = false;
        await this.playTeachingPoint(nextPoint);
      }
    } else {
      // Completed all points!
      this.state = 'COMPLETED';
      this.isProcessingTransition = false;
      const pkg = this.teachingEngine.getPackage();
      this.logEvent('LECTURE_COMPLETED', {
        teachingPointId: completedPoint?.id,
        slideNumber: completedPoint?.slideNumber,
        blockId: completedPoint?.teachingBlockId,
        message: 'Đã hoàn thành toàn bộ bài giảng liên tục.',
        details: {
          packageId: pkg.id,
          totalSlides: pkg.slideMap?.length || 52,
          totalTeachingPoints: allPoints.length,
          duration: allPoints.reduce((sum, p) => sum + (p.durationSeconds || 0), 0)
        }
      });
      this.notifyStatusChange();
    }
  }

  /**
   * Pause Action
   */
  public pause(): void {
    if (this.state !== 'PLAYING') return;

    this.state = 'PAUSED';
    this.audioController.pause();
    this.teachingEngine.pause();

    const curPoint = this.teachingEngine.getCurrentTeachingPoint();
    this.logEvent('LECTURE_PAUSED', {
      teachingPointId: curPoint?.id,
      slideNumber: curPoint?.slideNumber,
      blockId: curPoint?.teachingBlockId
    });

    this.notifyStatusChange();
  }

  /**
   * Resume Action
   */
  public async resume(): Promise<void> {
    if (this.state !== 'PAUSED') return;

    this.state = 'PLAYING';
    this.teachingEngine.resume();

    const curPoint = this.teachingEngine.getCurrentTeachingPoint();
    this.logEvent('LECTURE_RESUMED', {
      teachingPointId: curPoint?.id,
      slideNumber: curPoint?.slideNumber,
      blockId: curPoint?.teachingBlockId
    });

    this.notifyStatusChange();

    try {
      await this.audioController.resume();
    } catch {
      // If audio session expired, restart current point
      if (curPoint) {
        await this.playTeachingPoint(curPoint);
      }
    }
  }

  /**
   * Stop Action
   */
  public stop(): void {
    this.state = 'STOPPING';
    this.audioController.stop();
    this.ttsQueue.cancelPending();

    const curPoint = this.teachingEngine.getCurrentTeachingPoint();
    this.logEvent('LECTURE_STOPPED', {
      teachingPointId: curPoint?.id,
      slideNumber: curPoint?.slideNumber,
      blockId: curPoint?.teachingBlockId
    });

    this.state = 'IDLE';
    this.isProcessingTransition = false;
    this.notifyStatusChange();
  }

  /**
   * Retry currently failing TeachingPoint without skipping
   */
  public async retryCurrentTeachingPoint(): Promise<void> {
    const curPoint = this.teachingEngine.getCurrentTeachingPoint();
    if (!curPoint) {
      return;
    }
    this.audioController.stop();
    this.state = 'PLAYING';
    this.errorMessage = undefined;
    this.notifyStatusChange();
    await this.playTeachingPoint(curPoint);
  }

  /**
   * Reset / Restart from beginning
   */
  public async restartFromBeginning(): Promise<void> {
    this.stop();
    this.teachingEngine.startLecture();
    this.ttsQueue.clear();
    await this.play();
  }

  /**
   * Error handler: Enforces no skipping of academic content
   */
  private handlePlaybackError(error: any): void {
    this.state = 'ERROR';
    this.errorMessage = error?.message || (typeof error === 'string' ? error : (error?.error ? String(error.error) : 'Lỗi phát âm thanh bài giảng'));
    this.audioController.stop();

    const curPoint = this.teachingEngine.getCurrentTeachingPoint();
    this.logEvent('LECTURE_ERROR', {
      teachingPointId: curPoint?.id,
      slideNumber: curPoint?.slideNumber,
      blockId: curPoint?.teachingBlockId,
      message: this.errorMessage
    });

    this.notifyStatusChange();
  }

  /**
   * Resolves canonical spoken delivery text for a TeachingPoint.
   * Priority: Phase 1.5.6 canonical script -> teachingEngine delivery script.
   */
  private resolveSpokenDelivery(point: TeachingPoint): { fullLectureScript: string } {
    const canonical = findLectureScriptByPointId(point.id);
    if (canonical && canonical.fullLectureScript) {
      return { fullLectureScript: canonical.fullLectureScript };
    }

    const engineDelivery = this.teachingEngine.getPointDelivery(point);
    return { fullLectureScript: engineDelivery.fullLectureScript };
  }
}
