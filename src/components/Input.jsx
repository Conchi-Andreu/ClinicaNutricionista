import React from 'react';

export default function Input({ label, error, icon: Icon, className = '', ...props }) {
    return (
        <div className={`w-full ${className}`}>
            {label && <label className="label">{label}</label>}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    className={`input ${Icon ? 'pl-11' : ''} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''}`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
}
