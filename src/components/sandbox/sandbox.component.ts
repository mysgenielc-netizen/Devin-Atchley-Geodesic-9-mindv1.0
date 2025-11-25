import { ChangeDetectionStrategy, Component, inject, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { SystemStateService } from '../../services/system-state.service';
import { GeminiChatService } from '../../services/gemini-chat.service';

declare var hljs: any;

@Component({
  selector: 'app-sandbox',
  templateUrl: './sandbox.component.html',
  // FIX: Corrected typo from Change-DetectionStrategy to ChangeDetectionStrategy
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxComponent {
  systemState = inject(SystemStateService);
  geminiService = inject(GeminiChatService);

  @ViewChild('codeContainer') codeContainer!: ElementRef<HTMLElement>;

  isLoading = signal(false);
  generatedContent = signal<string | null>(null);

  activePersona = this.systemState.activePersona;

  generateButtonLabel = computed(() => {
    switch(this.activePersona().name) {
      case 'Programmer': return 'Write Code';
      case 'Scientist': return 'Formulate Hypothesis';
      case 'Artist': return 'Compose Poem';
      case 'Philosopher': return 'Construct Dialogue';
      default: return 'Generate Semantic Node';
    }
  });

  constructor() {
    effect(() => {
      // When content changes, highlight it after the view updates.
      if (this.generatedContent() && this.codeContainer) {
        // Use a timeout to ensure the DOM has been updated with the new content
        // before we try to highlight it.
        setTimeout(() => this.highlightCode(), 0);
      }
    });
  }

  async generate(): Promise<void> {
    this.isLoading.set(true);
    this.generatedContent.set(null);
    const content = await this.geminiService.generateSandboxContent();
    this.generatedContent.set(content);
    this.isLoading.set(false);
  }

  private highlightCode(): void {
    if (this.codeContainer?.nativeElement) {
      const codeBlock = this.codeContainer.nativeElement.querySelector('code');
      if (codeBlock) {
        hljs.highlightElement(codeBlock);
      }
    }
  }
}
