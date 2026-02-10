
import React, { useState, useEffect } from 'react';
import { useHealth } from '../HealthContext';
import { SymptomLog } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/firebase';

const LogEntry: React.FC<{ log: SymptomLog; index: number; total: number; isFirst: boolean }> = ({ log, index, total, isFirst }) => {
    const [showAllTags, setShowAllTags] = useState(false);
    const symptomTags = log.name.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const formattedDate = new Date(log.timestamp).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const intensityColor = log.intensity <= 3 
        ? 'bg-slate-400' 
        : log.intensity <= 6 
        ? 'bg-primary/60' 
        : 'bg-primary';
    
    const intensityTextColor = log.intensity <= 3 
        ? 'text-slate-500' 
        : 'text-primary';
    
    const getCyclePhaseColors = (phase: string | undefined) => {
        if (!phase || phase === 'Do Not Disclose') {
            return 'bg-slate-100 dark:bg-rose-muted/30 text-slate-500 dark:text-rose-text border-slate-200 dark:border-rose-muted/40';
        }
        const phaseLower = phase.toLowerCase();
        switch (phaseLower) {
            case 'menstrual':
                return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40';
            case 'follicular':
                return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40';
            case 'ovulation':
                return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/40';
            case 'luteal':
                return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40';
            default:
                return 'bg-primary/5 text-primary border-primary/20';
        }
    };
    
    const cyclePhaseBg = getCyclePhaseColors(log.cyclePhase);

    return (
        <div className="relative pl-12">
            <div className={`absolute left-[15px] top-6 w-[7px] h-[7px] rounded-full ${
                isFirst ? 'bg-primary ring-4 ring-background-light dark:ring-background-dark' : 'bg-slate-300 dark:bg-rose-muted/50 ring-4 ring-background-light dark:ring-background-dark'
            } z-10`}></div>
            <details className="group" open={isFirst}>
                <summary className="cursor-pointer">
                    <div className="timeline-card bg-white dark:bg-surface-dark border border-slate-200 dark:border-rose-muted/40 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col gap-5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 dark:text-rose-text uppercase tracking-widest">
                                    {formattedDate}
                                </span>
                                {log.cyclePhase && log.cyclePhase !== 'Do Not Disclose' && (
                                    <span className={`px-3 py-1 ${cyclePhaseBg} text-[10px] font-bold uppercase tracking-widest rounded-md border`}>
                                        Phase: {log.cyclePhase}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center flex-wrap gap-2">
                                {(showAllTags ? symptomTags : symptomTags.slice(0, 3)).map((tag, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-rose-muted/20 rounded-lg border border-slate-100 dark:border-rose-muted/10">
                                        <div className="geo-dot w-[6px] h-[6px] rounded-full bg-primary"></div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{tag}</span>
                                    </div>
                                ))}
                                {symptomTags.length > 3 && !showAllTags && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowAllTags(true);
                                        }}
                                        className="text-[10px] font-bold text-rose-text hover:text-primary transition-colors cursor-pointer ml-2"
                                    >
                                        +{symptomTags.length - 3} ADDITIONAL
                                    </button>
                                )}
                                {symptomTags.length > 3 && showAllTags && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowAllTags(false);
                                        }}
                                        className="text-[10px] font-bold text-rose-text hover:text-primary transition-colors cursor-pointer ml-2"
                                    >
                                        SHOW LESS
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-12 pt-5 border-t border-slate-50 dark:border-rose-muted/10">
                                <div className="flex-1 max-w-[240px]">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Symptom Intensity</span>
                                        <span className={`text-[10px] font-bold ${intensityTextColor}`}>
                                            Level {String(log.intensity).padStart(2, '0')} / 10
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-rose-muted/30 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${intensityColor}`}
                                            style={{ width: `${(log.intensity / 10) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                {log.triggers && log.triggers.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {log.triggers.map((trigger: string, idx: number) => (
                                            <span 
                                                key={idx}
                                                className="px-2 py-1 bg-slate-100 dark:bg-rose-muted/30 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded border border-slate-200 dark:border-rose-muted/40 uppercase"
                                            >
                                                {trigger}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </summary>
                <div className="mt-2 p-8 bg-white dark:bg-surface-dark border border-slate-200 dark:border-rose-muted/40 rounded-2xl">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">edit_note</span> 
                        USER NOTES & OBSERVATIONS
                    </h4>
                    {log.notes ? (
                        <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium space-y-4">
                            {log.notes.split('\n').map((paragraph, idx) => (
                                <p key={idx}>{paragraph}</p>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic">No specific observations were recorded for this timestamp.</p>
                    )}
                    {log.visualEvidence && (
                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-rose-muted/20">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">image</span> 
                                VISUAL EVIDENCE
                            </h4>
                            {log.visualEvidence.startsWith('data:image/') ? (
                                <img 
                                    src={log.visualEvidence} 
                                    alt="Evidence" 
                                    className="max-w-full max-h-64 rounded-lg object-contain border border-slate-200 dark:border-rose-muted/30"
                                />
                            ) : (
                                <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-rose-muted/30 rounded-lg">
                                    <span className="material-symbols-outlined text-primary">description</span>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">PDF Document Attached</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </details>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { logs } = useHealth();
    const navigate = useNavigate();
    const displayedLogs = logs.slice(0, 5);
    
    // Check authentication
    useEffect(() => {
        const user = getCurrentUser();
        const anonymousUser = localStorage.getItem('anonymous_user');
        
        if (!user && !anonymousUser) {
            navigate('/auth');
        }
    }, [navigate]);

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-8 lg:ml-64">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">Health Overview</h2>
                </div>
                <div className="flex items-center gap-3">
                    <Link 
                        to="/log-new"
                        className="flex-1 md:flex-none bg-primary text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 active:scale-95"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Log New Symptom
                    </Link>
                </div>
            </header>

            {/* Quick Navigation Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <Link to="/log-new" className="group bg-white dark:bg-rose-950/10 border border-slate-200 dark:border-rose-900/30 p-6 rounded-3xl hover:border-primary/50 transition-all">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">add_notes</span>
                    </div>
                    <h4 className="font-bold text-lg mb-1">Track Symptom</h4>
                    <p className="text-xs text-slate-500">Record a new health event in your local vault.</p>
                </Link>
                <Link to="/chat" className="group bg-white dark:bg-rose-950/10 border border-slate-200 dark:border-rose-900/30 p-6 rounded-3xl hover:border-primary/50 transition-all">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">smart_toy</span>
                    </div>
                    <h4 className="font-bold text-lg mb-1">AI Assistant</h4>
                    <p className="text-xs text-slate-500">Analyze trends or prepare for a consultation.</p>
                </Link>
                <Link to="/prep" className="group bg-white dark:bg-rose-950/10 border border-slate-200 dark:border-rose-900/30 p-6 rounded-3xl hover:border-primary/50 transition-all">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">clinical_notes</span>
                    </div>
                    <h4 className="font-bold text-lg mb-1">Provider Report</h4>
                    <p className="text-xs text-slate-500">Generate professional SOAP notes for your doctor.</p>
                </Link>
            </section>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-7">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Recent History</h3>
                        <Link to="/logs" className="text-xs font-bold text-primary hover:underline">View All</Link>
                    </div>
                    <div className="space-y-4 relative">
                        {displayedLogs.length > 0 && (
                            <div className="absolute left-[18px] top-4 bottom-4 w-px bg-slate-200 dark:bg-rose-muted/20"></div>
                        )}
                        {logs.length === 0 ? (
                            <div className="p-16 text-center bg-white dark:bg-surface-dark border-2 border-dashed border-slate-200 dark:border-rose-muted/40 rounded-2xl">
                                <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-rose-muted/50 mb-3">history</span>
                                <p className="text-slate-500 dark:text-rose-text font-medium">Your health timeline is empty.</p>
                                <Link to="/log-new" className="text-primary text-sm font-bold mt-2 inline-block hover:underline">Create your first log</Link>
                            </div>
                        ) : displayedLogs.map((log, i) => (
                            <LogEntry 
                                key={log.id} 
                                log={log} 
                                index={i} 
                                total={displayedLogs.length} 
                                isFirst={i === 0}
                            />
                        ))}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-5 space-y-8">
                    <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-xl">
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-primary">lightbulb</span>
                            <div>
                                <p className="text-sm font-bold mb-1 text-slate-900 dark:text-slate-100">Privacy Tip</p>
                                <p className="text-xs text-slate-600 dark:text-rose-text leading-relaxed">Your data never leaves this browser. Remember to export a backup to your personal cloud if you change devices.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
