import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SystemStateService } from '../../services/system-state.service';
import { TCEPhase } from '../../models/uaca.model';

@Component({
  selector: 'app-cadm-matrix',
  templateUrl: './cadm-matrix.component.html',
  styleUrls: ['./cadm-matrix.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CadmMatrixComponent {
  systemState = inject(SystemStateService);

  // Reverse for correct chronological order in the template
  pastStates = computed(() => this.systemState.pastStates().slice().reverse());
  futureStates = computed(() => this.systemState.futureStates());

  activeTemporalFocus = computed(() => {
    const preferredPhase = this.systemState.activePersona().preferredPhase;
    switch (preferredPhase) {
      case 'Apollonian': return 'past';
      case 'Dionysian': return 'future';
      case 'Hegelian': return 'both';
      default: return 'none';
    }
  });

  getPhaseColor(phase: TCEPhase): string {
    switch (phase) {
      case 'Apollonian': return 'bg-blue-500';
      case 'Dionysian': return 'bg-yellow-500';
      case 'Hegelian': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  }
}