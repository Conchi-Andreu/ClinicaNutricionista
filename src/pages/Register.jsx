import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, UserPlus, Calendar, ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Register() {
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        email: '',
        password: '',
        confirmPassword: '',
        telefono: '',
    });
    const [loading, setLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validatePassword = (pass) => {
        const hasUpper = /[A-Z]/.test(pass);
        const hasNumber = /[0-9]/.test(pass);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>_-]/.test(pass);
        return pass.length >= 8 && hasUpper && hasNumber && hasSpecial;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden.');
            return;
        }

        if (!validatePassword(formData.password)) {
            toast.error('La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo.');
            return;
        }

        setLoading(true);

        // Simulate network delay
        await new Promise(r => setTimeout(r, 1200));

        // Borramos confirmPassword antes de enviar a la DB
        const { confirmPassword, ...dataToSubmit } = formData;

        const res = register(dataToSubmit);
        if (res.success) {
            setIsRegistered(true);
            toast.success('¡Registro enviado! Revisa tu email.');
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    if (isRegistered) {
        return (
            <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-[500px] animate-fade-in my-8 text-center bg-white rounded-[2.5rem] shadow-modal p-12">
                    <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Mail size={40} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4">¡Casi listo!</h2>
                    <p className="text-gray-500 font-medium leading-relaxed mb-8">
                        Hemos enviado un enlace de confirmación a <span className="text-primary-600 font-bold">{formData.email}</span>.
                        Por favor, haz clic en el enlace para activar tu cuenta.
                    </p>
                    <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100 text-left mb-8">
                        <p className="text-sm text-primary-900 mb-4">
                            Busca en tu bandeja de entrada un correo nuestro con el enlace de activación. 
                            Si no lo encuentras en unos minutos, revisa tu carpeta de Spam.
                        </p>
                    </div>
                    <Link to="/login" className="block w-full">
                        <Button variant="secondary" className="w-full">
                            Ir al Inicio de Sesión
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[500px] animate-fade-in my-8">
                <div className="bg-white rounded-[2.5rem] shadow-modal overflow-hidden p-8 md:p-12">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-14 h-14 bg-primary-600 rounded-[1.125rem] flex items-center justify-center text-white shadow-xl mb-4">
                            <Calendar size={28} />
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Crea tu cuenta</h1>
                        <p className="text-gray-500 mt-2 font-medium">Empieza tu camino hacia una mejor salud</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Nombre"
                                name="nombre"
                                placeholder="Ej: Ana"
                                icon={User}
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Apellidos"
                                name="apellidos"
                                placeholder="Ej: Pérez"
                                value={formData.apellidos}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            placeholder="tu@email.com"
                            icon={Mail}
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            label="Teléfono"
                            type="tel"
                            name="telefono"
                            placeholder="600 000 000"
                            icon={Phone}
                            value={formData.telefono}
                            onChange={handleChange}
                            required
                        />

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    label="Contraseña"
                                    type="password"
                                    name="password"
                                    placeholder="8+ caracteres, Mayus, Núm, Sím"
                                    icon={Lock}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <p className="px-1 text-[10px] text-gray-400 font-medium"> Debe incluir mayúscula, número y símbolo.</p>
                            </div>

                            <Input
                                label="Confirmar Contraseña"
                                type="password"
                                name="confirmPassword"
                                placeholder="Repite tu contraseña"
                                icon={Lock}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full h-14 text-sm font-bold uppercase tracking-wider"
                                loading={loading}
                                icon={UserPlus}
                            >
                                Registrarme Ahora
                            </Button>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                        Al registrarte aceptas nuestros <Link to="#" className="underline text-gray-500">Términos</Link> y <Link to="#" className="underline text-gray-500">Privacidad</Link>.
                    </p>
                </div>

                <Link to="/login" className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-primary-600 transition-colors">
                    <ArrowLeft size={16} /> Volver al Inicio de Sesión
                </Link>
            </div>
        </div>
    );
}
