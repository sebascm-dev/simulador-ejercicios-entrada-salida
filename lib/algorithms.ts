export type Algorithm = 'SSTF' | 'SCAN' | 'LOOK' | 'C-SCAN' | 'F-LOOK' | 'SCAN-N' | 'C-LOOK';

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
  instant?: number; // Instante en que se procesa este paso
  arrivalInstant?: number; // Instante de llegada de la petición procesada
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

  return { sequence, totalTracks, steps };
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

    // Si es movimiento de borde, también considerar intercepciones

    if (intercept) {
      actualDest = intercept.interceptTrack;
      isEdgeMove = false; // Ya no llegamos al borde (todavía)
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
  return { sequence, totalTracks, steps };
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

  return { sequence, totalTracks, steps };
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

    if (goingUp) {
      const above = activeQueue.filter(r => r.track >= currentTrack).sort((a, b) => a.track - b.track);
      if (above.length > 0) {
        targetRequest = above[0];
        targetTrack = targetRequest.track;
      } else {
        // No hay nada encima, toca ir al borde y saltar
        targetTrack = maxTrack;
        isWrapAround = true;
      }
    } else {
      const below = activeQueue.filter(r => r.track <= currentTrack).sort((a, b) => b.track - a.track);
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
      let intercept = findEarliestIntercept(
        currentTrack,
        actualDest,
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
        arrivalInstant: intercept ? intercept.request.arrivalTime : targetRequest!.arrivalTime
      });

      sequence.push(actualDest);
      currentTrack = actualDest;
      currentTime += moveTime;

      // Sumar tiempo de servicio
      currentTime += timePerRequest;

      if (intercept) {
        pendingQueue = pendingQueue.filter(r => r !== intercept!.request);
      } else {
        activeQueue = activeQueue.filter(r => r !== targetRequest);
      }

    } else {
      // Estamos yendo al borde para saltar
      // Primero, vamos al borde actual
      // Aquí NO atendemos nada (C-SCAN definition) o sí? 
      // Normalmente C-SCAN no atiende en el "viaje de retorno", pero aquí estamos yendo al borde FINAL de la dirección útil.
      // Si aparecen cosas en el camino útiles, deberían atenderse?
      // C-SCAN estricto: atiende hasta el fin. 
      // Si hay pending requests que aparecen ANTES del maxTrack, se atienden.

      let actualDest = targetTrack!;
      let intercept = findEarliestIntercept(
        currentTrack,
        actualDest,
        currentTime,
        timePerTrack,
        pendingQueue,
        goingUp ? 'asc' : 'desc'
      );

      if (intercept) {
        // Sorpresa, apareció algo en el camino al borde
        actualDest = intercept.interceptTrack;
        // Se atiende y seguimos en el loop normal
        const distance = Math.abs(actualDest - currentTrack);
        const moveTime = distance * timePerTrack;

        steps.push({
          from: currentTrack,
          to: actualDest,
          distance,
          remaining: activeQueue.map(r => r.track),
          instant: currentTime,
          arrivalInstant: intercept.request.arrivalTime
        });
        sequence.push(actualDest);
        currentTrack = actualDest;
        currentTime += moveTime;

        // Sumar tiempo de servicio
        currentTime += timePerRequest;

        pendingQueue = pendingQueue.filter(r => r !== intercept.request);
        // No hacemos wrap aún
      } else {
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
  }

  const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);
  return { sequence, totalTracks, steps };
}

export function calculateFLOOK(
  initialTrack: number,
  requests: DiskRequest[],
  direction: 'asc' | 'desc' = 'asc',
  timePerTrack: number = 1,
  timePerRequest: number = 0
): AlgorithmResult {
  // F-LOOK (FSCAN/LOOK combination? o simplemente interrupciones congeladas?)
  // Normalmente F-SCAN usa dos colas. MIENTRAS procesa una cola, las nuevas van a la otra.
  // No hay "Intercepción dinámica" de la cola actual con cosas nuevas.
  // "F-LOOK": Congelar la cola activa. Procesar todo LOOK sobre ella. Luego swap.

  const sequence: number[] = [];
  const steps: AlgorithmStep[] = [];
  let currentTrack = initialTrack;
  let currentTime = 0;
  let goingUp = direction === 'asc';

  let pendingArchive: DiskRequest[] = [...requests].sort((a, b) => (a.arrivalTime || 0) - (b.arrivalTime || 0));

  while (pendingArchive.length > 0) {
    // Cargar TODO lo que haya llegado hasta ahora a la cola activa
    // Si no hay nada, avanzar tiempo hasta la primera llegada
    let activeQueue: DiskRequest[] = [];

    // Filtramos las que ya llegaron
    const arrived = pendingArchive.filter(r => (r.arrivalTime || 0) <= currentTime);

    if (arrived.length === 0) {
      // Nada ha llegado, avanzar reloj
      if (pendingArchive.length > 0) {
        currentTime = pendingArchive[0].arrivalTime || 0;
        continue;
      } else {
        break;
      }
    }

    // Mover de pending a active
    activeQueue = arrived;
    pendingArchive = pendingArchive.filter(r => !arrived.includes(r));

    // AHORA procesar activeQueue con lógica LOOK completa (sin admitir nuevas en MEDIO)
    // "Freeze" strategy

    while (activeQueue.length > 0) {
      let targetTrack: number | null = null;
      // let targetIndex = -1; // This variable is not used and can be removed.

      if (goingUp) {
        const above = activeQueue.map((r, i) => ({ r, i })).filter(x => x.r.track >= currentTrack).sort((a, b) => a.r.track - b.r.track);
        if (above.length > 0) {
          targetTrack = above[0].r.track;
          // targetIndex = above[0].i; // Ojo, el índice original en activeQueue puede no ser este
          // Mejor buscar por objeto
        } else {
          goingUp = false;
          continue;
        }
      } else {
        const below = activeQueue.map((r, i) => ({ r, i })).filter(x => x.r.track <= currentTrack).sort((a, b) => b.r.track - a.r.track);
        if (below.length > 0) {
          targetTrack = below[0].r.track;
        } else {
          goingUp = true;
          continue;
        }
      }

      const targetReq = activeQueue.find(r => r.track === targetTrack)!;
      const distance = Math.abs(targetTrack - currentTrack);
      const moveTime = distance * timePerTrack;

      steps.push({
        from: currentTrack,
        to: targetTrack,
        distance,
        remaining: activeQueue.map(r => r.track),
        instant: currentTime,
        arrivalInstant: targetReq.arrivalTime
      });

      sequence.push(targetTrack);
      currentTrack = targetTrack;
      currentTime += moveTime;

      // Sumar tiempo de servicio
      currentTime += timePerRequest;

      activeQueue = activeQueue.filter(r => r !== targetReq);
    }
  }

  const totalTracks = steps.reduce((sum, step) => sum + step.distance, 0);
  return { sequence, totalTracks, steps };
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
  return { sequence, totalTracks, steps };
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
  return { sequence, totalTracks, steps };
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
    default:
      throw new Error(`Algoritmo desconocido: ${algorithm}`);
  }
}
