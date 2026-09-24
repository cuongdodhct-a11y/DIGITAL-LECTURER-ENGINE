/**
 * Digital Lecturer Engine - Lecturer Audio Player Component
 * Connects to TTS Gateway (gemini-3.8-flash-tts / gemini-3.8-flash-lite-tts) with cache & Web Speech fallback.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Sparkles, Check, Mic } from 'lucide-react';
import { VoiceProfile, TTSModelName } from '../../types/audio';
import { DEFAULT_VOICE_PROFILES } from '../../services/ttsGateway/voiceProfiles';
import { defaultTTSGateway } from '../../services/ttsGateway/ttsGateway';

interface LecturerAudioPlayerProps {
  currentText: string;
  teachingBlockId?: string;
  autoPlay?: boolean;
}

export const LecturerAudioPlayer: React.FC<LecturerAudioPlayerProps> = ({
  currentText,
  teachingBlockId,
  autoPlay = false
}) => {
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile>(DEFAULT_VOICE_PROFILES[0]);
  const [ttsModel, setTtsModel] = useState<TTSModelName>('gemini-3.8-flash-lite-tts');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'OFFICIAL' | 'FALLBACK'>('OFFICIAL');
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop any playing audio if block changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [teachingBlockId]);

  const handleSynthesizeAndPlay = async () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await defaultTTSGateway.synthesize({
        text: currentText,
        voiceProfile: selectedVoice,
        model: ttsModel,
        teachingBlockId,
        language: selectedVoice.language[0],
        fallbackPolicy: 'ALLOW_BROWSER_TTS'
      });

      setIsCached(response.cached);

      if (response.audioBase64) {
        setVoiceStatus('OFFICIAL');
        // Base64 audio playback
        const audioSrc = `data:${response.mimeType || 'audio/mp3'};base64,${response.audioBase64}`;
        if (!audioRef.current) {
          audioRef.current = new Audio(audioSrc);
        } else {
          audioRef.current.src = audioSrc;
        }

        audioRef.current.volume = volume;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => {
          setIsPlaying(false);
          fallbackWebSpeech();
        };

        await audioRef.current.play();
        setIsPlaying(true);
      } else {
        // Fallback to high-quality browser Web Speech API
        setVoiceStatus('FALLBACK');
        fallbackWebSpeech();
      }
    } catch (err) {
      console.warn('[LecturerAudioPlayer] Falling back to Web Speech synthesis:', err);
      setVoiceStatus('FALLBACK');
      fallbackWebSpeech();
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackWebSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentText);
      utterance.lang = selectedVoice.language[0] || 'vi-VN';
      utterance.rate = selectedVoice.rateAdjustment || 1.0;
      utterance.pitch = selectedVoice.pitchAdjustment || 1.0;

      // Select matching browser voice if available
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang.startsWith('vi') || v.lang.startsWith('en'));
      if (match) utterance.voice = match;

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-white">TTS Gateway & Giọng đọc Giảng viên</span>
          {isCached && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded border border-emerald-800 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Cache Hit
            </span>
          )}
        </div>

        {/* Model Selector */}
        <div className="flex text-[11px] font-mono bg-slate-900 rounded p-0.5 border border-slate-800">
          <button
            onClick={() => setTtsModel('gemini-3.8-flash-tts')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              ttsModel === 'gemini-3.8-flash-tts'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Mô hình chính: Chất lượng cao cho diễn giảng học thuật"
          >
            flash-tts
          </button>
          <button
            onClick={() => setTtsModel('gemini-3.8-flash-lite-tts')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              ttsModel === 'gemini-3.8-flash-lite-tts'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Mô hình phụ: Tốc độ cao cho bài giảng dài"
          >
            flash-lite-tts
          </button>
        </div>
      </div>

      {/* Voice Profile Selector */}
      <div className="space-y-1">
        <label className="block text-[11px] font-medium text-slate-400">
          Hồ sơ Giọng đọc (Voice Profile)
        </label>
        <select
          value={selectedVoice.id}
          onChange={e => {
            const v = DEFAULT_VOICE_PROFILES.find(p => p.id === e.target.value);
            if (v) setSelectedVoice(v);
          }}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          {DEFAULT_VOICE_PROFILES.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.style})
            </option>
          ))}
        </select>
        <p className="text-[10px] text-slate-500 italic">
          {selectedVoice.description}
        </p>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSynthesizeAndPlay}
            disabled={isLoading || !currentText}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <span>Đang kết xuất âm thanh...</span>
            ) : isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Tạm dừng đọc</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Phát bài giảng (TTS)</span>
              </>
            )}
          </button>

          <button
            onClick={handleStop}
            disabled={!isPlaying}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer disabled:opacity-40"
            title="Dừng hẳn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          {isPlaying && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              voiceStatus === 'OFFICIAL'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-cyan-950 text-cyan-300 border-cyan-700'
            }`}>
              {voiceStatus === 'OFFICIAL' ? '● GIỌNG GIẢNG CHUẨN' : '● GIỌNG DỰ PHÒNG'}
            </span>
          )}
          <span className="text-[10px] font-mono">{isPlaying ? 'Đang phát...' : 'Sẵn sàng'}</span>
        </div>
      </div>
    </div>
  );
};
