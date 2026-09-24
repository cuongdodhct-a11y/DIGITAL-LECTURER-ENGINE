/**
 * Phase 1.5.7 — Continuous Lecture Playback Engine Types
 */

import { VoiceProfile, TTSModelName, AudioSourceType, VoiceStatus, FallbackPolicy, LectureVoiceSession } from './audio';

export type ContinuousPlaybackState =
  | 'IDLE'
  | 'PLAYING'
  | 'PAUSED'
  | 'STOPPING'
  | 'COMPLETED'
  | 'ERROR'
  | 'VOICE_UNAVAILABLE';

export type QueueItemAudioStatus =
  | 'QUEUED'
  | 'SYNTHESIZING'
  | 'READY'
  | 'PLAYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface TTSQueueItem {
  id: string; // usually requestId or teachingPointId
  teachingPointId: string;
  slideNumber: number;
  teachingBlockId: string;
  scriptId: string;
  packageId?: string;
  text: string; // sanitized spoken delivery text
  audioStatus: QueueItemAudioStatus;
  audioUrl?: string;
  audioBase64?: string;
  audioSource?: AudioSourceType;
  voiceStatus?: VoiceStatus;
  voiceProfileId?: string;
  mimeType?: string;
  durationEstimateSeconds?: number;
  modelUsed?: string;
  requestId: string;
  retryCount: number;
  error?: string;
}

export type ContinuousLectureEventType =
  | 'LECTURE_STARTED'
  | 'TEACHING_POINT_STARTED'
  | 'AUDIO_SYNTHESIS_STARTED'
  | 'AUDIO_READY'
  | 'AUDIO_PLAY_STARTED'
  | 'AUDIO_PLAY_ENDED'
  | 'TEACHING_POINT_COMPLETED'
  | 'SLIDE_CHANGED'
  | 'SLIDE_VISUAL_ONLY'
  | 'TEACHING_BLOCK_CHANGED'
  | 'LECTURE_PAUSED'
  | 'LECTURE_RESUMED'
  | 'LECTURE_STOPPED'
  | 'LECTURE_COMPLETED'
  | 'LECTURE_ERROR';

export interface ContinuousLectureEvent {
  type: ContinuousLectureEventType;
  timestamp: string;
  teachingBlockId: string;
  teachingPointId: string;
  slideNumber: number;
  details?: Record<string, unknown>;
  message?: string;
}

export interface ContinuousPlaybackStatus {
  state: ContinuousPlaybackState;
  currentTeachingBlockId?: string;
  currentSlideNumber: number;
  currentTeachingPointId?: string;
  currentPointTitle?: string;
  currentPointIndex: number;
  totalPoints: number;
  currentScriptId?: string;
  spokenText?: string;
  ttsModel?: string;
  voiceProfileId?: string;
  voiceName?: string;
  voiceStatus?: VoiceStatus;
  audioSourceType?: AudioSourceType;
  fallbackPolicy?: FallbackPolicy;
  lectureVoiceSession?: LectureVoiceSession;
  audioMimeType?: string;
  currentAudioRequestId?: string;
  audioCurrentTime: number;
  audioDuration: number;
  activeAudioCount: number;
  queue: TTSQueueItem[];
  prefetchedPointId?: string;
  errorMessage?: string;
}

export interface AudioPlaybackController {
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  resume(): Promise<void>;
  getCurrentTime(): number;
  getDuration(): number;
  isPlaying(): boolean;
  getActiveAudioCount(): number;
  loadAudio(item: {
    audioBase64?: string;
    audioUrl?: string;
    audioSource?: AudioSourceType;
    mimeType?: string;
    text: string;
    durationEstimateSeconds?: number;
  }): Promise<void>;
  setOnPlay(callback: () => void): void;
  setOnPause(callback: () => void): void;
  setOnEnded(callback: () => void): void;
  setOnError(callback: (err: any) => void): void;
  cleanup(): void;
}
