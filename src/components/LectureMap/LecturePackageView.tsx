/**
 * Digital Lecturer Engine - Lecture Package & Teaching Blocks Viewer
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Clock, 
  Target, 
  FileCheck, 
  Sparkles, 
  Presentation, 
  AlertCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { LecturePackage } from '../../types/lecture';
import { TeachingBlockCard } from '../TeachingBlock/TeachingBlockCard';
import { SlideMapView } from '../SlideMap/SlideMapView';
import { formatTimeDetailed } from '../../utils/timing';

interface LecturePackageViewProps {
  lecturePackage: LecturePackage;
  onRebuildPackage: (useAI: boolean) => void;
  onPlayScript: (text: string) => void;
  loading: boolean;
}

export const LecturePackageView: React.FC<LecturePackageViewProps> = ({
  lecturePackage,
  onRebuildPackage,
  onPlayScript,
  loading
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'blocks' | 'slides' | 'objectives'>('blocks');
  const [selectedBlockId, setSelectedBlockId] = useState<string>(lecturePackage.teachingBlocks[0]?.id || '');
  const [selectedSlideNumber, setSelectedSlideNumber] = useState<number>(1);

  const selectedBlock = lecturePackage.teachingBlocks.find(b => b.id === selectedBlockId) || lecturePackage.teachingBlocks[0];

  return (
    <div className="space-y-6">
      {/* Lecture Metadata Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                {lecturePackage.metadata.courseCode} &bull; Bài {lecturePackage.metadata.lectureNumber}
              </span>
              <span className="text-xs text-slate-400">
                {lecturePackage.metadata.academicUnit}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {lecturePackage.metadata.lectureTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Chủ biên: <strong>{lecturePackage.metadata.authorLecturer}</strong> &bull; Đối tượng: {lecturePackage.metadata.targetDegree}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onRebuildPackage(true)}
              disabled={loading}
              className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phân tích lại bằng Gemini 3.8 Flash</span>
            </button>
          </div>
        </div>

        {/* Focus & Timing Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-1">
              Trọng tâm Sư phạm (Teaching Focus)
            </span>
            <p className="text-xs text-indigo-300 font-medium leading-relaxed">
              {lecturePackage.metadata.pedagogicalFocus}
            </p>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-1">
              Kế hoạch Thời lượng (Timing Plan)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-mono font-bold text-white">
                {formatTimeDetailed(lecturePackage.timingPlan.totalPlannedSeconds)}
              </span>
              <span className="text-xs text-slate-400">
                (Kế hoạch chuẩn: {lecturePackage.metadata.plannedDurationMinutes}m)
              </span>
            </div>
            {lecturePackage.timingPlan.isMismatch && (
              <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Lệch {formatTimeDetailed(lecturePackage.timingPlan.varianceSeconds)} (TIMING_MISMATCH)</span>
              </p>
            )}
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-1">
              Quy mô Bài giảng (Pedagogical Scale)
            </span>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span><strong>{lecturePackage.teachingBlocks.length}</strong> TeachingBlocks</span>
              <span>&bull;</span>
              <span><strong>{lecturePackage.slideMap.length}</strong> Slides</span>
              <span>&bull;</span>
              <span><strong>{lecturePackage.objectives.length}</strong> Mục tiêu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('blocks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'blocks'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Các Khối Giảng dạy (TeachingBlocks)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('slides')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'slides'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Slide Map ({lecturePackage.slideMap.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('objectives')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'objectives'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Mục tiêu & Chuẩn đầu ra (Objectives)</span>
          </button>
        </div>
      </div>

      {/* Sub-tab content */}
      {activeSubTab === 'blocks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lecturePackage.teachingBlocks.map(block => (
              <TeachingBlockCard
                key={block.id}
                block={block}
                isActive={block.id === selectedBlockId}
                onSelect={() => setSelectedBlockId(block.id)}
                onPlayScript={onPlayScript}
              />
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'slides' && (
        <SlideMapView
          slideMap={lecturePackage.slideMap}
          selectedSlideNumber={selectedSlideNumber}
          onSelectSlide={num => setSelectedSlideNumber(num)}
        />
      )}

      {activeSubTab === 'objectives' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lecturePackage.objectives.map(obj => (
              <div
                key={obj.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {obj.code} ({obj.id})
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    Thang nhận thức: {obj.cognitiveLevel}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {obj.statement}
                </p>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span className="block text-slate-500 mb-1">Ánh xạ vào TeachingBlocks:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {obj.mappedBlockIds.map(bId => (
                      <span
                        key={bId}
                        className="font-mono text-[10px] bg-slate-950 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-800"
                      >
                        {bId}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Requirements */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase font-mono">
              Yêu cầu Tiên quyết & Định hướng Sư phạm (Requirements)
            </h4>
            <div className="space-y-1.5">
              {lecturePackage.requirements.map(req => (
                <div key={req.id} className="text-xs text-slate-400 flex items-start gap-2 bg-slate-950/40 p-2 rounded">
                  <span className="font-mono font-bold text-slate-500 shrink-0">{req.id}:</span>
                  <span>{req.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
