import type { Log, PatternCard } from '@/types';
import { redactPII } from '@/lib/sanitize';

// Red flag keywords for safety detection
const RED_FLAG_KEYWORDS = [
  'blood', 'bleeding', 'hemorrhage',
  'fainting', 'faint', 'loss of consciousness',
  'fever', 'high temperature',
  'unexplained weight loss', 'rapid weight loss',
  'severe pain', 'excruciating',
  'can\'t breathe', 'difficulty breathing',
  'chest pain', 'heart palpitations',
];

/**
 * Lightweight PII detection for risk assessment (does not extract PII)
 */
function detectPIIRisk(notes: string[]): 'low' | 'medium' | 'high' {
  if (notes.length === 0) return 'low';
  
  const allNotes = notes.join(' ').toLowerCase();
  let riskScore = 0;
  
  // Email pattern
  if (/@/.test(allNotes)) riskScore += 2;
  
  // Phone pattern
  if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(allNotes)) riskScore += 2;
  
  // Address-like patterns
  if (/\d+\s+(street|st|avenue|ave|road|rd|drive|dr)/i.test(allNotes)) riskScore += 2;
  
  // Name patterns
  if (/(?:dr\.|doctor|my\s+(?:husband|wife|partner))\s+[A-Z][a-z]+/i.test(allNotes)) riskScore += 1;
  
  if (riskScore >= 4) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}

/**
 * Build a PatternCard from an array of logs
 * @param logs - Array of logs (typically last 30 days)
 * @param timeWindowDays - Number of days the logs span (default: calculated from logs)
 */
export function buildPatternCard(
  logs: Log[],
  timeWindowDays?: number
): PatternCard {
  if (logs.length === 0) {
    return {
      time_window_days: 0,
      top_symptoms: [],
      cycle_association: {
        tracked_ratio: 0,
        by_phase: {
          menstrual: { count: 0, avg_severity: 0, top_symptoms: [] },
          follicular: { count: 0, avg_severity: 0, top_symptoms: [] },
          ovulation: { count: 0, avg_severity: 0, top_symptoms: [] },
          luteal: { count: 0, avg_severity: 0, top_symptoms: [] },
          unknown: { count: 0, avg_severity: 0, top_symptoms: [] },
        },
      },
      context_tags: {
        top_tags: [],
        tag_symptom_links: [],
      },
      triggers: {
        top_triggers: [],
        trigger_symptom_links: [],
      },
      meds: {
        top_meds: [],
      },
      red_flags_detected: [],
      notes_quality: {
        pct_present: 0,
        pii_risk: 'low',
      },
      narrative_bullets: [],
    };
  }

  // Calculate time window
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const oldestDate = new Date(sortedLogs[0].createdAt);
  const newestDate = new Date(sortedLogs[sortedLogs.length - 1].createdAt);
  const actualWindowDays = timeWindowDays || Math.max(
    1,
    Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // ============ TOP SYMPTOMS ============
  const symptomStats: Record<string, {
    count: number;
    totalSeverity: number;
    totalDuration: number;
    durationCount: number;
  }> = {};

  for (const log of logs) {
    if (!symptomStats[log.symptomType]) {
      symptomStats[log.symptomType] = {
        count: 0,
        totalSeverity: 0,
        totalDuration: 0,
        durationCount: 0,
      };
    }
    symptomStats[log.symptomType].count++;
    symptomStats[log.symptomType].totalSeverity += log.severity;
    if (log.durationMins) {
      symptomStats[log.symptomType].totalDuration += log.durationMins;
      symptomStats[log.symptomType].durationCount++;
    }
  }

  const weeksInWindow = actualWindowDays / 7;
  const top_symptoms = Object.entries(symptomStats)
    .map(([name, stats]) => ({
      name,
      freq: stats.count,
      freq_per_week: weeksInWindow > 0 ? stats.count / weeksInWindow : 0,
      avg_severity: stats.count > 0 ? stats.totalSeverity / stats.count : 0,
      avg_duration_mins: stats.durationCount > 0 
        ? stats.totalDuration / stats.durationCount 
        : undefined,
    }))
    .sort((a, b) => b.freq - a.freq)
    .slice(0, 10);

  // ============ CYCLE ASSOCIATION ============
  const phaseStats: Record<string, {
    count: number;
    totalSeverity: number;
    symptoms: Record<string, number>;
  }> = {
    menstrual: { count: 0, totalSeverity: 0, symptoms: {} },
    follicular: { count: 0, totalSeverity: 0, symptoms: {} },
    ovulation: { count: 0, totalSeverity: 0, symptoms: {} },
    luteal: { count: 0, totalSeverity: 0, symptoms: {} },
    unknown: { count: 0, totalSeverity: 0, symptoms: {} },
  };

  let cycleTrackedCount = 0;
  for (const log of logs) {
    const phase = log.cyclePhase || 'unknown';
    if (phase !== 'unknown') cycleTrackedCount++;
    
    phaseStats[phase].count++;
    phaseStats[phase].totalSeverity += log.severity;
    phaseStats[phase].symptoms[log.symptomType] = 
      (phaseStats[phase].symptoms[log.symptomType] || 0) + 1;
  }

  const tracked_ratio = logs.length > 0 ? cycleTrackedCount / logs.length : 0;

  const by_phase: PatternCard['cycle_association']['by_phase'] = {
    menstrual: {
      count: phaseStats.menstrual.count,
      avg_severity: phaseStats.menstrual.count > 0 
        ? phaseStats.menstrual.totalSeverity / phaseStats.menstrual.count 
        : 0,
      top_symptoms: Object.entries(phaseStats.menstrual.symptoms)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([symptom]) => symptom),
    },
    follicular: {
      count: phaseStats.follicular.count,
      avg_severity: phaseStats.follicular.count > 0 
        ? phaseStats.follicular.totalSeverity / phaseStats.follicular.count 
        : 0,
      top_symptoms: Object.entries(phaseStats.follicular.symptoms)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([symptom]) => symptom),
    },
    ovulation: {
      count: phaseStats.ovulation.count,
      avg_severity: phaseStats.ovulation.count > 0 
        ? phaseStats.ovulation.totalSeverity / phaseStats.ovulation.count 
        : 0,
      top_symptoms: Object.entries(phaseStats.ovulation.symptoms)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([symptom]) => symptom),
    },
    luteal: {
      count: phaseStats.luteal.count,
      avg_severity: phaseStats.luteal.count > 0 
        ? phaseStats.luteal.totalSeverity / phaseStats.luteal.count 
        : 0,
      top_symptoms: Object.entries(phaseStats.luteal.symptoms)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([symptom]) => symptom),
    },
    unknown: {
      count: phaseStats.unknown.count,
      avg_severity: phaseStats.unknown.count > 0 
        ? phaseStats.unknown.totalSeverity / phaseStats.unknown.count 
        : 0,
      top_symptoms: Object.entries(phaseStats.unknown.symptoms)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([symptom]) => symptom),
    },
  };

  // Find highest severity phase
  let highest_severity_phase: string | undefined;
  let maxSeverity = -1;
  for (const [phase, stats] of Object.entries(by_phase)) {
    if (phase !== 'unknown' && stats.count > 0 && stats.avg_severity > maxSeverity) {
      maxSeverity = stats.avg_severity;
      highest_severity_phase = phase;
    }
  }

  // ============ CONTEXT TAGS ============
  const tagCounts: Record<string, number> = {};
  const tagSymptomLinks: Record<string, Record<string, { count: number; totalSeverity: number }>> = {};

  for (const log of logs) {
    if (log.tags) {
      for (const tag of log.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        
        if (!tagSymptomLinks[tag]) {
          tagSymptomLinks[tag] = {};
        }
        if (!tagSymptomLinks[tag][log.symptomType]) {
          tagSymptomLinks[tag][log.symptomType] = { count: 0, totalSeverity: 0 };
        }
        tagSymptomLinks[tag][log.symptomType].count++;
        tagSymptomLinks[tag][log.symptomType].totalSeverity += log.severity;
      }
    }
  }

  const top_tags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const tag_symptom_links = Object.entries(tagSymptomLinks)
    .flatMap(([tag, symptoms]) =>
      Object.entries(symptoms).map(([symptom, stats]) => ({
        tag,
        symptom,
        count: stats.count,
        avg_severity: stats.count > 0 ? stats.totalSeverity / stats.count : 0,
      }))
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // ============ TRIGGERS ============
  const triggerCounts: Record<string, number> = {};
  const triggerSymptomLinks: Record<string, Record<string, { count: number; totalSeverity: number }>> = {};

  for (const log of logs) {
    if (log.triggers) {
      for (const trigger of log.triggers) {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        
        if (!triggerSymptomLinks[trigger]) {
          triggerSymptomLinks[trigger] = {};
        }
        if (!triggerSymptomLinks[trigger][log.symptomType]) {
          triggerSymptomLinks[trigger][log.symptomType] = { count: 0, totalSeverity: 0 };
        }
        triggerSymptomLinks[trigger][log.symptomType].count++;
        triggerSymptomLinks[trigger][log.symptomType].totalSeverity += log.severity;
      }
    }
  }

  const top_triggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([trigger, count]) => ({ trigger, count }));

  const trigger_symptom_links = Object.entries(triggerSymptomLinks)
    .flatMap(([trigger, symptoms]) =>
      Object.entries(symptoms).map(([symptom, stats]) => ({
        trigger,
        symptom,
        count: stats.count,
        avg_severity: stats.count > 0 ? stats.totalSeverity / stats.count : 0,
      }))
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // ============ MEDS ============
  const medCounts: Record<string, number> = {};
  for (const log of logs) {
    if (log.meds) {
      for (const med of log.meds) {
        medCounts[med] = (medCounts[med] || 0) + 1;
      }
    }
  }

  const top_meds = Object.entries(medCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([med, count]) => ({ med, count }));

  // ============ RED FLAGS ============
  const redFlags: Record<string, { count: number; evidence: 'notes_match' | 'tag_match' }> = {};

  for (const log of logs) {
    // Check notes
    if (log.notes) {
      const notesLower = log.notes.toLowerCase();
      for (const keyword of RED_FLAG_KEYWORDS) {
        if (notesLower.includes(keyword.toLowerCase())) {
          if (!redFlags[keyword]) {
            redFlags[keyword] = { count: 0, evidence: 'notes_match' };
          }
          redFlags[keyword].count++;
        }
      }
    }

    // Check tags
    if (log.tags) {
      for (const tag of log.tags) {
        const tagLower = tag.toLowerCase();
        for (const keyword of RED_FLAG_KEYWORDS) {
          if (tagLower.includes(keyword.toLowerCase())) {
            if (!redFlags[keyword]) {
              redFlags[keyword] = { count: 0, evidence: 'tag_match' };
            }
            redFlags[keyword].count++;
          }
        }
      }
    }
  }

  const red_flags_detected = Object.entries(redFlags)
    .map(([flag, data]) => ({ flag, ...data }))
    .sort((a, b) => b.count - a.count);

  // ============ NOTES QUALITY ============
  const notesWithContent = logs.filter(log => log.notes && log.notes.trim().length > 0);
  const pct_present = logs.length > 0 ? (notesWithContent.length / logs.length) * 100 : 0;
  
  const allNotes = notesWithContent.map(log => log.notes!).filter(Boolean);
  const pii_risk = detectPIIRisk(allNotes);

  // ============ NARRATIVE BULLETS ============
  const narrative_bullets: string[] = [];

  if (top_symptoms.length > 0) {
    const topSymptom = top_symptoms[0];
    narrative_bullets.push(
      `Most frequent symptom: ${topSymptom.name} (${topSymptom.freq} times, avg severity ${topSymptom.avg_severity.toFixed(1)}/10)`
    );
  }

  if (tracked_ratio > 0.5) {
    if (highest_severity_phase) {
      const phaseData = by_phase[highest_severity_phase as keyof typeof by_phase];
      narrative_bullets.push(
        `Highest average severity during ${highest_severity_phase} phase (${phaseData.avg_severity.toFixed(1)}/10)`
      );
    }
  }

  if (top_tags.length > 0) {
    const topTag = top_tags[0];
    narrative_bullets.push(
      `Most common context tag: "${topTag.tag}" (appears with ${topTag.count} log entries)`
    );
  }

  if (top_triggers.length > 0) {
    const topTrigger = top_triggers[0];
    narrative_bullets.push(
      `Most common trigger: "${topTrigger.trigger}" (appears ${topTrigger.count} times)`
    );
  }

  if (top_meds.length > 0) {
    narrative_bullets.push(
      `Medications logged: ${top_meds.map(m => m.med).join(', ')}`
    );
  }

  return {
    time_window_days: actualWindowDays,
    top_symptoms,
    cycle_association: {
      tracked_ratio,
      by_phase,
      highest_severity_phase,
    },
    context_tags: {
      top_tags,
      tag_symptom_links,
    },
    triggers: {
      top_triggers,
      trigger_symptom_links,
    },
    meds: {
      top_meds,
    },
    red_flags_detected,
    notes_quality: {
      pct_present,
      pii_risk,
    },
    narrative_bullets,
  };
}
