'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface AlgorithmDemoProps {
    algorithmName: string;
    description: string;
    sequence: number[]; // e.g. [10, 50, 30, 90] - normalized 0-100
    visualizationType?: 'linear' | 'chart';
}

export default function AlgorithmDemo({ algorithmName, description, sequence, visualizationType = 'linear' }: AlgorithmDemoProps) {

    // LINEAR VISUALIZATION (Existing)
    if (visualizationType === 'linear') {
        const positions = sequence.map(p => `${p}%`);
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="p-5 flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{algorithmName}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                </div>
                <div className="bg-gray-50 border-t border-gray-100 p-6 relative h-32 flex flex-col justify-center">
                    <div className="w-full h-1 bg-gray-300 rounded relative">
                        {sequence.map((pos, i) => (
                            <div key={i} className="absolute w-2 h-2 bg-gray-400 rounded-full top-1/2 -mt-1 transform -translate-x-1/2" style={{ left: `${pos}%` }} />
                        ))}
                    </div>
                    <motion.div
                        className="absolute top-1/2 -mt-3 w-6 h-6 bg-primary-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-10"
                        animate={{ left: positions }}
                        transition={{ duration: sequence.length * 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                        style={{ x: "-50%" }}
                    >
                        <div className="w-2 h-2 bg-white rounded-full opacity-50" />
                    </motion.div>
                    <div className="absolute bottom-2 left-0 w-full flex justify-between px-2 text-[10px] text-gray-400 font-mono uppercase">
                        <span>0</span>
                        <span>100</span>
                    </div>
                </div>
            </div>
        );
    }

    // CHART VISUALIZATION (Time-Space)
    const padding = 20;
    const width = 300;
    const height = 150;

    // Map sequence to points [x, y]
    const points = sequence.map((val, i) => {
        const x = padding + (val / 100) * (width - 2 * padding);
        const y = padding + (i / (sequence.length - 1)) * (height - 2 * padding);
        return [x, y];
    });

    const isCircular = algorithmName.includes('C-');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="p-5 flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{algorithmName}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            </div>

            <div className="bg-gray-50 border-t border-gray-100 relative h-48 flex items-center justify-center">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full p-2">
                    {/* Grid Lines */}
                    {[0.25, 0.5, 0.75].map((ratio) => (
                        <line
                            key={`h-${ratio}`}
                            x1={padding}
                            y1={padding + ratio * (height - 2 * padding)}
                            x2={width - padding}
                            y2={padding + ratio * (height - 2 * padding)}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray="4 2"
                        />
                    ))}
                    {[0.25, 0.5, 0.75].map((ratio) => (
                        <line
                            key={`v-${ratio}`}
                            x1={padding + ratio * (width - 2 * padding)}
                            y1={padding}
                            x2={padding + ratio * (width - 2 * padding)}
                            y2={height - padding}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray="4 2"
                        />
                    ))}

                    {/* Axes */}
                    <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#9ca3af" strokeWidth="1" />
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#9ca3af" strokeWidth="1" />

                    {/* Path Segments */}
                    {points.map((p, i) => {
                        if (i === points.length - 1) return null;
                        const nextP = points[i + 1];

                        // Determine segment color
                        // For circular algorithms, if Next < Current, it's a reset (Red)
                        const isReset = isCircular && sequence[i + 1] < sequence[i];
                        const colorClass = isReset ? "stroke-red-400" : "stroke-primary-500";
                        const dashArray = isReset ? "4 2" : "none";

                        return (
                            <line
                                key={`seg-${i}`}
                                x1={p[0]} y1={p[1]}
                                x2={nextP[0]} y2={nextP[1]}
                                className={colorClass}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeDasharray={dashArray}
                            />
                        );
                    })}


                    {/* Request Points */}
                    {points.map((p, i) => (
                        <circle key={`pt-${i}`} cx={p[0]} cy={p[1]} r="3" className="fill-white stroke-primary-500 stroke-2" />
                    ))}

                    {/* Animated Head - SSTF Style Match */}
                    <motion.circle
                        r="6"
                        className="fill-primary-500 stroke-2 stroke-white drop-shadow-md"
                        animate={{
                            cx: points.map(p => p[0]),
                            cy: points.map(p => p[1])
                        }}
                        transition={{
                            duration: sequence.length * 1.5,
                            ease: "linear",
                            repeat: Infinity,
                            repeatDelay: 1,
                            times: points.map((_, i) => i / (points.length - 1))
                        }}
                    />
                </svg>

                {/* Labels */}
                <div className="absolute top-2 left-2 text-[10px] font-bold text-gray-500 bg-white/80 px-2 py-0.5 rounded border border-gray-100 shadow-sm">
                    Tiempo ↓
                </div>
                <div className="absolute bottom-1 right-2 text-[10px] font-bold text-gray-500 bg-white/80 px-2 py-0.5 rounded border border-gray-100 shadow-sm">
                    Pista →
                </div>
            </div>
        </div>
    );
}
