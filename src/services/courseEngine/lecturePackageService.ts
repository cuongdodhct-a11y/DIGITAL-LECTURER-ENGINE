import fs from 'fs';
import path from 'path';

export interface GateBResult {
  gate: 'B_LECTURE_PACKAGE';
  packageId: string;
  ready: boolean;
  slideCount: number;
  teachingBlockCount: number;
  mappedMinutes: number;
  timingConflictReviewRequired: boolean;
  blockers: string[];
  warnings: string[];
}

export function loadLecturePackage(packageId: string): any {
  const match = packageId.match(/^LPKG-1MD(\d+)-001$/);
  if (!match) throw new Error('Unsupported packageId: ' + packageId);
  const lessonNumber = Number(match[1]);
  const file = path.join(process.cwd(), 'data', 'courses', '1MD', 'packages', '1MD' + lessonNumber, 'lecture.package.json');
  if (!fs.existsSync(file)) throw new Error('Lecture package not found for ' + packageId + '.');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function verifyLecturePackage(packageId: string): GateBResult {
  const pkg = loadLecturePackage(packageId);
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (pkg.gate !== 'B_LECTURE_PACKAGE') blockers.push('Invalid Gate B marker.');
  if (pkg.packageId !== packageId) blockers.push('Lecture package ownership mismatch.');
  if (pkg.contentPolicy !== 'SOURCE_AUTHORITATIVE_READ_ONLY') blockers.push('Source protection policy is missing.');
  if (!Array.isArray(pkg.sourceRefs) || pkg.sourceRefs.length < 2) blockers.push('Lecture package requires Level 1 and Level 3 source refs.');

  const authoritativeIds = new Set((pkg.sourceRefs || []).map((s: any) => s.sourceId));
  for (const source of pkg.sourceRefs || []) {
    if (source.packageId !== packageId) blockers.push('Source ' + source.sourceId + ' is not owned by package.');
  }

  const blocks = Array.isArray(pkg.teachingBlocks) ? pkg.teachingBlocks : [];
  if (blocks.length === 0) blockers.push('Lecture package has no Teaching Blocks.');

  const ids = new Set<string>();
  const ranges: Array<[number, number]> = blocks
    .map((b: any) => [b.slideStart, b.slideEnd] as [number, number])
    .sort((a: [number, number], b: [number, number]) => a[0] - b[0]);

  for (const block of blocks) {
    if (ids.has(block.id)) blockers.push('Duplicate TeachingBlock: ' + block.id);
    ids.add(block.id);
    if (!Number.isInteger(block.slideStart) || !Number.isInteger(block.slideEnd) || block.slideStart < 1 || block.slideEnd < block.slideStart) {
      blockers.push('Invalid slide range for ' + block.id);
    }
    if (!Number.isFinite(block.durationSeconds) || block.durationSeconds <= 0) blockers.push('Invalid duration for ' + block.id);
    if (!Array.isArray(block.keyPoints) || block.keyPoints.length === 0) blockers.push('Missing key points for ' + block.id);
    for (const sourceId of block.sourceRefs || []) {
      if (!authoritativeIds.has(sourceId)) blockers.push('TeachingBlock ' + block.id + ' references unregistered source ' + sourceId);
    }
  }

  if (ranges.length === 0 || ranges[0][0] !== 1 || ranges[ranges.length - 1][1] !== pkg.sourceRefs.find((s: any) => s.level === 3)?.slideCount) {
    blockers.push('TeachingBlock mapping does not cover the complete slide range.');
  }
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i][0] !== ranges[i - 1][1] + 1) blockers.push('TeachingBlock mapping has a gap or overlap.');
  }

  const mappedMinutes = Math.round(blocks.reduce((sum: number, b: any) => sum + b.durationSeconds, 0) / 60);
  if (pkg.timingPlan?.status === 'SOURCE_TIMING_CONFLICT_REVIEW_REQUIRED') {
    warnings.push('Timing conflict is preserved for QC; Gate B does not normalize source timing.');
  }

  if (pkg.provenance?.commonSourceUsage !== 'NONE') {
    warnings.push('Package declares common-source usage; verify that no common source replaced primary content.');
  }

  return {
    gate: 'B_LECTURE_PACKAGE',
    packageId,
    ready: blockers.length === 0,
    slideCount: pkg.sourceRefs.find((s: any) => s.level === 3)?.slideCount || 0,
    teachingBlockCount: blocks.length,
    mappedMinutes,
    timingConflictReviewRequired: pkg.timingPlan?.status === 'SOURCE_TIMING_CONFLICT_REVIEW_REQUIRED',
    blockers,
    warnings
  };
}
