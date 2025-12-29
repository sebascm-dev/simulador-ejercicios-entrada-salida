export type Algorithm = 'SSTF' | 'SCAN' | 'LOOK' | 'C-SCAN' | 'F-LOOK';

export interface DiskRequest {
    track: number;
    arrivalTime?: number;
}

export interface AlgorithmResult {
    sequence: number[];
    totalTracks: number;
    steps: AlgorithmStep[];
}

export interface AlgorithmStep {
    from: number;
    to: number;
    distance: number;
    remaining: number[];
    instant?: number;
    arrivalInstant?: number;
}

function findEarliestIntercept(
    currentTrack: number,
    targetTrack: number,
    currentTime: number,
    timePerTrack: number,
    pendingQueue: DiskRequest[],
    direction: 'asc' | 'desc'
): { interceptTrack: number; request: DiskRequest } | null {
    if (pendingQueue.length === 0) return null;

    const possibleIntercepts = pendingQueue.filter(req => {
        const isInPath = direction === 'asc'
            ? (req.track > currentTrack && req.track < targetTrack)
            : (req.track < currentTrack && req.track > targetTrack);

        return isInPath;
    });

    if (possibleIntercepts.length === 0) return null;

    possibleIntercepts.sort((a, b) => {
        const distA = Math.abs(a.track - currentTrack);
        const distB = Math.abs(b.track - currentTrack);
        return distA - distB;
    });

    for (const req of possibleIntercepts) {
        const distance = Math.abs(req.track - currentTrack);
        const arrivalTimeAtTrack = currentTime + (distance * timePerTrack);

        if ((req.arrivalTime || 0) <= arrivalTimeAtTrack) {
            return { interceptTrack: req.track, request: req };
        }
    }

    return null;
}

export function calculateLOOK(
    initialTrack: number,
    requests: number[] | DiskRequest[],
    direction: 'asc' | 'desc' = 'asc',
    timePerTrack: number = 1
): AlgorithmResult {
    const sequence: number[] = [];
    const steps: AlgorithmStep[] = [];
    let currentTrack = initialTrack;
    let currentTime = 0;
    let goingUp = direction === 'asc';

    const diskRequests: DiskRequest[] = Array.isArray(requests) && requests.length > 0
        ? (typeof requests[0] === 'number'
            ? requests.map(track => ({ track: track as number, arrivalTime: 0 }))
            : requests as DiskRequest[])
        : [];

    let activeQueue: DiskRequest[] = [];
    let pendingQueue: DiskRequest[] = [...diskRequests].sort((a, b) => (a.arrivalTime || 0) - (b.arrivalTime || 0));
    let remaining: DiskRequest[] = [...diskRequests];

    while (activeQueue.length > 0 || pendingQueue.length > 0) {
        while (pendingQueue.length > 0 && (pendingQueue[0].arrivalTime || 0) <= currentTime) {
            activeQueue.push(pendingQueue.shift()!);
        }

        if (activeQueue.length === 0 && pendingQueue.length > 0) {
            currentTime = pendingQueue[0].arrivalTime || 0;
            continue;
        }

        if (activeQueue.length === 0) break;

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

        let actualDest = targetTrack;
        let intercept = findEarliestIntercept(
            currentTrack,
            targetTrack,
            currentTime,
            timePerTrack,
            pendingQueue,
            goingUp ? 'asc' : 'desc'
        );

        if (intercept) {
            actualDest = intercept.interceptTrack;
        }

        const distance = Math.abs(actualDest - currentTrack);
        const moveTime = distance * timePerTrack;

        steps.push({
            from: currentTrack,
            to: actualDest,
            distance,
            remaining: activeQueue.map(r => r.track),
            instant: currentTime,
            arrivalInstant: intercept ? intercept.request.arrivalTime : targetRequest!.arrivalTime,
        });

        sequence.push(actualDest);
        currentTrack = actualDest;
        currentTime += moveTime;

        if (intercept) {
            pendingQueue = pendingQueue.filter(r => r !== intercept!.request);
        } else {
            activeQueue = activeQueue.filter(r => r !== targetRequest);
            remaining = remaining.filter(r => r !== targetRequest);
        }
    }

    const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);

    return { sequence, totalTracks, steps };
}

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
