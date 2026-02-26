import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

// Components
import CookieConsent from './components/CookieConsent';
import AdminLayout from './layouts/AdminLayout';
import PatientLayout from './layouts/PatientLayout';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import Tecnicos from './pages/admin/Tecnicos';
import Centros from './pages/admin/Centros';
import TiposVisita from './pages/admin/TiposVisita';
import Planificacion from './pages/admin/Planificacion';
import Agenda from './pages/admin/Agenda';
import Citas from './pages/admin/Citas';
import Pacientes from './pages/admin/Pacientes';
import Usuarios from './pages/admin/Usuarios';
import GeneralConfig from './pages/admin/GeneralConfig';
import Perfil from './pages/admin/Perfil';

// Patient pages
import PatientHome from './pages/patient/PatientHome';
import MisCitas from './pages/patient/MisCitas';

// Public pages
import QuienSoy from './pages/public/QuienSoy';
import InfoCentros from './pages/public/InfoCentros';
import InfoContacto from './pages/public/InfoContacto';
import PaginaLegal from './pages/public/PaginaLegal';

function PrivateRoute({ children, allowedRoles }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.rol)) return <Navigate to="/login" replace />;
    return children;
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100">
                        <h2 className="text-2xl font-extrabold text-red-600 mb-4">Algo salió mal</h2>
                        <pre className="text-xs bg-red-50 p-4 rounded-xl text-red-800 overflow-auto max-h-60 mb-6 font-mono">
                            {this.state.error?.toString()}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full btn-primary h-12"
                        >
                            Reiniciar aplicación
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    const { user } = useAuth();

    return (
        <ErrorBoundary>
            <Routes>
                {/* Public */}
                <Route path="/login" element={!user ? <Login /> : <Navigate to={user.rol === 'admin' || user.rol === 'tecnico' ? '/admin' : '/paciente'} />} />
                <Route path="/register" element={!user ? <Register /> : <Navigate to="/paciente" />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Administration (Admin + Técnico) */}
                <Route path="/admin" element={
                    <PrivateRoute allowedRoles={['admin', 'tecnico']}>
                        <AdminLayout />
                    </PrivateRoute>
                }>
                    <Route index element={<Dashboard />} />
                    <Route path="tecnicos" element={<Tecnicos />} />
                    <Route path="centros" element={<Centros />} />
                    <Route path="tipos-visita" element={<TiposVisita />} />
                    <Route path="planificacion" element={<Planificacion />} />
                    <Route path="agenda" element={<Agenda />} />
                    <Route path="citas" element={<Citas />} />
                    <Route path="pacientes" element={<Pacientes />} />
                    <Route path="perfil" element={<Perfil />} />
                    <Route path="usuarios" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <Usuarios />
                        </PrivateRoute>
                    } />
                    <Route path="general" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <GeneralConfig />
                        </PrivateRoute>
                    } />
                </Route>

                {/* Patient */}
                <Route path="/paciente" element={<PatientLayout />}>
                    <Route index element={<PatientHome />} />
                    <Route path="mis-citas" element={
                        <PrivateRoute allowedRoles={['paciente']}>
                            <MisCitas />
                        </PrivateRoute>
                    } />
                    <Route path="perfil" element={
                        <PrivateRoute allowedRoles={['paciente']}>
                            <Perfil />
                        </PrivateRoute>
                    } />
                    <Route path="quien-soy" element={<QuienSoy />} />
                    <Route path="centros" element={<InfoCentros />} />
                    <Route path="contacto" element={<InfoContacto />} />
                    <Route path="legal/:tipo" element={<PaginaLegal />} />
                </Route>

                {/* Default redirect */}
                <Route path="/" element={
                    user
                        ? <Navigate to={user.rol === 'admin' || user.rol === 'tecnico' ? '/admin' : '/paciente'} />
                        : <Navigate to="/paciente" />
                } />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <CookieConsent />
        </ErrorBoundary>
    );
}
