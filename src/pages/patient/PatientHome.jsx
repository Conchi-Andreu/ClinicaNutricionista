import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import BookingWizard from './BookingWizard';
import Login from '../Login';
import { Info, MapPin, Calendar as CalendarIcon, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAll } from '../../store/db';

export default function PatientHome() {
    const { user } = useAuth();
    const siteConfig = getAll('site_config')[0] || {};

    if (user && user.rol === 'paciente') {
        return <BookingWizard />;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
            {/* Hero / Welcome Section for Guests */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-700 text-xs font-bold tracking-widest uppercase">
                        <CalendarIcon size={14} /> Gestión de Salud Nutricional
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
                        Tu cambio empieza <span className="text-primary-600">aquí y ahora</span>.
                    </h2>
                    <p className="text-lg text-gray-500 leading-relaxed font-medium max-w-xl">
                        {siteConfig.curriculum?.substring(0, 150)}...
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <Link to="/paciente/quien-soy" className="btn-secondary h-12 px-8">
                            Ver currículum <ArrowRight size={18} />
                        </Link>
                        <Link to="/paciente/centros" className="btn-ghost h-12 px-8">
                            Nuestros centros <MapPin size={18} className="text-amber-500" />
                        </Link>
                    </div>
                </div>

                {/* Integrated Login Section */}
                <div className="lg:col-span-5">
                    <div className="card shadow-2xl border-none p-8 md:p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>

                        <div className="relative">
                            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Área Personal</h3>
                            <p className="text-gray-400 text-sm font-medium mb-8">Inicia sesión para gestionar tus citas</p>

                            {/* We reuse the login form concept here, but simpler */}
                            <Login embedded={true} />

                            <div className="mt-8 text-center pt-6 border-t border-gray-50">
                                <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-widest">¿Nuevo paciente?</p>
                                <Link to="/register" className="text-primary-600 font-bold hover:underline">
                                    Crea tu cuenta en 1 minuto
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
