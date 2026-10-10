import { auditTenLessonReadiness } from '../src/services/courseEngine/tenLessonReadinessAudit';

const audit = auditTenLessonReadiness();
if (audit.packageCount !== 10) throw new Error(`Expected 10 lesson packages, got ${audit.packageCount}`);
if (audit.items.length !== 10) throw new Error('Readiness audit must report every lesson.');
if (audit.items.some((item) => !/^LPKG-1MD(10|[1-9])-001$/.test(item.packageId))) {
  throw new Error('Unexpected package ID in the 1MD course catalog.');
}
if (audit.tts.provider !== 'LOCAL_VIENEUV3') throw new Error('FREE/LOCAL readiness must default to VieNeu local.');
if (audit.tts.browserSpeechSynthesisAllowed !== false) throw new Error('Browser SpeechSynthesis must remain disabled.');
if (audit.tts.geminiAllowedForFreeLocal !== false) throw new Error('Gemini must remain disabled for FREE/LOCAL.');
if (audit.cache.maxBytes !== 64 * 1024 * 1024 || audit.cache.maxEntries !== 16) {
  throw new Error('TTS in-memory cache limits changed unexpectedly.');
}
const lesson2 = audit.items.find((item) => item.lessonNumber === 2);
if (!lesson2?.contentArtifactsReady) throw new Error('Expected existing 1MD2 content artifacts to be detected.');
console.log('TEN-LESSON READINESS AUDIT — PASS');
console.log(JSON.stringify({
  packageCount: audit.packageCount,
  contentReadyCount: audit.contentReadyCount,
  runtimeArtifactReadyCount: audit.runtimeArtifactReadyCount,
  missingLessons: audit.items.filter((item) => !item.contentArtifactsReady).map((item) => item.lessonCode),
  cacheMaxBytes: audit.cache.maxBytes
}, null, 2));
