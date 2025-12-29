'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Dot, ReferenceLine } from 'recharts';
import { AlgorithmStep } from '@/lib/algorithms';

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
  // Preparar datos para la gráfica
  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = [];

    // Punto inicial
    data.push({
      paso: 0,
      pista: initialTrack,
      desde: initialTrack,
      hacia: initialTrack,
      distancia: 0,
      esSalto: false,
    });

    // Agregar cada paso
    steps.forEach((step, index) => {
      const isJump = isCircularJump(step, maxTrack, minTrack);
      // Usar siempre el número de paso para el eje X
      const xValue = index + 1;
      data.push({
        paso: xValue,
        pista: step.to,
        desde: step.from,
        hacia: step.to,
        distancia: step.distance,
        esSalto: isJump,
        // Guardamos el instante real para el tooltip si existe
        instante: step.instant,
      } as any);
    });

    return data;
  }, [steps, initialTrack, maxTrack, minTrack]);

  // Detectar si un paso es un salto circular
  function isCircularJump(step: AlgorithmStep, maxTrack: number, minTrack: number): boolean {
    const range = maxTrack - minTrack;
    return step.distance > range * 0.5 &&
      ((step.from === minTrack && step.to === maxTrack) ||
        (step.from === maxTrack && step.to === minTrack) ||
        (step.from === minTrack && step.to === minTrack + 1 && maxTrack > 100) ||
        (step.from === minTrack + 1 && step.to === maxTrack && maxTrack > 100));
  }

  // Calcular el rango del eje Y
  const allTracks = [initialTrack, ...steps.map(s => s.to), ...steps.map(s => s.from)];
  const minY = Math.max(0, Math.min(...allTracks) - 10);
  const maxY = Math.max(...allTracks, maxTrack) + 10;

  // Custom dot para puntos especiales
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.paso === 0) {
      // Punto inicial (verde)
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#10b981"
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    if (payload.esSalto) {
      // Saltos circulares (rojo)
      return (
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill="#ef4444"
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    // Puntos normales (azul)
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#3b82f6"
        stroke="#fff"
        strokeWidth={2}
      />
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">
            {data.paso === 0 ? 'Punto Inicial' : `Paso ${data.paso}`}
          </p>
          {data.paso > 0 && (
            <>
              {data.instante !== undefined && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Instante:</span> {Number(data.instante.toFixed(3))}
                </p>
              )}
              <p className="text-sm text-gray-600">
                <span className="font-medium">Desde:</span> {data.desde}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Hacia:</span> {data.hacia}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Distancia:</span>{' '}
                <span className="font-bold text-blue-600">{data.distancia}</span> pistas
              </p>
              {data.esSalto && (
                <p className="text-xs text-red-600 font-medium mt-1">⚡ Salto Circular</p>
              )}
            </>
          )}
          {data.paso === 0 && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Pista:</span> {data.pista}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Preparar datos para las líneas (normal y saltos)
  const { normalLineData, jumpLineData } = useMemo(() => {
    const normalData: any[] = [];
    const jumpData: any[] = [];

    // Función helper para crear un punto de datos
    const createPoint = (stepIndex: number, track: number, extra: any = {}) => ({
      paso: stepIndex,
      pista: track,
      ...extra
    });

    // Punto inicial
    const startPoint = createPoint(0, initialTrack, {
      desde: initialTrack,
      hacia: initialTrack,
      distancia: 0,
      esSalto: false
    });

    // Inicializar ambas líneas con el punto inicial (o primer break)
    // El primer movimiento va de Paso 0 a Paso 1.
    if (steps.length > 0) {
      const firstIsJump = isCircularJump(steps[0], maxTrack, minTrack);
      if (firstIsJump) {
        jumpData.push(startPoint);
        // Normal data necesita un break inmediato para no dibujar nada desde 0
        // Pero wait, normal line NO debe tener el punto 0 si el primer tramo es salto?
        // Sí, porque si no, no hay nada que dibujar.
        // Aunque si el tramo 0-1 es salto, normal line empieza en 1?
        // Pongamos el punto 0 en normalData también, pero seguido de un break.
        normalData.push(startPoint);
        normalData.push({ paso: 0.5, pista: null });
      } else {
        normalData.push(startPoint);
        jumpData.push(startPoint);
        jumpData.push({ paso: 0.5, pista: null });
      }
    } else {
      normalData.push(startPoint);
    }

    steps.forEach((step, index) => {
      const currentPaso = index + 1;
      const prevPaso = index; // El paso anterior (origen del segmento)
      const isJump = isCircularJump(step, maxTrack, minTrack);

      const point = createPoint(currentPaso, step.to, {
        desde: step.from,
        hacia: step.to,
        distancia: step.distance,
        esSalto: isJump,
        instante: step.instant
      });

      if (isJump) {
        // Segmento Rojo (Jump): Debe conectar prevPaso -> currentPaso
        // Aseguramos que jumpData tenga el punto anterior (ya debería tenerlo o ser el inicio de un bloque)
        // Como añadimos un break al final de cada iteración "contraria", 
        // necesitamos volver a añadir el punto anterior si venimos de un break.

        // Estrategia más robusta: Añadir SIEMPRE los dos puntos del segmento
        // y un break después.
        // Pero Recharts no une puntos duplicados o desordenados bien.
        // Mejor estrategia: "Breaks"

        // Si es salto:
        // 1. Normal line se rompe (ya añadimos break en paso anterior o aquí)
        // 2. Jump line continúa.

        // Pero espera, si el anterior fue Normal, JumpLine tiene un break en prevPaso + 0.5
        // Así que JumpLine necesita re-añadir el punto anterior (prevPaso) para empezar el trazo?
        // Sí, si hay un break, necesitamos "levantar el lápiz y ponerlo en el punto de inicio".

        jumpData.push({ ...point, paso: prevPaso, pista: step.from }); // Re-añadir origen del segmento
        jumpData.push(point); // Destino

        // Romper la línea normal
        normalData.push({ paso: currentPaso - 0.5, pista: null });
        // Añadir el punto destino a normal (para que sea inicio del siguiente)
        // Pero aislado
        normalData.push(point);

      } else {
        // Segmento Azul (Normal)

        // Si venimos de un salto, normalData tiene un break.
        // Necesitamos re-añadir el punto de origen.
        normalData.push({ ...point, paso: prevPaso, pista: step.from });
        normalData.push(point);

        // Romper la línea de salto
        jumpData.push({ paso: currentPaso - 0.5, pista: null });
        jumpData.push(point); // Añadir punto destino a jump (para continuidad futura?)
        // No, en jump data si es normal, no queremos dibujar nada. 
        // Solo necesitamos el punto si fuera a ser el inicio de un salto futuro.
      }
    });

    return { normalLineData: normalData, jumpLineData: jumpData };
  }, [steps, initialTrack, maxTrack, minTrack]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Visualización del Recorrido
      </h3>

      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="paso"
              label={{
                value: 'Paso',
                position: 'insideBottom',
                offset: -10,
                style: { textAnchor: 'middle', fill: '#6b7280', fontWeight: 'bold' }
              }}
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              type="number"
              domain={[0, 'dataMax']}
              tickCount={steps.length + 1}
              allowDuplicatedCategory={false} // Importante para datos mezclados
            />
            <YAxis
              label={{ value: 'Número de Pista', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontWeight: 'bold' } }}
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              domain={[minY, maxY]}
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
              animationDuration={1000}
              animationEasing="ease-in-out"
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
              animationDuration={1000}
              animationEasing="ease-in-out"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          <span className="text-gray-700">Punto Inicial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
          <span className="text-gray-700">Movimiento Normal</span>
        </div>
        {steps.some(s => isCircularJump(s, maxTrack, minTrack)) && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-700">Salto Circular</span>
          </div>
        )}
        <div className="ml-auto">
          <span className="text-gray-600">Total de pistas recorridas: </span>
          <span className="font-semibold text-lg text-gray-900">
            {steps.reduce((sum, s) => sum + s.distance, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
