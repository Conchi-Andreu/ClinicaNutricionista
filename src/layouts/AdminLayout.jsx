import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    BarChart3,
    Users,
    MapPin,
    History,
    Calendar,
    ClipboardList,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    ShieldCheck,
    Mail
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useSiteConfig } from '../context/SiteConfigContext';

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { config: siteConfig } = useSiteConfig();

    const handleLogout = () => {
        logout();
        navigate('/paciente');
    };

    const navItems = [
        { to: '/admin/general', icon: Settings, label: 'General', roles: ['admin'] },
        { to: '/admin', icon: BarChart3, label: 'Dashboard', end: true, roles: ['admin', 'tecnico'] },
        { to: '/admin/perfil', icon: User, label: 'Mi Perfil', roles: ['admin', 'tecnico'] },
        { to: '/admin/agenda', icon: Calendar, label: 'Agenda', roles: ['admin', 'tecnico'] },
        { to: '/admin/citas', icon: ClipboardList, label: 'Citas', roles: ['admin', 'tecnico'] },
        { to: '/admin/pacientes', icon: User, label: 'Pacientes', roles: ['admin'] },
        { to: '/admin/planificacion', icon: History, label: 'Planificación', roles: ['admin', 'tecnico'] },
        { to: '/admin/tecnicos', icon: Users, label: 'Técnicos', roles: ['admin'] },
        { to: '/admin/centros', icon: MapPin, label: 'Centros / Salas', roles: ['admin'] },
        { to: '/admin/tipos-visita', icon: Settings, label: 'Tipos de Visita', roles: ['admin'] },
        { to: '/admin/usuarios', icon: ShieldCheck, label: 'Usuarios', roles: ['admin'] },
        { to: '/admin/mensajes', icon: Mail, label: 'Mensajes', roles: ['admin'] },
    ].filter(item => !item.roles || item.roles.some(r => r === user?.rol));

    return (
        <div className="flex min-h-screen bg-cream-100">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col bg-white border-r border-gray-100 shadow-sm fixed inset-y-0" style={{ width: '374px' }}>
                <div className="p-8 flex-1 overflow-y-auto">
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `sidebar-link ${isActive ? 'active' : ''}`
                                }
                            >
                                <item.icon size={20} />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                            <User size={20} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.nombre} {user?.apellidos}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut size={18} />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Mobile Topbar */}
            <div className="lg:hidden flex items-center justify-between w-full h-16 px-4 bg-white border-b fixed top-0 z-50">
                <div className="flex items-center gap-2">
                    {siteConfig.logo ? (
                        <img
                            src={siteConfig.logo}
                            style={{ width: `${Math.min(32, siteConfig.logoWidth)}px` }}
                            className="h-auto object-contain"
                            alt="Site Logo"
                        />
                    ) : (
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
                            <Calendar size={18} />
                        </div>
                    )}
                    <span
                        className="font-bold text-gray-900"
                        style={{ fontFamily: siteConfig.tituloFont === 'System' ? 'inherit' : siteConfig.tituloFont }}
                    >
                        {siteConfig.titulo || 'Clínica'}
                    </span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar Drawer */}
            <aside className={`
        lg:hidden fixed inset-y-0 left-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
                                <Calendar size={18} />
                            </div>
                            <span className="font-bold text-gray-900">Clínica</span>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)}>
                            <X size={24} className="text-gray-400" />
                        </button>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `sidebar-link ${isActive ? 'active' : ''}`
                                }
                            >
                                <item.icon size={20} />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                            <User size={20} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.nombre} {user?.apellidos}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut size={18} />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 pt-16 lg:pt-0 admin-main-content">
                <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto page-enter">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
