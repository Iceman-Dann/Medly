
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
            model: 'gemini-3-flash-preview',
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

    async generateSOAPNote(logs: SymptomLog[], focusAreas: string[]) {
        const logsData = logs.map(l => ({
            date: new Date(l.timestamp).toLocaleDateString(),
            symptom: l.name,
            intensity: l.intensity,
            notes: l.notes
        }));

        const symptomMap = new Map<string, { count: number; totalSeverity: number; intensities: number[] }>();
        
        logs.forEach(log => {
            const existing = symptomMap.get(log.name) || { count: 0, totalSeverity: 0, intensities: [] };
            existing.count += 1;
            existing.totalSeverity += log.intensity;
            existing.intensities.push(log.intensity);
            symptomMap.set(log.name, existing);
        });

        const patterns: Array<{ symptom: string; frequency: number; avgSeverity: number; minSeverity: number; maxSeverity: number }> = [];
        
        symptomMap.forEach((data, symptom) => {
            patterns.push({
                symptom,
                frequency: data.count,
                avgSeverity: Math.round((data.totalSeverity / data.count) * 10) / 10,
                minSeverity: Math.min(...data.intensities),
                maxSeverity: Math.max(...data.intensities)
            });
        });

        const sortedPatterns = patterns.sort((a, b) => b.frequency - a.frequency);
        const patternSummary = sortedPatterns.map(p => 
            `${p.symptom}: ${p.frequency} occurrence${p.frequency !== 1 ? 's' : ''}, Avg severity ${p.avgSeverity}/10 (Range: ${p.minSeverity}-${p.maxSeverity}/10)`
        ).join('\n');

        const focusText = focusAreas.length > 0 ? `Focus specifically on these areas: ${focusAreas.join(', ')}.` : '';

        const response = await this.ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a clinical SOAP note with ONLY Subjective and Objective sections (NO Assessment or Plan) based on these logs: ${JSON.stringify(logsData)}. ${focusText} Focus on clinical advocacy.

Include in the Objective section a pattern summary with:
- Total number of logs: ${logs.length}
- Symptom frequency and severity data:
${patternSummary}

The Objective section should include both clinical observations AND this quantitative pattern data.`,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subjective: { type: Type.STRING },
                        objective: { type: Type.STRING },
                    },
                    required: ["subjective", "objective"]
                }
            }
        });

        const parsed = JSON.parse(response.text || '{}');
        
        return {
            subjective: parsed.subjective || '',
            objective: parsed.objective || '',
            assessment: '',
            plan: ''
        };
    }

    async generateChecklist(logs: SymptomLog[], focusAreas: string[]) {
        const logsData = logs.map(l => ({
            date: new Date(l.timestamp).toLocaleDateString(),
            symptom: l.name,
            intensity: l.intensity,
            notes: l.notes,
            category: l.category
        }));

        const focusText = focusAreas.length > 0 ? `Focus specifically on these areas: ${focusAreas.join(', ')}.` : '';

        const response = await this.ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Based on these symptom logs: ${JSON.stringify(logsData)}, generate 4-5 smart questions the user should ask their healthcare provider. ${focusText}
You are a Patient Advocate specialized in Women’s Health. Your goal is to analyze the provided symptom logs and generate 4-5 "Bridge Questions" that help the user speak confidently to their doctor.

### THE BRIDGE FORMULA
Every question must feel natural, not scripted. Use this 3-part structure:
1. **The Fact (Observation):** Use the user's data (e.g., "I've logged this symptom 4 times this week...").
2. **The Impact (The 'Why it Matters'):** Describe how this affects their life in human terms. Use "Functional Milestones" like: "I’m missing work," "I can't play with my kids," "I’m losing sleep," or "I’m worried this isn’t normal." 
3. **The Ask (The Clinically-Relevant Question):** End with a direct question. Use medical terms ONLY to point toward a path (e.g., "could we check my iron?" or "should we do an ultrasound?").

### TONE & STYLE CONSTRAINTS:
- **Vulnerability Over Jargon:** Swap "quality of life" for "my daily routine." Swap "exacerbate" for "make it worse."
- **First-Person Voice:** Always write in the "I" voice (e.g., "I've noticed..." not "The logs show...").
- **No Diagnosis:** Do not say "You have X." Instead say, "Should we look into X?"
- **Validation-Focused Reasons:** For the "Reason" field, tell the user *why* they deserve to ask this question (e.g., "You shouldn't have to live with 10/10 pain; your doctor needs to know how much this is stopping your life.")

### OUTPUT FORMAT (JSON):
Return a list of objects:
{
  "question": "The human-sounding bridge question",
  "reason": "Why this is a valid and important point to raise"
}`,
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
