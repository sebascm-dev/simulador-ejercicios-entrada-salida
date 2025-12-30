"use client";

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
  // Use string state to allow empty inputs and decimals
  const [currentInstantStr, setCurrentInstantStr] = useState<string>('');
  const [currentTracks, setCurrentTracks] = useState<string>('');

  const handleAddInstance = () => {
    // Basic validation
    let instantVal = 0;
    if (currentInstantStr.trim() !== '') {
      instantVal = parseFloat(currentInstantStr);
      if (isNaN(instantVal)) {
        alert('El instante de llegada debe ser un número válido');
        return;
      }
    }

    const tracksArray = currentTracks
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));

    if (tracksArray.length === 0) {
      alert('Por favor ingrese al menos una pista');
      return;
    }

    const newInstance: ArrivalInstance = {
      instant: instantVal,
      tracks: tracksArray,
    };

    // Ordenar por instante y luego agregar
    const updated = [...instances, newInstance].sort((a, b) => a.instant - b.instant);
    onChange(updated);

    // Limpiar campos - Reset to empty not 0
    setCurrentTracks('');
    setCurrentInstantStr('');
  };

  const handleRemoveInstance = (index: number) => {
    const updated = instances.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleEditInstanceInstant = (index: number, valueStr: string) => {
    // Allow typing, but update parent immediately if valid so main page re-renders?
    // Actually typically for onChange(instances), we assume instances are complete.
    // If we want valid instances in parent, we should parse.
    // But if we want to allow typing "1.5" we can't force number immediately if user types "1."
    // For simplicity in this specific "edit" mode inside the list, let's keep it robust.

    // We update the instances with the parsed value if valid, or keep as is if we want robust edit.
    // However, the props `instances` dictates `instant` is a number. 
    // To support perfect live editing of decimals, we might need local state for the edit fields or just parse.
    // Let's rely on standard number input behavior for now on the list items, but use string for the "Add New" part.
    // For list items, if they want to support "1.", `parseFloat` handles "1." as "1". 
    // Usually number inputs handle this better if we don't force controlled state too strictly or use string backing.
    // Given the request, "decimales también", let's try to just parse float.
    const val = parseFloat(valueStr);
    const updated = instances.map((inst, i) => {
      if (i === index) {
        return { ...inst, instant: isNaN(val) ? 0 : val };
      }
      return inst;
    });
    // Sort? Maybe don't auto-sort while editing to avoid jumping rows
    // const sorted = [...updated].sort((a, b) => a.instant - b.instant);
    onChange(updated);
  };

  const handleEditInstanceTracks = (index: number, valueStr: string) => {
    const tracksArray = valueStr
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));

    const updated = instances.map((inst, i) => {
      if (i === index) {
        return { ...inst, tracks: tracksArray.length > 0 ? tracksArray : inst.tracks };
      }
      return inst;
    });
    onChange(updated);
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
              step="0.1"
              value={currentInstantStr}
              onChange={(e) => setCurrentInstantStr(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="0 (predeterminado)"
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
                        step="0.1"
                        value={instance.instant}
                        onChange={(e) => handleEditInstanceInstant(index, e.target.value)}
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
                        onChange={(e) => handleEditInstanceTracks(index, e.target.value)}
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
