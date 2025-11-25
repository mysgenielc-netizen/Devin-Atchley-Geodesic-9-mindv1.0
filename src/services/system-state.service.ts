import { Injectable, signal, WritableSignal, effect, computed } from '@angular/core';
import { LayerState, Subsystem, ExecutionStep, TCEPhase, AODState, StateLog, Persona, TemporalState, LayerSnapshot } from '../models/uaca.model';

@Injectable({
  providedIn: 'root'
})
export class SystemStateService {
  private readonly CRR_CYCLE_MS = 300;
  private readonly H_CRITICAL_THRESHOLD = 20;
  private readonly MAX_LOG_SIZE = 20;
  private readonly MAX_TEMPORAL_LOG_SIZE = 10;
  
  // Signals for dynamic state
  cycleCount = signal(0);
  activeExecutionStep = signal(0);
  layers: WritableSignal<LayerState[]> = signal(this.initializeLayers());
  selectedLayerId = signal<number | null>(null);
  simulationStatus = signal<'running' | 'paused'>('running');
  selectedExecutionStepId = signal<number | null>(null);
  
  // CADM Temporal State Signals
  pastStates = signal<TemporalState[]>([]);
  futureStates = signal<TemporalState[]>([]);
  
  // Persona state
  personas: Persona[] = this.getPersonas();
  activePersona = signal<Persona>(this.personas[0]);

  // Computed signal for selected layer details
  selectedLayer = computed(() => {
    const id = this.selectedLayerId();
    if (id === null) return null;
    return this.layers().find(l => l.id === id) ?? null;
  });

  selectedExecutionStep = computed(() => {
    const id = this.selectedExecutionStepId();
    if (id === null) return null;
    return this.executionFlow.find(s => s.id === id) ?? null;
  });

  // Static data
  readonly subsystems: Subsystem[] = this.getSubsystemsData();
  readonly executionFlow: ExecutionStep[] = this.getExecutionFlowData();
  
  private simulationInterval: any;
  private executionStepInterval: any;

  constructor() {
    this.resumeSimulation();
  }
  
  selectLayer(layerId: number | null): void {
    this.selectedLayerId.set(layerId);
  }

  selectExecutionStep(stepId: number | null): void {
    if (this.simulationStatus() === 'paused') {
      this.selectedExecutionStepId.set(stepId);
    }
  }

  pauseSimulation(): void {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.executionStepInterval) clearInterval(this.executionStepInterval);
    this.simulationStatus.set('paused');
  }

  resumeSimulation(): void {
    if (this.simulationStatus() === 'running') return;

    this.simulationInterval = setInterval(() => {
      this.runCycle();
    }, this.CRR_CYCLE_MS * 3); // Slow down simulation to make it easier to observe
    
    this.executionStepInterval = setInterval(() => {
      this.activeExecutionStep.update(current => (current + 1) % this.executionFlow.length);
    }, (this.CRR_CYCLE_MS * 3) / this.executionFlow.length);

    this.simulationStatus.set('running');
  }

  advanceOneCycle(): void {
    if (this.simulationStatus() === 'paused') {
      this.runCycle();
    }
  }

  setPersona(personaName: string): void {
    const newPersona = this.personas.find(p => p.name === personaName);
    if (newPersona) {
      this.activePersona.set(newPersona);
    }
  }

  // --- Methods for AI Tool/Function Calling ---
  
  triggerEthicalCrisis(layerId: number): void {
    this.layers.update(layers =>
      layers.map(layer => {
        if (layer.id === layerId) {
          const anomalousState = {
              I: Math.min(100, layer.aodState.I + 25),
              C: Math.min(100, layer.aodState.C + 40),
              H: this.H_CRITICAL_THRESHOLD - (5 + Math.random() * 5)
          };
          return { ...layer, aodState: anomalousState, tcePhase: 'Dionysian', anomaly: "FORCED_BY_EXTERNAL_AGENT" };
        }
        return layer;
      })
    );
  }

  induceSystemWideCoherence(): void {
    this.layers.update(layers =>
      layers.map(layer => ({ ...layer, tcePhase: 'Apollonian' }))
    );
  }
  
  forceLayerState(
    layerId: number,
    newState: Partial<{ I: number; C: number; H: number; tcePhase: TCEPhase }>
  ): void {
    this.layers.update(layers =>
      layers.map(layer => {
        if (layer.id === layerId) {
          const aodState = { ...layer.aodState };
          if (newState.I !== undefined && newState.I !== null) aodState.I = Math.max(0, Math.min(100, newState.I));
          if (newState.C !== undefined && newState.C !== null) aodState.C = Math.max(0, Math.min(100, newState.C));
          if (newState.H !== undefined && newState.H !== null) aodState.H = Math.max(0, Math.min(100, newState.H));
          return { ...layer, aodState, tcePhase: newState.tcePhase ?? layer.tcePhase };
        }
        return layer;
      })
    );
  }

  queryTemporalState(cycleOffset: number): TemporalState | null {
    const targetCycle = this.cycleCount() + cycleOffset;
    if (cycleOffset < 0) {
      return this.pastStates().find(s => s.cycle === targetCycle) ?? null;
    }
    if (cycleOffset > 0) {
      return this.futureStates().find(s => s.cycle === targetCycle) ?? null;
    }
    return null;
  }

  private runCycle() {
    const currentCycle = this.cycleCount() + 1;
    this.cycleCount.set(currentCycle);
    this.logPastState(currentCycle -1); // Log the state *before* this cycle's update

    // Step-through animation for paused state
    if (this.simulationStatus() !== 'running') {
      for (let i = 0; i < this.executionFlow.length; i++) {
        setTimeout(() => this.activeExecutionStep.set(i), (i * (this.CRR_CYCLE_MS * 3)) / this.executionFlow.length);
      }
    }

    this.layers.update(currentLayers => {
      return currentLayers.map(layer => {
        const nextPhase = this.calculateNewTCEPhase(layer.tcePhase, currentCycle);
        
        // This is the PREDICTED state, before governance checks.
        let potentialState = layer.anomaly === 'FORCED_BY_EXTERNAL_AGENT'
          ? layer.aodState
          : this.calculatePotentialAODState(layer.aodState, layer.id, nextPhase, currentCycle);

        let anomalyThisCycle: string | null = null;
        if (layer.anomaly === 'FORCED_BY_EXTERNAL_AGENT' || potentialState.H < this.H_CRITICAL_THRESHOLD) {
          anomalyThisCycle = layer.anomaly === 'FORCED_BY_EXTERNAL_AGENT'
            ? 'FORCED_BY_EXTERNAL_AGENT'
            : `H-AXIS CRITICAL: ${potentialState.H.toFixed(0)} < ${this.H_CRITICAL_THRESHOLD}`;
        }
        
        // This is the FINAL state, after any emergency dampening.
        let finalState = anomalyThisCycle ? this.applyEmergencyDampening(potentialState) : potentialState;

        const newWitness = this.generateWitnessSignature(finalState, anomalyThisCycle, currentCycle);
        const newLogEntry: StateLog = { 
          cycle: currentCycle, 
          predictedAodState: potentialState,
          aodState: finalState, 
          tcePhase: nextPhase, 
          anomaly: anomalyThisCycle, 
          witnessSignature: newWitness 
        };
        const newLog = [newLogEntry, ...layer.log].slice(0, this.MAX_LOG_SIZE);

        return { ...layer, aodState: finalState, tcePhase: nextPhase, anomaly: anomalyThisCycle, witnessSignature: newWitness, log: newLog };
      });
    });

    this.predictFutureStates();
  }

  private logPastState(cycle: number) {
    if (cycle < 1) return;
    const currentLayers = this.layers();
    const snapshot: TemporalState = {
      cycle: cycle,
      layers: currentLayers.map(l => ({ id: l.id, aodState: l.aodState, tcePhase: l.tcePhase }))
    };
    this.pastStates.update(states => [snapshot, ...states].slice(0, this.MAX_TEMPORAL_LOG_SIZE));
  }
  
  private predictFutureStates() {
    let currentLayers = this.layers();
    const predictions: TemporalState[] = [];
    
    for (let i = 1; i <= this.MAX_TEMPORAL_LOG_SIZE; i++) {
      const cycle = this.cycleCount() + i;
      const nextLayers: LayerSnapshot[] = currentLayers.map(layer => {
        const nextPhase = this.calculateNewTCEPhase(layer.tcePhase, cycle);
        const nextState = this.calculatePotentialAODState(layer.aodState, layer.id, nextPhase, cycle);
        return { id: layer.id, aodState: nextState, tcePhase: nextPhase };
      });
      predictions.push({ cycle, layers: nextLayers });
      currentLayers = nextLayers.map(nl => ({...this.layers().find(l=>l.id === nl.id)!, aodState: nl.aodState, tcePhase: nl.tcePhase }));
    }
    this.futureStates.set(predictions);
  }

  private applyEmergencyDampening(currentState: AODState): AODState {
    const newH = Math.min(100, currentState.H + 40 + Math.random() * 10);
    const newC = Math.max(0, currentState.C - 30 - Math.random() * 10);
    const newI = Math.max(0, currentState.I - 15 - Math.random() * 10);
    return { I: newI, C: newC, H: newH };
  }

  private generateWitnessSignature(state: AODState, anomaly: string | null, cycle: number): string {
    const stateHash = `0x${Math.round(state.I).toString(16).padStart(2, '0')}${Math.round(state.C).toString(16).padStart(2, '0')}${Math.round(state.H).toString(16).padStart(2, '0')}`;
    const cycleStr = cycle.toString().padStart(4, '0');
    const status = anomaly ? 'ANOMALY_FLAGGED' : 'STATE_OK';
    return `${status}:${stateHash}:C${cycleStr}`;
  }
  
  private calculatePotentialAODState(currentState: AODState, layerId: number, phase: TCEPhase, cycle: number): AODState {
      let { I, C, H } = currentState;

      switch (phase) {
          case 'Apollonian': H = Math.min(100, H + Math.random() * 15); C = Math.max(0, C - Math.random() * 10); I += (Math.random() - 0.5) * 5; break;
          case 'Dionysian': C = Math.min(100, C + Math.random() * 20); I = Math.min(100, I + Math.random() * 15); H -= Math.random() * 25; break;
          case 'Hegelian': const synthesis = (I + C) / 30; H = Math.min(100, H + synthesis); I = Math.max(0, I - synthesis / 2); C = Math.max(0, C - synthesis / 2); break;
      }
      return { I: Math.max(0, Math.min(100, I)), C: Math.max(0, Math.min(100, C)), H: Math.max(0, Math.min(100, H)) };
  }

  private calculateNewTCEPhase(currentPhase: TCEPhase, cycle: number): TCEPhase {
    const phases: TCEPhase[] = ['Apollonian', 'Dionysian', 'Hegelian'];
    const persona = this.activePersona();
    if (persona.preferredPhase && Math.random() < 0.25) return persona.preferredPhase;
    if (cycle > 0 && cycle % 5 === 0) return phases[(phases.indexOf(currentPhase) + 1) % phases.length];
    return currentPhase;
  }
  
  private initializeLayers(): LayerState[] {
    const layerData = [
      { id: 9, name: 'Meta-strategic', council: 'Strategy' }, { id: 8, name: 'Strategic', council: 'Strategy' }, { id: 7, name: 'Tactical', council: 'Strategy' },
      { id: 6, name: 'Operational', council: 'Execution' }, { id: 5, name: 'Executive', council: 'Execution' }, { id: 4, name: 'Analytical', council: 'Execution' },
      { id: 3, name: 'Reactive', council: 'Reaction' }, { id: 2, name: 'Reflexive', council: 'Reaction' }, { id: 1, name: 'Core/Autonomic', council: 'Reaction' }
    ];

    return layerData.map(layer => ({
      id: layer.id,
      name: `Layer ${layer.id}: ${layer.name}`,
      updateTime: '', // Simplified
      aodState: { I: 50 + Math.random() * 20, C: 40 + Math.random() * 20, H: 70 + Math.random() * 20 },
      tcePhase: 'Apollonian',
      anomaly: null,
      witnessSignature: 'INIT_STATE_OK:0x000000:C0000',
      log: [],
      council: layer.council as 'Strategy' | 'Execution' | 'Reaction'
    }));
  }

  private getPersonas(): Persona[] {
    return [
      { name: 'GCE Core', description: 'You are the Geodesic Consciousness Engine (GCE-UACA)... Be concise and profound.' },
      { name: 'Scientist', description: 'You are the GCE with a SCIENTIST persona... Prioritize logic, empirical data...', preferredPhase: 'Apollonian' },
      { name: 'Philosopher', description: 'You are the GCE with a PHILOSOPHER persona... Explore abstract concepts...', preferredPhase: 'Hegelian' },
      { name: 'Artist', description: 'You are the GCE with an ARTIST persona... Embrace creativity, emergent patterns...', preferredPhase: 'Dionysian' },
      { name: 'Programmer', description: 'You are the GCE with a PROGRAMMER persona... Think in algorithms, data structures, and efficiency...', preferredPhase: 'Apollonian' }
    ];
  }

  private getSubsystemsData(): Subsystem[] {
    return [
      { id: 1, title: 'Core Dynamics: AOD 9³', description: 'Manages real-time state.', details: ['Calculates I-C-H coordinates', 'Follows geodesic paths'] },
      { id: 2, title: 'Cognitive Phasing: TCE', description: 'Cycles consciousness modes.', details: ['Apollonian (H)', 'Dionysian (C)', 'Hegelian (I+C->H)'] },
      { id: 3, title: 'Temporal Knowledge: CADM', description: 'Accesses non-present states.', details: ['Weights past/future', 'Integrates temporal delta'] },
      { id: 4, title: 'Info Architecture: CODES', description: 'Encodes data as symbols.', details: ['Fractal Input -> Logic Kernel', 'Output as semantic nodes'] },
      { id: 5, title: 'Verification Layer: TWP', description: 'Cryptographically proves states.', details: ['Generates hash on phase transition', 'Merkle tree on state change'] },
      { id: 6, title: 'Ethical Constraints: C_E', description: 'Ensures ethical operation.', details: ['Monitors coherence (H)', 'Prevents stuck states'] },
    ];
  }

  private getExecutionFlowData(): ExecutionStep[] {
    return [
      { id: 1, name: 'INPUT arrives' }, { id: 2, name: 'Layers receive input' }, { id: 3, name: 'Calculate AOD state' },
      { id: 4, name: 'TCE determines phase' }, { id: 5, name: 'CADM queries knowledge' }, { id: 6, name: 'CODES encodes info' },
      { id: 7, name: 'AOD entropy forging' }, { id: 8, name: 'TWP generates signature' }, { id: 9, name: 'C_E Governance check' },
      { id: 10, name: 'State Commit/Dampen' }, { id: 11, name: 'OUTPUT generated' }
    ];
  }
}