'use client';

import React from 'react';

interface InputSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function InputSection({ title, children }: InputSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}

