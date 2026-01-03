import { calculateLOOKN, DiskRequest } from './lib/algorithms';

const requests: DiskRequest[] = [
    { track: 10, arrivalTime: 0 },
    { track: 70, arrivalTime: 0 },
    { track: 90, arrivalTime: 0 },
    { track: 20, arrivalTime: 0 },
    { track: 60, arrivalTime: 0 },
    { track: 80, arrivalTime: 0 },
];

const initialTrack = 50;
const timePerTrack = 1;
const N = 3;

// User Example:
// Cabezal en pista 50, dirección subiendo.
// Llegan (en este orden): [10, 70, 90, 20, 60, 80, …]
// Usamos LOOK-N con N=3.
// Ciclo 1: A = [10, 70, 90] (las 3 primeras)
// LOOK sobre A, desde 50 subiendo:
// Subida: 70 -> 90 
// Cambio de sentido (ya no hay más arriba en A)
// Bajada: 10
// Secuencia ciclo 1: 50 -> 70 -> 90 -> 10

console.log('--- Testing LOOK-N ---');
// Note: We need to pass exact arrival times to simulate "arriving order" if we use logic that respects time.
// In the example, they imply they arrive in that order. 
// My implementation respects arrivalTime.
// So I gave them 0, 1, 2, 3, 4, 5. N=3 means it picks 0, 1, 2 first -> 10, 70, 90.

const result = calculateLOOKN(initialTrack, requests, N, 'asc', timePerTrack, 0);

console.log('Total Tracks:', result.totalTracks);
console.log('Steps:');
result.steps.forEach((s, i) => {
    console.log(`#${i + 1} From ${s.from} To ${s.to} (Dist: ${s.distance})`);
    console.log(`    Time: ${s.instant}`);
    console.log(`    Active Queue was: [${s.remaining?.join(', ')}]`);
    if (s.buffer) {
        console.log(`    Buffer: [${s.buffer.join(', ')}]`);
    }
});

const sequence = result.sequence;
console.log('Full Sequence:', sequence);

// Expected Sequence: 70, 90, 10, ... next cycle
// Next Cycle A = [20, 60, 80]
// Head is at 10. Direction? Last move was 90->10 (Desc).
// So direction is Desc.
// Below 10 in A? None.
// Switch to Asc.
// Above 10 in A? 20, 60, 80.
// Order: 20, 60, 80.
// So 10 -> 20 -> 60 -> 80.
// Full Expected: 70, 90, 10, 20, 60, 80.
