'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const anatomyParts = [
    {
        id: 'platter',
        label: 'Platos (Platters)',
        description: 'Discos rígidos (generalmente de aluminio o vidrio) cubiertos de material magnético. Un disco duro puede tener uno o varios platos apilados.',
        view: 'both'
    },
    {
        id: 'face',
        label: 'Caras (Faces)',
        description: 'Cada plato tiene dos caras (superior e inferior). Cada cara tiene su propio cabezal de lectura/escritura. Se numeran comenzando desde 0.',
        view: 'side'
    },
    {
        id: 'spindle',
        label: 'Eje (Spindle)',
        description: 'Motor central que hace girar todos los platos simultáneamente a gran velocidad (ej. 5400, 7200 RPM).',
        view: 'both'
    },
    {
        id: 'head',
        label: 'Cabezales (Heads)',
        description: 'Los sensores que leen y escriben los datos. Hay uno por cada cara (superficie) y están montados en un "peine" solidario, por lo que todos se mueven juntos.',
        view: 'side'
    },
    {
        id: 'track',
        label: 'Pista (Track)',
        description: 'Círculos concéntricos en una cara donde se graban los datos. Piense en los surcos de un vinilo, pero son cerrados, no una espiral.',
        view: 'top'
    },
    {
        id: 'cylinder',
        label: 'Cilindro (Cylinder)',
        description: 'El conjunto de todas las pistas que están a la misma distancia del centro en todas las caras. Como los cabezales se mueven juntos, acceder a datos en el mismo cilindro (pero diferente cara) es muy rápido (no requiere mover el brazo).',
        view: 'both'
    },
    {
        id: 'sector_geo',
        label: 'Sector Geométrico',
        description: 'Una "rebanada de pastel" del disco. Antiguamente se usaba para la direccionalidad física.',
        view: 'top'
    },
    {
        id: 'sector_data',
        label: 'Sector/Bloque (Track Sector)',
        description: 'La unidad mínima de almacenamiento direccionable en una pista (generalmente 512 bytes o 4KB). Es la intersección de una Pista y un Sector geométrico.',
        view: 'top'
    }
];

export default function DiskAnatomy() {
    const [activePart, setActivePart] = useState<string | null>(null);

    // Helper to check if a part is active
    const isActive = (id: string) => activePart === id;
    const isDimmed = (id: string) => activePart !== null && activePart !== id;

    return (
        <div className="flex flex-col lg:flex-row gap-12 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">

            {/* Visualization Area - Sticky on Desktop */}
            <div className="flex-1 lg:sticky lg:top-8 self-start flex flex-col items-center justify-center gap-12 py-4">

                {/* TOP VIEW */}
                <div className="flex flex-col items-center group relative cursor-pointer" onMouseLeave={() => setActivePart(null)}>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Vista Superior (Plato)</h4>
                    <div className="relative w-80 h-80 lg:w-[480px] lg:h-[480px] transition-transform duration-500 ease-out group-hover:scale-105">
                        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
                            <defs>
                                <radialGradient id="platterGradient" cx="0.5" cy="0.5" r="0.5">
                                    <stop offset="0%" stopColor="#f1f5f9" />
                                    <stop offset="90%" stopColor="#cbd5e1" />
                                    <stop offset="100%" stopColor="#94a3b8" />
                                </radialGradient>
                            </defs>

                            {/* Base Platter with Gradient */}
                            <circle cx="200" cy="200" r="190" fill="url(#platterGradient)" stroke="#94a3b8" strokeWidth="1"
                                onMouseEnter={() => setActivePart('platter')}
                                opacity={isActive('platter') ? 1 : isDimmed('platter') ? 0.4 : 1}
                                className="transition-opacity duration-300"
                            />

                            {/* Tracks context (faint and polished) */}
                            {[170, 150, 130, 110, 90, 70, 50].map(r => (
                                <circle key={r} cx="200" cy="200" r={r} fill="none" className="stroke-slate-400/30" onMouseEnter={() => setActivePart('track')} />
                            ))}

                            {/* SECTOR GEOMETRIC (Pie Slice) */}
                            <path d="M 200 200 L 390 200 A 190 190 0 0 0 334.3 65.7 Z"
                                onMouseEnter={() => setActivePart('sector_geo')}
                                className={`transition-all duration-300 ease-out ${isActive('sector_geo') ? 'fill-yellow-400/30 stroke-yellow-500 stroke-2 opacity-100' : 'fill-transparent stroke-transparent opacity-0'}`}
                            />

                            {/* TRACK HIGHLIGHT */}
                            <circle cx="200" cy="200" r="130" fill="none" strokeWidth="16"
                                onMouseEnter={() => setActivePart('track')}
                                className={`transition-all duration-300 ease-out ${isActive('track') ? 'stroke-indigo-500 opacity-80' : 'stroke-transparent opacity-0'}`}
                            />

                            {/* CYLINDER HIGHLIGHT (Top view) */}
                            <circle cx="200" cy="200" r="110" fill="none" strokeWidth="4" strokeDasharray="6 4"
                                onMouseEnter={() => setActivePart('cylinder')}
                                className={`transition-all duration-300 ${isActive('cylinder') ? 'stroke-purple-600 opacity-100' : 'stroke-transparent opacity-0'}`}
                            />

                            {/* SECTOR DATA / BLOCK */}
                            <path d="M 330 200 A 130 130 0 0 0 316 138" fill="none" strokeWidth="18" strokeLinecap="butt"
                                onMouseEnter={() => setActivePart('sector_data')}
                                className={`transition-all duration-300 ${isActive('sector_data') ? 'stroke-rose-500 opacity-100' : 'stroke-transparent opacity-0'}`}
                                style={{ transformOrigin: '200px 200px' }}
                            />

                            {/* Spindle Top */}
                            <circle cx="200" cy="200" r="25" className={`transition-colors duration-300 ${isActive('spindle') ? 'fill-blue-500' : 'fill-slate-500'}`} onMouseEnter={() => setActivePart('spindle')} />
                            <circle cx="200" cy="200" r="10" className="fill-slate-300" pointerEvents="none" />

                            {/* Arm Assembly with Shadows */}
                            <g filter="drop-shadow(3px 5px 2px rgb(0 0 0 / 0.2))">
                                <path d="M 40 380 L 140 220" strokeWidth="24" strokeLinecap="round" className="stroke-slate-700 hover:stroke-slate-600 cursor-pointer" onMouseEnter={() => setActivePart('arm')} />
                                <circle cx="40" cy="380" r="24" className="fill-slate-800" />
                                <rect x="130" y="210" width="24" height="28" rx="4"
                                    onMouseEnter={() => setActivePart('head')}
                                    className={`transition-colors duration-300 cursor-pointer ${isActive('head') ? 'fill-rose-500' : 'fill-slate-900'}`}
                                />
                            </g>
                        </svg>
                    </div>
                </div>

                {/* SIDE VIEW */}
                <div className="flex flex-col items-center w-full group cursor-pointer" onMouseLeave={() => setActivePart(null)}>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Vista Lateral</h4>
                    <div className="relative w-full h-80 max-w-lg transition-transform duration-500 hover:scale-105">
                        <svg viewBox="0 0 400 220" className="w-full h-full drop-shadow-xl">
                            <defs>
                                <linearGradient id="spindleLight" x1="0" x2="1" y1="0" y2="0">
                                    <stop offset="0%" stopColor="#94a3b8" />
                                    <stop offset="50%" stopColor="#e2e8f0" />
                                    <stop offset="100%" stopColor="#94a3b8" />
                                </linearGradient>
                                <linearGradient id="platterSide" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#e2e8f0" />
                                    <stop offset="50%" stopColor="#f8fafc" />
                                    <stop offset="100%" stopColor="#cbd5e1" />
                                </linearGradient>
                                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                                    <path d="M 0 0 L 6 3 L 0 6 z" fill="#ef4444" />
                                </marker>
                            </defs>

                            {/* Spindle Shaft */}
                            <rect x="190" y="20" width="20" height="180" fill="url(#spindleLight)"
                                onMouseEnter={() => setActivePart('spindle')}
                                className={`transition-all duration-300 ${isActive('spindle') ? 'stroke-blue-500 stroke-2' : ''}`} rx="2"
                            />

                            {/* Platters Stack */}
                            {[50, 100, 150].map((y, i) => (
                                <g key={i} className="transition-all duration-300" onMouseEnter={() => setActivePart('platter')}>
                                    {/* Shadows for depth */}
                                    <ellipse cx="200" cy={y + 5} rx="150" ry="8" className="fill-slate-900/10" />

                                    {/* Platter Side Profile */}
                                    <path d={`M 50 ${y} L 350 ${y} L 350 ${y + 8} L 50 ${y + 8} Z`}
                                        fill="url(#platterSide)"
                                        className={`transition-all duration-300 ${isActive('platter') ? 'stroke-blue-500 stroke-2' : 'stroke-slate-400 stroke-[0.5]'}`}
                                    />

                                    {/* Face Indicators */}
                                    {isActive('face') && (
                                        <g className="animate-pulse">
                                            <path d={`M 360 ${y} L 345 ${y}`} stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
                                            <text x="370" y={y + 4} className="text-[10px] fill-red-500 font-bold">Cara {i * 2}</text>

                                            <path d={`M 360 ${y + 8} L 345 ${y + 8}`} stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
                                            <text x="370" y={y + 12} className="text-[10px] fill-red-500 font-bold">Cara {i * 2 + 1}</text>

                                            <rect x="50" y={y} width="300" height="1" fill="#ef4444" opacity="0.5" />
                                            <rect x="50" y={y + 8} width="300" height="1" fill="#ef4444" opacity="0.5" />
                                        </g>
                                    )}

                                    {/* Cylinder Highlight - Vertical Columns */}
                                    {isActive('cylinder') && (
                                        <g>
                                            <path d={`M 100 30 L 100 180`} stroke="#a855f7" strokeWidth="2" strokeDasharray="4 2" />
                                            <path d={`M 300 30 L 300 180`} stroke="#a855f7" strokeWidth="2" strokeDasharray="4 2" />
                                            <rect x="90" y={y} width="20" height="8" className="fill-purple-500/50" />
                                            <rect x="290" y={y} width="20" height="8" className="fill-purple-500/50" />
                                        </g>
                                    )}
                                </g>
                            ))}

                            {/* Heads Assembly */}
                            <g className={`transition-colors duration-300 ${isActive('head') ? 'fill-rose-500' : 'fill-slate-700'}`} filter="drop-shadow(2px 2px 2px rgb(0 0 0 / 0.3))" onMouseEnter={() => setActivePart('head')}>
                                <rect x="20" y="30" width="20" height="150" rx="4" />
                                {[50, 58, 100, 108, 150, 158].map(y => (
                                    <path key={y} d={`M 40 ${y} L 80 ${y + 2} L 40 ${y + 4} Z`} />
                                ))}
                            </g>

                        </svg>
                    </div>
                </div>

            </div>

            {/* Explanations Panel */}
            <div className="flex-1 lg:max-w-md flex flex-col pt-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-6 flex items-center gap-2">
                    Conceptos Clave
                </h3>
                <div className="space-y-4">
                    {anatomyParts.map((part) => (
                        <button
                            key={part.id}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${activePart === part.id
                                ? 'bg-gradient-to-br from-blue-50 to-white border-blue-300 shadow-lg ring-1 ring-blue-200 transform scale-[1.02]'
                                : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                                }`}
                            onMouseEnter={() => setActivePart(part.id)}
                            onMouseLeave={() => setActivePart(null)}
                            onClick={() => setActivePart(activePart === part.id ? null : part.id)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`font-bold text-base ${activePart === part.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                    {part.label}
                                </span>
                                {/* View Badge - Only show if necessary or maybe smaller */}
                                <div className="flex gap-1">
                                    {['top', 'side', 'both'].includes(part.view) && (
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                                            {part.view === 'both' ? '3D' : part.view === 'top' ? 'Sup.' : 'Lat.'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className={`text-sm leading-relaxed transition-colors ${activePart === part.id ? 'text-blue-800' : 'text-gray-500'}`}>
                                {part.description}
                            </p>

                            {/* Active Indicator Bar */}
                            {activePart === part.id && (
                                <motion.div
                                    layoutId="activeIndicator"
                                    className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-900 flex gap-3 shadow-inner">
                    <span className="text-2xl">💡</span>
                    <p className="leading-relaxed">
                        <strong>Dato Profesional:</strong> Moderna direccionalidad <strong>LBA</strong> (Logical Block Addressing) traduce numéricamente la antigua tripla física <em>(Cilindro, Cabeza, Sector)</em>.
                    </p>
                </div>
            </div>

        </div>
    );
}
