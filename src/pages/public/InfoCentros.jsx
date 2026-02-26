import React from 'react';
import { getAll } from '../../store/db';

export default function InfoCentros() {
    const config = getAll('site_config')[0];

    if (!config) return <div className="p-8 text-center text-gray-500 font-medium">Cargando información...</div>;

    const fontStyle = {
        fontFamily: config.centrosFont === 'System' ? 'inherit' : config.centrosFont,
        lineHeight: config.centrosHeight
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-10">
            <div className="space-y-8 text-center md:text-left animate-fade-in">
                <h2
                    className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight"
                    style={{ fontFamily: config.tituloFont === 'System' ? 'inherit' : config.tituloFont }}
                >
                    Nuestros Centros
                </h2>

                <div className="card bg-white/50 backdrop-blur-sm border-none shadow-xl p-8 md:p-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -ml-16 -mb-16 opacity-50"></div>

                    <div
                        className="text-gray-600 text-lg whitespace-pre-wrap relative z-10"
                        style={fontStyle}
                    >
                        {config.centrosTexto}
                    </div>
                </div>
            </div>
        </div>
    );
}
