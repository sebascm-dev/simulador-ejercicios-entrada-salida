'use client';

import React from 'react';

interface InputSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

export default function InputSection({ title, children }: InputSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
