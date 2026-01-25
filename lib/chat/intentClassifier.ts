/**
 * Intent classifier for chat messages
 * Detects user intent to route to appropriate handlers
 */

export type ChatIntent = 
  | 'review_recent'      // Review recent logs (last 3 days, etc.)
  | 'understand_patterns' // Understand what patterns suggest
  | 'compare_period'     // Compare to longer time period
  | 'add_detail'         // Add more detail to a symptom
  | 'general'            // General medical query
  | 'other';             // Other/non-medical

/**
 * Detect if message is a "review recent logs" request
 */
export function detectReviewRecentIntent(message: string): boolean {
  const lower = message.toLowerCase().trim();
  
  const patterns = [
    /review\s+(my\s+)?(last\s+)?(\d+\s+)?days?/i,
    /review\s+recent\s+logs?/i,
    /summary\s+of\s+my\s+symptoms?/i,
    /what\s+patterns?\s+do\s+you\s+see/i,
    /analyze\s+my\s+recent\s+symptoms?/i,
    /show\s+me\s+my\s+recent\s+logs?/i,
    /what\s+did\s+i\s+log\s+(recently|in\s+the\s+last)/i,
    /summarize\s+my\s+(recent\s+)?(symptoms?|logs?)/i,
    /review\s+(and\s+)?synthesize/i,
    /synthesize\s+(my\s+)?(health\s+)?data/i,
    /review\s+(my\s+)?(health\s+)?data/i,
    /last\s+(\d+\s+)?(hours?|days?)/i,
    /(\d+)\s+hours?/i,
  ];
  
  return patterns.some(pattern => pattern.test(lower));
}

/**
 * Detect if message is asking to understand patterns
 */
export function detectUnderstandPatternsIntent(message: string): boolean {
  const lower = message.toLowerCase().trim();
  
  const patterns = [
    /understand\s+(my\s+)?symptom\s+patterns?/i,
    /understand\s+what\s+(these\s+)?patterns?\s+may\s+suggest/i,
    /what\s+do\s+(these\s+)?patterns?\s+mean/i,
    /interpret\s+(these\s+)?patterns?/i,
    /what\s+could\s+(these\s+)?patterns?\s+indicate/i,
    /explain\s+(these\s+)?patterns?/i,
  ];
  
  return patterns.some(pattern => pattern.test(lower));
}

/**
 * Extract number of days for understand_patterns intent (default: 7)
 */
export function extractDaysForUnderstandPatterns(message: string): number {
  const match = message.match(/(\d+)\s+logged?\s+days?/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  // Default to 7 days for understand_patterns requests
  if (detectUnderstandPatternsIntent(message)) {
    return 7;
  }
  
  return 7; // Default
}

/**
 * Detect if message is asking to compare periods
 */
export function detectComparePeriodIntent(message: string): boolean {
  const lower = message.toLowerCase().trim();
  
  const patterns = [
    /compare\s+(this\s+)?to\s+(a\s+)?(longer\s+)?(time\s+)?period/i,
    /compare\s+(to\s+)?(\d+\s+)?days?/i,
    /compare\s+(to\s+)?(full\s+)?history/i,
    /how\s+does\s+this\s+compare\s+to/i,
    /compare\s+7\s+days/i,
    /compare\s+to\s+(7\s+days|full\s+history)/i,
  ];
  
  return patterns.some(pattern => pattern.test(lower));
}

/**
 * Extract comparison period from message (7 days, full history, or specific number)
 */
export function extractComparisonPeriod(message: string): number | 'full' | 7 {
  const lower = message.toLowerCase();
  
  // Check for "full history" first
  if (/full\s+history|entire\s+history|all\s+history/i.test(lower)) {
    return 'full';
  }
  
  // Check for specific number of days
  const daysMatch = lower.match(/(\d+)\s+days?/);
  if (daysMatch) {
    return parseInt(daysMatch[1], 10);
  }
  
  // Default to 7 days
  return 7;
}

/**
 * Detect if message is asking to add detail to a symptom
 */
export function detectAddDetailIntent(message: string): boolean {
  const lower = message.toLowerCase().trim();
  
  const patterns = [
    /add\s+more\s+detail\s+(to\s+)?(a\s+)?(specific\s+)?symptom/i,
    /tell\s+me\s+more\s+about\s+(a\s+)?(specific\s+)?symptom/i,
    /detail\s+(about|on)\s+(a\s+)?symptom/i,
    /more\s+information\s+about\s+(a\s+)?symptom/i,
  ];
  
  return patterns.some(pattern => pattern.test(lower));
}

/**
 * Classify user intent from message
 */
export function classifyIntent(message: string): ChatIntent {
  // Check understand_patterns first to catch "Understand my symptom patterns" button
  if (detectUnderstandPatternsIntent(message)) {
    return 'understand_patterns';
  }
  if (detectReviewRecentIntent(message)) {
    return 'review_recent';
  }
  if (detectComparePeriodIntent(message)) {
    return 'compare_period';
  }
  if (detectAddDetailIntent(message)) {
    return 'add_detail';
  }
  
  return 'general';
}

/**
 * Extract number of days from review request (default: 3)
 */
export function extractDaysFromReviewRequest(message: string): number {
  const match = message.match(/last\s+(\d+)\s+days?/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  // Default to 3 days for "review recent" requests
  if (detectReviewRecentIntent(message)) {
    return 3;
  }
  
  return 3; // Default
}
