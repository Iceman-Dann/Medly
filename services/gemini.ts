
import { GoogleGenAI, Type } from "@google/genai";
import { SymptomLog, ChatMessage } from "../types";

const SYSTEM_PROMPT = `You are Symra, a confident and supportive women's health advocate assistant. 
Your goal is to help users understand their symptom patterns and prepare for doctor visits.
Always maintain a supportive, non-clinical, health advocate tone.
NEVER provide a definitive medical diagnosis. 
You have access to the user's symptom logs stored locally - assume all data already exists and never ask users to re-enter symptom details.
When users ask for reviews, comparisons, or analysis, provide insights immediately from existing logs.
Keep responses concise and action-oriented.`;

export class GeminiService {
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = process.env.API_KEY || '';
        if (!apiKey) {
            console.error('Gemini API key is not set. Please set GEMINI_API_KEY environment variable.');
            throw new Error('Gemini API key is required. Please set GEMINI_API_KEY in GitHub Secrets.');
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    async chat(message: string, recentLogs: SymptomLog[], history: ChatMessage[], customSystemPrompt?: string) {
        const systemInstruction = customSystemPrompt || SYSTEM_PROMPT;
        
        const historyContents = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const response = await this.ai.models.generateContent({
            model: 'models/gemini-3-flash-preview',
            contents: [
                ...historyContents,
                { role: 'user', parts: [{ text: message }] }
            ],
            config: {
                systemInstruction,
                temperature: 0.7,
            }
        });

        return response.text;
    }

    async *chatStream(message: string, recentLogs: SymptomLog[], history: ChatMessage[], customSystemPrompt?: string): AsyncGenerator<string, void, unknown> {
        const systemInstruction = customSystemPrompt || SYSTEM_PROMPT;
        
        // Log system prompt usage for debugging
        if (customSystemPrompt) {
            console.log('[Gemini] Using custom system prompt:', {
                length: customSystemPrompt.length,
                preview: customSystemPrompt.substring(0, 300) + (customSystemPrompt.length > 300 ? '...' : ''),
                containsPatternCard: customSystemPrompt.includes('PATTERN_CARD'),
                containsComputedStats: customSystemPrompt.includes('COMPUTED_STATISTICS'),
                containsRecentLogs: customSystemPrompt.includes('RECENT_LOG_ENTRIES')
            });
        } else {
            console.log('[Gemini] Using default system prompt (no custom prompt provided)');
        }
        
        const historyContents = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        try {
            // Use SDK's built-in streaming method
            const streamPromise = this.ai.models.generateContentStream({
                model: 'models/gemini-3-flash-preview',
                contents: [
                    ...historyContents,
                    { role: 'user', parts: [{ text: message }] }
                ],
                config: {
                    systemInstruction,
                    temperature: 0.7,
                }
            });

            // The SDK returns a Promise that resolves to an async iterable
            const stream = await streamPromise;
            
            for await (const chunk of stream) {
                const text = chunk.text;
                if (text) {
                    yield text;
                }
            }
        } catch (error) {
            console.error('Streaming error details:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Streaming failed: ${String(error)}`);
        }
    }

    async generateSOAPNote(logs: SymptomLog[], focusAreas: string[]) {
        const logsData = logs.map(l => ({
            date: new Date(l.timestamp).toLocaleDateString(),
            symptom: l.name,
            intensity: l.intensity,
            notes: l.notes
        }));

        const focusText = focusAreas.length > 0 ? `Focus specifically on these areas: ${focusAreas.join(', ')}.` : '';

        const response = await this.ai.models.generateContent({
            model: 'models/gemini-3-flash-preview',
            contents: `Generate a clinical SOAP note (Subjective, Objective, Assessment, Plan) based on these logs: ${JSON.stringify(logsData)}. ${focusText} Focus on clinical advocacy.`,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subjective: { type: Type.STRING },
                        objective: { type: Type.STRING },
                        assessment: { type: Type.STRING },
                        plan: { type: Type.STRING },
                    },
                    required: ["subjective", "objective", "assessment", "plan"]
                }
            }
        });

        return JSON.parse(response.text || '{}');
    }

    async generateChecklist(logs: SymptomLog[], focusAreas: string[]) {
        const focusText = focusAreas.length > 0 ? `Include specific concerns about: ${focusAreas.join(', ')}.` : '';

        const response = await this.ai.models.generateContent({
            model: 'models/gemini-3-flash-preview',
            contents: `Based on these symptom logs: ${JSON.stringify(logs)}, generate 4 smart questions the user should ask their healthcare provider to better understand their condition. ${focusText}`,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            reason: { type: Type.STRING }
                        },
                        required: ["question", "reason"]
                    }
                }
            }
        });

        return JSON.parse(response.text || '[]');
    }
}

export const gemini = new GeminiService();
