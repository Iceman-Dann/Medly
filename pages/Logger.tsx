
import React, { useState } from 'react';
import { useHealth } from '../HealthContext';
import { SymptomCategory } from '../types';
import { useNavigate } from 'react-router-dom';

const cyclePhases = ['Menstrual', 'Follicular', 'Ovulation', 'Luteal', 'Unknown'];
const commonTriggers = ['After eating', 'Morning', 'Evening', 'After exercise', 'During stress', 'Before bed'];

const Logger: React.FC = () => {
    const { addLog } = useHealth();
    const navigate = useNavigate();

    // Form state
    const [category, setCategory] = useState<SymptomCategory>(SymptomCategory.PAIN);
    const [cyclePhase, setCyclePhase] = useState('Menstrual');
    const [intensity, setIntensity] = useState(4);
    const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
    const [possibleTriggerInput, setPossibleTriggerInput] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleTrigger = (trigger: string) => {
        setSelectedTriggers(prev => 
            prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
        );
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const finalTriggers = [...selectedTriggers];
            if (possibleTriggerInput.trim()) {
                finalTriggers.push(possibleTriggerInput.trim());
            }

            await addLog({
                name: category,
                category,
                intensity,
                notes,
                cyclePhase,
                triggers: finalTriggers
            });
            navigate('/');
        } catch (error) {
            console.error("Failed to save log:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const clearForm = () => {
        setCategory(SymptomCategory.PAIN);
        setCyclePhase('Menstrual');
        setIntensity(4);
        setSelectedTriggers([]);
        setPossibleTriggerInput('');
        setNotes('');
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 lg:ml-64 animate-in fade-in duration-500">
            <div className="w-full flex flex-col gap-8">
                {/* Progress Card */}
                <div className="flex flex-col gap-3 p-6 bg-white dark:bg-rose-950/20 rounded-2xl shadow-sm border border-pink-50 dark:border-pink-900/30">
                    <div className="flex gap-6 justify-between items-center">
                        <p className="text-base font-bold text-slate-800 dark:text-pink-100">Logging Symptoms</p>
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">Entry in Progress</p>
                    </div>
                    <div className="rounded-full bg-pink-50 dark:bg-pink-950/40 h-2.5 overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: '100%' }}></div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-[9px] font-black text-slate-400 dark:text-pink-400/60 uppercase tracking-widest text-center mt-1">
                        <span className="text-primary">Type</span>
                        <span className="text-primary">Cycle</span>
                        <span className="text-primary">Intensity</span>
                        <span className="text-primary">Evidence</span>
                        <span className="text-primary">Details</span>
                    </div>
                </div>

                {/* Form Body */}
                <div className="bg-white dark:bg-rose-950/10 rounded-3xl shadow-xl border border-pink-50 dark:border-pink-900/30 p-8 flex flex-col gap-12">
                    
                    {/* Step 1: Category */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl">list_alt</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-pink-50">1. What are you experiencing?</h2>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {Object.values(SymptomCategory).map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                                        category === cat 
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                                        : 'bg-white dark:bg-black/20 text-slate-600 dark:text-pink-300 border-slate-200 dark:border-pink-900/50 hover:border-primary'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Step 2: Cycle Phase */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-pink-50">2. Current Cycle Phase</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {cyclePhases.map(phase => (
                                <button
                                    key={phase}
                                    onClick={() => setCyclePhase(phase)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                                        cyclePhase === phase
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-slate-100 dark:border-pink-900/30 text-slate-500 dark:text-pink-400'
                                    }`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">{phase}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Step 3: Intensity */}
                    <section className="flex flex-col gap-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-xl">equalizer</span>
                                </div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-pink-50">3. Intensity & Context</h2>
                            </div>
                            <div className="px-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-pink-300 mb-6 block">Severity Scale: {intensity}/10</label>
                                <div className="relative pt-1">
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="10" 
                                        value={intensity} 
                                        onChange={(e) => setIntensity(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-pink-950 rounded-lg appearance-none cursor-pointer accent-primary"
                                        style={{
                                            background: `linear-gradient(to right, #22c55e, #eab308, #ef4444)`
                                        }}
                                    />
                                    <div className="flex justify-between mt-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        <span className="text-emerald-600 dark:text-emerald-400">Mild</span>
                                        <span>Moderate</span>
                                        <span className="text-red-600 dark:text-red-400">Severe</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-pink-300">When does it occur? (Common Tags)</label>
                            <div className="flex flex-wrap gap-2">
                                {commonTriggers.map(trigger => (
                                    <button
                                        key={trigger}
                                        onClick={() => toggleTrigger(trigger)}
                                        className={`px-4 py-1.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                            selectedTriggers.includes(trigger)
                                            ? 'border-primary bg-primary text-white shadow-sm'
                                            : 'border-slate-100 dark:border-pink-900/30 text-slate-500 dark:text-pink-400'
                                        }`}
                                    >
                                        {trigger}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Step 4: Evidence */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-xl">lock_open</span>
                                </div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-pink-50">4. Secure Image Upload</h2>
                            </div>
                            <span className="flex items-center gap-1.5 text-[9px] font-black bg-primary/10 text-primary px-3 py-1.5 rounded-full uppercase tracking-widest border border-primary/20">
                                <span className="material-symbols-outlined !text-[14px]">lock</span> 
                                End-to-End Encrypted
                            </span>
                        </div>
                        <div className="border-2 border-dashed border-pink-100 dark:border-pink-900/50 bg-slate-50 dark:bg-black/20 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                            <div className="size-16 rounded-full bg-white dark:bg-pink-950/20 shadow-sm border border-pink-100 dark:border-pink-900/50 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                                <span className="material-symbols-outlined !text-4xl">cloud_upload</span>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-slate-700 dark:text-pink-50">Upload Medical Documentation</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">PNG, JPG or PDF (max. 10MB)</p>
                            </div>
                        </div>
                    </section>

                    {/* Step 5: Triggers & Notes */}
                    <section className="flex flex-col gap-8">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-pink-50">5. Triggers & Notes</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-8">
                            <div className="flex flex-col gap-3">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Possible Triggers</label>
                                <input 
                                    value={possibleTriggerInput}
                                    onChange={(e) => setPossibleTriggerInput(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-black/20 border-pink-100 dark:border-pink-900/50 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
                                    placeholder="What do you believe caused this? (e.g. caffeine, poor sleep)"
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Narrative Summary</label>
                                <textarea 
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    className="w-full bg-slate-50 dark:bg-black/20 border-pink-100 dark:border-pink-900/50 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm resize-none"
                                    placeholder="Provide additional clinical context or details about your experience..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Footer Actions */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-pink-50 dark:border-pink-900/30">
                        <button 
                            onClick={clearForm}
                            className="w-full md:w-auto px-8 py-3 rounded-xl font-bold text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">restart_alt</span>
                            Clear Form
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="w-full md:w-auto px-12 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 text-sm active:scale-95"
                        >
                            {isSubmitting ? 'Securing Entry...' : 'Submit Symptom Log'}
                            <span className="material-symbols-outlined">verified</span>
                        </button>
                    </div>
                </div>

                {/* Privacy Footer */}
                <div className="flex flex-col items-center gap-4 text-center pb-20 pt-4">
                    <div className="flex items-center gap-2 text-primary dark:text-pink-400/60 text-[10px] font-black uppercase tracking-widest">
                        <span className="material-symbols-outlined !text-sm">security</span>
                        Sovereign Patient Records
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-pink-400/40 max-w-lg leading-relaxed px-4 font-medium uppercase tracking-wider">
                        Symra uses zero-knowledge local encryption. Your identity is decoupled from your health data. Only you can authorize access to these records for clinical review.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Logger;
