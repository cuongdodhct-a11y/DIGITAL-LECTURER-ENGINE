/**
 * Digital Lecturer Engine - Audio Cache
 * In-memory & local persistent deterministic cache for synthesized lecture speech.
 */

import { AudioCacheEntry } from '../../types/audio';
import { generateAudioCacheKey } from '../../utils/hashing';

export class AudioCache {
  private cache: Map<string, AudioCacheEntry> = new Map();

  public get(key: string): AudioCacheEntry | undefined {
    const entry = this.cache.get(key);
    // Anti-leak check: Never return BROWSER_TTS or non-official voice from cache
    if (entry && (entry.audioSource !== 'GEMINI_TTS' || entry.voiceStatus !== 'OFFICIAL')) {
      this.cache.delete(key);
      return undefined;
    }
    return entry;
  }

  public set(entry: AudioCacheEntry): void {
    // Phase 1.5.8A Rule: Only cache OFFICIAL Gemini TTS audio bytes.
    // Never cache Browser TTS or fallback audio.
    if (entry.audioSource !== 'GEMINI_TTS' || entry.voiceStatus !== 'OFFICIAL') {
      return;
    }
    this.cache.set(entry.cacheKey, entry);
  }

  public has(key: string): boolean {
    const entry = this.cache.get(key);
    return Boolean(entry && entry.audioSource === 'GEMINI_TTS' && entry.voiceStatus === 'OFFICIAL');
  }

  public computeKey(params: {
    text: string;
    voiceProfileId: string;
    model: string;
    language?: string;
    speakingStyle?: string;
    packageId?: string;
    teachingPointId?: string;
    scriptId?: string;
  }): string {
    return generateAudioCacheKey(params);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

export const defaultAudioCache = new AudioCache();
