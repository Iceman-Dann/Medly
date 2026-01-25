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
 * Supports weighted terms (for prioritizing user message over pattern context)
 * Condition names in title get massive boost (10x)
 */
function calculateScore(
  doc: KBDocument,
  queryTerms: string[],
  termWeights?: Map<string, number>,
  conditionNames?: string[]
): number {
  let score = 0;
  const text = doc.text.toLowerCase();
  const title = doc.title.toLowerCase();
  const tags = doc.tags.map(t => t.toLowerCase());
  
  // Massive boost if condition name appears in title (10x multiplier)
  if (conditionNames && conditionNames.length > 0) {
    for (const condition of conditionNames) {
      const conditionLower = condition.toLowerCase();
      if (title.includes(conditionLower)) {
        score += 50; // Huge boost for exact condition match in title
      }
      // Also check tags
      if (tags.some(tag => tag.includes(conditionLower))) {
        score += 20; // Big boost for condition in tags
      }
    }
  }
  
  for (const term of queryTerms) {
    const weight = termWeights?.get(term) || 1;
    
    // Title matches (3x weight)
    const titleMatches = (title.match(new RegExp(term, 'gi')) || []).length;
    score += titleMatches * 3 * weight;
    
    // Tag matches (2x weight)
    const tagMatches = tags.filter(tag => tag.includes(term) || term.includes(tag)).length;
    score += tagMatches * 2 * weight;
    
    // Text matches (1x weight)
    const textMatches = (text.match(new RegExp(term, 'gi')) || []).length;
    score += textMatches * weight;
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
 * Extract specific condition names from query (PCOS, endometriosis, UTI, etc.)
 */
function extractConditionNames(query: string): string[] {
  const conditions: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Common condition patterns
  const conditionPatterns = [
    { pattern: /\b(pcos|polycystic ovary syndrome)\b/i, name: 'PCOS' },
    { pattern: /\b(endometriosis|endo)\b/i, name: 'endometriosis' },
    { pattern: /\b(uti|urinary tract infection)\b/i, name: 'UTI' },
    { pattern: /\b(pid|pelvic inflammatory disease)\b/i, name: 'PID' },
    { pattern: /\b(ibs|irritable bowel syndrome)\b/i, name: 'IBS' },
    { pattern: /\b(anemia|iron deficiency)\b/i, name: 'anemia' },
    { pattern: /\b(arthritis|joint pain)\b/i, name: 'arthritis' },
    { pattern: /\b(yeast infection|candidiasis)\b/i, name: 'yeast infection' },
    { pattern: /\b(bv|bacterial vaginosis)\b/i, name: 'bacterial vaginosis' },
  ];
  
  for (const { pattern, name } of conditionPatterns) {
    if (pattern.test(query)) {
      conditions.push(name);
    }
  }
  
  return conditions;
}

/**
 * Retrieve evidence in RagEvidence format, prioritizing user message over pattern card context
 * Uses weighted scoring to ensure user query terms are much more important than pattern context
 * Applies strict relevance filtering to avoid returning generic sources
 */
export async function retrieveEvidence(
  userMessage: string,
  patternCard: PatternCard,
  topN: number = 8
): Promise<RagEvidence[]> {
  const allDocs = await getAllKBDocuments();
  
  if (allDocs.length === 0) {
    return [];
  }

  // Step 1: Extract specific condition names from query (if any)
  const conditionNames = extractConditionNames(userMessage);

  // Step 2: Expand user message terms with synonyms (HIGH WEIGHT = 5.0)
  const userMessageTerms = expandQuery(userMessage);
  const termWeights = new Map<string, number>();
  userMessageTerms.forEach(term => termWeights.set(term, 5.0));

  // Step 3: Collect pattern card context terms (LOW WEIGHT = 0.5) - only if they're relevant
  const patternTerms: string[] = [];
  
  // Only add pattern context if it's actually relevant to the user's query
  // Check if user message mentions symptoms, cycle, or related terms
  const userLower = userMessage.toLowerCase();
  const isCycleRelated = /cycle|period|menstrual|phase|ovulation|luteal|follicular/i.test(userLower);
  const isSymptomRelated = /symptom|pain|ache|discomfort|cramp|bleeding/i.test(userLower);
  
  // Don't add pattern context if user is asking about a specific condition
  // (they want info about the condition, not their pattern)
  if (conditionNames.length === 0) {
    if (isSymptomRelated && patternCard.top_symptoms.length > 0) {
      const topSymptoms = patternCard.top_symptoms.slice(0, 2).map(s => s.name.toLowerCase());
      topSymptoms.forEach(symptom => {
        const symptomTerms = expandQuery(symptom);
        symptomTerms.forEach(term => {
          if (!termWeights.has(term)) {
            termWeights.set(term, 0.5);
            patternTerms.push(term);
          }
        });
      });
    }
    
    if (isCycleRelated && patternCard.cycle_association.highest_severity_phase) {
      const phase = patternCard.cycle_association.highest_severity_phase.toLowerCase();
      const phaseTerms = expandQuery(phase);
      phaseTerms.forEach(term => {
        if (!termWeights.has(term)) {
          termWeights.set(term, 0.5);
          patternTerms.push(term);
        }
      });
    }
  }

  // Combine all terms for scoring
  const allQueryTerms = [...userMessageTerms, ...patternTerms];

  // Step 4: Score all documents with weighted terms and condition boost
  const scored = allDocs.map(doc => ({
    doc,
    score: calculateScore(doc, allQueryTerms, termWeights, conditionNames),
  }));

  // Step 5: Filter and apply strict relevance threshold
  // Only keep documents with score > 0 AND at least 40% of the top score (stricter!)
  const sorted = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (sorted.length === 0) {
    console.log('[RAG] No documents scored above 0 for query:', userMessage);
    return [];
  }

  const topScore = sorted[0].score;
  // Stricter threshold: 40% of top score, or minimum 5 (increased from 2)
  const relevanceThreshold = Math.max(5, topScore * 0.4);

  // If a specific condition was mentioned, be even more strict
  // Only return documents that mention the condition in title/tags OR score very high
  let relevant = sorted.filter(item => item.score >= relevanceThreshold);
  
  if (conditionNames.length > 0) {
    // For condition-specific queries, prioritize documents that mention the condition
    const conditionDocs = relevant.filter(item => {
      const titleLower = item.doc.title.toLowerCase();
      const tagsLower = item.doc.tags.map(t => t.toLowerCase()).join(' ');
      return conditionNames.some(condition => 
        titleLower.includes(condition.toLowerCase()) || 
        tagsLower.includes(condition.toLowerCase())
      );
    });
    
    // If we found condition-specific docs, prefer those (but still apply threshold)
    if (conditionDocs.length > 0) {
      relevant = conditionDocs;
    }
  }

  // Limit to topN
  relevant = relevant.slice(0, topN);

  console.log('[RAG] Query:', userMessage);
  console.log('[RAG] Condition names detected:', conditionNames);
  console.log('[RAG] Top score:', topScore.toFixed(1), 'Threshold:', relevanceThreshold.toFixed(1));
  console.log('[RAG] Retrieved', relevant.length, 'relevant documents:', relevant.map(r => `${r.doc.title} (score: ${r.score.toFixed(1)})`));

  // Step 6: Convert to RagEvidence format
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
