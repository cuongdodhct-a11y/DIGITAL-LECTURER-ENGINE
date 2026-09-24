/**
 * Digital Lecturer Engine - Voice Profiles
 */

import { VoiceProfile, TTSModelName } from '../../types/audio';

export const DEFAULT_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'voice_academic_vn_male',
    name: 'GS. Trần Đình Trọng (Academic Senior)',
    gender: 'MALE',
    language: ['vi-VN', 'en-US'],
    style: 'ACADEMIC_AUTHORITATIVE',
    provider: 'gemini-tts',
    providerVoiceId: 'Fenrir',
    description: 'Giọng nam trầm ấm, đĩnh đạc, phát âm chuẩn xác ngữ âm học thuật, ngắt nghỉ sư phạm chuẩn mực.',
    rateAdjustment: 1.0,
    pitchAdjustment: 0.95
  },
  {
    id: 'voice_pedagogic_vn_female',
    name: 'PGS. TS. Lê Hoài An (Socratic Deliberate)',
    gender: 'FEMALE',
    language: ['vi-VN', 'en-US'],
    style: 'SOCRATIC_DELIBERATE',
    provider: 'gemini-tts',
    providerVoiceId: 'Aoede',
    description: 'Giọng nữ chuẩn Hà Nội, trong trẻo, nhấn nhá rõ ràng các khái niệm then chốt và câu hỏi gợi mở tư duy.',
    rateAdjustment: 0.98,
    pitchAdjustment: 1.05
  },
  {
    id: 'voice_tutorial_en_neutral',
    name: 'Dr. Alan Vance (International Lecturer)',
    gender: 'NEUTRAL',
    language: ['en-US', 'vi-VN'],
    style: 'ENGAGING_TUTORIAL',
    provider: 'gemini-tts',
    providerVoiceId: 'Puck',
    description: 'Authoritative international academic voice, clear enunciation for technical terms and theorems.',
    rateAdjustment: 1.02,
    pitchAdjustment: 1.0
  }
];

export const OFFICIAL_LECTURER_VOICE_PROFILE: VoiceProfile = DEFAULT_VOICE_PROFILES[0];
export const OFFICIAL_TTS_MODEL: TTSModelName = 'gemini-3.8-flash-lite-tts';

export function getVoiceProfileById(id: string): VoiceProfile {
  return DEFAULT_VOICE_PROFILES.find(v => v.id === id) || DEFAULT_VOICE_PROFILES[0];
}
