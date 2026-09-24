import React from 'react';
import { PackageSummary } from '../../types/lecture';
import { Layers, Check, Sparkles, FolderArchive } from 'lucide-react';

interface PackageSwitcherProps {
  packages: PackageSummary[];
  activePackageId: string;
  onSelectPackage: (packageId: string) => void;
  onBuild1MD1?: () => void;
  loading?: boolean;
}

export const PackageSwitcher: React.FC<PackageSwitcherProps> = ({
  packages,
  activePackageId,
  onSelectPackage,
  onBuild1MD1,
  loading
}) => {
  const activePkg = packages.find(p => p.id === activePackageId);
  const has1MD1 = packages.some(p => p.id === 'LPKG-1MD1-001');

  return (
    <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 font-mono">
        <FolderArchive className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Gói bài giảng:</span>
      </div>

      <select
        value={activePackageId}
        onChange={(e) => onSelectPackage(e.target.value)}
        disabled={loading}
        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-2.5 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer font-sans max-w-[280px] truncate"
        title="Chọn gói bài giảng độc lập để phân tích và giảng dạy"
      >
        {packages.map((pkg) => (
          <option key={pkg.id} value={pkg.id}>
            [{pkg.courseCode}] {pkg.id} &bull; {pkg.title} ({pkg.slideCount} slides, {pkg.durationMinutes}p)
          </option>
        ))}
      </select>

      {!has1MD1 && onBuild1MD1 && (
        <button
          onClick={onBuild1MD1}
          disabled={loading}
          className="text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md flex items-center gap-1 cursor-pointer transition font-medium"
          title="Xây dựng gói bài giảng độc lập cho 1MĐ1 từ SRC-006 và SRC-007"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Tạo gói 1MĐ1</span>
        </button>
      )}
    </div>
  );
};
