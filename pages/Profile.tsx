
import React, { useState, useEffect } from 'react';
import { useHealth } from '../HealthContext';
import { useFocusMode } from '../FocusModeContext';
import { HealthMode } from '../types';

const modeOptions = [
    { 
        mode: HealthMode.MENSTRUAL, 
        icon: 'calendar_month', 
        description: 'Cycle tracking, PMS management & hormone insights.' 
    },
    { 
        mode: HealthMode.FERTILITY, 
        icon: 'favorite', 
        description: 'Ovulation tracking, BBT logging & conception support.' 
    },
    { 
        mode: HealthMode.POSTPARTUM, 
        icon: 'child_care', 
        description: 'Recovery monitoring, lactation & pelvic health.' 
    },
    { 
        mode: HealthMode.PERIMENOPAUSE, 
        icon: 'health_and_beauty', 
        description: 'Symptom relief, transition monitoring & bone health.' 
    }
];

const Profile: React.FC = () => {
    const { profile, medications, updateProfile, addMedication, removeMedication, toggleMedicationStatus } = useHealth();
    const { setFocusMode } = useFocusMode();
    const [selectedMode, setSelectedMode] = useState<HealthMode>(profile.activeMode);
    const [isAddingMed, setIsAddingMed] = useState(false);
    const [newMed, setNewMed] = useState({ name: '', dosage: '', schedule: '' });
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    // Map HealthMode to FocusModeId
    const mapHealthModeToFocusMode = (mode: HealthMode): 'menstrual' | 'fertility' | 'post_partum' | 'perimenopause' | null => {
        switch (mode) {
            case HealthMode.MENSTRUAL:
                return 'menstrual';
            case HealthMode.FERTILITY:
                return 'fertility';
            case HealthMode.POSTPARTUM:
                return 'post_partum';
            case HealthMode.PERIMENOPAUSE:
                return 'perimenopause';
            default:
                return null;
        }
    };

    // Sync focus mode when profile loads (if user already has an activeMode set)
    useEffect(() => {
        if (profile.activeMode && profile.activeMode !== HealthMode.GENERAL) {
            const focusModeId = mapHealthModeToFocusMode(profile.activeMode);
            if (focusModeId) {
                setFocusMode(focusModeId);
            }
        }
    }, [profile.activeMode, setFocusMode]);

    const handleModeSelect = (mode: HealthMode) => {
        setSelectedMode(mode);
        // Update focus mode immediately when card is clicked
        const focusModeId = mapHealthModeToFocusMode(mode);
        setFocusMode(focusModeId);
    };

    const handleSaveChanges = async () => {
        await updateProfile({ activeMode: selectedMode });
        // Also ensure focus mode is set
        const focusModeId = mapHealthModeToFocusMode(selectedMode);
        setFocusMode(focusModeId);
        setSaveStatus('Changes saved to local vault');
        setTimeout(() => setSaveStatus(null), 3000);
    };

    const handleAddMed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMed.name) return;
        await addMedication({ ...newMed, status: 'active' });
        setNewMed({ name: '', dosage: '', schedule: '' });
        setIsAddingMed(false);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-8 lg:ml-64 animate-in fade-in duration-500">
            <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-4xl font-black leading-tight tracking-tight">Your Health Journey</h2>
                    <p className="text-[#9a4c73] dark:text-white/60 text-base font-normal">Customize your experience to match your current life stage and medical needs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-100 dark:border-green-800">
                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 mr-2" style={{ fontSize: '16px' }}>verified_user</span>
                        <span className="text-green-700 dark:text-green-300 text-[10px] font-bold uppercase tracking-wider">Local Storage</span>
                    </div>
                    <button 
                        onClick={handleSaveChanges}
                        className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
                    >
                        Save Changes
                    </button>
                </div>
            </header>

            {saveStatus && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2 animate-bounce">
                    <span className="material-symbols-outlined">check_circle</span>
                    {saveStatus}
                </div>
            )}

            {/* Phase-Specific Modes */}
            <section className="bg-white dark:bg-[#1b0d14] rounded-3xl shadow-sm border border-[#f3e7ed] dark:border-[#3d2431] overflow-hidden mb-8">
                <div className="p-6 border-b border-[#f3e7ed] dark:border-[#3d2431] flex items-center justify-between">
                    <h2 className="text-xl font-bold">Phase-Specific Modes</h2>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">1 Mode Active</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                    {modeOptions.map((opt) => (
                        <div 
                            key={opt.mode}
                            onClick={() => handleModeSelect(opt.mode)}
                            className={`group relative flex flex-col gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md ${
                                selectedMode === opt.mode 
                                ? 'border-primary bg-primary/5' 
                                : 'border-[#f3e7ed] dark:border-[#3d2431] bg-background-light/50 dark:bg-white/5 hover:border-primary/40'
                            }`}
                        >
                            {selectedMode === opt.mode && (
                                <div className="absolute top-3 right-3">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>check_circle</span>
                                </div>
                            )}
                            <div className={`size-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                                selectedMode === opt.mode 
                                ? 'bg-primary/20 text-primary' 
                                : 'bg-[#f3e7ed] dark:bg-[#3d2431] text-[#9a4c73] dark:text-white/60 group-hover:text-primary group-hover:bg-primary/20'
                            }`}>
                                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{opt.icon}</span>
                            </div>
                            <div>
                                <p className="text-base font-bold">{opt.mode}</p>
                                <p className="text-[#9a4c73] dark:text-white/60 text-xs leading-relaxed mt-1">{opt.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Medication Management */}
            <section className="bg-white dark:bg-[#1b0d14] rounded-3xl shadow-sm border border-[#f3e7ed] dark:border-[#3d2431] overflow-hidden">
                <div className="p-6 border-b border-[#f3e7ed] dark:border-[#3d2431] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold">Medication Management</h2>
                        <span className="material-symbols-outlined text-[#9a4c73] text-[20px]">pill</span>
                    </div>
                    <button 
                        onClick={() => setIsAddingMed(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-sm font-bold transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Add Medication
                    </button>
                </div>

                {isAddingMed && (
                    <div className="p-6 border-b border-[#f3e7ed] dark:border-[#3d2431] bg-primary/5">
                        <form onSubmit={handleAddMed} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</label>
                                <input 
                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-rose-900/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="e.g. Magnesium"
                                    value={newMed.name}
                                    onChange={e => setNewMed({...newMed, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Dosage</label>
                                <input 
                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-rose-900/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="e.g. 200mg"
                                    value={newMed.dosage}
                                    onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Schedule</label>
                                <input 
                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-rose-900/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="e.g. Daily at night"
                                    value={newMed.schedule}
                                    onChange={e => setNewMed({...newMed, schedule: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold grow">Save Med</button>
                                <button type="button" onClick={() => setIsAddingMed(false)} className="bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-wider text-[#9a4c73] dark:text-white/40 border-b border-[#f3e7ed] dark:border-[#3d2431]">
                                    <th className="pb-3 font-black">Medication Name</th>
                                    <th className="pb-3 font-black">Dosage</th>
                                    <th className="pb-3 font-black">Schedule</th>
                                    <th className="pb-3 font-black">Status</th>
                                    <th className="pb-3 text-right font-black">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f3e7ed] dark:divide-[#3d2431]">
                                {medications.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-slate-400 text-sm italic">No medications listed yet</td>
                                    </tr>
                                ) : medications.map((med) => (
                                    <tr key={med.id} className="group hover:bg-background-light dark:hover:bg-white/5 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-8 rounded-lg flex items-center justify-center ${med.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>pill</span>
                                                </div>
                                                <span className={`text-sm font-bold ${med.status === 'paused' ? 'text-slate-400 line-through' : ''}`}>{med.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-[#9a4c73] dark:text-white/60">{med.dosage}</td>
                                        <td className="py-4 text-sm text-[#9a4c73] dark:text-white/60">{med.schedule}</td>
                                        <td className="py-4">
                                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${
                                                med.status === 'active' 
                                                ? 'bg-emerald-100 text-emerald-600' 
                                                : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {med.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => toggleMedicationStatus(med.id)}
                                                    className={`p-2 rounded-lg ${med.status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                    title={med.status === 'active' ? 'Pause' : 'Resume'}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{med.status === 'active' ? 'pause' : 'play_arrow'}</span>
                                                </button>
                                                <button 
                                                    onClick={() => removeMedication(med.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Tip */}
                <div className="bg-primary/5 p-5 flex items-start gap-4 border-t border-[#f3e7ed] dark:border-[#3d2431]">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>info</span>
                    <p className="text-xs text-[#9a4c73] dark:text-white/70 leading-relaxed">
                        <span className="font-black text-primary uppercase tracking-widest text-[10px]">Pro Tip:</span> Setting up your medications here will enable smart notifications and drug interaction alerts within the Symra dashboard.
                    </p>
                </div>
            </section>

            {/* Privacy & Trust Banner */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 py-6 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>shield</span>
                    <span className="text-[10px] font-black tracking-widest uppercase">Protocol Compliance</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility_off</span>
                    <span className="text-[10px] font-black tracking-widest uppercase">No Data Sharing</span>
                </div>
            </div>
        </div>
    );
};

export default Profile;
