import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { LogOut, Calendar, User, ChevronLeft, Info, HelpCircle, Phone } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getAll } from '../store/db';

export default function PatientLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const siteConfig = getAll('site_config')[0] || {};

    const handleLogout = () => {
        logout();
        navigate('/paciente');
    };

    return (
        <div className="min-h-screen bg-cream-100 flex flex-col">
            <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100 font-inter transition-all">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                    {/* Top Row: Logo, Title/Subtitle and Profile */}
                    <div className="flex items-start justify-between mb-4">
                        <Link to="/paciente" className="flex items-center gap-4 group">
                            {siteConfig.logo ? (
                                <img
                                    src={siteConfig.logo}
                                    style={{ width: `${siteConfig.logoWidth || 50}px` }}
                                    className="h-auto object-contain"
                                    alt="Site Logo"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                                    <Calendar size={26} />
                                </div>
                            )}
                            <div>
                                <h1
                                    className="font-bold text-gray-900 leading-tight"
                                    style={{
                                        fontFamily: siteConfig.tituloFont === 'System' ? 'inherit' : siteConfig.tituloFont,
                                        fontSize: `${Math.max(siteConfig.tituloSize || 24, 20)}px`
                                    }}
                                >
                                    {siteConfig.titulo || 'Clínica Nutri'}
                                </h1>
                                <p
                                    className="text-primary-600 font-bold uppercase tracking-[0.2em] mt-0.5"
                                    style={{
                                        fontFamily: siteConfig.subtituloFont === 'System' ? 'inherit' : siteConfig.subtituloFont,
                                        fontSize: `${Math.max(siteConfig.subtituloSize || 12, 10)}px`
                                    }}
                                >
                                    {siteConfig.subtitulo || 'Patient Portal'}
                                </p>
                            </div>
                        </Link>

                        {user ? (
                            <div className="flex items-center gap-3 pl-2">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900">{user?.nombre}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Paciente</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100"
                                    title="Cerrar sesión"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="btn-primary px-5 py-2 text-xs h-10"
                                >
                                    Iniciar Sesión
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Bottom Row: Navigation Menu */}
                    <nav className="flex items-center gap-1 sm:gap-2">
                        <Link
                            to="/paciente/quien-soy"
                            className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50 transition-all hidden lg:block"
                        >
                            ¿Quién Soy?
                        </Link>

                        <Link
                            to="/paciente/centros"
                            className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50 transition-all hidden lg:block"
                        >
                            Centros
                        </Link>

                        <Link
                            to="/paciente/contacto"
                            className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50 transition-all hidden lg:block"
                        >
                            Contacto
                        </Link>

                        {user && (
                            <>
                                <div className="h-4 w-px bg-gray-100 hidden lg:block mx-1"></div>

                                <Link
                                    to="/paciente/perfil"
                                    className="text-sm font-bold text-gray-600 hover:text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50 transition-all hidden sm:block"
                                >
                                    Mi Perfil
                                </Link>

                                <Link
                                    to="/paciente"
                                    className="text-sm font-bold text-gray-600 hover:text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50 transition-all hidden sm:block"
                                >
                                    Nueva Cita
                                </Link>

                                <Link
                                    to="/paciente/mis-citas"
                                    className="text-sm font-bold text-gray-600 hover:text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50 transition-all hidden sm:block"
                                >
                                    Mis Citas
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 py-8 md:py-12 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto page-enter">
                    <Outlet />
                </div>
            </main>

            {/* Footer with Legal Links */}
            <footer className="bg-white border-t border-gray-100 py-12 pb-24 sm:pb-12">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
                                <Calendar size={18} />
                            </div>
                            <span className="font-bold text-gray-900">{siteConfig.titulo || 'Clínica Nutri'}</span>
                        </div>

                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            <Link to="/paciente/legal/aviso-legal" className="hover:text-primary-600 transition-colors">Aviso Legal</Link>
                            <Link to="/paciente/legal/privacidad" className="hover:text-primary-600 transition-colors">Política de Privacidad</Link>
                            <Link to="/paciente/legal/cookies" className="hover:text-primary-600 transition-colors">Política de Cookies</Link>
                            <Link to="/paciente/contacto" className="hover:text-primary-600 transition-colors">Contacto</Link>
                        </div>

                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            &copy; {new Date().getFullYear()} — Todos los derechos reservados
                        </p>
                    </div>
                </div>
            </footer>

            {/* Bottom Navigation for Mobile */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-50">
                <Link to="/paciente" className={`flex flex-col items-center gap-1 ${user ? 'text-primary-600' : 'text-gray-400'}`}>
                    <Calendar size={22} />
                    <span className="text-[10px] font-bold">{user ? 'Reservar' : 'Inicio'}</span>
                </Link>
                <Link to="/paciente/contacto" className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary-600">
                    <Phone size={22} />
                    <span className="text-[10px] font-bold">Contacto</span>
                </Link>
                {user && (
                    <>
                        <Link to="/paciente/mis-citas" className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary-600">
                            <History size={22} />
                            <span className="text-[10px] font-bold">Mis Citas</span>
                        </Link>
                        <Link to="/paciente/perfil" className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary-600">
                            <User size={22} />
                            <span className="text-[10px] font-bold">Perfil</span>
                        </Link>
                    </>
                )}
                {!user && (
                    <Link to="/login" className="flex flex-col items-center gap-1 text-primary-600">
                        <User size={22} />
                        <span className="text-[10px] font-bold">Acceso</span>
                    </Link>
                )}
            </nav>
        </div>
    );
}

// Reusable icons for mobile bottom nav
function History({ size, ...props }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    );
}
