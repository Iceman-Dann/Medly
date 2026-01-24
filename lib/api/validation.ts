import { z } from 'zod';

// Chat API validation
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10000),
});

export const sanitizedSymptomSchema = z.object({
  type: z.string().min(1).max(100),
  severity: z.number().min(0).max(10),
  relativeTime: z.string().max(50),
  duration: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  cyclePhase: z.string().max(20).optional(),
});

export const symptomContextSchema = z.object({
  recentSymptoms: z.array(sanitizedSymptomSchema).max(100),
  timeRange: z.string().max(100),
  primaryConcerns: z.array(z.string().max(100)).max(10),
});

export const retrievedChunkSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  url: z.string(),
  text: z.string(),
  relevanceScore: z.number(),
});

// Pattern Card schema
export const patternCardSchema = z.object({
  time_window_days: z.number(),
  top_symptoms: z.array(z.object({
    name: z.string(),
    freq: z.number(),
    freq_per_week: z.number(),
    avg_severity: z.number(),
    avg_duration_mins: z.number().optional(),
  })),
  cycle_association: z.object({
    tracked_ratio: z.number(),
    by_phase: z.object({
      menstrual: z.object({ count: z.number(), avg_severity: z.number(), top_symptoms: z.array(z.string()) }),
      follicular: z.object({ count: z.number(), avg_severity: z.number(), top_symptoms: z.array(z.string()) }),
      ovulation: z.object({ count: z.number(), avg_severity: z.number(), top_symptoms: z.array(z.string()) }),
      luteal: z.object({ count: z.number(), avg_severity: z.number(), top_symptoms: z.array(z.string()) }),
      unknown: z.object({ count: z.number(), avg_severity: z.number(), top_symptoms: z.array(z.string()) }),
    }),
    highest_severity_phase: z.string().optional(),
  }),
  context_tags: z.object({
    top_tags: z.array(z.object({ tag: z.string(), count: z.number() })),
    tag_symptom_links: z.array(z.object({ tag: z.string(), symptom: z.string(), count: z.number(), avg_severity: z.number() })),
  }),
  triggers: z.object({
    top_triggers: z.array(z.object({ trigger: z.string(), count: z.number() })),
    trigger_symptom_links: z.array(z.object({ trigger: z.string(), symptom: z.string(), count: z.number(), avg_severity: z.number() })),
  }),
  meds: z.object({
    top_meds: z.array(z.object({ med: z.string(), count: z.number() })),
  }),
  red_flags_detected: z.array(z.object({ flag: z.string(), evidence: z.enum(['notes_match', 'tag_match']), count: z.number() })),
  notes_quality: z.object({
    pct_present: z.number(),
    pii_risk: z.enum(['low', 'medium', 'high']),
  }),
  narrative_bullets: z.array(z.string()),
});

// RAG Evidence schema
export const ragEvidenceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  claim: z.string(),
  excerpt: z.string(),
  tags: z.array(z.string()).optional(),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  history: z.array(chatMessageSchema).max(50),
  pattern_card: patternCardSchema,
  rag_evidence: z.array(ragEvidenceSchema).max(10),
  // Keep symptom_context for backward compatibility (optional)
  symptom_context: symptomContextSchema.optional(),
  retrieved_chunks: z.array(retrievedChunkSchema).max(10).optional(),
});

// Report generation validation
export const sanitizedLogDataSchema = z.object({
  symptomType: z.string().min(1).max(100),
  severity: z.number().min(0).max(10),
  relativeTime: z.string().max(50),
  duration: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  cyclePhase: z.string().max(20).optional(),
  triggers: z.array(z.string().max(100)).max(20).optional(),
});

export const generateReportRequestSchema = z.object({
  logs: z.array(sanitizedLogDataSchema).min(1).max(200),
});

export const generateChecklistRequestSchema = z.object({
  logs: z.array(sanitizedLogDataSchema).min(1).max(200),
});

// Response types
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type GenerateReportRequest = z.infer<typeof generateReportRequestSchema>;
export type GenerateChecklistRequest = z.infer<typeof generateChecklistRequestSchema>;
