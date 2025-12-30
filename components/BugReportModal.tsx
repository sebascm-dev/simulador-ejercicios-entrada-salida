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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
                {/* Header */}
                <div className="bg-gray-900 dark:bg-black px-6 py-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <IconBug size={20} className="text-red-400" />
                        Reportar un Problema
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <IconX size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        ¿Has encontrado un error en el simulador? Tu feedback es muy valioso.
                        Por favor, crea un "Issue" en nuestro repositorio de GitHub y descríbelo detalladamente.
                    </p>

                    <a
                        href="https://github.com/sebascm-dev/simulador-ejercicios-entrada-salida/issues/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-black text-white py-3 px-4 rounded-md font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        <IconBrandGithub size={20} />
                        Abrir Issue en GitHub
                    </a>

                    <div className="mt-4 text-center">
                        <button
                            onClick={onClose}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium underline-offset-2 hover:underline"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BugReportModal;
