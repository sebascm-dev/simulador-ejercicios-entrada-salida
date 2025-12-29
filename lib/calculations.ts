export interface DiskSpecs {
  sectorsPerTrack: number;
  cylinders: number;
  faces: number;
  sectorSize: number; // bytes
  blockSize: number; // bytes
}

export interface TimeSpecs {
  seekTimePerTrack: number; // ms
  rpm: number;
  sectorsPerBlock?: number;
}

export interface AccessTimeResult {
  seekTime: number; // ms
  latencyTime: number; // ms
  transferTime: number; // ms
  totalTime: number; // ms
}

export function calculateBlocksPerCylinder(specs: DiskSpecs): number {
  const bytesPerTrack = specs.sectorsPerTrack * specs.sectorSize;
  const blocksPerTrack = bytesPerTrack / specs.blockSize;
  return blocksPerTrack * specs.faces;
}

export function blockToTrack(block: number, specs: DiskSpecs): number {
  const blocksPerTrack = (specs.sectorsPerTrack * specs.sectorSize) / specs.blockSize;
  const blocksPerCylinder = blocksPerTrack * specs.faces;
  return Math.floor(block / blocksPerCylinder);
}

export function calculateAccessTime(
  totalTracks: number,
  numRequests: number,
  timeSpecs: TimeSpecs,
  specs?: DiskSpecs
): AccessTimeResult {
  // Tiempo de búsqueda
  const seekTime = totalTracks * timeSpecs.seekTimePerTrack;

  // Tiempo de latencia (media vuelta)
  const rotationTime = (60 * 1000) / timeSpecs.rpm; // ms por vuelta completa
  const latencyTime = (rotationTime / 2) * numRequests; // media vuelta por petición

  // Tiempo de transferencia
  let transferTime = 0;
  if (specs && timeSpecs.sectorsPerBlock) {
    // Tiempo para leer un bloque = (sectores por bloque / sectores por pista) * tiempo de rotación
    const sectorsPerTrack = specs.sectorsPerTrack;
    const sectorsPerBlock = timeSpecs.sectorsPerBlock;
    if (sectorsPerTrack > 0) {
      const timePerBlock = (sectorsPerBlock / sectorsPerTrack) * rotationTime;
      transferTime = timePerBlock * numRequests;
    }
  } else if (timeSpecs.sectorsPerBlock) {
    // Si no tenemos specs completas, usar una aproximación
    transferTime = (timeSpecs.sectorsPerBlock / 10) * rotationTime * numRequests; // Asumiendo 10 sectores por pista
  }

  const totalTime = seekTime + latencyTime + transferTime;

  return {
    seekTime,
    latencyTime,
    totalTime,
    transferTime,
  };
}

