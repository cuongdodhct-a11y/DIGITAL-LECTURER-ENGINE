import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, FileText, Layers3, LockKeyhole } from 'lucide-react';
import { CourseDescriptor, LessonPackageDescriptor } from '../../services/courseEngine/types';

export const CourseEngineView: React.FC = () => {
  const [course, setCourse] = useState<CourseDescriptor | null>(null);
  const [selected, setSelected] = useState<LessonPackageDescriptor | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/course-engine/courses/COURSE-1MD')
      .then(async r => { if (!r.ok) throw new Error('Không tải được Course Registry.'); return r.json(); })
      .then(data => setCourse(data.course))
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-6 text-rose-200">{error}</div>;
  if (!course) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Đang tải Course Registry…</div>;

  return <section className="space-y-6">
    <div className="rounded-2xl border border-indigo-800/60 bg-slate-900 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-indigo-300">COURSE-1MD • PHASE 1</div>
          <h1 className="mt-1 text-2xl font-bold text-white">{course.title}</h1>
          <p className="mt-2 text-sm text-slate-400">Engine đã tạo 10 package độc lập tương đối. Nội dung chuẩn Word/PPTX sẽ được nạp ở Giai đoạn 2.</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center"><div className="text-2xl font-bold text-white">{course.packageCount}</div><div className="text-[11px] text-slate-500">packages</div></div>
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      {course.packages.map(pkg => <button key={pkg.packageId} onClick={() => setSelected(pkg)} className="text-left rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-indigo-700 transition">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-800 flex items-center justify-center text-indigo-300"><BookOpen className="w-5 h-5" /></div><div><div className="font-semibold text-white">{pkg.lessonCode}</div><div className="text-xs text-slate-500 font-mono">{pkg.packageId}</div></div></div>
          <span className="text-[10px] px-2 py-1 rounded-full border border-amber-800 bg-amber-950/40 text-amber-300">CONTENT_PENDING</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg bg-slate-950 p-3"><FileText className="w-4 h-4 text-indigo-300 mb-1"/><span className="text-slate-400">Level 1</span><div className="text-white">PENDING</div></div>
          <div className="rounded-lg bg-slate-950 p-3"><Layers3 className="w-4 h-4 text-indigo-300 mb-1"/><span className="text-slate-400">Level 3</span><div className="text-white">PENDING</div></div>
          <div className="rounded-lg bg-slate-950 p-3"><LockKeyhole className="w-4 h-4 text-indigo-300 mb-1"/><span className="text-slate-400">Isolation</span><div className="text-emerald-300">ON</div></div>
        </div>
      </button>)}
    </div>

    {selected && <div className="rounded-xl border border-indigo-800 bg-slate-900 p-5">
      <div className="flex items-center gap-2 text-emerald-300 text-sm"><CheckCircle2 className="w-4 h-4"/> Package Resolver đã xác nhận package thuộc COURSE-1MD.</div>
      <div className="mt-2 text-white font-semibold">{selected.packageId}</div>
      <div className="mt-1 text-xs text-slate-400">Common source set: {selected.commonSourceSetId} • Level 1/3 sẽ được nạp ở Giai đoạn 2.</div>
    </div>}
  </section>;
};
