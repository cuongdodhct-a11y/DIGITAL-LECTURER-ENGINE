/**
 * Digital Lecturer Engine - Dedicated Quality Control Engine Dashboard
 * Displays 16-point pedagogical audit, flags CRITICAL, WARNING, and INFO issues,
 * and allows explicit lecturer review, resolution comments, approval, and locking.
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Lock, 
  RotateCcw, 
  FileWarning, 
  Check, 
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { QCReport, QCIssue, QCSeverity } from '../../types/quality';
import { LecturePackage } from '../../types/lecture';

interface QualityControlDashboardProps {
  qcReport: QCReport;
  lecturePackage: LecturePackage;
  onRunQC: () => void;
  onResolveIssue: (issueId: string, resolutionComment: string) => void;
  onApprove: () => void;
  onLock: () => void;
  loading: boolean;
}

export const QualityControlDashboard: React.FC<QualityControlDashboardProps> = ({
  qcReport,
  lecturePackage,
  onRunQC,
  onResolveIssue,
  onApprove,
  onLock,
  loading
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');

  const filteredIssues = qcReport.issues.filter(issue => {
    if (filterSeverity === 'ALL') return true;
    return issue.severity === filterSeverity;
  });

  const handleOpenResolve = (issue: QCIssue) => {
    setResolvingIssueId(issue.id);
    if (issue.category === 'SLIDE_CONTENT_MISMATCH') {
      setResolutionNote(`Giảng viên đã xác nhận nội dung slide phù hợp với kế hoạch bài giảng của học phần ${lecturePackage.metadata.courseCode}.`);
    } else if (issue.category === 'TIMING_PLAN_VALID') {
      setResolutionNote(`Giảng viên đã phê duyệt định mức thời lượng ${lecturePackage.metadata.plannedDurationMinutes} phút cho bài giảng.`);
    } else {
      setResolutionNote('Đã xem xét và phê duyệt theo ý kiến sư phạm của giảng viên.');
    }
  };

  const handleConfirmResolve = (issueId: string) => {
    onResolveIssue(issueId, resolutionNote);
    setResolvingIssueId(null);
    setResolutionNote('');
  };

  const unresolvedCriticals = qcReport.issues.filter(i => i.severity === 'CRITICAL' && !i.resolved);

  return (
    <div className="space-y-6">
      {/* QC Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Cổng Kiểm định Chất lượng Bài giảng (16-Point QC Audit Gate)
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
              <span className="font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 font-semibold">
                {lecturePackage.id}
              </span>
              <span className="text-slate-200 font-medium">
                {lecturePackage.metadata?.lectureTitle}
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {lecturePackage.slideMap?.length || 0} slides &bull; {lecturePackage.teachingBlocks?.length || 0} blocks &bull; {lecturePackage.metadata?.plannedDurationMinutes || 0} phút
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right mr-2 hidden sm:block">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Đợt kiểm định (Audit Run)</span>
              <span className="text-xs font-mono text-indigo-300 font-semibold">{qcReport.auditRunId || 'RUN-CURRENT'}</span>
            </div>

            <button
              onClick={onRunQC}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chạy lại Kiểm định</span>
            </button>

            {lecturePackage.status !== 'LOCKED' && (
              <>
                <button
                  onClick={onApprove}
                  disabled={loading || unresolvedCriticals.length > 0}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    unresolvedCriticals.length === 0
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                  title={unresolvedCriticals.length > 0 ? 'Phải giải quyết tất cả lỗi CRITICAL trước khi phê duyệt' : 'Phê duyệt gói bài giảng'}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Phê duyệt (Approve)</span>
                </button>

                <button
                  onClick={onLock}
                  disabled={loading || lecturePackage.status !== 'APPROVED'}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    lecturePackage.status === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                  title={lecturePackage.status !== 'APPROVED' ? 'Chỉ có thể khóa khi bài giảng đã được APPROVED' : 'Khóa bài giảng để chuyển sang chế độ giảng đường'}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Khóa Bài giảng (Lock)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Severity Statistics Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Tổng số tiêu chí</span>
              <span className="text-xl font-bold font-mono text-white">16/16</span>
            </div>
            <ShieldCheck className="w-6 h-6 text-slate-500" />
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-rose-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-rose-400 block font-semibold">Lỗi Nghiêm trọng (CRITICAL)</span>
              <span className="text-xl font-bold font-mono text-rose-300">{qcReport.criticalCount}</span>
            </div>
            <ShieldAlert className="w-6 h-6 text-rose-500" />
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-amber-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-amber-400 block font-semibold">Cảnh báo (WARNING)</span>
              <span className="text-xl font-bold font-mono text-amber-300">{qcReport.warningCount}</span>
            </div>
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-sky-400 block">Gợi ý hoàn thiện (INFO)</span>
              <span className="text-xl font-bold font-mono text-sky-300">{qcReport.infoCount}</span>
            </div>
            <Info className="w-6 h-6 text-sky-500" />
          </div>
        </div>

        {/* Status Callout Banner */}
        {unresolvedCriticals.length > 0 ? (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800 rounded-lg text-xs text-rose-200 space-y-1">
            <div className="font-semibold flex items-center gap-2 text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Chặn Phê duyệt (Approval Gate Locked): Phát hiện {unresolvedCriticals.length} vấn đề CRITICAL</span>
            </div>
            <p className="text-[11px] text-rose-300/90 leading-relaxed">
              Theo Điều lệ Quản trị Nguồn: Hệ thống không tự ý sửa đổi hoặc bỏ qua slide/luận điểm nghi vấn. Giảng viên bắt buộc phải kiểm tra và bấm "Xác nhận & Giải quyết" cho từng mục dưới đây trước khi mở khóa giảng dạy.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tất cả các vấn đề nghiêm trọng đã được giảng viên giải quyết. Gói bài giảng đủ điều kiện phê duyệt và khóa.</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilterSeverity('ALL')}
            className={`px-3 py-1 rounded-md transition ${filterSeverity === 'ALL' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            Tất cả ({qcReport.issues.length})
          </button>
          <button
            onClick={() => setFilterSeverity('CRITICAL')}
            className={`px-3 py-1 rounded-md transition ${filterSeverity === 'CRITICAL' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            Critical ({qcReport.issues.filter(i => i.severity === 'CRITICAL').length})
          </button>
          <button
            onClick={() => setFilterSeverity('WARNING')}
            className={`px-3 py-1 rounded-md transition ${filterSeverity === 'WARNING' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            Warning ({qcReport.issues.filter(i => i.severity === 'WARNING').length})
          </button>
          <button
            onClick={() => setFilterSeverity('INFO')}
            className={`px-3 py-1 rounded-md transition ${filterSeverity === 'INFO' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            Info ({qcReport.issues.filter(i => i.severity === 'INFO').length})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Thời điểm kiểm định: {new Date(qcReport.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Issue Cards List */}
      <div className="space-y-3">
        {filteredIssues.map(issue => {
          const isResolved = issue.resolved || issue.resolvedByLecturer;

          return (
            <div
              key={issue.id}
              className={`p-4 rounded-xl border transition ${
                isResolved
                  ? 'bg-slate-900/50 border-slate-800 opacity-75'
                  : issue.severity === 'CRITICAL'
                  ? 'bg-rose-950/20 border-rose-800/80 shadow'
                  : issue.severity === 'WARNING'
                  ? 'bg-amber-950/20 border-amber-800/80'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-indigo-900/60 shadow-xs">
                      {issue.id}
                    </span>

                    {/* Issue Lifecycle Status */}
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase border ${
                      issue.status === 'ACTIVE'
                        ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                        : issue.status === 'REOPENED'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
                        : issue.status === 'RESOLVED'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : issue.status === 'WAIVED'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                        : 'bg-slate-950 text-slate-400 border-slate-800 line-through'
                    }`}>
                      Trạng thái: {issue.status || (isResolved ? 'RESOLVED' : 'ACTIVE')}
                    </span>

                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase ${
                      issue.severity === 'CRITICAL'
                        ? 'bg-rose-900 text-rose-200 border border-rose-700'
                        : issue.severity === 'WARNING'
                        ? 'bg-amber-900 text-amber-200 border border-amber-700'
                        : 'bg-sky-900 text-sky-200 border border-sky-700'
                    }`}>
                      {issue.severity}
                    </span>

                    <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                      {issue.category}
                    </span>

                    {issue.targetId && (
                      <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-900">
                        Đối tượng: {issue.targetId}
                      </span>
                    )}

                    {isResolved && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        ĐÃ XÁC NHẬN BỞI GIẢNG VIÊN
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white">
                    {issue.title}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {issue.description}
                  </p>

                  {/* Audit Run Provenance Tracking */}
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                    <span>
                      <strong className="text-slate-300">Phát hiện lần đầu:</strong> {issue.firstDetectedRunId || qcReport.auditRunId} ({issue.firstDetectedAt ? new Date(issue.firstDetectedAt).toLocaleTimeString() : 'Ban đầu'})
                    </span>
                    <span className="text-slate-600">|</span>
                    <span>
                      <strong className="text-slate-300">Lần kiểm gần nhất:</strong> {issue.lastDetectedRunId || qcReport.auditRunId} ({issue.lastDetectedAt ? new Date(issue.lastDetectedAt).toLocaleTimeString() : 'Hiện tại'})
                    </span>
                    <span className="text-slate-600">|</span>
                    <span>
                      <strong className="text-slate-300">Số lần xác nhận xuất hiện:</strong> {issue.detectionCount || 1}
                    </span>
                  </div>

                  {issue.suggestedAction && (
                    <div className="text-[11px] text-indigo-300/90 bg-indigo-950/30 p-2 rounded border border-indigo-900/40">
                      <strong>Khuyến nghị khắc phục:</strong> {issue.suggestedAction}
                    </div>
                  )}

                  {issue.resolutionHistory && issue.resolutionHistory.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      {issue.resolutionHistory.map((rec) => (
                        <div key={rec.id} className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded border border-emerald-900/50 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                            <span className="font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Quyết định: {rec.lecturerDecision} | Mã hồ sơ: {rec.id}
                            </span>
                            <span>{new Date(rec.resolvedAt).toLocaleString()}</span>
                          </div>
                          <div>
                            <strong>Giảng viên ({rec.resolvedBy}):</strong> "{rec.lecturerNote}"
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : issue.lecturerComment ? (
                    <div className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded border border-emerald-900/50 flex items-start gap-1.5 mt-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Ghi chú phê duyệt của Giảng viên:</strong> "{issue.lecturerComment}"
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Resolve Action Button */}
                {!isResolved && (
                  <div className="shrink-0 pt-1">
                    <button
                      onClick={() => handleOpenResolve(issue)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác nhận & Giải quyết</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolution Dialog / Modal */}
      {resolvingIssueId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Xác nhận Phê duyệt Vấn đề Kiểm định ({resolvingIssueId})</span>
              </h4>
              <button
                onClick={() => setResolvingIssueId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Ghi chú quyết định của Giảng viên (Lecturer Sign-off Note) *
              </label>
              <textarea
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                Ý kiến này sẽ được lưu cố định vào hồ sơ bài giảng và biên bản kiểm định chất lượng.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResolvingIssueId(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleConfirmResolve(resolvingIssueId)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs"
              >
                Lưu xác nhận & Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
