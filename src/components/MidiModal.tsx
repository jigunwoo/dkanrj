import React, { useState, useEffect } from 'react';
import { midiService } from '../services/midiService';
import { audioEngine } from '../audio/audioEngine';
import { MidiMapping } from '../types';

interface MidiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const MidiModal: React.FC<MidiModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [devices, setDevices] = useState<string[]>([]);
  const [mappings, setMappings] = useState<MidiMapping[]>([]);
  const [isVirtualControllerOpen, setIsVirtualControllerOpen] = useState(true);

  // Virtual knobs/sliders state for testing
  const [sliderVals, setSliderVals] = useState<Record<number, number>>({
    1: 64, // Mod wheel
    7: 100, // Volume
    10: 64, // Pan
    11: 90, // Expression
  });

  useEffect(() => {
    if (!isOpen) return;

    // Detect MIDI devices
    audioEngine.initMidi().then((devs) => {
      setDevices(devs);
    });

    const unsubscribe = midiService.subscribe(() => {
      setMappings(midiService.getMappings());
    });
    setMappings(midiService.getMappings());

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVirtualSliderChange = (ccNum: number, value: number) => {
    setSliderVals((prev) => ({ ...prev, [ccNum]: value }));
    audioEngine.sendVirtualMidi('cc', ccNum, value);
  };

  const handleVirtualPadPress = (noteNum: number) => {
    audioEngine.sendVirtualMidi('noteOn', noteNum, 110);
  };

  const handleVirtualPadRelease = (noteNum: number) => {
    audioEngine.sendVirtualMidi('noteOff', noteNum, 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-surface-container-low rounded-xl w-full max-w-2xl p-6 shadow-2xl relative space-y-5 border border-surface-variant/40 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">settings_ethernet</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                MIDI 제어 및 MIDI Learn 매핑 센터
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                외장 하드웨어 컨트롤러(노브, 페이더, 패드)를 믹서 및 트랜스포트에 1:1 매핑합니다.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-outline hover:text-on-surface p-1 rounded-lg cursor-pointer">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Hardware Status */}
        <div className="p-3.5 rounded-xl bg-surface-container flex items-center justify-between border border-surface-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">piano</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                  연결된 MIDI 하드웨어 장치
                </span>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <p className="font-label-mono-sm text-label-mono-sm text-on-surface-variant mt-0.5">
                {devices.length > 0
                  ? devices.join(', ')
                  : '외부 장비 없음 (가상 컨트롤러 테스트 기능 활성)'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.initMidi().then((devs) => {
                setDevices(devs);
                onShowToast(devs.length > 0 ? `MIDI 장비 ${devs.length}대 감지됨` : '새 장치가 감지되지 않았습니다.');
              });
            }}
            className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-body-sm text-body-sm transition-colors cursor-pointer border border-surface-variant/30 text-xs"
          >
            장치 재스캔
          </button>
        </div>

        {/* Instructions */}
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>MIDI Learn 사용 방법:</span>
          </div>
          1. 믹서 페이더, 버튼, 트랜스포트의 <strong>[MIDI]</strong> 또는 학습 아이콘을 클릭합니다.<br />
          2. 노란색으로 점멸할 때 외장 건반의 노브나 페이더, 패드를 움직이면 즉시 영구 매핑됩니다.<br />
          3. 장비가 없을 경우 아래 가상 컨트롤러로 즉시 테스트할 수 있습니다.
        </div>

        {/* Virtual MIDI Hardware Controller Simulator */}
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-label-ui text-label-ui text-outline uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-secondary">tune</span>
              가상 MIDI 컨트롤러 테스트베드 (Virtual Hardware Sim)
            </span>
            <button
              onClick={() => setIsVirtualControllerOpen(!isVirtualControllerOpen)}
              className="text-xs text-secondary hover:underline cursor-pointer"
            >
              {isVirtualControllerOpen ? '축소' : '펼치기'}
            </button>
          </div>

          {isVirtualControllerOpen && (
            <div className="space-y-4 pt-1">
              {/* Virtual Sliders (CC 1, 7, 10, 11) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { cc: 7, label: 'CC 7 (Volume)', min: 0, max: 127 },
                  { cc: 10, label: 'CC 10 (Pan)', min: 0, max: 127 },
                  { cc: 1, label: 'CC 1 (Modulation)', min: 0, max: 127 },
                  { cc: 11, label: 'CC 11 (Expression)', min: 0, max: 127 },
                ].map((ctl) => (
                  <div key={ctl.cc} className="p-2.5 rounded-lg bg-surface-container flex flex-col gap-1.5 border border-surface-variant/20">
                    <div className="flex items-center justify-between text-[11px] font-label-mono-sm">
                      <span className="text-on-surface">{ctl.label}</span>
                      <span className="text-primary font-bold">{sliderVals[ctl.cc]}</span>
                    </div>
                    <input
                      type="range"
                      min={ctl.min}
                      max={ctl.max}
                      value={sliderVals[ctl.cc]}
                      onChange={(e) => handleVirtualSliderChange(ctl.cc, Number(e.target.value))}
                      className="accent-emerald-400 w-full cursor-pointer h-1.5 bg-surface-container-high rounded"
                    />
                  </div>
                ))}
              </div>

              {/* Virtual Trigger Pads (Note 36, 38, 42, 46) */}
              <div className="space-y-1">
                <span className="text-[11px] font-label-mono-sm text-outline">
                  트리거 패드 (버튼 / 트랜스포트 / Mute 매핑 테스트)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { note: 36, label: 'PAD 1 (Note 36)' },
                    { note: 38, label: 'PAD 2 (Note 38)' },
                    { note: 42, label: 'PAD 3 (Note 42)' },
                    { note: 46, label: 'PAD 4 (Note 46)' },
                  ].map((pad) => (
                    <button
                      key={pad.note}
                      onMouseDown={() => handleVirtualPadPress(pad.note)}
                      onMouseUp={() => handleVirtualPadRelease(pad.note)}
                      onMouseLeave={() => handleVirtualPadRelease(pad.note)}
                      onTouchStart={() => handleVirtualPadPress(pad.note)}
                      onTouchEnd={() => handleVirtualPadRelease(pad.note)}
                      className="py-2.5 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high active:bg-primary active:text-on-primary text-on-surface font-label-mono-sm text-xs transition-colors border border-surface-variant/30 cursor-pointer text-center"
                    >
                      {pad.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Mappings List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-label-ui text-label-ui text-outline uppercase tracking-wider">
              현재 활성화된 MIDI 매핑 ({mappings.length}개)
            </span>
            {mappings.length > 0 && (
              <button
                onClick={() => {
                  midiService.clearAllMappings();
                  onShowToast('모든 MIDI 매핑이 초기화되었습니다.');
                }}
                className="text-xs text-error hover:underline cursor-pointer"
              >
                전체 매핑 삭제
              </button>
            )}
          </div>

          {mappings.length === 0 ? (
            <div className="p-4 rounded-xl bg-surface-container text-center text-xs text-on-surface-variant border border-surface-variant/20">
              현재 등록된 MIDI 매핑이 없습니다. 상단 또는 믹서에서 <strong>[MIDI]</strong> 버튼을 눌러 컨트롤을 연결해보세요.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {mappings.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container border border-surface-variant/30 text-xs font-label-mono-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(78,222,163,0.8)]" />
                    <span className="font-semibold text-on-surface">{m.id}</span>
                    <span className="text-outline">←</span>
                    <span className="text-secondary font-bold">{m.label}</span>
                  </div>

                  <button
                    onClick={() => {
                      midiService.removeMapping(m.id);
                      onShowToast(`매핑 해제됨: ${m.id}`);
                    }}
                    className="text-outline hover:text-error transition-colors p-1"
                    title="매핑 삭제"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant/30">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:bg-primary-fixed transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
