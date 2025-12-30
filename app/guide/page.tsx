'use client';

import React from 'react';
import Link from 'next/link';
import { IconArrowLeft, IconInfoCircle } from '@tabler/icons-react';
import DiskAnatomy from '@/components/education/DiskAnatomy';
import AlgorithmDemo from '@/components/education/AlgorithmDemo';

export default function GuidePage() {
    const algorithms = [
        {
            name: 'SSTF (Shortest Seek Time First)',
            description: 'Selecciona la petición más cercana a la posición actual del cabezal. Minimiza el movimiento inmediato pero puede causar inanición (starvation) a peticiones lejanas.',
            sequence: [50, 45, 55, 30, 60, 20, 80],
            visualizationType: 'linear' as const
        },
        {
            name: 'SCAN (Elevator)',
            description: 'El cabezal se mueve en una dirección atendiendo todo a su paso hasta llegar al extremo, luego invierte y regresa. Funciona como un ascensor.',
            sequence: [10, 30, 50, 70, 90, 100, 80, 60, 40], // Zig-zag pattern
            visualizationType: 'chart' as const
        },
        {
            name: 'C-SCAN (Circular SCAN)',
            description: 'Similar a SCAN pero al llegar al extremo, salta inmediatamente al principio sin atender nada en el regreso. Ofrece un tiempo de espera más uniforme.',
            sequence: [10, 30, 60, 90, 100, 0, 15, 35, 55], // Shows the wrap around clearly with more points
            visualizationType: 'chart' as const
        },
        {
            name: 'LOOK',
            description: 'Como SCAN, pero el cabezal solo viaja hasta la última petición en esa dirección, no hasta el extremo físico del disco, antes de invertir.',
            sequence: [10, 30, 60, 85, 50, 20], // Turns around at 85, not 100
            visualizationType: 'chart' as const
        },
        {
            name: 'C-LOOK',
            description: 'Versión optimizada de C-SCAN. Solo viaja hasta la última petición en cada dirección y salta a la primera petición del otro extremo, sin llegar al borde físico.',
            sequence: [15, 45, 75, 95, 5, 25, 55], // Turns back to 5 from 95
            visualizationType: 'chart' as const
        },
        {
            name: 'F-SCAN',
            description: 'Utiliza dos colas. Mientras una está siendo procesada (congelada), las nuevas peticiones se acumulan en la otra. Evita la inanición de forma efectiva.',
            sequence: [10, 40, 70, 95, 20, 50, 80], // Two distinct sweeps/batches
            visualizationType: 'chart' as const
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200"
                        >
                            <IconArrowLeft size={20} />
                            <span>Volver al Simulador</span>
                        </Link>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                            Guía Interactiva de Discos
                        </h1>
                    </div>
                </div>

                {/* Section 1: Disk Anatomy */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <IconInfoCircle className="text-primary-600" size={24} />
                        <h2 className="text-2xl font-bold text-gray-800">1. Anatomía del Disco Duro</h2>
                    </div>
                    <p className="text-gray-600 mb-6">
                        Un disco duro mecánico (HDD) es una maravilla de la ingeniería de precisión.
                        Interactúa con el diagrama para conocer sus componentes principales y entender por qué la planificación de movimiento es crucial para el rendimiento.
                    </p>
                    <DiskAnatomy />
                </section>

                {/* Section 2: Algorithms */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <IconInfoCircle className="text-primary-600" size={24} />
                        <h2 className="text-2xl font-bold text-gray-800">2. Algoritmos de Planificación</h2>
                    </div>
                    <p className="text-gray-600 mb-8">
                        El sistema operativo debe decidir en qué orden atender las peticiones de lectura/escritura para minimizar el movimiento del brazo (tiempo de búsqueda).
                        Aquí puedes ver visualmente cómo se comporta cada estrategia.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {algorithms.map((algo, index) => (
                            <AlgorithmDemo
                                key={index}
                                algorithmName={algo.name}
                                description={algo.description}
                                sequence={algo.sequence}
                                visualizationType={algo.visualizationType}
                            />
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
