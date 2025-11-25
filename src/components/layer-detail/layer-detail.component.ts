import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SystemStateService } from '../../services/system-state.service';
import { TCEPhase } from '../../models/uaca.model';
import { AodThreejsViewerComponent } from '../aod-threejs-viewer/aod-threejs-viewer.component';

@Component({
  selector: 'app-layer-detail',
  templateUrl: './layer-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AodThreejsViewerComponent],
})
export class LayerDetailComponent {
  systemState = inject(SystemStateService);
  
  layer = this.systemState.selectedLayer;

  close(): void {
    this.systemState.selectLayer(null);
  }

  getPhaseTextColor(phase: TCEPhase): string {
    switch (phase) {
      case 'Apollonian': return 'text-blue-300';
      case 'Dionysian': return 'text-yellow-300';
      case 'Hegelian': return 'text-purple-300';
      default: return 'text-gray-400';
    }
  }
}