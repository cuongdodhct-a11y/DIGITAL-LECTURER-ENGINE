/**
 * Digital Lecturer Engine - Flagship Full-Stack Application
 * AI-powered university lecturer for structured, source-grounded teaching.
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CourseEngineView } from './components/CourseEngine/CourseEngineView';
import { DocumentUploader } from './components/DocumentUploader/DocumentUploader';
import { LecturePackageView } from './components/LectureMap/LecturePackageView';
import { QualityControlDashboard } from './components/QualityControl/QualityControlDashboard';
import { ClassroomView } from './components/Classroom/ClassroomView';
import { RegisteredDocument } from './types/source';
import { LecturePackage, PackageSummary } from './types/lecture';
import { QCReport } from './types/quality';
import { createProduction1MD1Package, getProductionDocuments, PRODUCTION_PACKAGE_ID } from './services/lectureSequence/productionDefaultPackage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'engine' | 'sources' | 'package' | 'qc' | 'classroom'>('engine');
  const [documents, setDocuments] = useState<RegisteredDocument[]>(getProductionDocuments());
  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [activePackageId, setActivePackageId] = useState<string>(PRODUCTION_PACKAGE_ID);
  const [lecturePackage, setLecturePackage] = useState<LecturePackage>(createProduction1MD1Package());
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load server state
  const loadState = async () => {
    try {
      setLoading(true);
      const [statusRes, docsRes, pkgRes, pkgsListRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/documents'),
        fetch('/api/lecture/package'),
        fetch('/api/lecture/packages')
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setHasApiKey(statusData.hasApiKey);
      }

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        if (docsData.documents) setDocuments(docsData.documents);
      }

      if (pkgsListRes.ok) {
        const pkgsData = await pkgsListRes.json();
        if (pkgsData.packages) setPackages(pkgsData.packages);
        if (pkgsData.activePackageId) setActivePackageId(pkgsData.activePackageId);
      }

      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        if (pkgData.lecturePackage) setLecturePackage(pkgData.lecturePackage);
        if (pkgData.activePackageId) setActivePackageId(pkgData.activePackageId);
      }
    } catch (err) {
      console.warn('[App] Local state fallback active:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  // Package Switcher Actions
  const handleSelectPackage = async (packageId: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/lecture/select-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });
      if (res.ok) {
        const data = await res.json();
        setLecturePackage(data.lecturePackage);
        setActivePackageId(data.activePackageId);
        setPackages(prev => prev.map(p => ({
          ...p,
          isActive: p.id === data.activePackageId
        })));
        showToast(`Đã chuyển sang gói bài giảng: ${data.lecturePackage.metadata.lectureTitle}`);
      } else {
        const err = await res.json();
        showToast(`Lỗi: ${err.error || 'Không thể chuyển gói bài giảng'}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuild1MD1 = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/lecture/packages/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: 'LPKG-1MD1-001',
          sourceIds: ['SRC-006', 'SRC-007'],
          lecturerDecisions: {
            pedagogicalFocus: 'PARTS_I_AND_III',
            slide6RomanNumerals: 'STANDARDIZE_I_II_III_IV',
            slide10Role: 'TRANSITION_SLIDE_LESSON_1'
          },
          setAsActive: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLecturePackage(data.lecturePackage);
        setActivePackageId(data.activePackageId);
        await loadState();
        showToast('Đã khởi tạo thành công gói bài giảng 1MĐ1 độc lập (52 slide, 7 blocks, 185 phút).');
      } else {
        const err = await res.json();
        showToast(`Lỗi: ${err.error || 'Không thể xây dựng gói 1MĐ1'}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleResetSample = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents/sample-load', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
        setLecturePackage(data.lecturePackage);
        setActivePackageId(data.lecturePackage.id);
        await loadState();
        showToast('Đã nạp thành công gói bài giảng chuẩn 1MĐ1 (Mỹ học Mác - Lênin).');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (sourceId: string) => {
    try {
      const res = await fetch(`/api/documents/${sourceId}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.sourceId !== sourceId));
        showToast(`Đã xóa nguồn ${sourceId}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRebuildPackage = async (useAI: boolean) => {
    try {
      setLoading(true);
      const res = await fetch('/api/lecture/build-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useAI })
      });
      if (res.ok) {
        const data = await res.json();
        setLecturePackage(data.lecturePackage);
        showToast('Đã phân tích và tái cấu trúc gói bài giảng với mô hình Gemini 3.8 Flash.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunQC = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/lecture/qc', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLecturePackage(prev => ({
          ...prev,
          qualityControl: data.qcReport,
          unresolvedIssues: data.qcReport.issues.filter((i: any) => !i.resolved),
          status: data.packageStatus
        }));
        showToast('Đã hoàn tất kiểm định 16 tiêu chuẩn sư phạm.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = async (issueId: string, resolutionComment: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/lecture/resolve-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, resolutionComment })
      });
      if (res.ok) {
        const data = await res.json();
        setLecturePackage(data.activePackage);
        showToast(`Đã xác nhận giải quyết vấn đề ${issueId}.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/lecture/approve', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLecturePackage(data.lecturePackage);
        showToast('Gói bài giảng đã được Phê duyệt (APPROVED). Giảng viên có thể Khóa để bước vào Giảng đường.');
      } else {
        const err = await res.json();
        alert(err.error || 'Không thể phê duyệt');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/lecture/lock', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLecturePackage(data.lecturePackage);
        showToast('Gói bài giảng đã được KHÓA (LOCKED). Đã mở quyền truy cập Giảng đường Trực tiếp.');
        setActiveTab('classroom');
      } else {
        const err = await res.json();
        alert(err.error || 'Không thể khóa');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayScript = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-600 text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 border border-indigo-400">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        approvalStatus={lecturePackage.status}
        criticalCount={lecturePackage.qualityControl?.criticalCount || 0}
        warningCount={lecturePackage.qualityControl?.warningCount || 0}
        hasApiKey={hasApiKey}
        packages={packages}
        activePackageId={activePackageId}
        onSelectPackage={handleSelectPackage}
        onBuild1MD1={handleBuild1MD1}
        onResetSample={handleResetSample}
        loading={loading}
      />

      {/* Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'engine' && (
          <CourseEngineView />
        )}

        {activeTab === 'sources' && (
          <DocumentUploader
            documents={documents}
            onUploadSuccess={loadState}
            onDeleteDocument={handleDeleteDocument}
            loading={loading}
          />
        )}

        {activeTab === 'package' && (
          <LecturePackageView
            lecturePackage={lecturePackage}
            onRebuildPackage={handleRebuildPackage}
            onPlayScript={handlePlayScript}
            loading={loading}
          />
        )}

        {activeTab === 'qc' && (
          <QualityControlDashboard
            qcReport={lecturePackage.qualityControl}
            lecturePackage={lecturePackage}
            onRunQC={handleRunQC}
            onResolveIssue={handleResolveIssue}
            onApprove={handleApprove}
            onLock={handleLock}
            loading={loading}
          />
        )}

        {activeTab === 'classroom' && (
          <ClassroomView lecturePackage={lecturePackage} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Digital Lecturer Engine &bull; University Teaching Infrastructure</span>
          <span className="font-mono text-[11px]">Principle: SOURCE → STRUCTURE → PEDAGOGY → TEACHING → INTERACTION</span>
        </div>
      </footer>
    </div>
  );
}
