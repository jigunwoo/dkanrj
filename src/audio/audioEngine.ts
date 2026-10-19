/**
 * Obsidian Soundcraft WebAudio Synthesis Engine
 * Optimized for glitch-free low latency, voice management, toggle sound playback,
 * Web MIDI API integration, and WAV audio export.
 */

export interface ActiveVoice {
  id: string;
  soundType: string;
  note: string;
  oscillators: OscillatorNode[];
  gainNode: GainNode;
  stopTimer?: number;
}

export interface MidiEventData {
  type: 'cc' | 'noteOn' | 'noteOff';
  channel: number;
  number: number; // Note number or CC number (0-127)
  value: number; // Velocity (0-127) or CC Value (0-127)
  timestamp: number;
}

type MidiListener = (event: MidiEventData) => void;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;

  private toneMacro: number = 0.68;
  private spaceMacro: number = 0.50;
  private attackMacro: number = 0.25;
  private warmthMacro: number = 0.60;

  // Active sounding voices registry: Map<id, ActiveVoice>
  private activeVoices: Map<string, ActiveVoice> = new Map();

  // MIDI input management
  private midiAccess: any = null;
  private midiListeners: Set<MidiListener> = new Set();
  private connectedMidiDevices: string[] = [];

  public initContext() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass({ latencyHint: 'interactive' });

      // Master Signal Chain:
      // Voice Nodes -> masterFilter -> masterCompressor -> masterGain -> destination
      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.setValueAtTime(this.calcCutoff(this.toneMacro), this.ctx.currentTime);
      this.masterFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.masterCompressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.65, this.ctx.currentTime);

      this.masterFilter.connect(this.masterCompressor);
      this.masterCompressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private calcCutoff(norm: number): number {
    return 200 * Math.pow(18000 / 200, norm);
  }

  public setTone(value: number) {
    this.toneMacro = Math.max(0, Math.min(1, value));
    if (this.masterFilter && this.ctx) {
      this.masterFilter.frequency.setTargetAtTime(
        this.calcCutoff(this.toneMacro),
        this.ctx.currentTime,
        0.05
      );
    }
  }

  public setSpace(value: number) {
    this.spaceMacro = Math.max(0, Math.min(1, value));
  }

  public setAttack(value: number) {
    this.attackMacro = Math.max(0, Math.min(1, value));
  }

  public setWarmth(value: number) {
    this.warmthMacro = Math.max(0, Math.min(1, value));
  }

  public noteToFreq(note: string): number {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const match = note.match(/^([A-G]#?)(\d)$/);
    if (!match) return 261.63;

    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    const semitone = notes.indexOf(noteName);
    const midi = (octave + 1) * 12 + semitone;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  public midiNumberToNote(midiNum: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = notes[midiNum % 12];
    const octave = Math.floor(midiNum / 12) - 1;
    return `${noteName}${octave}`;
  }

  public playMetronome(accent: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freq = accent ? 1400 : 900;
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.masterFilter);

      osc.start(now);
      osc.stop(now + 0.06);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Audio safety
    }
  }

  /**
   * Check if a voice/sound with given ID is currently sounding
   */
  public isSoundActive(id: string): boolean {
    return this.activeVoices.has(id);
  }

  public getActiveSoundIds(): string[] {
    return Array.from(this.activeVoices.keys());
  }

  /**
   * Stop an active sounding voice immediately with a short de-click release
   */
  public stopSound(id: string) {
    const voice = this.activeVoices.get(id);
    if (!voice || !this.ctx) return;

    if (voice.stopTimer) {
      window.clearTimeout(voice.stopTimer);
    }

    try {
      const now = this.ctx.currentTime;
      voice.gainNode.gain.cancelScheduledValues(now);
      voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
      voice.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.03);

      setTimeout(() => {
        voice.oscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        try {
          voice.gainNode.disconnect();
        } catch {}
      }, 40);
    } catch {}

    this.activeVoices.delete(id);
  }

  /**
   * Stop all sounding voices at once (Panic button / Stop)
   */
  public stopAllSounds() {
    Array.from(this.activeVoices.keys()).forEach((id) => this.stopSound(id));
    this.activeVoices.clear();
  }

  /**
   * TOGGLE SOUND:
   * "눌러서 소리를 나타내는 기능에서 한번 더 누르면 그 소리가 사라지게 해주는 기능"
   * If voice is already playing -> stops it and returns false.
   * If voice is not playing -> starts it and returns true.
   */
  public toggleSound(
    id: string,
    soundType: string,
    noteName: string = 'C4',
    duration: number = 3.0,
    velocity: number = 100
  ): boolean {
    if (this.isSoundActive(id)) {
      this.stopSound(id);
      return false; // Stopped
    }

    this.playSound(soundType, noteName, duration, velocity, id);
    return true; // Started
  }

  /**
   * Low-latency, de-clicked polyphonic synthesis
   */
  public playSound(
    soundType: string,
    noteName: string = 'C4',
    duration: number = 1.0,
    velocity: number = 100,
    voiceId?: string
  ) {
    this.initContext();
    if (!this.ctx || !this.masterFilter) return;

    // If an existing voice exists with this ID, stop it first to prevent voice pileup
    const id = voiceId || `voice-${noteName}-${Date.now()}-${Math.random()}`;
    if (this.activeVoices.has(id)) {
      this.stopSound(id);
    }

    // Limit active voices to 24 to prevent browser CPU freeze & crackle
    if (this.activeVoices.size > 24) {
      const oldestKey = this.activeVoices.keys().next().value;
      if (oldestKey) this.stopSound(oldestKey);
    }

    const freq = this.noteToFreq(noteName);
    const velFactor = Math.max(0.1, velocity / 127);
    const now = this.ctx.currentTime;
    const oscillators: OscillatorNode[] = [];
    const gainNode = this.ctx.createGain();

    switch (soundType) {
      case 'piano':
      case 'felt': {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const osc3 = this.ctx.createOscillator();

        osc1.type = soundType === 'felt' ? 'sine' : 'triangle';
        osc1.frequency.setValueAtTime(freq, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, now);

        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(freq * 3, now);

        const atk = 0.008 + this.attackMacro * 0.04;
        const decay = duration + 0.6;

        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(0.38 * velFactor, now + atk);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        const osc2Gain = this.ctx.createGain();
        osc2Gain.gain.value = soundType === 'felt' ? 0.2 : 0.35;
        const osc3Gain = this.ctx.createGain();
        osc3Gain.gain.value = soundType === 'felt' ? 0.05 : 0.12;

        osc1.connect(gainNode);
        osc2.connect(osc2Gain);
        osc2Gain.connect(gainNode);
        osc3.connect(osc3Gain);
        osc3Gain.connect(gainNode);

        gainNode.connect(this.masterFilter);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        oscillators.push(osc1, osc2, osc3);
        break;
      }

      case 'rhodes': {
        const carrier = this.ctx.createOscillator();
        const bell = this.ctx.createOscillator();

        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(freq, now);

        bell.type = 'sine';
        bell.frequency.setValueAtTime(freq * 4.02, now);

        const bellGain = this.ctx.createGain();
        bellGain.gain.setValueAtTime(0.25 * velFactor, now);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(0.45 * velFactor, now + 0.012);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.7);

        carrier.connect(gainNode);
        bell.connect(bellGain);
        bellGain.connect(gainNode);
        gainNode.connect(this.masterFilter);

        carrier.start(now);
        bell.start(now);
        oscillators.push(carrier, bell);
        break;
      }

      case 'violin':
      case 'cello': {
        const osc = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(5.2, now);
        lfoGain.gain.setValueAtTime(5.0, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(soundType === 'cello' ? 1100 : 2600, now);

        const atk = 0.06 + this.attackMacro * 0.15;
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(0.32 * velFactor, now + atk);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.35);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterFilter);

        lfo.start(now);
        osc.start(now);
        oscillators.push(osc, lfo);
        break;
      }

      case 'bass': {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.4, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.07);

        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(0.55 * velFactor, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.5);

        osc.connect(gainNode);
        gainNode.connect(this.masterFilter);

        osc.start(now);
        oscillators.push(osc);
        break;
      }

      case 'poly': {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, now);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq * 1.006, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 2.8, now);
        filter.Q.setValueAtTime(2.5, now);

        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(0.28 * velFactor, now + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.45);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterFilter);

        osc1.start(now);
        osc2.start(now);
        oscillators.push(osc1, osc2);
        break;
      }

      case 'drums': {
        const isKick = noteName.includes('C');
        const isSnare = noteName.includes('D');

        if (isKick) {
          const osc = this.ctx.createOscillator();
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(42, now + 0.1);
          gainNode.gain.setValueAtTime(0.65 * velFactor, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.connect(gainNode);
          gainNode.connect(this.masterFilter);
          osc.start(now);
          oscillators.push(osc);
        } else if (isSnare) {
          const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'highpass';
          noiseFilter.frequency.value = 950;

          gainNode.gain.setValueAtTime(0.35 * velFactor, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

          noise.connect(noiseFilter);
          noiseFilter.connect(gainNode);
          gainNode.connect(this.masterFilter);
          noise.start(now);
        } else {
          const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

          const hat = this.ctx.createBufferSource();
          hat.buffer = buffer;
          const hatFilter = this.ctx.createBiquadFilter();
          hatFilter.type = 'highpass';
          hatFilter.frequency.value = 6500;

          gainNode.gain.setValueAtTime(0.28 * velFactor, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          hat.connect(hatFilter);
          hatFilter.connect(gainNode);
          gainNode.connect(this.masterFilter);
          hat.start(now);
        }
        break;
      }
    }

    // Auto cleanup voice record when duration expires
    const stopTimer = window.setTimeout(() => {
      this.stopSound(id);
    }, (duration + 0.8) * 1000);

    this.activeVoices.set(id, {
      id,
      soundType,
      note: noteName,
      oscillators,
      gainNode,
      stopTimer,
    });
  }

  public playChordPreview() {
    this.initContext();
    const chord = ['C4', 'D#4', 'G4', 'C5'];
    chord.forEach((n, i) => {
      setTimeout(() => {
        this.playSound('piano', n, 1.2, 115, `chord-preview-${n}`);
      }, i * 40);
    });
  }

  public playEasyToneTest(note: string = 'C3') {
    this.initContext();
    const chord = [note, 'G3', 'C4', 'D#4'];
    chord.forEach((n, i) => {
      setTimeout(() => {
        this.playSound('poly', n, 1.3, 110, `tone-test-${n}`);
      }, i * 50);
    });
  }

  // ===================== WEB MIDI API & MIDI LEARN =====================

  public async initMidi(): Promise<string[]> {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      return [];
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.connectedMidiDevices = [];

      const inputs = this.midiAccess.inputs.values();
      for (const input of inputs) {
        this.connectedMidiDevices.push(input.name || 'Generic MIDI Device');
        input.onmidimessage = (e: any) => this.handleMidiMessage(e);
      }

      this.midiAccess.onstatechange = (e: any) => {
        if (e.port.type === 'input') {
          if (e.port.state === 'connected') {
            e.port.onmidimessage = (ev: any) => this.handleMidiMessage(ev);
          }
          this.refreshConnectedDevices();
        }
      };

      return this.connectedMidiDevices;
    } catch {
      return [];
    }
  }

  private refreshConnectedDevices() {
    if (!this.midiAccess) return;
    this.connectedMidiDevices = [];
    const inputs = this.midiAccess.inputs.values();
    for (const input of inputs) {
      this.connectedMidiDevices.push(input.name || 'Generic MIDI Device');
    }
  }

  public getConnectedMidiDevices(): string[] {
    return this.connectedMidiDevices;
  }

  public addMidiListener(listener: MidiListener) {
    this.midiListeners.add(listener);
    return () => this.midiListeners.delete(listener);
  }

  private handleMidiMessage(event: any) {
    const data: Uint8Array = event.data;
    if (!data || data.length < 2) return;

    const status = data[0] & 0xf0;
    const channel = (data[0] & 0x0f) + 1;
    const number = data[1];
    const value = data[2] !== undefined ? data[2] : 0;

    let midiEvent: MidiEventData | null = null;

    if (status === 0xb0) {
      // Control Change (CC)
      midiEvent = {
        type: 'cc',
        channel,
        number,
        value,
        timestamp: event.timeStamp || performance.now(),
      };
    } else if (status === 0x90 && value > 0) {
      // Note On
      midiEvent = {
        type: 'noteOn',
        channel,
        number,
        value,
        timestamp: event.timeStamp || performance.now(),
      };

      // Also trigger sound directly for testing
      const noteName = this.midiNumberToNote(number);
      this.playSound('piano', noteName, 0.8, value, `hw-midi-${number}`);
    } else if (status === 0x80 || (status === 0x90 && value === 0)) {
      // Note Off
      midiEvent = {
        type: 'noteOff',
        channel,
        number,
        value: 0,
        timestamp: event.timeStamp || performance.now(),
      };
      this.stopSound(`hw-midi-${number}`);
    }

    if (midiEvent) {
      this.midiListeners.forEach((listener) => {
        try {
          listener(midiEvent!);
        } catch {}
      });
    }
  }

  /**
   * Virtual MIDI message simulation for browser testing without hardware
   */
  public sendVirtualMidi(type: 'cc' | 'noteOn' | 'noteOff', number: number, value: number, channel: number = 1) {
    const event: MidiEventData = {
      type,
      channel,
      number,
      value,
      timestamp: performance.now(),
    };

    if (type === 'noteOn') {
      const noteName = this.midiNumberToNote(number);
      this.playSound('piano', noteName, 0.8, value, `virt-midi-${number}`);
    } else if (type === 'noteOff') {
      this.stopSound(`virt-midi-${number}`);
    }

    this.midiListeners.forEach((l) => l(event));
  }

  // ===================== WAV EXPORT IN MEMORY =====================

  public generateWavFile(trackName: string = 'Midnight_Horizon_Master'): Blob {
    const sampleRate = 44100;
    const duration = 8.0;
    const numChannels = 2;
    const numFrames = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + numFrames * numChannels * 2);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numFrames * numChannels * 2, true);
    writeString(view, 8, 'WAVE');

    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);

    writeString(view, 36, 'data');
    view.setUint32(40, numFrames * numChannels * 2, true);

    let offset = 44;
    const bpm = 120;
    const beatSec = 60 / bpm;
    const notesFreq = [261.63, 311.13, 392.0, 523.25, 392.0, 349.23, 311.13, 261.63];

    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      const beat = Math.floor(t / (beatSec / 2)) % notesFreq.length;
      const f = notesFreq[beat];

      const env = Math.exp(-((t % (beatSec / 2)) * 3.5));
      const sample =
        Math.sin(2 * Math.PI * f * t) * 0.4 * env +
        Math.sin(2 * Math.PI * (f * 0.5) * t) * 0.3 * env +
        Math.sin(2 * Math.PI * 55 * t) * 0.25;

      const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
      view.setInt16(offset, intSample, true);
      view.setInt16(offset + 2, intSample, true);
      offset += 4;
    }

    return new Blob([view], { type: 'audio/wav' });
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const audioEngine = new AudioEngine();
