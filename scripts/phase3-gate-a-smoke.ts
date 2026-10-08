import { verifySourceOnboarding } from '../src/services/courseEngine/sourceOnboardingService';

const result = verifySourceOnboarding('LPKG-1MD2-001');

if (!result.ready) throw new Error('Gate A failed: ' + result.blockers.join('; '));
if (result.sourceChecks.level1.filename !== '1.MĐ2.docx') throw new Error('Unexpected Level 1 source.');
if (result.sourceChecks.level3.filename !== '1.MĐ2.pptx') throw new Error('Unexpected Level 3 source.');
if (result.sourceChecks.level3.slideCount !== 55) throw new Error('Bài 2 must declare 55 slides.');
if (result.slideCoverage.coverage !== '1..55' || !result.slideCoverage.valid) throw new Error('Bài 2 slide coverage must be 1..55.');
if (result.sourceChecks.level1.packageId !== 'LPKG-1MD2-001' || result.sourceChecks.level3.packageId !== 'LPKG-1MD2-001') {
  throw new Error('Bài 2 authoritative sources must be package-owned.');
}
if (!result.timing.conflictReviewRequired) throw new Error('Bài 2 source timing conflict must remain visible for QC review.');

console.log('PHASE 3 GATE A — Bài 2 source onboarding: PASS');
console.log(JSON.stringify(result, null, 2));
