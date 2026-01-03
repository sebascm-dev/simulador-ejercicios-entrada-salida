import { calculateLOOKN, DiskRequest } from './lib/algorithms';

const requests: DiskRequest[] = [
    { track: 10, arrivalTime: 0 },
    { track: 20, arrivalTime: 0 },
    { track: 30, arrivalTime: 0 },
    // These arrive later
    { track: 50, arrivalTime: 100 },
    { track: 60, arrivalTime: 100 },
];

const initialTrack = 0;
const timePerTrack = 1;
const N = 2; // Batch size 2

console.log('--- Testing LOOK-N with Future Arrivals ---');
// At T=0, only 10, 20, 30 are available.
// Active should take 10, 20. Backlog (BUFFER) should have 30.
// But 50 and 60 should NOT be in Buffer yet.

const result = calculateLOOKN(initialTrack, requests, N, 'asc', timePerTrack, 0);

result.steps.forEach((s, i) => {
    console.log(`#${i + 1} Time: ${s.instant}`);
    console.log(`    Active: [${s.remaining?.join(', ')}]`);
    console.log(`    Buffer: [${s.buffer?.join(', ')}]`); // Should NOT contain 50, 60 at T=0
});
