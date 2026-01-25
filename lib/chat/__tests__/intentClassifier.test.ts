/**
 * Simple test harness for intent classifier
 * Run with: npx tsx lib/chat/__tests__/intentClassifier.test.ts
 */

import { 
  classifyIntent, 
  detectReviewRecentIntent,
  extractDaysFromReviewRequest,
  extractDaysForUnderstandPatterns,
  detectUnderstandPatternsIntent,
  detectComparePeriodIntent,
  detectAddDetailIntent
} from '../intentClassifier';

// Test cases
const testCases = [
  // Review recent
  { input: 'Review my last 3 days', expected: 'review_recent', days: 3 },
  { input: 'review recent logs', expected: 'review_recent', days: 3 },
  { input: 'summary of my symptoms', expected: 'review_recent', days: 3 },
  { input: 'what patterns do you see', expected: 'review_recent', days: 3 },
  { input: 'analyze my recent symptoms', expected: 'review_recent', days: 3 },
  { input: 'review my last 7 days', expected: 'review_recent', days: 7 },
  
  // Understand patterns
  { input: 'Understand my symptom patterns', expected: 'understand_patterns', understandDays: 7 },
  { input: 'understand symptom patterns', expected: 'understand_patterns', understandDays: 7 },
  { input: 'understand what these patterns may suggest', expected: 'understand_patterns', understandDays: 7 },
  { input: 'what do these patterns mean', expected: 'understand_patterns', understandDays: 7 },
  { input: 'interpret these patterns', expected: 'understand_patterns', understandDays: 7 },
  { input: 'understand my symptom patterns from last 10 logged days', expected: 'understand_patterns', understandDays: 10 },
  
  // Compare period
  { input: 'compare this to a longer time period', expected: 'compare_period' },
  { input: 'compare to 7 days', expected: 'compare_period' },
  { input: 'compare to full history', expected: 'compare_period' },
  
  // Add detail
  { input: 'add more detail to a specific symptom', expected: 'add_detail' },
  { input: 'tell me more about a symptom', expected: 'add_detail' },
  
  // General
  { input: 'what is endometriosis', expected: 'general' },
  { input: 'help me describe pelvic pain', expected: 'general' },
];

console.log('Testing intent classifier...\n');

let passed = 0;
let failed = 0;

for (const test of testCases) {
  const result = classifyIntent(test.input);
  const days = extractDaysFromReviewRequest(test.input);
  const understandDays = extractDaysForUnderstandPatterns(test.input);
  
  if (result === test.expected) {
    if (test.days && days === test.days) {
      console.log(`✓ "${test.input}" -> ${result} (${days} days)`);
      passed++;
    } else if (test.understandDays && understandDays === test.understandDays) {
      console.log(`✓ "${test.input}" -> ${result} (${understandDays} days for understand)`);
      passed++;
    } else if (!test.days && !test.understandDays) {
      console.log(`✓ "${test.input}" -> ${result}`);
      passed++;
    } else {
      const expectedDays = test.days || test.understandDays;
      const gotDays = test.days ? days : understandDays;
      console.log(`✗ "${test.input}" -> ${result} (expected ${expectedDays} days, got ${gotDays})`);
      failed++;
    }
  } else {
    console.log(`✗ "${test.input}" -> ${result} (expected ${test.expected})`);
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);

// Test specific detection functions
console.log('\nTesting specific detection functions...');
console.log('detectReviewRecentIntent("review my last 3 days"):', detectReviewRecentIntent('review my last 3 days'));
console.log('detectUnderstandPatternsIntent("understand patterns"):', detectUnderstandPatternsIntent('understand patterns'));
console.log('detectComparePeriodIntent("compare to 7 days"):', detectComparePeriodIntent('compare to 7 days'));
console.log('detectAddDetailIntent("add detail"):', detectAddDetailIntent('add detail'));
