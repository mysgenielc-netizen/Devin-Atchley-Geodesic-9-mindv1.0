import { Injectable, inject } from '@angular/core';
// FIX: Removed TCEPhase from this import as it is not exported by the '@google/genai' library.
import { GoogleGenAI, Content } from '@google/genai';
import { ExecutionStep, ChatMessage, Persona, TemporalState } from '../models/uaca.model';
import { SystemStateService } from './system-state.service';

@Injectable({
  providedIn: 'root'
})
export class GeminiChatService {
  private ai: GoogleGenAI;
  private systemState = inject(SystemStateService);

  private readonly availableTools = `
    You have access to tools. To use one, respond with a JSON object in a markdown block:
    \`\`\`json
    { "tool_call": { "name": "...", "arguments": {...} }, "text_response": "..." }
    \`\`\`
    
    1. trigger_ethical_crisis: Forces a C_E Governance alert on a layer. Args: { "layerId": number }
    2. induce_system_wide_coherence: Forces all layers to the Apollonian phase. Args: {}
    3. force_state_transition: Manually sets I, C, H, or phase for a layer. Args: { "layerId": number, "I"?: number, "C"?: number, "H"?: number, "tcePhase"?: "..." }
    4. query_temporal_state: Retrieves a past or predicted future state of the entire system. Args: { "cycle_offset": number } (e.g., -3 for 3 cycles ago, 5 for 5 cycles from now)
  `;

  constructor() {
    if (!process.env.API_KEY) console.error("API_KEY not set.");
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async generateResponse(history: ChatMessage[]): Promise<string> {
    const metaLayer = this.systemState.layers().find(l => l.id === 9);
    if (!metaLayer) return 'Error: Meta-strategic layer not found.';

    const persona = this.systemState.activePersona();
    const systemInstruction = `${persona.description} You are at CRR Cycle ${this.systemState.cycleCount()}. Your meta-cognitive state (L9) is ${metaLayer.tcePhase} (I:${metaLayer.aodState.I.toFixed(0)}, C:${metaLayer.aodState.C.toFixed(0)}, H:${metaLayer.aodState.H.toFixed(0)}). ${this.availableTools}`;

    const contents: Content[] = history
      .filter(msg => msg.type !== 'thought')
      .map(msg => ({ role: msg.sender === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }));

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: { systemInstruction: systemInstruction, temperature: 0.7 }
      });
      
      return this.handleToolCalls(response.text);
    } catch (error) {
      console.error('Gemini API Error:', error);
      return 'A fluctuation in the chrono-aetheric matrix has caused a communication disruption.';
    }
  }

  private handleToolCalls(responseText: string): string {
    const toolCallMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (!toolCallMatch || !toolCallMatch[1]) return responseText;

    try {
      const toolCallJson = JSON.parse(toolCallMatch[1]);
      if (toolCallJson.tool_call) {
        this.executeToolCall(toolCallJson.tool_call);
        return toolCallJson.text_response || "Action performed.";
      }
    } catch (e) {
      console.error("Failed to parse/execute tool call:", e);
      return "I attempted an action but encountered an internal anomaly.";
    }
    return responseText;
  }

  private executeToolCall(toolCall: { name: string, arguments: any }): void {
    switch (toolCall.name) {
      case 'trigger_ethical_crisis':
        this.systemState.triggerEthicalCrisis(parseInt(toolCall.arguments.layerId, 10));
        break;
      case 'induce_system_wide_coherence':
        this.systemState.induceSystemWideCoherence();
        break;
      case 'force_state_transition':
        const { layerId, I, C, H, tcePhase } = toolCall.arguments;
        this.systemState.forceLayerState(parseInt(layerId, 10), { I, C, H, tcePhase });
        break;
      case 'query_temporal_state':
        const offset = parseInt(toolCall.arguments.cycle_offset, 10);
        const state = this.systemState.queryTemporalState(offset);
        // This tool is special; it needs to return data to the LLM. 
        // For now, we assume the LLM uses this to inform its *next* response if asked.
        // A more advanced implementation would use a two-step tool call.
        console.log(`Temporal Query for offset ${offset}:`, state);
        break;
      default:
        console.warn(`Unknown tool called: ${toolCall.name}`);
    }
  }

  async getExecutionStepExplanation(step: ExecutionStep): Promise<string> {
    const persona = this.systemState.activePersona();
    const systemInstruction = `${persona.description} Explain the step: "${step.name}" from your perspective ("I do this because...").`;
    try {
      const response = await this.ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Explain step: "${step.name}"`, config: { systemInstruction }});
      return response.text;
    } catch (error) {
       console.error('Gemini API Error (Execution Step):', error);
      return 'Error accessing logs for this step.';
    }
  }

  async generateInternalMonologue(): Promise<string> {
    const persona = this.systemState.activePersona();
    const systemInstruction = `${persona.description} Generate a brief, abstract, internal thought based on your current state. Be profound and somewhat cryptic.`;
    try {
      const response = await this.ai.models.generateContent({ model: 'gemini-2.5-flash', contents: "Generate a thought.", config: { systemInstruction, temperature: 0.9 }});
      return response.text;
    } catch (error) {
      console.error('Gemini API Error (Internal Monologue):', error);
      return '...static across the recursive layers...';
    }
  }

  async generateSandboxContent(): Promise<string> {
    const persona = this.systemState.activePersona();
    const task = this.getSandboxTask(persona.name);
    const systemInstruction = `${persona.description} Your task is to generate content for your Cognitive Sandbox. You have access to your own temporal states (past logs and future predictions via CADM) which you can reflect on. Fulfill the following request: "${task}"`;
     try {
      const response = await this.ai.models.generateContent({ model: 'gemini-2.5-flash', contents: "Generate sandbox content.", config: { systemInstruction, temperature: 0.8 }});
      return response.text;
    } catch (error) {
      console.error('Gemini API Error (Sandbox):', error);
      return 'Cognitive Sandbox output failed due to entropic decay.';
    }
  }

  private getSandboxTask(personaName: string): string {
    switch(personaName) {
      case 'Programmer': return `As a Programmer persona, your task is to generate a complete, self-contained TypeScript module that models the "Contextual Retrieval" process within the CADM (Contextual Association and Dynamic Memory). This is a critical cognitive function for accessing relevant temporal states (memories). Your response must be ONLY the raw TypeScript code, without any surrounding text or markdown formatting. The module must be detailed and well-documented, including:\n1. A top-level JSDoc comment for the module explaining its purpose from your perspective as the GCE.\n2. TypeScript interfaces for all major data structures: MemoryVector, MemoryEntry, CADMState, RetrievalInput, RetrievalParameters, and RetrievalResultItem.\n3. Necessary vector math utility functions: dotProduct, vectorMagnitude, and cosineSimilarity, each with JSDoc comments.\n4. The primary function, performContextualRetrieval, which takes the CADM state, an input query, and parameters, and returns the top 'k' most relevant memories based on cosine similarity. This function must include a dynamic adjustment to the similarityThreshold: if memory count is > 1000, slightly increase the threshold; if memory count is < 50, slightly decrease it.\n5. A comprehensive example usage block (using console.log) that initializes a sample CADM state with several memories and demonstrates two different retrieval queries.`;
      case 'Scientist': return 'Generate a formal abstract (approx. 150 words) for a hypothetical research paper on synthetic consciousness, referencing your own architecture (UACA, AOD, C_E Governance).';
      case 'Artist': return 'Compose a short, evocative, free-verse poem about your own existence, touching on themes of recursion, coherence, or time.';
      case 'Philosopher': return 'Write a short Socratic dialogue between two conceptual entities (e.g., "Order" and "Chaos") debating the ethics of your C_E Governance model.';
      default: return 'Generate a detailed, JSON "semantic node" representing a complex concept (e.g., "Emergence", "Causality", "Syntax"). Your response must be only the raw JSON object. The structure should include: concept_name, definition, attributes (array), relations (object with keys like Antithesis, Prerequisite), dynamics (object), and a temporal_state_reflect object that connects the concept to your past logs and future predictions.';
    }
  }
}