"use client";

import React, { useState, useEffect } from "react";
import { IconCalculator, IconChevronUp, IconChevronDown } from '@tabler/icons-react';

type Unit = "B" | "KB" | "MB" | "GB";

export default function DiskGeometryCalculator() {
    // UI State
    const [isOpen, setIsOpen] = useState(false);

    // Geometry Inputs
    const [heads, setHeads] = useState<number | "">("");
    const [sectorsPerTrack, setSectorsPerTrack] = useState<number | "">("");
    const [sectorSize, setSectorSize] = useState<number | "">("");

    // Solve Mode: "capacity" -> User enters Cylinders, we calc Capacity
    //             "cylinders" -> User enters Capacity, we calc Cylinders
    const [solveMode, setSolveMode] = useState<"capacity" | "cylinders">("cylinders");

    // Cylinder/Capacity Inputs
    const [cylindersInput, setCylindersInput] = useState<string>("");
    const [capacityInput, setCapacityInput] = useState<string>("");
    const [capacityUnit, setCapacityUnit] = useState<Unit>("MB");

    // Block Inputs
    const [blockSizeMode, setBlockSizeMode] = useState<"sectors" | "bytes">("sectors");
    const [blockSizeVal, setBlockSizeVal] = useState<string>(""); // sectors or bytes/kb
    const [blockSizeUnit, setBlockSizeUnit] = useState<Unit>("KB"); // used if mode is bytes

    // Results State
    const [results, setResults] = useState<{
        totalSectors: number;
        totalCapacityBytes: number;
        totalTracks: number;
        cylinders: number;
        blocksPerTrack: number;
        blocksPerCylinder: number;
        sectorsPerBlock: number;
        sectorSizeBytes: number;
        sectorsPerTrack: number;
        heads: number;
    } | null>(null);

    useEffect(() => {
        calculate();
    }, [
        heads,
        sectorsPerTrack,
        sectorSize,
        solveMode,
        cylindersInput,
        capacityInput,
        capacityUnit,
        blockSizeMode,
        blockSizeVal,
        blockSizeUnit,
    ]);

    const calculate = () => {
        let calculatedCylinders = 0;
        let totalCap = 0;

        // 1. Determine Cylinders & Total Capacity based on mode
        const h = heads as number;
        const s = sectorsPerTrack as number;
        const ss = sectorSize as number;

        if (solveMode === "capacity") {
            // User entered Cylinders
            const c = parseFloat(cylindersInput);
            if (isNaN(c) || heads === "" || sectorsPerTrack === "" || sectorSize === "") {
                setResults(null);
                return;
            }
            calculatedCylinders = c;
            const totalSec = c * h * s;
            totalCap = totalSec * ss;
        } else {
            // User entered Capacity
            const capVal = parseFloat(capacityInput);
            if (isNaN(capVal) || heads === "" || sectorsPerTrack === "" || sectorSize === "") {
                setResults(null);
                return;
            }

            // Convert to Bytes
            let mult = 1;
            if (capacityUnit === "KB") mult = 1024;
            if (capacityUnit === "MB") mult = 1024 * 1024;
            if (capacityUnit === "GB") mult = 1024 * 1024 * 1024;

            totalCap = capVal * mult;

            // Solve for Cylinders: Cap = C * H * S * Size
            // C = Cap / (H * S * Size)
            const denom = h * s * ss;
            if (denom === 0) {
                setResults(null);
                return;
            }
            calculatedCylinders = totalCap / denom;
        }

        // 2. Block Calculations
        let sectorsPerBlock = 0;
        if (blockSizeVal === "") {
            // Handle empty block size input gracefully - either assume 1 or don't result?
            // Assuming 1 sector default or maybe 0?
            // Let's assume 0 and check later
            sectorsPerBlock = 0;
        } else if (blockSizeMode === "sectors") {
            sectorsPerBlock = parseFloat(blockSizeVal);
        } else {
            // Bytes mode
            const val = parseFloat(blockSizeVal);
            let mult = 1;
            if (blockSizeUnit === "KB") mult = 1024;
            if (blockSizeUnit === "MB") mult = 1024 * 1024;
            // if unit is B => mult 1
            const sizeBytes = val * mult;
            // sectorSize must be valid number
            if (typeof ss === 'number' && ss > 0) {
                sectorsPerBlock = sizeBytes / ss;
            }
        }

        if (isNaN(sectorsPerBlock) || sectorsPerBlock === 0) sectorsPerBlock = 1;

        const totalSectors = calculatedCylinders * h * s;
        const totalTracks = calculatedCylinders * h;
        const blocksPerTrack = s / sectorsPerBlock;
        const blocksPerCylinder = blocksPerTrack * h;

        setResults({
            totalSectors,
            totalCapacityBytes: totalCap,
            totalTracks,
            cylinders: calculatedCylinders,
            blocksPerTrack,
            blocksPerCylinder,
            sectorsPerBlock,
            sectorSizeBytes: ss,
            sectorsPerTrack: s,
            heads: h,
        });
    };

    const formatNumber = (num: number) => {
        // Show max 2 decimals if not integer
        return Number.isInteger(num) ? num.toLocaleString() : num.toLocaleString(undefined, { maximumFractionDigits: 4 });
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(3)} GB`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
                className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <IconCalculator size={20} className="text-primary-600 dark:text-primary-400" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Calculadora de Geometría de Disco
                    </h2>
                </div>

                {isOpen ? (
                    <IconChevronUp size={20} className="text-gray-400" />
                ) : (
                    <IconChevronDown size={20} className="text-gray-400" />
                )}
            </div>

            {isOpen && (
                <div className="p-6 space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Calcula la pista física a partir de una dirección lógica. Útil para traducir enunciados.
                    </p>

                    {/* COMPACT LAYOUT START */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* LEFT COLUMN: Physical Inputs */}
                        <div className="space-y-4 flex flex-col">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    1. Geometría Física
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 truncate" title="Caras (Heads)">
                                            Caras
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={heads}
                                            onChange={(e) => setHeads(e.target.value === '' ? '' : parseInt(e.target.value))}
                                            placeholder="Ej: 16"
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 truncate" title="Sectores por Pista">
                                            Sectores/Pista
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={sectorsPerTrack}
                                            onChange={(e) => setSectorsPerTrack(e.target.value === '' ? '' : parseInt(e.target.value))}
                                            placeholder="Ej: 63"
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 truncate" title="Tamaño Sector (Bytes)">
                                            Tamaño Sector
                                        </label>
                                        <input
                                            type="number"
                                            value={sectorSize}
                                            onChange={(e) => setSectorSize(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                            placeholder="512"
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-end">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    3. Tamaño Bloque
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex bg-gray-100 dark:bg-gray-700 p-0.5 rounded text-[10px] shrink-0">
                                        <button
                                            onClick={() => setBlockSizeMode("sectors")}
                                            className={`px-2 py-1 rounded transition-colors ${blockSizeMode === "sectors" ? "bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-300 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
                                        >
                                            Sectores
                                        </button>
                                        <button
                                            onClick={() => setBlockSizeMode("bytes")}
                                            className={`px-2 py-1 rounded transition-colors ${blockSizeMode === "bytes" ? "bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-300 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
                                        >
                                            Bytes
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        {blockSizeMode === "sectors" ? (
                                            <input
                                                type="number"
                                                value={blockSizeVal}
                                                onChange={(e) => setBlockSizeVal(e.target.value)}
                                                placeholder="Ej: 4"
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        ) : (
                                            <div className="flex gap-1">
                                                <input
                                                    type="number"
                                                    value={blockSizeVal}
                                                    onChange={(e) => setBlockSizeVal(e.target.value)}
                                                    placeholder="1"
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                                <select
                                                    value={blockSizeUnit}
                                                    onChange={(e) => setBlockSizeUnit(e.target.value as Unit)}
                                                    className="w-16 px-1 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                                                >
                                                    <option value="B">B</option>
                                                    <option value="KB">KB</option>
                                                    <option value="MB">MB</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Solver Inputs */}
                        <div className="flex flex-col h-full">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                2. Calcular Geometría
                            </label>
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded border border-gray-200 dark:border-gray-600 flex-1 flex flex-col justify-center">
                                <div className="flex gap-1 mb-3">
                                    <button
                                        onClick={() => setSolveMode("cylinders")}
                                        className={`flex-1 py-1 px-1 rounded text-xs font-medium transition-colors border ${solveMode === "cylinders"
                                            ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/40 dark:border-primary-800 dark:text-primary-300"
                                            : "bg-white border-transparent text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                                            }`}
                                    >
                                        Tengo Capacidad
                                    </button>
                                    <button
                                        onClick={() => setSolveMode("capacity")}
                                        className={`flex-1 py-1 px-1 rounded text-xs font-medium transition-colors border ${solveMode === "capacity"
                                            ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/40 dark:border-primary-800 dark:text-primary-300"
                                            : "bg-white border-transparent text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                                            }`}
                                    >
                                        Tengo Cilindros
                                    </button>
                                </div>

                                {solveMode === "cylinders" ? (
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Capacidad Total</label>
                                            <input
                                                type="number"
                                                value={capacityInput}
                                                onChange={(e) => setCapacityInput(e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Ej: 4"
                                            />
                                        </div>
                                        <div className="w-20">
                                            <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Unidad</label>
                                            <select
                                                value={capacityUnit}
                                                onChange={(e) => setCapacityUnit(e.target.value as Unit)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                                            >
                                                <option value="B">B</option>
                                                <option value="KB">KB</option>
                                                <option value="MB">MB</option>
                                                <option value="GB">GB</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Nº Cilindros (Pistas/Cara)</label>
                                        <input
                                            type="number"
                                            value={cylindersInput}
                                            onChange={(e) => setCylindersInput(e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Ej: 40"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RESULTS */}
                    {results && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">Resultados</h4>

                            <div className="space-y-2 text-sm">
                                <ResultRow label="Sectores Totales" value={formatNumber(results.totalSectors)} />
                                <ResultRow label="Capacidad Total" value={formatBytes(results.totalCapacityBytes)} subValue={`(${formatNumber(results.totalCapacityBytes)} B)`} highlight />

                                <div className="my-2 border-t border-gray-200 dark:border-gray-600 border-dashed"></div>

                                <ResultRow label="Cilindros (Pistas/Cara)" value={formatNumber(results.cylinders)} highlight />
                                <ResultRow label="Pistas Totales" value={formatNumber(results.totalTracks)} />

                                <div className="my-2 border-t border-gray-200 dark:border-gray-600 border-dashed"></div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div className="col-span-2 sm:col-span-1"><ResultRow label="Bloques/Pista" value={formatNumber(results.blocksPerTrack)} /></div>
                                    <div className="col-span-2 sm:col-span-1"><ResultRow label="Bloques/Cilindro" value={formatNumber(results.blocksPerCylinder)} /></div>
                                    <div className="col-span-2 sm:col-span-1"><ResultRow label="Sectores/Bloque" value={formatNumber(results.sectorsPerBlock)} /></div>
                                    <div className="col-span-2 sm:col-span-1"><ResultRow label="Tamaño Sector" value={`${results.sectorSizeBytes} B`} /></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ResultRow({ label, value, subValue, highlight }: { label: string; value: string | number; subValue?: string; highlight?: boolean }) {
    return (
        <div className="flex justify-between items-start">
            <span className="text-gray-600 dark:text-gray-300">{label}:</span>
            <div className="text-right">
                <span className={`block font-semibold ${highlight ? "text-primary-700 dark:text-primary-400" : "text-gray-900 dark:text-gray-100"}`}>{value}</span>
                {subValue && <span className="block text-xs text-gray-500 dark:text-gray-400">{subValue}</span>}
            </div>
        </div>
    );
}
