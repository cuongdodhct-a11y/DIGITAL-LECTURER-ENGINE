import http from 'http';
import { verifyTtsAudioGate } from '../src/services/courseEngine/ttsAudioGateService';
import { synthesizeWithTtsGateway, clearTtsCache } from '../src/services/courseEngine/ttsGatewayService';
import fs from 'fs';
import path from 'path';

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

const audioBase64 = Buffer.from('RIFF----WAVEfmt mock-vieneu').toString('base64');
const mock = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405).end();
    return;
  }
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({
    audioBase64,
    mimeType: 'audio/wav',
    durationEstimateSeconds: 3
  }));
});

await new Promise<void>((resolve) => mock.listen(3210, '127.0.0.1', resolve));

const original = {
  provider: process.env.TTS_PROVIDER,
  url: process.env.VIENEU_TTS_URL,
  voice: process.env.VIENEU_VOICE_PROFILE,
  model: process.env.VIENEU_TTS_MODEL
};

try {
  process.env.TTS_PROVIDER = 'LOCAL_VIENEUV3';
  process.env.VIENEU_TTS_URL = 'http://127.0.0.1:3210';
  process.env.VIENEU_VOICE_PROFILE = 'PHAM_TUYEN';
  process.env.VIENEU_TTS_MODEL = 'vieneu-v3-turbo';

  clearTtsCache();
  const gate = verifyTtsAudioGate('LPKG-1MD2-001');
  if (!gate.ready) throw new Error('Gate D policy is not ready under the configured local runtime contract: ' + gate.blockers.join('; '));

  const request = {
    text: 'Đây là câu kiểm thử giọng giảng.',
    packageId: 'LPKG-1MD2-001',
    teachingPointId: 'TP-1MD2-001',
    scriptId: 'SCRIPT-1MD2-001'
  };

  const first = await synthesizeWithTtsGateway(request);
  if (first.provider !== 'LOCAL_VIENEUV3') throw new Error('Gate D did not use VieNeu local provider.');
  if (first.voiceProfile !== 'PHAM_TUYEN') throw new Error('Gate D did not use Phạm Tuyên voice profile.');
  if (first.model !== 'vieneu-v3-turbo') throw new Error('Gate D did not use VieNeu v3 Turbo.');
  if (first.cached) throw new Error('First TTS request must not be a cache hit.');

  const second = await synthesizeWithTtsGateway(request);
  if (!second.cached) throw new Error('Second identical TTS request must be served from bounded ephemeral cache.');

  console.log('PHASE 3 GATE D — TTS/AUDIO POLICY + GATEWAY SMOKE: PASS');
  console.log(JSON.stringify({
    gate: gate.gate,
    packageId: gate.packageId,
    provider: first.provider,
    voiceProfile: first.voiceProfile,
    model: first.model,
    browserTtsAllowed: gate.browserTtsAllowed,
    cachePolicy: gate.cachePolicy,
    audioStorage: manifest.audioStorage.provider,
    runtime: 'MOCK_LOCAL_VIENEUV3_CONTRACT'
  }, null, 2));
} finally {
  mock.close();
  if (original.provider === undefined) delete process.env.TTS_PROVIDER; else process.env.TTS_PROVIDER = original.provider;
  if (original.url === undefined) delete process.env.VIENEU_TTS_URL; else process.env.VIENEU_TTS_URL = original.url;
  if (original.voice === undefined) delete process.env.VIENEU_VOICE_PROFILE; else process.env.VIENEU_VOICE_PROFILE = original.voice;
  if (original.model === undefined) delete process.env.VIENEU_TTS_MODEL; else process.env.VIENEU_TTS_MODEL = original.model;
}
