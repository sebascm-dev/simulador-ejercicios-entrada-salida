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
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[1%] whitespace-nowrap">
              Paso
            </th>
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[1%] whitespace-nowrap">
              Instante
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pendiente
            </th>
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[1%] whitespace-nowrap">
              Desde
            </th>
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[1%] whitespace-nowrap">
              Hacia
            </th>
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[1%] whitespace-nowrap">
              Distancia
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {steps.map((step, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                {index + 1}
              </td>
              <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                {step.instant !== undefined ? (
                  <span className="font-semibold text-blue-600">{Number(step.instant.toFixed(3))}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                <div className="flex flex-col gap-1">
                  {step.remaining && step.remaining.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] uppercase text-gray-500 font-bold min-w-[40px]">Activa:</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 break-all">
                        {step.remaining.join(', ')}
                      </span>
                    </div>
                  )}
                  {step.buffer && step.buffer.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] uppercase text-orange-500 font-bold min-w-[40px]">Buffer:</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 break-all">
                        {step.buffer.join(', ')}
                      </span>
                    </div>
                  )}
                  {(!step.remaining?.length && !step.buffer?.length) && (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </td>
              <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                {step.from}
              </td>
              <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                {step.to}
              </td>
              <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
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
    </div >
  );
}

