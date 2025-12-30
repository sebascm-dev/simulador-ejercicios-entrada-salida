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
        <InputSection title="Análisis de Tiempos Físicos">
            <div className="space-y-4">
                {/* Inputs Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InputGroup
                        label="T. Búsqueda (ms)"
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

                {/* Results Row */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                    {result ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                            <CompactResultItem
                                label="Búsqueda"
                                value={result.seekTime}
                                colorClass="text-blue-600"
                            />
                            <CompactResultItem
                                label="Latencia"
                                value={result.latencyTime}
                                colorClass="text-purple-600"
                            />
                            <CompactResultItem
                                label="Transferencia"
                                value={result.transferTime}
                                colorClass="text-amber-600"
                            />

                            <div className="text-right border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-2 md:pt-0 md:pl-6">
                                <span className="block text-xs text-gray-400 uppercase font-bold">Tiempo Total</span>
                                <span className="block text-2xl font-bold text-green-600 leading-none">
                                    {formatTime(result.totalTime)} <span className="text-base font-normal text-gray-500">ms</span>
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 text-sm italic py-2">
                            Introduce los parámetros físicos para calcular los tiempos reales
                        </div>
                    )}
                </div>
            </div>
        </InputSection>
    );
}

function CompactResultItem({ label, value, colorClass }: { label: string, value: number, colorClass: string }) {
    return (
        <div>
            <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">{label}</span>
            <span className={`text-lg font-bold ${colorClass}`}>
                {value.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xs text-gray-400 font-normal">ms</span>
            </span>
        </div>
    )
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
