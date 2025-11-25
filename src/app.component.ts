
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  template: `<app-dashboard></app-dashboard>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DashboardComponent]
})
export class AppComponent {}
