import React from 'react';
import { getAll } from '../../store/db';

export default function QuienSoy() {
    const config = getAll('site_config')[0];

    if (!config) return <div className="p-8 text-center text-gray-500 font-medium">Cargando información...</div>;

    const fontStyle = {
        fontFamily: config.curriculumFont === 'System' ? 'inherit' : config.curriculumFont,
        lineHeight: config.curriculumHeight
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-10">
            <div className="flex flex-col md:flex-row gap-12 items-center md:items-start text-center md:text-left">
                {config.foto && (
                    <div className="flex-shrink-0 animate-fade-in relative">
                        <div className="absolute -inset-4 bg-primary-100/50 rounded-3xl -z-10 blur-xl"></div>
                        <img
                            src={config.foto}
                            style={{ width: `${config.fotoWidth}px`, maxWidth: '100%' }}
                            className="h-auto rounded-3xl shadow-2xl border-4 border-white object-cover"
                            alt="Foto Profesional"
                        />
                    </div>
                )}
                <div className="flex-1 space-y-6">
                    <h2
                        className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight"
                        style={{ fontFamily: config.tituloFont === 'System' ? 'inherit' : config.tituloFont }}
                    >
                        Quién Soy
                    </h2>
                    <div
                        className="text-gray-600 text-lg whitespace-pre-wrap"
                        style={fontStyle}
                    >
                        {config.curriculum}
                    </div>
                </div>
            </div>
        </div>
    );
}
