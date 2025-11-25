import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LayerState, TCEPhase } from '../../models/uaca.model';
import { SystemStateService } from '../../services/system-state.service';

@Component({
  selector: 'app-nine-fold-mind',
  templateUrl: './nine-fold-mind.component.html',
  styleUrls: ['./nine-fold-mind.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NineFoldMindComponent {
  layers = input.required<LayerState[]>();
  private systemState = inject(SystemStateService);
  selectedLayerId = this.systemState.selectedLayerId;

  councilOrder: ('Strategy' | 'Execution' | 'Reaction')[] = ['Strategy', 'Execution', 'Reaction'];

  councils = computed(() => {
    return this.layers().reduce((acc, layer) => {
      if (!acc[layer.council]) {
        acc[layer.council] = [];
      }
      acc[layer.council].push(layer);
      // Sort layers within council by ID descending
      acc[layer.council].sort((a, b) => b.id - a.id);
      return acc;
    }, {} as Record<'Strategy' | 'Execution' | 'Reaction', LayerState[]>);
  });

  selectLayer(layerId: number): void {
    if (this.selectedLayerId() === layerId) {
      this.systemState.selectLayer(null);
    } else {
      this.systemState.selectLayer(layerId);
    }
  }

  getPhaseColor(phase: TCEPhase): string {
    switch (phase) {
      case 'Apollonian': return 'border-blue-500/50';
      case 'Dionysian': return 'border-yellow-500/50';
      case 'Hegelian': return 'border-purple-500/50';
      default: return 'border-gray-600/50';
    }
  }
}