import { verifyLecturePackage } from '../src/services/courseEngine/lecturePackageService';

const result = verifyLecturePackage('LPKG-1MD2-001');

if (!result.ready) throw new Error('Gate B failed: ' + result.blockers.join('; '));
if (result.slideCount !== 55) throw new Error('Gate B must preserve 55 slides.');
if (result.teachingBlockCount !== 7) throw new Error('Gate B must produce 7 Teaching Blocks.');
if (result.mappedMinutes !== 180) throw new Error('Mapped source block timing must remain 180 minutes.');
if (!result.timingConflictReviewRequired) throw new Error('Gate B must preserve source timing conflict for QC.');

console.log('PHASE 3 GATE B — MĐ2 Lecture Package: PASS');
console.log(JSON.stringify(result, null, 2));
