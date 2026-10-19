export type ScreenType = 
  | 'piano-roll-sequencer'
  | 'multitrack-arranger'
  | 'virtual-instruments-hub'
  | 'mixer-mastering';

export interface NoteItem {
  id: string;
  note: string; // e.g. "C4", "D#4"
  octave: number;
  pitchIndex: number; // 0 to 24 (C3 to C5)
  bar: number; // 1 to 4
  startBeat: number; // 0 to 15.75
  duration: number; // in beats, e.g. 1.0, 2.0, 3.5
  velocity: number; // 0 to 127
  colorClass: string;
  label: string;
}

export interface InstrumentPreset {
  id: string;
  name: string;
  category: 'keys' | 'strings' | 'synths' | 'drums';
  categoryLabel: string;
  engine: string;
  badge: string;
  badgeColor: string;
  description: string;
  icon: string;
  soundType: 'piano' | 'rhodes' | 'felt' | 'violin' | 'cello' | 'bass' | 'poly' | 'drums';
  ramUsage: string;
  velocityLayers: string;
}

export interface TrackChannel {
  id: number;
  name: string;
  shortName: string;
  color: string;
  colorHex: string;
  icon: string;
  gain: number; // dB (-12 to +6)
  pan: number; // -50 (L) to +50 (R)
  isMuted: boolean;
  isSolo: boolean;
  isPhaseInverted: boolean;
  faderLevel: number; // 0 to 100%
  inserts: { name: string; active: boolean }[];
  currentDb: number;
  vuLevel: number; // 0 to 12 (number of LED bars lit)
}

export interface ArrangerPattern {
  id: number;
  name: string;
  tag: string;
  color: string;
  colorHex: string;
}

export interface ArrangerClip {
  id: string;
  trackId: number;
  patternId: number;
  name: string;
  startBar: number; // 1 to 16
  durationBars: number; // 1 to 8
  colorClass: string;
  waveType: 'midi' | 'saw' | 'strings' | 'drums' | 'bass' | 'automation';
}

export interface MidiMapping {
  id: string; // Target UI control ID, e.g. "mixer-fader-1", "transport-play"
  label: string; // Human readable name
  type: 'cc' | 'note';
  channel: number;
  number: number; // CC number or Note number (0-127)
}
