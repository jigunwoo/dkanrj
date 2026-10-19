import React, { useState, useEffect } from 'react';
import { ScreenType } from '../types';
import { audioEngine } from '../audio/audioEngine';
import { midiService } from '../services/midiService';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRewind: () => void;
  onStop: () => void;
  bpm: number;
  onBpmChange: (newBpm: number) => void;
  playPosition: string;
  isRecording: boolean;
  onToggleRecord: () => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  isMetronomeOn: boolean;
  onToggleMetronome: () => void;
  onOpenExportModal: () => void;
  onOpenMidiModal: () => void;
  onOpenAiStudioModal: () => void;
  isMidiLearnActive: boolean;
  onToggleMidiLearn: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  isPlaying,
  onTogglePlay,
  onRewind,
  onStop,
  bpm,
  onBpmChange,
  playPosition,
  isRecording,
  onToggleRecord,
  isLooping,
  onToggleLoop,
  isMetronomeOn,
  onToggleMetronome,
  onOpenExportModal,
  onOpenMidiModal,
  onOpenAiStudioModal,
  isMidiLearnActive,
  onToggleMidiLearn,
}) => {
  const [songTitle, setSongTitle] = useState('Midnight Horizon');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingBpm, setIsEditingBpm] = useState(false);
  const [bpmInput, setBpmInput] = useState(bpm.toFixed(2));
  const [snapValue, setSnapValue] = useState('1/16 SNAP');
  const [showSnapMenu, setShowSnapMenu] = useState(false);

  useEffect(() => {
    setBpmInput(bpm.toFixed(2));
  }, [bpm]);

  const handleBpmSubmit = () => {
    const parsed = parseFloat(bpmInput);
    if (!isNaN(parsed) && parsed >= 40 && parsed <= 280) {
      onBpmChange(parsed);
    } else {
      setBpmInput(bpm.toFixed(2));
    }
    setIsEditingBpm(false);
  };

  const navItems: { id: ScreenType; label: string }[] = [
    { id: 'piano-roll-sequencer', label: '피아노 롤 & 시퀀서 (Piano Roll)' },
    { id: 'multitrack-arranger', label: '멀티트랙 편곡기 (Arranger)' },
    { id: 'virtual-instruments-hub', label: '가상 악기 허브 (V-Instruments)' },
    { id: 'mixer-mastering', label: '믹서 & 마스터링 (Mixer)' },
  ];

  const handleTransportMidiLearn = (targetId: string, label: string, e: React.MouseEvent) => {
    if (!isMidiLearnActive) return;
    e.stopPropagation();
    midiService.startLearning(targetId, label);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-surface-container-lowest/95 backdrop-blur-xl z-40 flex flex-col justify-between shadow-[0_4px_16px_rgba(0,0,0,0.5)] border-b border-surface-variant/30 select-none">
      {/* Top 48px Command Deck */}
      <div className="h-12 w-full px-4 flex items-center justify-between gap-3 border-b border-surface-variant/30">
        {/* Left Branding */}
        <div className="flex items-center gap-3 min-w-[280px]">
          <div className="flex items-center gap-2">
            <img
              alt="SoundCraft Studio Logo"
              className="h-8 w-auto object-contain cursor-pointer"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WvzvGXlel_f2F0S-I2W02KCxKCiuruPY3QHVchsrtmko17wkGzSyxxURPqNoV_fPEQwzE_O28-eUybrXOtEs8a-pxkfc07a3HwFSwWHAYh-N5TCHyh1Z242wA1DeEiCBmaKpB7Pn3QrF1PQ2arIbiyVjzrbORTRMqUAHVqeFocF7vQmQQyz1aABuEMLtTIcgL-DCNkBAsRB38f51O1LMtSjQoXPBRTM0fSKySWliZmKoPSo7CCLLbSX9w"
              onClick={() => onNavigate('piano-roll-sequencer')}
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface font-semibold leading-tight">
                SoundCraft Studio
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                    autoFocus
                    className="bg-surface-container-high text-xs px-1 rounded text-on-surface outline-none w-28"
                  />
                ) : (
                  <span
                    onClick={() => setIsEditingTitle(true)}
                    className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[150px] cursor-pointer hover:text-primary transition-colors"
                  >
                    {songTitle}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-low border border-surface-variant/30">
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
              {Math.round(bpm)} BPM
            </span>
            <span className="text-outline-variant font-label-mono-sm text-label-mono-sm">•</span>
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">4/4</span>
          </div>
        </div>

        {/* Center Transport & Clock Console with MIDI Learn */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-container-high rounded-lg p-0.5 gap-0.5 shadow-inner">
            {/* Rewind */}
            <button
              onClick={(e) => {
                if (isMidiLearnActive) handleTransportMidiLearn('transport-rewind', 'Rewind', e);
                else onRewind();
              }}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
                midiService.isLearning('transport-rewind')
                  ? 'ring-2 ring-secondary animate-pulse'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
              }`}
              title="Rewind (01:00:00)"
            >
              <span className="material-symbols-outlined text-lg">fast_rewind</span>
            </button>

            {/* Play */}
            <button
              onClick={(e) => {
                if (isMidiLearnActive) handleTransportMidiLearn('transport-play', 'Play / Pause', e);
                else onTogglePlay();
              }}
              className={`w-8 h-8 rounded flex items-center justify-center transition-all cursor-pointer ${
                midiService.isLearning('transport-play')
                  ? 'ring-2 ring-secondary animate-pulse'
                  : isPlaying
                  ? 'bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(16,185,129,0.7)] ring-1 ring-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
              }`}
              title={isPlaying ? 'Pause' : 'Play (Space)'}
            >
              <span className="material-symbols-outlined text-lg">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Stop */}
            <button
              onClick={(e) => {
                if (isMidiLearnActive) handleTransportMidiLearn('transport-stop', 'Stop', e);
                else onStop();
              }}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
                midiService.isLearning('transport-stop')
                  ? 'ring-2 ring-secondary animate-pulse'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
              }`}
              title="Stop"
            >
              <span className="material-symbols-outlined text-lg">stop</span>
            </button>

            {/* Record */}
            <button
              onClick={(e) => {
                if (isMidiLearnActive) handleTransportMidiLearn('transport-record', 'Record', e);
                else onToggleRecord();
              }}
              className={`w-8 h-8 rounded flex items-center justify-center transition-all relative cursor-pointer ${
                midiService.isLearning('transport-record')
                  ? 'ring-2 ring-secondary animate-pulse'
                  : isRecording
                  ? 'bg-error-container text-on-error-container ring-1 ring-error'
                  : 'text-error hover:bg-error-container/30'
              }`}
              title="Arm Record (R)"
            >
              <span className="material-symbols-outlined text-lg">fiber_manual_record</span>
              {isRecording && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-tertiary-container animate-ping" />
              )}
            </button>

            {/* Loop */}
            <button
              onClick={(e) => {
                if (isMidiLearnActive) handleTransportMidiLearn('transport-loop', 'Loop', e);
                else onToggleLoop();
              }}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
                midiService.isLearning('transport-loop')
                  ? 'ring-2 ring-secondary animate-pulse'
                  : isLooping
                  ? 'text-primary bg-primary/10'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
              }`}
              title="Loop Region (L)"
            >
              <span className="material-symbols-outlined text-lg">repeat</span>
            </button>
          </div>

          {/* Time & Telemetry display */}
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-1 rounded-lg border border-surface-variant/40 shadow-inner">
            <div className="flex flex-col items-center">
              <span className="font-label-ui text-label-ui text-outline">BPM</span>
              {isEditingBpm ? (
                <input
                  type="text"
                  value={bpmInput}
                  onChange={(e) => setBpmInput(e.target.value)}
                  onBlur={handleBpmSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleBpmSubmit()}
                  autoFocus
                  className="font-label-mono-md text-label-mono-md text-primary font-semibold w-14 bg-surface-container-high rounded text-center outline-none"
                />
              ) : (
                <span
                  onClick={() => setIsEditingBpm(true)}
                  className="font-label-mono-md text-label-mono-md text-primary font-semibold cursor-pointer hover:underline"
                >
                  {bpm.toFixed(2)}
                </span>
              )}
            </div>

            <div className="h-6 w-px bg-surface-variant/50 mx-1" />

            <div className="flex flex-col items-center">
              <span className="font-label-ui text-label-ui text-outline">TIME</span>
              <span className="font-label-mono-md text-label-mono-md text-on-surface">4 / 4</span>
            </div>

            <div className="h-6 w-px bg-surface-variant/50 mx-1" />

            <div className="flex flex-col items-center">
              <span className="font-label-ui text-label-ui text-outline">POSITION</span>
              <span className="font-label-mono-md text-label-mono-md text-tertiary font-semibold tracking-wider font-mono">
                {playPosition}
              </span>
            </div>
          </div>

          {/* Metronome & MIDI Learn Quick Button */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => {
                onToggleMetronome();
                if (!isMetronomeOn) audioEngine.playMetronome(true);
              }}
              className={`px-2 py-1 rounded font-label-mono-sm text-label-mono-sm transition-colors cursor-pointer ${
                isMetronomeOn
                  ? 'bg-primary text-on-primary font-bold shadow-[0_0_8px_rgba(78,222,163,0.5)]'
                  : 'bg-surface-container text-primary hover:bg-surface-container-high'
              }`}
            >
              METRO
            </button>

            {/* Quick MIDI Learn Toggle */}
            <button
              onClick={onToggleMidiLearn}
              className={`px-2 py-1 rounded font-label-mono-sm text-label-mono-sm transition-colors cursor-pointer border ${
                isMidiLearnActive
                  ? 'bg-secondary text-on-secondary font-bold border-secondary animate-pulse'
                  : 'bg-surface-container text-secondary hover:bg-surface-container-high border-surface-variant/30'
              }`}
              title="Toggle MIDI Learn Mode"
            >
              MIDI LEARN
            </button>
          </div>
        </div>

        {/* Right Status Badges, AI Studio & Export */}
        <div className="flex items-center gap-3">
          {/* AI Music Studio Button (Lyria & Search Grounding) */}
          <button
            onClick={onOpenAiStudioModal}
            className="px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-primary font-body-sm text-xs font-semibold flex items-center gap-1.5 transition-colors border border-primary/30 shadow-sm cursor-pointer"
            title="Google Lyria Music & Search Grounding"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span>AI Music Studio</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:bg-primary-fixed transition-colors flex items-center gap-1 shadow-[0_0_10px_rgba(78,222,163,0.3)] active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Song</span>
          </button>

          <img
            alt="Profile"
            onClick={onOpenMidiModal}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-primary/40 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUWeHaFn8i6zZvxSqePW6fwlF9If6Tfe3lzo2a9NVil4K_c8hpg1FF1tHGxp8QOg0R9qdD0Rwz7fvA00uoUpPiKCmSi8Zao48Tb3fpxRB7-6JNeuzT0k5ga-ANt0RAtO_lfBGrMA_sX7J_SlzWZxazDxdtZd_f1v6t06N7lz5gTupiTECnPT8mnilI46FH9uWRqaeucXk_3_PmdMYV4b72T0GyrGY8-KE2hZx8w76rD2KJo_Ry6RMJ"
            title="MIDI 장비 및 설정 관리"
          />
        </div>
      </div>

      {/* Sub-Navigation Tabs Row */}
      <div className="h-8 w-full px-4 flex items-center justify-between bg-surface-container-low border-t border-surface-variant/20">
        <nav className="flex items-center gap-1 h-full pl-60">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`h-full flex items-center px-3 transition-colors text-xs font-body-sm cursor-pointer ${
                  isActive
                    ? 'bg-surface-container-high text-primary font-semibold border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden xl:flex items-center gap-3">
          <div className="flex items-center gap-1 text-on-surface-variant font-label-mono-sm text-label-mono-sm">
            <span className="material-symbols-outlined text-xs text-primary">graphic_eq</span>
            <span>Buffer: 128 spls (2.7ms)</span>
          </div>
        </div>
      </div>
    </header>
  );
};
