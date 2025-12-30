'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlgorithmStep } from '@/lib/algorithms';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconRefresh,
  IconPlayerTrackNext,
  IconPlayerTrackPrev
} from '@tabler/icons-react';

interface TrackVisualizationProps {
  steps: AlgorithmStep[];
  initialTrack: number;
  maxTrack: number;
  minTrack: number;
}

interface ChartDataPoint {
  paso: number;
  pista: number;
  desde: number;
  hacia: number;
  distancia: number;
  esSalto: boolean;
  instante?: number;
}

export default function TrackVisualization({
  steps,
  initialTrack,
  maxTrack,
  minTrack,
}: TrackVisualizationProps) {
  // Animation State
  const [currentStepLimit, setCurrentStepLimit] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per step
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize step limit when steps change
  useEffect(() => {
    // When new simulation runs, reset to full view (or 0 if we want auto-play? let's default to full view for now)
    // Actually, user probably wants to see the result immediately. 
    // Let's default to FULL view (show all).
    setCurrentStepLimit(steps.length);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [steps]);

  // Handle Animation Timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepLimit((prev) => {
          if (prev < steps.length) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return prev;
          }
        });
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, steps.length]);

  // Controls Handlers
  const handlePlayPause = () => {
    if (currentStepLimit >= steps.length && !isPlaying) {
      // If at end and hit play, restart
      setCurrentStepLimit(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepLimit(0);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStepLimit((prev) => Math.min(prev + 1, steps.length));
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentStepLimit((prev) => Math.max(prev - 1, 0));
  };

  const handleShowAll = () => {
    setIsPlaying(false);
    setCurrentStepLimit(steps.length);
  };

  // Slice steps based on current limit
  const visibleSteps = useMemo(() => {
    return steps.slice(0, currentStepLimit);
  }, [steps, currentStepLimit]);


  // Preparar datos para la gráfica (reusing logic but with visibleSteps)
  const { normalLineData, jumpLineData } = useMemo(() => {
    const normalData: any[] = [];
    const jumpData: any[] = [];

    const createPoint = (stepIndex: number, track: number, extra: any = {}) => ({
      paso: stepIndex,
      pista: track,
      ...extra
    });

    const startPoint = createPoint(0, initialTrack, {
      desde: initialTrack,
      hacia: initialTrack,
      distancia: 0,
      esSalto: false
    });

    // Siempre añadir punto inicial
    // Pero si el primer paso VISIBLE es un salto, cuidado
    if (visibleSteps.length > 0) {
      const firstIsJump = isCircularJump(visibleSteps[0], maxTrack, minTrack);
      if (firstIsJump) {
        jumpData.push(startPoint);
        // Break for normal line immediately if jump starts from 0? 
        // Logic: if P0->P1 is jump, JumpLine draws P0->P1. NormalLine draws P0 but needs break.
        normalData.push(startPoint);
        normalData.push({ paso: 0.5, pista: null });
      } else {
        normalData.push(startPoint);
        jumpData.push(startPoint);
        // Break jump line
        jumpData.push({ paso: 0.5, pista: null });
      }
    } else {
      // No steps visible, just show start point
      normalData.push(startPoint);
    }

    visibleSteps.forEach((step, index) => {
      const currentPaso = index + 1;
      const prevPaso = index;
      const isJump = isCircularJump(step, maxTrack, minTrack);

      const point = createPoint(currentPaso, step.to, {
        desde: step.from,
        hacia: step.to,
        distancia: step.distance,
        esSalto: isJump,
        instante: step.instant
      });

      if (isJump) {
        // Add previous point to jump line to ensure connection
        jumpData.push({ ...point, paso: prevPaso, pista: step.from });
        jumpData.push(point);

        // Break normal line
        normalData.push({ paso: currentPaso - 0.5, pista: null });
        normalData.push(point); // Start point for next normal segment
      } else {
        // Add previous point to normal line
        normalData.push({ ...point, paso: prevPaso, pista: step.from });
        normalData.push(point);

        // Break jump line
        jumpData.push({ paso: currentPaso - 0.5, pista: null });
        jumpData.push(point);
      }
    });

    return { normalLineData: normalData, jumpLineData: jumpData };
  }, [visibleSteps, initialTrack, maxTrack, minTrack]);

  function isCircularJump(step: AlgorithmStep, maxTrack: number, minTrack: number): boolean {
    const range = maxTrack - minTrack;
    return step.distance > range * 0.5 &&
      ((step.from === minTrack && step.to === maxTrack) ||
        (step.from === maxTrack && step.to === minTrack) ||
        (step.from === minTrack && step.to === minTrack + 1 && maxTrack > 100) ||
        (step.from === minTrack + 1 && step.to === maxTrack && maxTrack > 100));
  }

  const minY = minTrack;

  // Calculate effective max Y to ensure graph doesn't flatten if user inputs invalid maxTrack (e.g. 0)
  // or if visited tracks exceed the configured max.
  const maxVisitedTrack = useMemo(() => {
    if (steps.length === 0) return initialTrack;
    return Math.max(initialTrack, ...steps.map(s => s.to));
  }, [steps, initialTrack]);

  // If configured maxTrack is 0 (likely user error) or less than visited tracks, use maxVisited.
  // Add a small buffer if range is 0 to avoid Recharts issues.
  let maxY = Math.max(maxTrack, maxVisitedTrack);
  if (maxY <= minY) maxY = minY + 10;

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.paso === 0) {
      return <circle cx={cx} cy={cy} r={6} fill="#10b981" stroke="#fff" strokeWidth={2} />;
    }
    if (payload.esSalto) {
      return <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} />;
    }
    return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={2} />;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
            {data.paso === 0 ? 'Punto Inicial' : `Paso ${data.paso}`}
          </p>
          {data.paso > 0 && (
            <>
              {data.instante !== undefined && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Instante:</span> {Number(data.instante.toFixed(3))}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Desde:</span> {data.desde}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Hacia:</span> {data.hacia}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Distancia:</span>{' '}
                <span className="font-bold text-blue-600 dark:text-blue-400">{data.distancia}</span> pistas
              </p>
              {data.esSalto && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">⚡ Salto Circular</p>
              )}
            </>
          )}
          {data.paso === 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Pista:</span> {data.pista}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Visualización del Recorrido
        </h3>

        {/* Animation Controls - Desktop */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 p-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
            title="Reiniciar"
          >
            <IconRefresh size={18} />
          </button>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <button
            onClick={handleStepBack}
            disabled={currentStepLimit === 0}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 transition-colors"
            title="Paso Anterior"
          >
            <IconPlayerTrackPrev size={18} />
          </button>
          <button
            onClick={handlePlayPause}
            className={`p-1.5 rounded-md transition-colors ${isPlaying ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'}`}
            title={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
          </button>
          <button
            onClick={handleStepForward}
            disabled={currentStepLimit >= steps.length}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 transition-colors"
            title="Siguiente Paso"
          >
            <IconPlayerTrackNext size={18} />
          </button>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <button
            onClick={handleShowAll}
            className="text-xs font-medium px-2 py-1 rounded-md hover:bg-white dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
          >
            Ver Todo
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-6">
        <div
          className="bg-primary-600 dark:bg-primary-500 h-1.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${steps.length > 0 ? (currentStepLimit / steps.length) * 100 : 0}%` }}
        ></div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Inicio</span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Paso {currentStepLimit} de {steps.length}</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Fin</span>
        </div>
      </div>

      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="paso"
              label={{
                value: 'Paso',
                position: 'insideBottom',
                offset: -10,
                style: { textAnchor: 'middle', fill: '#9ca3af', fontWeight: 'bold' }
              }}
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
              type="number"
              domain={[0, steps.length > 0 ? steps.length : 'dataMax']} // Keep axis fixed to MAX steps for stable view
              tickCount={steps.length + 1}
              allowDuplicatedCategory={false}
            />
            <YAxis
              label={{ value: 'Número de Pista', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af', fontWeight: 'bold' } }}
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
              domain={[minY, maxY]}
              allowDataOverflow={true}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />

            {/* Línea principal del recorrido (normal) */}
            <Line
              data={normalLineData}
              type="linear"
              dataKey="pista"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 8, fill: '#2563eb' }}
              name="Recorrido Normal"
              animationDuration={500}
              isAnimationActive={true}
              connectNulls={false}
            />

            {/* Línea para saltos circulares */}
            <Line
              data={jumpLineData}
              type="linear"
              dataKey="pista"
              stroke="#ef4444"
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={<CustomDot />}
              activeDot={{ r: 8, fill: '#dc2626' }}
              name="Salto Circular"
              animationDuration={500}
              isAnimationActive={true}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm justify-center border-t border-gray-100 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full border border-white dark:border-gray-800 shadow-sm"></div>
          <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">Punto Inicial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-blue-500 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">Movimiento Normal</span>
        </div>
        {steps.some(s => isCircularJump(s, maxTrack, minTrack)) && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-red-500 rounded-full border-dashed border-white"></div>
            <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">Salto Circular</span>
          </div>
        )}
        <div className="ml-auto bg-gray-50 dark:bg-gray-700/50 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">
          <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold mr-2">Recorrido Vista:</span>
          <span className="font-bold text-primary-700 dark:text-primary-400">
            {visibleSteps.reduce((sum, s) => sum + s.distance, 0)} <span className="text-[10px] text-gray-400 font-normal">pistas</span>
          </span>
        </div>
      </div>
    </div>
  );
}
