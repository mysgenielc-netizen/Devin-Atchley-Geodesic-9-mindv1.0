import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { SystemStateService } from '../../services/system-state.service';
import { GeminiChatService } from '../../services/gemini-chat.service';

@Component({
  selector: 'app-execution-detail-modal',
  templateUrl: './execution-detail-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// FIX: Replaced OnInit with an effect to reactively generate an explanation when the input signal changes.
export class ExecutionDetailModalComponent {
  systemState = inject(SystemStateService);
  geminiService = inject(GeminiChatService);

  step = this.systemState.selectedExecutionStep;
  explanation = signal<string>('');
  isLoading = signal(true);

  constructor() {
    effect(() => {
      this.generateExplanation();
    });
  }

  async generateExplanation(): Promise<void> {
    const currentStep = this.step();
    if (!currentStep) return;

    this.isLoading.set(true);
    const response = await this.geminiService.getExecutionStepExplanation(currentStep);
    this.explanation.set(response);
    this.isLoading.set(false);
  }

  close(): void {
    this.systemState.selectExecutionStep(null);
  }
}
