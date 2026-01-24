
import React, { useState } from 'react';
import { useHealth } from '../HealthContext';
import { gemini } from '../services/gemini';
import { ClinicalReport } from '../types';

type TimeRange = '7d' | '30d' | '3m' | 'custom';

const CalendarView: React.FC<{
    startDate: Date | null;
    endDate: Date | null;
    onStartDateChange: (date: Date | null) => void;
    onEndDateChange: (date: Date | null) => void;
}> = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const days: (Date | null)[] = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const normalizeDate = (date: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const isDateInRange = (date: Date) => {
        if (!startDate || !endDate) return false;
        const normalized = normalizeDate(date);
        const start = normalizeDate(startDate);
        const end = normalizeDate(endDate);
        return normalized >= start && normalized <= end;
    };

    const isDateSelected = (date: Date) => {
        if (!startDate && !endDate) return false;
        const normalized = normalizeDate(date);
        if (startDate && normalized.getTime() === normalizeDate(startDate).getTime()) return true;
        if (endDate && normalized.getTime() === normalizeDate(endDate).getTime()) return true;
        return false;
    };

    const handleDateClick = (date: Date) => {
        const normalized = normalizeDate(date);
        if (!startDate || (startDate && endDate)) {
            onStartDateChange(normalized);
            onEndDateChange(null);
        } else if (startDate && !endDate) {
            const normalizedStart = normalizeDate(startDate);
            if (normalized < normalizedStart) {
                onEndDateChange(normalizedStart);
                onStartDateChange(normalized);
            } else {
                onEndDateChange(normalized);
            }
        }
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const today = new Date();
    const days = getDaysInMonth(currentMonth);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white dark:bg-rose-950/10 rounded-2xl border border-rose-100 dark:border-rose-900/30 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    title="Previous month"
                >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Go to today"
                    >
                        Today
                    </button>
                </div>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    title="Next month"
                >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 py-2">
                        {day}
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
                {days.map((date, idx) => {
                    if (!date) {
                        return <div key={idx} className="aspect-square" />;
                    }
                    
                    const todayNormalized = normalizeDate(today);
                    const dateNormalized = normalizeDate(date);
                    const isPast = dateNormalized < todayNormalized;
                    const inRange = isDateInRange(date);
                    const selected = isDateSelected(date);
                    const isToday = dateNormalized.getTime() === todayNormalized.getTime();
                    
                    return (
                        <button
                            key={idx}
                            onClick={() => handleDateClick(date)}
                            className={`aspect-square rounded-lg text-xs font-bold transition-all ${
                                selected
                                    ? 'bg-primary text-white shadow-md'
                                    : inRange
                                    ? 'bg-primary/20 text-primary'
                                    : isToday
                                    ? 'bg-rose-50 dark:bg-rose-900/20 text-primary border-2 border-primary'
                                    : isPast
                                    ? 'text-slate-500 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                            }`}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
            
            {(startDate || endDate) && (
                <div className="mt-4 pt-4 border-t border-rose-100 dark:border-rose-900/30 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-500">Start:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                            {startDate ? startDate.toLocaleDateString() : 'Not selected'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-500">End:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                            {endDate ? endDate.toLocaleDateString() : 'Not selected'}
                        </span>
                    </div>
                    {(startDate || endDate) && (
                        <button
                            onClick={() => {
                                onStartDateChange(null);
                                onEndDateChange(null);
                            }}
                            className="mt-2 text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest"
                        >
                            Clear Selection
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const PrepHub: React.FC = () => {
    const { logs, reports, addReport, removeReport } = useHealth();
    const [timeRange, setTimeRange] = useState<TimeRange>('7d');
    const [focusAreas, setFocusAreas] = useState<string[]>(['Pain Patterns', 'Cycle Correlation']);
    const [loading, setLoading] = useState(false);
    const [activeReportId, setActiveReportId] = useState<string | null>(null);
    const [customFocusText, setCustomFocusText] = useState<string>('');
    const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
    const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
    const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

    const getFilteredLogs = (range: TimeRange) => {
        const now = Date.now();
        let startCutoff = 0;
        let endCutoff = now;
        
        if (range === '7d') {
            startCutoff = now - (7 * 24 * 60 * 60 * 1000);
        } else if (range === '30d') {
            startCutoff = now - (30 * 24 * 60 * 60 * 1000);
        } else if (range === '3m') {
            startCutoff = now - (90 * 24 * 60 * 60 * 1000);
        } else if (range === 'custom') {
            if (customStartDate) {
                const start = new Date(customStartDate);
                start.setHours(0, 0, 0, 0);
                startCutoff = start.getTime();
            }
            if (customEndDate) {
                const end = new Date(customEndDate);
                end.setHours(23, 59, 59, 999);
                endCutoff = end.getTime();
            } else {
                endCutoff = now;
            }
        } else {
            startCutoff = 0;
        }

        return logs.filter(log => {
            if (range === 'custom' && customStartDate && customEndDate) {
                return log.timestamp >= startCutoff && log.timestamp <= endCutoff;
            }
            return log.timestamp >= startCutoff && log.timestamp <= endCutoff;
        });
    };

    const handleGenerate = async () => {
        const filteredLogs = getFilteredLogs(timeRange);
        if (filteredLogs.length === 0) return;

        setLoading(true);
        try {
            const areasToUse = customFocusText.trim() 
                ? [...focusAreas, customFocusText.trim()]
                : focusAreas;
            
            const rangeToStore = timeRange === 'custom' && customStartDate && customEndDate
                ? `custom:${customStartDate.toISOString().split('T')[0]}_${customEndDate.toISOString().split('T')[0]}`
                : timeRange;
            
            const [note, list] = await Promise.all([
                gemini.generateSOAPNote(filteredLogs, areasToUse),
                gemini.generateChecklist(filteredLogs, areasToUse)
            ]);

            await addReport({
                timeRange: rangeToStore,
                focusAreas: areasToUse,
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

    const toggleCustom = () => {
        if (showCustomInput) {
            setShowCustomInput(false);
            setCustomFocusText('');
        } else {
            setShowCustomInput(true);
        }
    };

    const formatTimeRange = (range: string) => {
        if (range.startsWith('custom:')) {
            const dates = range.replace('custom:', '').split('_');
            if (dates.length === 2) {
                const start = new Date(dates[0]);
                const end = new Date(dates[1]);
                return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
            }
        }
        if (range === '7d') return 'Weekly';
        if (range === '30d') return 'Monthly';
        if (range === '3m') return 'Quarterly';
        return range.toUpperCase();
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
                            <div className="flex p-1 bg-rose-50 dark:bg-black/40 rounded-2xl border border-rose-100 dark:border-rose-900/30 mb-3">
                                {(['7d', '30d', '3m', 'custom'] as TimeRange[]).map(r => (
                                    <button 
                                        key={r}
                                        onClick={() => {
                                            setTimeRange(r);
                                            if (r !== 'custom') {
                                                setCustomStartDate(null);
                                                setCustomEndDate(null);
                                            }
                                        }}
                                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                                            timeRange === r 
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                                : 'text-slate-500 hover:text-primary'
                                        }`}
                                    >
                                        {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '3m' ? '3 Months' : 'Custom'}
                                    </button>
                                ))}
                            </div>
                            {timeRange === 'custom' && (
                                <CalendarView
                                    startDate={customStartDate}
                                    endDate={customEndDate}
                                    onStartDateChange={setCustomStartDate}
                                    onEndDateChange={setCustomEndDate}
                                />
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Focus Areas</p>
                            <div className="flex flex-wrap gap-2 mb-3">
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
                                <button
                                    onClick={toggleCustom}
                                    className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                                        showCustomInput
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'border-rose-100 dark:border-rose-900/30 text-slate-500 hover:border-primary/50'
                                    }`}
                                >
                                    Custom
                                </button>
                            </div>
                            {showCustomInput && (
                                <input
                                    type="text"
                                    value={customFocusText}
                                    onChange={(e) => setCustomFocusText(e.target.value)}
                                    placeholder="Enter custom focus area..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-white dark:bg-rose-950/10 text-sm font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col justify-end items-center lg:items-end gap-6">
                        <div className="text-center lg:text-right max-w-xs">
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Configuration Ready</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                "{focusAreas.length + (customFocusText.trim() ? 1 : 0)} focus areas selected{timeRange === 'custom' && customStartDate && customEndDate ? ` from ${customStartDate.toLocaleDateString()} to ${customEndDate.toLocaleDateString()}` : timeRange === '7d' ? ' over the last week' : timeRange === '30d' ? ' over the last month' : timeRange === '3m' ? ' over the last 90 days' : ''}."
                            </p>
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={loading || logs.length === 0 || (timeRange === 'custom' && (!customStartDate || !customEndDate))}
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
                                            {new Date(activeReport.timestamp).toLocaleDateString()} • {formatTimeRange(activeReport.timeRange)} Range
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
                                            <span>{formatTimeRange(report.timeRange)} Range</span>
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
