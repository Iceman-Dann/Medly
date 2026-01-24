
import React from 'react';
import { useHealth } from '../HealthContext';
import { SymptomCategory } from '../types';
import { Link } from 'react-router-dom';

const getCategoryIcon = (cat: SymptomCategory) => {
    switch (cat) {
        // Fix: Changed SymptomCategory.MIGRAINE to SymptomCategory.HEADACHE as MIGRAINE is not defined in the enum
        case SymptomCategory.HEADACHE: return 'warning';
        case SymptomCategory.SLEEP: return 'bedtime';
        case SymptomCategory.MEDICATION: return 'pill';
        case SymptomCategory.FATIGUE: return 'battery_low';
        default: return 'clinical_notes';
    }
};

const Dashboard: React.FC = () => {
    const { logs } = useHealth();

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-8 lg:ml-64">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">Health Overview</h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full w-fit">
                        <span className="material-symbols-outlined text-primary text-[16px]">verified_user</span>
                        <span className="text-primary text-[10px] font-bold uppercase tracking-widest">End-to-End Local Storage</span>
                    </div>
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
                {/* Timeline */}
                <div className="col-span-12 lg:col-span-7">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Recent History</h3>
                        <Link to="/logs" className="text-xs font-bold text-primary hover:underline">View All</Link>
                    </div>
                    <div className="space-y-0 relative">
                        {logs.length === 0 ? (
                            <div className="p-16 text-center bg-white dark:bg-rose-950/10 border-2 border-dashed border-slate-200 dark:border-rose-900/30 rounded-3xl">
                                <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-rose-900/40 mb-3">history</span>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Your health timeline is empty.</p>
                                <Link to="/log-new" className="text-primary text-sm font-bold mt-2 inline-block">Create your first log</Link>
                            </div>
                        ) : logs.slice(0, 5).map((log, i) => (
                            <div key={log.id} className="grid grid-cols-[48px_1fr] gap-x-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
                                        log.intensity > 7 
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-500 border-red-100' 
                                        : 'bg-primary/10 text-primary border-primary/20'
                                    }`}>
                                        <span className="material-symbols-outlined">{getCategoryIcon(log.category)}</span>
                                    </div>
                                    {i < logs.slice(0, 5).length - 1 && (
                                        <div className="w-[2px] bg-slate-200 dark:bg-rose-900/20 grow my-2"></div>
                                    )}
                                </div>
                                <div className="pb-8">
                                    <div className="bg-white dark:bg-rose-950/10 border border-slate-200 dark:border-rose-900/30 p-5 rounded-2xl shadow-sm hover:border-primary/40 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-base font-bold">{log.name}</p>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                                    log.intensity > 7 ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'
                                                }`}>
                                                    Intensity {log.intensity}/10
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-3 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </p>
                                        <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-xl">
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                                "{log.notes}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="col-span-12 lg:col-span-5 space-y-6">
                    <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-3xl shadow-lg shadow-primary/20 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                            <span className="material-symbols-outlined text-[80px]">auto_awesome</span>
                        </div>
                        <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                            AI Clinical Review
                        </h3>
                        <p className="text-xs text-white/80 leading-relaxed mb-6">
                            You have {logs.length} entries tracked. Our clinical engine can now synthesize a SOAP report to help you advocate for better care.
                        </p>
                        <Link 
                            to="/prep" 
                            className="w-full block text-center py-3 bg-white text-primary rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            Generate Provider Prep
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
