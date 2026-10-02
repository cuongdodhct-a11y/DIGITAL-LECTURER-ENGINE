import { CourseDescriptor, LessonPackageDescriptor } from './types';
export const COURSE_1MD_ID = 'COURSE-1MD';
export const COMMON_1MD_SOURCE_SET_ID = 'COMMON-1MD';
function createLessonPackage(n: number): LessonPackageDescriptor { const code=`1MD${n}`; const onboarded=n===1; return { packageId:`LPKG-1MD${n}-001`, courseId:COURSE_1MD_ID, lessonNumber:n, lessonCode:code, title:onboarded?'Mỹ học Mác - Lênin — 1MĐ1':`Bài ${code} — chờ nạp tài liệu chuẩn`, status:onboarded?'READY_FOR_QC':'CONTENT_PENDING', sourceSlots:{level1:{level:1,required:true,status:onboarded?'REGISTERED':'PENDING'},level3:{level:3,required:true,status:onboarded?'REGISTERED':'PENDING'}}, commonSourceSetId:COMMON_1MD_SOURCE_SET_ID, isolated:true }; }
export const COURSE_1MD: CourseDescriptor = { courseId:COURSE_1MD_ID, courseCode:'1MĐ', title:'Mỹ học Mác - Lênin', packageCount:10, commonSourceSet:{id:COMMON_1MD_SOURCE_SET_ID,courseId:COURSE_1MD_ID,levels:[2,4,5,6,7],status:'EMPTY'}, packages:Array.from({length:10},(_,i)=>createLessonPackage(i+1)) };
export function listCourses(){ return [COURSE_1MD]; }
export function getCourse(id:string){ return id===COURSE_1MD_ID ? COURSE_1MD : undefined; }
export function getLessonPackage(courseId:string,n:number){ const c=getCourse(courseId); return c && Number.isInteger(n) && n>=1 && n<=10 ? c.packages[n-1] : undefined; }
