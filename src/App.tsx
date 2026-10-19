/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScreenType } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PianoRoll } from './components/PianoRoll';
import { Arranger } from './components/Arranger';
import { Mixer } from './components/Mixer';
import { VirtualInstruments } from './components/VirtualInstruments';
import { ApiModal } from './components/ApiModal';
import { ExportModal } from './components/ExportModal';
import { MidiModal } from './components/MidiModal';
import { AiMusicStudio } from './components/AiMusicStudio';
import { Toast } from './components/Toast';
import { audioEngine } from './audio/audioEngine';
import { midiService } from './services/midiService';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('piano-roll-sequencer');
  const [activeInstrument, setActiveInstrument] = useState<string>('Grand Piano Pro');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isMetronomeOn, setIsMetronomeOn] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(120.0);

  // Playhead position state (throttled to avoid stutter/lag)
  const [playheadPercent, setPlayheadPercent] = useState<number>(34.0);
  const [playPosition, setPlayPosition] = useState<string>('01:03:24');

  // MIDI Learn & Modals
  const [isMidiLearnActive, setIsMidiLearnActive] = useState<boolean>(false);
  const [isMidiModalOpen, setIsMidiModalOpen] = useState<boolean>(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState<boolean>(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIcon, setToastIcon] = useState<string>('check_circle');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, icon: string = 'check_circle') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setToastIcon(icon);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2500);
  }, []);

  // Web MIDI Auto-Discovery on mount
  useEffect(() => {
    audioEngine.initMidi().then((devs) => {
      if (devs.length > 0) {
        showToast(`MIDI 컨트롤러 ${devs.length}대 자동 연결됨`, 'settings_ethernet');
      }
    });
  }, [showToast]);

  // Route MIDI Actions for Transport
  useEffect(() => {
    midiService.setActionHandler((targetId, value) => {
      if (value === 0 && targetId.startsWith('transport-')) return; // ignore note off for buttons

      if (targetId === 'transport-play') {
        handleTogglePlay();
      } else if (targetId === 'transport-stop') {
        handleStop();
      } else if (targetId === 'transport-rewind') {
        handleRewind();
      } else if (targetId === 'transport-record') {
        setIsRecording((prev) => !prev);
      } else if (targetId === 'transport-loop') {
        setIsLooping((prev) => !prev);
      }
    });
  }, []);

  // Glitch-Free Optimized Playhead Engine (Anti-Stutter)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let tickCount = 0;
    let lastStateUpdateTime = 0;

    const loop = (currentTime: number) => {
      const deltaSec = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isPlaying) {
        const loopDuration = 16 / (bpm / 60);
        const percentDelta = (deltaSec / loopDuration) * 100;

        // Throttle React state update to ~30 FPS to eliminate lag & CPU thrashing
        if (currentTime - lastStateUpdateTime > 32) {
          lastStateUpdateTime = currentTime;
          setPlayheadPercent((prev) => {
            let next = prev + percentDelta;
            if (next >= 100) next = 0;
            return next;
          });
        }

        tickCount += deltaSec;
        const beatSec = 60 / bpm;
        if (tickCount >= beatSec) {
          tickCount -= beatSec;
          if (isMetronomeOn) {
            audioEngine.playMetronome(false);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, bpm, isMetronomeOn]);

  // Compute display timecode (throttled)
  useEffect(() => {
    const totalBeats = (playheadPercent / 100) * 16;
    const bar = Math.floor(totalBeats / 4) + 1;
    const beat = Math.floor(totalBeats % 4) + 1;
    const ticks = Math.floor(((totalBeats % 4) % 1) * 96);

    const pad = (n: number) => String(n).padStart(2, '0');
    setPlayPosition(`${pad(bar)}:${pad(beat)}:${pad(ticks)}`);
  }, [playheadPercent]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'r' || e.key === 'R') {
        setIsRecording((prev) => !prev);
        showToast(isRecording ? '녹음 대기 해제' : '녹음 모드 활성화 (Arm Record)');
      } else if (e.key === 'l' || e.key === 'L') {
        setIsLooping((prev) => !prev);
        showToast(isLooping ? '루프 모드 비활성화' : '루프 모드 활성화 (Bar 5-8)');
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMetronomeOn((prev) => !prev);
        showToast(isMetronomeOn ? '메트로놈 OFF' : '메트로놈 ON');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isRecording, isLooping, isMetronomeOn]);

  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        audioEngine.playChordPreview();
        showToast('실시간 결합 오디오 재생 시작 (Playing)', 'play_arrow');
      } else {
        audioEngine.stopAllSounds();
        showToast('오디오 재생 정지 (Paused)', 'pause');
      }
      return next;
    });
  };

  const handleRewind = () => {
    setPlayheadPercent(0);
    showToast('타임라인 01:01:00 위치로 이동', 'fast_rewind');
  };

  const handleStop = () => {
    setIsPlaying(false);
    audioEngine.stopAllSounds();
    setPlayheadPercent(0);
    showToast('재생 정지 및 플레이헤드 초기화', 'stop');
  };

  const handleLoadToPianoRoll = (instName: string) => {
    setActiveInstrument(instName);
    setCurrentScreen('piano-roll-sequencer');
    showToast(`'${instName}' 악기가 피아노 롤에 로드되었습니다!`, 'piano');
  };

  return (
    <div className="bg-surface font-body-md text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* Fixed Left Sidebar */}
      <Sidebar
        activeInstrument={activeInstrument}
        onSelectInstrument={(inst) => {
          setActiveInstrument(inst);
          showToast(`선택된 악기: ${inst}`, 'music_note');
        }}
        onAuditionSample={(sampleName) => {
          showToast(`샘플 오디션: ${sampleName}`, 'graphic_eq');
        }}
      />

      {/* Main Content Layout */}
      <div className="pl-60">
        <Header
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen)}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onRewind={handleRewind}
          onStop={handleStop}
          bpm={bpm}
          onBpmChange={(newBpm) => {
            setBpm(newBpm);
            showToast(`템포 변경: ${newBpm.toFixed(2)} BPM`);
          }}
          playPosition={playPosition}
          isRecording={isRecording}
          onToggleRecord={() => {
            setIsRecording(!isRecording);
            showToast(!isRecording ? '녹음 모드 활성화 (Armed)' : '녹음 대기 해제');
          }}
          isLooping={isLooping}
          onToggleLoop={() => {
            setIsLooping(!isLooping);
            showToast(!isLooping ? '루프 모드 활성화' : '루프 모드 비활성화');
          }}
          isMetronomeOn={isMetronomeOn}
          onToggleMetronome={() => {
            setIsMetronomeOn(!isMetronomeOn);
            showToast(!isMetronomeOn ? '메트로놈 켜짐' : '메트로놈 꺼짐');
          }}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenMidiModal={() => setIsMidiModalOpen(true)}
          onOpenAiStudioModal={() => setIsAiStudioOpen(true)}
          isMidiLearnActive={isMidiLearnActive}
          onToggleMidiLearn={() => {
            setIsMidiLearnActive(!isMidiLearnActive);
            showToast(!isMidiLearnActive ? 'MIDI Learn 모드 활성화! 매핑할 컨트롤을 클릭하세요' : 'MIDI Learn 종료');
          }}
        />

        <main className="relative pt-20 bg-surface min-h-[calc(100vh-5rem)]">
          {currentScreen === 'piano-roll-sequencer' && (
            <PianoRoll
              playheadPosition={playheadPercent}
              isPlaying={isPlaying}
              onShowToast={showToast}
            />
          )}

          {currentScreen === 'multitrack-arranger' && (
            <Arranger
              playheadPosition={playheadPercent}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onShowToast={showToast}
            />
          )}

          {currentScreen === 'mixer-mastering' && (
            <Mixer
              isPlaying={isPlaying}
              onShowToast={showToast}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onOpenMidiModal={() => setIsMidiModalOpen(true)}
              isMidiLearnActive={isMidiLearnActive}
              onToggleMidiLearn={() => setIsMidiLearnActive(!isMidiLearnActive)}
            />
          )}

          {currentScreen === 'virtual-instruments-hub' && (
            <VirtualInstruments
              onLoadToPianoRoll={handleLoadToPianoRoll}
              onOpenApiModal={() => setIsApiModalOpen(true)}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Cloud VST / API Endpoint Settings Modal */}
      <ApiModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        onSave={() => {
          setIsApiModalOpen(false);
          showToast('API 엔드포인트 및 클라우드 VST 인증 정보가 저장되었습니다!');
        }}
      />

      {/* Audio Rendering & Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onShowToast={showToast}
      />

      {/* MIDI Learn & Hardware Device Modal */}
      <MidiModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
        onShowToast={showToast}
      />

      {/* AI Music Studio Modal (Lyria & Search Grounding) */}
      <AiMusicStudio
        isOpen={isAiStudioOpen}
        onClose={() => setIsAiStudioOpen(false)}
        onShowToast={showToast}
        onAddToArranger={(title) => {
          setIsAiStudioOpen(false);
          setCurrentScreen('multitrack-arranger');
          showToast(`'${title}' 트랙이 편곡기에 추가되었습니다!`, 'queue_music');
        }}
      />

      {/* Bottom Notification Toast */}
      <Toast
        message={toastMessage}
        icon={toastIcon}
        isVisible={toastVisible}
      />
    </div>
  );
}
