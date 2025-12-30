import React, { useEffect, useState } from 'react';
import { IconBrandGithub } from '@tabler/icons-react';

interface Contributor {
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
    contributions: number;
}

const GitHubContributors: React.FC = () => {
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchContributors = async () => {
            try {
                // Try the new repository name first
                let repoName = 'simulador-ejercicios-entrada-salida';
                let response = await fetch(`https://api.github.com/repos/sebascm-dev/${repoName}/contributors`);

                if (!response.ok) {
                    // Fallback to the original name if the rename hasn't happened or hasn't propagated
                    repoName = 'test';
                    response = await fetch(`https://api.github.com/repos/sebascm-dev/${repoName}/contributors`);
                }

                if (!response.ok) {
                    // If both fail (likely private repo), fallback to manual entry
                    throw new Error('Repositorio privado o no encontrado');
                }

                let fetchedData: Contributor[] = await response.json();

                // Manual override: Ensure specific contributors are always present (e.g. for demo or if API misses them)
                const manualContributors = [
                    {
                        id: 1101,
                        login: 'Airamsveedraaa',
                        avatar_url: 'https://github.com/Airamsveedraaa.png',
                        html_url: 'https://github.com/Airamsveedraaa',
                        contributions: 1
                    }
                ];

                // Remove duplicates from manual list if they already exist in fetched data
                const uniqueManual = manualContributors.filter(mc => !fetchedData.some(fd => fd.login === mc.login));

                setContributors([...fetchedData, ...uniqueManual]);
                setError(null);
            } catch (err) {
                console.warn('Could not fetch contributors (likely private repo). Using fallback.', err);
                // Fallback for private repo
                setContributors([
                    {
                        id: 1100, // Arbitrary ID
                        login: 'sebascm-dev',
                        avatar_url: 'https://github.com/sebascm-dev.png',
                        html_url: 'https://github.com/sebascm-dev',
                        contributions: 1
                    },
                    {
                        id: 1101, // Arbitrary ID
                        login: 'Airamsveedraaa',
                        avatar_url: 'https://github.com/Airamsveedraaa.png',
                        html_url: 'https://github.com/Airamsveedraaa',
                        contributions: 1
                    }
                ]);
                setError(null);
            } finally {
                setLoading(false);
            }
        };

        fetchContributors();
    }, []);

    if (loading) return null;
    if (contributors.length === 0) return null;

    const mainAuthor = contributors.find(c => c.login === 'sebascm-dev');
    const otherContributors = contributors.filter(c => c.login !== 'sebascm-dev');

    return (
        <div className="mt-4 mb-8 flex flex-col items-center">

            {/* Main Author */}
            <div className="py-6 w-full">
                <h3 className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
                    Equipo de Desarrollo
                </h3>

                <div className="flex justify-center mb-8">
                    <a
                        href="https://github.com/sebascm-dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-100 dark:hover:border-blue-900 transition-all duration-300"
                    >
                        <div className="relative">
                            <img
                                src="https://github.com/sebascm-dev.png"
                                alt="Sebastián C. M."
                                className="w-16 h-16 rounded-full border-2 border-white dark:border-gray-700 shadow-sm transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                        <div className="text-center">
                            <span className="block text-sm font-bold text-gray-800 dark:text-gray-100">
                                sebascm-dev
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                Desarrollador Principal
                            </span>
                        </div>
                    </a>
                </div>

                {/* Other Contributors */}
                {otherContributors.length > 0 && (
                    <div className="text-center">
                        <h3 className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-widest font-semibold mb-3">
                            Colaboradores
                        </h3>
                        <div className="flex flex-wrap justify-center gap-4">
                            {otherContributors.map((contributor) => (
                                <a
                                    key={contributor.id}
                                    href={contributor.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-2 pr-3 pl-1 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-sm transition-all duration-200"
                                    title={`${contributor.login} - ${contributor.contributions} contribuciones`}
                                >
                                    <img
                                        src={contributor.avatar_url}
                                        alt={contributor.login}
                                        className="w-6 h-6 rounded-full border border-gray-100 dark:border-gray-600"
                                    />
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                        {contributor.login}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GitHubContributors;
