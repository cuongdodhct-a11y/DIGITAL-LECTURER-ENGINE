/**
 * Phase 1.5.7 — Single Audio Playback Controller
 * Ensures one and only one active audio stream for Continuous Lecture Playback.
 * Handles HTMLAudioElement (base64/URL) and Web Speech API fallback smoothly,
 * with strictly managed event listeners and no simultaneous overlapping voice.
 */

import { AudioPlaybackController } from '../../types/continuousPlayback';
import { VoiceProfile, AudioSourceType } from '../../types/audio';
import { DEFAULT_VOICE_PROFILES } from '../ttsGateway/voiceProfiles';

export class BrowserAudioController implements AudioPlaybackController {
  private audioElement: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSyntheticWebSpeech: boolean = false;
  private currentAudioSource: AudioSourceType = 'GEMINI_TTS';

  private onPlayCallback?: () => void;
  private onPauseCallback?: () => void;
  private onEndedCallback?: () => void;
  private onErrorCallback?: (err: any) => void;

  private voiceProfile: VoiceProfile = DEFAULT_VOICE_PROFILES[0];
  private volume: number = 1.0;
  private _isPlaying: boolean = false;
  private currentTextFallback: string = '';
  private currentMimeType: string = 'audio/wav';
  private estimatedDuration: number = 0;

  constructor(voiceProfile?: VoiceProfile) {
    if (voiceProfile) {
      this.voiceProfile = voiceProfile;
    }
  }

  public setVoiceProfile(voiceProfile: VoiceProfile): void {
    this.voiceProfile = voiceProfile;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  public setOnPlay(callback: () => void): void {
    this.onPlayCallback = callback;
  }

  public setOnPause(callback: () => void): void {
    this.onPauseCallback = callback;
  }

  public setOnEnded(callback: () => void): void {
    this.onEndedCallback = callback;
  }

  public setOnError(callback: (err: any) => void): void {
    this.onErrorCallback = callback;
  }

  public isPlaying(): boolean {
    return this._isPlaying;
  }

  public getActiveAudioCount(): number {
    return this._isPlaying ? 1 : 0;
  }

  public getAudioSource(): AudioSourceType {
    return this.currentAudioSource;
  }

  public getCurrentTime(): number {
    if (this.audioElement && !this.isSyntheticWebSpeech) {
      return this.audioElement.currentTime;
    }
    return 0;
  }

  public getDuration(): number {
    if (this.audioElement && !this.isSyntheticWebSpeech) {
      const dur = this.audioElement.duration;
      return (!dur || isNaN(dur)) ? this.estimatedDuration : dur;
    }
    return this.estimatedDuration;
  }

  /**
   * Loads a new audio track and cleans up any previous instance.
   * Guarantees activeAudioCount <= 1 by immediately stopping prior streams.
   */
  public async loadAudio(item: {
    audioBase64?: string;
    audioUrl?: string;
    audioSource?: AudioSourceType;
    mimeType?: string;
    text: string;
    durationEstimateSeconds?: number;
  }): Promise<void> {
    this.stop(); // Stop any active audio stream immediately

    this.currentTextFallback = item.text;
    this.currentMimeType = item.mimeType || 'audio/wav';
    this.estimatedDuration = item.durationEstimateSeconds || Math.max(3, Math.round(item.text.length / 14));

    if (item.audioBase64 || item.audioUrl) {
      this.isSyntheticWebSpeech = false;
      this.currentAudioSource = item.audioSource || 'GEMINI_TTS';
      const src = item.audioUrl || `data:${item.mimeType || 'audio/wav'};base64,${item.audioBase64}`;

      // Clean up previous audio element
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.onplay = null;
        this.audioElement.onpause = null;
        this.audioElement.onended = null;
        this.audioElement.onerror = null;
        this.audioElement.src = '';
      } else if (typeof Audio !== 'undefined') {
        this.audioElement = new Audio();
      }

      if (this.audioElement) {
        this.audioElement.src = src;
        this.audioElement.volume = this.volume;

        this.audioElement.onplay = () => {
          this._isPlaying = true;
          this.onPlayCallback?.();
        };

        this.audioElement.onpause = () => {
          this._isPlaying = false;
          this.onPauseCallback?.();
        };

        this.audioElement.onended = () => {
          this._isPlaying = false;
          this.onEndedCallback?.();
        };

        this.audioElement.onerror = (e) => {
          this._isPlaying = false;
          console.warn('[AudioController] HTMLAudioElement error, attempting real Web Speech fallback:', e);
          this.fallbackToWebSpeech(item.text);
        };
      }
    } else {
      // Remote synthesis delegated to Browser SpeechSynthesis
      this.isSyntheticWebSpeech = true;
      this.currentAudioSource = 'BROWSER_TTS';
    }
  }

  public async play(): Promise<void> {
    if (this.isSyntheticWebSpeech || !this.audioElement) {
      this.fallbackToWebSpeech(this.currentTextFallback);
      return;
    }

    try {
      this._isPlaying = true;
      await this.audioElement.play();
    } catch (err) {
      console.warn('[AudioController] HTMLAudio play failed, falling back to Browser SpeechSynthesis:', err);
      this.fallbackToWebSpeech(this.currentTextFallback);
    }
  }

  public pause(): void {
    this._isPlaying = false;
    if (this.audioElement && !this.isSyntheticWebSpeech) {
      this.audioElement.pause();
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    this.onPauseCallback?.();
  }

  public async resume(): Promise<void> {
    if (this.audioElement && !this.isSyntheticWebSpeech) {
      try {
        this._isPlaying = true;
        await this.audioElement.play();
      } catch (err) {
        this.onErrorCallback?.(err);
      }
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        this._isPlaying = true;
        this.onPlayCallback?.();
      } else {
        await this.play();
      }
    }
  }

  public stop(): void {
    this._isPlaying = false;

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {
        // Ignore aborts on stopped elements
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore browser synthesis cancel errors
      }
      this.currentUtterance = null;
    }
  }

  public cleanup(): void {
    this.stop();
    if (this.audioElement) {
      this.audioElement.onplay = null;
      this.audioElement.onpause = null;
      this.audioElement.onended = null;
      this.audioElement.onerror = null;
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }

  /**
   * Real speech synthesis fallback using the browser's Web Speech API.
   * If speech synthesis is unavailable or fails, transitions to ERROR state (allows RETRY).
   * Strictly forbids simulated fake audio or synthetic silent timers in production.
   */
  private fallbackToWebSpeech(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this._isPlaying = false;
      const err = new Error('SPEECH_SYNTHESIS_UNAVAILABLE: Trình duyệt không hỗ trợ Web Speech API. Vui lòng bấm Thử lại.');
      this.onErrorCallback?.(err);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.voiceProfile.language[0] || 'vi-VN';
      utterance.rate = this.voiceProfile.rateAdjustment || 1.0;
      utterance.pitch = this.voiceProfile.pitchAdjustment || 1.0;

      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang.startsWith('vi') || v.lang.startsWith('en'));
      if (match) utterance.voice = match;

      utterance.onstart = () => {
        this._isPlaying = true;
        this.currentAudioSource = 'BROWSER_TTS';
        this.onPlayCallback?.();
      };

      utterance.onend = () => {
        this._isPlaying = false;
        this.currentUtterance = null;
        this.onEndedCallback?.();
      };

      utterance.onerror = (e: any) => {
        this._isPlaying = false;
        this.currentUtterance = null;
        // Ignore user-initiated cancellations (e.g., when stopping or pausing)
        if (e.error === 'canceled' || e.error === 'interrupted') {
          return;
        }
        console.error('[AudioController] Real Web Speech synthesis error:', e.error || e);
        const errMsg = e.error ? `Lỗi phát âm thanh trình duyệt (${e.error}). Vui lòng bấm Thử lại.` : 'Lỗi giọng nói trình duyệt';
        this.onErrorCallback?.(new Error(errMsg));
      };

      this.currentUtterance = utterance;
      this.currentAudioSource = 'BROWSER_TTS';
      window.speechSynthesis.speak(utterance);
    } catch (speechErr: any) {
      this._isPlaying = false;
      console.error('[AudioController] window.speechSynthesis exception:', speechErr);
      this.onErrorCallback?.(new Error(`Không thể khởi tạo giọng đọc trình duyệt: ${speechErr?.message || speechErr}`));
    }
  }
}
