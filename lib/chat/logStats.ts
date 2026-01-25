import type { Log } from '@/types';

/**
 * Get unique dates from logs (grouped by calendar date)
 */
export function getUniqueDates(logs: Log[]): Date[] {
  const dateSet = new Set<string>();
  const dates: Date[] = [];
  
  for (const log of logs) {
    const logDate = new Date(log.createdAt);
    logDate.setHours(0, 0, 0, 0);
    const dateKey = logDate.toISOString().split('T')[0];
    
    if (!dateSet.has(dateKey)) {
      dateSet.add(dateKey);
      dates.push(new Date(logDate));
    }
  }
  
  return dates.sort((a, b) => b.getTime() - a.getTime()); // Most recent first
}

/**
 * Get logs from the last N logged days (not calendar days)
 * Returns logs grouped by unique dates, taking the most recent N dates
 */
export function getLogsFromLastNDays(logs: Log[], n: number): Log[] {
  if (logs.length === 0) {
    return [];
  }
  
  // Get unique dates
  const uniqueDates = getUniqueDates(logs);
  
  // Take the most recent N dates
  const targetDates = uniqueDates.slice(0, n);
  const targetDateKeys = new Set(
    targetDates.map(d => d.toISOString().split('T')[0])
  );
  
  // Filter logs that match these dates
  return logs.filter(log => {
    const logDate = new Date(log.createdAt);
    logDate.setHours(0, 0, 0, 0);
    const dateKey = logDate.toISOString().split('T')[0];
    return targetDateKeys.has(dateKey);
  });
}

/**
 * Statistics for a symptom type
 */
export interface SymptomStats {
  symptomType: string;
  count: number;
  avgSeverity: number;
  maxSeverity: number;
  minSeverity: number;
  phases: Record<string, { count: number; avgSeverity: number }>;
}

/**
 * Compute statistics from logs
 */
export function computeLogStatistics(logs: Log[]): {
  symptomStats: SymptomStats[];
  maxSeverityOverall: number;
  maxSeveritySymptom: string;
  phaseWithMaxSeverity?: string;
  totalDays: number;
} {
  if (logs.length === 0) {
    return {
      symptomStats: [],
      maxSeverityOverall: 0,
      maxSeveritySymptom: '',
      phaseWithMaxSeverity: undefined,
      totalDays: 0,
    };
  }
  
  // Group by symptom type
  const symptomMap = new Map<string, {
    severities: number[];
    phases: Map<string, { severities: number[] }>;
  }>();
  
  for (const log of logs) {
    const symptom = log.symptomType;
    
    if (!symptomMap.has(symptom)) {
      symptomMap.set(symptom, {
        severities: [],
        phases: new Map(),
      });
    }
    
    const stats = symptomMap.get(symptom)!;
    stats.severities.push(log.severity);
    
    // Track by phase
    const phase = log.cyclePhase || 'unknown';
    if (!stats.phases.has(phase)) {
      stats.phases.set(phase, { severities: [] });
    }
    stats.phases.get(phase)!.severities.push(log.severity);
  }
  
  // Convert to SymptomStats array
  const symptomStats: SymptomStats[] = [];
  let maxSeverityOverall = 0;
  let maxSeveritySymptom = '';
  const phaseSeverityMap = new Map<string, { total: number; count: number }>();
  
  for (const [symptom, data] of symptomMap.entries()) {
    const severities = data.severities;
    const count = severities.length;
    const avgSeverity = severities.reduce((a, b) => a + b, 0) / count;
    const maxSeverity = Math.max(...severities);
    const minSeverity = Math.min(...severities);
    
    // Build phase stats
    const phases: Record<string, { count: number; avgSeverity: number }> = {};
    for (const [phase, phaseData] of data.phases.entries()) {
      const phaseCount = phaseData.severities.length;
      const phaseAvg = phaseData.severities.reduce((a, b) => a + b, 0) / phaseCount;
      phases[phase] = { count: phaseCount, avgSeverity: phaseAvg };
      
      // Track overall phase severity for max calculation
      if (!phaseSeverityMap.has(phase)) {
        phaseSeverityMap.set(phase, { total: 0, count: 0 });
      }
      const phaseStats = phaseSeverityMap.get(phase)!;
      phaseStats.total += phaseAvg * phaseCount;
      phaseStats.count += phaseCount;
    }
    
    symptomStats.push({
      symptomType: symptom,
      count,
      avgSeverity: Math.round(avgSeverity * 10) / 10, // Round to 1 decimal
      maxSeverity,
      minSeverity,
      phases,
    });
    
    // Track overall max
    if (maxSeverity > maxSeverityOverall) {
      maxSeverityOverall = maxSeverity;
      maxSeveritySymptom = symptom;
    }
  }
  
  // Find phase with highest average severity
  let phaseWithMaxSeverity: string | undefined;
  let maxPhaseAvg = 0;
  
  for (const [phase, stats] of phaseSeverityMap.entries()) {
    if (phase === 'unknown') continue;
    const avg = stats.total / stats.count;
    if (avg > maxPhaseAvg) {
      maxPhaseAvg = avg;
      phaseWithMaxSeverity = phase;
    }
  }
  
  // Get total unique days
  const uniqueDates = getUniqueDates(logs);
  const totalDays = uniqueDates.length;
  
  // Sort by count (most frequent first)
  symptomStats.sort((a, b) => b.count - a.count);
  
  return {
    symptomStats,
    maxSeverityOverall,
    maxSeveritySymptom,
    phaseWithMaxSeverity,
    totalDays,
  };
}
