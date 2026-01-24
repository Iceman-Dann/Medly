import type { KBDocument, RetrievedChunk, RagEvidence, PatternCard } from '@/types';
import { getAllKBDocuments } from '@/lib/db';

// Synonym expansion for women's health terms
const SYNONYM_MAP: Record<string, string[]> = {
  'period': ['menstrual', 'menstruation', 'menses', 'cycle'],
  'menstrual': ['period', 'menstruation', 'menses', 'cycle'],
  'menstruation': ['period', 'menstrual', 'menses', 'cycle'],
  'menses': ['period', 'menstrual', 'menstruation', 'cycle'],
  'cycle': ['period', 'menstrual', 'menstruation', 'menses'],
  
  'uti': ['urinary tract infection', 'dysuria', 'urination', 'bladder'],
  'urinary tract infection': ['uti', 'dysuria', 'urination', 'bladder'],
  'dysuria': ['uti', 'urinary tract infection', 'burning', 'urination'],
  'burning': ['dysuria', 'uti', 'urinary tract infection'],
  
  'pelvic': ['lower abdominal', 'pelvis', 'pelvic area'],
  'lower abdominal': ['pelvic', 'pelvis', 'abdominal'],
  'pelvis': ['pelvic', 'lower abdominal'],
  
  'cramp': ['cramping', 'pain', 'discomfort'],
  'cramping': ['cramp', 'pain', 'discomfort'],
  
  'discharge': ['vaginal discharge', 'secretion'],
  'vaginal discharge': ['discharge', 'secretion'],
  
  'ovulation': ['ovulatory', 'fertile window'],
  'ovulatory': ['ovulation', 'fertile window'],
  
  'pms': ['premenstrual syndrome', 'premenstrual'],
  'premenstrual syndrome': ['pms', 'premenstrual'],
  'premenstrual': ['pms', 'premenstrual syndrome'],
  
  'yeast infection': ['candidiasis', 'yeast', 'thrush'],
  'candidiasis': ['yeast infection', 'yeast', 'thrush'],
  
  'bacterial vaginosis': ['bv', 'vaginal infection'],
  'bv': ['bacterial vaginosis', 'vaginal infection'],
  
  'endometriosis': ['endo'],
  'endo': ['endometriosis'],
  
  'pcos': ['polycystic ovary syndrome', 'polycystic'],
  'polycystic ovary syndrome': ['pcos', 'polycystic'],
  'polycystic': ['pcos', 'polycystic ovary syndrome'],
  
  'fatigue': ['tiredness', 'exhaustion', 'weakness', 'low energy'],
  'tiredness': ['fatigue', 'exhaustion', 'weakness'],
  'exhaustion': ['fatigue', 'tiredness', 'weakness'],
  
  'mood changes': ['mood swings', 'mood', 'emotional changes', 'irritability'],
  'mood swings': ['mood changes', 'mood', 'emotional changes'],
  'irritability': ['mood changes', 'mood swings', 'mood'],
  
  'headache': ['head pain', 'migraine', 'head ache'],
  'migraine': ['headache', 'head pain'],
  
  'bloating': ['bloated', 'abdominal bloating', 'swelling', 'gas'],
  'bloated': ['bloating', 'abdominal bloating', 'swelling'],
  
  'nausea': ['queasiness', 'feeling sick', 'sick to stomach'],
  'queasiness': ['nausea', 'feeling sick'],
  
  'bleeding': ['blood', 'hemorrhage', 'menstrual bleeding', 'spotting'],
  'spotting': ['bleeding', 'blood'],
  'heavy bleeding': ['menorrhagia', 'excessive bleeding', 'bleeding'],
  
  'breast tenderness': ['breast pain', 'mastalgia', 'sore breasts', 'breast discomfort'],
  'breast pain': ['breast tenderness', 'mastalgia', 'sore breasts'],
  'mastalgia': ['breast tenderness', 'breast pain'],
  
  'back pain': ['backache', 'lower back pain', 'spine pain'],
  'backache': ['back pain', 'lower back pain'],
  
  'joint pain': ['arthritis', 'joint stiffness', 'joint discomfort'],
  'arthritis': ['joint pain', 'joint stiffness'],
  
  'sleep issues': ['insomnia', 'sleep problems', 'sleep disturbances', 'trouble sleeping'],
  'insomnia': ['sleep issues', 'sleep problems', 'trouble sleeping'],
  'sleep problems': ['sleep issues', 'insomnia', 'sleep disturbances'],
  
  'digestive issues': ['digestive problems', 'IBS', 'irritable bowel', 'stomach problems'],
  'digestive problems': ['digestive issues', 'IBS', 'irritable bowel'],
  'IBS': ['irritable bowel syndrome', 'digestive issues', 'digestive problems'],
  'irritable bowel syndrome': ['IBS', 'digestive issues'],
  
  'pain': ['discomfort', 'ache', 'soreness', 'hurting'],
  'discomfort': ['pain', 'ache', 'soreness'],
};

/**
 * Expand query terms with synonyms
 */
function expandQuery(query: string): string[] {
  const terms = query.toLowerCase().split(/\s+/);
  const expanded = new Set<string>(terms);
  
  for (const term of terms) {
    if (SYNONYM_MAP[term]) {
      SYNONYM_MAP[term].forEach(syn => expanded.add(syn));
    }
  }
  
  return Array.from(expanded);
}

/**
 * Calculate keyword score for a document
 * Title and tags are boosted (3x and 2x respectively)
 */
function calculateScore(
  doc: KBDocument,
  queryTerms: string[]
): number {
  let score = 0;
  const text = doc.text.toLowerCase();
  const title = doc.title.toLowerCase();
  const tags = doc.tags.map(t => t.toLowerCase());
  
  for (const term of queryTerms) {
    // Title matches (3x weight)
    const titleMatches = (title.match(new RegExp(term, 'gi')) || []).length;
    score += titleMatches * 3;
    
    // Tag matches (2x weight)
    const tagMatches = tags.filter(tag => tag.includes(term) || term.includes(tag)).length;
    score += tagMatches * 2;
    
    // Text matches (1x weight)
    const textMatches = (text.match(new RegExp(term, 'gi')) || []).length;
    score += textMatches;
  }
  
  return score;
}

/**
 * Retrieve top N relevant KB documents for a query
 */
export async function retrieveKBDocuments(
  query: string,
  topN: number = 8
): Promise<RetrievedChunk[]> {
  const allDocs = await getAllKBDocuments();
  
  if (allDocs.length === 0) {
    return [];
  }
  
  // Expand query with synonyms
  const expandedTerms = expandQuery(query);
  
  // Score all documents
  const scored = allDocs.map(doc => ({
    doc,
    score: calculateScore(doc, expandedTerms),
  }));
  
  // Filter out zero-score documents and sort by score
  const relevant = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
  
  // Convert to RetrievedChunk format
  return relevant.map(item => ({
    id: item.doc.id,
    title: item.doc.title,
    source: item.doc.source,
    url: item.doc.url,
    text: item.doc.text,
    relevanceScore: item.score,
  }));
}

/**
 * Check if retrieval results have sufficient relevance
 * Returns true if at least one result has a score above threshold
 */
export function hasSufficientRelevance(chunks: RetrievedChunk[], threshold: number = 2): boolean {
  return chunks.length > 0 && chunks.some(chunk => chunk.relevanceScore >= threshold);
}

/**
 * Extract excerpt from text (first 4 sentences max)
 */
function extractExcerpt(text: string, maxSentences: number = 4): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.slice(0, maxSentences).join(' ').trim();
}

/**
 * Retrieve evidence in RagEvidence format, combining user message, pattern card, and cycle phase
 */
export async function retrieveEvidence(
  userMessage: string,
  patternCard: PatternCard,
  topN: number = 8
): Promise<RagEvidence[]> {
  // Build enhanced query from user message + pattern context
  const queryParts: string[] = [userMessage];

  // Add top symptoms
  if (patternCard.top_symptoms.length > 0) {
    const topSymptoms = patternCard.top_symptoms.slice(0, 3).map(s => s.name);
    queryParts.push(...topSymptoms);
  }

  // Add top tags
  if (patternCard.context_tags.top_tags.length > 0) {
    const topTags = patternCard.context_tags.top_tags.slice(0, 3).map(t => t.tag);
    queryParts.push(...topTags);
  }

  // Add cycle phase if relevant
  if (patternCard.cycle_association.highest_severity_phase) {
    queryParts.push(patternCard.cycle_association.highest_severity_phase);
  }

  const enhancedQuery = queryParts.join(' ');

  // Retrieve documents using existing logic
  const allDocs = await getAllKBDocuments();
  
  if (allDocs.length === 0) {
    return [];
  }

  // Expand query with synonyms
  const expandedTerms = expandQuery(enhancedQuery);

  // Score all documents
  const scored = allDocs.map(doc => ({
    doc,
    score: calculateScore(doc, expandedTerms),
  }));

  // Filter out zero-score documents and sort by score
  const relevant = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  // Convert to RagEvidence format
  return relevant.map(item => {
    const excerpt = extractExcerpt(item.doc.text, 4);
    
    // Create a claim from the title and first sentence
    const firstSentence = item.doc.text.match(/[^.!?]+[.!?]+/)?.[0] || item.doc.text.substring(0, 100);
    const claim = `${item.doc.title}: ${firstSentence.trim()}`;

    return {
      id: item.doc.id,
      title: item.doc.title,
      url: item.doc.url,
      claim,
      excerpt,
      tags: item.doc.tags,
    };
  });
}
