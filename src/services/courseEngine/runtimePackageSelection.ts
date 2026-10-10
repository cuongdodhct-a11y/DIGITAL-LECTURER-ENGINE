/** True only for course lesson packages that may load from Gate B/C runtime artifacts. */
export function isRuntimeLessonPackageId(packageId: string): boolean {
  return /^LPKG-1MD(?:10|[2-9])-001$/.test(packageId);
}
