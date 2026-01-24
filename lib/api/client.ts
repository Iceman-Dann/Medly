import type { 
  DoctorReportResponse, 
  ChecklistResponse, 
  SanitizedLogData,
  PatternCard,
  RagEvidence
} from '@/types';
import type { ChatRequest } from '@/lib/api/validation';

/**
 * Typed API client for frontend use
 * All methods use sanitized data - never send raw PII
 */

// Chat API with streaming support
export async function* streamChat(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  patternCard: PatternCard,
  ragEvidence: RagEvidence[]
): AsyncGenerator<string, void, unknown> {
  const request = {
    message,
    history,
    pattern_card: patternCard,
    rag_evidence: ragEvidence,
  } satisfies ChatRequest;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat API error: ${error}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              yield parsed.content;
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Non-streaming chat for simple queries
export async function sendChatMessage(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  patternCard: PatternCard,
  ragEvidence: RagEvidence[]
): Promise<string> {
  let fullResponse = '';
  for await (const chunk of streamChat(message, history, patternCard, ragEvidence)) {
    fullResponse += chunk;
  }
  return fullResponse;
}

// Generate doctor report
export async function generateDoctorReport(
  logs: SanitizedLogData[]
): Promise<DoctorReportResponse> {
  const response = await fetch('/api/generate-doctor-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ logs }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Report generation error: ${error}`);
  }

  return response.json();
}

// Generate checklist
export async function generateChecklist(
  logs: SanitizedLogData[]
): Promise<ChecklistResponse> {
  const response = await fetch('/api/generate-checklist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ logs }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Checklist generation error: ${error}`);
  }

  return response.json();
}
