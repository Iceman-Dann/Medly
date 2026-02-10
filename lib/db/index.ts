import Dexie, { type EntityTable } from 'dexie';
import type { Log, Attachment, ChatMessage, Report, KBDocument } from '@/types';

// IndexedDB schema with versioned migrations (all data stored locally in browser)
class MedlyDatabase extends Dexie {
  logs!: EntityTable<Log, 'id'>;
  attachments!: EntityTable<Attachment, 'id'>;
  chats!: EntityTable<ChatMessage, 'id'>;
  reports!: EntityTable<Report, 'id'>;
  kb_docs!: EntityTable<KBDocument, 'id'>;

  constructor() {
    super('MedlyDB');

    // Version 1 - Initial schema
    this.version(1).stores({
      logs: 'id, createdAt, symptomType, severity, cyclePhase',
      attachments: 'id, createdAt, hash',
      chats: 'id, createdAt, threadId, role',
      reports: 'id, createdAt, type',
    });

    // Version 2 - Add knowledge base documents
    this.version(2).stores({
      logs: 'id, createdAt, symptomType, severity, cyclePhase',
      attachments: 'id, createdAt, hash',
      chats: 'id, createdAt, threadId, role',
      reports: 'id, createdAt, type',
      kb_docs: 'id, title, source, url',
    });
  }
}

export const db = new MedlyDatabase();

// ============ LOG HELPERS ============

export async function saveLog(log: Omit<Log, 'id' | 'createdAt'>): Promise<string> {
  const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newLog: Log = {
    ...log,
    id,
    createdAt: new Date(),
  };
  await db.logs.add(newLog);
  return id;
}

export async function updateLog(id: string, updates: Partial<Omit<Log, 'id' | 'createdAt'>>): Promise<void> {
  await db.logs.update(id, updates);
}

export async function getLogs(options?: {
  limit?: number;
  offset?: number;
  symptomType?: string;
  startDate?: Date;
  endDate?: Date;
  lastNDays?: number;
}): Promise<Log[]> {
  let collection = db.logs.orderBy('createdAt').reverse();

  if (options?.symptomType) {
    collection = db.logs.where('symptomType').equals(options.symptomType).reverse();
  }

  let results = await collection.toArray();

  // Filter by last N days if specified
  if (options?.lastNDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - options.lastNDays);
    results = results.filter(log => log.createdAt >= cutoffDate);
  }

  if (options?.startDate) {
    results = results.filter(log => log.createdAt >= options.startDate!);
  }
  if (options?.endDate) {
    results = results.filter(log => log.createdAt <= options.endDate!);
  }
  if (options?.offset) {
    results = results.slice(options.offset);
  }
  if (options?.limit) {
    results = results.slice(0, options.limit);
  }

  return results;
}

export async function getLogById(id: string): Promise<Log | undefined> {
  return db.logs.get(id);
}

export async function deleteLog(id: string): Promise<void> {
  await db.logs.delete(id);
}

// ============ ATTACHMENT HELPERS ============

export async function saveAttachment(
  file: File | Blob,
  originalName?: string
): Promise<string> {
  const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const attachment: Attachment = {
    id,
    createdAt: new Date(),
    mimeType: file.type || 'application/octet-stream',
    blob: file instanceof Blob ? file : new Blob([file]),
    hash,
    originalName,
  };

  await db.attachments.add(attachment);
  return id;
}

export async function getAttachment(id: string): Promise<Attachment | undefined> {
  return db.attachments.get(id);
}

export async function deleteAttachment(id: string): Promise<void> {
  await db.attachments.delete(id);
}

// ============ CHAT HELPERS ============

export async function saveChatMessage(
  message: Omit<ChatMessage, 'id' | 'createdAt'>
): Promise<string> {
  const id = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newMessage: ChatMessage = {
    ...message,
    id,
    createdAt: new Date(),
  };
  await db.chats.add(newMessage);
  return id;
}

export async function getChatHistory(
  threadId: string,
  limit?: number
): Promise<ChatMessage[]> {
  let collection = db.chats
    .where('threadId')
    .equals(threadId)
    .sortBy('createdAt');

  const results = await collection;

  if (limit) {
    return results.slice(-limit);
  }
  return results;
}

export async function getAllThreads(): Promise<string[]> {
  const chats = await db.chats.toArray();
  const threadIds = new Set(chats.map(c => c.threadId));
  return Array.from(threadIds);
}

export async function deleteThread(threadId: string): Promise<void> {
  await db.chats.where('threadId').equals(threadId).delete();
}

// ============ REPORT HELPERS ============

export async function saveReport(
  report: Omit<Report, 'id' | 'createdAt'>
): Promise<string> {
  const id = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newReport: Report = {
    ...report,
    id,
    createdAt: new Date(),
  };
  await db.reports.add(newReport);
  return id;
}

export async function getReport(id: string): Promise<Report | undefined> {
  return db.reports.get(id);
}

export async function getReports(type?: 'doctor_report' | 'checklist'): Promise<Report[]> {
  if (type) {
    return db.reports.where('type').equals(type).reverse().sortBy('createdAt');
  }
  return db.reports.orderBy('createdAt').reverse().toArray();
}

export async function deleteReport(id: string): Promise<void> {
  await db.reports.delete(id);
}

// ============ DATA MANAGEMENT ============

export async function exportAllDataAsJson(): Promise<string> {
  const [logs, attachments, chats, reports] = await Promise.all([
    db.logs.toArray(),
    db.attachments.toArray(),
    db.chats.toArray(),
    db.reports.toArray(),
  ]);

  // Convert Blobs to base64 for export
  const attachmentsWithBase64 = await Promise.all(
    attachments.map(async (att) => {
      const arrayBuffer = await att.blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      return {
        ...att,
        blob: undefined,
        blobBase64: base64,
      };
    })
  );

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    logs,
    attachments: attachmentsWithBase64,
    chats,
    reports,
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importDataFromJson(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);

  if (data.version !== 1) {
    throw new Error('Unsupported export version');
  }

  // Convert base64 back to Blobs
  const attachmentsWithBlobs = data.attachments.map((att: { blobBase64: string; mimeType: string }) => {
    const binary = atob(att.blobBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return {
      ...att,
      blobBase64: undefined,
      blob: new Blob([bytes], { type: att.mimeType }),
    };
  });

  await db.transaction('rw', [db.logs, db.attachments, db.chats, db.reports], async () => {
    await db.logs.bulkPut(data.logs);
    await db.attachments.bulkPut(attachmentsWithBlobs);
    await db.chats.bulkPut(data.chats);
    await db.reports.bulkPut(data.reports);
  });
}

export async function nukeAllData(): Promise<void> {
  await db.transaction('rw', [db.logs, db.attachments, db.chats, db.reports], async () => {
    await db.logs.clear();
    await db.attachments.clear();
    await db.chats.clear();
    await db.reports.clear();
  });
}

// ============ STATS ============

export async function getLogStats(): Promise<{
  totalLogs: number;
  recentLogs: number;
  symptomTypes: Record<string, number>;
}> {
  const logs = await db.logs.toArray();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const symptomTypes: Record<string, number> = {};
  let recentCount = 0;

  for (const log of logs) {
    symptomTypes[log.symptomType] = (symptomTypes[log.symptomType] || 0) + 1;
    if (log.createdAt >= weekAgo) {
      recentCount++;
    }
  }

  return {
    totalLogs: logs.length,
    recentLogs: recentCount,
    symptomTypes,
  };
}

// ============ KNOWLEDGE BASE HELPERS ============

export async function seedKnowledgeBase(docs: KBDocument[]): Promise<void> {
  // Use bulkPut to update existing documents or add new ones
  await db.kb_docs.bulkPut(docs);
}

export async function getAllKBDocuments(): Promise<KBDocument[]> {
  return db.kb_docs.toArray();
}

export async function getKBDocumentById(id: string): Promise<KBDocument | undefined> {
  return db.kb_docs.get(id);
}

export async function clearKnowledgeBase(): Promise<void> {
  await db.kb_docs.clear();
}
