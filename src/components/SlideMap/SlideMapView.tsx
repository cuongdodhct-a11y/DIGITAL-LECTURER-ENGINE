/**
 * Digital Lecturer Engine - Slide Map Viewer Component
 */

import React from 'react';
import { Presentation, AlertTriangle, CheckCircle2, ArrowRight, FileQuestion } from 'lucide-react';
import { SlideMapItem } from '../../types/lecture';

interface SlideMapViewProps {
  slideMap: SlideMapItem[];
  selectedSlideNumber: number;
  onSelectSlide: (slideNumber: number) => void;
}

export const SlideMapView: React.FC<SlideMapViewProps> = ({
  slideMap,
  selectedSlideNumber,
  onSelectSlide
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Presentation className="w-4 h-4 text-indigo-400" />
            <span>PowerPoint Slide Mapping ({slideMap.length} slides)</span>
          </h4>
          <p className="text-xs text-slate-400">
            Ánh xạ cấu trúc trực quan của PowerPoint vào các đơn vị sư phạm TeachingBlocks
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {slideMap.filter(s => s.status === 'MAPPED').length} Mapped
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            {slideMap.filter(s => s.status === 'MISMATCHED').length} Mismatched
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {slideMap.map(slide => {
          const isSelected = slide.slideNumber === selectedSlideNumber;
          const isMismatch = slide.status === 'MISMATCHED';

          return (
            <div
              key={slide.slideNumber}
              onClick={() => onSelectSlide(slide.slideNumber)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                isMismatch
                  ? 'bg-rose-950/30 border-rose-700/80 hover:border-rose-500'
                  : isSelected
                  ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Slide Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    Slide #{slide.slideNumber}
                  </span>

                  {isMismatch ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-900 text-rose-200 border border-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-300" />
                      MISMATCH
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      MAPPED
                    </span>
                  )}
                </div>

                {/* Simulated Slide Visual Preview */}
                <div className="aspect-video bg-slate-950 rounded-lg p-2.5 border border-slate-800/80 flex flex-col justify-between mb-2.5">
                  <div className="text-[11px] font-bold text-white line-clamp-1 border-b border-slate-800 pb-1">
                    {slide.title}
                  </div>
                  <div className="space-y-0.5 my-1">
                    {slide.previewBullets && slide.previewBullets.map((b, idx) => (
                      <div key={idx} className="text-[9px] text-slate-400 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0"></span>
                        <span className="truncate">{b}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 text-right">
                    Slide {slide.slideNumber}
                  </div>
                </div>

                <h5 className="text-xs font-semibold text-slate-200 line-clamp-1">
                  {slide.title}
                </h5>
              </div>

              {/* Mapped Block Reference or Issue Flag */}
              <div className="mt-3 pt-2 border-t border-slate-800/80">
                {isMismatch ? (
                  <div className="space-y-1">
                    <p className="text-[11px] text-rose-300 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>Lạc đề (SLIDE_TOPIC_MISMATCH)</span>
                    </p>
                    <p className="text-[10px] text-rose-400/90 leading-tight">
                      {slide.issues[0]}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-indigo-400" />
                      Khối giảng dạy:
                    </span>
                    <span className="font-mono font-bold text-indigo-300 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-900">
                      {slide.mappedTeachingBlockIds.join(', ') || 'Chưa gán'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
