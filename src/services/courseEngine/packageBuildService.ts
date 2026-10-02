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

export function registerAndBuildPilotPackage(params: {
  courseId: string;
  packageId: string;
  level1: RegisteredDocument;
  level3: RegisteredDocument;
  mapping: PackageBuildMapping[];
}): BuiltPackageArtifact {
  const pkg = assertLessonBelongsToCourse(params.courseId, params.packageId);
  registerPackageSource(params.courseId, params.packageId, {
    ...params.level1,
    metadata: { ...params.level1.metadata, checksum: params.level1.metadata.checksum || hashString(params.level1.extractedText) }
  });
  registerPackageSource(params.courseId, params.packageId, {
    ...params.level3,
    metadata: { ...params.level3.metadata, checksum: params.level3.metadata.checksum || hashString(params.level3.extractedText) }
  });

  const registered = assertPackageReadyForBuild(params.packageId);
  const level3 = registered.sources.get(3)!;
  const totalActualSeconds = params.mapping.reduce((sum, block) => sum + block.durationSeconds, 0);
  const totalPlannedSeconds = totalActualSeconds;

  if (!Number.isInteger(level3.slideCount) || level3.slideCount! < 1) {
    throw new Error(`Level 3 source ${level3.sourceId} has no valid slide count.`);
  }

  const covered = params.mapping
    .map(block => [block.slideStart, block.slideEnd] as const)
    .sort((a, b) => a[0] - b[0]);

  if (covered.length === 0 || covered[0][0] !== 1 || covered[covered.length - 1][1] !== level3.slideCount) {
    throw new Error('Slide mapping must cover the complete Level 3 slide range.');
  }

  for (let i = 1; i < covered.length; i++) {
    if (covered[i][0] !== covered[i - 1][1] + 1) {
      throw new Error('Slide mapping contains a gap or overlap.');
    }
  }

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
