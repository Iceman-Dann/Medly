
export enum SymptomCategory {
    PAIN = 'Pain',
    CRAMPING = 'Cramping',
    FATIGUE = 'Fatigue',
    MOOD = 'Mood changes',
    HEADACHE = 'Headache',
    BLOATING = 'Bloating',
    NAUSEA = 'Nausea',
    BLEEDING = 'Bleeding',
    BREAST_TENDERNESS = 'Breast tenderness',
    BACK_PAIN = 'Back pain',
    JOINT_PAIN = 'Joint pain',
    SLEEP = 'Sleep issues',
    DIGESTIVE = 'Digestive issues',
    MEDICATION = 'Medication',
    OTHER = 'Other'
}

export enum HealthMode {
    MENSTRUAL = 'Menstrual Health',
    FERTILITY = 'Fertility',
    POSTPARTUM = 'Post-Partum',
    PERIMENOPAUSE = 'Perimenopause',
    GENERAL = 'General Wellness'
}

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    schedule: string;
    status: 'active' | 'paused';
}

export interface UserProfile {
    activeMode: HealthMode;
}

export interface SymptomLog {
    id: string;
    timestamp: number;
    name: string;
    category: SymptomCategory;
    intensity: number; // 1-10
    notes: string;
    cyclePhase?: string;
    triggers?: string[];
    visualEvidence?: string; // base64 image data
}

export interface ClinicalReport {
    id: string;
    timestamp: number;
    timeRange: string;
    focusAreas: string[];
    soapNote: {
        subjective: string;
        objective: string;
        assessment: string;
        plan: string;
    };
    checklist: Array<{
        question: string;
        reason: string;
    }>;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    options?: string[];
}

export interface UserContext {
    recentLogs: SymptomLog[];
    isMedicalContextEnabled: boolean;
}
