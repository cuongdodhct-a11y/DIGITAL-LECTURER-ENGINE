import fs from 'fs';
import { registerAndBuildPilotPackage } from '../src/services/courseEngine/packageBuildService';
import { RegisteredDocument } from '../src/types/source';

const manifest = JSON.parse(
  fs.readFileSync('data/courses/1MD/packages/1MD1/package.manifest.json', 'utf8')
);

const level1: RegisteredDocument = {
  sourceId: manifest.sources[0].sourceId,
  filename: manifest.sources[0].filename,
  documentType: 'DOCX',
  sourceLevel: 1,
  title: '1MĐ1 Level 1',
  status: 'REGISTERED',
  extractedText: '[source verified outside CI]',
  metadata: {
    fileSize: manifest.sources[0].sizeBytes,
    extractedAt: new Date().toISOString(),
    checksum: manifest.sources[0].sha256
  }
};

const level3: RegisteredDocument = {
  sourceId: manifest.sources[1].sourceId,
  filename: manifest.sources[1].filename,
  documentType: 'PPTX',
  sourceLevel: 3,
  title: '1MĐ1 Level 3',
  slideCount: manifest.sources[1].slideCount,
  status: 'REGISTERED',
  extractedText: '[source verified outside CI]',
  metadata: {
    fileSize: manifest.sources[1].sizeBytes,
    extractedAt: new Date().toISOString(),
    checksum: manifest.sources[1].sha256
  }
};

const artifact = registerAndBuildPilotPackage({
  courseId: manifest.courseId,
  packageId: manifest.packageId,
  level1,
  level3,
  mapping: manifest.timing.blocks
});

if (
  artifact.slideCount !== 52 ||
  artifact.timing.totalActualSeconds !== 11100 ||
  artifact.timing.varianceSeconds !== 0 ||
  artifact.sourceRefs.length !== 2
) {
  throw new Error('Phase 2 1MD1 pilot build assertions failed.');
}

console.log('PHASE 2 1MD1 PILOT BUILD: PASS');
console.log(JSON.stringify(artifact, null, 2));
