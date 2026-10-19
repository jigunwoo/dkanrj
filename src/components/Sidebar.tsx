import React from 'react';
import { audioEngine } from '../audio/audioEngine';

interface SidebarProps {
  activeInstrument: string;
  onSelectInstrument: (inst: string) => void;
  onAuditionSample: (name: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeInstrument,
  onSelectInstrument,
  onAuditionSample
}) => {
  const instruments = [
    { id: 'piano', name: 'Grand Piano Pro', icon: 'piano', color: 'text-tertiary', hoverColor: 'group-hover:text-tertiary-fixed', active: true },
    { id: 'synth', name: 'PolySynth 84', icon: 'electric_bolt', color: 'text-secondary', hoverColor: 'group-hover:text-secondary-fixed', active: true },
    { id: 'strings', name: 'Studio Strings Ensemble', icon: 'music_note', color: 'text-tertiary-fixed', hoverColor: 'group-hover:text-tertiary-fixed', active: false },
    { id: 'bass', name: 'Sub 808 Bass Core', icon: 'speaker_group', color: 'text-primary', hoverColor: 'group-hover:text-primary-fixed', active: true },
    { id: 'drums', name: 'Trap & Lo-Fi Drums', icon: 'grid_view', color: 'text-tertiary-container', hoverColor: 'group-hover:text-tertiary', active: true },
    { id: 'fx', name: 'Riser & FX Palette', icon: 'auto_fix_high', color: 'text-primary-fixed-dim', hoverColor: 'group-hover:text-primary-fixed', active: false },
  ];

  const samples = [
    { id: 'kicks', name: 'Kicks & Snares (16)', sound: 'drums', note: 'C3' },
    { id: 'hats', name: 'Hi-Hats & Perc (24)', sound: 'drums', note: 'F#3' },
    { id: 'vocals', name: 'Vocal Chops Studio', sound: 'poly', note: 'G4' },
  ];

  const handleInstrumentClick = (inst: typeof instruments[0]) => {
    onSelectInstrument(inst.name);
    if (inst.id === 'piano') audioEngine.playSound('piano', 'C4', 0.8, 110);
    else if (inst.id === 'synth') audioEngine.playSound('poly', 'E4', 0.8, 110);
    else if (inst.id === 'strings') audioEngine.playSound('violin', 'A4', 1.0, 100);
    else if (inst.id === 'bass') audioEngine.playSound('bass', 'C2', 0.8, 120);
    else if (inst.id === 'drums') audioEngine.playSound('drums', 'C3', 0.5, 120);
    else audioEngine.playSound('poly', 'C5', 0.5, 90);
  };

  const handleSampleClick = (sample: typeof samples[0]) => {
    onAuditionSample(sample.name);
    audioEngine.playSound(sample.sound, sample.note, 0.4, 115);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface-container-low z-50 flex flex-col pt-20 pb-4 shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-r border-surface-variant/30 select-none">
      {/* Top Header */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">folder_open</span>
          <span className="font-label-ui text-label-ui uppercase tracking-wider text-on-surface-variant">
            Project Assets
          </span>
        </div>
        <span className="font-label-mono-sm text-label-mono-sm px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
          v1.4
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="px-3 flex-1 overflow-y-auto space-y-1">
        {/* Instruments section */}
        <div className="px-2 py-1 text-on-surface-variant font-label-ui text-label-ui uppercase tracking-wider">
          Instruments
        </div>
        <div className="space-y-1">
          {instruments.map((inst) => {
            const isSelected = activeInstrument.includes(inst.name) || (inst.id === 'piano' && activeInstrument.includes('피아노'));
            return (
              <div
                key={inst.id}
                onClick={() => handleInstrumentClick(inst)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-surface-container-highest ring-1 ring-primary/40'
                    : 'bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`material-symbols-outlined ${inst.color} text-base shrink-0`}>
                    {inst.icon}
                  </span>
                  <span className={`font-body-sm text-body-sm text-on-surface ${inst.hoverColor} truncate`}>
                    {inst.name}
                  </span>
                </div>
                {inst.active ? (
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(16,185,129,0.8)] shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-surface-variant shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Sample Bank section */}
        <div className="pt-4 px-2 py-1 text-on-surface-variant font-label-ui text-label-ui uppercase tracking-wider">
          Sample Bank
        </div>
        <div className="space-y-1">
          {samples.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleSampleClick(sample)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer group"
            >
              <span className="material-symbols-outlined text-sm text-primary/60 group-hover:text-primary transition-colors">
                graphic_eq
              </span>
              <span className="font-body-sm text-body-sm truncate">{sample.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Audio Engine Footer */}
      <div className="px-3 pt-3 border-t border-surface-variant/40">
        <div className="p-2.5 rounded-lg bg-surface-container-lowest flex items-center justify-between shadow-inner">
          <div className="flex flex-col">
            <span className="font-label-ui text-label-ui text-on-surface-variant">AUDIO ENGINE</span>
            <span className="font-label-mono-sm text-label-mono-sm text-primary font-semibold">
              48kHz / 24-bit WebAudio
            </span>
          </div>
          <span className="material-symbols-outlined text-primary text-sm animate-pulse">
            bolt
          </span>
        </div>
      </div>
    </aside>
  );
};
