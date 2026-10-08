/**
 * Digital Lecturer Engine - Live Academic Classroom Component
 * Flagship 4-quadrant layout:
 * - LEFT: PowerPoint Slide Viewer
 * - CENTER: Current TeachingBlock & Live Script
 * - RIGHT: Lecturer Controls, Source Provenance Inspector & Student Interaction
 * - BOTTOM: Pacing Timeline & State Machine Gauge
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  HelpCircle, 
  RotateCcw, 
  ShieldCheck, 
  MessageSquare, 
  Send, 
  Clock, 
  Presentation, 
  ChevronRight, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  Radio,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { LecturePackage, SlideMapItem } from '../../types/lecture';
import { TeachingBlock, TeachingState, TeachingMode, QuestionCategory } from '../../types/teaching';
import { TeachingEngine, TeachingEngineStatus } from '../../services/teachingEngine/teachingEngine';
import { ContinuousLectureEngine } from '../../services/continuousPlayback/continuousLectureEngine';
import { ContinuousPlaybackStatus } from '../../types/continuousPlayback';
import { ContinuousPlaybackControlBar } from './ContinuousPlaybackControlBar';
import { LecturerAudioPlayer } from '../AudioPlayer/LecturerAudioPlayer';
import { formatTime, formatTimeDetailed } from '../../utils/timing';
import { SourceClaim } from '../../types/source';
import { LocalVieNeuTTSGateway, PHAM_TUYEN_VIETNAM_VOICE, VIENEU_V3_TURBO_MODEL } from '../../services/ttsGateway/localVieNeuTtsGateway';
import { TTSQueueManager } from '../../services/continuousPlayback/ttsQueueManager';

interface ClassroomViewProps {
  lecturePackage: LecturePackage;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({ lecturePackage }) => {
  const engineRef = useRef<TeachingEngine | null>(null);
  const continuousEngineRef = useRef<ContinuousLectureEngine | null>(null);
  const [engineStatus, setEngineStatus] = useState<TeachingEngineStatus | null>(null);
  const [continuousStatus, setContinuousStatus] = useState<ContinuousPlaybackStatus | null>(null);
  const [studentQuestionInput, setStudentQuestionInput] = useState('');
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const [interactionResult, setInteractionResult] = useState<{
    category: QuestionCategory;
    response: string;
    returnTransition: string;
  } | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<SourceClaim | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'controls' | 'evidence' | 'interaction'>('controls');

  // Initialize engine & continuous playback engine
  useEffect(() => {
    const engine = new TeachingEngine(lecturePackage, 'FULL_LECTURE');
    engineRef.current = engine;
    engine.startLecture();
    setEngineStatus(engine.getStatus());

    const isMĐ2 = lecturePackage.metadata?.lessonCode === '1MĐ2' || lecturePackage.id === 'LPKG-1MD2-001';
    const continuousEngine = new ContinuousLectureEngine({
      teachingEngine: engine,
      ...(isMĐ2 ? {
        voiceProfile: PHAM_TUYEN_VIETNAM_VOICE,
        ttsModel: VIENEU_V3_TURBO_MODEL,
        fallbackPolicy: 'DENY' as const,
        ttsQueueManager: new TTSQueueManager(
          new LocalVieNeuTTSGateway(),
          PHAM_TUYEN_VIETNAM_VOICE,
          VIENEU_V3_TURBO_MODEL
        )
      } : {}),
      onStatusChange: (status) => {
        setContinuousStatus(status);
        if (engineRef.current) {
          setEngineStatus({ ...engineRef.current.getStatus() });
        }
      }
    });
    continuousEngineRef.current = continuousEngine;
    setContinuousStatus(continuousEngine.getStatus());

    const timer = setInterval(() => {
      if (engineRef.current) {
        engineRef.current.tickSecond();
        setEngineStatus({ ...engineRef.current.getStatus() });
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      continuousEngine.stop();
    };
  }, [lecturePackage]);

  if (!engineStatus) {
    return <div className="p-10 text-center text-slate-400">Đang khởi tạo Giảng đường Kỹ thuật số...</div>;
  }

  const currentBlock = engineStatus.currentBlock || lecturePackage.teachingBlocks[0];
  const currentSlide = engineStatus.currentSlide || lecturePackage.slideMap[0];
  const previousBlock = engineStatus.previousBlock;
  const nextBlock = engineStatus.nextBlock;

  // Continuous Playback Actions
  const handleContinuousPlay = async () => {
    if (continuousEngineRef.current) {
      await continuousEngineRef.current.play();
      setContinuousStatus(continuousEngineRef.current.getStatus());
      if (engineRef.current) {
        setEngineStatus({ ...engineRef.current.getStatus() });
      }
    }
  };

  const handleContinuousPause = () => {
    if (continuousEngineRef.current) {
      continuousEngineRef.current.pause();
      setContinuousStatus(continuousEngineRef.current.getStatus());
      if (engineRef.current) {
        setEngineStatus({ ...engineRef.current.getStatus() });
      }
    }
  };

  const handleContinuousResume = async () => {
    if (continuousEngineRef.current) {
      await continuousEngineRef.current.resume();
      setContinuousStatus(continuousEngineRef.current.getStatus());
      if (engineRef.current) {
        setEngineStatus({ ...engineRef.current.getStatus() });
      }
    }
  };

  const handleContinuousStop = () => {
    if (continuousEngineRef.current) {
      continuousEngineRef.current.stop();
      setContinuousStatus(continuousEngineRef.current.getStatus());
      if (engineRef.current) {
        setEngineStatus({ ...engineRef.current.getStatus() });
      }
    }
  };

  const handleContinuousRestart = async () => {
    if (continuousEngineRef.current) {
      await continuousEngineRef.current.restartFromBeginning();
      setContinuousStatus(continuousEngineRef.current.getStatus());
      if (engineRef.current) {
        setEngineStatus({ ...engineRef.current.getStatus() });
      }
    }
  };

  const handleContinuousRetry = async () => {
    if (continuousEngineRef.current) {
      await continuousEngineRef.current.retryCurrentTeachingPoint();
      setContinuousStatus(continuousEngineRef.current.getStatus());
      if (engineRef.current) {
        setEngineStatus({ ...engineRef.current.getStatus() });
      }
    }
  };

  const handleAllowFallback = async () => {
    if (continuousEngineRef.current) {
      await continuousEngineRef.current.allowBrowserFallbackAndResume();
      setContinuousStatus(continuousEngineRef.current.getStatus());
      if (engineRef.current) {
        setEngineStatus({ ...engineRef.current.getStatus() });
      }
    }
  };

  // Actions
  const handleNextPoint = () => {
    if (engineRef.current) {
      engineRef.current.nextTeachingPoint();
      setInteractionResult(null);
      setEngineStatus({ ...engineRef.current.getStatus() });
    }
  };

  const handlePrevPoint = () => {
    if (engineRef.current) {
      engineRef.current.previousTeachingPoint();
      setInteractionResult(null);
      setEngineStatus({ ...engineRef.current.getStatus() });
    }
  };

  const handleNextSlide = () => {
    if (engineRef.current) {
      engineRef.current.nextSlide();
      setInteractionResult(null);
      setEngineStatus({ ...engineRef.current.getStatus() });
    }
  };

  const handlePrevSlide = () => {
    if (engineRef.current) {
      engineRef.current.previousSlide();
      setInteractionResult(null);
      setEngineStatus({ ...engineRef.current.getStatus() });
    }
  };

  const handleNext = () => {
    if (engineRef.current) {
      engineRef.current.nextBlock();
      setInteractionResult(null);
      setEngineStatus({ ...engineRef.current.getStatus() });
    }
  };

  const handlePrevious = () => {
    if (engineRef.current) {
      engineRef.current.previousBlock();
      setInteractionResult(null);
      setEngineStatus({ ...engineRef.current.getStatus() });
    }
  };

  const handlePauseResume = () => {
    if (engineRef.current) {
      if (engineStatus.isPaused) {
        engineRef.current.resume();
      } else {
        engineRef.current.pause();
      }
      setEngineStatus({ ...engineRef.current.getStatus() });
    }
  };

  const handleAskQuestion = () => {
    if (engineRef.current) {
      engineRef.current.askCheckpointQuestion();
      setEngineStatus({ ...engineRef.current.getStatus() });
    }
  };

  const handleReturnToSequence = () => {
    if (engineRef.current) {
      engineRef.current.returnToSequence();
      setInteractionResult(null);
      setEngineStatus({ ...engineRef.current.getStatus() });
    }
  };

  const handleModeChange = (mode: TeachingMode) => {
    if (engineRef.current) {
      engineRef.current.setMode(mode);
      setEngineStatus({ ...engineRef.current.getStatus() });
    }
  };

  const handleStudentQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentQuestionInput.trim() || !engineRef.current) return;

    setIsAnsweringQuestion(true);
    setRightPanelTab('interaction');

    try {
      // Send question to backend for Gemini/Pedagogical source-grounded classification
      const res = await fetch('/api/interaction/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: studentQuestionInput,
          currentBlockId: currentBlock.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setInteractionResult({
          category: data.category,
          response: data.answer,
          returnTransition: data.returnTransition
        });
      } else {
        // Fallback to client teaching engine
        const fallback = engineRef.current.handleStudentInteraction(studentQuestionInput);
        setInteractionResult(fallback);
      }

      setStudentQuestionInput('');
      setEngineStatus({ ...engineRef.current.getStatus() });
    } catch (err) {
      const fallback = engineRef.current.handleStudentInteraction(studentQuestionInput);
      setInteractionResult(fallback);
      setStudentQuestionInput('');
      setEngineStatus({ ...engineRef.current.getStatus() });
    } finally {
      setIsAnsweringQuestion(false);
    }
  };

  // Status badge styling
  const getStateColor = (state: TeachingState) => {
    switch (state) {
      case 'EXPLAINING': return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'QUESTIONING': return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'WAITING_FOR_RESPONSE': return 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse';
      case 'RESPONDING': return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'PAUSED': return 'bg-slate-800 text-slate-300 border-slate-700';
      default: return 'bg-blue-950 text-blue-300 border-blue-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Teaching Mode & State Machine Indicator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Trạng thái Giảng dạy (State Machine)</span>
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${getStateColor(engineStatus.state)}`}>
              {engineStatus.state}
            </span>
          </div>
        </div>

        {/* Teaching Mode Selector */}
        <div className="flex items-center gap-1 text-xs bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['FULL_LECTURE', 'SUPERVISED_LECTURE', 'TEACHING_ASSISTANT', 'REHEARSAL'] as TeachingMode[]).map(m => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer text-[11px] font-medium ${
                engineStatus.mode === m
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px]">Đã giảng</span>
            <strong className="text-white">{formatTime(engineStatus.elapsedSeconds)}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Còn lại</span>
            <strong className="text-indigo-400">{formatTime(engineStatus.remainingSeconds)}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Tổng kế hoạch</span>
            <strong className="text-slate-400">{formatTime(engineStatus.totalPlannedSeconds)}</strong>
          </div>
        </div>
      </div>

      {/* Continuous Lecture Playback Engine Control Bar (Phase 1.5.7) */}
      {continuousStatus && (
        <ContinuousPlaybackControlBar
          status={continuousStatus}
          onPlay={handleContinuousPlay}
          onPause={handleContinuousPause}
          onResume={handleContinuousResume}
          onStop={handleContinuousStop}
          onRestart={handleContinuousRestart}
          onRetry={handleContinuousRetry}
          onAllowFallback={handleAllowFallback}
        />
      )}

      {/* Main 3-Column Layout: Left (Slides), Center (TeachingBlock), Right (Controls & Provenance) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: PowerPoint Slide Viewer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Presentation className="w-4 h-4 text-indigo-400" />
                PowerPoint Slide Trực quan
              </span>
              <span className="font-mono text-xs text-indigo-400 font-bold">
                Slide {currentSlide.slideNumber} / {lecturePackage.slideMap.length}
              </span>
            </div>

            {/* Rendered Slide Screen */}
            <div className="aspect-video bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 rounded-xl p-5 border border-slate-700 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>

              <div>
                <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider mb-1">
                  {lecturePackage.metadata.courseCode} &bull; {lecturePackage.metadata.courseTitle}
                </div>
                <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                  {currentSlide.title}
                </h3>
              </div>

              {/* Bullet Points on Slide */}
              <div className="space-y-1.5 my-2">
                {currentSlide.previewBullets && currentSlide.previewBullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5"></span>
                    <span className="leading-snug">{bullet}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                <span>Slide #{currentSlide.slideNumber}</span>
                <span>Khối: {currentBlock.id}</span>
              </div>
            </div>

            {/* Slide Navigation List */}
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {lecturePackage.slideMap.map(s => (
                <div
                  key={s.slideNumber}
                  onClick={() => {
                    const block = lecturePackage.teachingBlocks.find(b => 
                      s.slideNumber >= b.slideStart && s.slideNumber <= b.slideEnd
                    );
                    if (block && engineRef.current) {
                      engineRef.current.jumpToBlock(block.id);
                      setEngineStatus({ ...engineRef.current.getStatus() });
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer border ${
                    s.slideNumber === currentSlide.slideNumber
                      ? 'bg-indigo-950/80 border-indigo-700 text-white font-medium'
                      : s.status === 'MISMATCHED'
                      ? 'bg-rose-950/30 border-rose-900/60 text-rose-300'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="truncate">
                    #{s.slideNumber} {s.title}
                  </span>
                  {s.status === 'MISMATCHED' && (
                    <span className="text-[10px] font-mono text-rose-400">Mismatch</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Current TeachingBlock & Live Script (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            {/* Block & Slide & TeachingPoint Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {currentBlock.id}
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Slide {engineStatus.currentSlideNumber}
                </span>
                {engineStatus.currentTeachingPoint && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    {engineStatus.currentTeachingPoint.id}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                  Luận điểm {engineStatus.pointIndexOnCurrentSlide}/{engineStatus.totalPointsOnCurrentSlide}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {engineStatus.currentTeachingPoint?.pointType || currentBlock.contentType}
                </span>
              </div>
            </div>

            {/* Current TeachingPoint Title & Timing */}
            {engineStatus.currentTeachingPoint ? (
              <div className="p-3.5 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-950 rounded-xl border border-purple-800/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Đơn vị giảng dạy hiện tại (TeachingPoint)
                  </span>
                  <span className="text-purple-300">
                    Thời lượng: {formatTime(engineStatus.pointElapsedSeconds)} / {formatTime(engineStatus.currentTeachingPoint.durationSeconds)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                  {engineStatus.currentTeachingPoint.title}
                </h3>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {currentBlock.topic}
                </h3>
                <p className="text-xs text-indigo-300/90 italic">
                  Mục đích: {currentBlock.purpose}
                </p>
              </div>
            )}

            {/* Canonical 5-Step Teaching Point Delivery Script (A - E) */}
            {engineStatus.pointDeliveryScript ? (
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  Chuỗi giảng dạy chuẩn sư phạm (5 Bước A - E)
                </span>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                  {/* A. Nêu luận điểm */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">
                      A. Nêu luận điểm (Statement)
                    </span>
                    <p className="text-white font-medium pl-2 border-l-2 border-indigo-500">
                      {engineStatus.pointDeliveryScript.statement}
                    </p>
                  </div>

                  {/* B. Giải thích luận điểm */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                      B. Giải thích luận điểm (Explanation)
                    </span>
                    <p className="text-slate-200 leading-relaxed pl-2 border-l-2 border-emerald-500">
                      {engineStatus.pointDeliveryScript.explanation}
                    </p>
                  </div>

                  {/* C. Nhấn mạnh nội dung cốt lõi */}
                  {engineStatus.pointDeliveryScript.emphasis && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                        C. Nhấn mạnh nội dung cốt lõi (Emphasis)
                      </span>
                      <p className="text-amber-200 font-medium pl-2 border-l-2 border-amber-500">
                        {engineStatus.pointDeliveryScript.emphasis}
                      </p>
                    </div>
                  )}

                  {/* D. Ví dụ và Liên hệ vận dụng (nếu có dữ liệu) */}
                  {(engineStatus.pointDeliveryScript.example || engineStatus.pointDeliveryScript.application) && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                        D. Ví dụ minh họa & Liên hệ thực tiễn (Evidence & Application)
                      </span>
                      {engineStatus.pointDeliveryScript.example && (
                        <p className="text-cyan-200 pl-2 border-l-2 border-cyan-500">
                          <strong>Ví dụ:</strong> {engineStatus.pointDeliveryScript.example}
                        </p>
                      )}
                      {engineStatus.pointDeliveryScript.application && (
                        <p className="text-cyan-100 pl-2 border-l-2 border-cyan-500">
                          <strong>Liên hệ vận dụng:</strong> {engineStatus.pointDeliveryScript.application}
                        </p>
                      )}
                    </div>
                  )}

                  {/* E. Chuyển sang luận điểm tiếp theo */}
                  {engineStatus.pointDeliveryScript.transition && (
                    <div className="space-y-0.5 pt-1 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                        E. Chuyển tiếp sang luận điểm tiếp theo (Transition)
                      </span>
                      <p className="text-slate-300 italic pl-2 border-l-2 border-slate-600">
                        "{engineStatus.pointDeliveryScript.transition}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Fallback Block Script */
              <div className="space-y-1.5">
                <span className="text-[11px] uppercase font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  Lời giảng trực tiếp của Giảng viên (Live Teaching Script)
                </span>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/90 text-slate-200 text-xs leading-relaxed font-sans shadow-inner">
                  "{currentBlock.lectureText}"
                </div>
              </div>
            )}

            {/* Audio Voice Player for Lecturer */}
            <LecturerAudioPlayer
              currentText={engineStatus.pointDeliveryScript?.fullLectureScript || currentBlock.lectureText}
              teachingBlockId={engineStatus.currentTeachingPointId || currentBlock.id}
            />

            {/* Checkpoint Question & Timer if active */}
            {currentBlock.question && (
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    Câu hỏi kiểm tra tư duy sinh viên
                  </span>
                  <span className="text-[11px] font-mono text-indigo-400">
                    Thời gian chờ: {currentBlock.waitSeconds}s
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium">
                  "{currentBlock.question}"
                </p>
                {engineStatus.activeQuestion && (
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang chờ sinh viên suy nghĩ: {engineStatus.activeQuestion.timeRemainingSeconds}s</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Controls, Provenance Inspector & Student Interaction (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            {/* Panel Tabs */}
            <div className="flex text-xs bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setRightPanelTab('controls')}
                className={`flex-1 py-1 rounded transition text-center font-medium ${
                  rightPanelTab === 'controls' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Điều khiển
              </button>
              <button
                onClick={() => setRightPanelTab('evidence')}
                className={`flex-1 py-1 rounded transition text-center font-medium ${
                  rightPanelTab === 'evidence' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Xuất xứ Nguồn
              </button>
              <button
                onClick={() => setRightPanelTab('interaction')}
                className={`flex-1 py-1 rounded transition text-center font-medium ${
                  rightPanelTab === 'interaction' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hỏi - Đáp
              </button>
            </div>

            {/* TAB 1: Controls */}
            {rightPanelTab === 'controls' && (
              <div className="space-y-3">
                {/* TeachingPoint Level Navigation */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-purple-400 font-bold block">
                    1. Điều khiển cấp Luận điểm (TeachingPoint)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handlePrevPoint}
                      disabled={engineStatus.currentTeachingPointIndex <= 0}
                      className="p-2 bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 border border-purple-800/60 disabled:opacity-40"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                      <span>Luận điểm trước</span>
                    </button>

                    <button
                      onClick={handleNextPoint}
                      disabled={engineStatus.currentTeachingPointIndex >= engineStatus.totalPoints - 1}
                      className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 shadow disabled:opacity-40"
                    >
                      <span>Luận điểm kế tiếp</span>
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Slide Level Navigation */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                    2. Điều khiển cấp Slide
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handlePrevSlide}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                    >
                      <span>&larr; Slide trước</span>
                    </button>

                    <button
                      onClick={handleNextSlide}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                    >
                      <span>Slide kế tiếp &rarr;</span>
                    </button>
                  </div>
                </div>

                {/* Block Level Navigation */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">
                    3. Điều khiển cấp Khối (TeachingBlock)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handlePrevious}
                      disabled={!previousBlock}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700 disabled:opacity-40"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                      <span>Khối trước</span>
                    </button>

                    <button
                      onClick={handleNext}
                      disabled={!nextBlock}
                      className="p-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 shadow disabled:opacity-40"
                    >
                      <span>Khối kế tiếp</span>
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Pause / Resume & Ask Checkpoint Question */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                  <button
                    onClick={handlePauseResume}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    {engineStatus.isPaused ? (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tiếp tục</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tạm dừng</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleAskQuestion}
                    disabled={!currentBlock.question}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700 disabled:opacity-40"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nêu câu hỏi</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Source Provenance Inspector */}
            {rightPanelTab === 'evidence' && (
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                  Cơ sở Nguồn Gốc Xác Thực (Provenance)
                </span>

                {/* Specific TeachingPoint Provenance (Never overridden by Block) */}
                {engineStatus.currentProvenance && (
                  <div className="p-3 bg-purple-950/40 rounded-lg border border-purple-800/70 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-purple-300">
                        {engineStatus.currentProvenance.teachingPointId}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        POINT_PROVENANCE_AUTHENTIC
                      </span>
                    </div>
                    <div className="text-slate-200 font-medium">
                      Nguồn tài liệu: <span className="font-mono text-purple-200">{engineStatus.currentProvenance.sourceId}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-purple-900/40 font-mono space-y-0.5">
                      <div>Slide: #{engineStatus.currentProvenance.slideNumber}</div>
                      {engineStatus.currentProvenance.sourceLocator.section && (
                        <div>Chuyên mục: {engineStatus.currentProvenance.sourceLocator.section}</div>
                      )}
                      {engineStatus.currentProvenance.sourceLocator.pageOrParagraph && (
                        <div>Đoạn/Trang: {engineStatus.currentProvenance.sourceLocator.pageOrParagraph}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
                    Nguồn khối giảng dạy ({currentBlock.id})
                  </span>
                  {currentBlock.sources.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-400">{s.sourceId}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          s.isUnsupported ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {s.confidence}
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium">{s.citation}</p>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <span>Vị trí: {s.pageOrSlide || 'Không xác định'}</span>
                        <span className="uppercase font-mono">{s.contentType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Student Classroom Interaction */}
            {rightPanelTab === 'interaction' && (
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                  Tương tác Sinh viên trong Giờ học
                </span>

                <form onSubmit={handleStudentQuestionSubmit} className="space-y-2">
                  <textarea
                    value={studentQuestionInput}
                    onChange={e => setStudentQuestionInput(e.target.value)}
                    rows={2}
                    placeholder="Nhập câu hỏi của sinh viên..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isAnsweringQuestion || !studentQuestionInput.trim()}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAnsweringQuestion ? 'Đang tra cứu tài liệu nguồn...' : 'Gửi câu hỏi cho Giảng viên'}</span>
                  </button>
                </form>

                {/* Interaction Response */}
                {interactionResult && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-indigo-900/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-indigo-300 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-800">
                        Phân loại: {interactionResult.category}
                      </span>
                    </div>

                    <div className="text-slate-200 space-y-1">
                      <strong className="text-slate-300 block">Lời giải đáp của Giảng viên:</strong>
                      <p className="leading-relaxed font-sans text-[11px] bg-slate-900/80 p-2 rounded border border-slate-800">
                        "{interactionResult.response}"
                      </p>
                    </div>

                    <div className="text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-900/40">
                      <strong>Quay lại tiến trình:</strong> "{interactionResult.returnTransition}"
                    </div>

                    <button
                      onClick={handleReturnToSequence}
                      className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition cursor-pointer"
                    >
                      Tiếp tục bài giảng theo kế hoạch
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM: Pacing Timeline & Section Progress */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white">Dòng thời gian & Tiến độ Giảng dạy (Pacing Timeline)</span>
          </div>
          <span className="font-mono text-slate-400 text-[11px]">
            {engineStatus.currentBlockIndex + 1} / {lecturePackage.teachingBlocks.length} khối hoàn tất
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex border border-slate-800">
          {lecturePackage.teachingBlocks.map((b, idx) => {
            const isPast = idx < engineStatus.currentBlockIndex;
            const isCurrent = idx === engineStatus.currentBlockIndex;
            const widthPct = (b.durationSeconds / engineStatus.totalPlannedSeconds) * 100;

            return (
              <div
                key={b.id}
                style={{ width: `${widthPct}%` }}
                title={`${b.id}: ${b.topic} (${formatTime(b.durationSeconds)})`}
                className={`h-full border-r border-slate-900 transition-colors ${
                  isCurrent
                    ? 'bg-indigo-500 animate-pulse'
                    : isPast
                    ? 'bg-emerald-600'
                    : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
          <span>00:00 (Bắt đầu)</span>
          <span>Khối hiện tại: <strong>{currentBlock.topic}</strong></span>
          <span>{formatTime(engineStatus.totalPlannedSeconds)} (Kết thúc)</span>
        </div>
      </div>
    </div>
  );
};
