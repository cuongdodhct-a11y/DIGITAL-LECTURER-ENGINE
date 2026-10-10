import { loadRuntimeLecturePackage } from '../src/services/courseEngine/runtimePackageService';

let blocked = false;
try {
  loadRuntimeLecturePackage('LPKG-1MD3-001');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  blocked = message.includes('Runtime package is not approved for playback')
    || message.includes('Grounded script is not approved for playback')
    || message.includes('no approved positive duration');
  if (!blocked) throw error;
}
if (!blocked) {
  throw new Error('1MD3 draft unexpectedly passed the runtime playback gate.');
}
console.log('DRAFT PACKAGE PLAYBACK GUARD — PASS (1MD3 remains non-playable until QC approval)');
