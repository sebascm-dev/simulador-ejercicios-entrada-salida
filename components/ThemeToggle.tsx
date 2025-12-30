'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { IconSun, IconMoon } from '@tabler/icons-react';

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Toggle Dark Mode"
        >
            {theme === 'dark' ? (
                <IconSun size={20} className="text-yellow-400" />
            ) : (
                <IconMoon size={20} className="text-gray-600" />
            )}
        </button>
    );
}
