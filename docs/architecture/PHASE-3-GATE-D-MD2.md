# Phase 3 — Gate D: MĐ2 TTS / Audio

## Status
**CI implementation gate: PASS**

The Gate D implementation is verified by GitHub Actions together with TypeScript/lint, production build, Bài 1 regression, Gate A, Gate B, Gate C, API/package isolation, and the Gate D TTS gateway smoke.

## Approved provider policy
- Provider: `LOCAL_VIENEUV3`
- Model: `vieneu-v3-turbo`
- Voice profile: `PHAM_TUYEN`
- Browser SpeechSynthesis: **DENY**
- Gemini TTS for FREE/LOCAL: **DENY**
- Input must be an exact grounded TeachingPoint script.
- Every synthesis request carries `packageId` and `teachingPointId` for provenance.

## Runtime contract
The actual VieNeu runtime is external to this repository. Configure `VIENEU_TTS_URL` at deployment/runtime. No model weights, audio files, credentials, or runtime environment are committed to Git.

The gateway expects POST JSON containing `text`, `voiceProfile`, `model`, `packageId`, `teachingPointId`, optional `scriptId`, and `responseFormat: "wav"`. It returns `audioBase64` plus optional `mimeType` and `durationEstimateSeconds`.

## Cache / storage policy
- Runtime cache is memory-only and ephemeral.
- Maximum 16 entries / 64 MB.
- Generated audio is **not committed to GitHub**.
- Long-term audio storage policy: Google Drive.
- Google Drive credentials/tokens remain outside source control.

## API
- `GET /api/course-engine/packages/:packageId/tts-audio-status`
- `POST /api/course-engine/packages/:packageId/tts/synthesize`
- `GET /api/course-engine/tts/cache-status`

The synthesis endpoint rejects text that is not exactly the grounded TeachingPoint script.

## Verification boundary
The CI smoke test verifies the gateway contract with a local mock provider. It does **not** claim that the real VieNeu ONNX runtime is running inside GitHub Actions.

- **Gate D software/policy implementation: PASS**
- **Real MacBook VieNeu runtime verification: PENDING until `VIENEU_TTS_URL` points to the actual local runtime.**

This separation is intentional and prevents a false production-ready claim.