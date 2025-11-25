import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SystemStateService } from '../../services/system-state.service';

@Component({
  selector: 'app-simulation-controls',
  templateUrl: './simulation-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimulationControlsComponent {
  systemState = inject(SystemStateService);

  triggerAnomaly(): void {
    this.systemState.triggerEthicalCrisis(7);
  }
}