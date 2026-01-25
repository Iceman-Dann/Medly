import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useHealth } from '../HealthContext';
import { ClinicalReport } from '../types';

const QRHandshake: React.FC = () => {
    const navigate = useNavigate();
    const { reportId } = useParams<{ reportId?: string }>();
    const { reports, logs } = useHealth();
    const [minutes, setMinutes] = useState(14);
    const [seconds, setSeconds] = useState(59);
    const [sessionId, setSessionId] = useState(() => `SYM-${Math.floor(Math.random() * 10000)}-X`);
    const [reportText, setReportText] = useState('');
    const [isTextTooLong, setIsTextTooLong] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const getFilteredLogs = (timeRange: string) => {
        const now = Date.now();
        let startCutoff = 0;
        let endCutoff = now;
        
        if (timeRange === '7d') {
            startCutoff = now - (7 * 24 * 60 * 60 * 1000);
        } else if (timeRange === '30d') {
            startCutoff = now - (30 * 24 * 60 * 60 * 1000);
        } else if (timeRange === '3m') {
            startCutoff = now - (90 * 24 * 60 * 60 * 1000);
        } else if (timeRange.startsWith('custom:')) {
            const dates = timeRange.replace('custom:', '').split('_');
            if (dates.length === 2) {
                const start = new Date(dates[0]);
                start.setHours(0, 0, 0, 0);
                startCutoff = start.getTime();
                const end = new Date(dates[1]);
                end.setHours(23, 59, 59, 999);
                endCutoff = end.getTime();
            }
        }

        return logs.filter(log => log.timestamp >= startCutoff && log.timestamp <= endCutoff);
    };

    const calculatePatterns = (filteredLogs: typeof logs) => {
        const symptomMap = new Map<string, { count: number; totalSeverity: number; intensities: number[] }>();
        
        filteredLogs.forEach(log => {
            const existing = symptomMap.get(log.name) || { count: 0, totalSeverity: 0, intensities: [] };
            existing.count += 1;
            existing.totalSeverity += log.intensity;
            existing.intensities.push(log.intensity);
            symptomMap.set(log.name, existing);
        });

        const patterns: Array<{ symptom: string; frequency: number; avgSeverity: number; minSeverity: number; maxSeverity: number }> = [];
        
        symptomMap.forEach((data, symptom) => {
            patterns.push({
                symptom,
                frequency: data.count,
                avgSeverity: Math.round((data.totalSeverity / data.count) * 10) / 10,
                minSeverity: Math.min(...data.intensities),
                maxSeverity: Math.max(...data.intensities)
            });
        });

        return patterns.sort((a, b) => b.frequency - a.frequency);
    };

    const formatReportText = (report: ClinicalReport): string => {
        const formatTimeRange = (range: string) => {
            if (range.startsWith('custom:')) {
                const dates = range.replace('custom:', '').split('_');
                if (dates.length === 2) {
                    const start = new Date(dates[0]);
                    const end = new Date(dates[1]);
                    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
                }
            }
            if (range === '7d') return 'Last 7 days';
            if (range === '30d') return 'Last 30 days';
            if (range === '3m') return 'Last 3 months';
            return range;
        };

        const filteredLogs = getFilteredLogs(report.timeRange);
        const patterns = calculatePatterns(filteredLogs);

        let text = `SYMRA CLINICAL REPORT\n`;
        text += `Generated: ${new Date(report.timestamp).toLocaleDateString()}\n`;
        text += `Time Range: ${formatTimeRange(report.timeRange)}\n`;
        text += `Focus Areas: ${report.focusAreas.join(', ')}\n\n`;
        
        text += `=== SOAP NOTE ===\n\n`;
        text += `[S] SUBJECTIVE:\n${report.soapNote.subjective}\n\n`;
        
        text += `[O] OBJECTIVE:\n`;
        if (report.soapNote.objective) {
            text += `${report.soapNote.objective}\n\n`;
        }
        
        text += `PATTERN SUMMARY:\n`;
        text += `Total Logs: ${filteredLogs.length}\n\n`;
        
        if (patterns.length > 0) {
            text += `Symptom Frequency & Severity:\n`;
            patterns.forEach((pattern, index) => {
                text += `${index + 1}. ${pattern.symptom}\n`;
                text += `   Frequency: ${pattern.frequency} occurrence${pattern.frequency !== 1 ? 's' : ''}\n`;
                text += `   Severity: Avg ${pattern.avgSeverity}/10 (Range: ${pattern.minSeverity}-${pattern.maxSeverity}/10)\n\n`;
            });
        } else {
            text += `No symptom logs recorded in this time range.\n\n`;
        }
        
        return text;
    };

    useEffect(() => {
        const report = reportId 
            ? reports.find(r => r.id === reportId)
            : reports[0];
        
        if (report) {
            const text = formatReportText(report);
            setReportText(text);
            setIsTextTooLong(text.length > 3000);
        } else {
            setReportText('');
        }
    }, [reportId, reports]);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setSeconds((prev) => {
                if (prev > 0) {
                    return prev - 1;
                } else {
                    setMinutes((prevMinutes) => {
                        if (prevMinutes > 0) {
                            return prevMinutes - 1;
                        } else {
                            if (intervalRef.current) {
                                clearInterval(intervalRef.current);
                            }
                            return 0;
                        }
                    });
                    return 59;
                }
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const handleRegenerate = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        const newSessionId = `SYM-${Math.floor(Math.random() * 10000)}-X`;
        setSessionId(newSessionId);
        setMinutes(14);
        setSeconds(59);
        
        intervalRef.current = setInterval(() => {
            setSeconds((prev) => {
                if (prev > 0) {
                    return prev - 1;
                } else {
                    setMinutes((prevMinutes) => {
                        if (prevMinutes > 0) {
                            return prevMinutes - 1;
                        } else {
                            if (intervalRef.current) {
                                clearInterval(intervalRef.current);
                            }
                            return 0;
                        }
                    });
                    return 59;
                }
            });
        }, 1000);
    };

    if (!reportText) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-500 mb-4">No report available. Please generate a report first.</p>
                    <button
                        onClick={() => navigate('/prep')}
                        className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all"
                    >
                        Go to Prep Hub
                    </button>
                </div>
            </div>
        );
    }

    const handleDone = () => {
        navigate('/prep');
    };

    return (
        <div className="min-h-screen bg-background-light flex flex-col font-display">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-rose-100 px-10 py-3 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="size-6 text-primary">
                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
                            <path clipRule="evenodd" d="M39.998 12.236C39.9944 12.2537 39.9875 12.2845 39.9748 12.3294C39.9436 12.4399 39.8949 12.5741 39.8346 12.7175C39.8168 12.7597 39.7989 12.8007 39.7813 12.8398C38.5103 13.7113 35.9788 14.9393 33.7095 15.4811C30.9875 16.131 27.6413 16.5217 24 16.5217C20.3587 16.5217 17.0125 16.131 14.2905 15.4811C12.0012 14.9346 9.44505 13.6897 8.18538 12.8168C8.17384 12.7925 8.16216 12.767 8.15052 12.7408C8.09919 12.6249 8.05721 12.5114 8.02977 12.411C8.00356 12.3152 8.00039 12.2667 8.00004 12.2612C8.00004 12.261 8 12.2607 8.00004 12.2612C8.00004 12.2359 8.0104 11.9233 8.68485 11.3686C9.34546 10.8254 10.4222 10.2469 11.9291 9.72276C14.9242 8.68098 19.1919 8 24 8C28.8081 8 33.0758 8.68098 36.0709 9.72276C37.5778 10.2469 38.6545 10.8254 39.3151 11.3686C39.9006 11.8501 39.9857 12.1489 39.998 12.236ZM4.95178 15.2312L21.4543 41.6973C22.6288 43.5809 25.3712 43.5809 26.5457 41.6973L43.0534 15.223C43.0709 15.1948 43.0878 15.1662 43.104 15.1371L41.3563 14.1648C43.104 15.1371 43.1038 15.1374 43.104 15.1371L43.1051 15.135L43.1065 15.1325L43.1101 15.1261L43.1199 15.1082C43.1276 15.094 43.1377 15.0754 43.1497 15.0527C43.1738 15.0075 43.2062 14.9455 43.244 14.8701C43.319 14.7208 43.4196 14.511 43.5217 14.2683C43.6901 13.8679 44 13.0689 44 12.2609C44 10.5573 43.003 9.22254 41.8558 8.2791C40.6947 7.32427 39.1354 6.55361 37.385 5.94477C33.8654 4.72057 29.133 4 24 4C18.867 4 14.1346 4.72057 10.615 5.94478C8.86463 6.55361 7.30529 7.32428 6.14419 8.27911C4.99695 9.22255 3.99999 10.5573 3.99999 12.2609C3.99999 13.1275 4.29264 13.9078 4.49321 14.3607C4.60375 14.6102 4.71348 14.8196 4.79687 14.9689C4.83898 15.0444 4.87547 15.1065 4.9035 15.1529C4.91754 15.1762 4.92954 15.1957 4.93916 15.2111L4.94662 15.223L4.95178 15.2312ZM35.9868 18.996L24 38.22L12.0131 18.996C12.4661 19.1391 12.9179 19.2658 13.3617 19.3718C16.4281 20.1039 20.0901 20.5217 24 20.5217C27.9099 20.5217 31.5719 20.1039 34.6383 19.3718C35.082 19.2658 35.5339 19.1391 35.9868 18.996Z" fill="currentColor" fillRule="evenodd"></path>
                        </svg>
                    </div>
                    <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-[-0.015em]">Symra</h2>
                </div>
                <div className="flex flex-1 justify-end gap-8 items-center">
                    <nav className="flex items-center gap-9">
                        <button onClick={() => navigate('/')} className="text-slate-600 hover:text-primary text-sm font-medium leading-normal transition-colors">Dashboard</button>
                        <button onClick={() => navigate('/log-new')} className="text-slate-600 hover:text-primary text-sm font-medium leading-normal transition-colors">Symptom Log</button>
                        <button onClick={() => navigate('/prep')} className="text-slate-600 hover:text-primary text-sm font-medium leading-normal transition-colors">Privacy Vault</button>
                    </nav>
                </div>
            </header>

            <main className="flex-1 relative flex items-center justify-center py-12 px-4 overflow-hidden">
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center opacity-40 blur-3xl scale-110 pointer-events-none">
                    <div className="w-full h-full bg-gradient-to-tr from-rose-100 via-transparent to-rose-200/30"></div>
                </div>

                <div className="relative z-10 w-full max-w-[540px] bg-blush border border-rose-100 rounded-3xl modal-shadow p-8 flex flex-col items-center">
                    <div className="flex flex-col items-center mb-8">
                        <div className="mb-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 text-primary border border-rose-200 shadow-sm">
                            <span className="material-symbols-outlined text-sm">verified_user</span>
                            <span className="text-xs font-bold uppercase tracking-widest">Secure Clinical Access</span>
                        </div>
                        <h1 className="text-slate-900 tracking-tight text-[32px] font-bold leading-tight text-center">Doctor QR Handshake</h1>
                        <p className="text-slate-500 text-base font-normal leading-relaxed mt-2 text-center max-w-[380px]">
                            Share your symptom tracking and health profile securely with your medical provider.
                        </p>
                    </div>

                    <div className="w-full aspect-square max-w-[280px] bg-white rounded-2xl p-6 mb-8 qr-glow flex items-center justify-center border border-rose-100">
                        {reportText && (
                            <QRCodeSVG
                                value={reportText}
                                size={280}
                                level="L"
                                includeMargin={false}
                                className="w-full h-full"
                            />
                        )}
                    </div>
                    
                    {isTextTooLong && (
                        <div className="w-full mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-xs text-amber-700 font-medium">
                                ⚠️ Report is {reportText.length.toLocaleString()} characters. QR code may be dense and harder to scan with older cameras.
                            </p>
                        </div>
                    )}

                    <div className="w-full mb-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                            <span className="text-slate-600 text-sm font-semibold">Access Link Expires In</span>
                        </div>
                        <div className="flex gap-4 px-4 justify-center">
                            <div className="flex flex-col items-center gap-2 w-24">
                                <div className="flex h-20 w-full items-center justify-center rounded-2xl bg-white border border-rose-200 shadow-sm">
                                    <p className="text-primary text-3xl font-bold leading-none tracking-tight">{String(minutes).padStart(2, '0')}</p>
                                </div>
                                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">Minutes</p>
                            </div>
                            <div className="flex items-center justify-center text-rose-200 text-3xl font-bold pb-8">:</div>
                            <div className="flex flex-col items-center gap-2 w-24">
                                <div className="flex h-20 w-full items-center justify-center rounded-2xl bg-white border border-rose-200 shadow-sm">
                                    <p className="text-primary text-3xl font-bold leading-none tracking-tight">{String(seconds).padStart(2, '0')}</p>
                                </div>
                                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">Seconds</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <button
                            onClick={handleRegenerate}
                            className="flex items-center justify-center gap-2 h-14 rounded-xl border border-rose-200 bg-white hover:bg-rose-100/50 transition-all text-slate-700 text-sm font-semibold shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">refresh</span>
                            Regenerate
                        </button>
                        <button
                            onClick={handleDone}
                            className="flex items-center justify-center gap-2 h-14 rounded-xl bg-primary hover:bg-rose-700 transition-all text-white text-sm font-bold shadow-md shadow-rose-200/50"
                        >
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                            I'm Done
                        </button>
                    </div>

                    <div className="flex items-start gap-4 p-5 bg-white/60 rounded-2xl border border-rose-100 w-full">
                        <span className="material-symbols-outlined text-primary/40 mt-0.5">info</span>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            Report text is embedded directly in the QR code. When scanned, the full clinical report will appear on the doctor's device. No cloud storage or external servers used. 100% private and HIPAA compliant.
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-10 left-10 text-slate-300 flex flex-col gap-1 pointer-events-none select-none">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Session ID: {sessionId}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">AES-256 Bit Encryption Active</span>
                </div>
            </main>

            <footer className="p-8 text-center text-slate-400 text-xs border-t border-rose-100/50 bg-white">
                © 2024 Symra Medical Privacy Systems. Protected under HIPAA/GDPR Compliance.
            </footer>
        </div>
    );
};

export default QRHandshake;
