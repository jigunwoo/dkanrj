import React, { useState } from 'react';
import { audioEngine } from '../audio/audioEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [format, setFormat] = useState<'WAV' | 'MP3' | 'MIDI'>('WAV');
  const [bitDepth, setBitDepth] = useState<'24-bit' | '16-bit' | '32-bit Float'>('24-bit');
  const [sampleRate, setSampleRate] = useState<'48 kHz' | '44.1 kHz' | '96 kHz'>('48 kHz');
  const [isDitherEnabled, setIsDitherEnabled] = useState(true);
  const [normalizePeak, setNormalizePeak] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleStartExport = () => {
    setIsRendering(true);
    setProgress(15);

    const step1 = setTimeout(() => setProgress(45), 400);
    const step2 = setTimeout(() => setProgress(85), 900);
    const step3 = setTimeout(() => {
      setProgress(100);

      // Real WAV download trigger
      const wavBlob = audioEngine.generateWavFile('Midnight_Horizon_Master');
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Midnight_Horizon_Master.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsRendering(false);
      onShowToast(`'Midnight_Horizon_Master.${format.toLowerCase()}' 음원 추출 완료!`, 'download_done');
      onClose();
    }, 1400);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-surface-container-low rounded-xl w-full max-w-lg p-6 shadow-2xl relative space-y-5 border border-surface-variant/40">
        <div className="flex items-center justify-between border-b border-surface-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">download</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              프로젝트 마스터 음원 익스포트 (Export Audio)
            </h3>
          </div>
          <button onClick={onClose} className="text-outline hover:text-on-surface p-1 rounded-lg cursor-pointer">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="font-label-ui text-label-ui text-outline uppercase tracking-wider block">
            출력 오디오 포맷
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['WAV', 'MP3', 'MIDI'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`py-2.5 px-3 rounded-lg flex flex-col items-center justify-center font-semibold transition-all border ${
                  format === fmt
                    ? 'bg-primary text-on-primary border-primary shadow-[0_0_10px_rgba(78,222,163,0.4)]'
                    : 'bg-surface-container text-on-surface-variant border-surface-variant/30 hover:bg-surface-container-high'
                }`}
              >
                <span className="font-label-mono-md text-label-mono-md">{fmt}</span>
                <span className="font-label-mono-sm text-xs opacity-80">
                  {fmt === 'WAV' ? '무손실 Studio' : fmt === 'MP3' ? '320kbps' : '트랙 MIDI'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Resolution Options */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-label-ui text-label-ui text-outline uppercase tracking-wider block">
              샘플 레이트
            </label>
            <select
              value={sampleRate}
              onChange={(e) => setSampleRate(e.target.value as typeof sampleRate)}
              className="w-full bg-surface-container text-on-surface font-label-mono-sm text-xs p-2.5 rounded-lg outline-none border border-surface-variant/30"
            >
              <option>44.1 kHz (CD Quality)</option>
              <option>48 kHz (Studio Standard)</option>
              <option>96 kHz (Hi-Res Audio)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-label-ui text-label-ui text-outline uppercase tracking-wider block">
              비트 뎁스
            </label>
            <select
              value={bitDepth}
              onChange={(e) => setBitDepth(e.target.value as typeof bitDepth)}
              className="w-full bg-surface-container text-on-surface font-label-mono-sm text-xs p-2.5 rounded-lg outline-none border border-surface-variant/30"
            >
              <option>16-bit</option>
              <option>24-bit</option>
              <option>32-bit Float</option>
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2 pt-1">
          <label className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container cursor-pointer border border-surface-variant/20">
            <div className="flex flex-col">
              <span className="font-body-sm text-on-surface font-semibold">True Peak 노멀라이징 (-0.1 dB)</span>
              <span className="font-label-mono-sm text-outline">디지털 인터샘플 클리핑 방지</span>
            </div>
            <input
              type="checkbox"
              checked={normalizePeak}
              onChange={(e) => setNormalizePeak(e.target.checked)}
              className="accent-emerald-400 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container cursor-pointer border border-surface-variant/20">
            <div className="flex flex-col">
              <span className="font-body-sm text-on-surface font-semibold">TPDF Shaped 디더링 활성화</span>
              <span className="font-label-mono-sm text-outline">양자화 왜곡 잡음 최소화</span>
            </div>
            <input
              type="checkbox"
              checked={isDitherEnabled}
              onChange={(e) => setIsDitherEnabled(e.target.checked)}
              className="accent-emerald-400 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>

        {/* Progress Bar when rendering */}
        {isRendering && (
          <div className="space-y-1.5 bg-surface-container-lowest p-3 rounded-lg border border-primary/30">
            <div className="flex justify-between font-label-mono-sm text-xs">
              <span className="text-primary font-semibold">인코딩 및 마스터링 중...</span>
              <span className="text-primary font-bold">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-primary rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(78,222,163,0.8)]"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={isRendering}
            className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-body-sm text-body-sm hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleStartExport}
            disabled={isRendering}
            className="px-5 py-2 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:bg-primary-fixed transition-all shadow-[0_0_12px_rgba(78,222,163,0.4)] flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-sm ${isRendering ? 'animate-spin' : ''}`}>
              {isRendering ? 'progress_activity' : 'file_download'}
            </span>
            <span>{isRendering ? '렌더링 진행 중...' : '익스포트 시작'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
