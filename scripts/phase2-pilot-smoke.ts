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
    checksum: manifest.sources[0].sha256,
    packageId: manifest.packageId
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
    checksum: manifest.sources[1].sha256,
    packageId: manifest.packageId
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

// Cross-package guard: a source owned by 1MD2 cannot be attached to 1MD1.
const foreignLevel1: RegisteredDocument = {
  ...level1,
  sourceId: 'SRC-1MD2-L1',
  filename: '1.MĐ2.docx',
  metadata: { ...level1.metadata, packageId: 'LPKG-1MD2-001' }
};

let rejectedForeignSource = false;
try {
  registerAndBuildPilotPackage({
    courseId: manifest.courseId,
    packageId: manifest.packageId,
    level1: foreignLevel1,
    level3,
    mapping: manifest.timing.blocks
  });
} catch {
  rejectedForeignSource = true;
}

if (!rejectedForeignSource) {
  throw new Error('Cross-package authoritative source guard failed.');
}

console.log('PHASE 2 1MD1 PILOT BUILD + SOURCE ISOLATION: PASS');
console.log(JSON.stringify(artifact, null, 2));
