/**
 * Shared test doubles for AudioPlaybackController & TTSGateway
 */

import { AudioPlaybackController } from '../../../types/continuousPlayback';

export class MockAudioController implements AudioPlaybackController {
  private _isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 5.0;

  private onPlayCb?: () => void;
  private onPauseCb?: () => void;
  private onEndedCb?: () => void;
  private onErrorCb?: (err: any) => void;

  public activeTracks: string[] = [];
  public currentTrackText: string = '';

  public setOnPlay(cb: () => void): void { this.onPlayCb = cb; }
  public setOnPause(cb: () => void): void { this.onPauseCb = cb; }
  public setOnEnded(cb: () => void): void { this.onEndedCb = cb; }
  public setOnError(cb: (err: any) => void): void { this.onErrorCb = cb; }

  public async loadAudio(item: { audioBase64?: string; audioUrl?: string; mimeType?: string; text: string }): Promise<void> {
    this.currentTrackText = item.text;
    this.currentTime = 0;
  }

  public async play(): Promise<void> {
    if (this._isPlaying) {
      throw new Error('DUPLICATE_AUDIO_ERROR: Attempted to play overlapping audio track!');
    }
    this._isPlaying = true;
    this.activeTracks.push(this.currentTrackText);
    this.onPlayCb?.();
  }

  public pause(): void {
    this._isPlaying = false;
    this.onPauseCb?.();
  }

  public stop(): void {
    this._isPlaying = false;
    this.activeTracks = [];
  }

  public async resume(): Promise<void> {
    this._isPlaying = true;
    this.onPlayCb?.();
  }

  public getCurrentTime(): number { return this.currentTime; }
  public getDuration(): number { return this.duration; }
  public isPlaying(): boolean { return this._isPlaying; }
  public getActiveAudioCount(): number { return this._isPlaying ? 1 : 0; }

  public triggerEnded(): void {
    this._isPlaying = false;
    this.activeTracks = [];
    this.onEndedCb?.();
  }

  public async simulatePlaybackComplete(): Promise<void> {
    this.triggerEnded();
    // Allow microtasks to settle
    await new Promise(r => setTimeout(r, 10));
  }

  public triggerError(err: any): void {
    this._isPlaying = false;
    this.onErrorCb?.(err);
  }

  public cleanup(): void {
    this.stop();
  }
}

export class MockTTSGateway {
  private shouldFail: boolean = false;

  public setFailureMode(fail: boolean): void {
    this.shouldFail = fail;
  }

  public async synthesize(request: { text: string; pointId?: string }): Promise<{
    audioBase64: string;
    audioSource: 'TEST_SYNTHETIC';
    mimeType: string;
    durationEstimateSeconds: number;
    cached: boolean;
    modelUsed: string;
  }> {
    if (this.shouldFail) {
      throw new Error('TTS_NETWORK_TIMEOUT: Mock TTS failed to respond.');
    }
    return {
      audioBase64: 'MOCK_BASE64_AUDIO_DATA',
      audioSource: 'TEST_SYNTHETIC',
      mimeType: 'audio/mp3',
      durationEstimateSeconds: 5,
      cached: false,
      modelUsed: 'mock-test-tts'
    };
  }
}
