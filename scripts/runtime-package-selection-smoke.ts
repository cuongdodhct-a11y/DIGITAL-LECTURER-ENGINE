import { isRuntimeLessonPackageId } from '../src/services/courseEngine/runtimePackageSelection';

for (let lesson = 2; lesson <= 10; lesson++) {
  const packageId = `LPKG-1MD${lesson}-001`;
  if (!isRuntimeLessonPackageId(packageId)) throw new Error(`Runtime package ID rejected: ${packageId}`);
}
for (const packageId of ['LPKG-1MD1-001', 'LPKG-1MD11-001', 'LPKG-CS401-007', '../LPKG-1MD2-001', 'LPKG-1MD2']) {
  if (isRuntimeLessonPackageId(packageId)) throw new Error(`Invalid runtime package ID accepted: ${packageId}`);
}
console.log('RUNTIME PACKAGE SELECTION SMOKE TEST — PASS');
