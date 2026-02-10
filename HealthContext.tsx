
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SymptomLog, ChatMessage, UserContext, HealthMode, Medication, UserProfile, ClinicalReport } from './types';
import { 
    getAllLogsFromDB, saveLogToDB, deleteLogFromDB, 
    getProfileFromDB, saveProfileToDB, 
    getAllMedsFromDB, saveMedToDB, deleteMedFromDB,
    getAllReportsFromDB, saveReportToDB, deleteReportFromDB
} from './db';

interface HealthContextType {
    logs: SymptomLog[];
    chatHistory: ChatMessage[];
    profile: UserProfile;
    medications: Medication[];
    reports: ClinicalReport[];
    isMedicalContextEnabled: boolean;
    setMedicalContextEnabled: (enabled: boolean) => void;
    addLog: (log: Omit<SymptomLog, 'id' | 'timestamp'>) => Promise<void>;
    removeLog: (id: string) => Promise<void>;
    addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    clearChat: () => void;
    getRecentContext: () => SymptomLog[];
    updateProfile: (profile: UserProfile) => Promise<void>;
    addMedication: (med: Omit<Medication, 'id'>) => Promise<void>;
    removeMedication: (id: string) => Promise<void>;
    toggleMedicationStatus: (id: string) => Promise<void>;
    addReport: (report: Omit<ClinicalReport, 'id' | 'timestamp'>) => Promise<void>;
    removeReport: (id: string) => Promise<void>;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [logs, setLogs] = useState<SymptomLog[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [profile, setProfile] = useState<UserProfile>({ activeMode: HealthMode.GENERAL });
    const [medications, setMedications] = useState<Medication[]>([]);
    const [reports, setReports] = useState<ClinicalReport[]>([]);
    const [isMedicalContextEnabled, setMedicalContextEnabled] = useState(true);

    useEffect(() => {
        const loadAllData = async () => {
            const [storedLogs, storedProfile, storedMeds, storedReports] = await Promise.all([
                getAllLogsFromDB(),
                getProfileFromDB(),
                getAllMedsFromDB(),
                getAllReportsFromDB()
            ]);
            setLogs(storedLogs.sort((a, b) => b.timestamp - a.timestamp));
            if (storedProfile) setProfile(storedProfile);
            setMedications(storedMeds);
            setReports(storedReports.sort((a, b) => b.timestamp - a.timestamp));
        };
        loadAllData();
    }, []);

    const addLog = async (logData: Omit<SymptomLog, 'id' | 'timestamp'>) => {
        const newLog: SymptomLog = {
            ...logData,
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
        };
        await saveLogToDB(newLog);
        setLogs(prev => [newLog, ...prev]);
    };

    const removeLog = async (id: string) => {
        await deleteLogFromDB(id);
        setLogs(prev => prev.filter(log => log.id !== id));
    };

    const updateProfile = async (newProfile: UserProfile) => {
        await saveProfileToDB(newProfile);
        setProfile(newProfile);
    };

    const addMedication = async (medData: Omit<Medication, 'id'>) => {
        const newMed: Medication = {
            ...medData,
            id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        await saveMedToDB(newMed);
        setMedications(prev => [...prev, newMed]);
    };

    const removeMedication = async (id: string) => {
        await deleteMedFromDB(id);
        setMedications(prev => prev.filter(m => m.id !== id));
    };

    const toggleMedicationStatus = async (id: string) => {
        const med = medications.find(m => m.id === id);
        if (!med) return;
        const updatedMed: Medication = { 
            ...med, 
            status: med.status === 'active' ? 'paused' : 'active' 
        };
        await saveMedToDB(updatedMed);
        setMedications(prev => prev.map(m => m.id === id ? updatedMed : m));
    };

    const addReport = async (reportData: Omit<ClinicalReport, 'id' | 'timestamp'>) => {
        const newReport: ClinicalReport = {
            ...reportData,
            id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
        };
        await saveReportToDB(newReport);
        setReports(prev => [newReport, ...prev]);
    };

    const removeReport = async (id: string) => {
        await deleteReportFromDB(id);
        setReports(prev => prev.filter(r => r.id !== id));
    };

    const addChatMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const newMessage: ChatMessage = {
            ...msg,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
        };
        setChatHistory(prev => [...prev, newMessage]);
    };

    const clearChat = () => setChatHistory([]);

    const getRecentContext = useCallback(() => {
        return logs.slice(0, 10);
    }, [logs]);

    return (
        <HealthContext.Provider value={{
            logs,
            chatHistory,
            profile,
            medications,
            reports,
            isMedicalContextEnabled,
            setMedicalContextEnabled,
            addLog,
            removeLog,
            addChatMessage,
            clearChat,
            getRecentContext,
            updateProfile,
            addMedication,
            removeMedication,
            toggleMedicationStatus,
            addReport,
            removeReport
        }}>
            {children}
        </HealthContext.Provider>
    );
};

export const useHealth = () => {
    const context = useContext(HealthContext);
    if (!context) throw new Error("useHealth must be used within a HealthProvider");
    return context;
};
