import { resolvePrimaryPackageSourceIds } from '../src/services/courseEngine/groundedScriptService';

const sources = [
  { sourceId: 'SRC-1MD3-L1', level: 1, documentType: 'DOCX' },
  { sourceId: 'SRC-1MD3-L3', level: 3, documentType: 'PPTX' }
];
const resolved = resolvePrimaryPackageSourceIds(sources);
if (!resolved.ids.has('SRC-1MD3-L1') || !resolved.ids.has('SRC-1MD3-L3')) {
  throw new Error('Grounded Script must accept the current lesson’s own Level 1 and Level 3 sources.');
}
if (resolved.ids.has('SRC-1MD2-L1') || resolved.ids.has('SRC-1MD2-L3')) {
  throw new Error('Grounded Script must not accept hard-coded MĐ2 sources for MĐ3.');
}
if (resolved.level1SourceId !== 'SRC-1MD3-L1' || resolved.level3SourceId !== 'SRC-1MD3-L3') {
  throw new Error('Primary source levels/types were not resolved correctly.');
}
const incomplete = resolvePrimaryPackageSourceIds([{ sourceId: 'SRC-1MD3-L3', level: 3, documentType: 'PPTX' }]);
if (incomplete.level1SourceId || incomplete.ids.has('SRC-1MD3-L1')) {
  throw new Error('Missing Level 1 DOCX must not be silently treated as ready.');
}
console.log('GROUNDED SOURCE OWNERSHIP SMOKE TEST — PASS');
