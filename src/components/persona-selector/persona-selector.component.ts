import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SystemStateService } from '../../services/system-state.service';

@Component({
  selector: 'app-persona-selector',
  templateUrl: './persona-selector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonaSelectorComponent {
  systemState = inject(SystemStateService);

  selectPersona(personaName: string): void {
    this.systemState.setPersona(personaName);
  }
}
