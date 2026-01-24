import type { KBDocument } from '@/types';
import { seedKnowledgeBase } from '@/lib/db';

/**
 * Seed knowledge base from /public/knowledge_pack.json
 * Updates existing documents if they already exist
 */
export async function ensureKnowledgeBaseSeeded(): Promise<void> {
  try {
    // Fetch knowledge pack from public folder
    const response = await fetch('/knowledge_pack.json');
    if (!response.ok) {
      console.warn('Could not load knowledge_pack.json:', response.statusText);
      return;
    }

    const kbData: KBDocument[] = await response.json();
    
    if (!Array.isArray(kbData) || kbData.length === 0) {
      console.warn('Knowledge pack is empty or invalid');
      return;
    }

    // Validate structure
    const validDocs = kbData.filter(doc => 
      doc.id && doc.title && doc.source && doc.url && Array.isArray(doc.tags) && doc.text
    );

    if (validDocs.length === 0) {
      console.warn('No valid documents in knowledge pack');
      return;
    }

    // Seed/update the database (bulkPut will update existing or add new)
    await seedKnowledgeBase(validDocs);
    console.log(`Seeded/updated ${validDocs.length} knowledge base documents`);
  } catch (error) {
    console.error('Failed to seed knowledge base:', error);
  }
}
