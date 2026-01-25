/**
 * Simple test harness for log statistics
 * Run with: npx tsx lib/chat/__tests__/logStats.test.ts
 */

import { getLogsFromLastNDays, computeLogStatistics, getUniqueDates } from '../logStats';
import type { Log } from '@/types';

// Create test logs
const now = new Date();
const logs: Log[] = [
  // Day 1 (today)
  { id: '1', symptomType: 'Headache', severity: 5, createdAt: new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000), cyclePhase: 'menstrual', notes: 'Mild headache' },
  { id: '2', symptomType: 'Fatigue', severity: 6, createdAt: new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000), cyclePhase: 'menstrual', notes: 'Tired' },
  
  // Day 2 (yesterday)
  { id: '3', symptomType: 'Headache', severity: 7, createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), cyclePhase: 'menstrual', notes: 'Worse headache' },
  { id: '4', symptomType: 'Bleeding', severity: 8, createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), cyclePhase: 'menstrual', notes: 'Heavy bleeding' },
  
  // Day 3 (2 days ago)
  { id: '5', symptomType: 'Headache', severity: 4, createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), cyclePhase: 'luteal', notes: 'Mild' },
  
  // Day 4 (3 days ago) - should not be included in "last 3 days"
  { id: '6', symptomType: 'Fatigue', severity: 5, createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), cyclePhase: 'luteal', notes: 'Tired' },
];

console.log('Testing log statistics...\n');

// Test getUniqueDates
const uniqueDates = getUniqueDates(logs);
console.log(`Unique dates: ${uniqueDates.length} (expected: 4)`);
console.log(`Dates: ${uniqueDates.map(d => d.toLocaleDateString()).join(', ')}\n`);

// Test getLogsFromLastNDays
const last3Days = getLogsFromLastNDays(logs, 3);
console.log(`Last 3 logged days: ${last3Days.length} logs (expected: 5)`);
console.log(`Logs: ${last3Days.map(l => `${l.symptomType} (${l.severity}/10)`).join(', ')}\n`);

// Test computeLogStatistics
const stats = computeLogStatistics(last3Days);
console.log('Statistics for last 3 days:');
console.log(`Total logged days: ${stats.totalDays} (expected: 3)`);
console.log(`Symptom stats:`);
stats.symptomStats.forEach(s => {
  console.log(`  - ${s.symptomType}: ${s.count} times, avg ${s.avgSeverity}/10`);
});
console.log(`Max severity: ${stats.maxSeverityOverall}/10 (${stats.maxSeveritySymptom})`);
console.log(`Phase with max severity: ${stats.phaseWithMaxSeverity || 'none'}`);

// Verify expected results
let passed = 0;
let failed = 0;

if (uniqueDates.length === 4) {
  console.log('\n✓ getUniqueDates: PASSED');
  passed++;
} else {
  console.log(`\n✗ getUniqueDates: FAILED (expected 4, got ${uniqueDates.length})`);
  failed++;
}

if (last3Days.length === 5) {
  console.log('✓ getLogsFromLastNDays: PASSED');
  passed++;
} else {
  console.log(`✗ getLogsFromLastNDays: FAILED (expected 5, got ${last3Days.length})`);
  failed++;
}

if (stats.totalDays === 3) {
  console.log('✓ computeLogStatistics totalDays: PASSED');
  passed++;
} else {
  console.log(`✗ computeLogStatistics totalDays: FAILED (expected 3, got ${stats.totalDays})`);
  failed++;
}

if (stats.symptomStats.length === 3) { // Headache, Fatigue, Bleeding
  console.log('✓ computeLogStatistics symptom count: PASSED');
  passed++;
} else {
  console.log(`✗ computeLogStatistics symptom count: FAILED (expected 3, got ${stats.symptomStats.length})`);
  failed++;
}

const headacheStats = stats.symptomStats.find(s => s.symptomType === 'Headache');
if (headacheStats && headacheStats.count === 3 && Math.abs(headacheStats.avgSeverity - 5.3) < 0.1) {
  console.log('✓ Headache stats: PASSED');
  passed++;
} else {
  console.log(`✗ Headache stats: FAILED (expected count=3, avg≈5.3, got count=${headacheStats?.count}, avg=${headacheStats?.avgSeverity})`);
  failed++;
}

// Test 7 logged days (for understand_patterns)
console.log('\n--- Testing 7 logged days (understand_patterns default) ---');
const last7Days = getLogsFromLastNDays(logs, 7);
const stats7Days = computeLogStatistics(last7Days);
console.log(`Last 7 logged days: ${last7Days.length} logs`);
console.log(`Total logged days: ${stats7Days.totalDays}`);
console.log(`Symptom stats:`);
stats7Days.symptomStats.forEach(s => {
  console.log(`  - ${s.symptomType}: ${s.count} times, avg ${s.avgSeverity}/10`);
});

// Verify no +/-0 values in formatting
const hasZeroDeltas = stats7Days.symptomStats.some(s => s.count === 0 || s.avgSeverity === 0);
if (!hasZeroDeltas || stats7Days.symptomStats.length === 0) {
  console.log('✓ No zero values in stats (or no stats): PASSED');
  passed++;
} else {
  console.log('✗ Found zero values in stats: FAILED');
  failed++;
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
