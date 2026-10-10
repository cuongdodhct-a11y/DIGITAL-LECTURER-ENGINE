import fs from 'node:fs';
import path from 'node:path';

type Json = Record<string, any>;
const root = process.cwd();
const base = path.join(root, 'data', 'courses', '1MD', 'packages');

function readJson(file: string): Json | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as Json;
  } catch {
    return null;
  }
}

function sourceIsDeclared(manifest: Json | null, level: 'level1' | 'level3', lesson: number): boolean {
  const source = manifest?.sources?.[level];
  const expectedType = level === 'level1' ? 'DOCX' : 'PPTX';
  return source?.required === true
    && source?.status === 'REGISTERED'
    && source?.documentType === expectedType
    && source?.packageId === `LPKG-1MD${lesson}-001`
    && source.filename === (level === 'level1' ? `1.MĐ${lesson}.docx` : `1.MĐ${lesson}.pptx`);
}

const report: Array<Record<string, unknown>> = [];
let falseReadyCount = 0;

for (let lesson = 2; lesson <= 10; lesson += 1) {
  const code = `1MD${lesson}`;
  const dir = path.join(base, code);
  const manifest = readJson(path.join(dir, 'package.manifest.json'));
  const lecture = readJson(path.join(dir, 'lecture.package.json'));
  const script = readJson(path.join(dir, 'grounded.script.json'));
  const mapping = readJson(path.join(dir, 'runtime.mapping.json'));
  const policy = readJson(path.join(dir, 'tts.audio.policy.json'));

  const blockers: string[] = [];
  if (!manifest) blockers.push('PACKAGE_MANIFEST_MISSING');
  if (!sourceIsDeclared(manifest, 'level1', lesson)) blockers.push('LEVEL1_DOCX_NOT_REGISTERED_FOR_PACKAGE');
  if (!sourceIsDeclared(manifest, 'level3', lesson)) blockers.push('LEVEL3_PPTX_NOT_REGISTERED_OR_NONCANONICAL_FILENAME');

  const inventory = manifest?.sourceInventory || {};
  if (inventory.rawSourceBytesVerifiedInRepository !== true) blockers.push('RAW_SOURCE_BYTES_NOT_VERIFIED_IN_REPOSITORY');

  // Source timing conflicts are a hard QC gate even if a derivative script
  // contains an approval flag. Never silently reconcile lesson-plan timings.
  const manifestTiming = manifest?.timing || {};
  const manifestTimingStatus = String(manifestTiming.mappingStatus || '');
  const manifestQcTiming = String(manifest?.qc?.timing || '');
  if (/CONFLICT|REVIEW_REQUIRED|PENDING|NOT_APPROVED/i.test(manifestTimingStatus)
      || /CONFLICT|REVIEW_REQUIRED|PENDING|NOT_APPROVED/i.test(manifestQcTiming)) {
    blockers.push('SOURCE_TIMING_CONFLICT_REQUIRES_REVIEW');
  }

  const expectedId = `LPKG-1MD${lesson}-001`;
  if (!lecture) blockers.push('LECTURE_PACKAGE_MISSING');
  else if (lecture.packageId !== expectedId) blockers.push('LECTURE_PACKAGE_OWNERSHIP_MISMATCH');

  if (!script) blockers.push('GROUNDED_SCRIPT_MISSING');
  else if (script.packageId !== expectedId) blockers.push('GROUNDED_SCRIPT_OWNERSHIP_MISMATCH');

  if (!mapping) blockers.push('RUNTIME_MAPPING_MISSING');
  else if (mapping.packageId !== expectedId) blockers.push('RUNTIME_MAPPING_OWNERSHIP_MISMATCH');

  // Validate structure only; never synthesize missing academic content or slide anchors.
  if (mapping) {
    const expectedSlides = Number(manifest?.sources?.level3?.slideCount || 0);
    const actualSlides = Number(mapping.slideCount || 0);
    const anchors = Array.isArray(mapping.teachingPoints) ? mapping.teachingPoints : [];
    if (!Number.isInteger(actualSlides) || actualSlides <= 0 || actualSlides !== expectedSlides) blockers.push('RUNTIME_MAPPING_SLIDE_COUNT_MISMATCH');
    if (anchors.length === 0) blockers.push('RUNTIME_MAPPING_HAS_NO_TEACHING_POINT_ANCHORS');
    const ids = new Set<string>();
    for (const anchor of anchors) {
      const id = String(anchor?.id || '');
      const slide = Number(anchor?.slideNumber);
      if (!id || ids.has(id)) blockers.push('RUNTIME_MAPPING_DUPLICATE_OR_EMPTY_TEACHING_POINT_ID');
      ids.add(id);
      if (!Number.isInteger(slide) || slide < 1 || slide > actualSlides) blockers.push('RUNTIME_MAPPING_SLIDE_ANCHOR_OUT_OF_RANGE');
    }
  }

  if (script) {
    const blocks = Array.isArray(script.teachingBlocks) ? script.teachingBlocks : [];
    if (blocks.length === 0) blockers.push('GROUNDED_SCRIPT_HAS_NO_TEACHING_BLOCKS');
    const blockIds = new Set<string>();
    const pointIds = new Set<string>();
    for (const block of blocks) {
      const blockId = String(block?.blockId || '');
      if (!blockId || blockIds.has(blockId)) blockers.push('GROUNDED_SCRIPT_DUPLICATE_OR_EMPTY_BLOCK_ID');
      blockIds.add(blockId);
      if (!Number.isFinite(Number(block?.durationSeconds)) || Number(block?.durationSeconds) <= 0) blockers.push('GROUNDED_SCRIPT_BLOCK_DURATION_INVALID');
      const points = Array.isArray(block?.teachingPoints) ? block.teachingPoints : [];
      if (points.length === 0) blockers.push('GROUNDED_SCRIPT_BLOCK_HAS_NO_TEACHING_POINTS');
      for (const point of points) {
        const pointId = String(point?.id || '');
        if (!pointId || pointIds.has(pointId)) blockers.push('GROUNDED_SCRIPT_DUPLICATE_OR_EMPTY_TEACHING_POINT_ID');
        pointIds.add(pointId);
        if (!Array.isArray(point?.claims) || point.claims.length === 0) blockers.push('GROUNDED_SCRIPT_TEACHING_POINT_HAS_NO_SOURCE_CLAIMS');
      }
    }
  }

  if (!policy) blockers.push('TTS_AUDIO_POLICY_MISSING');
  else {
    if (policy.packageId !== expectedId) blockers.push('TTS_POLICY_OWNERSHIP_MISMATCH');
    const voice = policy.voice || {};
    if (voice.provider !== 'LOCAL_VIENEUV3' || voice.geminiAllowedForFreeLocal !== false || voice.browserSpeechSynthesisAllowed !== false) {
      blockers.push('FREE_LOCAL_TTS_POLICY_NOT_EXPLICIT');
    }
    if (!['APPROVED', 'READY_FOR_QC'].includes(String(policy.status || ''))) {
      blockers.push('TTS_POLICY_NOT_QC_APPROVED');
    }
  }

  // Artifact existence alone is not runtime readiness. Draft content must remain blocked.
  if (lecture && !['READY_FOR_QC', 'APPROVED'].includes(String(lecture.status || ''))) {
    blockers.push('LECTURE_PACKAGE_NOT_QC_APPROVED');
  }
  if (script && !['READY_FOR_QC', 'APPROVED'].includes(String(script.status || ''))) {
    blockers.push('GROUNDED_SCRIPT_NOT_QC_APPROVED');
  }
  if (mapping && !['READY_FOR_QC', 'APPROVED'].includes(String(mapping.status || ''))) {
    blockers.push('RUNTIME_MAPPING_NOT_QC_APPROVED');
  }
  if (script) {
    const seconds = Number(script.timing?.totalSeconds || 0);
    if (!Number.isFinite(seconds) || seconds <= 0 || script.timing?.approval !== 'APPROVED') {
      blockers.push('SCRIPT_TIMING_NOT_APPROVED');
    }
  }

  if (lecture && script) {
    const sourceIds = new Set((lecture.sourceRefs || []).map((source: Json) => source.sourceId));
    const scriptSourceIds = new Set<string>();
    for (const block of script.teachingBlocks || []) {
      for (const point of block.teachingPoints || []) {
        for (const claim of point.claims || []) {
          for (const sourceId of claim.sourceRefs || []) scriptSourceIds.add(sourceId);
        }
      }
    }
    for (const sourceId of scriptSourceIds) {
      if (!sourceIds.has(sourceId)) blockers.push(`CLAIM_REFERENCES_FOREIGN_SOURCE:${sourceId}`);
    }
  }

  const declaredStatus = String(manifest?.status || 'MISSING');
  const ready = blockers.length === 0;
  if (!ready && /^(READY|READY_FOR_RUNTIME|PRODUCTION_READY|COMPLETE|APPROVED)$/i.test(declaredStatus)) falseReadyCount += 1;

  report.push({
    lesson: code,
    title: manifest?.title || 'UNKNOWN',
    declaredStatus,
    readiness: ready ? 'READY_FOR_RUNTIME_QC' : (blockers.some((item) => /MISSING|NOT_REGISTERED|NONCANONICAL|RAW_SOURCE_BYTES|MISMATCH|FOREIGN_SOURCE/.test(item)) ? 'CONTENT_PENDING' : 'ARTIFACTS_PRESENT_BUT_QC_BLOCKED'),
    blockers: [...new Set(blockers)]
  });
}

console.log(JSON.stringify({
  audit: 'TEN_LESSON_SOURCE_AND_RUNTIME_READINESS',
  scope: '1MD2-1MD10; 1MD1 remains the protected regression package',
  note: 'Registered source metadata is not proof that source bytes are accessible. Readiness requires package/script/mapping/TTS policy and positive duration to be explicitly QC-approved; this audit does not perform real TTS or listening tests.',
  falseReadyCount,
  lessons: report
}, null, 2));

if (falseReadyCount > 0) {
  console.error('Readiness audit found package statuses that claim READY while required artifacts are missing.');
  process.exitCode = 1;
}
