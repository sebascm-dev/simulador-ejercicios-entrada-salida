'use client';

import React, { useState } from 'react';

export interface ArrivalInstance {
  instant: number;
  tracks: number[];
}

interface ArrivalTimeInputProps {
  instances: ArrivalInstance[];
  onChange: (instances: ArrivalInstance[]) => void;
}

export default function ArrivalTimeInput({ instances, onChange }: ArrivalTimeInputProps) {
  const [currentInstant, setCurrentInstant] = useState<number>(0);
  const [currentTracks, setCurrentTracks] = useState<string>('');

  const handleAddInstance = () => {
    const tracksArray = currentTracks
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));

    if (tracksArray.length === 0) {
      alert('Por favor ingrese al menos una pista');
      return;
    }

    const newInstance: ArrivalInstance = {
      instant: currentInstant,
      tracks: tracksArray,
    };

    // Ordenar por instante y luego agregar
    const updated = [...instances, newInstance].sort((a, b) => a.instant - b.instant);
    onChange(updated);

    // Limpiar campos
    setCurrentTracks('');
    setCurrentInstant(Math.max(...updated.map(i => i.instant), 0) + 1);
  };

  const handleRemoveInstance = (index: number) => {
    const updated = instances.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleEditInstance = (index: number, field: 'instant' | 'tracks', value: number | string) => {
    const updated = instances.map((inst, i) => {
      if (i === index) {
        if (field === 'instant') {
          return { ...inst, instant: value as number };
        } else {
          const tracksArray = (value as string)
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n));
          return { ...inst, tracks: tracksArray.length > 0 ? tracksArray : inst.tracks };
        }
      }
      return inst;
    });
    // Ordenar sin mutar el array original
    const sorted = [...updated].sort((a, b) => a.instant - b.instant);
    onChange(sorted);
  };

  // Convertir a formato simple para compatibilidad
  const allTracks = instances.flatMap(i => i.tracks);
  const allArrivalTimes = instances.flatMap(i => i.tracks.map(() => i.instant));

  return (
    <div className="space-y-4">
      {/* Formulario para añadir nuevo instante */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Añadir Nuevo Instante de Llegada</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Inst. Llegada
            </label>
            <input
              type="number"
              value={currentInstant}
              onChange={(e) => setCurrentInstant(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="0"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Lista de Pistas
            </label>
            <input
              type="text"
              value={currentTracks}
              onChange={(e) => setCurrentTracks(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="10, 19, 3"
            />
          </div>
        </div>
        <button
          onClick={handleAddInstance}
          className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-200 shadow-sm hover:shadow"
        >
          Añadir nuevo instante de llegada con pistas
        </button>
      </div>

      {/* Lista de instantes añadidos */}
      {instances.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700">Instantes de Llegada Configurados</h4>
          </div>
          <div className="divide-y divide-gray-200">
            {instances.map((instance, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Inst. Llegada
                      </label>
                      <input
                        type="number"
                        value={instance.instant}
                        onChange={(e) => handleEditInstance(index, 'instant', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Lista de Pistas
                      </label>
                      <input
                        type="text"
                        value={instance.tracks.join(', ')}
                        onChange={(e) => handleEditInstance(index, 'tracks', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveInstance(index)}
                    className="mt-6 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vista resumida para compatibilidad */}
      {instances.length > 0 && (
        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
          <p className="font-medium mb-1">Resumen:</p>
          <p>Peticiones: {allTracks.join(', ')}</p>
          <p>Tiempos: {allArrivalTimes.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

