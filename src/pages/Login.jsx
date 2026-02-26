import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Login({ embedded = false }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate slight network delay for better UX feel
        await new Promise(r => setTimeout(r, 600));

        const res = login(email, password);
        if (res.success) {
            toast.success(`¡Bienvenido de nuevo, ${res.user.nombre}!`);
            navigate(res.user.rol === 'admin' || res.user.rol === 'tecnico' ? '/admin' : '/paciente');
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />

            <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />

            <div className="flex items-center justify-between text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-gray-700">
                    <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    Recordarme
                </label>
                <Link to="/forgot-password" size="sm" className="text-primary-600 hover:text-primary-700">¿Olvidaste tu contraseña?</Link>
            </div>

            <Button
                type="submit"
                className="w-full h-14 text-sm"
                loading={loading}
                icon={LogIn}
            >
                Iniciar sesión
            </Button>
        </form>
    );

    if (embedded) {
        return formContent;
    }

    return (
        <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[440px] animate-fade-in">
                <div className="bg-white rounded-[2.5rem] shadow-modal overflow-hidden p-8 md:p-12">
                    {/* Logo / Brand */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-16 h-16 bg-primary-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl mb-4">
                            <Calendar size={32} />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ClinicaNutri</h1>
                        <p className="text-gray-500 mt-2 font-medium">Gestión inteligente de tu nutrición</p>
                    </div>

                    {formContent}

                    <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                        <p className="text-lg font-black text-red-600 uppercase tracking-tight">
                            ¿No tienes una cuenta?
                        </p>
                        <Link to="/register" className="mt-2 text-primary-600 font-bold hover:underline inline-flex items-center gap-1">
                            Regístrate aquí <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
