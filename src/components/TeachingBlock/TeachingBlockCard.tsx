/**
 * Digital Lecturer Engine - TeachingBlock Card Component
 */

import React from 'react';
import { Clock, HelpCircle, ArrowRight, ShieldCheck, BookOpen, Lightbulb, Play } from 'lucide-react';
import { TeachingBlock } from '../../types/teaching';
import { formatTime } from '../../utils/timing';

interface TeachingBlockCardProps {
  block: TeachingBlock;
  isActive?: boolean;
  onSelect?: () => void;
  onPlayScript?: (text: string) => void;
}

export const TeachingBlockCard: React.FC<TeachingBlockCardProps> = ({
  block,
  isActive = false,
  onSelect,
  onPlayScript
}) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border transition cursor-pointer ${
        isActive
          ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg'
          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
            {block.id}
          </span>
          <span className="text-xs font-mono text-slate-400">
            Slides {block.slideStart} → {block.slideEnd}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
            {block.contentType}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300 flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            {formatTime(block.durationSeconds)}
          </span>
          {onPlayScript && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlayScript(block.lectureText);
              }}
              title="Đọc thử bài giảng bằng TTS"
              className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>
      </div>

      {/* Topic & Purpose */}
      <div className="space-y-1 mb-3">
        <h4 className="text-sm font-bold text-white tracking-tight">
          {block.topic}
        </h4>
        <p className="text-xs text-indigo-300/90 italic">
          Mục đích sư phạm: {block.purpose}
        </p>
      </div>

      {/* Key Points */}
      <div className="space-y-1 mb-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
        <div className="text-[11px] uppercase font-mono text-slate-400 font-semibold flex items-center gap-1.5">
          <Lightbulb className="w-3 h-3 text-amber-400" />
          <span>Luận điểm cốt lõi (Key Points)</span>
        </div>
        <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
          {block.keyPoints.map((pt, idx) => (
            <li key={idx} className="leading-relaxed">{pt}</li>
          ))}
        </ul>
      </div>

      {/* Lecturer Script Excerpt */}
      <div className="space-y-1 mb-3">
        <div className="text-[11px] uppercase font-mono text-slate-400 font-semibold flex items-center gap-1.5">
          <BookOpen className="w-3 h-3 text-indigo-400" />
          <span>Lời giảng sư phạm (Lecturer Script)</span>
        </div>
        <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded border border-slate-800/80 leading-relaxed font-sans">
          "{block.lectureText}"
        </p>
      </div>

      {/* Pedagogical Question & Wait time */}
      {block.question && (
        <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/50 mb-3 space-y-1 text-xs">
          <div className="font-semibold text-indigo-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              Câu hỏi sư phạm (Checkpoint Question)
            </span>
            <span className="text-[11px] font-mono text-indigo-400">
              Thời gian dừng: {block.waitSeconds}s
            </span>
          </div>
          <p className="text-slate-200">
            "{block.question}"
          </p>
          {block.expectedResponse && (
            <p className="text-[11px] text-slate-400 italic">
              Kỳ vọng phản hồi: {block.expectedResponse}
            </p>
          )}
        </div>
      )}

      {/* Transition to next block */}
      {block.transition && (
        <div className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1 border-t border-slate-800/60">
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span className="italic">Chuyển tiếp: "{block.transition}"</span>
        </div>
      )}

      {/* Provenance references */}
      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-[10px] text-slate-400 font-mono">Nguồn xác thực:</span>
        {block.sources.map((s, idx) => (
          <span
            key={idx}
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
              s.isUnsupported
                ? 'bg-rose-950 text-rose-300 border-rose-800'
                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}
          >
            {s.sourceId} ({s.confidence})
          </span>
        ))}
      </div>
    </div>
  );
};
