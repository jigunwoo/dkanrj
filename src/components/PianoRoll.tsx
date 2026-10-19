import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NoteItem } from '../types';
import { audioEngine } from '../audio/audioEngine';

interface PianoRollProps {
  playheadPosition: number;
  isPlaying: boolean;
  onShowToast: (msg: string, icon?: string) => void;
}

export const PianoRoll: React.FC<PianoRollProps> = ({
  playheadPosition,
  isPlaying,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'piano' | 'synth' | 'violin' | 'drums'>('piano');
  const [activeTool, setActiveTool] = useState<'draw' | 'eraser' | 'velocity' | 'select' | 'cut' | 'mute'>('draw');
  const [snap, setSnap] = useState('1/16 Beat');
  const [scaleGuide, setScaleGuide] = useState('C 마이너 펜타토닉');

  // Octave & Macro
  const [octave, setOctave] = useState<number>(0);
  const [reverbVal, setReverbVal] = useState<number>(42);
  const [attackVal, setAttackVal] = useState<number>(12);
  const [releaseVal, setReleaseVal] = useState<number>(450);
  const [activePreset, setActivePreset] = useState('Warm Studio Ambient Concert');
  const [isChordAuditionPlaying, setIsChordAuditionPlaying] = useState(false);

  // Active Sounding Notes Tracking (for "한번 더 누르면 소리 멈추는 기능")
  const [soundingNoteIds, setSoundingNoteIds] = useState<Set<string>>(new Set());

  // Dragging state for chords and notes ("각 코드들을 선택하고 꾹 누르면 옮길 수 있게")
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number; origBeat: number; origRow: number } | null>(null);

  const keys = [
    { pitch: 'C5', name: 'C5', isEbony: false, inScale: true, isRoot: false },
    { pitch: 'B4', name: 'B4', isEbony: false, inScale: false, isRoot: false },
    { pitch: 'A#4', name: 'A#4', isEbony: true, inScale: true, isRoot: false },
    { pitch: 'A4', name: 'A4', isEbony: false, inScale: false, isRoot: false },
    { pitch: 'G#4', name: 'G#4', isEbony: true, inScale: false, isRoot: false },
    { pitch: 'G4', name: 'G4', isEbony: false, inScale: true, isRoot: false },
    { pitch: 'F#4', name: 'F#4', isEbony: true, inScale: false, isRoot: false },
    { pitch: 'F4', name: 'F4', isEbony: false, inScale: true, isRoot: false },
    { pitch: 'E4', name: 'E4', isEbony: false, inScale: false, isRoot: false },
    { pitch: 'D#4', name: 'D#4', isEbony: true, inScale: true, isRoot: false },
    { pitch: 'D4', name: 'D4', isEbony: false, inScale: false, isRoot: false },
    { pitch: 'C4', name: 'C4 (Root)', isEbony: false, inScale: true, isRoot: true },
    { pitch: 'B3', name: 'B3', isEbony: false, inScale: false, isRoot: false },
    { pitch: 'A#3', name: 'A#3', isEbony: true, inScale: true, isRoot: false },
    { pitch: 'A3', name: 'A3', isEbony: false, inScale: false, isRoot: false },
    { pitch: 'G#3', name: 'G#3', isEbony: true, inScale: false, isRoot: false },
    { pitch: 'G3', name: 'G3', isEbony: false, inScale: true, isRoot: false },
    { pitch: 'F3', name: 'F3', isEbony: false, inScale: true, isRoot: false },
    { pitch: 'D#3', name: 'D#3', isEbony: true, inScale: true, isRoot: false },
    { pitch: 'C3', name: 'C3', isEbony: false, inScale: true, isRoot: true },
  ];

  const [notes, setNotes] = useState<NoteItem[]>([
    { id: 'n1', note: 'C4', octave: 4, pitchIndex: 11, bar: 1, startBeat: 0.28, duration: 1.5, velocity: 118, colorClass: 'bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(16,185,129,0.5)]', label: 'C4 • 118' },
    { id: 'n2', note: 'D#4', octave: 4, pitchIndex: 9, bar: 1, startBeat: 1.0, duration: 1.25, velocity: 105, colorClass: 'bg-primary text-on-primary shadow-[0_0_10px_rgba(78,222,163,0.6)]', label: 'D#4 • 105' },
    { id: 'n3', note: 'G4', octave: 4, pitchIndex: 5, bar: 1, startBeat: 2.0, duration: 2.0, velocity: 124, colorClass: 'bg-primary-fixed-dim text-on-primary-fixed shadow-[0_0_12px_rgba(78,222,163,0.7)]', label: 'G4 • 124' },
    { id: 'n4', note: 'A#4', octave: 4, pitchIndex: 2, bar: 2, startBeat: 4.25, duration: 0.9, velocity: 98, colorClass: 'bg-secondary-container text-on-secondary-container shadow-[0_0_12px_rgba(87,27,193,0.6)]', label: 'A#4 • 98' },
    { id: 'n5', note: 'C5', octave: 5, pitchIndex: 0, bar: 2, startBeat: 5.15, duration: 1.7, velocity: 127, colorClass: 'bg-tertiary-container text-on-tertiary-container shadow-[0_0_16px_rgba(255,114,177,0.9)] ring-2 ring-tertiary', label: 'C5 (Oct) • 127' },
    { id: 'n6', note: 'G4', octave: 4, pitchIndex: 5, bar: 3, startBeat: 7.15, duration: 1.15, velocity: 110, colorClass: 'bg-primary text-on-primary shadow-[0_0_10px_rgba(78,222,163,0.5)]', label: 'G4 • 110' },
    { id: 'n7', note: 'F4', octave: 4, pitchIndex: 7, bar: 3, startBeat: 8.55, duration: 1.0, velocity: 89, colorClass: 'bg-primary-container text-on-primary-container shadow-[0_0_10px_rgba(16,185,129,0.5)]', label: 'F4 • 89' },
    { id: 'n8', note: 'D#4', octave: 4, pitchIndex: 9, bar: 3, startBeat: 9.7, duration: 1.35, velocity: 102, colorClass: 'bg-primary text-on-primary shadow-[0_0_10px_rgba(78,222,163,0.5)]', label: 'D#4 • 102' },
    { id: 'n9', note: 'C4', octave: 4, pitchIndex: 11, bar: 4, startBeat: 11.4, duration: 3.7, velocity: 115, colorClass: 'bg-primary-fixed-dim text-on-primary-fixed shadow-[0_0_14px_rgba(78,222,163,0.8)]', label: 'C4 Sustained • 115' },
    { id: 'n10', note: 'C3', octave: 3, pitchIndex: 19, bar: 4, startBeat: 11.4, duration: 3.7, velocity: 120, colorClass: 'bg-secondary text-on-secondary shadow-[0_0_14px_rgba(208,188,255,0.7)]', label: 'C3 Sub Bass • 120' },
  ]);

  const gridRef = useRef<HTMLDivElement>(null);

  // Sound Toggle on Keybed Click (한번 더 누르면 소리 멈춤)
  const handleKeyClick = (keyItem: typeof keys[0]) => {
    const voiceId = `keybed-${keyItem.pitch}`;
    const sound = activeTab === 'piano' ? 'piano' : activeTab === 'synth' ? 'poly' : activeTab === 'violin' ? 'violin' : 'drums';

    const isNowPlaying = audioEngine.toggleSound(voiceId, sound, keyItem.pitch, 3.0, 115);
    setSoundingNoteIds((prev) => {
      const next = new Set(prev);
      if (isNowPlaying) next.add(voiceId);
      else next.delete(voiceId);
      return next;
    });

    onShowToast(isNowPlaying ? `${keyItem.pitch} 음 재생 중 (다시 누르면 정지)` : `${keyItem.pitch} 음 정지됨`);
  };

  // Sound Toggle & Select on MIDI Note Click
  const handleNoteClick = (e: React.MouseEvent, note: NoteItem) => {
    e.stopPropagation();

    if (activeTool === 'eraser') {
      audioEngine.stopSound(`note-${note.id}`);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      onShowToast('노트가 삭제되었습니다.');
      return;
    }

    setSelectedNoteId(note.id);

    // Toggle sound: press once to start, press again to stop
    const voiceId = `note-${note.id}`;
    const sound = activeTab === 'piano' ? 'piano' : 'poly';
    const isNowPlaying = audioEngine.toggleSound(voiceId, sound, note.note, 3.5, note.velocity);

    setSoundingNoteIds((prev) => {
      const next = new Set(prev);
      if (isNowPlaying) next.add(voiceId);
      else next.delete(voiceId);
      return next;
    });

    onShowToast(isNowPlaying ? `${note.note} 재생 중 (다시 누르면 멈춤)` : `${note.note} 음 정지됨`);
  };

  // Mouse / Touch Drag to Move Chords & Notes
  const handleNoteMouseDown = (e: React.MouseEvent, note: NoteItem) => {
    e.stopPropagation();
    if (activeTool === 'eraser') return;

    setSelectedNoteId(note.id);
    setDraggingNoteId(note.id);
    setDragStartPos({
      x: e.clientX,
      y: e.clientY,
      origBeat: note.startBeat,
      origRow: note.pitchIndex,
    });
  };

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingNoteId || !dragStartPos || !gridRef.current) return;

      const rect = gridRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;

      const beatWidth = rect.width / 16;
      const beatShift = Math.round((deltaX / beatWidth) * 4) / 4; // 1/4 or 1/16 snap
      const rowShift = Math.round(deltaY / 24);

      const targetBeat = Math.max(0, Math.min(15, dragStartPos.origBeat + beatShift));
      const targetRow = Math.max(0, Math.min(keys.length - 1, dragStartPos.origRow + rowShift));
      const targetPitch = keys[targetRow].pitch;

      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== draggingNoteId) return n;
          return {
            ...n,
            startBeat: targetBeat,
            pitchIndex: targetRow,
            note: targetPitch,
            label: `${targetPitch} • ${n.velocity}`,
          };
        })
      );
    },
    [draggingNoteId, dragStartPos]
  );

  const handleGlobalMouseUp = useCallback(() => {
    if (draggingNoteId) {
      const movedNote = notes.find((n) => n.id === draggingNoteId);
      if (movedNote) {
        audioEngine.playSound(activeTab === 'piano' ? 'piano' : 'poly', movedNote.note, 0.4, movedNote.velocity);
        onShowToast(`코드 이동 완료: ${movedNote.note} (Beat ${movedNote.startBeat.toFixed(2)})`);
      }
      setDraggingNoteId(null);
      setDragStartPos(null);
    }
  }, [draggingNoteId, notes, activeTab, onShowToast]);

  useEffect(() => {
    if (draggingNoteId) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [draggingNoteId, handleGlobalMouseMove, handleGlobalMouseUp]);

  // Click on Grid Canvas to Draw New Note
  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'draw' || !gridRef.current || draggingNoteId) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rowIndex = Math.floor(y / 24);
    if (rowIndex < 0 || rowIndex >= keys.length) return;

    const targetKey = keys[rowIndex];
    const beatWidth = rect.width / 16;
    const clickBeat = Math.max(0, Math.min(15, Math.floor(x / beatWidth)));

    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      note: targetKey.pitch,
      octave: parseInt(targetKey.pitch.slice(-1), 10),
      pitchIndex: rowIndex,
      bar: Math.floor(clickBeat / 4) + 1,
      startBeat: clickBeat,
      duration: 1.0,
      velocity: 110,
      colorClass: 'bg-primary text-on-primary shadow-[0_0_10px_rgba(78,222,163,0.6)]',
      label: `${targetKey.pitch} • 110`,
    };

    setNotes((prev) => [...prev, newNote]);
    audioEngine.playSound(activeTab === 'piano' ? 'piano' : 'poly', targetKey.pitch, 0.4, 110);
    onShowToast(`노트 ${targetKey.pitch} 추가됨 (꾹 누르면 이동 가능)`);
  };

  // Toggle Sound for Chord Audition Preview button
  const handleSoundPreviewToggle = () => {
    const previewId = 'chord-preview-main';
    if (isChordAuditionPlaying) {
      audioEngine.stopAllSounds();
      setIsChordAuditionPlaying(false);
      onShowToast('사운드 테스트 정지됨');
    } else {
      setIsChordAuditionPlaying(true);
      audioEngine.playChordPreview();
      onShowToast('사운드 테스트 재생 중 (한번 더 누르면 정지)');
      setTimeout(() => setIsChordAuditionPlaying(false), 2400);
    }
  };

  return (
    <div className="flex flex-col w-full select-none">
      {/* Sub-Header & Piano Roll Tool Command Bar */}
      <div className="w-full bg-surface-container-low px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md relative z-20 border-b border-surface-variant/30">
        {/* Active Instrument Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveTab('piano')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all group cursor-pointer ${
              activeTab === 'piano'
                ? 'bg-surface-container-high text-primary shadow-sm ring-1 ring-primary/30'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(78,222,163,0.9)] animate-pulse" />
            <span className="material-symbols-outlined text-base">piano</span>
            <span className="font-body-sm text-body-sm font-semibold tracking-tight text-on-surface">
              그랜드 피아노 (Grand Piano Pro)
            </span>
            <span className="font-label-mono-sm text-label-mono-sm px-1 rounded bg-surface-container-lowest text-primary">
              CH 1
            </span>
          </button>

          <button
            onClick={() => setActiveTab('synth')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'synth'
                ? 'bg-surface-container-high text-secondary ring-1 ring-secondary/30'
                : 'bg-surface-container text-on-surface-variant hover:text-secondary'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span className="material-symbols-outlined text-base">electric_bolt</span>
            <span className="font-body-sm text-body-sm">폴리 신스 84 (Poly Synth)</span>
          </button>

          <button
            onClick={() => setActiveTab('violin')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'violin'
                ? 'bg-surface-container-high text-tertiary-fixed ring-1 ring-tertiary/30'
                : 'bg-surface-container text-on-surface-variant hover:text-tertiary-fixed'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed" />
            <span className="material-symbols-outlined text-base">music_note</span>
            <span className="font-body-sm text-body-sm">솔로 바이올린 (Solo Violin)</span>
          </button>

          <button
            onClick={() => setActiveTab('drums')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'drums'
                ? 'bg-surface-container-high text-tertiary-container ring-1 ring-tertiary-container/30'
                : 'bg-surface-container text-on-surface-variant hover:text-tertiary-container'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
            <span className="material-symbols-outlined text-base">grid_view</span>
            <span className="font-body-sm text-body-sm">어쿠스틱 킷 (Drum Kit)</span>
          </button>

          <button
            onClick={() => onShowToast('새 가상 악기 트랙 추가')}
            className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
            title="악기 트랙 추가"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
          </button>
        </div>

        {/* Edit Tools */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg shadow-inner gap-0.5 border border-surface-variant/30">
            {[
              { id: 'draw', icon: 'edit', title: '노트 그리기 (Draw Note - B)' },
              { id: 'eraser', icon: 'ink_eraser', title: '지우개 (Eraser - E)' },
              { id: 'velocity', icon: 'brush', title: '벨로시티 브러시 (Velocity Brush - V)' },
              { id: 'select', icon: 'highlight_mouse_cursor', title: '선택 및 이동 (Select & Drag - S)' },
              { id: 'cut', icon: 'content_cut', title: '노트 자르기 (Slice / Split - C)' },
              { id: 'mute', icon: 'volume_off', title: '음소거 토글 (Mute Note - M)' },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id as typeof activeTool)}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  activeTool === tool.id
                    ? 'bg-surface-container text-primary shadow-[0_0_8px_rgba(78,222,163,0.3)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
                title={tool.title}
              >
                <span className="material-symbols-outlined text-base">{tool.icon}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-lg">
              <span className="font-label-ui text-label-ui text-outline uppercase tracking-wider">스냅</span>
              <span className="font-label-mono-sm text-label-mono-sm text-primary font-semibold">{snap}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed shadow-[0_0_6px_rgba(208,188,255,0.7)]" />
              <span className="font-label-ui text-label-ui text-outline uppercase tracking-wider">스케일 가이드</span>
              <span className="font-body-sm text-body-sm text-secondary font-medium">{scaleGuide}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Piano Roll Matrix & Keys Viewport */}
      <div className="relative w-full flex-1 flex flex-col bg-surface-container-lowest overflow-hidden">
        {/* Top Timeline Ruler */}
        <div className="flex w-full bg-surface-container-low shadow-sm sticky top-0 z-30 border-b border-surface-variant/30">
          <div className="w-24 shrink-0 bg-surface-container flex items-center justify-between px-2.5 py-1.5 border-r border-surface-variant/40">
            <span className="font-label-ui text-label-ui text-outline tracking-wider uppercase">키베드</span>
            <span className="font-label-mono-sm text-label-mono-sm text-primary">C3 - C5</span>
          </div>

          <div className="flex-1 flex overflow-hidden relative">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`flex-1 min-w-[280px] grid grid-cols-4 ${
                  bar % 2 === 1 ? 'bg-surface-container-low/50' : 'bg-surface-container-low'
                } border-r border-surface-variant/40`}
              >
                <div className="px-2 py-1 flex items-center justify-between">
                  <span className="font-label-mono-md text-label-mono-md text-primary font-bold">0{bar}.1</span>
                  <span className="font-label-mono-sm text-label-mono-sm text-outline">.2 .3 .4</span>
                </div>
                <div className="px-2 py-1 flex items-center text-on-surface-variant font-label-mono-sm text-label-mono-sm">0{bar}.2</div>
                <div className="px-2 py-1 flex items-center text-on-surface-variant font-label-mono-sm text-label-mono-sm">0{bar}.3</div>
                <div className="px-2 py-1 flex items-center text-on-surface-variant font-label-mono-sm text-label-mono-sm">0{bar}.4</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Canvas Viewport */}
        <div className="flex relative w-full h-[480px] overflow-x-auto overflow-y-auto" id="piano-roll-viewport">
          {/* Left Keybed */}
          <div className="w-24 shrink-0 flex flex-col bg-surface-container-high sticky left-0 z-20 shadow-xl border-r border-surface-variant/50">
            {keys.map((k) => {
              const isSounding = soundingNoteIds.has(`keybed-${k.pitch}`);

              if (k.isRoot) {
                return (
                  <div
                    key={k.pitch}
                    onClick={() => handleKeyClick(k)}
                    className={`h-6 flex items-center justify-between px-2 cursor-pointer shadow-md transition-all ${
                      isSounding
                        ? 'bg-primary text-on-primary ring-2 ring-primary-fixed'
                        : 'bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim'
                    }`}
                    title="한번 누르면 재생, 다시 누르면 정지"
                  >
                    <span className="font-label-mono-sm text-label-mono-sm font-bold">{k.name}</span>
                    <span className="material-symbols-outlined text-xs">
                      {isSounding ? 'volume_up' : 'music_note'}
                    </span>
                  </div>
                );
              }

              if (k.isEbony) {
                return (
                  <div
                    key={k.pitch}
                    onClick={() => handleKeyClick(k)}
                    className={`h-6 flex items-center justify-between px-2 cursor-pointer transition-colors ${
                      isSounding
                        ? 'bg-secondary text-on-secondary ring-1 ring-secondary-fixed'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-variant'
                    }`}
                    title="한번 누르면 재생, 다시 누르면 정지"
                  >
                    <span className={`font-label-mono-sm text-label-mono-sm ${k.inScale ? 'text-secondary font-semibold' : ''}`}>
                      {k.name}
                    </span>
                    {k.inScale && <span className="w-2 h-1 rounded bg-secondary" />}
                  </div>
                );
              }

              return (
                <div
                  key={k.pitch}
                  onClick={() => handleKeyClick(k)}
                  className={`h-6 flex items-center justify-between px-2 cursor-pointer transition-colors ${
                    isSounding
                      ? 'bg-primary text-on-primary ring-1 ring-primary-fixed'
                      : k.inScale
                      ? 'bg-inverse-surface text-inverse-on-surface hover:bg-primary-fixed'
                      : 'bg-inverse-surface/90 text-inverse-on-surface/80 hover:bg-primary-fixed/80'
                  }`}
                  title="한번 누르면 재생, 다시 누르면 정지"
                >
                  <span className={`font-label-mono-sm text-label-mono-sm ${k.inScale ? 'font-semibold' : ''}`}>
                    {k.name}
                  </span>
                  {k.inScale && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
              );
            })}
          </div>

          {/* Note Grid Canvas with Drag & Drop Chords */}
          <div
            ref={gridRef}
            onClick={handleGridClick}
            className="relative flex-1 min-w-[1120px] h-[480px] bg-surface-container-lowest flex flex-col cursor-crosshair"
          >
            {/* Background Rows */}
            <div className="flex flex-col h-full absolute inset-0 pointer-events-none">
              {keys.map((k, idx) => (
                <div
                  key={idx}
                  className={`h-6 border-b border-surface-variant/15 ${
                    k.isRoot ? 'bg-primary/10' : k.inScale ? 'bg-primary/5' : 'bg-transparent'
                  }`}
                />
              ))}
            </div>

            {/* Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-16 pointer-events-none opacity-20 divide-x divide-outline-variant">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className={i % 4 === 0 ? 'bg-surface-container-high/40' : ''} />
              ))}
            </div>

            {/* Playhead Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-tertiary-container shadow-[0_0_10px_rgba(255,114,177,0.9)] z-30 pointer-events-none will-change-transform"
              style={{ transform: `translateX(${(playheadPosition / 100) * 1120}px)` }}
            >
              <div className="w-3 h-3 bg-tertiary-container rotate-45 -ml-[5px] -mt-1 shadow-md" />
            </div>

            {/* MIDI Note Blocks (Draggable / Press & Hold to Move / Toggle sound) */}
            {notes.map((note) => {
              const topPx = note.pitchIndex * 24 + 1;
              const leftPx = (note.startBeat / 16) * 1120 + 20;
              const widthPx = Math.max(50, (note.duration / 16) * 1120);
              const isSelected = selectedNoteId === note.id;
              const isDragging = draggingNoteId === note.id;
              const isSounding = soundingNoteIds.has(`note-${note.id}`);

              return (
                <div
                  key={note.id}
                  onClick={(e) => handleNoteClick(e, note)}
                  onMouseDown={(e) => handleNoteMouseDown(e, note)}
                  style={{
                    top: `${topPx}px`,
                    left: `${leftPx}px`,
                    width: `${widthPx}px`,
                  }}
                  className={`absolute h-[22px] rounded px-2 flex items-center justify-between cursor-grab transition-all ${
                    note.colorClass
                  } ${
                    isDragging
                      ? 'scale-105 z-40 opacity-90 ring-2 ring-white shadow-2xl cursor-grabbing'
                      : isSelected
                      ? 'ring-2 ring-primary z-30'
                      : ''
                  } ${isSounding ? 'animate-pulse ring-2 ring-tertiary-fixed' : ''}`}
                  title="선택 후 꾹 누르면 이동 가능 / 클릭 시 소리 재생 및 정지"
                >
                  <span className="font-label-mono-sm text-label-mono-sm font-bold truncate">
                    {note.label}
                  </span>
                  <div
                    className="w-1.5 h-3 bg-white/40 rounded-xs group-hover:bg-white/80 cursor-ew-resize shrink-0 ml-1"
                    title="Drag to resize duration"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Velocity Editor Lane */}
        <div className="w-full bg-surface-container flex flex-col shadow-inner relative z-10 border-t border-surface-variant/40">
          <div className="flex items-center justify-between px-3 py-1 bg-surface-container-high border-b border-surface-variant/30">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">equalizer</span>
              <span className="font-label-ui text-label-ui text-on-surface uppercase tracking-wider">
                벨로시티 & 다이내믹스 (Velocity 0 - 127)
              </span>
              <span className="font-label-mono-sm text-label-mono-sm text-outline">
                • 각 코드를 선택하고 꾹 누르면 다른 마디나 음정으로 이동 가능합니다
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNotes((prev) =>
                    prev.map((n) => {
                      const delta = Math.floor(Math.random() * 11) - 5;
                      const newVel = Math.max(60, Math.min(127, n.velocity + delta));
                      return { ...n, velocity: newVel, label: `${n.note} • ${newVel}` };
                    })
                  );
                  onShowToast('벨로시티 전체 평준화 (Humanize) 완료');
                }}
                className="font-label-mono-sm text-label-mono-sm text-on-surface-variant hover:text-primary px-1.5 py-0.5 rounded bg-surface-container-low transition-colors cursor-pointer"
              >
                전체 평준화 (Humanize)
              </button>
              <button
                onClick={() => {
                  setNotes((prev) =>
                    prev.map((n, i) => {
                      const newVel = Math.min(127, Math.round(75 + (i / prev.length) * 52));
                      return { ...n, velocity: newVel, label: `${n.note} • ${newVel}` };
                    })
                  );
                  onShowToast('램프 업 (Crescendo) 곡선 적용 완료');
                }}
                className="font-label-mono-sm text-label-mono-sm text-on-surface-variant hover:text-primary px-1.5 py-0.5 rounded bg-surface-container-low transition-colors cursor-pointer"
              >
                램프 업 (Crescendo)
              </button>
            </div>
          </div>

          <div className="flex w-full h-24 overflow-hidden relative">
            <div className="w-24 shrink-0 bg-surface-container-high/60 flex flex-col justify-between py-1 px-2.5 border-r border-surface-variant/30">
              <span className="font-label-mono-sm text-label-mono-sm text-tertiary-container font-bold">127</span>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">96</span>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">64</span>
              <span className="font-label-mono-sm text-label-mono-sm text-outline">0</span>
            </div>

            <div className="relative flex-1 min-w-[1120px] bg-surface-container-lowest/70 flex items-end px-4 pb-1">
              <div className="absolute inset-x-0 top-6 border-b border-surface-variant/40 pointer-events-none" />

              {notes.map((note) => {
                const leftPx = (note.startBeat / 16) * 1120 + 30;
                const stalkHeight = Math.max(12, (note.velocity / 127) * 80);

                return (
                  <div
                    key={note.id}
                    style={{ left: `${leftPx}px` }}
                    className="absolute bottom-1 flex flex-col items-center group cursor-ns-resize"
                    onClick={() => {
                      const newVel = Math.min(127, note.velocity + 15 > 127 ? 65 : note.velocity + 15);
                      setNotes((prev) =>
                        prev.map((n) => (n.id === note.id ? { ...n, velocity: newVel, label: `${n.note} • ${newVel}` } : n))
                      );
                      audioEngine.playSound('piano', note.note, 0.4, newVel);
                    }}
                  >
                    <span className="font-label-mono-sm text-label-mono-sm text-primary mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {note.velocity}
                    </span>
                    <div
                      style={{ height: `${stalkHeight}px` }}
                      className="w-2.5 rounded-t-sm bg-gradient-to-t from-primary-container to-primary shadow-[0_0_8px_rgba(78,222,163,0.5)] group-hover:brightness-125 transition-all"
                    />
                    <div className="w-3.5 h-1.5 rounded-full bg-primary mt-0.5" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Console Bar */}
      <div className="w-full bg-surface-container-high px-4 py-3 flex flex-wrap items-center justify-between gap-4 shadow-xl z-20 border-t border-surface-variant/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-inner">
            <span className="material-symbols-outlined text-primary text-xl">album</span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Grand Piano Concert Model D
                </span>
                <span className="font-label-mono-sm text-label-mono-sm px-1.5 py-0.2 rounded bg-primary/20 text-primary">
                  SF2 HQ
                </span>
              </div>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                엔진: Native SoundFont 2.4 High-Res Sample (48kHz 24-bit)
              </span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-lg cursor-pointer hover:bg-surface-variant transition-colors">
            <span className="font-label-ui text-label-ui text-outline uppercase tracking-wider">프리셋:</span>
            <span className="font-body-sm text-body-sm text-on-surface font-medium">{activePreset}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-1 rounded-lg">
            <span className="font-label-ui text-label-ui text-outline uppercase">옥타브</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setOctave(Math.max(-2, octave - 1))}
                className="w-6 h-6 rounded bg-surface-container hover:bg-surface-variant text-on-surface font-label-mono-sm text-label-mono-sm flex items-center justify-center transition-colors cursor-pointer"
              >
                -1
              </button>
              <span className="w-6 h-6 rounded bg-primary text-on-primary font-label-mono-sm text-label-mono-sm flex items-center justify-center font-bold">
                {octave >= 0 ? `+${octave}` : octave}
              </span>
              <button
                onClick={() => setOctave(Math.min(2, octave + 1))}
                className="w-6 h-6 rounded bg-surface-container hover:bg-surface-variant text-on-surface font-label-mono-sm text-label-mono-sm flex items-center justify-center transition-colors cursor-pointer"
              >
                +1
              </button>
            </div>
          </div>

          {/* Reverb Knob */}
          <div
            onClick={() => {
              const nextVal = (reverbVal + 15) % 105;
              setReverbVal(nextVal);
              audioEngine.setSpace(nextVal / 100);
            }}
            className="flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-lg cursor-pointer hover:bg-surface-container transition-colors"
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-variant"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-secondary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${reverbVal}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="material-symbols-outlined text-xs text-secondary absolute">blur_on</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-ui text-label-ui text-outline uppercase tracking-wider">리버브</span>
              <span className="font-label-mono-sm text-label-mono-sm text-secondary font-semibold">{reverbVal}%</span>
            </div>
          </div>

          {/* Sound Preview Button with Toggle Functionality */}
          <button
            onClick={handleSoundPreviewToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-body-sm text-body-sm font-semibold shadow-[0_0_14px_rgba(16,185,129,0.5)] active:scale-95 transition-all cursor-pointer ${
              isChordAuditionPlaying
                ? 'bg-tertiary-container text-on-tertiary-container ring-2 ring-tertiary shadow-[0_0_16px_rgba(255,114,177,0.8)]'
                : 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary'
            }`}
            title="한번 누르면 재생, 다시 누르면 즉시 멈춤"
          >
            <span className={`material-symbols-outlined text-base ${isChordAuditionPlaying ? 'animate-spin' : ''}`}>
              {isChordAuditionPlaying ? 'stop_circle' : 'music_note'}
            </span>
            <span>{isChordAuditionPlaying ? '소리 정지 (Stop Sound)' : '사운드 테스트 (Preview)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
