export type Algorithm = 'SSTF' | 'SCAN' | 'LOOK' | 'C-SCAN' | 'F-LOOK' | 'SCAN-N' | 'C-LOOK' | 'F-SCAN' | 'LOOK-N';

export interface DiskRequest {
  track: number;
  arrivalTime?: number;
}

export interface AlgorithmResult {
  sequence: number[];
  totalTracks: number;
  steps: AlgorithmStep[];
  totalTime: number;
}

export interface AlgorithmStep {
  from: number;
  to: number;
  distance: number;
  remaining: number[];
  instant?: number; // Instante en que se procesa este paso
  arrivalInstant?: number; // Instante de llegada de la petición procesada
  buffer?: number[]; // Cola de espera (buffer) para algoritmos tipo F-SCAN
}

// Función auxiliar para encontrar si alguna petición pendiente "intercepta" el movimiento
function findEarliestIntercept(
  currentTrack: number,
  targetTrack: number,
  currentTime: number,
  timePerTrack: number,
  pendingQueue: DiskRequest[],
  direction: 'asc' | 'desc'
): { interceptTrack: number; request: DiskRequest } | null {
  if (pendingQueue.length === 0) return null;

  // Filtrar peticiones que están en el camino
  const possibleIntercepts = pendingQueue.filter(req => {
    // Debe estar entre current (excluyendo) y target (excluyendo, pues target ya es el destino)
    // Pero si target es una intercepción previa, podría ser... simplifiquemos:
    // Estar estrictamente entre current y target
    const isInPath = direction === 'asc'
      ? (req.track > currentTrack && req.track < targetTrack)
      : (req.track < currentTrack && req.track > targetTrack);

    return isInPath;
  });

  if (possibleIntercepts.length === 0) return null;

  // Ordenar por cercanía al currentTrack
  possibleIntercepts.sort((a, b) => {
    const distA = Math.abs(a.track - currentTrack);
    const distB = Math.abs(b.track - currentTrack);
    return distA - distB;
  });

  // Verificar cuál es la primera que llega a tiempo
  for (const req of possibleIntercepts) {
    const distance = Math.abs(req.track - currentTrack);
    const arrivalTimeAtTrack = currentTime + (distance * timePerTrack);

    // Si la petición llega antes o justo al mismo tiempo que la cabeza pasa por ahí
    if ((req.arrivalTime || 0) <= arrivalTimeAtTrack) {
      // Preventing infinite loop: if intercept track IS the current track,
      // and we haven't consumed it yet, we should return it ONLY if it's the target itself (which is handled by main loop)
      // or if it really intercepts.
      // Actually, if track == currentTrack, distance is 0.
      // If we return it as intercept, the main loop sets nextTrack = currentTrack, distance = 0.
      // Then it MUST consume it.
      return { interceptTrack: req.track, request: req };
    }
  }

  return null;
}

export function calculateSSTF(
  initialTrack: number,
  requests: number[] | DiskRequest[],
  timePerTrack: number = 1,
  timePerRequest: number = 0
): AlgorithmResult {
  const sequence: number[] = [];
  const steps: AlgorithmStep[] = [];
  let currentTrack = initialTrack;
  let currentTime = 0;

  // Convertir a DiskRequest[] si es necesario
  const diskRequests: DiskRequest[] = Array.isArray(requests) && requests.length > 0
    ? (typeof requests[0] === 'number'
      ? requests.map(track => ({ track: track as number, arrivalTime: 0 }))
      : requests as DiskRequest[])
    : [];

  // Separar peticiones en cola activa y pendiente
  let activeQueue: DiskRequest[] = [];
  let pendingQueue: DiskRequest[] = [...diskRequests].sort((a, b) => (a.arrivalTime || 0) - (b.arrivalTime || 0));
  let remaining: DiskRequest[] = [...diskRequests];

  while (activeQueue.length > 0 || pendingQueue.length > 0) {
    // Mover peticiones pendientes a la cola activa si han llegado
    while (pendingQueue.length > 0 && (pendingQueue[0].arrivalTime || 0) <= currentTime) {
      activeQueue.push(pendingQueue.shift()!);
    }

    if (activeQueue.length === 0 && pendingQueue.length > 0) {
      // Avanzar el tiempo hasta la siguiente llegada
      const nextArrival = pendingQueue[0].arrivalTime || 0;
      // IMPORTANTE: Si estamos esperando, no movemos la cabeza, solo pasa el tiempo
      if (currentTime < nextArrival) {
        currentTime = nextArrival;
        continue; // Revaluar bucle para mover a activeQueue
      }
    }

    if (activeQueue.length === 0) break;

    // Encontrar la petición más cercana en la cola activa
    let minDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < activeQueue.length; i++) {
      const distance = Math.abs(activeQueue[i].track - currentTrack);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    const selectedRequest = activeQueue[closestIndex];
    let nextTrack = selectedRequest.track;
    let distance = Math.abs(nextTrack - currentTrack);
    let moveTime = distance * timePerTrack;

    // VERIFICAR INTERCEPCIONES (SSTF normalmente es voraz estático, pero con llegadas dinámicas...)
    // Si mientras voy a la mejor, "paso por encima" de una que YA está en activeQueue?
    // SSTF puro recalcula a cada paso. Si asumimos movimiento atómico, está bien.
    // Si asumimos movimiento continuo, deberíamos checkear si ALGUIEN se vuelve más cercano en el camino.
    // Para simplificar y mantener el espíritu "Shortest Time First" clásico: vamos al destino.
    // Pero si aparece una NUEVA petición (desde pending) que está MUY cerca?
    // Implementación simple: Verificar si podemos interceptar ALGO de pendingQueue que se vuelve active en el camino.

    const direction: 'asc' | 'desc' = nextTrack > currentTrack ? 'asc' : 'desc';
    const intercept = findEarliestIntercept(currentTrack, nextTrack, currentTime, timePerTrack, pendingQueue, direction);

    if (intercept) {
      nextTrack = intercept.interceptTrack;
      distance = Math.abs(nextTrack - currentTrack);
      moveTime = distance * timePerTrack;
      // No sacamos nada de activeQueue todavía porque la interceptada viene de pending
      // Pero llegará justo a tiempo para ser procesada.
    }

    // Avanzar
    steps.push({
      from: currentTrack,
      to: nextTrack,
      distance,
      remaining: activeQueue.map(r => r.track), // Esto es aproximado en caso de intercepción
      instant: currentTime,
      arrivalInstant: intercept ? intercept.request.arrivalTime : selectedRequest.arrivalTime,
    });

    sequence.push(nextTrack);
    currentTrack = nextTrack;
    currentTime += moveTime;

    // Simular tiempo de servicio
    currentTime += timePerRequest;

    // Procesar la petición atendida
    if (intercept) {
      // Fue una intercepción, la petición estaba en pendingQueue o acababa de entrar a active?
      // findEarliestIntercept mira pendingQueue.
      // Debemos eliminarla de pendingQueue y remaining.
      pendingQueue = pendingQueue.filter(r => r !== intercept.request);
      remaining = remaining.filter(r => r !== intercept.request);
      // Y NO tocamos activeQueue ni selectedRequest (original), volverán a evaluarse
    } else {
      // Fue la seleccionada de activeQueue
      activeQueue.splice(closestIndex, 1);
      remaining = remaining.filter(r => r !== selectedRequest);
    }
  }

  const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);

  return { sequence, totalTracks, steps, totalTime: currentTime };
}

export function calculateSCAN(
  initialTrack: number,
  requests: number[] | DiskRequest[],
  maxTrack: number,
  direction: 'asc' | 'desc' = 'asc',
  timePerTrack: number = 1,
  timePerRequest: number = 0,
  minTrack: number = 0
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

    // 0. Prioridad absoluta: Si hay una petición en la posición actual en la cola activa, atiéndela YA.
    // Esto evita bucles de "moverse a sí mismo" o problemas con intercepciones de distancia 0.
    const atCurrent = activeQueue.find(r => r.track === currentTrack);
    if (atCurrent) {
      steps.push({
        from: currentTrack,
        to: currentTrack,
        distance: 0,
        remaining: activeQueue.map(r => r.track),
        instant: currentTime,
        arrivalInstant: atCurrent.arrivalTime,
      });
      sequence.push(currentTrack);
      currentTime += timePerRequest;
      activeQueue = activeQueue.filter(r => r !== atCurrent);
      remaining = remaining.filter(r => r !== atCurrent);
      continue;
    }

    let targetTrack: number | null = null;
    let targetRequest: DiskRequest | null = null;
    let isEdgeMove = false;

    if (goingUp) {
      const above = activeQueue.filter(r => r.track > currentTrack).sort((a, b) => a.track - b.track);
      if (above.length > 0) {
        targetRequest = above[0];
        targetTrack = targetRequest.track;
      } else {
        targetTrack = maxTrack; // Ir al borde
        isEdgeMove = true;
      }
    } else {
      const below = activeQueue.filter(r => r.track < currentTrack).sort((a, b) => b.track - a.track);
      if (below.length > 0) {
        targetRequest = below[0];
        targetTrack = targetRequest.track;
      } else {
        targetTrack = minTrack; // Ir al borde
        isEdgeMove = true;
      }
    }

    // Si estamos en el borde y cambiamos dirección
    if (currentTrack === targetTrack) {
      goingUp = !goingUp;
      continue; // Reevaluar en nueva dirección
    }

    // Verificar intercepción
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
      // Verificar si la intercepción es válida (está estrictamente en el camino)
      // findEarliestIntercept ya debería garantizar esto, pero doble seguridad
      actualDest = intercept.interceptTrack;
      isEdgeMove = false;
    }

    const distance = Math.abs(actualDest - currentTrack);
    const moveTime = distance * timePerTrack;

    steps.push({
      from: currentTrack,
      to: actualDest,
      distance,
      remaining: activeQueue.map(r => r.track),
      instant: currentTime,
      arrivalInstant: intercept ? intercept.request.arrivalTime : (targetRequest ? targetRequest.arrivalTime : undefined),
    });

    if (!isEdgeMove) {
      sequence.push(actualDest);
    }

    currentTrack = actualDest;
    currentTime += moveTime;

    // Si atendimos una petición (no fue solo mover al borde), sumar tiempo de servicio
    if (!isEdgeMove) {
      currentTime += timePerRequest;
    }

    if (intercept) {
      pendingQueue = pendingQueue.filter(r => r !== intercept!.request);
      remaining = remaining.filter(r => r !== intercept!.request);
    } else if (targetRequest && !isEdgeMove) {
      activeQueue = activeQueue.filter(r => r !== targetRequest);
      remaining = remaining.filter(r => r !== targetRequest);
    } else if (isEdgeMove) {
      goingUp = !goingUp; // Llegamos al borde, rebotar
    }
  }

  const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);
  return { sequence, totalTracks, steps, totalTime: currentTime };
}

export function calculateLOOK(
  initialTrack: number,
  requests: number[] | DiskRequest[],
  direction: 'asc' | 'desc' = 'asc',
  timePerTrack: number = 1,
  timePerRequest: number = 0
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

    // Estrategia "LOOK": Si no hay nada en active pero HAY en pending, esperar.
    if (activeQueue.length === 0 && pendingQueue.length > 0) {
      currentTime = pendingQueue[0].arrivalTime || 0;
      continue;
    }

    // Si ambos vacíos, terminar
    if (activeQueue.length === 0) break;

    let targetTrack: number | null = null;
    let targetRequest: DiskRequest | null = null;

    if (goingUp) {
      const above = activeQueue.filter(r => r.track >= currentTrack).sort((a, b) => a.track - b.track);
      if (above.length > 0) {
        targetRequest = above[0];
        targetTrack = targetRequest.track;
      } else {
        goingUp = false; // Cambiar dirección
        continue;
      }
    } else {
      const below = activeQueue.filter(r => r.track <= currentTrack).sort((a, b) => b.track - a.track);
      if (below.length > 0) {
        targetRequest = below[0];
        targetTrack = targetRequest.track;
      } else {
        goingUp = true; // Cambiar dirección
        continue;
      }
    }

    // Verificar si aunque hay un 'target' en active, aparece un 'intercept' en el camino
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

    // Sumar tiempo de servicio
    currentTime += timePerRequest;

    if (intercept) {
      // Consumir el interceptado
      pendingQueue = pendingQueue.filter(r => r !== intercept!.request);
      // NO consumimos targetRequest, sigue en activeQueue para la próxima
    } else {
      // Consumir el objetivo original
      activeQueue = activeQueue.filter(r => r !== targetRequest);
      remaining = remaining.filter(r => r !== targetRequest);
    }
  }

  const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);

  return { sequence, totalTracks, steps, totalTime: currentTime };
}

export function calculateCSCAN(
  initialTrack: number,
  requests: number[] | DiskRequest[],
  maxTrack: number,
  direction: 'asc' | 'desc' = 'asc',
  timePerTrack: number = 1,
  timePerRequest: number = 0,
  minTrack: number = 0
): AlgorithmResult {
  const sequence: number[] = [];
  const steps: AlgorithmStep[] = [];
  let currentTrack = initialTrack;
  let currentTime = 0;
  const goingUp = direction === 'asc'; // C-SCAN siempre respeta su dirección circular

  // En C-SCAN 'desc' significa que solo atiende bajando y salta arriba? 
  // La implementación original tenía lógica para ambas, asumamos simetría.
  // Pero lo común es "SCAN Circular hacia arriba" o "hacia abajo".

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
    let isWrapAround = false;

    // 0. Prioridad absoluta
    const atCurrent = activeQueue.find(r => r.track === currentTrack);
    if (atCurrent) {
      steps.push({
        from: currentTrack,
        to: currentTrack,
        distance: 0,
        remaining: activeQueue.map(r => r.track),
        instant: currentTime,
        arrivalInstant: atCurrent.arrivalTime,
      });
      sequence.push(currentTrack);
      currentTime += timePerRequest;
      activeQueue = activeQueue.filter(r => r !== atCurrent);
      continue;
    }


    if (goingUp) {
      const above = activeQueue.filter(r => r.track > currentTrack).sort((a, b) => a.track - b.track);
      if (above.length > 0) {
        targetRequest = above[0];
        targetTrack = targetRequest.track;
      } else {
        // No hay nada encima, toca ir al borde y saltar
        targetTrack = maxTrack;
        isWrapAround = true;
      }
    } else {
      const below = activeQueue.filter(r => r.track < currentTrack).sort((a, b) => b.track - a.track);
      if (below.length > 0) {
        targetRequest = below[0];
        targetTrack = targetRequest.track;
      } else {
        targetTrack = minTrack;
        isWrapAround = true;
      }
    }

    // Lógica de avance
    if (!isWrapAround) {
      // Movimiento normal de servicio
      let actualDest = targetTrack!;
      // Intercepción eliminada para respetar la decisión inicial del paso

      const distance = Math.abs(actualDest - currentTrack);
      const moveTime = distance * timePerTrack;

      steps.push({
        from: currentTrack,
        to: actualDest,
        distance,
        remaining: activeQueue.map(r => r.track),
        instant: currentTime,
        arrivalInstant: targetRequest!.arrivalTime
      });

      sequence.push(actualDest);
      currentTrack = actualDest;
      currentTime += moveTime;

      // Sumar tiempo de servicio
      currentTime += timePerRequest;

      activeQueue = activeQueue.filter(r => r !== targetRequest);

    } else {
      // Estamos yendo al borde para saltar
      // Primero, vamos al borde actual
      // Aquí NO atendemos nada (C-SCAN definition) o sí? 
      // Normalmente C-SCAN no atiende en el "viaje de retorno", pero aquí estamos yendo al borde FINAL de la dirección útil.
      // Si aparecen cosas en el camino útiles, deberían atenderse?
      // C-SCAN estricto: atiende hasta el fin. 
      // Si hay pending requests que aparecen ANTES del maxTrack, se atienden.

      // Eliminada lógica de intercepción: decisión determinista al inicio del paso.

      // Llegamos al borde
      const distance = Math.abs(targetTrack! - currentTrack);
      const moveTime = distance * timePerTrack;
      steps.push({
        from: currentTrack,
        to: targetTrack!,
        distance,
        remaining: activeQueue.map(r => r.track),
        instant: currentTime
      });
      currentTrack = targetTrack!;
      currentTime += moveTime;

      // NO se suma timePerRequest aquí porque solo llegamos al borde

      // AHORA el salto (The Wrap)
      // El salto es instantáneo o cuenta distancia? "Circular jump". 
      // Generalmente es un salto largo que no atiende nada.
      const newStart = goingUp ? minTrack : maxTrack;
      const jumpDist = Math.abs(newStart - currentTrack);
      const jumpTime = jumpDist * timePerTrack;

      steps.push({
        from: currentTrack,
        to: newStart,
        distance: jumpDist,
        remaining: activeQueue.map(r => r.track),
        instant: currentTime
      });
      currentTrack = newStart;
      currentTime += jumpTime;
    }
  }

  const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);
  return { sequence, totalTracks, steps, totalTime: currentTime };
}


export function calculateFSCAN(
  initialTrack: number,
  requests: number[] | DiskRequest[],
  maxTrack: number,
  direction: 'asc' | 'desc' = 'asc',
  timePerTrack: number = 1,
  timePerRequest: number = 0,
  minTrack: number = 0
): AlgorithmResult {
  const sequence: number[] = [];
  const steps: AlgorithmStep[] = [];
  let currentTrack = initialTrack;
  let currentTime = 0;
  let goingUp = direction === 'asc';

  // Archivo principal de peticiones
  const diskRequests: DiskRequest[] = Array.isArray(requests) && requests.length > 0
    ? (typeof requests[0] === 'number'
      ? requests.map(track => ({ track: track as number, arrivalTime: 0 }))
      : requests as DiskRequest[])
    : [];

  let pendingArchive: DiskRequest[] = [...diskRequests].sort((a, b) => (a.arrivalTime || 0) - (b.arrivalTime || 0));
  let bufferQueue: DiskRequest[] = []; // Cola de espera para el siguiente barrido
  let activeQueue: DiskRequest[] = []; // Cola congelada actual

  // Bucle principal: mientras haya peticiones en cualquier lugar
  while (activeQueue.length > 0 || bufferQueue.length > 0 || pendingArchive.length > 0) {

    // 1. Fase de Carga (Freeze)
    if (activeQueue.length === 0) {
      if (bufferQueue.length > 0) {
        // Swap: Buffer se convierte en Active
        activeQueue = [...bufferQueue];
        bufferQueue = [];
      } else if (pendingArchive.length > 0) {
        // Si buffer vacío, verificar si hay nuevas llegadas en pendingArchive
        // Avanzar tiempo si es necesario
        const nextArrival = pendingArchive[0].arrivalTime || 0;
        if (currentTime < nextArrival) {
          currentTime = nextArrival;
        }
        // Cargar SOLO las que han llegado hasta currentTime (o todas las que llegan AHORA mismo si saltamos el tiempo)
        // En F-SCAN "puro", si la máquina está ociosa, carga todo lo disponible.
        const available = pendingArchive.filter(r => (r.arrivalTime || 0) <= currentTime);
        if (available.length > 0) {
          activeQueue = available;
          pendingArchive = pendingArchive.filter(r => !available.includes(r));
        } else {
          // Caso raro: currentTime < nextArrival pero no avanzamos? (Ya avanzamos arriba)
          // Si llegamos aquí es que pendingArchive tiene cosas pero en el futuro.
          // El salto de tiempo de arriba debió cubrirlo.
          // Pero por seguridad, si activeQueue sigue empty, force jump.
          const forcedJump = pendingArchive[0].arrivalTime || 0;
          currentTime = forcedJump;
          const nowAvailable = pendingArchive.filter(r => (r.arrivalTime || 0) <= currentTime);
          activeQueue = nowAvailable;
          pendingArchive = pendingArchive.filter(r => !nowAvailable.includes(r));
        }
      } else {
        break; // Todo vacío
      }
    }

    // 2. Fase de Barrido (Sweep) de la Cola Activa
    // Procesamos activeQueue HASTA QUE SE VACÍE.
    // Durante este proceso, nuevas peticiones van a bufferQueue.

    while (activeQueue.length > 0) {

      // Verificar llegadas pendientes y moverlas a BUFFER (no a active)
      const newArrivals = pendingArchive.filter(r => (r.arrivalTime || 0) <= currentTime);
      if (newArrivals.length > 0) {
        bufferQueue.push(...newArrivals);
        pendingArchive = pendingArchive.filter(r => !newArrivals.includes(r));
      }

      // Lógica SCAN sobre activeQueue
      // 0. Check current track
      const atCurrent = activeQueue.find(r => r.track === currentTrack);
      if (atCurrent) {
        steps.push({
          from: currentTrack,
          to: currentTrack,
          distance: 0,
          remaining: activeQueue.map(r => r.track),
          buffer: bufferQueue.map(r => r.track),
          instant: currentTime,
          arrivalInstant: atCurrent.arrivalTime,
        });
        sequence.push(currentTrack);
        currentTime += timePerRequest;
        activeQueue = activeQueue.filter(r => r !== atCurrent);
        continue;
      }

      let targetTrack: number | null = null;
      let targetRequest: DiskRequest | null = null;
      let isEdgeMove = false;

      if (goingUp) {
        const above = activeQueue.filter(r => r.track > currentTrack).sort((a, b) => a.track - b.track);
        if (above.length > 0) {
          targetRequest = above[0];
          targetTrack = targetRequest.track;
        } else {
          targetTrack = maxTrack;
          isEdgeMove = true;
        }
      } else {
        const below = activeQueue.filter(r => r.track < currentTrack).sort((a, b) => b.track - a.track);
        if (below.length > 0) {
          targetRequest = below[0];
          targetTrack = targetRequest.track;
        } else {
          targetTrack = minTrack;
          isEdgeMove = true;
        }
      }

      // Cambio de dirección si estamos en el borde
      if (currentTrack === targetTrack) {
        goingUp = !goingUp;
        continue;
      }

      // Movimiento hacia targetTrack
      // AQUÍ ES LA CLAVE: No hay intercepción dinámica que cambie el destino. 
      // Bueno, si una petición de activeQueue está en el camino, ¿la atendemos? 
      // SI, SCAN atiende al paso.
      // Pero SOLO si está en activeQueue.
      // Find intercept in ACTIVE QUEUE

      let actualDest = targetTrack;
      // Usamos findEarliestIntercept pero pasando activeQueue en vez de pendingQueue?
      // findEarliestIntercept está diseñado para "pendingQueue arrival logic".
      // Aquí activeQueue ya está "arrived".
      // Simplemente buscamos si hay alguna request en activeQueue entre current y target.
      // Ya hemos ordenado above/below. Si targetRequest es activeQueue[0], no hay nada entre medio en activeQueue.
      // Porque sorted by track.

      // PERO: Si vamos al borde (isEdgeMove), puede haber requests en activeQueue? No, porque filtramos y no había nada.
      // Entonces, en F-SCAN, dentro de activeQueue, siempre vamos al siguiente más cercano.
      // NO hay intercepción de "nuevas llegadas" para cambiar el destino actual.
      // Las nuevas van a buffer.

      const distance = Math.abs(actualDest - currentTrack);
      const moveTime = distance * timePerTrack;

      // Check if new requests arrive DURING the move
      // pendingArchive -> bufferQueue
      // We can simulate precise arrival if we want steps to be granular, 
      // but for visualization usually jumping to destination is fine, 
      // assuming we catch updates at the end.
      // However, strictly, if a request arrives at t+1 and we move for 10s, it belongs in buffer.
      // We handle this check at top of loop, but we need to handle it occurring *during* the move time.

      // Just update time and sweeping check at end of move is sufficient for queue logic,
      // unless we want to show "arrival" animation exactly when it happens.
      // The step visualizer uses start/end anyway.

      steps.push({
        from: currentTrack,
        to: actualDest,
        distance,
        remaining: activeQueue.map(r => r.track),
        buffer: bufferQueue.map(r => r.track),
        instant: currentTime,
        arrivalInstant: targetRequest ? targetRequest.arrivalTime : undefined
      });

      if (!isEdgeMove) {
        sequence.push(actualDest);
      }

      currentTrack = actualDest;
      currentTime += moveTime;

      // Now that time passed, check arrivals into BUFFER
      const arrivalsDuringMove = pendingArchive.filter(r => (r.arrivalTime || 0) <= currentTime);
      if (arrivalsDuringMove.length > 0) {
        bufferQueue.push(...arrivalsDuringMove);
        pendingArchive = pendingArchive.filter(r => !arrivalsDuringMove.includes(r));
      }

      if (!isEdgeMove) {
        currentTime += timePerRequest; // Service time
      }

      if (targetRequest && !isEdgeMove) {
        activeQueue = activeQueue.filter(r => r !== targetRequest);
      } else if (isEdgeMove) {
        goingUp = !goingUp;
      }
    }
  }

  const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);
  const result: AlgorithmResult = { sequence, totalTracks, steps, totalTime: currentTime };
  return result;
}

export function calculateFLOOK(
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
  let bufferQueue: DiskRequest[] = []; // Cola de espera para el siguiente ciclo
  let activeQueue: DiskRequest[] = []; // Cola congelada actual

  while (activeQueue.length > 0 || bufferQueue.length > 0 || pendingArchive.length > 0) {

    // 1. Fase de Carga (Freeze)
    if (activeQueue.length === 0) {
      // Mover todo el buffer a la cola activa
      if (bufferQueue.length > 0) {
        activeQueue = [...bufferQueue];
        bufferQueue = [];
      }

      // Además, checkear si hay cosas nuevas en pendingArchive que han llegado YA (o si todo estaba vacío, saltar tiempo)
      // Si buffer estaba vacío, quizás necesitamos saltar tiempo.
      // Si buffer tenía cosas, igual cargamos lo que haya llegado hasta ahora para completar el lote freeze.

      // Chequeo de tiempo si todo está vacío
      if (activeQueue.length === 0 && pendingArchive.length > 0) {
        const nextArrival = pendingArchive[0].arrivalTime || 0;
        if (currentTime < nextArrival) {
          currentTime = nextArrival;
        }
      }

      // Cargar nuevas llegadas
      const available = pendingArchive.filter(r => (r.arrivalTime || 0) <= currentTime);
      if (available.length > 0) {
        activeQueue.push(...available);
        pendingArchive = pendingArchive.filter(r => !available.includes(r));
      }

      if (activeQueue.length === 0) {
        // Nada disponible ni en buffer ni llegó nada.
        break;
      }
    }

    // 2. Procesar Cola Activa (LOOK Strategy)
    // Ordenar inicialmente según dirección? No, LOOK busca aleatoriamente según dirección.

    while (activeQueue.length > 0) {

      // Antes de mover, checkear llegadas para el BUFFER (visualización correcta)
      const newArrivals = pendingArchive.filter(r => (r.arrivalTime || 0) <= currentTime);
      if (newArrivals.length > 0) {
        bufferQueue.push(...newArrivals);
        pendingArchive = pendingArchive.filter(r => !newArrivals.includes(r));
      }

      // Lógica Prioritaria: Si estamos encima de una petición, atenderla.
      const atCurrent = activeQueue.find(r => r.track === currentTrack);
      if (atCurrent) {
        steps.push({
          from: currentTrack,
          to: currentTrack,
          distance: 0,
          remaining: activeQueue.map(r => r.track),
          buffer: bufferQueue.map(r => r.track),
          instant: currentTime,
          arrivalInstant: atCurrent.arrivalTime,
        });
        sequence.push(currentTrack);
        currentTime += timePerRequest;
        activeQueue = activeQueue.filter(r => r !== atCurrent);
        continue;
      }

      // Buscar siguiente objetivo según dirección (LOOK)
      let targetTrack: number | null = null;
      let targetRequest: DiskRequest | null = null;

      if (goingUp) {
        // Buscar hacia arriba
        const above = activeQueue.filter(r => r.track > currentTrack).sort((a, b) => a.track - b.track);
        if (above.length > 0) {
          targetRequest = above[0];
          targetTrack = targetRequest.track;
        } else {
          // Cambiar dirección
          goingUp = false;
          continue;
        }
      } else {
        // Buscar hacia abajo
        const below = activeQueue.filter(r => r.track < currentTrack).sort((a, b) => b.track - a.track);
        if (below.length > 0) {
          targetRequest = below[0];
          targetTrack = targetRequest.track;
        } else {
          // Cambiar dirección
          goingUp = true;
          continue;
        }
      }

      // Mover cabeza
      // Nota: En F-LOOK la cola activa es fija, no hay intercepciones nuevas que entren en active.
      // Solo intercepciones de la PROPIA activeQueue?
      // Sí, si voy a 100 y paso por 50 que también está en activeQueue, debería parar?
      // LOOK normal sí lo hace. Nuestro activeQueue tiene TODO el lote.
      // Hemos seleccionado 'targetRequest' como la MÁS CERCANA en esa dirección.
      // (Sort by track difference).
      // Así que NO debería haber nadie en medio del activeQueue.
      // Ejemplo: Current 10. Active [100, 50]. Going Up.
      // Filter > 10 -> [100, 50]. Sort a-b -> [50, 100].
      // Target es 50. No hay nadie entre 10 y 50.
      // Así que movimiento directo es seguro.

      const distance = Math.abs(targetTrack - currentTrack);
      const moveTime = distance * timePerTrack;

      steps.push({
        from: currentTrack,
        to: targetTrack,
        distance,
        remaining: activeQueue.map(r => r.track),
        buffer: bufferQueue.map(r => r.track),
        instant: currentTime,
        arrivalInstant: targetRequest.arrivalTime
      });

      sequence.push(targetTrack);
      currentTrack = targetTrack;
      currentTime += moveTime;

      // Checkear llegadas durante el movimiento
      const arrivalsDuringMove = pendingArchive.filter(r => (r.arrivalTime || 0) <= currentTime);
      if (arrivalsDuringMove.length > 0) {
        bufferQueue.push(...arrivalsDuringMove);
        pendingArchive = pendingArchive.filter(r => !arrivalsDuringMove.includes(r));
      }

      currentTime += timePerRequest;

      activeQueue = activeQueue.filter(r => r !== targetRequest);
    }
  }

  const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);
  return { sequence, totalTracks, steps, totalTime: currentTime };
}

export function calculateSCAN_N(
  initialTrack: number,
  requests: DiskRequest[],
  nStep: number,
  maxTrack: number,
  direction: 'asc' | 'desc' = 'asc',
  timePerTrack: number = 1,
  timePerRequest: number = 0,
  minTrack: number = 0
): AlgorithmResult {
  const sequence: number[] = [];
  const steps: AlgorithmStep[] = [];
  let currentTrack = initialTrack;
  let currentTime = 0;
  let goingUp = direction === 'asc';

  // Archivo de donde vamos sacando lotes
  let pendingArchive: DiskRequest[] = [...requests].sort((a, b) => (a.arrivalTime || 0) - (b.arrivalTime || 0));

  while (pendingArchive.length > 0) {
    // 1. Formar Lote Activo (Batch)
    // Filtramos lo que ha llegado
    let arrived = pendingArchive.filter(r => (r.arrivalTime || 0) <= currentTime);

    // Si nada ha llegado, manejamos el comportamiento de "wait" / "idle scanning"
    if (arrived.length === 0) {
      if (pendingArchive.length > 0) {
        // Comportamiento SCAN-N: Si se queda vacía, completa el barrido hasta el extremo
        const targetEdge = goingUp ? maxTrack : minTrack;

        if (currentTrack !== targetEdge) {
          const distance = Math.abs(targetEdge - currentTrack);
          const moveTime = distance * timePerTrack;

          steps.push({
            from: currentTrack,
            to: targetEdge,
            distance: distance,
            remaining: [], // Cola vacía
            instant: currentTime,
            arrivalInstant: undefined
          });
          sequence.push(targetEdge);
          currentTrack = targetEdge;
          currentTime += moveTime;
          // Al tocar fondo, invierte dirección
          goingUp = !goingUp;
        }

        // Si aún así no hemos llegado al tiempo del siguiente, "esperamos"
        const nextArrival = pendingArchive[0].arrivalTime || 0;
        if (currentTime < nextArrival) {
          // Paso de espera
          steps.push({
            from: currentTrack,
            to: currentTrack,
            distance: 0,
            remaining: [],
            instant: currentTime, // Wait starts here
            arrivalInstant: undefined // No specific request
          });
          // Extendemos el instante final del paso de espera? 
          // Mejor: el siguiente paso reflejará el nuevo tiempo de inicio.
          // O podemos hacer que este paso represente el salto. 
          // Simple: Just update time.
          currentTime = nextArrival;
        }

        // Recalcular arrived con el nuevo tiempo
        arrived = pendingArchive.filter(r => (r.arrivalTime || 0) <= currentTime);
      } else {
        break; // No hay nada más
      }
    }

    // Tomamos los N primeros por orden de llegada
    const batchSize = nStep;
    // IMPORTANTE: pendingArchive ya está ordenado por arrivalTime.
    // arrived es un subconjunto.
    // "Tomas las N primeras peticiones pendientes"
    const batch = arrived.slice(0, batchSize);

    // Quitamos del archivo global lo que hemos metido al lote
    pendingArchive = pendingArchive.filter(r => !batch.includes(r));

    let activeQueue = batch;

    // 2. Ejecutar SCAN sobre el Lote Activo (congelado)
    // Procesamos hasta vaciar el lote
    while (activeQueue.length > 0) {
      let targetTrack: number | null = null;
      let targetRequest: DiskRequest | null = null;
      let isEdgeMove = false;

      if (goingUp) {
        const above = activeQueue.filter(r => r.track >= currentTrack).sort((a, b) => a.track - b.track);
        if (above.length > 0) {
          targetRequest = above[0];
          targetTrack = targetRequest.track;
        } else {
          targetTrack = maxTrack; // Ir al borde
          isEdgeMove = true;
        }
      } else {
        const below = activeQueue.filter(r => r.track <= currentTrack).sort((a, b) => b.track - a.track);
        if (below.length > 0) {
          targetRequest = below[0];
          targetTrack = targetRequest.track;
        } else {
          targetTrack = minTrack; // Ir al borde
          isEdgeMove = true;
        }
      }

      // Si estamos en el borde y cambiamos dirección
      if (currentTrack === targetTrack) {
        goingUp = !goingUp;
        continue;
      }

      // SCAN-N no hace "intercepción dinámica" con peticiones fuera del lote.
      // El lote está congelado. Solo importan las intercepciones DENTRO del lote.
      // (a diferencia de LOOK/SCAN puro donde todo entra).
      // Pero, dentro del lote, ¿podemos interceptar?
      // "Ejecutas SCAN con ese lote activo... atiendes las peticiones del lote que encuentres en ese sentido"
      // Sí, funciona como un mini-SCAN normal restricted to batch.

      let actualDest = targetTrack;
      // Usamos findEarliestIntercept pero SOLO con activeQueue como 'pendingQueue'
      let intercept = findEarliestIntercept(
        currentTrack,
        targetTrack,
        currentTime,
        timePerTrack,
        activeQueue, // OJO: activeQueue son las que YA han llegado (freeze), así que su arrivalTime <= currentTime is trivial?
        // No necesariamente, arrivalTime <= currentTimeGlobalStart.
        // Pero currentTime ha avanzado. Todas en activeQueue tienen arrivalTime <= 'time at batch start'.
        // Así que todas son "visibles".
        // findEarliestIntercept checkea arrivalTime vs currentTime + travel.
        // Como todas ya "llegaron" hace tiempo, siempre devuelve true time-wise.
        // Solo importa la posición.
        goingUp ? 'asc' : 'desc'
      );

      if (intercept) {
        actualDest = intercept.interceptTrack;
        isEdgeMove = false;
      }

      const distance = Math.abs(actualDest - currentTrack);
      const moveTime = distance * timePerTrack;

      steps.push({
        from: currentTrack,
        to: actualDest,
        distance,
        remaining: activeQueue.map(r => r.track),
        instant: currentTime,
        arrivalInstant: intercept ? intercept.request.arrivalTime : (targetRequest ? targetRequest.arrivalTime : undefined),
      });

      if (!isEdgeMove) {
        sequence.push(actualDest);
      }

      currentTrack = actualDest;
      currentTime += moveTime;

      if (!isEdgeMove) {
        currentTime += timePerRequest;
      }

      if (intercept) {
        activeQueue = activeQueue.filter(r => r !== intercept!.request);
      } else if (targetRequest && !isEdgeMove) {
        activeQueue = activeQueue.filter(r => r !== targetRequest);
      } else if (isEdgeMove) {
        goingUp = !goingUp;
      }
    }
    // Fin del lote. Repetir bucle externo para coger siguiente lote.
  }

  const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);
  return { sequence, totalTracks, steps, totalTime: currentTime };
}

export function calculateCLOOK(
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
  const goingUp = direction === 'asc'; // C-LOOK maintains direction

  // Create a working copy of requests with arrival times handled
  let pendingQueue = requests.map(r => ({ ...r, arrivalTime: r.arrivalTime || 0 }));

  // Sort by arrival time initially to handle "future" requests logic if needed, 
  // but main loop filters by currentTime.

  // We need to loop until all requests are processed
  while (pendingQueue.length > 0) {
    // Get requests that have arrived by now
    let arrived = pendingQueue.filter(r => r.arrivalTime <= currentTime);

    if (arrived.length === 0) {
      // Wait for next arrival
      const remainingSorted = [...pendingQueue].sort((a, b) => a.arrivalTime - b.arrivalTime);
      if (remainingSorted.length > 0) {
        const nextTime = remainingSorted[0].arrivalTime;
        // Add a "Wait" step if meaningful gap?
        // For visualization, maybe nice. For now just jump time.
        if (nextTime > currentTime) {
          steps.push({
            from: currentTrack,
            to: currentTrack,
            distance: 0,
            remaining: [],
            instant: currentTime,
            arrivalInstant: undefined
          });
          currentTime = nextTime;
        }
        arrived = pendingQueue.filter(r => r.arrivalTime <= currentTime);
      } else {
        break; // Should not happen if pendingQueue > 0
      }
    }

    let targetRequest: DiskRequest | null = null;
    let targetTrack: number | null = null;
    let isJump = false;

    // 1. Look for requests in the current direction
    if (goingUp) {
      // Higher or equal tracks
      const ahead = arrived.filter(r => r.track >= currentTrack).sort((a, b) => a.track - b.track);
      if (ahead.length > 0) {
        targetRequest = ahead[0];
        targetTrack = targetRequest.track;
      }
    } else {
      // Lower or equal tracks
      const below = arrived.filter(r => r.track <= currentTrack).sort((a, b) => b.track - a.track);
      if (below.length > 0) {
        targetRequest = below[0];
        targetTrack = targetRequest.track;
      }
    }

    // 2. If no requests ahead, Wrap/Jump to the other end of requests
    if (!targetRequest) {
      // Find the extreme request in the accumulated buffer
      // If Asc: Jump to Lowest track.
      // If Desc: Jump to Highest track.
      isJump = true;
      if (goingUp) {
        const allSorted = arrived.sort((a, b) => a.track - b.track);
        if (allSorted.length > 0) {
          targetRequest = allSorted[0]; // Lowest
          targetTrack = targetRequest.track;
        }
      } else {
        const allSorted = arrived.sort((a, b) => b.track - a.track); // Desc
        if (allSorted.length > 0) {
          targetRequest = allSorted[0]; // Highest
          targetTrack = targetRequest.track;
        }
      }
    }

    if (!targetTrack && targetTrack !== 0) {
      // Can happen if arrived is empty (handled above) or ???
      // Should not happen if arrived > 0
      break;
    }

    if (targetTrack !== null) {
      let actualDest = targetTrack;

      // Only intercept if NOT a jump
      let intercept = null;
      if (!isJump) {
        intercept = findEarliestIntercept(
          currentTrack,
          targetTrack,
          currentTime,
          timePerTrack,
          pendingQueue,
          goingUp ? 'asc' : 'desc'
        );
      }

      if (intercept) {
        actualDest = intercept.interceptTrack;
        targetRequest = intercept.request;
        // Intercept is inherently a service stop, not a jump
      }

      // Wait, if it IS a jump, we traverse Distance = abs(dest - curr).
      // And "C-LOOK: el salto es entre peticiones".
      // During jump, we do NOT service.

      const distance = Math.abs(actualDest - currentTrack);
      const moveTime = distance * timePerTrack;

      steps.push({
        from: currentTrack,
        to: actualDest,
        distance: distance,
        remaining: arrived.map(r => r.track),
        instant: currentTime,
        arrivalInstant: targetRequest!.arrivalTime,
      });

      // Sequence: Add if it's a SERVICE stop.
      // Jumps (wraps) are usually just movement.
      // But the user example: "50->55... 90->10 (wrap)... 10->20".
      // The wrap lands on 10. Does it service 10?
      // "saltas desde la última atendida ... a la petición más alta pendiente"
      // Logic implies we go there TO service it.
      // So yes, we arrive at 10 and service it.
      // Unless it's just "Head Positioning". 
      // "Es como un ascensor... baja del tirón al piso más bajo donde hay alguien esperando" -> And picks them up.
      // So 10 IS serviced.

      sequence.push(actualDest);

      currentTrack = actualDest;
      currentTime += moveTime;

      // If servicing (which we always do at destination in C-LOOK/LOOK unless it's an edge bounce which C-LOOK avoids)
      // C-LOOK doesn't bounce off empty edges. It bounces off Requests.
      // So every stop is a service stop.
      currentTime += timePerRequest;

      // Remove processed request
      // Note: If intercept, remove intercept.request. 
      // If jump or normal, remove targetRequest.
      // targetRequest is set in all branches.
      if (targetRequest) {
        pendingQueue = pendingQueue.filter(r => r !== targetRequest);
      }
    }
  }

  const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);
  return { sequence, totalTracks, steps, totalTime: currentTime };
}

export function calculateLOOKN(
  initialTrack: number,
  requests: number[] | DiskRequest[],
  nStep: number,
  direction: 'asc' | 'desc' = 'asc',
  timePerTrack: number = 1,
  timePerRequest: number = 0
): AlgorithmResult {
  const sequence: number[] = [];
  const steps: AlgorithmStep[] = [];
  let currentTrack = initialTrack;
  let currentTime = 0;

  // Unlike SCAN-N, LOOK-N doesn't force going to edges, but it respects the N-step batching.
  // Direction strategy: "LOOK" style within the batch.
  // "Si tu dirección actual es “hacia pistas más altas”, atiendes primero las peticiones de A por encima... hasta la última; luego cambias de sentido..."
  // This implies we default to 'asc' or whatever the current head direction is.
  let goingUp = direction === 'asc';

  const diskRequests: DiskRequest[] = Array.isArray(requests) && requests.length > 0
    ? (typeof requests[0] === 'number'
      ? requests.map(track => ({ track: track as number, arrivalTime: 0 }))
      : requests as DiskRequest[])
    : [];

  let pendingQueue: DiskRequest[] = [...diskRequests].sort((a, b) => (a.arrivalTime || 0) - (b.arrivalTime || 0));
  let activeQueue: DiskRequest[] = [];

  // We need to know what was processed to remove from pending/active logic cleanly?
  // Actually, we can just consume from pendingQueue into activeQueue.

  while (activeQueue.length > 0 || pendingQueue.length > 0) {
    // 1. Fill Phase: If active is empty, fill it with N requests from pending
    // Important: We only take requests that have arrived by `currentTime`?
    // The prompt says: "tomas de la cola global hasta N peticiones (normalmente en orden de llegada)".
    // Standard N-Step usually waits if queue is empty until something arrives.

    if (activeQueue.length === 0) {
      if (pendingQueue.length === 0) break; // All done

      // Check if any request has arrived
      const nextArrival = pendingQueue[0].arrivalTime || 0;
      if (currentTime < nextArrival) {
        currentTime = nextArrival;
      }

      // Get all available requests up to N
      // Note: Strict N-Step might take strictly the next N regardless of time if we assume they are already known?
      // But in a real OS, only arrived requests are known.
      // Prompt says: "tomas de la cola global hasta N peticiones".
      // Let's take up to N from those that have arrived <= currentTime.
      // If 0 arrived (but we jumped time above), at least 1 is available.

      const available = pendingQueue.filter(r => (r.arrivalTime || 0) <= currentTime);
      // Sort by arrival time to be fair (FIFO for the batch selection)
      available.sort((a, b) => (a.arrivalTime || 0) - (b.arrivalTime || 0));

      const batch = available.slice(0, nStep);

      if (batch.length === 0) {
        // Should not happen if we updated currentTime, unless pendingQueue was empty (checked).
        // Maybe all pending are in future?
        // We already did currentTime = nextArrival.
        // So at least pendingQueue[0] is available.
        // Recalculate available just in case logic above was slightly off (e.g. filter issue)
        const forcedBatch = pendingQueue.slice(0, nStep);
        // If we force batch, we must update time to the latest arrival in that batch?
        // No, the system works causally. We can only process what has arrived.
        // If we advanced time to `nextArrival`, then `nextArrival` IS available.
        activeQueue = [pendingQueue[0]];
        // Try to fill the rest of N if they have same arrival time?
        // Simply: Take pendingQueue[0], and any others <= its arrival time, up to N.
        const first = pendingQueue[0];
        currentTime = Math.max(currentTime, first.arrivalTime || 0);
        pendingQueue.shift(); // Remove first
        activeQueue.push(first);

        // Fill remainder up to N from arrived
        while (activeQueue.length < nStep && pendingQueue.length > 0) {
          if ((pendingQueue[0].arrivalTime || 0) <= currentTime) {
            activeQueue.push(pendingQueue.shift()!);
          } else {
            break;
          }
        }
      } else {
        // Normal case: we found some available
        activeQueue = [...batch];
        // Remove from pending
        pendingQueue = pendingQueue.filter(r => !batch.includes(r));
      }
    }

    // 2. Process Phase (LOOK on activeQueue)
    // "Atiendes A con LOOK"
    // While A is not empty
    while (activeQueue.length > 0) {

      // Check current track service
      // (If multiple at current track, service all? LOOK usually does).
      const atCurrent = activeQueue.filter(r => r.track === currentTrack);
      if (atCurrent.length > 0) {
        // Service all at current
        for (const req of atCurrent) {
          steps.push({
            from: currentTrack,
            to: currentTrack,
            distance: 0,
            remaining: activeQueue.map(r => r.track),
            buffer: pendingQueue.filter(r => (r.arrivalTime || 0) <= currentTime).map(r => r.track),
            instant: currentTime,
            arrivalInstant: req.arrivalTime
          });
          sequence.push(currentTrack);
          currentTime += timePerRequest;
          activeQueue = activeQueue.filter(r => r !== req);
        }
        continue; // Re-evaluate loop
      }

      // Find target in current direction
      let targetRequest: DiskRequest | null = null;
      let targetTrack: number | null = null;

      if (goingUp) {
        const above = activeQueue.filter(r => r.track > currentTrack).sort((a, b) => a.track - b.track);
        if (above.length > 0) {
          targetRequest = above[0];
          targetTrack = targetRequest.track;
        } else {
          // No more above, switch direction
          // "luego cambias de sentido y atiendes las que quedan por debajo"
          goingUp = false;
          continue; // Re-evaluate with new direction
        }
      } else {
        const below = activeQueue.filter(r => r.track < currentTrack).sort((a, b) => b.track - a.track);
        if (below.length > 0) {
          targetRequest = below[0];
          targetTrack = targetRequest.track;
        } else {
          goingUp = true;
          continue;
        }
      }

      // LOOK-N: The activeQueue is "frozen" (no new requests enter A during this sweep).
      // But do we intercept *other requests in A*?
      // Yes, standard LOOK intercepts anything in the path.
      // Since A is fixed, we can just check if any *other* request in A is on the way.
      // We already sorted `above` / `below`.
      // `targetRequest` is the NEAREST one in that direction.
      // So we just go to `targetRequest`.
      // Are there "intercepts"?
      // Since we picked the standard "sorted closest in direction", there is NO INTERCEPT from A itself.
      // (e.g. at 50, requests 60, 80. `above` is [60, 80]. Target is 60. 60 intercepts 80? No, 60 IS the target).

      const distance = Math.abs(targetTrack - currentTrack);
      const moveTime = distance * timePerTrack;

      steps.push({
        from: currentTrack,
        to: targetTrack,
        distance: distance,
        remaining: activeQueue.map(r => r.track),
        buffer: pendingQueue.filter(r => (r.arrivalTime || 0) <= currentTime).map(r => r.track),
        instant: currentTime,
        arrivalInstant: targetRequest.arrivalTime
      });

      sequence.push(targetTrack);
      currentTrack = targetTrack;
      currentTime += moveTime;
      currentTime += timePerRequest;

      activeQueue = activeQueue.filter(r => r !== targetRequest);
    }
    // End of Cycle: activeQueue is empty.
    // Loop back to Fill Phase.
  }

  const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);
  return { sequence, totalTracks, steps, totalTime: currentTime };
}

export function calculateAlgorithm(
  algorithm: Algorithm,
  initialTrack: number,
  requests: number[] | DiskRequest[],
  maxTrack?: number,
  direction: 'asc' | 'desc' = 'asc',
  timePerTrack: number = 1,
  timePerRequest: number = 0,
  minTrack: number = 0,
  nStep: number = 2
): AlgorithmResult {
  switch (algorithm) {
    case 'SSTF':
      return calculateSSTF(initialTrack, requests, timePerTrack, timePerRequest);
    case 'SCAN':
      return calculateSCAN(initialTrack, requests, maxTrack || 999, direction, timePerTrack, timePerRequest, minTrack);
    case 'LOOK':
      return calculateLOOK(initialTrack, requests, direction, timePerTrack, timePerRequest);
    case 'C-SCAN':
      return calculateCSCAN(initialTrack, requests, maxTrack || 999, direction, timePerTrack, timePerRequest, minTrack);
    case 'F-LOOK':
      return calculateFLOOK(initialTrack, requests as DiskRequest[], direction, timePerTrack, timePerRequest);
    case 'SCAN-N':
      return calculateSCAN_N(initialTrack, requests as DiskRequest[], nStep, maxTrack || 999, direction, timePerTrack, timePerRequest, minTrack);
    case 'C-LOOK':
      return calculateCLOOK(initialTrack, requests as DiskRequest[], direction, timePerTrack, timePerRequest);
    case 'F-SCAN':
      return calculateFSCAN(initialTrack, requests, maxTrack || 999, direction, timePerTrack, timePerRequest, minTrack);
    case 'LOOK-N':
      return calculateLOOKN(initialTrack, requests as DiskRequest[], nStep, direction, timePerTrack, timePerRequest);
    default:
      throw new Error(`Algoritmo desconocido: ${algorithm}`);
  }
}
