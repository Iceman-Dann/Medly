
import { GoogleGenAI, Type } from "@google/genai";
import { SymptomLog, ChatMessage } from "../types";

const SYSTEM_PROMPT = `You are Symra, an empathetic and professional medical empowerment assistant. 
Your goal is to help users track symptoms, understand health trends, and prepare for doctor visits.
Always maintain a professional, clinical yet compassionate tone.
NEVER provide a definitive medical diagnosis. 
Instead, help users articulate their symptoms using clinical language (like SOAP notes) so they can better advocate for themselves in clinical settings.
If users are in severe pain or danger, tell them to contact emergency services immediately.
You have access to the user's recent symptom logs to provide context-aware responses.`;

export class GeminiService {
    private ai: GoogleGenAI;

    constructor() {
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }

    async chat(message: string, recentLogs: SymptomLog[], history: ChatMessage[]) {
        const contextString = recentLogs.length > 0 
            ? `User's recent history: ${recentLogs.map(l => `${new Date(l.timestamp).toLocaleDateString()}: ${l.name} (Intensity: ${l.intensity}/10) - ${l.notes}`).join('; ')}`
            : "User has no recent logs.";

        const historyContents = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const response = await this.ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                ...historyContents,
                { role: 'user', parts: [{ text: `${contextString}\n\nUser: ${message}` }] }
            ],
            config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: 0.7,
            }
        });

        return response.text;
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
            model: 'gemini-3-flash-preview',
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
            model: 'gemini-3-flash-preview',
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
