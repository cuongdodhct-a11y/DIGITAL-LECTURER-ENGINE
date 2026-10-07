import { CourseDescriptor, LessonPackageDescriptor } from './types';

export const COURSE_1MD_ID = 'COURSE-1MD';
export const COMMON_1MD_SOURCE_SET_ID = 'COMMON-1MD';

const LESSON_CATALOG: Record<number, { title: string; sourceReady: boolean }> = {
  1: { title: 'Mỹ học Mác - Lênin — 1MĐ1', sourceReady: true },
  2: { title: 'Những phạm trù cơ bản của Mỹ học Mác - Lênin', sourceReady: true },
  3: { title: 'Giáo dục thẩm mỹ', sourceReady: true },
  4: { title: 'Đạo đức, đạo đức học, đạo đức học quân sự', sourceReady: true },
  5: { title: 'Những phạm trù cơ bản của Đạo đức học quân sự', sourceReady: true },
  6: { title: 'Đạo đức quân nhân', sourceReady: true },
  7: { title: 'Những vấn đề chung về tôn giáo và Tôn giáo học', sourceReady: true },
  8: { title: 'Một số tôn giáo lớn trên thế giới', sourceReady: true },
  9: { title: 'Tín ngưỡng, tôn giáo bản địa Việt Nam', sourceReady: true },
  10: { title: 'Bài 1MD10 — chờ nạp tài liệu chuẩn', sourceReady: false }
};

function createLessonPackage(n: number): LessonPackageDescriptor {
  const code = `1MD${n}`;
  const catalog = LESSON_CATALOG[n] ?? { title: `Bài ${code} — chờ nạp tài liệu chuẩn`, sourceReady: false };
  const sourceReady = catalog.sourceReady;

  return {
    packageId: `LPKG-1MD${n}-001`,
    courseId: COURSE_1MD_ID,
    lessonNumber: n,
    lessonCode: code,
    title: catalog.title,
    status: n === 1 ? 'READY_FOR_QC' : sourceReady ? 'QC_PENDING' : 'CONTENT_PENDING',
    sourceSlots: {
      level1: {
        level: 1,
        required: true,
        status: sourceReady ? 'REGISTERED' : 'PENDING',
        ...(sourceReady ? { sourceId: `SRC-1MD${n}-L1`, filename: `1.MĐ${n}.docx` } : {})
      },
      level3: {
        level: 3,
        required: true,
        status: sourceReady ? 'REGISTERED' : 'PENDING',
        ...(sourceReady ? { sourceId: `SRC-1MD${n}-L3`, filename: `1.MĐ${n}.pptx` } : {})
      }
    },
    commonSourceSetId: COMMON_1MD_SOURCE_SET_ID,
    isolated: true
  };
}

export const COURSE_1MD: CourseDescriptor = {
  courseId: COURSE_1MD_ID,
  courseCode: '1MĐ',
  title: 'Mỹ học Mác - Lênin',
  packageCount: 10,
  commonSourceSet: { id: COMMON_1MD_SOURCE_SET_ID, courseId: COURSE_1MD_ID, levels: [2, 4, 5, 6, 7], status: 'EMPTY' },
  packages: Array.from({ length: 10 }, (_, i) => createLessonPackage(i + 1))
};

export function listCourses() {
  return [COURSE_1MD];
}

export function getCourse(id: string) {
  return id === COURSE_1MD_ID ? COURSE_1MD : undefined;
}

export function getLessonPackage(courseId: string, n: number) {
  const c = getCourse(courseId);
  return c && Number.isInteger(n) && n >= 1 && n <= 10 ? c.packages[n - 1] : undefined;
}
