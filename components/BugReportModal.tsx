import React from 'react';
import { IconBug, IconBrandGithub, IconX } from '@tabler/icons-react';

interface BugReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="bg-red-50 p-4 flex items-center justify-between border-b border-red-100">
                    <div className="flex items-center gap-2 text-red-700 font-bold">
                        <IconBug size={24} />
                        <h3>¿Encontraste un Bug?</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-red-400 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-100"
                    >
                        <IconX size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 text-center">
                    <div className="mb-6 bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-3xl">🐛</span>
                    </div>

                    <h4 className="text-xl font-bold text-gray-800 mb-2">
                        ¡Vaya! Algo no salió como esperabas...
                    </h4>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Si has encontrado un error, ¡me encantaría saberlo! Tu ayuda es vital para mejorar este simulador para todos.
                    </p>

                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6 text-left text-sm text-gray-600">
                        <p className="font-semibold mb-1">Tips para el reporte:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>¿Qué algoritmo estabas usando?</li>
                            <li>¿Qué valores introdujiste?</li>
                            <li>¿Qué pasó exactamente?</li>
                        </ul>
                    </div>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <a
                            href="https://github.com/sebascm-dev/simulador-ejercicios-entrada-salida/issues/new"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                            onClick={onClose}
                        >
                            <IconBrandGithub size={20} />
                            Reportar en GitHub
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BugReportModal;
