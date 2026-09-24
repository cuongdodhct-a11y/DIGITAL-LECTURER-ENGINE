/**
 * Phase 1.5.7 — TTS Queue & Prefetch Manager
 * Maintains a sequential queue of TTS requests, handles synthesis with retry,
 * and prefetches the next TeachingPoint audio so transition gaps are minimized.
 */

import { TTSQueueItem } from '../../types/continuousPlayback';
import { VoiceProfile, TTSModelName, FallbackPolicy } from '../../types/audio';
import { TTSGateway, defaultTTSGateway } from '../ttsGateway/ttsGateway';
import { OFFICIAL_LECTURER_VOICE_PROFILE, OFFICIAL_TTS_MODEL } from '../ttsGateway/voiceProfiles';
import { sanitizeSpokenLectureScript } from '../ttsGateway/ttsSanitizer';

export class TTSQueueManager {
  private queue: Map<string, TTSQueueItem> = new Map();
  private gateway: TTSGateway;
  private voiceProfile: VoiceProfile;
  private model: TTSModelName;
  private fallbackPolicy: FallbackPolicy = 'DENY';
  private packageId: string = 'LPKG-1MD1-001';
  private maxRetries: number = 2;
  private activeSyntheses: Set<string> = new Set();

  constructor(
    gateway: TTSGateway = defaultTTSGateway,
    voiceProfile?: VoiceProfile,
    model: TTSModelName = OFFICIAL_TTS_MODEL
  ) {
    this.gateway = gateway;
    this.voiceProfile = voiceProfile || OFFICIAL_LECTURER_VOICE_PROFILE;
    this.model = model;
  }

  public setVoiceProfile(profile: VoiceProfile): void {
    this.voiceProfile = profile;
  }

  public getVoiceProfile(): VoiceProfile {
    return this.voiceProfile;
  }

  public setModel(model: TTSModelName): void {
    this.model = model;
  }

  public getModel(): TTSModelName {
    return this.model;
  }

  public setFallbackPolicy(policy: FallbackPolicy): void {
    this.fallbackPolicy = policy;
  }

  public getFallbackPolicy(): FallbackPolicy {
    return this.fallbackPolicy;
  }

  public setPackageId(pkgId: string): void {
    this.packageId = pkgId;
  }

  public getPackageId(): string {
    return this.packageId;
  }

  public getQueueItems(): TTSQueueItem[] {
    return Array.from(this.queue.values());
  }

  public getItem(teachingPointId: string): TTSQueueItem | undefined {
    return this.queue.get(teachingPointId);
  }

  /**
   * Enqueues a TeachingPoint script for synthesis.
   * If already exists with status READY, returns immediately (no duplicate synthesis).
   */
  public enqueue(item: {
    teachingPointId: string;
    slideNumber: number;
    teachingBlockId: string;
    scriptId: string;
    packageId?: string;
    text: string;
  }): TTSQueueItem {
    const existing = this.queue.get(item.teachingPointId);
    if (existing) {
      if (existing.audioStatus === 'READY' || existing.audioStatus === 'PLAYING') {
        return existing;
      }
    }

    const requestId = `req-${item.teachingPointId}-${Date.now()}`;
    const queueItem: TTSQueueItem = {
      id: item.teachingPointId,
      teachingPointId: item.teachingPointId,
      slideNumber: item.slideNumber,
      teachingBlockId: item.teachingBlockId,
      scriptId: item.scriptId,
      packageId: item.packageId || this.packageId,
      text: item.text,
      audioStatus: 'QUEUED',
      requestId,
      retryCount: 0
    };

    this.queue.set(item.teachingPointId, queueItem);
    return queueItem;
  }

  /**
   * Synthesizes audio for a queued item.
   * Runs sanitizeSpokenLectureScript BEFORE calling synthesis.
   * Applies retry count <= 2.
   */
  public async prepareAudio(teachingPointId: string): Promise<TTSQueueItem> {
    const item = this.queue.get(teachingPointId);
    if (!item) {
      throw new Error(`TeachingPoint ${teachingPointId} not found in TTS queue`);
    }

    if (item.audioStatus === 'READY' && (item.audioBase64 || item.audioUrl || item.audioSource === 'BROWSER_TTS')) {
      return item;
    }

    if (this.activeSyntheses.has(teachingPointId)) {
      // Wait for in-flight synthesis
      return new Promise<TTSQueueItem>((resolve, reject) => {
        const check = setInterval(() => {
          const current = this.queue.get(teachingPointId);
          if (current?.audioStatus === 'READY') {
            clearInterval(check);
            resolve(current);
          } else if (current?.audioStatus === 'FAILED') {
            clearInterval(check);
            reject(new Error(current.error || 'TTS synthesis failed'));
          }
        }, 50);
      });
    }

    this.activeSyntheses.add(teachingPointId);
    item.audioStatus = 'SYNTHESIZING';

    // 1. Mandatory TTS Sanitizer Gate
    const sanitization = sanitizeSpokenLectureScript(item.text);
    if (!sanitization.isSafe) {
      item.audioStatus = 'FAILED';
      item.error = `SANITIZATION_FAILED: Detected metadata leaks: ${sanitization.leaksDetected.map(l => l.pattern).join(', ')}`;
      this.activeSyntheses.delete(teachingPointId);
      throw new Error(item.error);
    }

    const cleanText = sanitization.sanitizedText || item.text;

    // 2. Synthesize with limited retries
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= this.maxRetries) {
      try {
        const response = await this.gateway.synthesize({
          text: cleanText,
          packageId: item.packageId || this.packageId,
          teachingPointId: item.teachingPointId,
          scriptId: item.scriptId,
          voiceProfile: this.voiceProfile,
          model: this.model,
          teachingBlockId: item.teachingBlockId,
          language: this.voiceProfile.language[0],
          fallbackPolicy: this.fallbackPolicy
        });

        item.audioBase64 = response.audioBase64;
        item.audioUrl = response.audioUrl;
        item.audioSource = response.audioSource;
        item.voiceStatus = response.voiceStatus;
        item.voiceProfileId = response.voiceProfileId || this.voiceProfile.id;
        item.mimeType = response.mimeType;
        item.durationEstimateSeconds = response.durationEstimateSeconds;
        item.modelUsed = response.modelUsed;
        item.audioStatus = 'READY';
        item.error = undefined;
        this.activeSyntheses.delete(teachingPointId);
        return item;
      } catch (err: any) {
        lastError = err;
        attempt++;
        item.retryCount = attempt;
        console.warn(`[TTSQueueManager] Attempt ${attempt} failed for ${teachingPointId}:`, err);
        if (attempt <= this.maxRetries) {
          await new Promise(r => setTimeout(r, 200 * attempt));
        }
      }
    }

    item.audioStatus = 'FAILED';
    item.error = lastError?.message || 'TTS synthesis failed after retries';
    this.activeSyntheses.delete(teachingPointId);
    throw new Error(item.error);
  }

  /**
   * Prefetch the audio for the next TeachingPoint in the background.
   */
  public prefetch(item: {
    teachingPointId: string;
    slideNumber: number;
    teachingBlockId: string;
    scriptId: string;
    packageId?: string;
    text: string;
  }): void {
    const queued = this.enqueue(item);
    if (queued.audioStatus === 'QUEUED') {
      this.prepareAudio(item.teachingPointId).catch(err => {
        console.warn(`[TTSQueueManager] Prefetch background failed for ${item.teachingPointId}:`, err);
      });
    }
  }

  public markPlaying(teachingPointId: string): void {
    const item = this.queue.get(teachingPointId);
    if (item) {
      item.audioStatus = 'PLAYING';
    }
  }

  public markCompleted(teachingPointId: string): void {
    const item = this.queue.get(teachingPointId);
    if (item) {
      item.audioStatus = 'COMPLETED';
    }
  }

  public cancelPending(): void {
    for (const [id, item] of this.queue.entries()) {
      if (item.audioStatus === 'QUEUED' || item.audioStatus === 'SYNTHESIZING') {
        item.audioStatus = 'CANCELLED';
      }
    }
    this.activeSyntheses.clear();
  }

  public clear(): void {
    this.queue.clear();
    this.activeSyntheses.clear();
  }
}
