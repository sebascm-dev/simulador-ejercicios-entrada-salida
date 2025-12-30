"use client";

import React, { useState, useEffect } from "react";
import InputSection from "./InputSection";

type Unit = "B" | "KB" | "MB" | "GB";

export default function DiskGeometryCalculator() {
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
        <InputSection title="Calculadora de Geometría de Disco">
            <div className="space-y-6">

                {/* INPUTS GRID */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nº Caras (Heads)</label>
                            <input
                                type="number"
                                value={heads}
                                onChange={(e) => setHeads(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="4"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sectores/Pista</label>
                            <input
                                type="number"
                                value={sectorsPerTrack}
                                onChange={(e) => setSectorsPerTrack(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="8"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño Sector (B)</label>
                            <input
                                type="number"
                                value={sectorSize}
                                onChange={(e) => setSectorSize(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="512"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4"></div>

                    {/* Solver Logic */}
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSolveMode("cylinders")}
                                className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${solveMode === "cylinders"
                                    ? "bg-primary-600 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                Tengo la Capacidad
                            </button>
                            <button
                                onClick={() => setSolveMode("capacity")}
                                className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${solveMode === "capacity"
                                    ? "bg-primary-600 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                Tengo los Cilindros
                            </button>
                        </div>

                        {solveMode === "cylinders" ? (
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad Total</label>
                                    <input
                                        type="number"
                                        value={capacityInput}
                                        onChange={(e) => setCapacityInput(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="4"
                                    />
                                </div>
                                <div className="w-28">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                                    <select
                                        value={capacityUnit}
                                        onChange={(e) => setCapacityUnit(e.target.value as Unit)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="B">Bytes</option>
                                        <option value="KB">KB</option>
                                        <option value="MB">MB</option>
                                        <option value="GB">GB</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nº Cilindros (Pistas por Cara)</label>
                                <input
                                    type="number"
                                    value={cylindersInput}
                                    onChange={(e) => setCylindersInput(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="40"
                                />
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-100 pt-4"></div>

                    {/* Block Definition */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Definición de Bloque</label>
                        <div className="flex gap-4 text-xs mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={blockSizeMode === "sectors"}
                                    onChange={() => setBlockSizeMode("sectors")}
                                    className="text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-gray-700">Por Sectores (ej: 4 sectores)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={blockSizeMode === "bytes"}
                                    onChange={() => setBlockSizeMode("bytes")}
                                    className="text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-gray-700">Por Tamaño (ej: 1 KB)</span>
                            </label>
                        </div>

                        {blockSizeMode === "sectors" ? (
                            <div>
                                <input
                                    type="number"
                                    value={blockSizeVal}
                                    onChange={(e) => setBlockSizeVal(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="4"
                                />
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    value={blockSizeVal}
                                    onChange={(e) => setBlockSizeVal(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="1"
                                />
                                <select
                                    value={blockSizeUnit}
                                    onChange={(e) => setBlockSizeUnit(e.target.value as Unit)}
                                    className="w-28 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="B">Bytes</option>
                                    <option value="KB">KB</option>
                                    <option value="MB">MB</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* RESULTS */}
                {results && (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 border-b border-gray-200 pb-2">Resultados</h4>

                        <div className="space-y-2 text-sm">
                            <ResultRow label="Sectores Totales" value={formatNumber(results.totalSectors)} />
                            <ResultRow label="Capacidad Total" value={formatBytes(results.totalCapacityBytes)} subValue={`(${formatNumber(results.totalCapacityBytes)} B)`} highlight />

                            <div className="my-2 border-t border-gray-200 border-dashed"></div>

                            <ResultRow label="Cilindros (Pistas/Cara)" value={formatNumber(results.cylinders)} highlight />
                            <ResultRow label="Pistas Totales" value={formatNumber(results.totalTracks)} />

                            <div className="my-2 border-t border-gray-200 border-dashed"></div>

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
        </InputSection>
    );
}

function ResultRow({ label, value, subValue, highlight }: { label: string; value: string | number; subValue?: string; highlight?: boolean }) {
    return (
        <div className="flex justify-between items-start">
            <span className="text-gray-600">{label}:</span>
            <div className="text-right">
                <span className={`block font-semibold ${highlight ? "text-primary-700" : "text-gray-900"}`}>{value}</span>
                {subValue && <span className="block text-xs text-gray-500">{subValue}</span>}
            </div>
        </div>
    );
}
