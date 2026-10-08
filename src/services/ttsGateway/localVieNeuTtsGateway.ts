import { TTSGateway } from './ttsGateway';
import { TTSRequest, TTSResponse } from '../../types/audio';

export const PHAM_TUYEN_VIETNAM_VOICE = {
  id: 'voice_pham_tuyen',
  name: 'Phạm Tuyên — Giảng viên số',
  gender: 'MALE' as const,
  language: ['vi-VN'],
  style: 'FORMAL_LECTURE' as const,
  provider: 'custom-replication' as const,
  description: 'Hồ sơ giọng giảng viên nam địa phương dùng với VieNeu v3 Turbo.',
  rateAdjustment: 1,
  pitchAdjustment: 1
};

export const VIENEU_V3_TURBO_MODEL = 'vieneu-v3-turbo' as const;

/**
 * Browser-side gateway for the approved FREE/LOCAL path.
 * The actual VieNeu runtime stays outside the browser and is reached only
 * through the Course Engine API, preserving package/TeachingPoint provenance.
 */
export class LocalVieNeuTTSGateway extends TTSGateway {
  public override async synthesize(request: Partial<TTSRequest> & { text: string }): Promise<TTSResponse> {
    const packageId = request.packageId || 'LPKG-1MD1-001';
    const teachingPointId = request.teachingPointId;
    if (!teachingPointId) throw new Error('TeachingPointId is required for LOCAL_VIENEUV3 synthesis.');

    const response = await fetch('/api/course-engine/packages/' + encodeURIComponent(packageId) + '/tts/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: request.text,
        teachingPointId,
        scriptId: request.scriptId
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || ('Local VieNeu TTS HTTP ' + response.status));
    }

    if (!data.audioBase64) {
      throw new Error('LOCAL_VIENEUV3 returned no audioBase64.');
    }

    return {
      audioBase64: data.audioBase64,
      audioSource: 'LOCAL_VIENEUV3',
      voiceStatus: 'LOCAL',
      voiceProfileId: PHAM_TUYEN_VIETNAM_VOICE.id,
      ttsModel: VIENEU_V3_TURBO_MODEL,
      packageId,
      teachingPointId,
      scriptId: request.scriptId,
      mimeType: data.mimeType || 'audio/wav',
      durationEstimateSeconds: Number(data.durationEstimateSeconds || 0),
      cached: Boolean(data.cached),
      cacheKey: '',
      modelUsed: VIENEU_V3_TURBO_MODEL
    };
  }
}
