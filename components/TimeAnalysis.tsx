"use client";

import React, { useState, useEffect } from "react";
import InputSection from "./InputSection";
import { AccessTimeResult } from "@/lib/calculations";

interface TimeAnalysisProps {
    totalTracksMoved: number;
    totalRequests: number;
}

export default function TimeAnalysis({ totalTracksMoved, totalRequests }: TimeAnalysisProps) {
    // Inputs (Strings to allow empty state)
    const [seekTimeStr, setSeekTimeStr] = useState<string>("");
    const [rpmStr, setRpmStr] = useState<string>("");
    const [sectorsPerTrackStr, setSectorsPerTrackStr] = useState<string>("");
    const [sectorsPerBlockStr, setSectorsPerTrackBlockStr] = useState<string>("");

    const [result, setResult] = useState<AccessTimeResult | null>(null);

    useEffect(() => {
        calculate();
    }, [seekTimeStr, rpmStr, sectorsPerTrackStr, sectorsPerBlockStr, totalTracksMoved, totalRequests]);

    const calculate = () => {
        const seekTimePerTrack = parseFloat(seekTimeStr);
        const rpm = parseFloat(rpmStr);
        const sectorsPerTrack = parseFloat(sectorsPerTrackStr);
        const sectorsPerBlock = parseFloat(sectorsPerBlockStr);

        if (isNaN(seekTimePerTrack) || isNaN(rpm) || isNaN(sectorsPerTrack) || isNaN(sectorsPerBlock)) {
            setResult(null);
            return;
        }

        // 1. Seek Time
        const totalSeekTime = totalTracksMoved * seekTimePerTrack;

        // 2. Latency (Average Rotation Latency)
        // Rotation Time (ms) = 60000 / RPM
        // Avg Latency = Rotation Time / 2
        // Total Latency = Avg Latency * Requests
        const rotationTimeMs = 60000 / rpm;
        const avgLatency = rotationTimeMs / 2;
        const totalLatency = avgLatency * totalRequests;

        // 3. Transfer Time
        // Time to read one block = (SectorsPerBlock / SectorsPerTrack) * RotationTime
        let totalTransfer = 0;
        if (sectorsPerTrack > 0) {
            const timePerBlock = (sectorsPerBlock / sectorsPerTrack) * rotationTimeMs;
            totalTransfer = timePerBlock * totalRequests;
        }

        setResult({
            seekTime: totalSeekTime,
            latencyTime: totalLatency,
            transferTime: totalTransfer,
            totalTime: totalSeekTime + totalLatency + totalTransfer,
        });
    };

    const formatTime = (ms: number) => {
        return ms.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <InputSection title="Análisis de Tiempos (Compacto)">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* INPUTS COLUMN */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-2">
                        Parámetros del Disco
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup
                            label="T. Búsqueda (ms/pista)"
                            value={seekTimeStr}
                            onChange={setSeekTimeStr}
                            placeholder="ej: 1.5"
                        />
                        <InputGroup
                            label="RPM"
                            value={rpmStr}
                            onChange={setRpmStr}
                            placeholder="ej: 7200"
                        />
                        <InputGroup
                            label="Sectores / Pista"
                            value={sectorsPerTrackStr}
                            onChange={setSectorsPerTrackStr}
                            placeholder="ej: 64"
                        />
                        <InputGroup
                            label="Sectores / Bloque"
                            value={sectorsPerBlockStr}
                            onChange={setSectorsPerTrackBlockStr}
                            placeholder="ej: 8"
                        />
                    </div>

                    <div className="text-xs text-gray-400 space-y-1 mt-2 bg-gray-50 p-2 rounded border border-gray-100 italic">
                        <p>Pistas Movidas (Simulación): <span className="font-semibold text-gray-600">{totalTracksMoved}</span></p>
                        <p>Nº Peticiones (Simulación): <span className="font-semibold text-gray-600">{totalRequests}</span></p>
                    </div>
                </div>

                {/* RESULTS COLUMN */}
                <div className="flex flex-col h-full">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">
                        Resultados y Fórmulas
                    </h4>

                    {result ? (
                        <div className="flex-1 space-y-4">
                            {/* SEEK */}
                            <ResultItem
                                label="Tiempo de Búsqueda"
                                value={result.seekTime}
                                formula={`= PistasMovidas (${totalTracksMoved}) × TBúsqueda (${seekTimeStr})`}
                                colorClass="text-blue-600"
                            />

                            {/* LATENCY */}
                            <ResultItem
                                label="Tiempo de Latencia Total"
                                value={result.latencyTime}
                                formula={`= Peticiones (${totalRequests}) × (60000 / RPM / 2)`}
                                colorClass="text-purple-600"
                            />

                            {/* TRANSFER */}
                            <ResultItem
                                label="Tiempo de Transferencia"
                                value={result.transferTime}
                                formula={`= Peticiones (${totalRequests}) × [(SectBloque / SectPista) × (60000/RPM)]`}
                                colorClass="text-amber-600"
                            />

                            <div className="border-t-2 border-gray-200 my-2 pt-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-gray-700 font-bold">Tiempo Total</span>
                                    <span className="text-2xl font-bold text-green-600">{formatTime(result.totalTime)} ms</span>
                                </div>
                                <p className="text-xs text-right text-gray-400 mt-1">= Búsqueda + Latencia + Transferencia</p>
                            </div>

                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-100 rounded-lg">
                            Introduce todos los parámetros para calcular
                        </div>
                    )}
                </div>
            </div>
        </InputSection>
    );
}

function InputGroup({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder: string }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
        </div>
    );
}

function ResultItem({ label, value, formula, colorClass }: { label: string, value: number, formula: string, colorClass: string }) {
    return (
        <div className="bg-white rounded border border-gray-100 p-2 shadow-sm">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <span className={`font-bold ${colorClass}`}>{value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ms</span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono tracking-tight bg-gray-50 px-1 rounded inline-block">
                {formula}
            </div>
        </div>
    )
}
