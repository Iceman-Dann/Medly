
import React, { useState } from 'react';
import { useHealth } from '../HealthContext';
import { gemini } from '../services/openai';
import { ClinicalReport } from '../types';

type TimeRange = '7d' | '30d' | '3m' | 'custom';

const PrepHub: React.FC = () => {
    const { logs, reports, addReport, removeReport } = useHealth();
    const [timeRange, setTimeRange] = useState<TimeRange>('7d');
    const [focusAreas, setFocusAreas] = useState<string[]>(['Pain Patterns', 'Cycle Correlation']);
    const [loading, setLoading] = useState(false);
    const [activeReportId, setActiveReportId] = useState<string | null>(null);

    const getFilteredLogs = (range: TimeRange) => {
        const now = Date.now();
        let cutoff = 0;
        if (range === '7d') cutoff = now - (7 * 24 * 60 * 60 * 1000);
        else if (range === '30d') cutoff = now - (30 * 24 * 60 * 60 * 1000);
        else if (range === '3m') cutoff = now - (90 * 24 * 60 * 60 * 1000);
        else cutoff = 0; // custom/all

        return logs.filter(log => log.timestamp >= cutoff);
    };

    const handleGenerate = async () => {
        const filteredLogs = getFilteredLogs(timeRange);
        if (filteredLogs.length === 0) return;

        setLoading(true);
        try {
            const [note, list] = await Promise.all([
                gemini.generateSOAPNote(filteredLogs, focusAreas),
                gemini.generateChecklist(filteredLogs, focusAreas)
            ]);

            await addReport({
                timeRange,
                focusAreas,
                soapNote: note,
                checklist: list
            });
            // The newest report will be the first one in the reports list due to sorting in Context
        } catch (error) {
            console.error("Report generation failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFocus = (area: string) => {
        setFocusAreas(prev => 
            prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
        );
    };

    const activeReport = activeReportId 
        ? reports.find(r => r.id === activeReportId) 
        : reports[0];

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-10 lg:p-12 lg:ml-64 animate-in fade-in duration-500">
            <header className="mb-10 flex flex-col gap-2">
                <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">Provider Prep Hub</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-normal max-w-2xl">Streamline your next clinical visit with data-driven reports and customized talking points.</p>
            </header>

            {/* New Report Settings */}
            <section className="bg-white dark:bg-rose-950/10 rounded-3xl border border-rose-100 dark:border-rose-900/30 p-8 shadow-sm mb-10">
                <div className="flex items-center gap-3 mb-8">
                    <span className="material-symbols-outlined text-primary text-2xl">settings_suggest</span>
                    <h2 className="text-2xl font-bold tracking-tight">New Report Settings</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="flex flex-col gap-8">
                        <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Time Range</p>
                            <div className="flex p-1 bg-rose-50 dark:bg-black/40 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                {(['7d', '30d', '3m', 'custom'] as TimeRange[]).map(r => (
                                    <button 
                                        key={r}
                                        onClick={() => setTimeRange(r)}
                                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                                            timeRange === r 
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                            : 'text-slate-500 hover:text-primary'
                                        }`}
                                    >
                                        {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '3m' ? '3 Months' : 'All Logs'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Focus Areas</p>
                            <div className="flex flex-wrap gap-2">
                                {['Pain Patterns', 'Visual Changes', 'Cycle Correlation', 'Sleep/Fatigue', 'Med Response'].map(area => (
                                    <button
                                        key={area}
                                        onClick={() => toggleFocus(area)}
                                        className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                                            focusAreas.includes(area)
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'border-rose-100 dark:border-rose-900/30 text-slate-500 hover:border-primary/50'
                                        }`}
                                    >
                                        {area}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-end items-center lg:items-end gap-6">
                        <div className="text-center lg:text-right max-w-xs">
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Configuration Ready</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                "{focusAreas.length} focus areas selected over the last {timeRange === '7d' ? 'week' : timeRange === '30d' ? 'month' : '90 days'}."
                            </p>
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={loading || logs.length === 0}
                            className="w-full lg:w-auto flex items-center justify-center gap-3 rounded-2xl h-14 px-10 bg-primary text-white text-base font-bold shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95 group disabled:opacity-50"
                        >
                            <span>{loading ? 'Analyzing Local Vault...' : 'Generate Clinical Summary'}</span>
                            <span className={`material-symbols-outlined transition-transform ${loading ? 'animate-spin' : 'group-hover:translate-x-1'}`}>
                                {loading ? 'sync' : 'arrow_forward'}
                            </span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Main Report View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold tracking-tight">Active Report Preview</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                                {activeReportId ? 'Archived View' : 'Latest Draft'}
                            </span>
                        </div>
                    </div>

                    {!activeReport ? (
                        <div className="bg-white dark:bg-rose-950/10 border-2 border-dashed border-rose-100 dark:border-rose-900/30 p-20 rounded-3xl text-center flex flex-col items-center gap-4">
                            <span className="material-symbols-outlined text-6xl text-slate-200">medical_services</span>
                            <p className="text-slate-400 font-bold">No active report. Click generate above to start.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-rose-950/5 border border-rose-100 dark:border-rose-900/30 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="bg-rose-50/50 dark:bg-rose-950/20 p-8 border-b border-rose-100 dark:border-rose-900/30 flex justify-between items-start">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">SOAP Clinical Summary</h3>
                                    <div className="flex items-center gap-3">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                            {new Date(activeReport.timestamp).toLocaleDateString()} • {activeReport.timeRange.toUpperCase()} Range
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-black/40 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">lock</span>
                                    End-to-End Encrypted
                                </div>
                            </div>
                            
                            <div className="p-10 space-y-10">
                                <div className="space-y-3">
                                    <span className="font-black text-primary uppercase text-xs tracking-widest flex items-center gap-2">
                                        <span className="w-1 h-3 bg-primary rounded-full"></span>
                                        [S] Subjective:
                                    </span>
                                    <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium pl-3">
                                        {activeReport.soapNote.subjective}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pl-3">
                                    <div className="bg-rose-50/30 dark:bg-black/20 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                                        <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Focus Areas</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                                            {activeReport.focusAreas.join(', ')}
                                        </p>
                                    </div>
                                    <div className="bg-rose-50/30 dark:bg-black/20 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/20 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Provider Readiness</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">96%</p>
                                        </div>
                                        <span className="material-symbols-outlined text-emerald-500">verified</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <span className="font-black text-primary uppercase text-xs tracking-widest flex items-center gap-2">
                                        <span className="w-1 h-3 bg-primary rounded-full"></span>
                                        [A] Assessment:
                                    </span>
                                    <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium pl-3">
                                        {activeReport.soapNote.assessment}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <span className="font-black text-primary uppercase text-xs tracking-widest flex items-center gap-2">
                                        <span className="w-1 h-3 bg-primary rounded-full"></span>
                                        [P] Plan:
                                    </span>
                                    <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium pl-3">
                                        {activeReport.soapNote.plan}
                                    </p>
                                </div>
                            </div>

                            <footer className="p-6 bg-slate-50 dark:bg-black/20 border-t border-rose-100 dark:border-rose-900/20 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                <span>Secured via Private Browser Sandbox</span>
                                <div className="flex gap-4">
                                    <button className="hover:text-primary transition-colors flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">print</span> Print PDF
                                    </button>
                                    <button className="hover:text-primary transition-colors flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">qr_code</span> Share Link
                                    </button>
                                </div>
                            </footer>
                        </div>
                    )}
                </div>

                {/* Sidebar Tips & Questions */}
                <div className="flex flex-col gap-8">
                    <h2 className="text-2xl font-bold tracking-tight">Provider Tips</h2>
                    
                    <div className="bg-white dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 p-8 rounded-3xl shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                            <span className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Smart Questions</span>
                        </div>
                        <div className="space-y-4">
                            {(!activeReport || activeReport.checklist.length === 0) ? (
                                <p className="text-xs text-slate-400 italic">Generate a report to see tailored provider questions.</p>
                            ) : activeReport.checklist.map((item, i) => (
                                <label key={i} className="flex items-start gap-4 p-3 rounded-xl hover:bg-primary/5 transition-all cursor-pointer group border border-transparent hover:border-primary/10">
                                    <input type="checkbox" className="mt-1 w-5 h-5 rounded border-rose-200 text-primary focus:ring-primary bg-transparent" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug mb-1 group-hover:text-primary transition-colors">
                                            {item.question}
                                        </p>
                                        <p className="text-[10px] text-slate-500 leading-tight italic">Context: {item.reason}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 border border-dashed border-rose-200 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all">
                            Add Custom Concern
                        </button>
                    </div>

                    <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-8 border border-primary/10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                            <p className="text-xs font-black uppercase tracking-widest text-primary">Advocacy Strategy</p>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Clinicians process standard SOAP language 3x faster than narrative descriptions. Bring this report to maximize your face-time during consultations.
                        </p>
                    </div>
                </div>
            </div>

            {/* The Vault - History Section */}
            <section className="flex flex-col gap-8 pb-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-2xl">inventory_2</span>
                        <h2 className="text-2xl font-bold tracking-tight">The Vault</h2>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{reports.length} Saved Reports</span>
                </div>

                {reports.length === 0 ? (
                    <div className="p-10 text-center border-2 border-dashed border-rose-100 dark:border-rose-900/20 rounded-3xl text-slate-400 text-sm font-medium">
                        Your report archive is empty.
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {reports.map((report) => (
                            <div 
                                key={report.id}
                                className={`flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-rose-950/10 p-6 rounded-2xl border transition-all hover:shadow-lg ${
                                    activeReportId === report.id || (!activeReportId && report.id === reports[0]?.id)
                                    ? 'border-primary shadow-md'
                                    : 'border-rose-100 dark:border-rose-900/30 shadow-sm'
                                }`}
                            >
                                <div className="flex items-center gap-6 w-full sm:w-auto mb-4 sm:mb-0">
                                    <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-black/40 flex items-center justify-center text-primary border border-rose-100 dark:border-rose-900/20">
                                        <span className="material-symbols-outlined text-3xl">description</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-black text-slate-900 dark:text-white">
                                            {new Date(report.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} Report
                                        </span>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span>{report.timeRange === '7d' ? 'Weekly' : report.timeRange === '30d' ? 'Monthly' : 'Quarterly'} Range</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span>{report.focusAreas.length} Areas Focus</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button 
                                        onClick={() => setActiveReportId(report.id)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-slate-200 dark:border-rose-900/40"
                                    >
                                        <span className="material-symbols-outlined text-lg">visibility</span>
                                        Preview
                                    </button>
                                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                                        <span className="material-symbols-outlined text-lg">qr_code</span>
                                        Vault Access
                                    </button>
                                    <button 
                                        onClick={() => removeReport(report.id)}
                                        className="p-2.5 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default PrepHub;
