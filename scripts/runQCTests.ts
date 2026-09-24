import { runAllQCStabilityTests } from '../src/services/qualityControl/__tests__/qcStabilityTests';

console.log('=================================================================');
console.log('DIGITAL LECTURER ENGINE - QC ISSUE ID STABILITY TEST SUITE');
console.log('=================================================================\n');

const suite = runAllQCStabilityTests();

for (const res of suite.results) {
  const symbol = res.passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${symbol} Test ${res.testNumber}: ${res.testName}`);
  console.log(`   Details: ${res.details}\n`);
}

console.log('-----------------------------------------------------------------');
if (suite.allPassed) {
  console.log('🏆 ALL 7 MANDATORY QC STABILITY TESTS PASSED WITH 100% SUCCESS');
} else {
  console.error('💥 ONE OR MORE QC STABILITY TESTS FAILED');
  process.exit(1);
}
console.log('-----------------------------------------------------------------');
