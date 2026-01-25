
const DB_NAME = 'SymraLocalVault';
const STORE_LOGS = 'SymptomLogs';
const STORE_PROFILE = 'UserProfile';
const STORE_MEDS = 'Medications';
const STORE_REPORTS = 'Reports';
const DB_VERSION = 3;

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event: any) => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_LOGS)) {
                db.createObjectStore(STORE_LOGS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_PROFILE)) {
                db.createObjectStore(STORE_PROFILE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_MEDS)) {
                db.createObjectStore(STORE_MEDS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_REPORTS)) {
                db.createObjectStore(STORE_REPORTS, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveLogToDB = async (log: any) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_LOGS, 'readwrite');
        const store = transaction.objectStore(STORE_LOGS);
        const request = store.put(log);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getAllLogsFromDB = async (): Promise<any[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_LOGS, 'readonly');
        const store = transaction.objectStore(STORE_LOGS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteLogFromDB = async (id: string) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_LOGS, 'readwrite');
        const store = transaction.objectStore(STORE_LOGS);
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getProfileFromDB = async (): Promise<any> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PROFILE, 'readonly');
        const store = transaction.objectStore(STORE_PROFILE);
        const request = store.get('main');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveProfileToDB = async (profile: any) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PROFILE, 'readwrite');
        const store = transaction.objectStore(STORE_PROFILE);
        const request = store.put({ ...profile, id: 'main' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getAllMedsFromDB = async (): Promise<any[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_MEDS, 'readonly');
        const store = transaction.objectStore(STORE_MEDS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveMedToDB = async (med: any) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_MEDS, 'readwrite');
        const store = transaction.objectStore(STORE_MEDS);
        const request = store.put(med);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteMedFromDB = async (id: string) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_MEDS, 'readwrite');
        const store = transaction.objectStore(STORE_MEDS);
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getAllReportsFromDB = async (): Promise<any[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_REPORTS, 'readonly');
        const store = transaction.objectStore(STORE_REPORTS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveReportToDB = async (report: any) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_REPORTS, 'readwrite');
        const store = transaction.objectStore(STORE_REPORTS);
        const request = store.put(report);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteReportFromDB = async (id: string) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_REPORTS, 'readwrite');
        const store = transaction.objectStore(STORE_REPORTS);
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const exportAllData = async (): Promise<string> => {
    const [logs, profile, medications, reports] = await Promise.all([
        getAllLogsFromDB(),
        getProfileFromDB(),
        getAllMedsFromDB(),
        getAllReportsFromDB()
    ]);

    const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        logs,
        profile: profile || null,
        medications,
        reports
    };

    return JSON.stringify(exportData, null, 2);
};

export const importAllData = async (jsonString: string): Promise<void> => {
    const data = JSON.parse(jsonString);

    if (data.version !== 1) {
        throw new Error('Unsupported export version');
    }

    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_LOGS, STORE_PROFILE, STORE_MEDS, STORE_REPORTS], 'readwrite');
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        if (data.logs && Array.isArray(data.logs)) {
            const logsStore = transaction.objectStore(STORE_LOGS);
            data.logs.forEach((log: any) => {
                logsStore.put(log);
            });
        }

        if (data.profile) {
            const profileStore = transaction.objectStore(STORE_PROFILE);
            profileStore.put({ ...data.profile, id: 'main' });
        }

        if (data.medications && Array.isArray(data.medications)) {
            const medsStore = transaction.objectStore(STORE_MEDS);
            data.medications.forEach((med: any) => {
                medsStore.put(med);
            });
        }

        if (data.reports && Array.isArray(data.reports)) {
            const reportsStore = transaction.objectStore(STORE_REPORTS);
            data.reports.forEach((report: any) => {
                reportsStore.put(report);
            });
        }
    });
};
