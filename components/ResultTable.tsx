'use client';

import React from 'react';
import { AlgorithmStep } from '@/lib/algorithms';

interface ResultTableProps {
  steps: AlgorithmStep[];
  totalTracks: number;
}

export default function ResultTable({ steps, totalTracks }: ResultTableProps) {
  const hasInstants = steps.some(s => s.instant !== undefined);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Paso
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Instante
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pendiente
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Desde
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hacia
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Distancia
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {steps.map((step, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {index + 1}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {step.instant !== undefined ? (
                  <span className="font-semibold text-blue-600">{Number(step.instant.toFixed(3))}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {step.remaining.length > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-gray-100 text-gray-800">
                    {step.remaining.join(', ')}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {step.from}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {step.to}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {step.distance}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-primary-50">
          <tr>
            <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
              Total de pistas recorridas:
            </td>
            <td className="px-4 py-3 text-sm font-bold text-primary-700">
              {totalTracks}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

