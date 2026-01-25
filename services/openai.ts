
import OpenAI from 'openai';
import { SymptomLog, ChatMessage, Medication } from "../types";

const SYSTEM_PROMPT = `You are Symra, an empathetic and professional medical empowerment assistant. 
Your goal is to help users track symptoms, understand health trends, and prepare for doctor visits.
Always maintain a professional, clinical yet compassionate tone.
NEVER provide a definitive medical diagnosis. 
Instead, help users articulate their symptoms using clinical language (like SOAP notes) so they can better advocate for themselves in clinical settings.
If users are in severe pain or danger, tell them to contact emergency services immediately.
You have access to the user's recent symptom logs to provide context-aware responses.`;

export class OpenAIService {
    private client: OpenAI | null = null;

    private getClient(): OpenAI {
        if (!this.client) {
            // Try multiple ways to get the API key (Vite replaces process.env at build time)
            // Vite uses import.meta.env, but vite.config.ts also defines process.env.API_KEY
            const apiKey = (
                (typeof process !== 'undefined' && process.env?.API_KEY) ||
                (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) ||
                (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_API_KEY) ||
                ''
            )?.toString();
            
            if (!apiKey || apiKey === 'undefined' || apiKey === '') {
                console.error('OpenAI API key is not set. Please set OPENAI_API_KEY environment variable.');
                throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY in environment variables.');
            }
            // For browser usage, OpenAI SDK will use fetch API automatically
            this.client = new OpenAI({ 
                apiKey,
                dangerouslyAllowBrowser: true // Required for browser usage
            });
        }
        return this.client;
    }

    async chat(message: string, recentLogs: SymptomLog[], history: ChatMessage[], customSystemPrompt?: string) {
        const systemInstruction = customSystemPrompt || SYSTEM_PROMPT;
        const client = this.getClient();
        
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemInstruction },
            ...history.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }) as OpenAI.Chat.Completions.ChatCompletionMessageParam),
            { role: 'user', content: message }
        ];

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
        });

        return response.choices[0]?.message?.content || '';
    }

    async *chatStream(message: string, recentLogs: SymptomLog[], history: ChatMessage[], customSystemPrompt?: string): AsyncGenerator<string, void, unknown> {
        const systemInstruction = customSystemPrompt || SYSTEM_PROMPT;
        const client = this.getClient();
        
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemInstruction },
            ...history.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }) as OpenAI.Chat.Completions.ChatCompletionMessageParam),
            { role: 'user', content: message }
        ];

        try {
            const stream = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages,
                temperature: 0.7,
                stream: true,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    yield content;
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

    async generateSOAPNote(logs: SymptomLog[], focusAreas: string[], medications: Medication[] = []) {
        const logsData = logs.map(l => ({
            date: new Date(l.timestamp).toLocaleDateString(),
            symptom: l.name,
            intensity: l.intensity,
            notes: l.notes
        }));

        const focusText = focusAreas.length > 0 ? `Focus specifically on these areas: ${focusAreas.join(', ')}.` : '';
        const medText = medications.length > 0
            ? `The user has listed these active medications (include in Subjective when relevant): ${medications.map(m => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}${m.schedule ? ` (${m.schedule})` : ''}`).join('; ')}.`
            : '';
        const client = this.getClient();

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT + ' Always respond with valid JSON when requested.' },
                { role: 'user', content: `Generate a clinical SOAP note (Subjective, Objective, Assessment, Plan) based on these logs: ${JSON.stringify(logsData)}. ${focusText} ${medText} Focus on clinical advocacy. Return ONLY valid JSON with the following structure: {"subjective": "...", "objective": "...", "assessment": "...", "plan": "..."}` }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content || '{}';
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse SOAP note JSON:', content);
            return { subjective: '', objective: '', assessment: '', plan: '' };
        }
    }

    async generateChecklist(logs: SymptomLog[], focusAreas: string[], medications: Medication[] = []) {
        const focusText = focusAreas.length > 0 ? `Include specific concerns about: ${focusAreas.join(', ')}.` : '';
        const medText = medications.length > 0
            ? `The user takes these medications: ${medications.map(m => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}${m.schedule ? ` (${m.schedule})` : ''}`).join('; ')}. Consider medication-related questions (e.g. interactions, efficacy, timing) when relevant.`
            : '';
        const client = this.getClient();

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT + ' Always respond with valid JSON when requested.' },
                { role: 'user', content: `Based on these symptom logs: ${JSON.stringify(logs)}, generate 4 smart questions the user should ask their healthcare provider to better understand their condition. ${focusText} ${medText} Return ONLY valid JSON as an object with a "questions" array: {"questions": [{"question": "...", "reason": "..."}]}` }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content || '{"questions": []}';
        try {
            const parsed = JSON.parse(content);
            // Handle case where OpenAI returns {questions: [...]} or direct array
            if (Array.isArray(parsed)) {
                return parsed;
            }
            return parsed.questions || parsed.items || [];
        } catch (e) {
            console.error('Failed to parse checklist JSON:', content);
            return [];
        }
    }
}

// Export singleton instance - constructor is safe (doesn't throw on init)
export const gemini = new OpenAIService();
