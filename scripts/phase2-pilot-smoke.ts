import fs from 'fs';
import { registerAndBuildPilotPackage } from '../src/services/courseEngine/packageBuildService';
import { RegisteredDocument } from '../src/types/source';

function loadManifest(lessonNumber: number) {
  return JSON.parse(
    fs.readFileSync(`data/courses/1MD/packages/1MD${lessonNumber}/package.manifest.json`, 'utf8')
  );
}

function toRegisteredDocuments(manifest: any): { level1: RegisteredDocument; level3: RegisteredDocument } {
  const l1 = Array.isArray(manifest.sources) ? manifest.sources.find((source: any) => source.level === 1) : manifest.sources.level1;
  const l3 = Array.isArray(manifest.sources) ? manifest.sources.find((source: any) => source.level === 3) : manifest.sources.level3;

  return {
    level1: {
      sourceId: l1.sourceId,
      filename: l1.filename,
      documentType: 'DOCX',
      sourceLevel: 1,
      title: `${manifest.lessonCode} Level 1`,
      status: 'REGISTERED',
      extractedText: '[source verified outside CI]',
      metadata: {
        fileSize: l1.sizeBytes,
        extractedAt: new Date().toISOString(),
        packageId: manifest.packageId
      }
    },
    level3: {
      sourceId: l3.sourceId,
      filename: l3.filename,
      documentType: 'PPTX',
      sourceLevel: 3,
      title: `${manifest.lessonCode} Level 3`,
      slideCount: l3.slideCount,
      status: 'REGISTERED',
      extractedText: '[source verified outside CI]',
      metadata: {
        fileSize: l3.sizeBytes,
        extractedAt: new Date().toISOString(),
        packageId: manifest.packageId
      }
    }
  };
}

// Golden Reference regression: Bài 1 remains unchanged.
const manifest1 = JSON.parse(
  fs.readFileSync('data/courses/1MD/packages/1MD1/package.manifest.json', 'utf8')
);
const source1 = toRegisteredDocuments(manifest1);
const artifact1 = registerAndBuildPilotPackage({
  courseId: manifest1.courseId,
  packageId: manifest1.packageId,
  ...source1,
  mapping: manifest1.timing.blocks
});

if (
  artifact1.slideCount !== 52 ||
  artifact1.timing.totalActualSeconds !== 11100 ||
  artifact1.timing.varianceSeconds !== 0 ||
  artifact1.sourceRefs.length !== 2
) {
  throw new Error('Bài 1 Golden Reference regression assertions failed.');
}

// Bài 2 pilot: source pair is present and slide mapping covers all 55 slides.
// The source documents contain a 5-minute timing discrepancy; therefore the
// engine verifies structural coverage here but does not silently normalize it.
const manifest2 = loadManifest(2);
const source2 = toRegisteredDocuments(manifest2);
const artifact2 = registerAndBuildPilotPackage({
  courseId: manifest2.courseId,
  packageId: manifest2.packageId,
  ...source2,
  mapping: manifest2.timing.blocks.map((block: any) => ({
    blockId: block.blockId,
    slideStart: block.slideStart,
    slideEnd: block.slideEnd,
    durationSeconds: block.durationMinutes * 60
  }))
});

if (
  artifact2.slideCount !== 55 ||
  artifact2.sourceRefs.length !== 2 ||
  artifact2.timing.totalActualSeconds !== 10800 ||
  artifact2.timing.varianceSeconds !== 0
) {
  throw new Error('Bài 2 pilot structural assertions failed.');
}

if (manifest2.timing.mappingStatus !== 'SOURCE_TIMING_CONFLICT_REVIEW_REQUIRED') {
  throw new Error('Bài 2 timing conflict must remain explicitly flagged.');
}

// Cross-package guard: a source owned by Bài 2 cannot be attached to Bài 1.
const foreignLevel1: RegisteredDocument = {
  ...source1.level1,
  sourceId: source2.level1.sourceId,
  filename: source2.level1.filename,
  metadata: { ...source1.level1.metadata, packageId: manifest2.packageId }
};

let rejectedForeignSource = false;
try {
  registerAndBuildPilotPackage({
    courseId: manifest1.courseId,
    packageId: manifest1.packageId,
    level1: foreignLevel1,
    level3: source1.level3,
    mapping: manifest1.timing.blocks
  });
} catch {
  rejectedForeignSource = true;
}

if (!rejectedForeignSource) {
  throw new Error('Cross-package authoritative source guard failed.');
}

console.log('PHASE 2: Bài 1 regression + Bài 2 pilot + package isolation: PASS');
console.log(JSON.stringify({ artifact1, artifact2 }, null, 2));
