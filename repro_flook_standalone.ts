
// Mock Interfaces
interface DiskRequest {
    track: number;
    arrivalTime?: number;
}

interface AlgorithmStep {
    from: number;
    to: number;
    distance: number;
    remaining: number[];
    instant: number;
    arrivalInstant?: number;
}

interface AlgorithmResult {
    sequence: number[];
    totalTracks: number;
    steps: AlgorithmStep[];
}

function calculateFLOOK(
    initialTrack: number,
    requests: DiskRequest[],
    direction: 'asc' | 'desc' = 'asc',
    timePerTrack: number = 1,
    timePerRequest: number = 0
): AlgorithmResult {
    const sequence: number[] = [];
    const steps: AlgorithmStep[] = [];
    let currentTrack = initialTrack;
    let currentTime = 0;
    let goingUp = direction === 'asc';

    let pendingArchive: DiskRequest[] = [...requests].sort((a, b) => (a.arrivalTime || 0) - (b.arrivalTime || 0));

    while (pendingArchive.length > 0) {
        let activeQueue: DiskRequest[] = [];
        const arrived = pendingArchive.filter(r => (r.arrivalTime || 0) <= currentTime);

        if (arrived.length === 0) {
            if (pendingArchive.length > 0) {
                currentTime = pendingArchive[0].arrivalTime || 0;
                continue;
            } else {
                break;
            }
        }

        activeQueue = arrived;
        pendingArchive = pendingArchive.filter(r => !arrived.includes(r));

        console.log(`[Cycle Start] Time: ${currentTime}. Active Queue: [${activeQueue.map(r => r.track).join(', ')}]`);

        while (activeQueue.length > 0) {
            let targetTrack: number | null = null;
            let targetRequest: DiskRequest | null = null;

            if (goingUp) {
                const above = activeQueue.filter(r => r.track >= currentTrack).sort((a, b) => a.track - b.track);
                if (above.length > 0) {
                    targetRequest = above[0];
                    targetTrack = targetRequest.track;
                } else {
                    goingUp = false;
                    continue;
                }
            } else {
                const below = activeQueue.filter(r => r.track <= currentTrack).sort((a, b) => b.track - a.track);
                if (below.length > 0) {
                    targetRequest = below[0];
                    targetTrack = targetRequest.track;
                } else {
                    goingUp = true;
                    continue;
                }
            }

            const distance = Math.abs(targetTrack - currentTrack);
            const moveTime = distance * timePerTrack;

            steps.push({
                from: currentTrack,
                to: targetTrack,
                distance,
                remaining: activeQueue.map(r => r.track),
                instant: currentTime,
                arrivalInstant: targetRequest.arrivalTime
            });

            sequence.push(targetTrack);
            currentTrack = targetTrack;
            currentTime += moveTime;
            currentTime += timePerRequest;

            activeQueue = activeQueue.filter(r => r !== targetRequest);
        }
    }

    const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);
    return { sequence, totalTracks, steps };
}

const requestsTest: DiskRequest[] = [
    { track: 10, arrivalTime: 0 },
    { track: 19, arrivalTime: 1 },
    { track: 3, arrivalTime: 2 },
    { track: 14, arrivalTime: 3 },
    { track: 12, arrivalTime: 6 },
    { track: 9, arrivalTime: 7 },
];

const initialTrackTest = 0;
const timePerTrackTest = 1;

console.log('\n--- Testing Scenarios ---');

const scenarios = [
    { init: 0, time: 1, name: "Init 0, Time 1" },
    { init: 10, time: 1, name: "Init 10, Time 1" },
    { init: 10, time: 0.5, name: "Init 10, Time 0.5" },
    { init: 0, time: 0.5, name: "Init 0, Time 0.5" }
];

scenarios.forEach(sc => {
    const res = calculateFLOOK(sc.init, requestsTest, 'asc', sc.time, 0);
    console.log(`\nScenario [${sc.name}]: Total Tracks = ${res.totalTracks}`);
    console.log(`Steps: ${res.steps.map(s => `${s.from}->${s.to}`).join(', ')}`);
});
