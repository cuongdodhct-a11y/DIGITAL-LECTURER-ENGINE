import { verifyGroundedScript } from '../src/services/courseEngine/groundedScriptService';

const result = verifyGroundedScript('LPKG-1MD2-001');

if (!result.ready) throw new Error('Gate C failed: ' + result.blockers.join('; '));
if (result.totalMinutes !== 180) throw new Error('Gate C timing must be exactly 180 minutes.');
if (result.teachingBlockCount !== 7) throw new Error('Gate C must cover 7 Teaching Blocks.');
if (result.teachingPointCount < 10) throw new Error('Gate C must contain grounded Teaching Points.');
if (result.claimCount < result.teachingPointCount) throw new Error('Every Teaching Point must have at least one Claim.');
if (result.unsupportedClaimCount !== 0) throw new Error('Gate C cannot contain unsupported claims.');
if (!result.sourceCoverageComplete) throw new Error('Gate C claim-to-source coverage is incomplete.');
if (result.storageProvider !== 'GOOGLE_DRIVE') throw new Error('Gate C content storage must be Google Drive.');

console.log('PHASE 3 GATE C — MĐ2 Grounded Script: PASS');
console.log(JSON.stringify(result, null, 2));
