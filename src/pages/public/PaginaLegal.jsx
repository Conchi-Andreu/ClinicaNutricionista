import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAll } from '../../store/db';
import { ChevronLeft, Shield, FileText, Lock } from 'lucide-react';

export default function PaginaLegal() {
    const { tipo } = useParams();
    const config = getAll('site_config')[0];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [tipo]);

    if (!config) return <div className="p-8 text-center text-gray-500 font-medium">Cargando...</div>;

    const contenido = {
        'aviso-legal': {
            titulo: 'Aviso Legal',
            texto: config.legalAviso,
            icon: FileText
        },
        'privacidad': {
            titulo: 'Política de Privacidad',
            texto: config.legalPrivacidad,
            icon: Lock
        },
        'cookies': {
            titulo: 'Política de Cookies',
            texto: config.legalCookies,
            icon: Shield
        }
    };

    const legal = contenido[tipo] || { titulo: 'Documento Legal', texto: 'Contenido no encontrado.' };
    const Icon = legal.icon || FileText;

    return (
        <div className="max-w-4xl mx-auto py-12 animate-fade-in">
            <Link
                to="/paciente"
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary-600 mb-8 transition-colors"
            >
                <ChevronLeft size={16} /> Volver al portal
            </Link>

            <div className="card shadow-2xl border-none p-8 md:p-16">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-50">
                    <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
                        <Icon size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{legal.titulo}</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Documentación Oficial</p>
                    </div>
                </div>

                <div className="prose prose-primary max-w-none">
                    {legal.texto ? (
                        <div className="text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                            {legal.texto}
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                            <p className="text-gray-400 font-bold">Este documento legal aún no ha sido configurado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
