import { calculateLOOK } from './lib/algorithms';

const requests = [
    { track: 10, arrivalTime: 0 },
    { track: 19, arrivalTime: 1 },
    { track: 3, arrivalTime: 2 },
    { track: 14, arrivalTime: 3 },
    { track: 12, arrivalTime: 6 },
    { track: 9, arrivalTime: 7 },
];

const result = calculateLOOK(10, requests, 'asc', 5);

console.log('Sequence:', result.sequence);
console.log('Steps:', result.steps.map(s => ({
    from: s.from,
    to: s.to,
    distance: s.distance,
    instant: s.instant
}))); 
