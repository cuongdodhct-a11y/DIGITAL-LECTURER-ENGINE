/**
 * Digital Lecturer Engine - Header Component
 */

import React from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  Lock, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Radio,
  FileText
} from 'lucide-react';
import { ApprovalState } from '../types/quality';
import { PackageSummary } from '../types/lecture';
import { PackageSwitcher } from './PackageSwitcher/PackageSwitcher';

interface HeaderProps {
  activeTab: 'sources' | 'package' | 'qc' | 'classroom';
  setActiveTab: (tab: 'sources' | 'package' | 'qc' | 'classroom') => void;
  approvalStatus: ApprovalState;
  criticalCount: number;
  warningCount: number;
  hasApiKey: boolean;
  packages: PackageSummary[];
  activePackageId: string;
  onSelectPackage: (packageId: string) => void;
  onBuild1MD1?: () => void;
  onResetSample: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  approvalStatus,
  criticalCount,
  warningCount,
  hasApiKey,
  packages,
  activePackageId,
  onSelectPackage,
  onBuild1MD1,
  onResetSample,
  loading
}) => {
  const getStatusBadge = () => {
    switch (approvalStatus) {
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            LOCKED (Sẵn sàng giảng dạy)
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-950 text-blue-300 border border-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            APPROVED (Đã phê duyệt)
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-950 text-amber-300 border border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            NEEDS_REVIEW ({criticalCount} Lỗi Nghiêm trọng)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            {approvalStatus}
          </span>
        );
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Academic Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">DIGITAL LECTURER ENGINE</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                  Phase 1 Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI-powered university lecturer for structured, source-grounded teaching
              </p>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center space-x-3">
            <PackageSwitcher
              packages={packages}
              activePackageId={activePackageId}
              onSelectPackage={onSelectPackage}
              onBuild1MD1={onBuild1MD1}
              loading={loading}
            />

            {getStatusBadge()}

            <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Model: <strong className="text-slate-200">gemini-3.8-flash</strong></span>
            </div>

            <button
              onClick={onResetSample}
              disabled={loading}
              title="Khôi phục gói bài giảng chuẩn 1MĐ1"
              className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Nạp lại 1MĐ1</span>
            </button>
          </div>
        </div>

        {/* Academic Workflow Tabs */}
        <nav className="flex space-x-1 border-t border-slate-800/80 -mb-px">
          <button
            onClick={() => setActiveTab('sources')}
            className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'sources'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Nguồn & Phân tầng Tài liệu (Hierarchy Levels 1-7)</span>
          </button>

          <button
            onClick={() => setActiveTab('package')}
            className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'package'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Khung Bài giảng & Slide Map (TeachingBlocks)</span>
          </button>

          <button
            onClick={() => setActiveTab('qc')}
            className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'qc'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. Kiểm định Chất lượng (Quality Control Gate)</span>
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-900/80 text-rose-300 border border-rose-700">
                {criticalCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-900/80 text-amber-300 border border-amber-700">
                {warningCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('classroom')}
            className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'classroom'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-emerald-300">4. Giảng đường Kỹ thuật số (Live Academic Classroom)</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
