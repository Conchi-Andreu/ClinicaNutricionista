import React, { useState, useEffect } from 'react';
import { Shield, X, Check, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Mostrar después de un pequeño retraso para mejor UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-slide-up">
            <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
                    <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shrink-0">
                        <Shield size={32} />
                    </div>

                    <div className="flex-1 space-y-2 text-center md:text-left">
                        <h4 className="text-lg font-bold text-gray-900">Tu privacidad es importante</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Utilizamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y personalizar el contenido.
                            Puedes aceptar todas las cookies o configurar tus preferencias.
                            Consulta nuestra <Link to="/paciente/legal/cookies" className="text-primary-600 font-bold cursor-pointer hover:underline text-xs uppercase tracking-widest">Política de Cookies</Link>.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={handleDecline}
                            className="text-xs font-bold text-gray-400 hover:text-gray-600 px-4 py-2 transition-colors order-2 sm:order-1"
                        >
                            Solo necesarias
                        </button>
                        <Button
                            onClick={handleAccept}
                            icon={Check}
                            className="w-full sm:w-auto px-8 h-12 shadow-lg shadow-primary-200 order-1 sm:order-2"
                        >
                            Aceptar todas
                        </Button>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
