import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, FileText, Layers3, LockKeyhole } from 'lucide-react';
import { CourseDescriptor, LessonPackageDescriptor } from '../../services/courseEngine/types';

type LecturePackageStatus = { ready: boolean; slideCount: number; teachingBlockCount: number; mappedMinutes: number; timingConflictReviewRequired: boolean; blockers: string[]; warnings: string[]; };\n\ntype OnboardingStatus = {
  ready: boolean;
  sourceChecks: {
    level1: { present: boolean; filename?: string; documentType?: string; packageId?: string };
    level3: { present: boolean; filename?: string; documentType?: string; slideCount?: number; packageId?: string };
  };
  slideCoverage: { coverage?: string; slideCount?: number; valid: boolean };
  timing: { conflictReviewRequired: boolean; note?: string };
  blockers: string[];
  warnings: string[];
};

const statusLabel: Record<LessonPackageDescriptor['status'], string> = {
  CONTENT_PENDING: 'CHỜ NẠP NGUỒN',
  READY_FOR_QC: 'SẴN SÀNG QC',
  QC_PENDING: 'ĐANG QC',
  APPROVED: 'ĐÃ PHÊ DUYỆT',
  LOCKED: 'ĐÃ KHÓA'
};

const statusClass: Record<LessonPackageDescriptor['status'], string> = {
  CONTENT_PENDING: 'border-amber-800 bg-amber-950/40 text-amber-300',
  READY_FOR_QC: 'border-emerald-800 bg-emerald-950/40 text-emerald-300',
  QC_PENDING: 'border-sky-800 bg-sky-950/40 text-sky-300',
  APPROVED: 'border-indigo-800 bg-indigo-950/40 text-indigo-300',
  LOCKED: 'border-violet-800 bg-violet-950/40 text-violet-300'
};

export const CourseEngineView: React.FC = () => {
  const [course, setCourse] = useState<CourseDescriptor | null>(null);
  const [selected, setSelected] = useState<LessonPackageDescriptor | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);\n  const [lecturePackage, setLecturePackage] = useState<LecturePackageStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/course-engine/courses/COURSE-1MD')
      .then(async r => {
        if (!r.ok) throw new Error('Không tải được Course Registry.');
        return r.json();
      })
      .then(data => setCourse(data.course))
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selected) {
      setOnboarding(null);
      return;
    }

    setOnboarding(null);
    fetch('/api/course-engine/packages/' + selected.packageId + '/onboarding-status')
      .then(async r => {
        if (!r.ok) throw new Error('Chưa có manifest onboarding cho package này.');
        return r.json();
      })
      .then(data => setOnboarding(data))
      .catch(() => setOnboarding(null));
  }, [selected]);

  if (error) return <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-6 text-rose-200">{error}</div>;
  if (!course) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Đang tải Course Registry…</div>;

  return <section className="space-y-6">
    <div className="rounded-2xl border border-indigo-800/60 bg-slate-900 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-indigo-300">COURSE-1MD • ENGINE • PHASE 3</div>
          <h1 className="mt-1 text-2xl font-bold text-white">{course.title}</h1>
          <p className="mt-2 text-sm text-slate-400">
            Engine tổng quát cho 10 bài độc lập. Bài 1 là Golden Reference; Bài 2–10 chỉ được nạp khi có DOCX/PPTX chính thức.
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center">
          <div className="text-2xl font-bold text-white">{course.packageCount}</div>
          <div className="text-[11px] text-slate-500">packages</div>
        </div>
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      {course.packages.map(pkg => (
        <button
          key={pkg.packageId}
          onClick={() => setSelected(pkg)}
          className="text-left rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-indigo-700 transition"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-800 flex items-center justify-center text-indigo-300">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-white">{pkg.lessonCode}</div>
                <div className="text-xs text-slate-500 font-mono">{pkg.packageId}</div>
              </div>
            </div>
            <span className={'text-[10px] px-2 py-1 rounded-full border ' + statusClass[pkg.status]}>
              {statusLabel[pkg.status]}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-slate-950 p-3">
              <FileText className="w-4 h-4 text-indigo-300 mb-1"/>
              <span className="text-slate-400">Level 1</span>
              <div className={pkg.sourceSlots.level1.status === 'REGISTERED' ? 'text-emerald-300' : 'text-white'}>
                {pkg.sourceSlots.level1.status}
              </div>
            </div>
            <div className="rounded-lg bg-slate-950 p-3">
              <Layers3 className="w-4 h-4 text-indigo-300 mb-1"/>
              <span className="text-slate-400">Level 3</span>
              <div className={pkg.sourceSlots.level3.status === 'REGISTERED' ? 'text-emerald-300' : 'text-white'}>
                {pkg.sourceSlots.level3.status}
              </div>
            </div>
            <div className="rounded-lg bg-slate-950 p-3">
              <LockKeyhole className="w-4 h-4 text-indigo-300 mb-1"/>
              <span className="text-slate-400">Isolation</span>
              <div className={pkg.isolated ? 'text-emerald-300' : 'text-rose-300'}>{pkg.isolated ? 'ON' : 'OFF'}</div>
            </div>
          </div>
        </button>
      ))}
    </div>

    {selected && (
      <div className="rounded-xl border border-indigo-800 bg-slate-900 p-5">
        <div className="flex items-center gap-2 text-emerald-300 text-sm">
          <CheckCircle2 className="w-4 h-4"/>
          Package Resolver đã xác nhận package thuộc COURSE-1MD.
        </div>
        <div className="mt-2 text-white font-semibold">{selected.packageId}</div>
        <div className="mt-1 text-xs text-slate-400">
          {selected.title} • {statusLabel[selected.status]} • Common source set: {selected.commonSourceSetId}
        </div>

        {onboarding && (
          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-indigo-300">GATE A • SOURCE ONBOARDING</div>
                <div className="mt-1 text-sm text-white">
                  {onboarding.ready ? 'PASS — nguồn đủ điều kiện cấu trúc' : 'BLOCKED — chưa đủ điều kiện'}
                </div>
              </div>
              <span className={onboarding.ready ? 'text-emerald-300 text-xs' : 'text-rose-300 text-xs'}>
                {onboarding.ready ? 'READY' : 'BLOCKED'}
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
              <div className="rounded-lg border border-slate-800 p-3">
                <div className="text-slate-500">Level 1</div>
                <div className="text-white">{onboarding.sourceChecks.level1.filename || 'MISSING'}</div>
              </div>
              <div className="rounded-lg border border-slate-800 p-3">
                <div className="text-slate-500">Level 3</div>
                <div className="text-white">{onboarding.sourceChecks.level3.filename || 'MISSING'}</div>
                <div className="text-slate-500">{onboarding.sourceChecks.level3.slideCount || 0} slides</div>
              </div>
              <div className="rounded-lg border border-slate-800 p-3">
                <div className="text-slate-500">Coverage</div>
                <div className={onboarding.slideCoverage.valid ? 'text-emerald-300' : 'text-rose-300'}>
                  {onboarding.slideCoverage.coverage || 'MISSING'}
                </div>
              </div>
            </div>
            {onboarding.warnings.map((warning, index) => (
              <div key={index} className="mt-3 text-xs text-amber-300">
                ⚠ {warning}
              </div>
            ))}
          </div>
        )}

        {lecturePackage && (\n          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">\n            <div className="flex items-center justify-between gap-3">\n              <div>\n                <div className="text-xs font-mono text-indigo-300">GATE B • LECTURE PACKAGE</div>\n                <div className="mt-1 text-sm text-white">\n                  {lecturePackage.ready ? 'PASS — Lecture Package hợp lệ' : 'BLOCKED — cần xử lý'}\n                </div>\n              </div>\n              <span className={lecturePackage.ready ? 'text-emerald-300 text-xs' : 'text-rose-300 text-xs'}>\n                {lecturePackage.ready ? 'READY' : 'BLOCKED'}\n              </span>\n            </div>\n            <div className="mt-3 grid gap-2 sm:grid-cols-4 text-xs">\n              <div className="rounded-lg border border-slate-800 p-3"><div className="text-slate-500">Slides</div><div className="text-white">{lecturePackage.slideCount}</div></div>\n              <div className="rounded-lg border border-slate-800 p-3"><div className="text-slate-500">Teaching Blocks</div><div className="text-white">{lecturePackage.teachingBlockCount}</div></div>\n              <div className="rounded-lg border border-slate-800 p-3"><div className="text-slate-500">Mapped time</div><div className="text-white">{lecturePackage.mappedMinutes} phút</div></div>\n              <div className="rounded-lg border border-slate-800 p-3"><div className="text-slate-500">Timing</div><div className="text-amber-300">{lecturePackage.timingConflictReviewRequired ? 'QC REVIEW' : 'OK'}</div></div>\n            </div>\n          </div>\n        )}\n\n        <div className="mt-2 text-[11px] text-slate-500">
          PRIMARY = DOCX + PPTX của chính bài; COMMON = bộ nguồn chung của học phần. Không tự động lấy nội dung Bài 1 cho bài khác.
        </div>
      </div>
    )}
  </section>;
};
