import fs from 'fs';
import path from 'path';
import { COURSE_1MD } from './courseRegistry';
import { getTtsGatewayConfig, getTtsCacheStats } from './ttsGatewayService';

export interface LessonReadinessAuditItem {
  packageId: string;
  lessonNumber: number;
  lessonCode: string;
  title: string;
  contentArtifactsReady: boolean;
  runtimeArtifactsReady: boolean;
  missingArtifacts: string[];
  notes: string[];
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

/**
 * Read-only audit for the ten isolated 1MD lesson packages.
 * This reports repository evidence only; it never generates or edits academic content.
 */
export function auditTenLessonReadiness() {
  const items: LessonReadinessAuditItem[] = COURSE_1MD.packages.map((lesson) => {
    const root = `data/courses/1MD/packages/${lesson.lessonCode}`;
    const notes: string[] = [];
    const missingArtifacts: string[] = [];
    let contentArtifactsReady = false;
    let runtimeArtifactsReady = false;

    if (lesson.lessonNumber === 1) {
      contentArtifactsReady =
        exists('src/services/lectureSequence/productionDefaultPackage.ts') &&
        exists('data/registeredDocuments.json');
      if (!contentArtifactsReady) missingArtifacts.push('production 1MD1 source package');
      notes.push('1MD1 uses the existing production package provider; do not rewrite it.');
    } else {
      const required = [
        'lecture.package.json',
        'grounded.script.json',
        'runtime.mapping.json',
        'tts.audio.policy.json'
      ];
      const found = required.filter((file) => exists(`${root}/${file}`));
      missingArtifacts.push(...required.filter((file) => !found.includes(file)).map((file) => `${root}/${file}`));
      contentArtifactsReady = found.includes('lecture.package.json') && found.includes('grounded.script.json');
      runtimeArtifactsReady = required.every((file) => found.includes(file));
    }

    if (!contentArtifactsReady) notes.push('Content package is not ready; do not synthesize or teach this lesson.');
    if (contentArtifactsReady && !runtimeArtifactsReady) notes.push('Content exists, but the complete runtime artifact set is not verified.');
    if (runtimeArtifactsReady) notes.push('All expected repository artifacts are present; gate checks and local playback still need verification.');

    return {
      packageId: lesson.packageId,
      lessonNumber: lesson.lessonNumber,
      lessonCode: lesson.lessonCode,
      title: lesson.title,
      contentArtifactsReady,
      runtimeArtifactsReady,
      missingArtifacts,
      notes
    };
  });

  const tts = getTtsGatewayConfig();
  const cache = getTtsCacheStats();
  return {
    courseId: COURSE_1MD.courseId,
    packageCount: items.length,
    contentReadyCount: items.filter((item) => item.contentArtifactsReady).length,
    runtimeArtifactReadyCount: items.filter((item) => item.runtimeArtifactsReady).length,
    tts: {
      provider: tts.provider,
      voiceProfile: tts.voiceProfile,
      model: tts.model,
      localEndpointConfigured: Boolean(tts.localUrl),
      browserSpeechSynthesisAllowed: false,
      geminiAllowedForFreeLocal: false
    },
    cache: {
      entries: cache.entries,
      bytes: cache.bytes,
      maxEntries: cache.maxEntries,
      maxBytes: cache.maxBytes,
      persistence: 'IN_MEMORY_ONLY'
    },
    items
  };
}
