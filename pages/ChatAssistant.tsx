
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useHealth } from '../HealthContext';
import { useFocusMode } from '../FocusModeContext';
import { getLogs, saveChatMessage, getChatHistory, getKBDocumentById } from '@/lib/db';
import { redactPII, detectEmergencySymptoms } from '@/lib/sanitize';
import { retrieveEvidence } from '@/lib/retrieval';
import { buildPatternCard } from '@/lib/patterns/buildPatternCard';
import { buildSystemPrompt, type LogReviewStats } from '@/lib/chat/systemPrompt';
import { classifyIntent, extractDaysFromReviewRequest, extractComparisonPeriod, extractDaysForUnderstandPatterns, detectUnderstandPatternsIntent, detectComparePeriodIntent, detectAddDetailIntent } from '@/lib/chat/intentClassifier';
import { getLogsFromLastNDays, computeLogStatistics } from '@/lib/chat/logStats';
import { ensureKnowledgeBaseSeeded } from '@/lib/kb/seed';
import { EmergencyAlert } from '@/components/EmergencyAlert';
import { gemini } from '../services/gemini';
import type { SymptomLog, Log, PatternCard, RagEvidence, KBDocument, ChatMessage } from '../types';

// Configuration constants for log analysis limits
// Gemini 2.0 Flash supports ~1M tokens, so we can use much more data
const PATTERN_ANALYSIS_DAYS = 180; // Analyze patterns over last 6 months
const MAX_PATTERN_LOGS = 500; // Maximum logs to use for pattern card (safety limit)
const MAX_REVIEW_LOGS = 500; // Maximum individual log entries to include in review
const MAX_CHAT_HISTORY = 20; // Maximum chat history messages to include

interface EnhancedMessage extends ChatMessage {
    citations?: string[];
    patternCard?: PatternCard;
    ragEvidence?: RagEvidence[];
}

// Convert SymptomLog[] to Log[] format for lib functions
function convertSymptomLogsToLogs(symptomLogs: SymptomLog[]): Log[] {
    return symptomLogs.map(log => {
        let cyclePhase = 'unknown';
        if (log.cyclePhase) {
            const phase = log.cyclePhase.toLowerCase();
            if (['menstrual', 'follicular', 'ovulation', 'luteal', 'unknown'].includes(phase)) {
                cyclePhase = phase;
            }
        }
        
        return {
            id: log.id,
            symptomType: log.name,
            severity: log.intensity,
            createdAt: new Date(log.timestamp),
            cyclePhase,
            tags: [],
            triggers: log.triggers || [],
            meds: [],
            notes: log.notes || '',
            durationMins: undefined,
        };
    });
}

/**
 * Get logs for pattern analysis (time-based window)
 */
function getLogsForPatternAnalysis(allLogs: SymptomLog[]): Log[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - PATTERN_ANALYSIS_DAYS);
    cutoffDate.setHours(0, 0, 0, 0);
    
    // Filter logs within the time window
    const filteredLogs = allLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);
        return logDate >= cutoffDate;
    });
    
    // Convert and limit to max
    const converted = convertSymptomLogsToLogs(filteredLogs);
    return converted.slice(0, MAX_PATTERN_LOGS);
}

const ChatAssistant: React.FC = () => {
    const { isMedicalContextEnabled, setMedicalContextEnabled, logs, medications } = useHealth();
    const { focusMode, getFocusModeLabel } = useFocusMode();
    const [messages, setMessages] = useState<EnhancedMessage[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [patternCard, setPatternCard] = useState<PatternCard | null>(null);
    const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
    const [showFocusModeHint, setShowFocusModeHint] = useState(false);
    const [threadId] = useState(() => `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Seed knowledge base and load pattern card on mount
    useEffect(() => {
        async function loadContext() {
            try {
                await ensureKnowledgeBaseSeeded();

                if (isMedicalContextEnabled) {
                    const logsForPattern = getLogsForPatternAnalysis(logs);
                    if (logsForPattern.length > 0) {
                        const card = buildPatternCard(logsForPattern);
                        setPatternCard(card);
                        console.log(`[Pattern] Built pattern card from ${logsForPattern.length} logs (last ${PATTERN_ANALYSIS_DAYS} days)`);
                    }
                }

                const history = await getChatHistory(threadId);
                if (history.length > 0) {
                    setMessages(history.map(h => ({
                        ...h,
                        timestamp: h.createdAt ? h.createdAt.getTime() : Date.now(),
                        citations: h.citations,
                    })));
                }
            } catch (error) {
                console.error('Failed to load context:', error);
            }
        }
        loadContext();
    }, [threadId, isMedicalContextEnabled, logs]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isStreaming]);

    // Helper function to detect if a message is medical-related
    const isMedicalQuery = (message: string): boolean => {
        const lowerMessage = message.toLowerCase().trim();
        
        // Simple greetings or casual conversation
        const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you', 'bye', 'goodbye'];
        if (greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + ' '))) {
            return false;
        }
        
        // Medical/symptom-related keywords
        const medicalKeywords = [
            'symptom', 'pain', 'ache', 'discomfort', 'bleeding', 'cramp', 'cycle', 'period', 'menstrual',
            'pelvic', 'abdominal', 'nausea', 'dizziness', 'fever', 'fatigue', 'mood', 'depression',
            'anxiety', 'doctor', 'physician', 'medical', 'health', 'diagnosis', 'condition', 'treatment',
            'medication', 'log', 'track', 'pattern', 'severity', 'intensity', 'phase', 'ovulation',
            'luteal', 'follicular', 'discharge', 'infection', 'uti', 'yeast', 'bacterial', 'endometriosis',
            'pcos', 'pms', 'premenstrual', 'irregular', 'heavy', 'spotting', 'bloating', 'headache',
            'migraine', 'back pain', 'breast', 'tenderness', 'sleep', 'insomnia', 'digestive', 'ibs'
        ];
        
        return medicalKeywords.some(keyword => lowerMessage.includes(keyword));
    };

    const handleSend = async (messageOverride?: string) => {
        const messageToSend = messageOverride || input.trim();
        if (!messageToSend || isStreaming) return;

        const userMessage = messageToSend;
        if (!messageOverride) {
            setInput('');
        }

        if (detectEmergencySymptoms(userMessage)) {
            setShowEmergencyAlert(true);
        }

        const redactedMessage = redactPII(userMessage);

        const userMsgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newUserMessage: EnhancedMessage = {
            id: userMsgId,
            role: 'user',
            content: userMessage,
            timestamp: Date.now(),
            threadId,
        };
        setMessages(prev => [...prev, newUserMessage]);

        await saveChatMessage({
            threadId,
            role: 'user',
            content: userMessage,
            timestamp: Date.now(),
            redactedContent: redactedMessage,
        });

        const assistantMsgId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setMessages(prev => [...prev, {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            threadId,
        }]);

        setIsStreaming(true);

        try {
            let currentPatternCard = patternCard;
            let ragEvidence: RagEvidence[] = [];
            const isMedical = isMedicalQuery(userMessage);

            // Only retrieve medical context if the query is medical-related
            if (isMedical && isMedicalContextEnabled) {
                const logsForPattern = getLogsForPatternAnalysis(logs);
                if (logsForPattern.length > 0) {
                    currentPatternCard = buildPatternCard(logsForPattern);
                    setPatternCard(currentPatternCard);
                    console.log(`[Pattern] Using ${logsForPattern.length} logs for pattern analysis`);
                    ragEvidence = await retrieveEvidence(userMessage, currentPatternCard, 8);
                } else {
                    // Even without logs, try to retrieve evidence from the user message
                    const emptyPatternCard: PatternCard = {
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
                        context_tags: { top_tags: [], tag_symptom_links: [] },
                        triggers: { top_triggers: [], trigger_symptom_links: [] },
                        meds: { top_meds: [] },
                        red_flags_detected: [],
                        notes_quality: { pct_present: 0, pii_risk: 'low' },
                        narrative_bullets: [],
                    };
                    ragEvidence = await retrieveEvidence(userMessage, emptyPatternCard, 8);
                }
            } else if (isMedical && !isMedicalContextEnabled) {
                // Medical query but context disabled - still try to retrieve evidence
                const emptyPatternCard: PatternCard = {
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
                    context_tags: { top_tags: [], tag_symptom_links: [] },
                    triggers: { top_triggers: [], trigger_symptom_links: [] },
                    meds: { top_meds: [] },
                    red_flags_detected: [],
                    notes_quality: { pct_present: 0, pii_risk: 'low' },
                    narrative_bullets: [],
                };
                ragEvidence = await retrieveEvidence(userMessage, emptyPatternCard, 8);
            }

            console.log('Retrieved RAG evidence:', ragEvidence.length, ragEvidence);

            const citationIds = ragEvidence.map(ev => ev.id);
            console.log('Citation IDs:', citationIds);

            const historyForGemini = messages.slice(-MAX_CHAT_HISTORY).map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
            }));

            // Classify user intent
            const intent = classifyIntent(userMessage);
            const isReviewingLogs = intent === 'review_recent';
            const isUnderstandingPatterns = intent === 'understand_patterns';
            
            // Also check if message contains review keywords (fallback detection)
            const reviewKeywords = /review|synthesize|summarize|analyze|last\s+(\d+)?\s*(hours?|days?)/i;
            const hasReviewKeywords = reviewKeywords.test(userMessage);

            // Get recent log entries if user is asking to review logs or understand patterns
            let recentLogEntries: Log[] | undefined = undefined;
            let computedStats: LogReviewStats | undefined = undefined;
            
            if (isReviewingLogs || hasReviewKeywords || isUnderstandingPatterns) {
                // Get number of days from request
                // understand_patterns defaults to 7 days, review_recent defaults to 3 days
                const daysToFetch = isUnderstandingPatterns 
                    ? extractDaysForUnderstandPatterns(userMessage)
                    : extractDaysFromReviewRequest(userMessage);
                
                // Convert all logs first
                const allConvertedLogs = convertSymptomLogsToLogs(logs);
                
                // Get logs from last N LOGGED days (not calendar days)
                recentLogEntries = getLogsFromLastNDays(allConvertedLogs, daysToFetch);
                
                // Compute statistics
                if (recentLogEntries.length > 0) {
                    const stats = computeLogStatistics(recentLogEntries);
                    computedStats = {
                        symptomStats: stats.symptomStats.map(s => ({
                            symptomType: s.symptomType,
                            count: s.count,
                            avgSeverity: s.avgSeverity,
                        })),
                        maxSeverityOverall: stats.maxSeverityOverall,
                        maxSeveritySymptom: stats.maxSeveritySymptom,
                        phaseWithMaxSeverity: stats.phaseWithMaxSeverity,
                        totalDays: stats.totalDays,
                    };
                    const requestType = isUnderstandingPatterns ? 'Understand patterns' : 'Review';
                    console.log(`[Chat] ${requestType} request: ${recentLogEntries.length} entries from last ${computedStats.totalDays} logged days`);
                    console.log(`[Chat] Computed stats:`, {
                        symptomStats: computedStats.symptomStats,
                        maxSeverity: computedStats.maxSeverityOverall,
                        maxSeveritySymptom: computedStats.maxSeveritySymptom,
                        phaseWithMaxSeverity: computedStats.phaseWithMaxSeverity
                    });
                    console.log(`[Chat] Actual log entries:`, recentLogEntries.map(log => ({
                        symptom: log.symptomType,
                        severity: log.severity,
                        date: log.createdAt.toLocaleDateString(),
                        phase: log.cyclePhase
                    })));
                } else {
                    console.log(`[Chat] ${isUnderstandingPatterns ? 'Understand patterns' : 'Review'} request: No logs found for last ${daysToFetch} logged days`);
                }
            }

            // Build system prompt for medical queries
            // Include log entries if user is reviewing logs, even if pattern card is empty
            let systemPrompt = '';
            if (isMedical) {
                // Handle follow-up intents for review actions
                if (intent === 'understand_patterns') {
                    // User clicked "Understand my symptom patterns" or "Explain what these patterns may suggest"
                    // If this is the initial request (not a follow-up), show patterns summary first
                    // If computedStats exists, this is the initial request - show patterns summary
                    if (computedStats && recentLogEntries) {
                        // Initial request: show patterns summary immediately
                        systemPrompt = buildSystemPrompt(
                            currentPatternCard || {
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
                                context_tags: { top_tags: [], tag_symptom_links: [] },
                                triggers: { top_triggers: [], trigger_symptom_links: [] },
                                meds: { top_meds: [] },
                                red_flags_detected: [],
                                notes_quality: { pct_present: 0, pii_risk: 'low' },
                                narrative_bullets: [],
                            },
                            ragEvidence,
                            recentLogEntries,
                            computedStats
                        );
                    } else {
                        // Follow-up request: provide interpretation
                        systemPrompt = `You are a women's health self-advocacy assistant. The user wants to understand what their symptom patterns may suggest.

CRITICAL RULES:
1) Do NOT diagnose. Use cautious language ("could be consistent with", "one possibility", "worth discussing with a clinician", "may warrant evaluation").
2) Provide suggested questions the user should ask their clinician.
3) Reference the PATTERN_CARD and RECENT_LOG_ENTRIES for context.
4) Do NOT include emergency disclaimers or red-flag warnings unless the user explicitly asks about danger or urgency.
5) Keep it concise and action-oriented.

OUTPUT FORMAT:
## What these patterns may suggest (not a diagnosis)
- [Cautious interpretation based on patterns]
- [Possible associations, using "could be", "may indicate", "worth ruling out"]

## Questions to ask your clinician
- [Specific, actionable questions based on the patterns]

PATTERN_CARD:
${JSON.stringify(currentPatternCard || {}, null, 2)}

Remember: Be cautious, non-diagnostic, supportive, and concise.`;
                    }
                } else if (intent === 'compare_period') {
                    // User clicked "Compare this to a longer time period"
                    // Extract period from message, default to 7 days if not specified
                    const compareDays = extractComparisonPeriod(userMessage);
                    
                    // Get comparison logs - automatically run the comparison
                    const allConvertedLogs = convertSymptomLogsToLogs(logs);
                    let comparisonLogs: Log[] = [];
                    let comparisonStats: ReturnType<typeof computeLogStatistics> | undefined = undefined;
                    
                    if (compareDays === 'full') {
                        comparisonLogs = allConvertedLogs;
                        comparisonStats = computeLogStatistics(comparisonLogs);
                    } else {
                        comparisonLogs = getLogsFromLastNDays(allConvertedLogs, compareDays);
                        comparisonStats = computeLogStatistics(comparisonLogs);
                    }
                    
                    // Format comparison stats for prompt
                    const comparisonStatsJson = comparisonStats
                        ? JSON.stringify({
                            symptomStats: comparisonStats.symptomStats.map(s => ({
                                symptomType: s.symptomType,
                                count: s.count,
                                avgSeverity: s.avgSeverity,
                            })),
                            maxSeverityOverall: comparisonStats.maxSeverityOverall,
                            maxSeveritySymptom: comparisonStats.maxSeveritySymptom,
                            phaseWithMaxSeverity: comparisonStats.phaseWithMaxSeverity,
                            totalDays: comparisonStats.totalDays,
                        }, null, 2)
                        : 'No comparison stats available';
                    
                    const periodDescription = compareDays === 'full' 
                        ? 'full history' 
                        : `last ${compareDays} logged days`;
                    
                    systemPrompt = `You are a women's health self-advocacy assistant. The user wants to compare recent symptom patterns to a longer time period.

CRITICAL: Do NOT ask for permission to access logs. The user's request is implicit consent. Immediately provide the comparison.

Compare the RECENT_STATS (from last few days) to COMPARISON_STATS (from ${periodDescription}).

OUTPUT FORMAT:
## Comparison Summary
- Recent period: [days] logged days, [symptom counts]
- Comparison period: [days] logged days, [symptom counts]

## Changes Over Time
Formatting rules for this section:
1) NEVER show "+/-0", "+0", or "-0" - these are not changes
2) When count is unchanged: say "[Symptom name]: remained stable ([count] times in both periods)" or "[Symptom name]: unchanged ([count] times)"
3) When count changes: show "[Symptom name]: [recent count] → [comparison count] ([increase/decrease] by [X])"
4) When severity is unchanged: say "Average severity remained stable at [X]/10" or "Average severity: unchanged ([X]/10)"
5) When severity changes: show "Average severity: [recent]/10 → [comparison]/10 ([increase/decrease] by [X]/10)"
6) Group unchanged symptoms: "The following symptoms remained stable: [list] ([count] times each)"
7) Only show numeric deltas when there is an actual increase or decrease
8) Prioritize clarity - avoid repetition, group similar changes together

Example format:
- [Symptom with increase]: [recent count] → [comparison count] (increased by [X])
- [Symptom with decrease]: [recent count] → [comparison count] (decreased by [X])
- [Symptom unchanged]: remained stable ([count] times in both periods)
- Average severity trends: [describe overall pattern - increased/decreased/stable]
- Frequency: [describe if symptoms are more/less frequent overall]

If multiple symptoms are unchanged, group them:
- The following symptoms remained stable: [Symptom A], [Symptom B] ([count] times each)

## What this suggests
- [Pattern interpretation based on changes]

RECENT_STATS:
${computedStats ? JSON.stringify(computedStats, null, 2) : 'No recent stats available'}

COMPARISON_STATS:
${comparisonStatsJson}

Remember: Do NOT ask "Please confirm" or "I need to access" - just provide the comparison immediately.`;
                } else if (intent === 'add_detail') {
                    // User clicked "Add more detail to a specific symptom"
                    systemPrompt = `You are a women's health self-advocacy assistant. The user wants to add more detail to a specific symptom.

Ask them which symptom they'd like to add more detail about, and what kind of details:
- Timing (when it occurs, duration)
- Triggers (what seems to cause it)
- Associated symptoms (what else happens with it)
- Severity patterns (does it vary throughout the day/cycle)

OUTPUT FORMAT:
Which symptom would you like to add more detail about? I can help you track:
- Timing and duration patterns
- Potential triggers
- Associated symptoms
- Severity variations

Tell me which symptom and what details you'd like to add.`;
                } else if (isReviewingLogs || hasReviewKeywords || isUnderstandingPatterns || (computedStats && recentLogEntries)) {
                    // Review recent logs or understand patterns - use computed stats
                    // Also handle case where stats were computed but intent wasn't detected
                    // Always build system prompt for review/understand requests, even if logs are empty
                    console.log('[Chat] Building review/understand system prompt:', { 
                        isReviewingLogs, 
                        isUnderstandingPatterns,
                        hasReviewKeywords, 
                        hasComputedStats: !!computedStats, 
                        hasRecentLogs: !!recentLogEntries,
                        computedStatsPreview: computedStats ? JSON.stringify(computedStats).substring(0, 200) : 'none'
                    });
                    const patternCardToUse = currentPatternCard || {
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
                        context_tags: { top_tags: [], tag_symptom_links: [] },
                        triggers: { top_triggers: [], trigger_symptom_links: [] },
                        meds: { top_meds: [] },
                        red_flags_detected: [],
                        notes_quality: { pct_present: 0, pii_risk: 'low' },
                        narrative_bullets: [],
                    };
                    console.log('[Chat] Building system prompt for log review:', {
                        hasRecentLogs: !!recentLogEntries,
                        logCount: recentLogEntries?.length || 0,
                        hasComputedStats: !!computedStats,
                        intent
                    });
                    systemPrompt = buildSystemPrompt(patternCardToUse, ragEvidence, recentLogEntries, computedStats);
                } else {
                    // Normal case: always build system prompt for medical queries
                    // Use empty pattern card if none exists
                    const patternCardToUse = currentPatternCard || {
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
                        context_tags: { top_tags: [], tag_symptom_links: [] },
                        triggers: { top_triggers: [], trigger_symptom_links: [] },
                        meds: { top_meds: [] },
                        red_flags_detected: [],
                        notes_quality: { pct_present: 0, pii_risk: 'low' },
                        narrative_bullets: [],
                    };
                    systemPrompt = buildSystemPrompt(patternCardToUse, ragEvidence, recentLogEntries);
                }
            }
            
            // Debug logging
            if (isMedical) {
                console.log('[Chat] System prompt status:', {
                    hasSystemPrompt: !!systemPrompt,
                    systemPromptLength: systemPrompt.length,
                    intent,
                    isReviewingLogs,
                    hasReviewKeywords,
                    hasRecentLogs: !!recentLogEntries,
                    hasComputedStats: !!computedStats,
                    hasPatternCard: !!currentPatternCard,
                    ragEvidenceCount: ragEvidence.length,
                    containsComputedStats: systemPrompt.includes('COMPUTED_STATISTICS')
                });
            }

            // CRITICAL: If computedStats exists, we MUST use the review format
            // This ensures the system prompt is built even if intent detection failed
            if (isMedical && computedStats && !systemPrompt.includes('COMPUTED_STATISTICS')) {
                console.warn('[Chat] WARNING: Computed stats exist but system prompt doesn\'t include them! Rebuilding...', {
                    intent,
                    isReviewingLogs,
                    hasReviewKeywords,
                    hasRecentLogs: !!recentLogEntries,
                    systemPromptLength: systemPrompt.length
                });
                const patternCardToUse = currentPatternCard || {
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
                    context_tags: { top_tags: [], tag_symptom_links: [] },
                    triggers: { top_triggers: [], trigger_symptom_links: [] },
                    meds: { top_meds: [] },
                    red_flags_detected: [],
                    notes_quality: { pct_present: 0, pii_risk: 'low' },
                    narrative_bullets: [],
                };
                systemPrompt = buildSystemPrompt(patternCardToUse, ragEvidence, recentLogEntries, computedStats);
            }
            
            // Validate system prompt is set for medical queries
            if (isMedical && !systemPrompt) {
                console.error('[Chat] ERROR: Medical query but system prompt is empty!', {
                    intent,
                    isReviewingLogs,
                    hasReviewKeywords,
                    hasRecentLogs: !!recentLogEntries,
                    hasPatternCard: !!currentPatternCard,
                    hasComputedStats: !!computedStats
                });
                // Fallback: build a minimal system prompt
                const fallbackPatternCard = currentPatternCard || {
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
                    context_tags: { top_tags: [], tag_symptom_links: [] },
                    triggers: { top_triggers: [], trigger_symptom_links: [] },
                    meds: { top_meds: [] },
                    red_flags_detected: [],
                    notes_quality: { pct_present: 0, pii_risk: 'low' },
                    narrative_bullets: [],
                };
                systemPrompt = buildSystemPrompt(fallbackPatternCard, ragEvidence, recentLogEntries, computedStats);
            }
            
            // Add focus mode context to system prompt if available
            if (focusMode && systemPrompt) {
                const focusModeContext = `\n\nFOCUS MODE CONTEXT:\nThe user has selected "${getFocusModeLabel(focusMode)}" as their current focus mode. When providing advice, prioritize information relevant to this life stage and health context. Focus mode ID: ${focusMode}`;
                systemPrompt = systemPrompt + focusModeContext;
            }

            // Add medication context from profile when available (active meds only)
            const activeMeds = medications.filter(m => m.status === 'active');
            if (activeMeds.length > 0 && systemPrompt) {
                const medLines = activeMeds.map(m => `- ${m.name}${m.dosage ? `, ${m.dosage}` : ''}${m.schedule ? ` (${m.schedule})` : ''}`).join('\n');
                const medContext = `\n\nUSER_MEDICATIONS (from profile):\nThe user has listed these active medications. Use this context when discussing drug interactions, medication-related symptoms, Med Response focus, or when generating clinical summaries.\n${medLines}`;
                systemPrompt = systemPrompt + medContext;
            }
            
            // Log what we're sending to the model (first 500 chars of system prompt for debugging)
            if (isMedical) {
                console.log('[Chat] Sending to model:', {
                    systemPromptPreview: systemPrompt.substring(0, 500) + (systemPrompt.length > 500 ? '...' : ''),
                    systemPromptLength: systemPrompt.length,
                    userMessage: redactedMessage.substring(0, 100),
                    hasComputedStats: !!computedStats,
                    hasFocusMode: !!focusMode,
                    focusMode: focusMode,
                    computedStatsPreview: computedStats ? JSON.stringify(computedStats).substring(0, 200) : 'none'
                });
            }
            
            let fullResponse = '';
            
            // Stream the response and update UI incrementally
            for await (const chunk of gemini.chatStream(
                redactedMessage,
                [],
                historyForGemini,
                systemPrompt
            )) {
                fullResponse += chunk;
                // Update the message content as chunks arrive
                setMessages(prev => prev.map(m => 
                    m.id === assistantMsgId 
                        ? { 
                            ...m, 
                            content: fullResponse,
                        }
                        : m
                ));
            }

            // Final update with all metadata
            setMessages(prev => prev.map(m => 
                m.id === assistantMsgId 
                    ? { 
                        ...m, 
                        content: fullResponse, 
                        citations: citationIds,
                        patternCard: currentPatternCard || undefined,
                        ragEvidence: ragEvidence,
                    }
                    : m
            ));

            await saveChatMessage({
                threadId,
                role: 'assistant',
                content: fullResponse,
                timestamp: Date.now(),
                redactedContent: fullResponse,
                citations: citationIds,
            });
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Full error details:', errorMessage);
            
            setMessages(prev => prev.map(m => 
                m.id === assistantMsgId 
                    ? { ...m, content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again later.` }
                    : m
            ));
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <div className="flex flex-col h-screen lg:ml-64 bg-background-light dark:bg-background-dark">
            {showEmergencyAlert && (
                <EmergencyAlert onDismiss={() => setShowEmergencyAlert(false)} />
            )}

            <header className="flex-none p-6 border-b border-slate-200 dark:border-rose-900/20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">smart_toy</span>
                            Medly AI Assistant
                        </h2>
                        <p className="text-xs text-slate-500">Professional medical companion</p>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-xl border border-primary/10 bg-primary/5">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold leading-none">Medical Context</p>
                            <p className="text-[10px] text-slate-500">Syncs with your history</p>
                        </div>
                        <button 
                            onClick={() => setMedicalContextEnabled(!isMedicalContextEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isMedicalContextEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMedicalContextEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {patternCard && patternCard.top_symptoms.length > 0 && isMedicalContextEnabled && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                            <div className="text-sm text-purple-700 dark:text-purple-300">
                                <strong>Pattern loaded:</strong> {patternCard.top_symptoms.length} symptom types tracked over {patternCard.time_window_days} days.
                                {patternCard.top_symptoms.length > 0 && (
                                    <> Top: {patternCard.top_symptoms[0].name} ({patternCard.top_symptoms[0].freq} times, avg severity {patternCard.top_symptoms[0].avg_severity.toFixed(1)}/10)</>
                                )}
                                {patternCard.context_tags.top_tags.length > 0 && (
                                    <> • Top tag: "{patternCard.context_tags.top_tags[0].tag}"</>
                                )}
                                {patternCard.cycle_association.highest_severity_phase && (
                                    <> • Highest severity in {patternCard.cycle_association.highest_severity_phase} phase</>
                                )}
                            </div>
                        </div>
                    )}

                    {messages.length === 0 && (
                        <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl text-center space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <span className="material-symbols-outlined text-3xl text-primary">psychology</span>
                            </div>
                            <h3 className="text-xl font-bold">Hello, I'm Medly</h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                                How can I help you understand your symptoms today? I can analyze your logs, explain clinical terms, or help you prepare questions for your doctor.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {["Review my last 3 days", "Help me describe pelvic pain", "Understand my symptom patterns"].map(q => (
                                    <button 
                                        key={q}
                                        onClick={() => handleSend(q)}
                                        className="text-xs font-semibold px-4 py-2 bg-white dark:bg-rose-950/20 border border-primary/20 rounded-full hover:bg-primary hover:text-white transition-all"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <MessageWithCitations key={msg.id} message={msg} onActionClick={handleSend} />
                    ))}
                    {isStreaming && (
                        <div className="flex gap-4 animate-pulse">
                            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                            <div className="max-w-[100px] h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl rounded-tl-none"></div>
                        </div>
                    )}
                </div>
            </div>

            <footer className="flex-none p-6 border-t border-slate-200 dark:border-rose-900/20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                            <span className="material-symbols-outlined text-sm">lock</span>
                            <span>Your messages are automatically redacted to remove personal information before being sent.</span>
                        </div>
                    </div>
                    {focusMode && (
                        <div className="mb-3 flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <button
                                    type="button"
                                    onClick={() => setShowFocusModeHint((v) => !v)}
                                    className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    aria-label="About focus mode"
                                >
                                    <span className="material-symbols-outlined text-sm align-middle">info</span>
                                </button>
                                <span>
                                    Using <span className="font-semibold text-slate-700 dark:text-slate-300">{getFocusModeLabel(focusMode)}</span> context
                                </span>
                            </div>
                            {showFocusModeHint && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    You can set your focus mode in <Link to="/profile" className="font-semibold text-primary hover:underline">My Profile</Link>.
                                </p>
                            )}
                        </div>
                    )}
                    <div className="relative flex items-center">
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Describe your symptoms or ask a question..."
                            className="w-full bg-slate-50 dark:bg-rose-950/20 border border-slate-200 dark:border-rose-900/30 rounded-2xl py-4 pl-6 pr-16 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isStreaming}
                            className="absolute right-3 bg-primary p-2.5 rounded-xl text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            <span className="material-symbols-outlined font-bold">send</span>
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-3 uppercase tracking-widest">
                        Medly AI is not a replacement for professional medical advice.
                    </p>
                </div>
            </footer>
        </div>
    );
};

function MessageWithCitations({ message, onActionClick }: { message: EnhancedMessage; onActionClick?: (action: string) => void }) {
    const [citations, setCitations] = useState<KBDocument[]>([]);
    const [loadingCitations, setLoadingCitations] = useState(false);
    const [sourcesExpanded, setSourcesExpanded] = useState(false);

    useEffect(() => {
        async function loadCitations() {
            console.log('Loading citations for message:', message.id, 'citations:', message.citations);
            if (!message.citations || message.citations.length === 0) {
                console.log('No citations to load');
                return;
            }

            setLoadingCitations(true);
            try {
                const docs = await Promise.all(
                    message.citations.map(id => getKBDocumentById(id))
                );
                const validDocs = docs.filter((doc): doc is KBDocument => doc !== undefined);
                console.log('Loaded citations:', validDocs.length, validDocs);
                setCitations(validDocs);
            } catch (error) {
                console.error('Failed to load citations:', error);
            } finally {
                setLoadingCitations(false);
            }
        }

        if (message.role === 'assistant') {
            loadCitations();
        }
    }, [message.citations, message.role, message.id]);


    return (
        <div className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <span className="material-symbols-outlined text-primary">clinical_notes</span>
                </div>
            )}
            <div className={`max-w-[85%] ${message.role === 'assistant' ? 'w-full' : ''}`}>
                {message.role === 'assistant' && message.patternCard && message.patternCard.top_symptoms.length > 0 && (
                    <div className="mb-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 text-xs">
                        <div className="font-semibold text-purple-700 dark:text-purple-300 mb-1">Pattern used:</div>
                        <div className="text-purple-600 dark:text-purple-400 space-y-0.5">
                            {message.patternCard.top_symptoms.slice(0, 2).map((symptom, idx) => (
                                <div key={idx}>
                                    {symptom.name}: {symptom.freq} times, avg severity {symptom.avg_severity.toFixed(1)}/10
                                </div>
                            ))}
                            {message.patternCard.context_tags.top_tags.length > 0 && (
                                <div>Top tags: {message.patternCard.context_tags.top_tags.slice(0, 2).map(t => `"${t.tag}"`).join(', ')}</div>
                            )}
                            {message.patternCard.cycle_association.highest_severity_phase && (
                                <div>Highest severity in {message.patternCard.cycle_association.highest_severity_phase} phase</div>
                            )}
                        </div>
                    </div>
                )}

                <div className={`p-4 rounded-2xl shadow-sm ${
                    message.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white dark:bg-rose-950/20 border border-primary/10 text-slate-800 dark:text-slate-100 rounded-tl-none'
                }`}>
                    {message.content ? (
                        <div className="text-sm leading-relaxed">
                            <ReactMarkdown
                                components={{
                                    h2: ({node, ...props}) => <h2 className="font-semibold text-lg mt-6 mb-4 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="font-semibold text-base mt-4 mb-3 text-slate-900 dark:text-slate-100" {...props} />,
                                    p: ({node, ...props}) => <p className="text-slate-700 dark:text-slate-300 my-2 leading-relaxed" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-none pl-0 my-3 space-y-2.5" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />,
                                    li: ({node, ...props}) => {
                                        // Extract text content from React nodes
                                        const extractText = (children: any): string => {
                                            if (typeof children === 'string') return children;
                                            if (Array.isArray(children)) {
                                                return children.map(extractText).join('');
                                            }
                                            if (children && typeof children === 'object' && 'props' in children) {
                                                return extractText(children.props?.children || '');
                                            }
                                            return '';
                                        };
                                        
                                        const content = props.children;
                                        const contentStr = extractText(content);
                                        
                                        const isNextStep = contentStr.includes('Explain what these symptom patterns') ||
                                            contentStr.includes('Compare this period');
                                        
                                        if (isNextStep && onActionClick) {
                                            return (
                                                <li className="my-2">
                                                    <button
                                                        onClick={() => {
                                                            if (contentStr.includes('Explain what these symptom patterns')) {
                                                                onActionClick('Explain what these symptom patterns may suggest');
                                                            } else if (contentStr.includes('Compare this period')) {
                                                                onActionClick('Compare this period to a longer history of logs');
                                                            }
                                                        }}
                                                        className="w-full text-left px-4 py-3 bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-lg transition-all hover:shadow-sm group cursor-pointer"
                                                    >
                                                        <span className="text-slate-900 dark:text-slate-100 font-medium group-hover:text-primary transition-colors">{content}</span>
                                                    </button>
                                                </li>
                                            );
                                        }
                                        
                                        // Format symptom summary items with better styling
                                        const isSymptomSummary = contentStr.includes('occurrence(s)') && contentStr.includes('average severity');
                                        if (isSymptomSummary) {
                                            return (
                                                <li className="flex items-center justify-between py-2.5 px-4 my-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                    <span className="text-slate-900 dark:text-slate-100">{content}</span>
                                                </li>
                                            );
                                        }
                                        
                                        return <li className="text-slate-700 dark:text-slate-300 my-1.5 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold" {...props} />;
                                    },
                                    strong: ({node, ...props}) => <strong className="font-semibold text-slate-900 dark:text-slate-100" {...props} />,
                                    a: ({node, ...props}) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                    code: ({node, ...props}) => <code className="text-sm bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded" {...props} />,
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        </span>
                    )}
                    <p className={`text-[9px] mt-2 opacity-60 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>

                {message.role === 'assistant' && ((message.ragEvidence && message.ragEvidence.length > 0) || (message.citations && message.citations.length > 0) || citations.length > 0) && (
                    <div className="mt-2">
                        <button
                            onClick={() => setSourcesExpanded(!sourcesExpanded)}
                            className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                            <span className={`material-symbols-outlined text-sm transition-transform ${sourcesExpanded ? 'rotate-90' : ''}`}>
                                chevron_right
                            </span>
                            Sources ({message.ragEvidence?.length || message.citations?.length || citations.length || 0})
                        </button>
                        {sourcesExpanded && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 space-y-1.5">
                                {message.ragEvidence?.map((ev) => (
                                    <a
                                        key={ev.id}
                                        href={ev.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-xs text-primary hover:text-primary/80 hover:underline"
                                    >
                                        {ev.title} — {ev.url}
                                    </a>
                                ))}
                                {citations.map((citation) => (
                                    <a
                                        key={citation.id}
                                        href={citation.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-xs text-primary hover:text-primary/80 hover:underline"
                                    >
                                        {citation.title} — {citation.url}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {message.role === 'user' && (
                <span className="mdi mdi-incognito-circle text-slate-500 dark:text-slate-400 text-3xl shrink-0"></span>
            )}
        </div>
    );
}

export default ChatAssistant;
