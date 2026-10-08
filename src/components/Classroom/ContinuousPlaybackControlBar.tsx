/**
 * Phase 1.5.7 — Continuous Lecture Player Bar
 * Modern UI component embedded in ClassroomView to provide one-click continuous lecture playback:
 * - "PHÁT BÀI GIẢNG" (Continuous Play)
 * - Tạm dừng / Tiếp tục (Pause / Resume)
 * - Dừng hẳn (Stop)
 * - Live state indicators (IDLE, PLAYING, PAUSED, STOPPING, COMPLETED, ERROR)
 * - TTS Queue inspector & active progress
 */

import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Volume2, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Radio, 
  Sparkles,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { ContinuousPlaybackStatus } from '../../types/continuousPlayback';

interface ContinuousPlaybackControlBarProps {
  status: ContinuousPlaybackStatus;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRestart: () => void;
  onRetry?: () => void;
  onAllowFallback?: () => void;
}

export const ContinuousPlaybackControlBar: React.FC<ContinuousPlaybackControlBarProps> = ({
  status,
  onPlay,
  onPause,
  onResume,
  onStop,
  onRestart,
  onRetry,
  onAllowFallback
}) => {
  const getBadgeStyle = () => {
    switch (status.state) {
      case 'PLAYING':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700/80 animate-pulse';
      case 'PAUSED':
        return 'bg-amber-950 text-amber-300 border-amber-700/80';
      case 'COMPLETED':
        return 'bg-blue-950 text-blue-300 border-blue-700/80';
      case 'ERROR':
        return 'bg-rose-950 text-rose-300 border-rose-700/80';
      case 'VOICE_UNAVAILABLE':
        return 'bg-rose-950 text-rose-300 border-rose-700/80 ring-2 ring-rose-500/50 animate-pulse';
      case 'STOPPING':
        return 'bg-slate-900 text-slate-300 border-slate-700';
      default:
        return 'bg-slate-950 text-slate-400 border-slate-800';
    }
  };

  const renderVoiceBadge = () => {
    if (status.state === 'VOICE_UNAVAILABLE') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-950 text-rose-300 border border-rose-600/80 flex items-center gap-1.5 shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          ● GIỌNG GIẢNG CHUẨN KHÔNG KHẢ DỤNG
        </span>
      );
    }

    if (status.voiceStatus === 'FALLBACK' || status.audioSourceType === 'BROWSER_TTS') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-600/80 flex items-center gap-1.5 shadow-sm">
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          ● GIỌNG DỰ PHÒNG (Browser Speech)
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-600/80 flex items-center gap-1.5 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        ● GIỌNG GIẢNG CHUẨN ({status.voiceName || 'Giảng viên số'})
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-900/60 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* State Badge, Title & Voice Status */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${status.state === 'PLAYING' ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-slate-900 border-slate-800'}`}>
            <Radio className={`w-5 h-5 ${status.state === 'PLAYING' ? 'text-indigo-400 animate-spin' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                Động Cơ Giảng Bài Liên Tục
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${getBadgeStyle()}`}>
                {status.state}
              </span>
              {renderVoiceBadge()}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {status.state === 'PLAYING' && (
                <span>Đang giảng tự động: Luận điểm <strong>{status.currentTeachingPointId}</strong> (Slide {status.currentSlideNumber})</span>
              )}
              {status.state === 'PAUSED' && (
                <span>Tạm dừng tại Luận điểm: <strong>{status.currentTeachingPointId}</strong></span>
              )}
              {status.state === 'IDLE' && (
                <span>Sẵn sàng phát bài giảng với Giọng giảng Chuẩn</span>
              )}
              {status.state === 'COMPLETED' && (
                <span className="text-emerald-300 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" /> Đã hoàn thành toàn bộ bài giảng liên tục
                </span>
              )}
              {status.state === 'VOICE_UNAVAILABLE' && (
                <span className="text-rose-300 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 inline" /> Giọng giảng chuẩn hiện không khả dụng. Bài giảng đang bảo lưu tại {status.currentTeachingPointId} (Slide {status.currentSlideNumber}).
                </span>
              )}
              {status.state === 'ERROR' && (
                <span className="text-rose-300 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 inline" /> {status.errorMessage || 'Lỗi phát bài giảng'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          {status.state === 'PLAYING' ? (
            <button
              onClick={onPause}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>TẠM DỪNG</span>
            </button>
          ) : status.state === 'PAUSED' ? (
            <button
              onClick={onResume}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>TIẾP TỤC GIẢNG</span>
            </button>
          ) : status.state === 'VOICE_UNAVAILABLE' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 ring-1 ring-indigo-400"
                title="Thử lại kết nối Gemini TTS với giọng giảng chuẩn"
              >
                <RotateCcw className="w-4 h-4" />
                <span>THỬ LẠI GIỌNG CHUẨN</span>
              </button>
              {onAllowFallback && (
                <button
                  onClick={onAllowFallback}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-600/50 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
                  title="Cho phép sử dụng giọng đọc trình duyệt tạm thời để tiếp tục bài giảng"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>DÙNG GIỌNG DỰ PHÒNG</span>
                </button>
              )}
            </div>
          ) : status.state === 'ERROR' ? (
            <button
              onClick={onRetry || onPlay}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
              title="Thử lại luận điểm đang lỗi mà không bỏ qua nội dung"
            >
              <RotateCcw className="w-4 h-4" />
              <span>THỬ LẠI LUẬN ĐIỂM</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-extrabold tracking-wide transition flex items-center gap-2.5 shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95 ring-1 ring-white/20"
            >
              <Play className="w-4 h-4 fill-current text-emerald-300" />
              <span>PHÁT BÀI GIẢNG (LIÊN TỤC)</span>
            </button>
          )}

          {(status.state === 'PLAYING' || status.state === 'PAUSED' || status.state === 'VOICE_UNAVAILABLE') && (
            <button
              onClick={onStop}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Dừng phát và giữ vị trí hiện tại"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Dừng</span>
            </button>
          )}

          <button
            onClick={onRestart}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-800 cursor-pointer"
            title="Bắt đầu lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Từ đầu</span>
          </button>
        </div>
      </div>

      {/* Progress Track & Queue Info */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span>Tiến độ bài học: <strong className="text-white">{status.currentPointIndex + 1}</strong> / {status.totalPoints} Luận điểm</span>
          <span>&bull;</span>
          <span>Slide: <strong className="text-indigo-400">{status.currentSlideNumber}</strong></span>
          <span>&bull;</span>
          {status.audioSourceType && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              status.audioSourceType === 'GEMINI_TTS'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                : status.audioSourceType === 'BROWSER_TTS'
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                : 'bg-purple-950/80 text-purple-300 border-purple-700/60'
            }`}>
              SOURCE: {status.audioSourceType} ({status.voiceStatus || 'OFFICIAL'})
            </span>
          )}
          <span>&bull;</span>
          <span className="text-slate-400">
            Model: <strong className="text-indigo-300">{status.ttsModel || 'gemini-3.8-flash-lite-tts'}</strong>
          </span>
          <span>&bull;</span>
          <span className="text-slate-400">
            Luồng phát: <strong className={status.activeAudioCount <= 1 ? 'text-emerald-400' : 'text-rose-400'}>{status.activeAudioCount}</strong> (max: 1)
          </span>
        </div>

        <div className="flex items-center gap-2 text-indigo-300/80">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>TTS Queue: {status.queue.filter(q => q.audioStatus === 'READY').length} sẵn sàng &bull; {status.queue.filter(q => q.audioStatus === 'QUEUED' || q.audioStatus === 'SYNTHESIZING').length} đang nạp</span>
        </div>
      </div>
    </div>
  );
};
