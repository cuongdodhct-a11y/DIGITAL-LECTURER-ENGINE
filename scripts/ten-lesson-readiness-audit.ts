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
    && typeof source?.filename === 'string'
    && source.filename.length > 0;
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
  if (!sourceIsDeclared(manifest, 'level3', lesson)) blockers.push('LEVEL3_PPTX_NOT_REGISTERED_FOR_PACKAGE');

  const expectedId = `LPKG-1MD${lesson}-001`;
  if (!lecture) blockers.push('LECTURE_PACKAGE_MISSING');
  else if (lecture.packageId !== expectedId) blockers.push('LECTURE_PACKAGE_OWNERSHIP_MISMATCH');

  if (!script) blockers.push('GROUNDED_SCRIPT_MISSING');
  else if (script.packageId !== expectedId) blockers.push('GROUNDED_SCRIPT_OWNERSHIP_MISMATCH');

  if (!mapping) blockers.push('RUNTIME_MAPPING_MISSING');
  else if (mapping.packageId !== expectedId) blockers.push('RUNTIME_MAPPING_OWNERSHIP_MISMATCH');

  if (!policy) blockers.push('TTS_AUDIO_POLICY_MISSING');
  else {
    if (policy.packageId !== expectedId) blockers.push('TTS_POLICY_OWNERSHIP_MISMATCH');
    const voice = policy.voice || {};
    if (voice.provider !== 'LOCAL_VIENEUV3' || voice.geminiAllowedForFreeLocal !== false || voice.browserSpeechSynthesisAllowed !== false) {
      blockers.push('FREE_LOCAL_TTS_POLICY_NOT_EXPLICIT');
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
    readiness: ready ? 'ARTIFACTS_PRESENT_NEEDS_RUNTIME_QC' : 'CONTENT_PENDING',
    blockers: [...new Set(blockers)]
  });
}

console.log(JSON.stringify({
  audit: 'TEN_LESSON_SOURCE_AND_RUNTIME_READINESS',
  scope: '1MD2-1MD10; 1MD1 remains the protected regression package',
  note: 'Registered source metadata is not proof that the source file is accessible or that runtime/audio passed. This audit checks repository artifacts and package ownership only.',
  falseReadyCount,
  lessons: report
}, null, 2));

if (falseReadyCount > 0) {
  console.error('Readiness audit found package statuses that claim READY while required artifacts are missing.');
  process.exitCode = 1;
}
