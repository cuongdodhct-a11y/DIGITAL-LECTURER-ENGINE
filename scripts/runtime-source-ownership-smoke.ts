import { resolveRuntimeSourceRefs, RuntimeSourceRef } from '../src/services/courseEngine/runtimePackageService';

const packageId = 'LPKG-1MD3-001';
const sources: RuntimeSourceRef[] = [
  { sourceId: 'SRC-1MD3-L1', level: 1, filename: '1.MĐ3.docx', documentType: 'DOCX', role: 'Nội dung chuẩn MĐ3', packageId },
  { sourceId: 'SRC-1MD3-L3', level: 3, filename: '1.MĐ3.pptx', documentType: 'PPTX', role: 'Khung slide MĐ3', packageId }
];
const resolved = resolveRuntimeSourceRefs(sources, packageId);
if (resolved.level1.sourceId !== 'SRC-1MD3-L1') throw new Error('Runtime must resolve MĐ3 Level 1 source dynamically.');
if (resolved.level3.sourceId !== 'SRC-1MD3-L3') throw new Error('Runtime must resolve MĐ3 Level 3 source dynamically.');
if (resolved.level1.filename === '1.MĐ2.docx' || resolved.level3.filename === '1.MĐ2.pptx') {
  throw new Error('Runtime source resolver must not reuse MĐ2 source metadata for another lesson.');
}
let rejectedOwnership = false;
try {
  resolveRuntimeSourceRefs(sources.map((source) => ({ ...source, packageId: 'LPKG-1MD2-001' })), packageId);
} catch { rejectedOwnership = true; }
if (!rejectedOwnership) throw new Error('Runtime must reject cross-package source ownership.');
let rejectedTypes = false;
try {
  resolveRuntimeSourceRefs(sources.map((source) => source.level === 3 ? { ...source, documentType: 'DOCX' } : source), packageId);
} catch { rejectedTypes = true; }
if (!rejectedTypes) throw new Error('Runtime must reject invalid Level 3 source type.');
console.log('RUNTIME SOURCE OWNERSHIP SMOKE TEST — PASS');
