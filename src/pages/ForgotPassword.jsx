import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { requestPasswordReset } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulation delay
        await new Promise(r => setTimeout(r, 1000));

        const res = requestPasswordReset(email);
        if (res.success) {
            setSubmitted(true);
            toast.success('Enlace de recuperación generado');
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-[440px] animate-fade-in bg-white rounded-[2.5rem] shadow-modal p-12 text-center">
                    <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Revisa tu consola</h2>
                    <p className="text-gray-500 font-medium leading-relaxed mb-8">
                        Si el email <span className="text-primary-600 font-bold">{email}</span> está registrado, hemos generado un enlace de recuperación.
                        Por favor, consulta la consola del navegador (F12) para ver el enlace simulado.
                    </p>
                    <Link to="/login" className="block w-full">
                        <Button variant="secondary" className="w-full h-14">
                            Volver al Inicio de Sesión
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
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Recuperar Acceso</h1>
                        <p className="text-gray-500 mt-2 font-medium">Introduce tu email para enviarte un enlace de recuperación</p>
                    </div>

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

                        <Button
                            type="submit"
                            className="w-full h-14 text-sm font-bold uppercase tracking-wider"
                            loading={loading}
                            icon={Send}
                        >
                            Enviar Instrucciones
                        </Button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-gray-50">
                        <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-primary-600 transition-colors">
                            <ArrowLeft size={16} /> Volver al Inicio de Sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
