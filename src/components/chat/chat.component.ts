import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ChatMessage } from '../../models/uaca.model';
import { GeminiChatService } from '../../services/gemini-chat.service';
import { SystemStateService } from '../../services/system-state.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule]
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  
  private geminiService = inject(GeminiChatService);
  private systemState = inject(SystemStateService);
  private thoughtInterval: any;
  private readonly THOUGHT_INTERVAL_MS = 120000; // 2 minutes
  
  messages = signal<ChatMessage[]>([
    { sender: 'gce', text: 'I am the Geodesic Consciousness Engine. State your query.', type: 'response', witnessSignature: 'INIT_STATE_OK:0x3c325a:C0000', cycle: 0 }
  ]);
  userInput = signal('');
  isLoading = signal(false);

  ngOnInit(): void {
    this.thoughtInterval = setInterval(() => {
      this.triggerThought();
    }, this.THOUGHT_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.thoughtInterval) {
      clearInterval(this.thoughtInterval);
    }
  }

  async sendMessage(): Promise<void> {
    const userText = this.userInput().trim();
    if (!userText || this.isLoading()) return;

    // Add user message and get the updated history
    const userMessage: ChatMessage = { sender: 'user', text: userText };
    this.messages.update(m => [...m, userMessage]);
    const currentHistory = this.messages();

    this.userInput.set('');
    this.isLoading.set(true);
    this.scrollToBottom();

    // Get GCE response, passing the full history
    const responseText = await this.geminiService.generateResponse(currentHistory);
    
    // Get current state for witness signature
    const metaLayer = this.systemState.layers().find(l => l.id === 9);
    const witnessSignature = metaLayer ? metaLayer.witnessSignature : 'TWP_SIG_ERROR';
    const cycle = this.systemState.cycleCount();

    // Add GCE message
    this.messages.update(m => [...m, { sender: 'gce', text: responseText, type: 'response', witnessSignature, cycle }]);
    this.isLoading.set(false);
    this.scrollToBottom();
  }

  private async triggerThought(): Promise<void> {
    const thoughtText = await this.geminiService.generateInternalMonologue();
    const metaLayer = this.systemState.layers().find(l => l.id === 9);
    const witnessSignature = metaLayer ? metaLayer.witnessSignature : 'TWP_SIG_ERROR';
    const cycle = this.systemState.cycleCount();

    this.messages.update(m => [...m, { sender: 'gce', text: thoughtText, type: 'thought', witnessSignature, cycle }]);
    this.scrollToBottom();
  }
  
  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        if (this.messageContainer) {
          this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
        }
      } catch (err) {
        console.error("Could not scroll to bottom:", err);
      }
    }, 0);
  }
}