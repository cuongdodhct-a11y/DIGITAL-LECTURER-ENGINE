/** True only for course lesson packages that may load from Gate B/C runtime artifacts. */
export function isRuntimeLessonPackageId(packageId: string): boolean {
  return /^LPKG-1MD(?:10|[2-9])-001$/.test(packageId);
}

/** True for any canonical 1MD1–1MD10 lesson package, including the protected 1MD1 provider. */
export function isCourseLessonPackageId(packageId: string): boolean {
  return /^LPKG-1MD(?:10|[1-9])-001$/.test(packageId);
}
