/**
 * MIDI Service & MIDI Learn State Manager
 */

import { MidiMapping } from '../types';
import { audioEngine, MidiEventData } from '../audio/audioEngine';

export interface MidiTargetDefinition {
  id: string;
  name: string;
  category: 'fader' | 'pan' | 'button' | 'transport';
}

const STORAGE_KEY = 'soundcraft_midi_mappings';

class MidiService {
  private mappings: Map<string, MidiMapping> = new Map();
  private learningTargetId: string | null = null;
  private listeners: Set<() => void> = new Set();
  private actionHandler: ((targetId: string, value: number, eventType: 'cc' | 'note') => void) | null = null;

  constructor() {
    this.loadFromStorage();
    audioEngine.addMidiListener((event) => this.processMidiEvent(event));
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: MidiMapping[] = JSON.parse(stored);
        parsed.forEach((m) => this.mappings.set(m.id, m));
      }
    } catch {}
  }

  private saveToStorage() {
    try {
      const array = Array.from(this.mappings.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
    } catch {}
  }

  public setActionHandler(handler: (targetId: string, value: number, eventType: 'cc' | 'note') => void) {
    this.actionHandler = handler;
  }

  public getMappings(): MidiMapping[] {
    return Array.from(this.mappings.values());
  }

  public getMappingForTarget(targetId: string): MidiMapping | undefined {
    return this.mappings.get(targetId);
  }

  public startLearning(targetId: string, label: string) {
    this.learningTargetId = targetId;
    this.notify();
  }

  public stopLearning() {
    this.learningTargetId = null;
    this.notify();
  }

  public isLearning(targetId?: string): boolean {
    if (!targetId) return this.learningTargetId !== null;
    return this.learningTargetId === targetId;
  }

  public getLearningTargetId(): string | null {
    return this.learningTargetId;
  }

  public removeMapping(targetId: string) {
    this.mappings.delete(targetId);
    this.saveToStorage();
    this.notify();
  }

  public clearAllMappings() {
    this.mappings.clear();
    this.saveToStorage();
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private processMidiEvent(event: MidiEventData) {
    // If currently learning a target control
    if (this.learningTargetId) {
      const targetId = this.learningTargetId;
      const type = event.type === 'cc' ? 'cc' : 'note';

      const mapping: MidiMapping = {
        id: targetId,
        label: `${type.toUpperCase()} ${event.number} (Ch ${event.channel})`,
        type,
        channel: event.channel,
        number: event.number,
      };

      this.mappings.set(targetId, mapping);
      this.saveToStorage();
      this.learningTargetId = null;
      this.notify();
      return;
    }

    // Match incoming event to mapped targets
    this.mappings.forEach((mapping) => {
      const isMatch =
        (mapping.type === 'cc' && event.type === 'cc' && mapping.number === event.number) ||
        (mapping.type === 'note' && (event.type === 'noteOn' || event.type === 'noteOff') && mapping.number === event.number);

      if (isMatch && this.actionHandler) {
        this.actionHandler(mapping.id, event.value, mapping.type);
      }
    });
  }
}

export const midiService = new MidiService();
