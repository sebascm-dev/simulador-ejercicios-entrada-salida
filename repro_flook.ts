import { calculateFLOOK, DiskRequest } from './lib/algorithms';

const requests: DiskRequest[] = [
    { track: 10, arrivalTime: 0 },
    { track: 19, arrivalTime: 1 },
    { track: 3, arrivalTime: 2 },
    { track: 14, arrivalTime: 3 },
    { track: 12, arrivalTime: 6 },
    { track: 9, arrivalTime: 7 },
];

const initialTrack = 0; // Guessing
const timePerTrack = 1;

console.log('--- Testing F-LOOK ---');
const result = calculateFLOOK(initialTrack, requests, 'asc', timePerTrack, 0);

console.log('Total Tracks:', result.totalTracks);
console.log('Steps:');
result.steps.forEach((s, i) => {
    console.log(`#${i + 1} From ${s.from} To ${s.to} (Dist: ${s.distance})`);
    console.log(`    Time: ${s.instant}`);
    console.log(`    Active Queue was: [${s.remaining.join(', ')}]`);
});

console.log('\n--- Comparing with LOOK (hypothetical logic) ---');
// If LOOK, 12 and 9 would be intercepted or added.
