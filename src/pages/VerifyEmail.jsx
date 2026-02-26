import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const { verifyEmail } = useAuth();
    const token = searchParams.get('token');
    const verificationAttempted = React.useRef(false);

    useEffect(() => {
        const doVerify = async () => {
            if (!token) {
                setStatus('error');
                return;
            }

            if (verificationAttempted.current) return;
            verificationAttempted.current = true;

            // Artificial delay for UX
            await new Promise(r => setTimeout(r, 1500));

            const res = verifyEmail(token);
            if (res.success) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        };

        doVerify();
    }, [token, verifyEmail]);

    return (
        <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[500px] animate-fade-in text-center bg-white rounded-[2.5rem] shadow-modal p-12">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-14 h-14 bg-primary-600 rounded-[1.125rem] flex items-center justify-center text-white shadow-xl mb-4">
                        <Calendar size={28} />
                    </div>
                </div>

                {status === 'verifying' && (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <Loader2 size={48} className="text-primary-600 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900">Verificando tu cuenta...</h2>
                        <p className="text-gray-500 font-medium">Estamos validando tu enlace de registro. Solo un momento.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6 animate-scale-in">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">¡Cuenta activada!</h2>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            Tu email ha sido verificado correctamente. Ya puedes acceder a todas las funciones de la clínica.
                        </p>
                        <div className="pt-4">
                            <Link to="/login">
                                <Button className="w-full h-14" icon={ArrowRight}>
                                    Ir al Inicio de Sesión
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6 animate-scale-in">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <XCircle size={40} />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">Error de verificación</h2>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            El enlace ha expirado o no es válido. Por favor, intenta registrarte de nuevo o contacta con soporte.
                        </p>
                        <div className="pt-4 space-y-3">
                            <Link to="/register" className="block w-full">
                                <Button variant="secondary" className="w-full h-14">
                                    Volver a Intentar Registro
                                </Button>
                            </Link>
                            <Link to="/login" className="block text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors pt-4 font-inter">
                                Volver al Inicio de Sesión
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
