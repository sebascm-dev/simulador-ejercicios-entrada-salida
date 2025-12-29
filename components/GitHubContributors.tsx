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

                const data = await response.json();
                setContributors(data);
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

    return (
        <div className="mt-8 text-center">
            <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-4">
                Colaboradores de GitHub
            </h3>
            <div className="flex justify-center flex-wrap gap-1">
                {contributors.map((contributor) => (
                    <a
                        key={contributor.id}
                        href={contributor.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative"
                        title={`${contributor.login} (${contributor.contributions} contribuciones)`}
                    >
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary-500 transition-all duration-200 transform group-hover:scale-110 shadow-sm">
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
    );
};

export default GitHubContributors;
