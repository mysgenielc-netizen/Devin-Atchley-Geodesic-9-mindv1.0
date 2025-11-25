import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ExecutionStep } from '../../models/uaca.model';
import { SystemStateService } from '../../services/system-state.service';

@Component({
  selector: 'app-execution-flow',
  templateUrl: './execution-flow.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExecutionFlowComponent {
  systemState = inject(SystemStateService);

  selectStep(stepId: number): void {
    // This action is only allowed when paused to prevent rapid modal changes.
    if (this.systemState.simulationStatus() === 'paused') {
      this.systemState.selectExecutionStep(stepId);
    }
  }
}