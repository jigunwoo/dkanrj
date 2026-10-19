import React, { useState, useEffect } from 'react';
import { TrackChannel, MidiMapping } from '../types';
import { audioEngine } from '../audio/audioEngine';
import { midiService } from '../services/midiService';

interface MixerProps {
  isPlaying: boolean;
  onShowToast: (msg: string, icon?: string) => void;
  onOpenExportModal: () => void;
  onOpenMidiModal: () => void;
  isMidiLearnActive: boolean;
  onToggleMidiLearn: () => void;
}

export const Mixer: React.FC<MixerProps> = ({
  isPlaying,
  onShowToast,
  onOpenExportModal,
  onOpenMidiModal,
  isMidiLearnActive,
  onToggleMidiLearn,
}) => {
  const [channels, setChannels] = useState<TrackChannel[]>([
    {
      id: 1,
      name: 'Grand Piano',
      shortName: 'CH 01',
      color: 'bg-primary text-primary',
      colorHex: '#4edea3',
      icon: 'piano',
      gain: 1.2,
      pan: -18,
      isMuted: false,
      isSolo: false,
      isPhaseInverted: false,
      faderLevel: 72,
      inserts: [
        { name: '1. Vintage EQ', active: true },
        { name: '2. Plate 480', active: true },
        { name: '3. Opto Comp', active: false },
      ],
      currentDb: -2.4,
      vuLevel: 9,
    },
    {
      id: 2,
      name: 'Lead Synth 84',
      shortName: 'CH 02',
      color: 'bg-secondary text-secondary',
      colorHex: '#d0bcff',
      icon: 'electric_bolt',
      gain: 0.0,
      pan: 22,
      isMuted: false,
      isSolo: false,
      isPhaseInverted: false,
      faderLevel: 62,
      inserts: [
        { name: '1. OTT Multiband', active: true },
        { name: '2. Phaser Dual', active: true },
        { name: '3. Delay Pro', active: false },
      ],
      currentDb: -5.1,
      vuLevel: 6,
    },
    {
      id: 3,
      name: 'Violin Ensemble',
      shortName: 'CH 03',
      color: 'bg-tertiary-fixed-dim text-tertiary-fixed-dim',
      colorHex: '#ffb0cd',
      icon: 'music_note',
      gain: -0.8,
      pan: 0,
      isMuted: false,
      isSolo: false,
      isPhaseInverted: false,
      faderLevel: 55,
      inserts: [
        { name: '1. Dynamic EQ', active: true },
        { name: '2. Chamber Verb', active: true },
        { name: '3. Saturator Tube', active: false },
      ],
      currentDb: -7.8,
      vuLevel: 5,
    },
    {
      id: 4,
      name: 'Drum Machine',
      shortName: 'CH 04',
      color: 'bg-tertiary-container text-tertiary-container',
      colorHex: '#ff72b1',
      icon: 'grid_view',
      gain: 2.0,
      pan: 0,
      isMuted: false,
      isSolo: false,
      isPhaseInverted: false,
      faderLevel: 80,
      inserts: [
        { name: '1. Transient Pro', active: true },
        { name: '2. VCA Glue Bus', active: true },
        { name: '3. Clipper Peak', active: true },
      ],
      currentDb: -0.4,
      vuLevel: 10,
    },
    {
      id: 5,
      name: 'Sub 808 Bass',
      shortName: 'CH 05',
      color: 'bg-primary-fixed text-primary-fixed',
      colorHex: '#6ffbbe',
      icon: 'speaker_group',
      gain: 0.5,
      pan: 0,
      isMuted: false,
      isSolo: false,
      isPhaseInverted: false,
      faderLevel: 68,
      inserts: [
        { name: '1. Sidechain Comp', active: true },
        { name: '2. Sub Enhancer', active: true },
        { name: '3. Mono Maker', active: false },
      ],
      currentDb: -3.0,
      vuLevel: 7,
    },
    {
      id: 6,
      name: 'FX & Ambience',
      shortName: 'CH 06',
      color: 'bg-on-secondary-container text-on-secondary-container',
      colorHex: '#c4abff',
      icon: 'auto_fix_high',
      gain: -3.0,
      pan: -45,
      isMuted: false,
      isSolo: false,
      isPhaseInverted: false,
      faderLevel: 48,
      inserts: [
        { name: '1. Shimmer Verb', active: true },
        { name: '2. Stereo Width', active: true },
        { name: '3. Bitcrusher FX', active: false },
      ],
      currentDb: -11.2,
      vuLevel: 4,
    },
  ]);

  const [masterFader, setMasterFader] = useState<number>(78);
  const [masterTrim, setMasterTrim] = useState<number>(0.0);
  const [masterSpread, setMasterSpread] = useState<number>(118);
  const [isDim, setIsDim] = useState<boolean>(false);
  const [isMonoCheck, setIsMonoCheck] = useState<boolean>(false);

  // EQ Curve drag nodes
  const [eqNodes, setEqNodes] = useState<{ id: number; cx: number; cy: number; color: string }[]>([
    { id: 1, cx: 45, cy: 85, color: '#4edea3' },
    { id: 2, cx: 90, cy: 70, color: '#4edea3' },
    { id: 3, cx: 140, cy: 98, color: '#ffb0cd' },
    { id: 4, cx: 190, cy: 100, color: '#4edea3' },
    { id: 5, cx: 250, cy: 68, color: '#d0bcff' },
    { id: 6, cx: 310, cy: 55, color: '#4edea3' },
    { id: 7, cx: 370, cy: 78, color: '#ffd9e4' },
  ]);

  const [exportFormat, setExportFormat] = useState<'WAV' | 'MP3' | 'MIDI'>('WAV');
  const [stemMode, setStemMode] = useState<'master' | 'stems'>('master');
  const [isRendering, setIsRendering] = useState(false);

  // Subscribe to MIDI Service for live hardware mapping controls
  useEffect(() => {
    midiService.setActionHandler((targetId, value) => {
      // Handle faders
      if (targetId.startsWith('mixer-fader-')) {
        const idPart = targetId.replace('mixer-fader-', '');
        if (idPart === 'master') {
          const pct = Math.round((value / 127) * 100);
          setMasterFader(pct);
        } else {
          const chId = parseInt(idPart, 10);
          const pct = Math.round((value / 127) * 100);
          const db = ((pct - 80) * 0.3).toFixed(1);
          setChannels((prev) =>
            prev.map((c) => (c.id === chId ? { ...c, faderLevel: pct, currentDb: parseFloat(db) } : c))
          );
        }
      } else if (targetId.startsWith('mixer-pan-')) {
        const chId = parseInt(targetId.replace('mixer-pan-', ''), 10);
        const panVal = Math.round(((value - 64) / 64) * 50);
        setChannels((prev) =>
          prev.map((c) => (c.id === chId ? { ...c, pan: panVal } : c))
        );
      } else if (targetId.startsWith('mixer-mute-')) {
        if (value > 0) {
          const chId = parseInt(targetId.replace('mixer-mute-', ''), 10);
          setChannels((prev) =>
            prev.map((c) => (c.id === chId ? { ...c, isMuted: !c.isMuted } : c))
          );
        }
      } else if (targetId.startsWith('mixer-solo-')) {
        if (value > 0) {
          const chId = parseInt(targetId.replace('mixer-solo-', ''), 10);
          setChannels((prev) =>
            prev.map((c) => (c.id === chId ? { ...c, isSolo: !c.isSolo } : c))
          );
        }
      }
    });
  }, []);

  const handleMidiLearnClick = (targetId: string, label: string, e: React.MouseEvent) => {
    if (!isMidiLearnActive) return;
    e.stopPropagation();

    if (midiService.isLearning(targetId)) {
      midiService.stopLearning();
      onShowToast(`MIDI Learn 취소: ${label}`);
    } else {
      midiService.startLearning(targetId, label);
      onShowToast(`[${label}] MIDI 하드웨어의 노브나 페이더를 움직이세요!`, 'settings_ethernet');
    }
  };

  const handleToggleMute = (id: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, isMuted: !ch.isMuted } : ch))
    );
    const target = channels.find((c) => c.id === id);
    onShowToast(`채널 ${target?.name} ${!target?.isMuted ? '음소거' : '음소거 해제'}`);
  };

  const handleToggleSolo = (id: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, isSolo: !ch.isSolo } : ch))
    );
    const target = channels.find((c) => c.id === id);
    onShowToast(`채널 ${target?.name} ${!target?.isSolo ? '솔로 활성' : '솔로 해제'}`);
  };

  const handleTogglePhase = (id: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, isPhaseInverted: !ch.isPhaseInverted } : ch))
    );
    onShowToast(`채널 위상 반전 전환`);
  };

  const handleFaderDrag = (id: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const pct = Math.max(0, Math.min(100, Math.round((1 - y / rect.height) * 100)));
    const db = ((pct - 80) * 0.3).toFixed(1);

    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === id ? { ...ch, faderLevel: pct, currentDb: parseFloat(db) } : ch
      )
    );
  };

  const handleEqNodeDrag = (nodeId: number, e: React.MouseEvent<SVGCircleElement>) => {
    const svgRect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!svgRect) return;
    const y = Math.max(20, Math.min(130, e.clientY - svgRect.top));

    setEqNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, cy: y } : node))
    );
  };

  const handleRenderAndDownload = () => {
    setIsRendering(true);
    onShowToast('고음질 오디오 마스터링 인코딩 시작...');

    setTimeout(() => {
      const wavBlob = audioEngine.generateWavFile('Midnight_Horizon_Master');
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = stemMode === 'master' ? `Midnight_Horizon_Master.${exportFormat.toLowerCase()}` : `Midnight_Horizon_Stems_6Ch.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsRendering(false);
      onShowToast('렌더링 완료! 파일 다운로드가 완료되었습니다.', 'download_done');
    }, 1500);
  };

  const eqPath = `M 0 ${eqNodes[0].cy + 10} ` + eqNodes.map((n) => `L ${n.cx} ${n.cy}`).join(' ') + ` L 400 ${eqNodes[6].cy + 5}`;
  const eqAreaPath = `${eqPath} L 400 150 L 0 150 Z`;

  return (
    <div className="flex flex-col w-full select-none">
      <div className="px-6 py-4 flex flex-col gap-5">
        {/* Top Action & Diagnostic Bar with MIDI Learn Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low p-3.5 rounded-xl shadow-md border border-surface-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-7 rounded bg-primary" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  믹서 및 마스터링 콘솔
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-mono-sm text-label-mono-sm tracking-wide">
                  STUDIO ENGINE v4.2 PRO
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                32-Bit 부동 소수점 내부 프로세싱 · 7개 다이나믹 채널 스트립 · 제로 레이턴시 모니터링
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* MIDI Learn Button */}
            <button
              onClick={onToggleMidiLearn}
              className={`px-3 py-1.5 rounded-lg font-body-sm text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isMidiLearnActive
                  ? 'bg-secondary text-on-secondary border-secondary ring-2 ring-secondary/50 shadow-[0_0_12px_rgba(208,188,255,0.7)] animate-pulse'
                  : 'bg-surface-container-high hover:bg-surface-variant text-on-surface border-surface-variant/30'
              }`}
            >
              <span className="material-symbols-outlined text-sm">settings_ethernet</span>
              <span>{isMidiLearnActive ? 'MIDI Learn 활성 중 (컨트롤 클릭)' : 'MIDI Learn'}</span>
            </button>

            <button
              onClick={onOpenMidiModal}
              className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-body-sm text-xs flex items-center gap-1 transition-colors border border-surface-variant/30 cursor-pointer"
              title="MIDI 장치 및 매핑 설정"
            >
              <span className="material-symbols-outlined text-sm text-primary">piano</span>
              <span>장비 관리</span>
            </button>

            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-surface-variant/30">
              <button
                onClick={() => onShowToast('모든 채널 FX 활성화')}
                className="px-2.5 py-1 rounded bg-surface-variant font-label-ui text-label-ui text-on-surface hover:text-primary transition-colors cursor-pointer"
              >
                모든 FX 활성화
              </button>
              <button
                onClick={() => onShowToast('A/B 비교 모드')}
                className="px-2.5 py-1 rounded hover:bg-surface-variant font-label-ui text-label-ui text-on-surface-variant transition-colors cursor-pointer"
              >
                A/B 비교
              </button>
            </div>
          </div>
        </div>

        {/* Channel Strip Array + Master Rack */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-8 flex flex-col bg-surface-container-lowest rounded-xl p-3.5 shadow-xl overflow-hidden border border-surface-variant/30">
            <div className="flex items-center justify-between pb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">tune</span>
                <span className="font-label-ui text-label-ui text-on-surface tracking-wider uppercase font-semibold">
                  Multi-Track Channel Strip Array
                </span>
                {isMidiLearnActive && (
                  <span className="text-[10px] text-secondary font-label-mono-sm px-2 py-0.5 rounded bg-secondary/15 animate-pulse">
                    연결할 페이더나 노브를 클릭하세요
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="min-w-[760px] flex gap-2">
                {channels.map((ch) => {
                  const faderTargetId = `mixer-fader-${ch.id}`;
                  const panTargetId = `mixer-pan-${ch.id}`;
                  const muteTargetId = `mixer-mute-${ch.id}`;
                  const soloTargetId = `mixer-solo-${ch.id}`;

                  const isLearningFader = midiService.isLearning(faderTargetId);
                  const isLearningPan = midiService.isLearning(panTargetId);
                  const isLearningMute = midiService.isLearning(muteTargetId);
                  const isLearningSolo = midiService.isLearning(soloTargetId);

                  const faderMapping = midiService.getMappingForTarget(faderTargetId);
                  const panMapping = midiService.getMappingForTarget(panTargetId);

                  return (
                    <div
                      key={ch.id}
                      className="flex-1 flex flex-col bg-surface-container rounded-lg p-2.5 relative group border border-surface-variant/30"
                    >
                      <div style={{ backgroundColor: ch.colorHex }} className="h-1.5 w-full rounded-full mb-2 shadow-[0_0_8px_rgba(78,222,163,0.7)]" />

                      <div className="flex items-center justify-between mb-1">
                        <span style={{ color: ch.colorHex }} className="font-label-mono-sm text-label-mono-sm font-bold">
                          {ch.shortName}
                        </span>
                        <span style={{ color: ch.colorHex }} className="material-symbols-outlined text-xs">
                          {ch.icon}
                        </span>
                      </div>

                      <span className="font-body-sm text-body-sm text-on-surface font-semibold truncate mb-2">
                        {ch.name}
                      </span>

                      {/* Gain & Pan Knobs */}
                      <div className="grid grid-cols-2 gap-1.5 bg-surface-container-low p-2 rounded-lg mb-2 border border-surface-variant/20">
                        <div
                          onClick={() => {
                            const newGain = ch.gain >= 4 ? -4 : ch.gain + 1.2;
                            setChannels((prev) =>
                              prev.map((c) => (c.id === ch.id ? { ...c, gain: parseFloat(newGain.toFixed(1)) } : c))
                            );
                          }}
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <span className="font-label-ui text-label-ui text-on-surface-variant scale-90">GAIN</span>
                          <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center relative hover:bg-surface-bright transition-colors shadow-inner">
                            <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                              <div
                                style={{ transform: `rotate(${ch.gain * 12}deg)` }}
                                className="w-1 h-2.5 bg-primary rounded-full -translate-y-1 transition-transform"
                              />
                            </div>
                          </div>
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant scale-90 mt-0.5">
                            {ch.gain >= 0 ? `+${ch.gain.toFixed(1)}dB` : `${ch.gain.toFixed(1)}dB`}
                          </span>
                        </div>

                        {/* Pan Knob with MIDI Learn */}
                        <div
                          onClick={(e) => {
                            if (isMidiLearnActive) {
                              handleMidiLearnClick(panTargetId, `${ch.name} Pan`, e);
                            } else {
                              const newPan = ch.pan > 30 ? -40 : ch.pan + 20;
                              setChannels((prev) =>
                                prev.map((c) => (c.id === ch.id ? { ...c, pan: newPan } : c))
                              );
                            }
                          }}
                          className={`flex flex-col items-center cursor-pointer rounded p-0.5 ${
                            isLearningPan
                              ? 'ring-2 ring-secondary bg-secondary/20 animate-pulse'
                              : isMidiLearnActive
                              ? 'ring-1 ring-dashed ring-secondary/60'
                              : ''
                          }`}
                          title={isMidiLearnActive ? '클릭하여 MIDI Pan 노브 매핑' : '클릭하여 Pan 조정'}
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-label-ui text-label-ui text-on-surface-variant scale-90">PAN</span>
                            {panMapping && <span className="text-[8px] bg-secondary text-on-secondary px-0.5 rounded font-bold">M</span>}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center relative hover:bg-surface-bright transition-colors shadow-inner">
                            <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                              <div
                                style={{ transform: `rotate(${ch.pan * 1.5}deg)` }}
                                className="w-1 h-2.5 bg-primary rounded-full -translate-y-1 transition-transform"
                              />
                            </div>
                          </div>
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant scale-90 mt-0.5">
                            {ch.pan === 0 ? 'CENTER' : ch.pan < 0 ? `L ${Math.abs(ch.pan)}` : `R ${ch.pan}`}
                          </span>
                        </div>
                      </div>

                      {/* Mute / Solo / Invert Controls with MIDI Learn */}
                      <div className="grid grid-cols-3 gap-1 mb-2.5">
                        <button
                          onClick={(e) => {
                            if (isMidiLearnActive) handleMidiLearnClick(muteTargetId, `${ch.name} Mute`, e);
                            else handleToggleMute(ch.id);
                          }}
                          className={`py-1 rounded font-label-ui text-label-ui font-bold transition-colors cursor-pointer ${
                            isLearningMute
                              ? 'ring-2 ring-error animate-pulse'
                              : ch.isMuted
                              ? 'bg-error text-on-error'
                              : 'bg-surface-container-high text-outline hover:text-on-surface'
                          }`}
                        >
                          M
                        </button>
                        <button
                          onClick={(e) => {
                            if (isMidiLearnActive) handleMidiLearnClick(soloTargetId, `${ch.name} Solo`, e);
                            else handleToggleSolo(ch.id);
                          }}
                          className={`py-1 rounded font-label-ui text-label-ui font-bold transition-colors cursor-pointer ${
                            isLearningSolo
                              ? 'ring-2 ring-primary animate-pulse'
                              : ch.isSolo
                              ? 'bg-primary text-on-primary shadow-sm'
                              : 'bg-surface-container-high text-outline hover:text-tertiary'
                          }`}
                        >
                          S
                        </button>
                        <button
                          onClick={() => handleTogglePhase(ch.id)}
                          className={`py-1 rounded font-label-ui text-label-ui font-bold transition-colors cursor-pointer ${
                            ch.isPhaseInverted ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-outline hover:text-on-surface'
                          }`}
                        >
                          Ø
                        </button>
                      </div>

                      {/* Fader & LED Meter Section with MIDI Learn */}
                      <div
                        onClick={(e) => {
                          if (isMidiLearnActive) {
                            handleMidiLearnClick(faderTargetId, `${ch.name} Fader`, e);
                          } else {
                            handleFaderDrag(ch.id, e);
                          }
                        }}
                        className={`flex-1 min-h-[220px] flex items-stretch justify-center gap-2 bg-surface-container-lowest p-2 rounded-lg relative border cursor-pointer ${
                          isLearningFader
                            ? 'border-secondary ring-2 ring-secondary/60 animate-pulse bg-secondary/10'
                            : isMidiLearnActive
                            ? 'border-dashed border-secondary/60'
                            : 'border-surface-variant/20'
                        }`}
                        title={isMidiLearnActive ? '클릭하여 MIDI 페이더 매핑' : '드래그하여 음량 조절'}
                      >
                        <div className="flex flex-col justify-between py-1 text-right select-none">
                          <span className="font-label-mono-sm text-label-mono-sm text-outline-variant scale-75 leading-none">+6</span>
                          <span className="font-label-mono-sm text-label-mono-sm text-outline-variant scale-75 leading-none">0</span>
                          <span className="font-label-mono-sm text-label-mono-sm text-outline-variant scale-75 leading-none">-6</span>
                          <span className="font-label-mono-sm text-label-mono-sm text-outline-variant scale-75 leading-none">-18</span>
                          <span className="font-label-mono-sm text-label-mono-sm text-outline-variant scale-75 leading-none">-36</span>
                          <span className="font-label-mono-sm text-label-mono-sm text-outline-variant scale-75 leading-none">-∞</span>
                        </div>

                        {/* Vertical Fader Track */}
                        <div className="w-6 bg-surface-container-high rounded-full relative flex flex-col items-center justify-center p-0.5 cursor-ns-resize shadow-inner">
                          <div className="w-0.5 h-full bg-surface-variant" />
                          <div
                            style={{ top: `${100 - ch.faderLevel}%` }}
                            className="absolute -translate-y-1/2 w-5 h-7 rounded bg-surface-bright shadow-[0_4px_8px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center cursor-ns-resize"
                          >
                            <div style={{ backgroundColor: ch.colorHex }} className="w-3.5 h-0.5 rounded-full" />
                            <div className="w-3.5 h-0.5 bg-outline-variant rounded-full mt-1" />
                          </div>
                        </div>

                        {/* LED Meter */}
                        <div className="w-3.5 bg-surface-container-low rounded p-0.5 flex flex-col-reverse gap-0.5">
                          {Array.from({ length: 12 }).map((_, idx) => (
                            <span
                              key={idx}
                              className={`w-full h-1.5 rounded-xs ${
                                idx < ch.vuLevel ? (idx >= 10 ? 'bg-tertiary-container' : idx >= 8 ? 'bg-tertiary-fixed-dim' : 'bg-primary') : 'bg-surface-variant/40'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-2 text-center p-1 rounded bg-surface-container-high border border-surface-variant/30 flex items-center justify-between px-1.5">
                        <span style={{ color: ch.colorHex }} className="font-label-mono-sm text-label-mono-sm font-bold">
                          {ch.isMuted ? 'MUTED' : `${ch.currentDb >= 0 ? `+${ch.currentDb}` : ch.currentDb} dB`}
                        </span>
                        {faderMapping && (
                          <span className="font-label-mono-sm text-[9px] bg-secondary/20 text-secondary px-1 rounded font-bold">
                            {faderMapping.label.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Master Bus Channel Strip */}
                <div className="w-44 flex flex-col bg-surface-container-high rounded-lg p-3 relative shadow-[0_0_24px_rgba(0,0,0,0.6)] border border-tertiary-fixed/30">
                  <div className="h-2 w-full rounded-full bg-tertiary-fixed mb-2 shadow-[0_0_12px_rgba(255,217,228,0.9)]" />

                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-mono-sm text-label-mono-sm text-tertiary-fixed font-bold tracking-wider">
                      MASTER BUS
                    </span>
                    <span className="material-symbols-outlined text-tertiary-fixed text-sm">equalizer</span>
                  </div>

                  <span className="font-body-sm text-body-sm text-on-surface font-semibold truncate mb-2">
                    Main Stereo Out
                  </span>

                  {/* Master Fader with MIDI Learn */}
                  <div
                    onClick={(e) => {
                      if (isMidiLearnActive) {
                        handleMidiLearnClick('mixer-fader-master', 'Master Fader', e);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        setMasterFader(Math.max(0, Math.min(100, Math.round((1 - y / rect.height) * 100))));
                      }
                    }}
                    className={`flex-1 min-h-[220px] flex items-stretch justify-center gap-2.5 bg-surface-container-lowest p-2 rounded-lg relative border cursor-pointer ${
                      midiService.isLearning('mixer-fader-master')
                        ? 'border-secondary ring-2 ring-secondary animate-pulse'
                        : isMidiLearnActive
                        ? 'border-dashed border-secondary/60'
                        : 'border-surface-variant/20'
                    }`}
                  >
                    <div className="w-7 bg-surface-container-high rounded-full relative flex flex-col items-center justify-center p-0.5 cursor-ns-resize shadow-inner">
                      <div className="w-1 h-full bg-surface-variant" />
                      <div
                        style={{ top: `${100 - masterFader}%` }}
                        className="absolute -translate-y-1/2 w-6 h-8 rounded bg-tertiary-fixed text-on-tertiary-fixed shadow-[0_4px_12px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center cursor-ns-resize"
                      >
                        <div className="w-4 h-0.5 bg-primary rounded-full" />
                        <div className="w-4 h-0.5 bg-on-tertiary-fixed/40 rounded-full mt-1" />
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <div className="w-3 bg-surface-container-low rounded p-0.5 flex flex-col-reverse gap-0.5">
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`w-full h-1.5 rounded-xs ${
                              idx < 10 ? (idx >= 8 ? 'bg-tertiary-fixed-dim' : 'bg-primary') : 'bg-tertiary-container'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="w-3 bg-surface-container-low rounded p-0.5 flex flex-col-reverse gap-0.5">
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`w-full h-1.5 rounded-xs ${
                              idx < 9 ? (idx >= 7 ? 'bg-tertiary-fixed-dim' : 'bg-primary') : 'bg-tertiary-container'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-center p-1 rounded bg-surface-container-lowest border border-surface-variant/30 flex items-center justify-between px-2">
                    <span className="font-label-mono-md text-label-mono-md text-tertiary-fixed font-bold">
                      -0.3 dB FS
                    </span>
                    {midiService.getMappingForTarget('mixer-fader-master') && (
                      <span className="text-[9px] bg-secondary/20 text-secondary px-1 rounded font-bold">
                        MIDI
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right 4/12: Master Visual EQ & Quick Export Console */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            <div className="bg-surface-container-low rounded-xl p-4 shadow-xl flex flex-col gap-3 border border-surface-variant/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">waves</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    마스터 7-밴드 EQ 곡선
                  </span>
                </div>
                <span className="font-label-mono-sm text-label-mono-sm px-2 py-0.5 rounded bg-surface-container text-primary font-bold">
                  REAL-TIME FFT
                </span>
              </div>

              <div className="h-44 w-full bg-surface-container-lowest rounded-lg p-2.5 relative overflow-hidden flex flex-col justify-between border border-surface-variant/30">
                <svg className="absolute inset-0 w-full h-full p-2" fill="none" preserveAspectRatio="none" viewBox="0 0 400 150">
                  <path d={eqAreaPath} fill="rgba(78,222,163,0.15)" />
                  <path d={eqPath} stroke="#4edea3" strokeLinecap="round" strokeWidth="2.5" />
                  {eqNodes.map((node) => (
                    <circle
                      key={node.id}
                      cx={node.cx}
                      cy={node.cy}
                      r="5"
                      fill="#101319"
                      stroke={node.color}
                      strokeWidth="2.5"
                      onMouseDown={(e) => handleEqNodeDrag(node.id, e)}
                      className="cursor-pointer hover:scale-125 transition-transform"
                    />
                  ))}
                </svg>

                <div className="relative z-10 flex justify-between text-outline-variant font-label-mono-sm text-label-mono-sm">
                  <span>+12 dB</span>
                  <span className="text-primary font-semibold">MID 2.4kHz (+3.2dB)</span>
                  <span>-12 dB</span>
                </div>
              </div>
            </div>

            {/* Quick Export Panel */}
            <div className="bg-surface-container-low rounded-xl p-4 shadow-xl flex flex-col gap-4 border border-surface-variant/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">cloud_download</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    원클릭 음원 추출 (Quick Export)
                  </span>
                </div>
                <span onClick={onOpenExportModal} className="material-symbols-outlined text-on-surface-variant text-base cursor-pointer hover:text-on-surface">
                  settings
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['WAV', 'MP3', 'MIDI'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`py-2 px-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                      exportFormat === fmt
                        ? 'bg-surface-container-high text-primary ring-1 ring-primary/40 shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRenderAndDownload}
                disabled={isRendering}
                className="w-full py-3.5 px-4 rounded-lg bg-primary text-on-primary font-body-lg text-body-lg font-bold shadow-[0_0_16px_rgba(78,222,163,0.4)] hover:bg-primary-fixed hover:shadow-[0_0_24px_rgba(78,222,163,0.6)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
              >
                <span className={`material-symbols-outlined text-lg ${isRendering ? 'animate-spin' : ''}`}>
                  {isRendering ? 'progress_activity' : 'memory'}
                </span>
                <span>{isRendering ? '고음질 마스터링 인코딩 중...' : '오디오 파일 렌더링 및 다운로드'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
