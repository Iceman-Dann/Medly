import React, { useState, useRef, useEffect } from 'react';
import { useHealth } from '../HealthContext';
import { exportAllData, importAllData, deleteAllData } from '../db';

const Settings: React.FC = () => {
    const { logs, medications, reports, profile } = useHealth();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [lastExportDate, setLastExportDate] = useState<string | null>(null);
    const [storageUsage, setStorageUsage] = useState({ used: 0, total: 5 });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('medly_last_export');
        if (stored) {
            setLastExportDate(stored);
        }

        const calculateStorage = async () => {
            try {
                const jsonData = await exportAllData();
                const sizeInBytes = new Blob([jsonData]).size;
                const sizeInMB = sizeInBytes / (1024 * 1024);
                setStorageUsage({ used: sizeInMB, total: 5 });
            } catch (e) {
                // Ignore storage calculation errors
            }
        };
        calculateStorage();
    }, [logs, medications, reports, profile]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const jsonData = await exportAllData();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `medly-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            const exportDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            setLastExportDate(exportDate);
            localStorage.setItem('medly_last_export', exportDate);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileSelect = async (file: File) => {
        if (!file.name.endsWith('.json')) {
            setImportError('Please select a valid JSON file');
            return;
        }

        setIsImporting(true);
        setImportError(null);
        setImportSuccess(false);

        try {
            const text = await file.text();
            await importAllData(text);
            setImportSuccess(true);
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error: any) {
            setImportError(error.message || 'Failed to import data. Please check the file format.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDeleteAll = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await deleteAllData();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error: any) {
            setDeleteError(error.message || 'Failed to delete data');
            setIsDeleting(false);
        }
    };

    const storagePercent = storageUsage.total > 0 ? (storageUsage.used / storageUsage.total) * 100 : 0;

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 lg:ml-64 animate-in fade-in duration-500">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">Data Management Settings</h2>
                    <p className="text-sm text-rose-text">Take control of your medical observations. Export for professional consultation or import existing historical logs.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    <section className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-rose-muted/40 p-8 rounded-2xl transition-all">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <span className="material-symbols-outlined text-primary">download</span>
                                </div>
                                <h4 className="text-lg font-bold">Export Data</h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JSON Format</span>
                        </div>
                        <div className="max-w-2xl">
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                                Download a complete archive of your symptoms, notes, and cycle history. Your data is exported in a structured JSON format, ensuring you maintain full ownership of your health records. This file can be shared with medical professionals or used for your personal backups.
                            </p>
                            <button 
                                onClick={handleExport}
                                disabled={isExporting}
                                className="flex items-center gap-3 px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined">file_download</span>
                                {isExporting ? 'Exporting...' : 'Download Data as JSON'}
                            </button>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-rose-muted/40 p-8 rounded-2xl transition-all">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-rose-muted/20 rounded-lg">
                                    <span className="material-symbols-outlined text-slate-600 dark:text-rose-text">upload</span>
                                </div>
                                <h4 className="text-lg font-bold">Import Data</h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Restore Previous Session</span>
                        </div>
                        <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl flex gap-3">
                            <span className="material-symbols-outlined text-amber-600">warning</span>
                            <p className="text-xs text-amber-800 dark:text-amber-200 leading-tight">
                                <span className="font-bold">Attention:</span> Importing a data file will merge new records with your current history. If entries share the same timestamp, local data may be overwritten. Please ensure you have a recent backup before proceeding.
                            </p>
                        </div>
                        {importError && (
                            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl text-sm text-red-800 dark:text-red-200">
                                {importError}
                            </div>
                        )}
                        {importSuccess && (
                            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl text-sm text-green-800 dark:text-green-200">
                                Data imported successfully! Refreshing page...
                            </div>
                        )}
                        <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-transparent transition-colors ${
                                isDragging 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-slate-200 dark:border-rose-muted/30'
                            }`}
                        >
                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-4">cloud_upload</span>
                            <p className="text-sm font-medium text-slate-500 mb-6">Drag and drop your JSON backup file here</p>
                            <div className="flex items-center gap-4">
                                <div className="h-px w-8 bg-slate-200 dark:bg-rose-muted/20"></div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
                                <div className="h-px w-8 bg-slate-200 dark:bg-rose-muted/20"></div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileInput}
                                className="hidden"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isImporting}
                                className="mt-6 px-8 py-3 bg-white dark:bg-rose-muted/20 border border-slate-200 dark:border-rose-muted/40 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isImporting ? 'Importing...' : 'Select JSON File'}
                            </button>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-rose-muted/40 p-8 rounded-2xl transition-all">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100/60 dark:bg-red-900/20 rounded-lg">
                                    <span className="material-symbols-outlined text-red-500 dark:text-red-400">delete_forever</span>
                                </div>
                                <h4 className="text-lg font-bold text-red-500 dark:text-red-400">Delete All Data</h4>
                            </div>
                            <span className="text-[10px] font-bold text-red-400 dark:text-red-500/70 uppercase tracking-widest">Irreversible</span>
                        </div>
                        <div className="max-w-2xl">
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                                Permanently delete all your symptom logs, medications, reports, and profile data. This action cannot be undone. Make sure you have exported a backup before proceeding.
                            </p>
                            {deleteError && (
                                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl text-sm text-red-600 dark:text-red-400">
                                    {deleteError}
                                </div>
                            )}
                            {!showDeleteConfirm ? (
                                <button 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-3 px-8 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all shadow-sm"
                                >
                                    <span className="material-symbols-outlined">delete_forever</span>
                                    Delete All Data
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
                                        <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">⚠️ Warning: This will permanently delete all your data</p>
                                        <p className="text-xs text-red-500 dark:text-red-500/70">
                                            This includes all symptom logs ({logs.length} entries), medications ({medications.length} entries), reports ({reports.length} entries), and profile settings. This action cannot be undone.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={handleDeleteAll}
                                            disabled={isDeleting}
                                            className="flex items-center gap-3 px-8 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined">delete_forever</span>
                                            {isDeleting ? 'Deleting...' : 'Confirm Delete All'}
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeleteError(null);
                                            }}
                                            disabled={isDeleting}
                                            className="px-6 py-3 bg-slate-100 dark:bg-rose-muted/20 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-rose-muted/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="flex items-center justify-center gap-2 text-rose-text">
                        <span className="material-symbols-outlined text-sm">verified_user</span>
                        <p className="text-[11px] font-bold uppercase tracking-widest">Medly never stores your raw data on public servers. All data is stored locally in your browser.</p>
                    </div>
                </div>

                <aside className="xl:col-span-1">
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-rose-muted/40 p-8 rounded-2xl sticky top-8">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Quick Stats</h3>
                        <div className="space-y-8">
                            <div className="border-b border-slate-100 dark:border-rose-muted/20 pb-6">
                                <h4 className="text-xs font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">database</span>
                                    Data Footprint
                                </h4>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-1.5 flex-1 bg-slate-100 dark:bg-rose-muted/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${Math.min(storagePercent, 100)}%` }}></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-white">
                                        {storageUsage.used.toFixed(1)} MB / {storageUsage.total.toFixed(1)} MB
                                    </span>
                                </div>
                                <p className="text-[11px] text-rose-text font-medium leading-relaxed uppercase tracking-wider">Storage Utilization</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">Last Activity</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                        <span>Last Export</span>
                                        <span className="text-primary">{lastExportDate || 'Never'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                        <span>Total Entries</span>
                                        <span>{logs.length} logs</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                        <span>Sync Status</span>
                                        <span className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Local
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-6">
                                <h4 className="text-xs font-bold text-primary mb-3 uppercase tracking-[0.15em]">Medical Advocacy</h4>
                                <p className="text-[11px] text-primary-dark dark:text-primary-light leading-relaxed font-medium">
                                    Keeping local backups of your symptom history is a critical step in self-advocacy. You can provide these files to medical specialists for deeper pattern analysis during consultations.
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Settings;
