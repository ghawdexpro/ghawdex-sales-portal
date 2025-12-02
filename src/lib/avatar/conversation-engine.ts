/**
 * HeyGen Avatar Chat - Conversation Engine
 *
 * Orchestrates the conversation flow using Google Gemini (via OpenRouter)
 * with function calling capabilities for actions like sending links,
 * calculating quotes, and saving to CRM.
 */

import {
  ConversationMessage,
  ConversationPhase,
  ConversationState,
  FunctionCall,
  FunctionResult,
  AvatarSession,
  Tool,
} from './types';
import {
  GEMINI_CONFIG,
  SYSTEM_PROMPT,
  getToolsForPhase,
} from './config';
import { executeToolCall } from './tools';

// ============================================================================
// Conversation Engine
// ============================================================================

export class ConversationEngine {
  private session: AvatarSession;
  private conversationHistory: ConversationMessage[];
  private currentPhase: ConversationPhase;

  constructor(session: AvatarSession) {
    this.session = session;
    this.conversationHistory = session.conversation_history || [];
    this.currentPhase = session.current_phase || 'greeting';
  }

  /**
   * Process user input and generate avatar response
   */
  async processUserMessage(userMessage: string): Promise<{
    response: string;
    phase: ConversationPhase;
    functionCalls: FunctionResult[];
    shouldSpeak: boolean;
  }> {
    // Add user message to history
    const userMsg: ConversationMessage = {
      id: generateMessageId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      phase: this.currentPhase,
      spoken: false,
    };
    this.conversationHistory.push(userMsg);

    // Get available tools for current phase
    const availableTools = getToolsForPhase(this.currentPhase);

    // Build messages for LLM
    const messages = this.buildLLMMessages();

    // Call Gemini via OpenRouter
    const llmResponse = await this.callGemini(messages, availableTools);

    // Process any function calls
    const functionResults: FunctionResult[] = [];
    if (llmResponse.functionCalls && llmResponse.functionCalls.length > 0) {
      for (const call of llmResponse.functionCalls) {
        const result = await executeToolCall(call, this.session);
        functionResults.push(result);

        // Add function call to history
        const funcMsg: ConversationMessage = {
          id: generateMessageId(),
          role: 'function',
          content: `Called ${call.name}`,
          timestamp: new Date().toISOString(),
          phase: this.currentPhase,
          spoken: false,
          function_call: call,
          function_result: result,
        };
        this.conversationHistory.push(funcMsg);

        // Update phase based on function results
        this.updatePhaseFromResult(call.name, result);
      }
    }

    // Get the text response (may need another LLM call if functions were executed)
    let responseText = llmResponse.text;
    if (functionResults.length > 0 && !responseText) {
      // Call LLM again with function results to get response
      const followUpMessages = this.buildLLMMessages();
      const followUpResponse = await this.callGemini(followUpMessages, []);
      responseText = followUpResponse.text;
    }

    // Add assistant response to history
    const assistantMsg: ConversationMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString(),
      phase: this.currentPhase,
      spoken: true,
    };
    this.conversationHistory.push(assistantMsg);

    return {
      response: responseText,
      phase: this.currentPhase,
      functionCalls: functionResults,
      shouldSpeak: true,
    };
  }

  /**
   * Generate initial greeting based on context
   */
  async generateGreeting(): Promise<string> {
    const prefill = this.session.prefill_data;
    const name = prefill?.name || this.session.customer_name;

    let contextPrompt = 'Generate a warm greeting for a new customer visiting the GhawdeX solar consultation.';

    if (name) {
      contextPrompt = `Generate a warm, personalized greeting for ${name} who is returning via a pre-filled link from our sales team. They may already have some context about solar panels.`;
    }

    // Add system context for greeting
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: contextPrompt },
    ];

    const response = await this.callGemini(messages as LLMMessage[], []);

    // Add greeting to history
    const greetingMsg: ConversationMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: response.text,
      timestamp: new Date().toISOString(),
      phase: 'greeting',
      spoken: true,
    };
    this.conversationHistory.push(greetingMsg);

    return response.text;
  }

  /**
   * Handle silence (user hasn't responded)
   */
  async handleSilence(): Promise<string> {
    const lastAssistantMsg = this.conversationHistory
      .filter(m => m.role === 'assistant')
      .pop();

    const prompt = `The customer has been silent for a while. Generate a gentle follow-up based on the current conversation phase: ${this.currentPhase}. Last thing you said: "${lastAssistantMsg?.content || 'greeting'}". Keep it short and natural.`;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...this.conversationHistory.map(m => ({
        role: m.role === 'function' ? 'assistant' : m.role,
        content: m.role === 'function'
          ? `[Function ${m.function_call?.name} returned: ${JSON.stringify(m.function_result?.result)}]`
          : m.content,
      })),
      { role: 'user', content: prompt },
    ];

    const response = await this.callGemini(messages as LLMMessage[], []);
    return response.text;
  }

  /**
   * Handle external data received (location, bill, etc.)
   */
  async handleDataReceived(
    dataType: 'location' | 'bill' | 'document' | 'signature',
    data: unknown
  ): Promise<string> {
    // Update collected data based on type
    await this.updateCollectedData(dataType, data);

    // Generate response acknowledging the data
    const prompt = `The customer just submitted their ${dataType} data via the mobile link. Acknowledge receipt and explain what you found. Data: ${JSON.stringify(data)}`;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...this.conversationHistory.map(m => ({
        role: m.role === 'function' ? 'assistant' : m.role,
        content: m.content,
      })),
      { role: 'user', content: prompt },
    ];

    const response = await this.callGemini(messages as LLMMessage[], getToolsForPhase(this.currentPhase));

    // Update phase based on data received
    this.advancePhaseAfterData(dataType);

    return response.text;
  }

  /**
   * Get current conversation state
   */
  getState(): ConversationState {
    return {
      phase: this.currentPhase,
      collected_data: this.session.collected_data,
      pending_action: null, // Would be populated by session manager
      awaiting_user_input: !this.isWaitingPhase(),
      can_proceed: this.canProceedToNextPhase(),
      next_phase: this.getNextPhase(),
    };
  }

  /**
   * Get conversation history
   */
  getHistory(): ConversationMessage[] {
    return this.conversationHistory;
  }

  /**
   * Set current phase
   */
  setPhase(phase: ConversationPhase): void {
    this.currentPhase = phase;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private buildLLMMessages(): LLMMessage[] {
    const messages: LLMMessage[] = [
      { role: 'system', content: this.buildSystemPrompt() },
    ];

    // Add conversation history
    for (const msg of this.conversationHistory) {
      if (msg.role === 'function') {
        // Include function results as assistant messages
        messages.push({
          role: 'assistant',
          content: `[Called ${msg.function_call?.name}. Result: ${JSON.stringify(msg.function_result?.result)}]`,
        });
      } else if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return messages;
  }

  private buildSystemPrompt(): string {
    const collectedData = this.session.collected_data;
    const phase = this.currentPhase;

    let contextAddition = `\n\n## Current State
- Phase: ${phase}
- Customer name: ${collectedData.full_name || 'Unknown'}
- Phone: ${collectedData.phone || 'Not provided'}
`;

    if (collectedData.address) {
      contextAddition += `- Address: ${collectedData.address}\n`;
    }
    if (collectedData.location) {
      contextAddition += `- Location: ${collectedData.location} (${collectedData.location === 'gozo' ? 'Higher grants available!' : 'Malta'})\n`;
    }
    if (collectedData.consumption_kwh) {
      contextAddition += `- Monthly consumption: ${collectedData.consumption_kwh} kWh\n`;
    }
    if (collectedData.monthly_bill) {
      contextAddition += `- Monthly bill: €${collectedData.monthly_bill}\n`;
    }
    if (collectedData.selected_system) {
      contextAddition += `- Selected system: ${collectedData.selected_system.name} (${collectedData.selected_system.systemSizeKw}kW)\n`;
    }
    if (collectedData.with_battery && collectedData.selected_battery) {
      contextAddition += `- Battery: ${collectedData.selected_battery.name} (${collectedData.selected_battery.capacityKwh}kWh)\n`;
    }
    if (collectedData.total_price) {
      contextAddition += `- Total price: €${collectedData.total_price}\n`;
    }
    if (collectedData.annual_savings) {
      contextAddition += `- Annual savings: €${collectedData.annual_savings}\n`;
    }

    return SYSTEM_PROMPT + contextAddition;
  }

  private async callGemini(
    messages: LLMMessage[],
    tools: Tool[]
  ): Promise<{ text: string; functionCalls: FunctionCall[] | null }> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      return {
        text: "I'm having a technical issue. Let me connect you with our team.",
        functionCalls: null,
      };
    }

    try {
      const body: Record<string, unknown> = {
        model: GEMINI_CONFIG.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: GEMINI_CONFIG.max_tokens,
        temperature: GEMINI_CONFIG.temperature,
        top_p: GEMINI_CONFIG.top_p,
      };

      // Add tools if available
      if (tools.length > 0) {
        body.tools = tools.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        }));
        body.tool_choice = 'auto';
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://get.ghawdex.pro',
          'X-Title': 'GhawdeX Avatar Chat',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenRouter API error:', error);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      // Extract function calls if present
      let functionCalls: FunctionCall[] | null = null;
      if (choice?.message?.tool_calls) {
        functionCalls = choice.message.tool_calls.map((tc: ToolCallResponse) => ({
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        }));
      }

      return {
        text: choice?.message?.content || '',
        functionCalls,
      };
    } catch (error) {
      console.error('Error calling Gemini:', error);
      return {
        text: "I'm experiencing a brief technical issue. Could you repeat that?",
        functionCalls: null,
      };
    }
  }

  private updatePhaseFromResult(toolName: string, result: FunctionResult): void {
    if (!result.success) return;

    switch (toolName) {
      case 'send_location_link':
        this.currentPhase = 'waiting_location';
        break;
      case 'send_bill_upload_link':
        this.currentPhase = 'waiting_bill';
        break;
      case 'send_signature_link':
        this.currentPhase = 'waiting_signature';
        break;
      case 'create_human_task':
        this.currentPhase = 'human_handoff';
        break;
      case 'pause_session':
        this.currentPhase = 'paused';
        break;
      case 'save_to_crm':
        if (this.currentPhase === 'summary') {
          this.currentPhase = 'contract';
        }
        break;
    }
  }

  private async updateCollectedData(
    dataType: 'location' | 'bill' | 'document' | 'signature',
    data: unknown
  ): Promise<void> {
    const collected = this.session.collected_data;

    switch (dataType) {
      case 'location':
        const locData = data as { lat: number; lng: number; address: string };
        collected.coordinates = { lat: locData.lat, lng: locData.lng };
        collected.address = locData.address;
        collected.location = locData.lat >= 36.0 ? 'gozo' : 'malta';
        break;

      case 'bill':
        const billData = data as { consumption_kwh?: number; amount?: number };
        if (billData.consumption_kwh) {
          collected.consumption_kwh = billData.consumption_kwh;
        }
        if (billData.amount) {
          collected.monthly_bill = billData.amount;
        }
        break;

      case 'signature':
        // Contract signed - mark as completed
        this.currentPhase = 'completed';
        break;
    }
  }

  private advancePhaseAfterData(dataType: 'location' | 'bill' | 'document' | 'signature'): void {
    switch (dataType) {
      case 'location':
        this.currentPhase = 'bill';
        break;
      case 'bill':
        this.currentPhase = 'consumption';
        break;
      case 'signature':
        this.currentPhase = 'completed';
        break;
    }
  }

  private isWaitingPhase(): boolean {
    return ['waiting_location', 'waiting_bill', 'waiting_signature', 'paused'].includes(
      this.currentPhase
    );
  }

  private canProceedToNextPhase(): boolean {
    const data = this.session.collected_data;

    switch (this.currentPhase) {
      case 'greeting':
        return true;
      case 'location':
        return !!data.coordinates;
      case 'bill':
      case 'consumption':
        return !!data.consumption_kwh || !!data.monthly_bill;
      case 'system_selection':
        return !!data.selected_system;
      case 'financing':
        return !!data.payment_method;
      case 'contact':
        return !!data.full_name && !!data.phone;
      case 'summary':
        return true;
      default:
        return false;
    }
  }

  private getNextPhase(): ConversationPhase | null {
    const phases: ConversationPhase[] = [
      'greeting',
      'location',
      'bill',
      'consumption',
      'system_recommendation',
      'system_selection',
      'financing',
      'contact',
      'summary',
      'contract',
      'completed',
    ];

    const currentIndex = phases.indexOf(this.currentPhase);
    if (currentIndex >= 0 && currentIndex < phases.length - 1) {
      return phases[currentIndex + 1];
    }
    return null;
  }
}

// ============================================================================
// Helper Types
// ============================================================================

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ToolCallResponse {
  function: {
    name: string;
    arguments: string;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Dialogue Scripts (Phase-specific prompts)
// ============================================================================

export const PHASE_PROMPTS: Record<ConversationPhase, string> = {
  greeting: `Welcome the customer warmly. Introduce yourself as Hayden from GhawdeX. Explain you'll help them find the perfect solar solution in about 10 minutes. Ask if they're ready to get started.`,

  location: `Ask the customer for their property location. Explain you'll send a link to their phone so they can easily share their location. Ask for their phone number if you don't have it.`,

  waiting_location: `You've sent a location link. Let the customer know you're waiting for them to share their location. Offer to help if they have any issues.`,

  bill: `Now that you have the location, ask about their electricity bill. Explain you can either look at their bill directly (send a link for them to photograph it) or they can tell you their monthly bill amount.`,

  waiting_bill: `You've sent a bill upload link. Let the customer know you're waiting for them to share their electricity bill.`,

  consumption: `Based on their bill/consumption, calculate their needs. If they told you their bill amount, estimate their consumption. Explain what their current usage means for solar sizing.`,

  system_recommendation: `Based on their consumption and roof analysis, recommend an appropriate system. Explain why this system is right for them. Ask if they'd like to add battery storage.`,

  system_selection: `Help the customer finalize their system selection. Compare options if they're unsure. Discuss battery benefits if relevant.`,

  financing: `Discuss payment options. Explain cash vs BOV loan. If loan, present monthly payment options for different terms. Help them choose what works best.`,

  contact: `Ask for their contact details (name, email, phone if you don't have it). Explain this is for sending them the quote and coordinating installation.`,

  summary: `Summarize everything: system, price, savings, payback period. Ask if they have any questions. Explain next steps (site visit, contract signing).`,

  contract: `The customer is ready to proceed. Explain you'll send the contract for electronic signature. Describe what happens after they sign.`,

  waiting_signature: `You've sent the contract for signature. Let the customer know you're waiting for them to review and sign it. Offer to answer any questions about the contract.`,

  completed: `Thank the customer for choosing GhawdeX. Summarize next steps (site visit scheduling, installation timeline). Wish them well and offer to answer any final questions.`,

  paused: `The conversation is paused. If the customer returns, welcome them back and remind them where you left off.`,

  human_handoff: `You've created a task for a human team member to contact the customer. Let them know someone will reach out soon and thank them for their patience.`,
};
