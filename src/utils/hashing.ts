/**
 * Digital Lecturer Engine - Deterministic Hashing Utilities
 */

/**
 * Computes deterministic 32-bit FNV-1a hash formatted as hexadecimal string.
 * Works seamlessly in both Node.js and Browser environments without native crypto dependencies.
 */
export function hashString(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Computes deterministic audio cache key according to Phase 1.5.8A:
 * packageId + teachingPointId + scriptId + voiceProfileId + ttsModel + textHash
 */
export function generateAudioCacheKey(params: {
  text: string;
  voiceProfileId: string;
  model: string;
  language?: string;
  speakingStyle?: string;
  packageId?: string;
  teachingPointId?: string;
  scriptId?: string;
}): string {
  const textHash = hashString(params.text);
  const pkg = params.packageId || 'LPKG-1MD1-001';
  const tp = params.teachingPointId || 'TP-GEN';
  const script = params.scriptId || 'SCRIPT-GEN';
  const voice = params.voiceProfileId;
  const model = params.model;
  return `${pkg}::${tp}::${script}::${voice}::${model}::${textHash}`;
}
