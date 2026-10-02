/** Digital Lecturer Engine — Phase 1 course/package contracts. */
export type PackageReadiness = 'CONTENT_PENDING' | 'READY_FOR_QC' | 'QC_PENDING' | 'APPROVED' | 'LOCKED';
export interface SourceSlot { level: 1 | 3; required: boolean; sourceId?: string; filename?: string; status: 'PENDING' | 'REGISTERED' | 'VERIFIED'; }
export interface CommonSourceSet { id: string; courseId: string; levels: Array<2 | 4 | 5 | 6 | 7>; status: 'EMPTY' | 'READY'; }
export interface LessonPackageDescriptor { packageId: string; courseId: string; lessonNumber: number; lessonCode: string; title: string; status: PackageReadiness; sourceSlots: { level1: SourceSlot; level3: SourceSlot }; commonSourceSetId: string; isolated: boolean; }
export interface CourseDescriptor { courseId: string; courseCode: string; title: string; packageCount: number; commonSourceSet: CommonSourceSet; packages: LessonPackageDescriptor[]; }
