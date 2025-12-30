import React, { useEffect, useState } from 'react';

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
        <div className="mt-12 mb-8 flex flex-col items-center">

            {/* Main Author */}
            {mainAuthor && (
                <div className="flex flex-col items-center mb-6 animate-fade-in-up">
                    <p className="text-gray-500 text-sm mb-4 font-medium">
                        Hecho por <span className="font-bold text-gray-800">Sebastián Contreras Marín</span>
                    </p>
                    <a
                        href={mainAuthor.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative inline-block"
                        title="Creador Principal"
                    >
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white ring-4 ring-primary-100 shadow-xl group-hover:scale-105 transition-transform duration-300">
                            <img
                                src={mainAuthor.avatar_url}
                                alt={mainAuthor.login}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </a>
                    <div className="mt-3 text-center">
                        <p className="text-gray-900 font-bold text-lg">{mainAuthor.login}</p>
                        <p className="text-primary-600 text-xs font-semibold uppercase tracking-wider">Creador</p>
                    </div>
                </div>
            )}

            {/* Other Contributors */}
            {otherContributors.length > 0 && (
                <div className="text-center">
                    <h3 className="text-gray-400 text-[10px] uppercase tracking-widest font-semibold mb-3">
                        Colaboradores
                    </h3>
                    <div className="flex justify-center flex-wrap gap-2">
                        {otherContributors.map((contributor) => (
                            <a
                                key={contributor.id}
                                href={contributor.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative"
                                title={`${contributor.login} (${contributor.contributions} contribuciones)`}
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white ring-1 ring-gray-200 group-hover:ring-primary-400 transition-all duration-200 transform group-hover:scale-105 shadow-sm opacity-80 group-hover:opacity-100 grayscale group-hover:grayscale-0">
                                    <img
                                        src={contributor.avatar_url}
                                        alt={contributor.login}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GitHubContributors;
