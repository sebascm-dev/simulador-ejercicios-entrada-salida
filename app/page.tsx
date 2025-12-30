'use client';

import React, { useState } from 'react';
import { Algorithm, calculateAlgorithm, DiskRequest } from '@/lib/algorithms';
import InputSection from '@/components/InputSection';
import ResultTable from '@/components/ResultTable';
import TrackVisualization from '@/components/TrackVisualization';
import ArrivalTimeInput, { ArrivalInstance } from '@/components/ArrivalTimeInput';
import GitHubContributors from '@/components/GitHubContributors';
import DiskGeometryCalculator from '@/components/DiskGeometryCalculator';
import TimeAnalysis from '@/components/TimeAnalysis';

const DevelopmentOverlay = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
      <span className="bg-white/90 px-4 py-2 rounded-full text-sm font-semibold text-gray-600 shadow-sm border border-gray-200 pointer-events-none select-none">
        Desarrollando...
      </span>
    </div>
    <div className="opacity-40 pointer-events-none select-none filter blur-[1px]">
      {children}
    </div>
  </div>
);

export default function Home() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('SSTF');
  const [initialTrack, setInitialTrack] = useState<number | ''>(0);
  const [requests, setRequests] = useState<string>('');
  const [arrivalInstances, setArrivalInstances] = useState<ArrivalInstance[]>([]);
  const [useArrivalInstances, setUseArrivalInstances] = useState<boolean>(false);
  const [minTrack, setMinTrack] = useState<number | ''>(0);
  const [maxTrack, setMaxTrack] = useState<number | ''>(0);
  const [nStep, setNStep] = useState<number | ''>(2); // N para SCAN-N
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [result, setResult] = useState<any>(null);

  const handleCalculate = () => {
    try {
      let requestArray: number[] = [];
      let diskRequests: DiskRequest[] = [];

      if (useArrivalInstances && arrivalInstances.length > 0) {
        // Usar instantes de llegada
        diskRequests = arrivalInstances.flatMap(instance =>
          instance.tracks.map(track => ({
            track,
            arrivalTime: instance.instant,
          }))
        );
        requestArray = diskRequests.map(r => r.track);
      } else {
        // Usar modo simple (solo peticiones)
        if (!requests.trim()) {
          alert('Por favor ingrese las peticiones de pistas');
          return;
        }
        requestArray = requests
          .split(',')
          .map(s => parseInt(s.trim()))
          .filter(n => !isNaN(n));
      }

      if (requestArray.length === 0) {
        alert('Por favor ingrese al menos una petición válida');
        return;
      }

      // Validar que no haya pistas duplicadas en el mismo instante
      if (useArrivalInstances && arrivalInstances.length > 0) {
        const duplicates = diskRequests.filter((req, index) =>
          diskRequests.findIndex(r => r.track === req.track && r.arrivalTime === req.arrivalTime) !== index
        );
        if (duplicates.length > 0) {
          console.warn('Hay peticiones duplicadas:', duplicates);
        }
      }

      let algorithmResult;

      const safeInitialTrack = initialTrack === '' ? 0 : initialTrack;
      const safeMinTrack = minTrack === '' ? 0 : minTrack;
      const safeMaxTrack = maxTrack === '' ? 0 : maxTrack;
      const safeNStep = nStep === '' ? 2 : nStep;

      // Todos los algoritmos ahora soportan tiempos de llegada y service time (se pasan 0 para compatibilidad)
      if (useArrivalInstances && arrivalInstances.length > 0) {
        algorithmResult = calculateAlgorithm(algorithm, safeInitialTrack, diskRequests, safeMaxTrack, direction, 0, 0, safeMinTrack, safeNStep);
      } else {
        const defaultRequests: DiskRequest[] = requestArray.map(track => ({
          track,
          arrivalTime: 0,
        }));
        algorithmResult = calculateAlgorithm(algorithm, safeInitialTrack, defaultRequests, safeMaxTrack, direction, 0, 0, safeMinTrack, safeNStep);
      }

      setResult(algorithmResult);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleReset = () => {
    setAlgorithm('SSTF');
    setInitialTrack(0);
    setRequests('');
    setArrivalInstances([]);
    setUseArrivalInstances(false);
    setMinTrack(0);
    setMaxTrack(0);
    setNStep(2);
    setDirection('asc');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 p-4 bg-white rounded-lg shadow-sm">
          {/* Left: UHU Logo */}
          <div className="flex-shrink-0">
            <img
              src="/logoUHU.webp"
              alt="Logo UHU"
              className="h-28 w-auto object-contain"
            />
          </div>

          {/* Center: Course Name + Title + Desc */}
          <div className="text-center flex-1 flex flex-col items-center">
            <p className="text-gray-400 font-bold text-xs leading-tight uppercase tracking-wide mb-1">
              Diseño y Estructura de los Sistemas Operativos
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Simulador de Ejercicios de E/S (UHU)
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Simulador interactivo para algoritmos de planificación de discos (SSTF, SCAN, LOOK, C-SCAN, F-LOOK, SCAN-N, C-LOOK)
            </p>
          </div>

          {/* Right: ETSI Logo */}
          <div className="flex-shrink-0">
            <img
              src="/logoETSI.webp"
              alt="Logo ETSI"
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Panel de Entrada */}
          <div className="space-y-6">
            <InputSection title="Configuración del Algoritmo">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Algoritmo
                  </label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="SSTF">SSTF (Shortest Seek Time First)</option>
                    <option value="SCAN">SCAN (Elevator)</option>
                    <option value="C-SCAN">C-SCAN (Circular SCAN)</option>
                    <option value="SCAN-N">SCAN-N (N-step SCAN)</option>
                    <option value="LOOK">LOOK</option>
                    <option value="C-LOOK">C-LOOK (Circular LOOK)</option>
                    <option value="F-LOOK">F-LOOK</option>
                  </select>
                </div>

                {algorithm === 'SCAN-N' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      N (Tamaño del paso)
                    </label>
                    <input
                      type="number"
                      value={nStep}
                      onChange={(e) => setNStep(e.target.value === '' ? '' : parseInt(e.target.value))}
                      placeholder="Ej: 2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pista Inicial
                  </label>
                  <input
                    type="number"
                    value={initialTrack}
                    onChange={(e) => setInitialTrack(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="Ej: 50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={useArrivalInstances}
                      onChange={(e) => setUseArrivalInstances(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Usar instantes de llegada (para F-LOOK y algoritmos con tiempos)
                    </span>
                  </label>
                </div>

                {useArrivalInstances ? (
                  <ArrivalTimeInput
                    instances={arrivalInstances}
                    onChange={setArrivalInstances}
                  />
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peticiones de Pistas (separadas por comas)
                    </label>
                    <input
                      type="text"
                      value={requests}
                      onChange={(e) => setRequests(e.target.value)}
                      placeholder="Ej: 754, 433, 285, 176, 667, 827"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Para usar tiempos de llegada, active la opción de arriba
                    </p>
                  </div>
                )}


                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pista Mínima
                    </label>
                    <input
                      type="number"
                      value={minTrack}
                      onChange={(e) => setMinTrack(e.target.value === '' ? '' : parseInt(e.target.value))}
                      placeholder="Ej: 0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pista Máxima
                    </label>
                    <input
                      type="number"
                      value={maxTrack}
                      onChange={(e) => setMaxTrack(e.target.value === '' ? '' : parseInt(e.target.value))}
                      placeholder="Ej: 99"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {(algorithm === 'SCAN' || algorithm === 'LOOK' || algorithm === 'C-SCAN' || algorithm === 'F-LOOK' || algorithm === 'SCAN-N' || algorithm === 'C-LOOK') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección Inicial
                    </label>
                    <select
                      value={direction}
                      onChange={(e) => setDirection(e.target.value as 'asc' | 'desc')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="asc">Ascendente (Hacia arriba)</option>
                      <option value="desc">Descendente (Hacia abajo)</option>
                    </select>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleCalculate}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                  >
                    Calcular
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md transition duration-200 border border-gray-300"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>
            </InputSection>

            <DiskGeometryCalculator />


          </div>

          {/* Panel de Resultados */}
          <div className="space-y-6">
            {result && (
              <>
                <TrackVisualization
                  steps={result.steps}
                  initialTrack={initialTrack === '' ? 0 : initialTrack}
                  maxTrack={maxTrack === '' ? 199 : maxTrack}
                  minTrack={minTrack === '' ? 0 : minTrack}
                />

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Tabla Detallada
                  </h3>
                  <ResultTable steps={result.steps} totalTracks={result.totalTracks} />
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Resultados
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Secuencia:</span>
                      <span className="font-semibold text-gray-900">
                        {initialTrack} → {result.sequence.join(' → ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de pistas:</span>
                      <span className="font-bold text-primary-600 text-lg">
                        {result.totalTracks}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time Analysis Component */}
                <DevelopmentOverlay>
                  <TimeAnalysis
                    totalTracksMoved={result ? result.totalTracks : 0}
                    totalRequests={result ? (useArrivalInstances ? arrivalInstances.length : requests.split(',').filter(x => x.trim()).length) : 0}
                  />
                </DevelopmentOverlay>
              </>
            )}

            {!result && (
              <div className="bg-white rounded-lg shadow-md p-12 border border-gray-200 text-center">
                <p className="text-gray-500">
                  Ingrese los parámetros y haga clic en "Calcular" para ver los resultados
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 py-6 text-center text-gray-500 text-sm border-t border-gray-200">
          <p>
            Hecho por <span className="font-semibold text-gray-700">Sebastián Contreras Marín</span> - Universidad de Huelva (Ingeniería Informática)
          </p>
        </footer>
        <GitHubContributors />
      </div>
    </div>
  );
}
