
import React, { useState, useRef, useEffect } from 'react';
import { useHealth } from '../HealthContext';
import { getLogs, saveChatMessage, getChatHistory, getKBDocumentById } from '@/lib/db';
import { redactPII, detectEmergencySymptoms } from '@/lib/sanitize';
import { retrieveEvidence } from '@/lib/retrieval';
import { buildPatternCard } from '@/lib/patterns/buildPatternCard';
import { buildSystemPrompt } from '@/lib/chat/systemPrompt';
import { ensureKnowledgeBaseSeeded } from '@/lib/kb/seed';
import { EmergencyAlert } from '@/components/EmergencyAlert';
import { gemini } from '../services/gemini';
import type { SymptomLog, Log, PatternCard, RagEvidence, KBDocument, ChatMessage } from '../types';

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

const ChatAssistant: React.FC = () => {
    const { isMedicalContextEnabled, setMedicalContextEnabled, logs } = useHealth();
    const [messages, setMessages] = useState<EnhancedMessage[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [patternCard, setPatternCard] = useState<PatternCard | null>(null);
    const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
    const [threadId] = useState(() => crypto.randomUUID());
    const scrollRef = useRef<HTMLDivElement>(null);

    // Seed knowledge base and load pattern card on mount
    useEffect(() => {
        async function loadContext() {
            try {
                await ensureKnowledgeBaseSeeded();

                if (isMedicalContextEnabled) {
                    const logsForPattern = convertSymptomLogsToLogs(logs.slice(0, 30));
                    if (logsForPattern.length > 0) {
                        const card = buildPatternCard(logsForPattern);
                        setPatternCard(card);
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

    const handleSend = async () => {
        if (!input.trim() || isStreaming) return;

        const userMessage = input.trim();
        setInput('');

        if (detectEmergencySymptoms(userMessage)) {
            setShowEmergencyAlert(true);
        }

        const redactedMessage = redactPII(userMessage);

        const userMsgId = crypto.randomUUID();
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

        const assistantMsgId = crypto.randomUUID();
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

            if (isMedicalContextEnabled) {
                const logsForPattern = convertSymptomLogsToLogs(logs.slice(0, 30));
                if (logsForPattern.length > 0) {
                    currentPatternCard = buildPatternCard(logsForPattern);
                    setPatternCard(currentPatternCard);
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
            } else {
                // Even when medical context is disabled, try to retrieve evidence from user message
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

            const historyForGemini = messages.slice(-10).map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
            }));

            let systemPrompt = '';
            if (currentPatternCard && ragEvidence.length > 0) {
                systemPrompt = buildSystemPrompt(currentPatternCard, ragEvidence);
            }

            const fullResponse = await gemini.chat(
                redactedMessage,
                [],
                historyForGemini,
                systemPrompt
            );

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
            setMessages(prev => prev.map(m => 
                m.id === assistantMsgId 
                    ? { ...m, content: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later." }
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
                            Symra AI Assistant
                        </h2>
                        <p className="text-xs text-slate-500">Professional medical empowerment companion</p>
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
                            <h3 className="text-xl font-bold">Hello, I'm Symra</h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                                How can I help you understand your symptoms today? I can analyze your logs, explain clinical terms, or help you prepare questions for your doctor.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {["Review my last 3 days", "Help me describe pelvic pain", "Prepare for my OBGYN visit"].map(q => (
                                    <button 
                                        key={q}
                                        onClick={() => setInput(q)}
                                        className="text-xs font-semibold px-4 py-2 bg-white dark:bg-rose-950/20 border border-primary/20 rounded-full hover:bg-primary hover:text-white transition-all"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <MessageWithCitations key={msg.id} message={msg} />
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
                    <div className="relative flex items-center">
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Describe your symptoms or ask a question..."
                            className="w-full bg-slate-50 dark:bg-rose-950/20 border border-slate-200 dark:border-rose-900/30 rounded-2xl py-4 pl-6 pr-16 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isStreaming}
                            className="absolute right-3 bg-primary p-2.5 rounded-xl text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            <span className="material-symbols-outlined font-bold">send</span>
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-3 uppercase tracking-widest">
                        Symra AI is not a replacement for professional medical advice.
                    </p>
                </div>
            </footer>
        </div>
    );
};

function MessageWithCitations({ message }: { message: EnhancedMessage }) {
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

    const parseResponseSections = (content: string) => {
        const sections: Record<string, string[]> = {};
        const lines = content.split('\n');
        let currentSection: string | null = null;
        let currentItems: string[] = [];

        for (const line of lines) {
            const sectionMatch = line.match(/^##\s+(.+)$/);
            if (sectionMatch) {
                if (currentSection) {
                    sections[currentSection] = currentItems;
                }
                currentSection = sectionMatch[1];
                currentItems = [];
            } else if (line.trim().startsWith('- ')) {
                currentItems.push(line.trim().substring(2));
            } else if (line.trim() && currentSection) {
                currentItems.push(line.trim());
            }
        }
        if (currentSection) {
            sections[currentSection] = currentItems;
        }

        if (Object.keys(sections).length === 0) {
            return null;
        }

        return sections;
    };

    const sections = message.role === 'assistant' && message.content 
        ? parseResponseSections(message.content) 
        : null;

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
                    {sections ? (
                        <div className="space-y-4 text-sm">
                            {Object.entries(sections).map(([sectionTitle, items]) => (
                                <div key={sectionTitle} className="space-y-2">
                                    <h3 className="font-semibold text-base">{sectionTitle}</h3>
                                    <ul className="space-y-1.5 list-disc list-inside">
                                        {items.map((item, idx) => (
                                            <li key={idx} className="text-sm">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content || (
                                <span className="inline-flex items-center gap-1">
                                    <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                </span>
                            )}
                        </p>
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
                <div className="size-10 rounded-full bg-cover bg-center shrink-0 border-2 border-primary/30" style={{ backgroundImage: `url('https://picsum.photos/seed/user/100')` }}></div>
            )}
        </div>
    );
}

export default ChatAssistant;
