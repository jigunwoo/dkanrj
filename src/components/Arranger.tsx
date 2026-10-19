import React, { useState, useRef, useEffect, useCallback } from 'react';
import { audioEngine } from '../audio/audioEngine';

interface ArrangerProps {
  playheadPosition: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

interface ArrangerClipState {
  id: string;
  trackId: number;
  startBar: number; // 1 to 16
  durationBars: number;
  name: string;
  sound: string;
  colorClass: string;
  borderClass: string;
  svgType: 'piano' | 'synth' | 'strings' | 'kick' | 'drums' | 'bass';
}

export const Arranger: React.FC<ArrangerProps> = ({
  playheadPosition,
  isPlaying,
  onTogglePlay,
  onShowToast,
}) => {
  const [activeTool, setActiveTool] = useState<'select' | 'paint' | 'slice' | 'slip' | 'erase'>('paint');
  const [activePattern, setActivePattern] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [snapValue, setSnapValue] = useState<string>('1/4 Beat (비트)');

  const [mutedTracks, setMutedTracks] = useState<Record<number, boolean>>({});
  const [soloTracks, setSoloTracks] = useState<Record<number, boolean>>({});
  const [volumes, setVolumes] = useState<Record<number, number>>({
    1: 75,
    2: 80,
    3: 65,
    4: 85,
    5: 90,
  });

  // Sounding clips tracking for toggle sound on repeat press
  const [soundingClipIds, setSoundingClipIds] = useState<Set<string>>(new Set());

  // Dragging clips state ("각 코드/클립을 선택하고 꾹 누르면 옮길 수 있게")
  const [clips, setClips] = useState<ArrangerClipState[]>([
    { id: 'c1', trackId: 1, startBar: 1, durationBars: 4, name: 'Pat 1 • Intro Chords', sound: 'piano', colorClass: 'bg-primary/20 text-primary', borderClass: 'border-primary/30', svgType: 'piano' },
    { id: 'c2', trackId: 1, startBar: 5, durationBars: 4, name: 'Pat 1 • Main Verse', sound: 'piano', colorClass: 'bg-primary/20 text-primary', borderClass: 'border-primary/30', svgType: 'piano' },
    { id: 'c3', trackId: 1, startBar: 9, durationBars: 4, name: 'Pat 1 • Hook Variation', sound: 'piano', colorClass: 'bg-primary/20 text-primary', borderClass: 'border-primary/30', svgType: 'piano' },
    { id: 'c4', trackId: 2, startBar: 5, durationBars: 4, name: 'Pat 2 • Poly Arpeggio A', sound: 'poly', colorClass: 'bg-secondary/20 text-secondary', borderClass: 'border-secondary/30', svgType: 'synth' },
    { id: 'c5', trackId: 2, startBar: 9, durationBars: 4, name: 'Pat 2 • Poly Arpeggio B', sound: 'poly', colorClass: 'bg-secondary/20 text-secondary', borderClass: 'border-secondary/30', svgType: 'synth' },
    { id: 'c6', trackId: 3, startBar: 9, durationBars: 8, name: 'Pat 3 • High Sustained Ensemble', sound: 'violin', colorClass: 'bg-tertiary/20 text-tertiary', borderClass: 'border-tertiary/30', svgType: 'strings' },
    { id: 'c7', trackId: 4, startBar: 3, durationBars: 2, name: 'Pat 4 • Kick Build', sound: 'drums', colorClass: 'bg-tertiary-container/20 text-tertiary', borderClass: 'border-tertiary-container/30', svgType: 'kick' },
    { id: 'c8', trackId: 4, startBar: 5, durationBars: 4, name: 'Pat 4 • Full Beat Loop', sound: 'drums', colorClass: 'bg-tertiary-container/20 text-tertiary', borderClass: 'border-tertiary-container/30', svgType: 'drums' },
    { id: 'c9', trackId: 4, startBar: 9, durationBars: 4, name: 'Pat 4 • Full Beat Loop', sound: 'drums', colorClass: 'bg-tertiary-container/20 text-tertiary', borderClass: 'border-tertiary-container/30', svgType: 'drums' },
    { id: 'c10', trackId: 5, startBar: 5, durationBars: 4, name: 'Pat 5 • 808 Glide Drops', sound: 'bass', colorClass: 'bg-primary-fixed-dim/20 text-primary-fixed-dim', borderClass: 'border-primary-fixed-dim/30', svgType: 'bass' },
    { id: 'c11', trackId: 5, startBar: 9, durationBars: 4, name: 'Pat 5 • 808 Aggressive Sub', sound: 'bass', colorClass: 'bg-primary-fixed-dim/20 text-primary-fixed-dim', borderClass: 'border-primary-fixed-dim/30', svgType: 'bass' },
  ]);

  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [dragStartInfo, setDragStartInfo] = useState<{ x: number; y: number; origStartBar: number; origTrackId: number } | null>(null);

  const arrangerGridRef = useRef<HTMLDivElement>(null);

  // Sound Toggle: Click to start, click again to stop
  const handleClipClick = (e: React.MouseEvent, clip: ArrangerClipState) => {
    e.stopPropagation();
    setSelectedClipId(clip.id);

    const voiceId = `arranger-clip-${clip.id}`;
    const isNowPlaying = audioEngine.toggleSound(voiceId, clip.sound, 'C4', 3.0, 115);

    setSoundingClipIds((prev) => {
      const next = new Set(prev);
      if (isNowPlaying) next.add(voiceId);
      else next.delete(voiceId);
      return next;
    });

    onShowToast(isNowPlaying ? `'${clip.name}' 재생 중 (다시 누르면 정지)` : `'${clip.name}' 소리 정지됨`);
  };

  // Drag to Move Clip
  const handleClipMouseDown = (e: React.MouseEvent, clip: ArrangerClipState) => {
    e.stopPropagation();
    setSelectedClipId(clip.id);
    setDraggingClipId(clip.id);
    setDragStartInfo({
      x: e.clientX,
      y: e.clientY,
      origStartBar: clip.startBar,
      origTrackId: clip.trackId,
    });
  };

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingClipId || !dragStartInfo || !arrangerGridRef.current) return;

      const rect = arrangerGridRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartInfo.x;
      const deltaY = e.clientY - dragStartInfo.y;

      const barWidth = rect.width / 16;
      const barShift = Math.round(deltaX / barWidth);
      const trackShift = Math.round(deltaY / 80); // track height is ~80px

      const targetBar = Math.max(1, Math.min(16 - 1, dragStartInfo.origStartBar + barShift));
      const targetTrackId = Math.max(1, Math.min(5, dragStartInfo.origTrackId + trackShift));

      setClips((prev) =>
        prev.map((c) => {
          if (c.id !== draggingClipId) return c;
          return {
            ...c,
            startBar: targetBar,
            trackId: targetTrackId,
          };
        })
      );
    },
    [draggingClipId, dragStartInfo]
  );

  const handleGlobalMouseUp = useCallback(() => {
    if (draggingClipId) {
      const moved = clips.find((c) => c.id === draggingClipId);
      if (moved) {
        audioEngine.playSound(moved.sound, 'C4', 0.5, 115);
        onShowToast(`클립 이동 완료: ${moved.name} (Bar ${moved.startBar}, Track ${moved.trackId})`);
      }
      setDraggingClipId(null);
      setDragStartInfo(null);
    }
  }, [draggingClipId, clips, onShowToast]);

  useEffect(() => {
    if (draggingClipId) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [draggingClipId, handleGlobalMouseMove, handleGlobalMouseUp]);

  const toggleMute = (trackId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMutedTracks((prev) => {
      const next = !prev[trackId];
      onShowToast(`트랙 ${trackId} ${next ? '음소거' : '음소거 해제'}`);
      return { ...prev, [trackId]: next };
    });
  };

  const toggleSolo = (trackId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSoloTracks((prev) => {
      const next = !prev[trackId];
      onShowToast(`트랙 ${trackId} ${next ? '솔로' : '솔로 해제'}`);
      return { ...prev, [trackId]: next };
    });
  };

  const tracks = [
    { id: 1, name: '그랜드 피아노 (Chords)', color: 'bg-primary shadow-[0_0_6px_rgba(78,222,163,0.6)]', pan: 'C', volKey: 1, barClass: 'bg-primary' },
    { id: 2, name: '사이버 리드 신스 (Synth)', color: 'bg-secondary shadow-[0_0_6px_rgba(208,188,255,0.6)]', pan: 'R15', volKey: 2, barClass: 'bg-secondary' },
    { id: 3, name: '시네마틱 바이올린 (Strings)', color: 'bg-tertiary shadow-[0_0_6px_rgba(255,176,205,0.6)]', pan: 'L20', volKey: 3, barClass: 'bg-tertiary' },
    { id: 4, name: '펀치 드럼 룹 (Drums)', color: 'bg-tertiary-container shadow-[0_0_6px_rgba(255,114,177,0.6)]', pan: 'C', volKey: 4, barClass: 'bg-tertiary-container' },
    { id: 5, name: '서브 베이스 808 (Bass)', color: 'bg-primary-fixed-dim shadow-[0_0_6px_rgba(78,222,163,0.6)]', pan: 'C', volKey: 5, barClass: 'bg-primary-fixed-dim' },
  ];

  return (
    <div className="flex flex-col w-full select-none">
      {/* Top Action Toolbar */}
      <div className="px-4 py-3 bg-surface-container-lowest flex flex-col gap-2 shadow-md border-b border-surface-variant/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-lg shadow-inner border border-surface-variant/30">
            {[
              { id: 'select', icon: 'near_me', label: '선택 (Select)' },
              { id: 'paint', icon: 'brush', label: '페인트 (Draw)' },
              { id: 'slice', icon: 'content_cut', label: '자르기 (Slice)' },
              { id: 'slip', icon: 'sync_alt', label: '슬립 (Slip)' },
              { id: 'erase', icon: 'backspace', label: '삭제 (Mute)' },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id as typeof activeTool)}
                className={`px-2.5 py-1.5 rounded flex items-center gap-1 font-label-ui text-label-ui transition-all cursor-pointer ${
                  activeTool === tool.id
                    ? 'bg-primary-container text-on-primary-container shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tool.icon}</span>
                <span>{tool.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-lg shadow-sm border border-surface-variant/30">
              <span className="material-symbols-outlined text-primary text-sm">grid_guides</span>
              <span className="font-label-ui text-label-ui text-on-surface-variant uppercase">Snap</span>
              <span className="font-label-mono-sm text-label-mono-sm text-primary font-bold">1/4 Beat</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-1.5 rounded-lg border border-surface-variant/30">
              <span className="font-label-ui text-label-ui text-outline">TIME SIGNATURE</span>
              <span className="font-label-mono-sm text-label-mono-sm text-primary font-bold">4 / 4</span>
            </div>
          </div>
        </div>

        {/* Pattern Storage Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
          <div className="flex items-center gap-1 text-on-surface-variant font-label-ui text-label-ui uppercase tracking-wider shrink-0 mr-1">
            <span className="material-symbols-outlined text-sm text-tertiary">dashboard_customize</span>
            <span>패턴 클립 보관함</span>
          </div>

          {[
            { id: 1, name: 'Pat 1: 피아노 코드 (Piano)', tag: 'MIDI', dotColor: 'bg-primary', sound: 'piano' },
            { id: 2, name: 'Pat 2: 사이버 신스 아르페지오', tag: 'ARP', dotColor: 'bg-secondary', sound: 'poly' },
            { id: 3, name: 'Pat 3: 멜랑콜리 바이올린', tag: 'STR', dotColor: 'bg-tertiary', sound: 'violin' },
            { id: 4, name: 'Pat 4: 펀치 로우파이 드럼 룹', tag: 'BEAT', dotColor: 'bg-tertiary-container', sound: 'drums' },
            { id: 5, name: 'Pat 5: 서브 808 글라이드 베이스', tag: 'BASS', dotColor: 'bg-primary-fixed-dim', sound: 'bass' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePattern(p.id);
                audioEngine.playSound(p.sound, 'C4', 0.5, 110);
                onShowToast(`'${p.name}' 패턴 선택됨`);
              }}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer ${
                activePattern === p.id
                  ? 'bg-surface-container-highest ring-1 ring-primary/40'
                  : 'bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${p.dotColor}`} />
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface font-semibold">{p.name}</span>
              <span className="font-label-ui text-label-ui text-outline bg-surface-container-lowest px-1 rounded">{p.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Multitrack Arranger Viewport */}
      <div className="relative w-full flex-1 flex flex-col bg-surface overflow-x-auto min-h-[580px]">
        {/* Timeline Header Row */}
        <div className="flex sticky top-0 z-30 bg-surface-container-low shadow-sm border-b border-surface-variant/30">
          <div className="w-64 shrink-0 px-3 py-2 flex items-center justify-between bg-surface-container-high shadow-md z-40 border-r border-surface-variant/40">
            <span className="font-label-ui text-label-ui uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">reorder</span>
              <span>트랙 리스트 (Tracks)</span>
            </span>
          </div>

          <div className="relative flex-1 h-9 bg-surface-container-lowest flex items-center select-none min-w-[1024px]">
            <div className="absolute inset-0 grid grid-cols-16 pointer-events-none">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className={`col-span-1 border-r ${(i + 1) % 4 === 0 ? 'border-surface-variant/40' : 'border-surface-variant/25'}`} />
              ))}
            </div>

            <div className="absolute left-[25%] right-[50%] h-2.5 top-0 bg-primary/20 rounded-b flex items-center justify-between px-1 border-x border-primary/50">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="font-label-mono-sm text-label-mono-sm text-primary text-[9px] uppercase tracking-tighter">
                LOOP (BAR 5 - 8)
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>

            <div className="grid grid-cols-16 w-full text-center font-label-mono-sm text-label-mono-sm text-on-surface-variant">
              {Array.from({ length: 16 }).map((_, idx) => (
                <span key={idx + 1} className={(idx + 1) === 1 || (idx + 1) === 5 || (idx + 1) === 9 || (idx + 1) === 13 ? 'text-primary font-bold' : ''}>
                  {idx + 1}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tracks Grid Area */}
        <div ref={arrangerGridRef} className="relative flex-1 flex flex-col min-w-[1280px]">
          {/* Moving Playhead Scrubber */}
          <div
            style={{ transform: `translateX(calc(16rem + ${(playheadPosition / 100) * 800}px))` }}
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none shadow-[0_0_12px_rgba(78,222,163,0.9)] will-change-transform"
          >
            <div className="absolute -top-3.5 -left-2 w-4 h-4 bg-primary rotate-45 rounded-xs flex items-center justify-center shadow-lg" />
          </div>

          {/* 5 Tracks with Drag-to-Move Audio/MIDI Clips */}
          {tracks.map((track) => (
            <div key={track.id} className="flex group/track hover:bg-surface-container-low/40 transition-colors border-b border-surface-variant/20">
              <div className="w-64 shrink-0 p-2.5 bg-surface-container flex flex-col justify-between shadow-sm z-10 border-r border-surface-variant/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-2.5 h-2.5 rounded-xs ${track.color}`} />
                    <span className="font-body-md text-body-md font-semibold text-on-surface truncate">{track.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => toggleMute(track.id, e)}
                      className={`px-1.5 py-0.5 rounded font-label-mono-sm text-label-mono-sm transition-colors cursor-pointer ${
                        mutedTracks[track.id] ? 'bg-error text-on-error font-bold' : 'bg-surface-container-high text-outline hover:text-error'
                      }`}
                    >
                      M
                    </button>
                    <button
                      onClick={(e) => toggleSolo(track.id, e)}
                      className={`px-1.5 py-0.5 rounded font-label-mono-sm text-label-mono-sm transition-colors cursor-pointer ${
                        soloTracks[track.id] ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-high text-outline hover:text-tertiary'
                      }`}
                    >
                      S
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="font-label-ui text-label-ui text-outline">VOL</span>
                    <div
                      onClick={() => setVolumes((prev) => ({ ...prev, [track.id]: (prev[track.id] + 15) % 100 || 20 }))}
                      className="h-1.5 flex-1 bg-surface-container-highest rounded-full overflow-hidden cursor-pointer"
                    >
                      <div style={{ width: `${volumes[track.id]}%` }} className={`h-full ${track.barClass} rounded-full transition-all`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 w-16">
                    <span className="font-label-ui text-label-ui text-outline">PAN</span>
                    <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">{track.pan}</span>
                  </div>
                </div>
              </div>

              {/* Clip Track Lane */}
              <div className="relative flex-1 h-20 bg-surface-container-lowest grid grid-cols-16 p-1 gap-1">
                {clips
                  .filter((c) => c.trackId === track.id)
                  .map((clip) => {
                    const isSelected = selectedClipId === clip.id;
                    const isDragging = draggingClipId === clip.id;
                    const isSounding = soundingClipIds.has(`arranger-clip-${clip.id}`);

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => handleClipClick(e, clip)}
                        onMouseDown={(e) => handleClipMouseDown(e, clip)}
                        style={{
                          gridColumnStart: clip.startBar,
                          gridColumnEnd: `span ${clip.durationBars}`,
                        }}
                        className={`rounded-lg p-2 flex flex-col justify-between cursor-grab transition-all border ${
                          clip.colorClass
                        } ${clip.borderClass} ${
                          isDragging ? 'scale-105 z-30 shadow-2xl opacity-90 ring-2 ring-white cursor-grabbing' : ''
                        } ${isSelected ? 'ring-2 ring-primary shadow-md' : ''} ${
                          isSounding ? 'animate-pulse ring-2 ring-tertiary-fixed' : ''
                        }`}
                        title="선택 후 꾹 누르면 이동 가능 / 클릭 시 소리 재생 및 정지"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-label-mono-sm text-label-mono-sm font-semibold truncate">
                            {clip.name}
                          </span>
                          <span className="material-symbols-outlined text-xs">
                            {isSounding ? 'volume_up' : 'drag_indicator'}
                          </span>
                        </div>

                        {/* Clip Waveform visual */}
                        <div className="h-4 flex items-center gap-0.5 opacity-80">
                          {Array.from({ length: clip.durationBars * 3 }).map((_, wIdx) => (
                            <span
                              key={wIdx}
                              style={{ height: `${((wIdx * 7) % 12) + 4}px` }}
                              className="w-1 bg-current rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}

          {/* Master Filter Cutoff Automation */}
          <div className="flex group/track hover:bg-surface-container-low/40 transition-colors border-b border-surface-variant/20">
            <div className="w-64 shrink-0 p-2 bg-surface-container/70 flex flex-col justify-center shadow-sm z-10 border-r border-surface-variant/30">
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-xs text-secondary">tune</span>
                <span className="font-label-mono-sm text-label-mono-sm font-semibold text-secondary truncate">
                  오토메이션: 마스터 필터 컷오프
                </span>
              </div>
              <span className="font-label-ui text-label-ui text-outline">LowPass Cutoff Sweep (Hz)</span>
            </div>

            <div className="relative flex-1 h-16 bg-surface-container-lowest grid grid-cols-16 p-1 gap-1">
              <div className="col-start-5 col-span-4 bg-surface-container rounded-lg p-1.5 flex flex-col justify-between relative overflow-hidden shadow-sm border border-secondary/30">
                <div className="flex items-center justify-between z-10">
                  <span className="font-label-mono-sm text-label-mono-sm text-secondary font-semibold">
                    Filter Cutoff (480Hz → 18.2kHz)
                  </span>
                  <span className="font-label-mono-sm text-label-mono-sm text-outline">Bezier 곡선</span>
                </div>
                <svg className="absolute inset-0 w-full h-full text-secondary" preserveAspectRatio="none" viewBox="0 0 200 60">
                  <path d="M 0,55 C 80,55 120,5 200,5 L 200,60 L 0,60 Z" fill="currentColor" fillOpacity="0.12" />
                  <path d="M 0,55 C 80,55 120,5 200,5" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  <circle cx="0" cy="55" fill="currentColor" r="4" />
                  <circle cx="100" cy="30" fill="currentColor" r="3" />
                  <circle cx="200" cy="5" fill="currentColor" r="4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Arranger Bottom Command Deck */}
      <div className="px-4 py-3 bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.3)] z-30 border-t border-surface-variant/30">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`px-4 py-2 rounded-lg font-body-sm text-body-sm font-semibold transition-all shadow-[0_0_12px_rgba(78,222,163,0.4)] flex items-center gap-1.5 active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-tertiary-container text-on-tertiary-container shadow-[0_0_16px_rgba(255,114,177,0.7)]'
                : 'bg-primary text-on-primary hover:bg-primary-fixed'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {isPlaying ? 'pause_circle' : 'play_circle'}
            </span>
            <span>
              {isPlaying ? '재생 일시정지 (Pause)' : '모든 트랙 실시간 결합 재생 (Play Arranger)'}
            </span>
          </button>

          <button
            onClick={() => onShowToast('트랙 클립 패턴 합치기 (Consolidate Track) 실행됨')}
            className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-colors flex items-center gap-1.5 shadow-sm border border-surface-variant/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-secondary">merge_type</span>
            <span>패턴 합치기 (Consolidate Track)</span>
          </button>

          <button
            onClick={() => onShowToast('선택 트랙 바운스 (Bounce to Audio) 완료')}
            className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-colors flex items-center gap-1.5 shadow-sm border border-surface-variant/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-tertiary">graphic_eq</span>
            <span>트랙 바운스 (Bounce to Audio)</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-label-ui text-label-ui text-outline uppercase">Active Tracks</span>
            <span className="font-label-mono-sm text-label-mono-sm px-2 py-0.5 rounded bg-surface-container text-primary font-bold">
              5 / 64
            </span>
          </div>

          <div className="h-4 w-px bg-surface-variant" />

          <div className="flex items-center gap-2">
            <span className="font-label-ui text-label-ui text-outline uppercase">Arrangement Length</span>
            <span className="font-label-mono-sm text-label-mono-sm px-2 py-0.5 rounded bg-surface-container text-on-surface font-bold">
              16 Bars (00:32.00)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
