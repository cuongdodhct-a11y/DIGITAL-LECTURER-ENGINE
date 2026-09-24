import { runOfficialVoiceVerificationSuite } from '../src/services/continuousPlayback/__tests__/officialVoiceVerificationTests';

async function main() {
  console.log('====================================================');
  console.log('PHASE 1.5.8A: RESTORE OFFICIAL LECTURER VOICE TESTS');
  console.log('====================================================\n');

  const results = await runOfficialVoiceVerificationSuite();
  let allPassed = true;

  for (const r of results) {
    const status = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${status}] ${r.testId}: ${r.name}`);
    console.log(`       ${r.details}`);
    if (!r.passed) {
      allPassed = false;
    }
  }

  console.log('\n----------------------------------------------------');
  if (allPassed) {
    console.log(`ALL ${results.length}/${results.length} VOICE RESTORATION TESTS PASSED!`);
  } else {
    console.log('SOME TESTS FAILED!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
