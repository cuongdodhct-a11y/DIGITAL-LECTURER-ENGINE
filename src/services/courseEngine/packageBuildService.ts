import { hashString } from '../../utils/hashing';
import { RegisteredDocument } from '../../types/source';
import { assertLessonBelongsToCourse } from './packageResolver';
import { assertPackageReadyForBuild, registerPackageSource } from './sourceRegistry';

export interface PackageBuildMapping {
  blockId: string;
  slideStart: number;
  slideEnd: number;
  durationSeconds: number;
}

export interface BuiltPackageArtifact {
  packageId: string;
  courseId: string;
  lessonNumber: number;
  lessonCode: string;
  status: 'READY_FOR_QC';
  sourceRefs: Array<{
    sourceId: string;
    level: 1 | 3;
    filename: string;
    checksum?: string;
  }>;
  slideCount: number;
  timing: {
    totalPlannedSeconds: number;
    totalActualSeconds: number;
    varianceSeconds: number;
    blocks: PackageBuildMapping[];
  };
  contentPolicy: 'SOURCE_AUTHORITATIVE_READ_ONLY';
}

function validateMapping(mapping: PackageBuildMapping[], slideCount: number): void {
  if (mapping.length === 0) throw new Error('Slide mapping cannot be empty.');

  const blockIds = new Set<string>();
  for (const block of mapping) {
    if (!block.blockId || blockIds.has(block.blockId)) {
      throw new Error('Slide mapping contains a missing or duplicate blockId.');
    }
    blockIds.add(block.blockId);

    if (!Number.isInteger(block.slideStart) || !Number.isInteger(block.slideEnd) ||
        block.slideStart < 1 || block.slideEnd < block.slideStart) {
      throw new Error('Invalid slide range for block ' + block.blockId + '.');
    }
    if (!Number.isFinite(block.durationSeconds) || block.durationSeconds <= 0) {
      throw new Error('Block ' + block.blockId + ' must have a positive duration.');
    }
  }

  const covered = mapping
    .map(block => [block.slideStart, block.slideEnd] as const)
    .sort((a, b) => a[0] - b[0]);

  if (covered[0][0] !== 1 || covered[covered.length - 1][1] !== slideCount) {
    throw new Error('Slide mapping must cover the complete Level 3 slide range.');
  }

  for (let i = 1; i < covered.length; i++) {
    if (covered[i][0] !== covered[i - 1][1] + 1) {
      throw new Error('Slide mapping contains a gap or overlap.');
    }
  }
}

export function registerAndBuildPilotPackage(params: {
  courseId: string;
  packageId: string;
  level1: RegisteredDocument;
  level3: RegisteredDocument;
  mapping: PackageBuildMapping[];
}): BuiltPackageArtifact {
  const pkg = assertLessonBelongsToCourse(params.courseId, params.packageId);

  if (params.level1.sourceLevel !== 1 || params.level1.documentType !== 'DOCX') {
    throw new Error('Pilot package requires a Level 1 DOCX source.');
  }
  if (params.level3.sourceLevel !== 3 || params.level3.documentType !== 'PPTX') {
    throw new Error('Pilot package requires a Level 3 PPTX source.');
  }

  if (params.level1.metadata.packageId !== params.packageId ||
      params.level3.metadata.packageId !== params.packageId) {
    throw new Error('Authoritative sources must declare ownership by package ' + params.packageId + '.');
  }

  registerPackageSource(params.courseId, params.packageId, {
    ...params.level1,
    metadata: {
      ...params.level1.metadata,
      checksum: params.level1.metadata.checksum || hashString(params.level1.extractedText),
      packageId: params.packageId
    }
  });

  registerPackageSource(params.courseId, params.packageId, {
    ...params.level3,
    metadata: {
      ...params.level3.metadata,
      checksum: params.level3.metadata.checksum || hashString(params.level3.extractedText),
      packageId: params.packageId
    }
  });

  const registered = assertPackageReadyForBuild(params.packageId);
  const level3 = registered.sources.get(3)!;
  const totalActualSeconds = params.mapping.reduce((sum, block) => sum + block.durationSeconds, 0);
  const totalPlannedSeconds = totalActualSeconds;

  if (!Number.isInteger(level3.slideCount) || level3.slideCount! < 1) {
    throw new Error('Level 3 source ' + level3.sourceId + ' has no valid slide count.');
  }

  validateMapping(params.mapping, level3.slideCount!);

  return {
    packageId: pkg.packageId,
    courseId: pkg.courseId,
    lessonNumber: pkg.lessonNumber,
    lessonCode: pkg.lessonCode,
    status: 'READY_FOR_QC',
    sourceRefs: [registered.sources.get(1)!, registered.sources.get(3)!].map(source => ({
      sourceId: source.sourceId,
      level: source.sourceLevel as 1 | 3,
      filename: source.filename,
      checksum: source.metadata.checksum
    })),
    slideCount: level3.slideCount!,
    timing: {
      totalPlannedSeconds,
      totalActualSeconds,
      varianceSeconds: totalActualSeconds - totalPlannedSeconds,
      blocks: params.mapping
    },
    contentPolicy: 'SOURCE_AUTHORITATIVE_READ_ONLY'
  };
}
