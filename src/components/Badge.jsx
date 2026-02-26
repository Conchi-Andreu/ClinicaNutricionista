import React from 'react';

export default function Badge({ children, variant = 'primary', className = '' }) {
    const variants = {
        primary: 'bg-primary-50 text-primary-700 border-primary-100',
        secondary: 'bg-gray-50 text-gray-700 border-gray-100',
        success: 'bg-green-50 text-green-700 border-green-100',
        warning: 'bg-amber-50 text-amber-700 border-amber-100',
        danger: 'bg-red-50 text-red-700 border-red-100',
        info: 'bg-blue-50 text-blue-700 border-blue-100',
    };

    return (
        <span className={`badge border ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}
