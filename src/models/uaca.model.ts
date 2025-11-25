export type TCEPhase = 'Apollonian' | 'Dionysian' | 'Hegelian';

export interface AODState {
  I: number; // Information
  C: number; // Complexity
  H: number; // Coherence
}

export interface StateLog {
  cycle: number;
  predictedAodState: AODState;
  aodState: AODState;
  tcePhase: TCEPhase;
  anomaly: string | null;
  witnessSignature: string;
}

export interface LayerSnapshot {
  id: number;
  aodState: AODState;
  tcePhase: TCEPhase;
}

export interface TemporalState {
  cycle: number;
  layers: LayerSnapshot[];
}

export interface LayerState {
  id: number;
  name: string;
  updateTime: string;
  aodState: AODState;
  tcePhase: TCEPhase;
  anomaly: string | null;
  witnessSignature: string;
  log: StateLog[];
  council: 'Strategy' | 'Execution' | 'Reaction';
}

export interface Subsystem {
  id: number;
  title: string;
  description: string;
  details: string[];
}

export interface ExecutionStep {
  id: number;
  name: string;
}

export interface ChatMessage {
  sender: 'user' | 'gce';
  text: string;
  type?: 'response' | 'thought';
  witnessSignature?: string;
  cycle?: number;
}

export interface Persona {
  name: string;
  description: string;
  preferredPhase?: TCEPhase;
}