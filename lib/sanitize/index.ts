import type { Log, SanitizedLogData, SanitizedSymptom, SymptomContext } from '@/types';

// Patterns for PII detection
const PII_PATTERNS = {
  // Email addresses
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // Phone numbers (various formats)
  phone: /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  
  // US Social Security Numbers
  ssn: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
  
  // Medical Record Numbers (common patterns)
  mrn: /\b(MRN|mrn|Medical Record|medical record)[:\s#]*\d{5,12}\b/gi,
  
  // Street addresses
  address: /\d{1,5}\s+[\w\s]{1,30}(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|place|pl|circle|cir)\.?(?:\s*(?:apt|apartment|suite|ste|unit|#)\s*[\w-]+)?/gi,
  
  // ZIP codes (US)
  zipCode: /\b\d{5}(?:-\d{4})?\b/g,
  
  // Dates (various formats) - we'll convert to relative
  date: /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s*\d{4})?|\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:,?\s*\d{4})?)/gi,
  
  // Names (common patterns - "Dr. Smith", "my husband John")
  namedPerson: /(?:dr\.?\s+|my\s+(?:husband|wife|partner|mother|father|mom|dad|son|daughter|brother|sister|friend|doctor)\s+)[A-Z][a-z]+/gi,
  
  // Hospital/clinic names
  facility: /(?:at|from|to)\s+(?:the\s+)?[A-Z][a-zA-Z\s]+(?:hospital|clinic|medical center|health center|healthcare)/gi,
};

/**
 * Redact PII from text content
 * @param text - Raw text that may contain PII
 * @returns Sanitized text with PII replaced by generic placeholders
 */
export function redactPII(text: string): string {
  if (!text) return text;
  
  let sanitized = text;
  
  // Replace emails
  sanitized = sanitized.replace(PII_PATTERNS.email, '[EMAIL]');
  
  // Replace phone numbers
  sanitized = sanitized.replace(PII_PATTERNS.phone, '[PHONE]');
  
  // Replace SSNs
  sanitized = sanitized.replace(PII_PATTERNS.ssn, '[SSN]');
  
  // Replace MRNs
  sanitized = sanitized.replace(PII_PATTERNS.mrn, '[MRN]');
  
  // Replace addresses
  sanitized = sanitized.replace(PII_PATTERNS.address, '[ADDRESS]');
  
  // Replace ZIP codes (but not severity numbers like "5/10")
  sanitized = sanitized.replace(/\b\d{5}-\d{4}\b/g, '[ZIP]');
  
  // Replace specific dates with relative time descriptions
  sanitized = sanitized.replace(PII_PATTERNS.date, (match) => {
    const parsed = new Date(match);
    if (!isNaN(parsed.getTime())) {
      return getRelativeTime(parsed);
    }
    return '[DATE]';
  });
  
  // Replace named persons
  sanitized = sanitized.replace(PII_PATTERNS.namedPerson, (match) => {
    if (match.toLowerCase().startsWith('dr')) {
      return 'my doctor';
    }
    return match.split(' ')[0].toLowerCase() + ' [NAME]';
  });
  
  // Replace facility names
  sanitized = sanitized.replace(PII_PATTERNS.facility, '[HEALTHCARE FACILITY]');
  
  return sanitized;
}

/**
 * Convert an exact date to a relative time description
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'upcoming';
  } else if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `~${diffDays} days ago`;
  } else if (diffDays < 14) {
    return '~1 week ago';
  } else if (diffDays < 30) {
    return `~${Math.floor(diffDays / 7)} weeks ago`;
  } else if (diffDays < 60) {
    return '~1 month ago';
  } else if (diffDays < 365) {
    return `~${Math.floor(diffDays / 30)} months ago`;
  } else {
    return `~${Math.floor(diffDays / 365)} year(s) ago`;
  }
}

/**
 * Convert duration in minutes to a readable string
 */
export function formatDuration(mins?: number): string | undefined {
  if (!mins) return undefined;
  
  if (mins < 60) {
    return `${mins} minutes`;
  } else if (mins < 1440) {
    const hours = Math.floor(mins / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(mins / 1440);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
}

/**
 * Build a sanitized symptom context object from logs
 * This is the primary data structure sent to API endpoints
 */
export function buildSymptomContext(logs: Log[]): SymptomContext {
  const recentSymptoms: SanitizedSymptom[] = logs.map(log => ({
    type: log.symptomType,
    severity: log.severity,
    relativeTime: getRelativeTime(log.createdAt),
    duration: formatDuration(log.durationMins),
    tags: log.tags,
    cyclePhase: log.cyclePhase,
  }));
  
  // Determine time range
  const timeRange = logs.length > 0
    ? `${getRelativeTime(logs[logs.length - 1].createdAt)} to ${getRelativeTime(logs[0].createdAt)}`
    : 'no data';
  
  // Extract primary concerns (most frequent or severe symptoms)
  const symptomCounts: Record<string, { count: number; maxSeverity: number }> = {};
  for (const log of logs) {
    if (!symptomCounts[log.symptomType]) {
      symptomCounts[log.symptomType] = { count: 0, maxSeverity: 0 };
    }
    symptomCounts[log.symptomType].count++;
    symptomCounts[log.symptomType].maxSeverity = Math.max(
      symptomCounts[log.symptomType].maxSeverity,
      log.severity
    );
  }
  
  const primaryConcerns = Object.entries(symptomCounts)
    .sort((a, b) => {
      // Sort by combination of frequency and severity
      const scoreA = a[1].count * 2 + a[1].maxSeverity;
      const scoreB = b[1].count * 2 + b[1].maxSeverity;
      return scoreB - scoreA;
    })
    .slice(0, 3)
    .map(([type]) => type);
  
  return {
    recentSymptoms,
    timeRange,
    primaryConcerns,
  };
}

/**
 * Convert logs to sanitized format for API requests
 */
export function sanitizeLogs(logs: Log[]): SanitizedLogData[] {
  return logs.map(log => ({
    symptomType: log.symptomType,
    severity: log.severity,
    relativeTime: getRelativeTime(log.createdAt),
    duration: formatDuration(log.durationMins),
    tags: log.tags,
    cyclePhase: log.cyclePhase,
    triggers: log.triggers,
  }));
}

/**
 * Validate that text doesn't contain obvious PII before sending
 * Returns true if the text appears safe
 */
export function validateNoObviousPII(text: string): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  if (PII_PATTERNS.email.test(text)) {
    warnings.push('Text may contain an email address');
  }
  if (PII_PATTERNS.phone.test(text)) {
    warnings.push('Text may contain a phone number');
  }
  if (PII_PATTERNS.ssn.test(text)) {
    warnings.push('Text may contain a Social Security Number');
  }
  if (PII_PATTERNS.address.test(text)) {
    warnings.push('Text may contain an address');
  }
  
  return {
    safe: warnings.length === 0,
    warnings,
  };
}

/**
 * Check if message contains emergency symptoms
 */
export function detectEmergencySymptoms(text: string): boolean {
  const emergencyPatterns = [
    /chest\s*pain/i,
    /can'?t\s*breathe/i,
    /difficulty\s*breathing/i,
    /severe\s*bleeding/i,
    /heavy\s*bleeding/i,
    /suicid/i,
    /self[- ]?harm/i,
    /unconscious/i,
    /seizure/i,
    /stroke/i,
    /heart\s*attack/i,
    /overdose/i,
    /anaphyla/i,
    /severe\s*allergic/i,
    /can'?t\s*stop\s*bleeding/i,
    /losing\s*consciousness/i,
    /severe\s*abdominal\s*pain/i,
    /ectopic/i,
    /miscarriage/i,
  ];
  
  return emergencyPatterns.some(pattern => pattern.test(text));
}
