import { getCourse, getLessonPackage } from './courseRegistry';
import { LessonPackageDescriptor } from './types';
export function resolveLesson(courseId:string, lessonNumber:number){ return getLessonPackage(courseId,lessonNumber); }
export function assertLessonBelongsToCourse(courseId:string, packageId:string): LessonPackageDescriptor { const c=getCourse(courseId); const p=c?.packages.find(x=>x.packageId===packageId); if(!p) throw new Error(`Package "${packageId}" does not belong to course "${courseId}".`); return p; }
