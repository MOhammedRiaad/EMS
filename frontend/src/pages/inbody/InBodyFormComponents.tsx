import React from 'react';

// Shared form components for InBody scan forms

export const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">
        {title}
    </h3>
);

export const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {children} {required && <span className="text-red-500">*</span>}
    </label>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
    />
);

export const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
        {children}
    </div>
);

export default { SectionHeader, Label, Input, Card };
