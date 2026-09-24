/**
 * Digital Lecturer Engine - TTS Gateway
 * Routes speech synthesis requests to Gemini TTS models (primary: gemini-3.8-flash-tts,
 * secondary: gemini-3.8-flash-lite-tts), verifies cache, and manages audio streams.
 */

import { TTSRequest, TTSResponse, TTSModelName, AudioSourceType, VoiceStatus, FallbackPolicy } from '../../types/audio';
import { AudioCache, defaultAudioCache } from './audioCache';
import { OFFICIAL_LECTURER_VOICE_PROFILE, OFFICIAL_TTS_MODEL, DEFAULT_VOICE_PROFILES } from './voiceProfiles';
import { sanitizeSpokenLectureScript } from './ttsSanitizer';

export class TTSGateway {
  private cache: AudioCache;
  private defaultModel: TTSModelName = OFFICIAL_TTS_MODEL;

  constructor(cache: AudioCache = defaultAudioCache) {
    this.cache = cache;
  }

  public setDefaultModel(model: TTSModelName): void {
    this.defaultModel = model;
  }

  public getDefaultModel(): TTSModelName {
    return this.defaultModel;
  }

  /**
   * Synthesizes audio for a teaching block or interaction prompt.
   * If cache hit, returns cached audio immediately.
   */
  public async synthesize(request: Partial<TTSRequest> & { text: string }): Promise<TTSResponse> {
    // Phase 1.5.6B — TTS Sanitization Gate: Reject metadata leakage
    const sanitization = sanitizeSpokenLectureScript(request.text);
    if (!sanitization.isSafe) {
      console.error('[TTSGateway] SANITIZATION_FAILED:', sanitization.error, sanitization.leaksDetected);
      throw new Error(`TTS_SANITIZATION_FAILED: Spoken text contains metadata leaks: ${sanitization.leaksDetected.map(l => l.pattern).join(', ')}`);
    }

    const cleanText = sanitization.sanitizedText || request.text;
    const voiceProfile = request.voiceProfile || OFFICIAL_LECTURER_VOICE_PROFILE;
    const model = request.model || this.defaultModel;
    const language = request.language || voiceProfile.language[0] || 'vi-VN';
    const speakingStyle = request.speakingStyle || voiceProfile.style;
    const fallbackPolicy: FallbackPolicy = request.fallbackPolicy || 'DENY';
    const packageId = request.packageId || 'LPKG-1MD1-001';
    const teachingPointId = request.teachingPointId;
    const scriptId = request.scriptId;

    const cacheKey = this.cache.computeKey({
      packageId,
      teachingPointId,
      scriptId,
      text: cleanText,
      voiceProfileId: voiceProfile.id,
      model,
      language,
      speakingStyle
    });

    // Phase 1.5.8A: Check cache - ONLY return official Gemini TTS from cache
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && cachedEntry.audioSource === 'GEMINI_TTS' && cachedEntry.voiceStatus === 'OFFICIAL') {
      return {
        audioBase64: cachedEntry.audioBase64,
        audioSource: 'GEMINI_TTS',
        voiceStatus: 'OFFICIAL',
        voiceProfileId: cachedEntry.voiceProfileId || voiceProfile.id,
        ttsModel: model,
        packageId,
        teachingPointId,
        scriptId,
        mimeType: cachedEntry.mimeType,
        durationEstimateSeconds: cachedEntry.durationSeconds,
        cached: true,
        cacheKey,
        modelUsed: model
      };
    }

    // Call server TTS endpoint
    try {
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voiceProfile,
          model,
          language,
          speakingStyle,
          cacheKey,
          packageId,
          teachingPointId,
          scriptId,
          fallbackPolicy
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`TTS server responded with ${response.status}: ${errText}`);
      }

      const data = await response.json();

      // Case 1: Official Gemini TTS returned
      if (data.audioBase64) {
        this.cache.set({
          cacheKey,
          createdAt: Date.now(),
          audioBase64: data.audioBase64,
          mimeType: data.mimeType || 'audio/wav',
          durationSeconds: data.durationEstimateSeconds || Math.max(3, Math.round(cleanText.length / 14)),
          audioSource: 'GEMINI_TTS',
          voiceStatus: 'OFFICIAL',
          voiceProfileId: voiceProfile.id,
          ttsModel: model,
          packageId,
          teachingPointId,
          scriptId,
          metadata: {
            blockId: request.teachingBlockId,
            textLength: cleanText.length,
            model
          }
        });

        return {
          audioBase64: data.audioBase64,
          audioUrl: data.audioUrl,
          audioSource: 'GEMINI_TTS',
          voiceStatus: 'OFFICIAL',
          voiceProfileId: voiceProfile.id,
          ttsModel: model,
          packageId,
          teachingPointId,
          scriptId,
          mimeType: data.mimeType || 'audio/wav',
          durationEstimateSeconds: data.durationEstimateSeconds || Math.max(3, Math.round(cleanText.length / 14)),
          cached: false,
          cacheKey,
          modelUsed: data.modelUsed || model,
          notice: data.notice
        };
      }

      // Case 2: Server delegated to Browser TTS
      if (data.audioSource === 'BROWSER_TTS') {
        if (fallbackPolicy === 'DENY') {
          // Strictly forbid silent switch to browser voice in official mode
          throw new Error('VOICE_UNAVAILABLE: Giọng giảng chuẩn hiện không khả dụng. (Hạn ngạch Gemini TTS: 429 RESOURCE_EXHAUSTED)');
        }

        // Only allowed if user explicitly enabled fallback
        return {
          audioBase64: undefined,
          audioUrl: undefined,
          audioSource: 'BROWSER_TTS',
          voiceStatus: 'FALLBACK',
          voiceProfileId: voiceProfile.id,
          ttsModel: 'browser-speech-synthesis',
          packageId,
          teachingPointId,
          scriptId,
          mimeType: 'audio/speech-synthesis',
          durationEstimateSeconds: data.durationEstimateSeconds || Math.max(3, Math.round(cleanText.length / 14)),
          cached: false,
          cacheKey,
          modelUsed: 'browser-speech-synthesis',
          fallbackReason: data.fallbackReason,
          notice: data.notice || 'Đang sử dụng giọng dự phòng'
        };
      }

      throw new Error('TTS_UNKNOWN_RESPONSE: Phản hồi âm thanh không hợp lệ từ máy chủ');
    } catch (err: any) {
      if (fallbackPolicy === 'DENY') {
        // Enforce VOICE_UNAVAILABLE: Do not silently fallback
        console.warn('[TTSGateway] Official voice unavailable under fallbackPolicy=DENY:', err.message);
        throw new Error(err.message || 'VOICE_UNAVAILABLE: Giọng giảng chuẩn hiện không khả dụng');
      }

      console.warn('[TTSGateway] Remote synthesis unavailable, delegating to user-permitted Browser SpeechSynthesis:', err);
      const fallbackDuration = Math.max(3, Math.round(cleanText.length / 14));
      return {
        audioBase64: undefined,
        audioUrl: undefined,
        audioSource: 'BROWSER_TTS',
        voiceStatus: 'FALLBACK',
        voiceProfileId: voiceProfile.id,
        ttsModel: 'browser-speech-synthesis',
        packageId,
        teachingPointId,
        scriptId,
        mimeType: 'audio/speech-synthesis',
        durationEstimateSeconds: fallbackDuration,
        cached: false,
        cacheKey,
        modelUsed: 'browser-speech-synthesis',
        fallbackReason: 'PERMITTED_FALLBACK',
        notice: 'Đang sử dụng giọng dự phòng'
      };
    }
  }
}

export const defaultTTSGateway = new TTSGateway();
