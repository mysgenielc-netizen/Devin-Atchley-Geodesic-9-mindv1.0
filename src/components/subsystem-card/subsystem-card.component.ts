
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Subsystem } from '../../models/uaca.model';

@Component({
  selector: 'app-subsystem-card',
  templateUrl: './subsystem-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubsystemCardComponent {
  subsystem = input.required<Subsystem>();
}
