
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
    threadId?: string;
    citations?: string[];
    redactedContent?: string;
    createdAt?: Date;
}

export interface UserContext {
    recentLogs: SymptomLog[];
    isMedicalContextEnabled: boolean;
}

// Lib types for pattern analysis and RAG
export interface Log {
    id: string;
    symptomType: string;
    severity: number;
    createdAt: Date;
    cyclePhase?: string;
    tags?: string[];
    triggers?: string[];
    meds?: string[];
    notes?: string;
    durationMins?: number;
}

export interface PatternCard {
    time_window_days: number;
    top_symptoms: Array<{
        name: string;
        freq: number;
        freq_per_week: number;
        avg_severity: number;
        avg_duration_mins?: number;
    }>;
    cycle_association: {
        tracked_ratio: number;
        by_phase: {
            menstrual: { count: number; avg_severity: number; top_symptoms: string[] };
            follicular: { count: number; avg_severity: number; top_symptoms: string[] };
            ovulation: { count: number; avg_severity: number; top_symptoms: string[] };
            luteal: { count: number; avg_severity: number; top_symptoms: string[] };
            unknown: { count: number; avg_severity: number; top_symptoms: string[] };
        };
        highest_severity_phase?: string;
    };
    context_tags: {
        top_tags: Array<{ tag: string; count: number }>;
        tag_symptom_links: Array<{ tag: string; symptom: string; count: number; avg_severity: number }>;
    };
    triggers: {
        top_triggers: Array<{ trigger: string; count: number }>;
        trigger_symptom_links: Array<{ trigger: string; symptom: string; count: number; avg_severity: number }>;
    };
    meds: {
        top_meds: Array<{ med: string; count: number }>;
    };
    red_flags_detected: Array<{ flag: string; evidence: 'notes_match' | 'tag_match'; count: number }>;
    notes_quality: {
        pct_present: number;
        pii_risk: 'low' | 'medium' | 'high';
    };
    narrative_bullets: string[];
}

export interface RagEvidence {
    id: string;
    title: string;
    url: string;
    claim: string;
    excerpt: string;
    tags?: string[];
}

export interface KBDocument {
    id: string;
    title: string;
    source: string;
    url: string;
    text: string;
    tags: string[];
}

export interface RetrievedChunk {
    id: string;
    title: string;
    source: string;
    url: string;
    text: string;
    relevanceScore: number;
}

export interface SanitizedLogData {
    symptomType: string;
    severity: number;
    relativeTime: string;
    duration?: string;
    tags?: string[];
    cyclePhase?: string;
    triggers?: string[];
}

export interface SanitizedSymptom {
    type: string;
    severity: number;
    relativeTime: string;
    duration?: string;
    tags?: string[];
    cyclePhase?: string;
}

export interface SymptomContext {
    recentSymptoms: SanitizedSymptom[];
    timeRange: string;
    primaryConcerns: string[];
}

export interface Attachment {
    id: string;
    createdAt: Date;
    mimeType: string;
    blob: Blob;
    hash: string;
    originalName?: string;
}

export interface Report {
    id: string;
    createdAt: Date;
    type: 'doctor_report' | 'checklist';
    data: any;
}

export interface DoctorReportResponse {
    soapNote: {
        subjective: string;
        objective: string;
        assessment: string;
        plan: string;
    };
}

export interface ChecklistResponse {
    questions: Array<{
        question: string;
        reason: string;
    }>;
}
