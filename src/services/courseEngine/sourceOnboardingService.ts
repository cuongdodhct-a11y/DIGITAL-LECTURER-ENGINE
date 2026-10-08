import fs from 'fs';
import path from 'path';

export interface SourceOnboardingResult {
  gate: 'A_SOURCE_ONBOARDING';
  packageId: string;
  courseId: string;
  lessonNumber: number;
  lessonCode: string;
  ready: boolean;
  sourceChecks: {
    level1: { present: boolean; filename?: string; documentType?: string; packageId?: string };
    level3: { present: boolean; filename?: string; documentType?: string; slideCount?: number; packageId?: string };
  };
  slideCoverage: { declared: boolean; coverage?: string; slideCount?: number; valid: boolean };
  timing: { status?: string; conflictReviewRequired: boolean; note?: string };
  blockers: string[];
  warnings: string[];
}

export function loadPackageManifest(packageId: string): any {
  const match = packageId.match(/^LPKG-1MD(\d+)-001$/);
  if (!match) throw new Error('Unsupported packageId: ' + packageId);
  const lessonNumber = Number(match[1]);
  const file = path.join(process.cwd(), 'data', 'courses', '1MD', 'packages', '1MD' + lessonNumber, 'package.manifest.json');
  if (!fs.existsSync(file)) throw new Error('Package manifest not found for ' + packageId + '.');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function verifySourceOnboarding(packageId: string): SourceOnboardingResult {
  const manifest = loadPackageManifest(packageId);
  const level1 = manifest.sources?.level1;
  const level3 = manifest.sources?.level3;
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!level1 || level1.documentType !== 'DOCX') blockers.push('Missing authoritative Level 1 DOCX source.');
  if (!level3 || level3.documentType !== 'PPTX') blockers.push('Missing authoritative Level 3 PPTX source.');

  const slideCount = level3?.slideCount;
  const coverage = manifest.timing?.slideCoverage;
  const declaredCoverage = typeof coverage === 'string' && /^1\.\.\d+$/.test(coverage);
  const coverageEnd = declaredCoverage ? Number(coverage.split('..')[1]) : undefined;
  const slideCoverageValid = Boolean(
    declaredCoverage &&
    Number.isInteger(slideCount) &&
    coverageEnd === slideCount &&
    coverage === '1..' + slideCount
  );
  if (!slideCoverageValid) blockers.push('Level 3 slide coverage is missing or invalid.');

  if (level1?.packageId !== packageId || level3?.packageId !== packageId) {
    blockers.push('Authoritative source ownership does not match packageId.');
  }

  const conflictReviewRequired =
    manifest.timing?.mappingStatus === 'SOURCE_TIMING_CONFLICT_REVIEW_REQUIRED' ||
    manifest.qc?.timing === 'SOURCE_CONFLICT_REVIEW_REQUIRED';

  if (conflictReviewRequired) {
    warnings.push('Source timing conflict requires lecturer/QC review; values must not be silently normalized.');
  }

  return {
    gate: 'A_SOURCE_ONBOARDING',
    packageId,
    courseId: manifest.courseId,
    lessonNumber: manifest.lessonNumber,
    lessonCode: manifest.lessonCode,
    ready: blockers.length === 0,
    sourceChecks: {
      level1: { present: Boolean(level1), filename: level1?.filename, documentType: level1?.documentType, packageId: level1?.packageId },
      level3: { present: Boolean(level3), filename: level3?.filename, documentType: level3?.documentType, slideCount: level3?.slideCount, packageId: level3?.packageId }
    },
    slideCoverage: { declared: declaredCoverage, coverage, slideCount, valid: slideCoverageValid },
    timing: {
      status: manifest.timing?.mappingStatus || manifest.qc?.timing,
      conflictReviewRequired,
      note: manifest.timing?.note
    },
    blockers,
    warnings
  };
}
