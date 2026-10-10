import fs from 'fs';
import path from 'path';
import { loadLecturePackage } from './lecturePackageService';

export interface PrimaryPackageSourceIds {
  level1SourceId?: string;
  level3SourceId?: string;
  ids: Set<string>;
}

/** Resolve claim-eligible sources from the current package, never from a hard-coded lesson. */
export function resolvePrimaryPackageSourceIds(sourceRefs: Array<{ sourceId: string; level: number; documentType: string }>): PrimaryPackageSourceIds {
  const level1 = sourceRefs.find((source) => source.level === 1 && source.documentType === 'DOCX');
  const level3 = sourceRefs.find((source) => source.level === 3 && source.documentType === 'PPTX');
  const ids = new Set<string>();
  if (level1?.sourceId) ids.add(level1.sourceId);
  if (level3?.sourceId) ids.add(level3.sourceId);
  return { level1SourceId: level1?.sourceId, level3SourceId: level3?.sourceId, ids };
}

export interface GateCResult {
  gate: 'C_GROUNDED_SCRIPT';
  packageId: string;
  ready: boolean;
  totalMinutes: number;
  teachingBlockCount: number;
  teachingPointCount: number;
  claimCount: number;
  unsupportedClaimCount: number;
  sourceCoverageComplete: boolean;
  storageProvider: 'GOOGLE_DRIVE';
  blockers: string[];
  warnings: string[];
}

export function loadGroundedScript(packageId: string): any {
  const match = packageId.match(/^LPKG-1MD(\d+)-001$/);
  if (!match) throw new Error('Unsupported packageId: ' + packageId);
  const lessonNumber = Number(match[1]);
  const file = path.join(
    process.cwd(),
    'data',
    'courses',
    '1MD',
    'packages',
    '1MD' + lessonNumber,
    'grounded.script.json'
  );
  if (!fs.existsSync(file)) throw new Error('Grounded Script not found for ' + packageId + '.');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function verifyGroundedScript(packageId: string): GateCResult {
  const pkg = loadLecturePackage(packageId);
  const script = loadGroundedScript(packageId);
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (script.gate !== 'C_GROUNDED_SCRIPT') blockers.push('Invalid Gate C marker.');
  if (script.packageId !== packageId) blockers.push('Grounded Script ownership mismatch.');
  if (script.contentPolicy !== 'SOURCE_AUTHORITATIVE_READ_ONLY') {
    blockers.push('Grounded Script must preserve SOURCE_AUTHORITATIVE_READ_ONLY.');
  }
  if (script.storage?.provider !== 'GOOGLE_DRIVE') {
    blockers.push('Application content storage must be GOOGLE_DRIVE.');
  }
  if (script.storage?.sourceOfTruth !== 'GOOGLE_DRIVE') {
    blockers.push('Google Drive must be declared as the content source of truth.');
  }

  const primarySources = resolvePrimaryPackageSourceIds(pkg.sourceRefs || []);
  if (!primarySources.level1SourceId) blockers.push('Gate C requires a package-owned Level 1 DOCX source.');
  if (!primarySources.level3SourceId) blockers.push('Gate C requires a package-owned Level 3 PPTX source.');

  const packageBlocks = Array.isArray(pkg.teachingBlocks) ? pkg.teachingBlocks : [];
  const scriptBlocks = Array.isArray(script.teachingBlocks) ? script.teachingBlocks : [];
  if (scriptBlocks.length !== packageBlocks.length) {
    blockers.push('Gate C must cover every Gate B Teaching Block.');
  }

  const packageBlockIds = new Set(packageBlocks.map((b: any) => b.id));
  const scriptBlockIds = new Set(scriptBlocks.map((b: any) => b.blockId));
  for (const id of packageBlockIds) {
    if (!scriptBlockIds.has(id)) blockers.push('Missing Grounded Script for TeachingBlock ' + id);
  }
  for (const id of scriptBlockIds) {
    if (!packageBlockIds.has(id)) blockers.push('Grounded Script references unknown TeachingBlock ' + id);
  }

  let teachingPointCount = 0;
  let claimCount = 0;
  let unsupportedClaimCount = 0;
  let sourceCoverageComplete = true;

  for (const block of scriptBlocks) {
    const sourceBlock = packageBlocks.find((b: any) => b.id === block.blockId);
    if (!sourceBlock) continue;

    if (block.slideStart !== sourceBlock.slideStart || block.slideEnd !== sourceBlock.slideEnd) {
      blockers.push('Slide range mismatch for ' + block.blockId);
    }
    if (block.durationSeconds !== sourceBlock.durationSeconds) {
      blockers.push('Timing mismatch for ' + block.blockId);
    }

    const points = Array.isArray(block.teachingPoints) ? block.teachingPoints : [];
    if (points.length === 0) blockers.push('No Teaching Points for ' + block.blockId);

    for (const point of points) {
      teachingPointCount += 1;
      if (!point.id || !point.title || !point.script) {
        blockers.push('Incomplete Teaching Point in ' + block.blockId);
      }

      const claims = Array.isArray(point.claims) ? point.claims : [];
      if (claims.length === 0) {
        blockers.push('Teaching Point ' + point.id + ' has no Claim→Source evidence.');
      }

      for (const claim of claims) {
        claimCount += 1;
        const refs = Array.isArray(claim.sourceRefs) ? claim.sourceRefs : [];
        if (refs.length === 0) {
          sourceCoverageComplete = false;
          blockers.push('Claim ' + claim.id + ' has no sourceRefs.');
        }

        for (const ref of refs) {
          if (!primarySources.ids.has(ref)) {
            sourceCoverageComplete = false;
            blockers.push('Claim ' + claim.id + ' references non-primary source ' + ref);
          }
        }

        if (claim.isUnsupported === true || claim.confidence === 'UNSUPPORTED') {
          unsupportedClaimCount += 1;
          blockers.push('Unsupported claim detected: ' + claim.id);
        }
      }

      if (Array.isArray(point.unsupportedClaims) && point.unsupportedClaims.length > 0) {
        unsupportedClaimCount += point.unsupportedClaims.length;
        blockers.push('Teaching Point ' + point.id + ' contains unsupported claims.');
      }
    }
  }

  if (unsupportedClaimCount > 0) {
    blockers.push('Gate C cannot pass with unsupported claims.');
  }

  const expectedMinutes = pkg.timingPlan?.approvedMinutes ?? pkg.timingPlan?.mappedMinutes;
  const totalMinutes = Math.round(
    scriptBlocks.reduce((sum: number, b: any) => sum + Number(b.durationSeconds || 0), 0) / 60
  );

  if (totalMinutes !== expectedMinutes) {
    blockers.push('Grounded Script timing must equal approved package timing.');
  }

  if (script.qc?.unsupportedClaimCheck !== 'PASS') {
    blockers.push('Unsupported-claim QC is not PASS.');
  }
  if (script.qc?.claimSourceCoverage !== 'PASS') {
    blockers.push('Claim→Source coverage QC is not PASS.');
  }

  if (script.storage?.folderId) {
    warnings.push('Google Drive folderId is configured in package metadata; keep credentials outside source control.');
  } else {
    warnings.push('Google Drive folderId is intentionally not hard-coded; configure it through deployment/runtime settings.');
  }

  return {
    gate: 'C_GROUNDED_SCRIPT',
    packageId,
    ready: blockers.length === 0,
    totalMinutes,
    teachingBlockCount: scriptBlocks.length,
    teachingPointCount,
    claimCount,
    unsupportedClaimCount,
    sourceCoverageComplete,
    storageProvider: 'GOOGLE_DRIVE',
    blockers,
    warnings
  };
}
