import fs from 'fs';
import path from 'path';
import { getTtsGatewayConfig } from './ttsGatewayService';

export interface GateDResult {
  gate: 'D_TTS_AUDIO';
  packageId: string;
  ready: boolean;
  provider: string;
  voiceProfile: string;
  model: string;
  browserTtsAllowed: boolean;
  cachePolicy: string;
  audioStorage: string;
  blockers: string[];
  warnings: string[];
}

function loadGroundedScript(packageId: string): any {
  const match = packageId.match(/^LPKG-1MD(\d+)-001$/);
  if (!match) throw new Error('Unsupported packageId: ' + packageId);
  const lesson = Number(match[1]);
  const file = path.join(process.cwd(), 'data', 'courses', '1MD', 'packages', '1MD' + lesson, 'grounded.script.json');
  if (!fs.existsSync(file)) throw new Error('Grounded Script not found for ' + packageId);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function verifyTtsAudioGate(packageId: string): GateDResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const script = loadGroundedScript(packageId);
  const config = getTtsGatewayConfig();

  if (script.packageId !== packageId) blockers.push('TTS package ownership mismatch.');
  if (script.contentPolicy !== 'SOURCE_AUTHORITATIVE_READ_ONLY') blockers.push('TTS input must remain SOURCE_AUTHORITATIVE_READ_ONLY.');
  if (script.storage?.sourceOfTruth !== 'GOOGLE_DRIVE') blockers.push('Grounded Script source of truth must remain Google Drive.');

  if (config.provider !== 'LOCAL_VIENEUV3') blockers.push('Gate D FREE/LOCAL provider must be LOCAL_VIENEUV3.');
  if (config.voiceProfile !== 'PHAM_TUYEN') blockers.push('Gate D voice profile must be PHAM_TUYEN.');
  if (config.model !== 'vieneu-v3-turbo') blockers.push('Gate D model must be vieneu-v3-turbo.');
  if (!config.localUrl) {
    blockers.push('VieNeu runtime endpoint is not configured.');
    warnings.push('Configure VIENEU_TTS_URL at runtime; never commit the endpoint credential or local runtime into Git.');
  }

  if (config.maxCacheBytes > 64 * 1024 * 1024) blockers.push('TTS cache exceeds 64 MB safety limit.');
  if (config.maxCacheEntries > 16) blockers.push('TTS cache entry limit exceeds 16.');
  if (script.audioStorage?.provider !== 'GOOGLE_DRIVE') {
    blockers.push('Audio long-term storage policy must declare GOOGLE_DRIVE.');
  }
  if (script.audioStorage?.repositoryCommitAllowed !== false) {
    blockers.push('Generated audio must not be committed to the repository.');
  }

  return {
    gate: 'D_TTS_AUDIO',
    packageId,
    ready: blockers.length === 0,
    provider: config.provider,
    voiceProfile: config.voiceProfile,
    model: config.model,
    browserTtsAllowed: false,
    cachePolicy: 'EPHEMERAL_MEMORY_MAX_16_ENTRIES_64MB',
    audioStorage: script.audioStorage?.provider || 'UNKNOWN',
    blockers,
    warnings
  };
}
