import fs from 'fs';
import path from 'path';
import { verifyTtsAudioGate } from '../src/services/courseEngine/ttsAudioGateService';

const root = path.join(process.cwd(), 'data', 'courses', '1MD', 'packages', '1MD2');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tts.audio.policy.json'), 'utf8'));

if (manifest.packageId !== 'LPKG-1MD2-001') throw new Error('Gate D package mismatch.');
if (manifest.voice.profileId !== 'PHAM_TUYEN') throw new Error('Gate D voice mismatch.');
if (manifest.voice.provider !== 'LOCAL_VIENEUV3') throw new Error('Gate D provider mismatch.');
if (manifest.voice.model !== 'vieneu-v3-turbo') throw new Error('Gate D model mismatch.');
if (manifest.voice.browserSpeechSynthesisAllowed !== false) throw new Error('Browser SpeechSynthesis must be disabled.');
if (manifest.voice.geminiAllowedForFreeLocal !== false) throw new Error('Gemini must be disabled for FREE/LOCAL Gate D.');
if (manifest.audioStorage.provider !== 'GOOGLE_DRIVE') throw new Error('Audio storage must be Google Drive.');
if (manifest.audioStorage.repositoryCommitAllowed !== false) throw new Error('Audio must not be committed to Git.');

const originalUrl = process.env.VIENEU_TTS_URL;
process.env.TTS_PROVIDER = 'LOCAL_VIENEUV3';
process.env.VIENEU_TTS_URL = 'http://127.0.0.1:9/unreachable';
process.env.VIENEU_VOICE_PROFILE = 'PHAM_TUYEN';
process.env.VIENEU_TTS_MODEL = 'vieneu-v3-turbo';
const result = verifyTtsAudioGate('LPKG-1MD2-001');
if (result.ready) throw new Error('Gate D must remain BLOCKED until the real VieNeu runtime endpoint is configured.');

if (originalUrl === undefined) delete process.env.VIENEU_TTS_URL; else process.env.VIENEU_TTS_URL = originalUrl;

console.log('PHASE 3 GATE D — TTS/AUDIO POLICY: PASS');
console.log(JSON.stringify({
  gate: result.gate,
  packageId: result.packageId,
  provider: result.provider,
  voiceProfile: result.voiceProfile,
  model: result.model,
  browserTtsAllowed: result.browserTtsAllowed,
  cachePolicy: result.cachePolicy,
  audioStorage: result.audioStorage,
  runtimeRequired: 'VIENEU_TTS_URL'
}, null, 2));
