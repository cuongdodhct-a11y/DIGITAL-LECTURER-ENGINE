import crypto from 'crypto';

export type TtsProvider = 'LOCAL_VIENEUV3' | 'GOOGLE_GEMINI';

export interface TtsRequest {
  text: string;
  packageId: string;
  teachingPointId: string;
  scriptId?: string;
  voiceProfile?: string;
  model?: string;
}

export interface TtsAudio {
  audioBase64: string;
  mimeType: string;
  durationEstimateSeconds: number;
  provider: TtsProvider;
  voiceProfile: string;
  model: string;
  cached: boolean;
}

export interface TtsGatewayConfig {
  provider: TtsProvider;
  localUrl?: string;
  voiceProfile: string;
  model: string;
  maxCacheEntries: number;
  maxCacheBytes: number;
}

interface CacheEntry {
  audio: Omit<TtsAudio, 'cached'>;
  bytes: number;
  lastUsed: number;
}

const cache = new Map<string, CacheEntry>();
let cacheBytes = 0;

function envProvider(): TtsProvider {
  const value = process.env.TTS_PROVIDER || 'LOCAL_VIENEUV3';
  if (value === 'LOCAL_VIENEUV3' || value === 'GOOGLE_GEMINI') return value;
  throw new Error('Unsupported TTS_PROVIDER: ' + value);
}

export function getTtsGatewayConfig(): TtsGatewayConfig {
  return {
    provider: envProvider(),
    localUrl: process.env.VIENEUTTS_URL || process.env.VIENEU_TTS_URL,
    voiceProfile: process.env.VIENEUTTS_VOICE_PROFILE || process.env.VIENEU_VOICE_PROFILE || 'PHAM_TUYEN',
    model: process.env.VIENEUTTS_MODEL || process.env.VIENEU_TTS_MODEL || 'vieneu-v3-turbo',
    maxCacheEntries: 16,
    maxCacheBytes: 64 * 1024 * 1024
  };
}

export function clearTtsCache(): void {
  cache.clear();
  cacheBytes = 0;
}

function makeCacheKey(request: TtsRequest, config: TtsGatewayConfig): string {
  return crypto.createHash('sha256').update(JSON.stringify({
    text: request.text,
    packageId: request.packageId,
    teachingPointId: request.teachingPointId,
    voiceProfile: request.voiceProfile || config.voiceProfile,
    model: request.model || config.model,
    provider: config.provider
  })).digest('hex');
}

function cacheGet(key: string): TtsAudio | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  entry.lastUsed = Date.now();
  return { ...entry.audio, cached: true };
}

function cacheSet(key: string, audio: Omit<TtsAudio, 'cached'>, maxEntries: number, maxBytes: number): void {
  const bytes = Buffer.byteLength(audio.audioBase64, 'base64');
  if (bytes > maxBytes) return;

  const previous = cache.get(key);
  if (previous) cacheBytes -= previous.bytes;
  cache.set(key, { audio, bytes, lastUsed: Date.now() });
  cacheBytes += bytes;

  while (cache.size > maxEntries || cacheBytes > maxBytes) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed)[0];
    if (!oldest) break;
    cacheBytes -= oldest[1].bytes;
    cache.delete(oldest[0]);
  }
}

function assertValidAudio(body: any): asserts body is { audioBase64: string; mimeType?: string; durationEstimateSeconds?: number } {
  if (!body || typeof body.audioBase64 !== 'string' || body.audioBase64.length === 0) {
    throw new Error('TTS provider returned no audioBase64.');
  }
  if (body.audioBase64.length > 96 * 1024 * 1024) {
    throw new Error('TTS provider response exceeds the gateway safety limit.');
  }
}

async function synthesizeLocal(request: TtsRequest, config: TtsGatewayConfig): Promise<Omit<TtsAudio, 'cached'>> {
  if (!config.localUrl) {
    throw new Error('LOCAL_VIENEUV3 is selected but VIENEU_TTS_URL is not configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(config.localUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        text: request.text,
        voiceProfile: request.voiceProfile || config.voiceProfile,
        model: request.model || config.model,
        packageId: request.packageId,
        teachingPointId: request.teachingPointId,
        scriptId: request.scriptId,
        responseFormat: 'wav'
      })
    });

    const raw = await response.text();
    let body: any;
    try { body = JSON.parse(raw); } catch { body = null; }

    if (!response.ok) {
      throw new Error(`VieNeu TTS provider HTTP ${response.status}: ${body?.error || raw.slice(0, 300)}`);
    }

    assertValidAudio(body);
    return {
      audioBase64: body.audioBase64,
      mimeType: body.mimeType || 'audio/wav',
      durationEstimateSeconds: Number(body.durationEstimateSeconds || Math.max(1, Math.round(request.text.length / 14))),
      provider: 'LOCAL_VIENEUV3',
      voiceProfile: request.voiceProfile || config.voiceProfile,
      model: request.model || config.model
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function synthesizeWithTtsGateway(request: TtsRequest): Promise<TtsAudio> {
  const text = request.text?.trim();
  if (!text) throw new Error('TTS text is required.');
  if (!request.packageId || !request.teachingPointId) {
    throw new Error('packageId and teachingPointId are required for provenance.');
  }

  const config = getTtsGatewayConfig();
  if (config.provider === 'GOOGLE_GEMINI') {
    throw new Error('GOOGLE_GEMINI is not the approved FREE/LOCAL Gate D provider. Use LOCAL_VIENEUV3.');
  }

  const key = makeCacheKey({ ...request, text }, config);
  const cached = cacheGet(key);
  if (cached) return cached;

  const audio = await synthesizeLocal({ ...request, text }, config);
  cacheSet(key, audio, config.maxCacheEntries, config.maxCacheBytes);
  return { ...audio, cached: false };
}

export function getTtsCacheStats(): { entries: number; bytes: number; maxEntries: number; maxBytes: number } {
  const config = getTtsGatewayConfig();
  return { entries: cache.size, bytes: cacheBytes, maxEntries: config.maxCacheEntries, maxBytes: config.maxCacheBytes };
}
