/**
 * Digital Lecturer Engine - Voice & TTS Architecture Types
 */

export interface VoiceProfile {
  id: string;
  name: string;
  gender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  language: string[]; // e.g. ['vi-VN', 'en-US']
  style: 'ACADEMIC_AUTHORITATIVE' | 'ENGAGING_TUTORIAL' | 'SOCRATIC_DELIBERATE' | 'FORMAL_LECTURE';
  provider: 'gemini-tts' | 'web-speech' | 'custom-replication';
  providerVoiceId?: string; // e.g. 'Puck', 'Charon', 'Aoede', 'Fenrir'
  description?: string;
  pitchAdjustment?: number;
  rateAdjustment?: number;
}

export type TTSModelName = 'gemini-3.8-flash-tts' | 'gemini-3.8-flash-lite-tts';

export type AudioSourceType = 'GEMINI_TTS' | 'BROWSER_TTS' | 'TEST_SYNTHETIC';

export type VoiceStatus = 'OFFICIAL' | 'FALLBACK';

export type FallbackPolicy = 'DENY' | 'ALLOW_BROWSER_TTS';

export interface LectureVoiceSession {
  sessionId: string;
  packageId: string;
  voiceProfileId: string;
  voiceName: string;
  ttsModel: TTSModelName;
  language: string;
  speakingStyle: string;
  fallbackPolicy: FallbackPolicy;
  createdAt: number;
}

export interface TTSRequest {
  text: string;
  packageId?: string;
  teachingPointId?: string;
  scriptId?: string;
  voiceProfile: VoiceProfile;
  model: TTSModelName;
  teachingBlockId?: string;
  speakingStyle?: string;
  language?: string;
  fallbackPolicy?: FallbackPolicy;
  voiceSessionId?: string;
}

export interface TTSResponse {
  audioBase64?: string;
  audioUrl?: string;
  audioSource: AudioSourceType;
  voiceStatus: VoiceStatus;
  voiceProfileId?: string;
  ttsModel?: string;
  packageId?: string;
  teachingPointId?: string;
  scriptId?: string;
  mimeType: string;
  durationEstimateSeconds: number;
  cached: boolean;
  cacheKey: string;
  modelUsed: string;
  fallbackReason?: string;
  notice?: string;
}

export interface AudioCacheEntry {
  cacheKey: string;
  createdAt: number;
  audioBase64: string;
  mimeType: string;
  durationSeconds: number;
  audioSource: AudioSourceType;
  voiceStatus: VoiceStatus;
  voiceProfileId: string;
  ttsModel: string;
  packageId?: string;
  teachingPointId?: string;
  scriptId?: string;
  textHash?: string;
  metadata?: {
    blockId?: string;
    textLength: number;
    model: string;
  };
}

export interface AudioQueueItem {
  id: string;
  blockId: string;
  text: string;
  audioUrl?: string;
  audioBase64?: string;
  mimeType: string;
  status: 'PENDING' | 'LOADING' | 'READY' | 'PLAYING' | 'COMPLETED' | 'ERROR';
  errorMessage?: string;
}
