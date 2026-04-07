import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, LogIn, Calendar, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, success, error
    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error('Token no válido');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        await new Promise(r => setTimeout(r, 1000));

        const res = await resetPassword(token, formData.password);
        if (res.success) {
            setStatus('success');
            toast.success('Contraseña actualizada correctamente');
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-[440px] animate-fade-in bg-white rounded-[2.5rem] shadow-modal p-12 text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4">¡Listo!</h2>
                    <p className="text-gray-500 font-medium leading-relaxed mb-8">
                        Tu contraseña ha sido actualizada correctamente. Ya puedes acceder con tus nuevas credenciales.
                    </p>
                    <Link to="/login" className="block w-full">
                        <Button className="w-full h-14" icon={LogIn}>
                            Ir al Inicio de Sesión
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-[440px] animate-fade-in bg-white rounded-[2.5rem] shadow-modal p-12 text-center">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <XCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Enlace no válido</h2>
                    <p className="text-gray-500 font-medium leading-relaxed mb-8">
                        El enlace de recuperación es incorrecto o ha expirado. Por favor, solicita uno nuevo.
                    </p>
                    <Link to="/forgot-password" className="block w-full">
                        <Button variant="secondary" className="w-full h-14">
                            Solicitar nuevo enlace
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[440px] animate-fade-in">
                <div className="bg-white rounded-[2.5rem] shadow-modal overflow-hidden p-8 md:p-12">
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-16 h-16 bg-primary-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl mb-4">
                            <Calendar size={32} />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Nueva Contraseña</h1>
                        <p className="text-gray-500 mt-2 font-medium">Establece una contraseña segura para tu cuenta</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Nueva Contraseña"
                            type="password"
                            placeholder="••••••••"
                            icon={Lock}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                        <Input
                            label="Confirmar Contraseña"
                            type="password"
                            placeholder="••••••••"
                            icon={Lock}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                        />

                        <Button
                            type="submit"
                            className="w-full h-14 text-sm font-bold uppercase tracking-wider"
                            loading={loading}
                            icon={LogIn}
                        >
                            Actualizar Contraseña
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
