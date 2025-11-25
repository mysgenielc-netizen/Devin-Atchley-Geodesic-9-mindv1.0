import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SystemStateService } from '../../services/system-state.service';
import { NineFoldMindComponent } from '../nine-fold-mind/nine-fold-mind.component';
import { SubsystemCardComponent } from '../subsystem-card/subsystem-card.component';
import { ExecutionFlowComponent } from '../execution-flow/execution-flow.component';
import { ChatComponent } from '../chat/chat.component';
import { LayerDetailComponent } from '../layer-detail/layer-detail.component';
import { SimulationControlsComponent } from '../simulation-controls/simulation-controls.component';
import { ExecutionDetailModalComponent } from '../execution-detail-modal/execution-detail-modal.component';
import { PersonaSelectorComponent } from '../persona-selector/persona-selector.component';
import { SandboxComponent } from '../sandbox/sandbox.component';
import { CadmMatrixComponent } from '../cadm-matrix/cadm-matrix.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NineFoldMindComponent, 
    SubsystemCardComponent, 
    ExecutionFlowComponent, 
    ChatComponent, 
    LayerDetailComponent, 
    SimulationControlsComponent, 
    ExecutionDetailModalComponent, 
    PersonaSelectorComponent,
    SandboxComponent,
    CadmMatrixComponent
  ]
})
export class DashboardComponent {
  systemState = inject(SystemStateService);
}