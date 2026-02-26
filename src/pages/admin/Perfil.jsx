import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Lock, Key, CheckCircle2, AlertCircle, Briefcase, FileText } from 'lucide-react';
import { getAll, update, getById } from '../../store/db';
import { useAuth } from '../../auth/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';

export default function Perfil() {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: user?.nombre || '',
        apellidos: user?.apellidos || '',
        email: user?.email || '',
        rol: user?.rol || ''
    });

    const [tecnicoData, setTecnicoData] = useState({
        especialidad: '',
        bio: ''
    });

    const [pwData, setPwData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isPwModalOpen, setIsPwModalOpen] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [mockCode, setMockCode] = useState('');
    const [pwStep, setPwStep] = useState(0); // 0: current, 1: new, 2: code

    useEffect(() => {
        if (user?.rol === 'tecnico') {
            const tecs = getAll('tecnicos');
            const tec = tecs.find(t => t.usuario_id === user.id || t.email === user.email);
            if (tec) {
                setTecnicoData({
                    especialidad: tec.especialidad || '',
                    bio: tec.bio || ''
                });
            }
        }
    }, [user]);

    const handleSaveBasic = (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!user?.id) throw new Error('Usuario no identificado');

            // Update user record
            const updatedUser = update('usuarios', user.id, {
                nombre: formData.nombre,
                apellidos: formData.apellidos
            });

            if (!updatedUser) {
                throw new Error('No se pudo encontrar el registro de usuario');
            }

            // Update technician record if applicable
            if (user.rol === 'tecnico') {
                const tecs = getAll('tecnicos');
                const tec = tecs.find(t => t.usuario_id === user.id || t.email === user.email);

                const techData = {
                    nombre: formData.nombre,
                    apellidos: formData.apellidos,
                    email: formData.email,
                    especialidad: tecnicoData.especialidad,
                    bio: tecnicoData.bio,
                    usuario_id: user.id
                };

                if (tec) {
                    update('tecnicos', tec.id, techData);
                } else {
                    create('tecnicos', techData);
                }
            }

            // Also update patient record if applicable (sync name)
            if (user.rol === 'paciente') {
                const pacs = getAll('pacientes');
                const pac = pacs.find(p => p.usuario_id === user.id || p.email === user.email);
                if (pac) {
                    update('pacientes', pac.id, {
                        nombre: formData.nombre,
                        apellidos: formData.apellidos
                    });
                }
            }

            refreshUser();
            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            console.error('Error al guardar perfil:', error);
            toast.error(error.message || 'Error al actualizar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCurrentPassword = (e) => {
        e.preventDefault();
        // Recargar usuario para tener la PW más reciente
        const dbUser = getById('usuarios', user.id);
        if (dbUser.password !== pwData.currentPassword) {
            return toast.error('La contraseña actual es incorrecta');
        }
        setPwStep(1);
    };

    const handleStartCodeVerification = (e) => {
        e.preventDefault();
        if (pwData.newPassword !== pwData.confirmPassword) {
            return toast.error('Las contraseñas no coinciden');
        }
        if (pwData.newPassword.length < 6) {
            return toast.error('La contraseña debe tener al menos 6 caracteres');
        }

        // Simular envío de código
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setMockCode(code);
        setPwStep(2);

        toast.success(`Simulación: Código enviado (${code})`, {
            duration: 8000,
            icon: '📧'
        });
    };

    const confirmPasswordReset = () => {
        if (!verificationCode) return toast.error('Introduce el código');
        if (verificationCode !== mockCode) return toast.error('Código incorrecto');

        const updated = update('usuarios', user.id, { password: pwData.newPassword });
        if (updated) {
            toast.success('Contraseña actualizada correctamente');
            setIsPwModalOpen(false);
            setPwStep(0);
            setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setVerificationCode('');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mi Perfil</h2>
                <p className="text-gray-500 mt-1 font-medium">Gestiona tu información personal y profesional</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Settings */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSaveBasic} className="card space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                <User size={20} />
                            </div>
                            <h3 className="font-bold text-gray-900">Datos Personales</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                required
                            />
                            <Input
                                label="Apellidos"
                                value={formData.apellidos}
                                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest pl-1">Email (No editable)</label>
                                <div className="flex items-center gap-3 px-4 h-12 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 text-sm italic">
                                    <Mail size={16} />
                                    {formData.email}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest pl-1">Rol de Acceso</label>
                                <div className="flex items-center gap-3 px-4 h-12 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 text-sm font-bold uppercase">
                                    <Shield size={16} />
                                    {formData.rol}
                                </div>
                            </div>
                        </div>

                        {user?.rol === 'tecnico' && (
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-3 pb-2">
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                        <Briefcase size={20} />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Ficha Profesional</h3>
                                </div>
                                <Input
                                    label="Especialidad"
                                    value={tecnicoData.especialidad}
                                    onChange={(e) => setTecnicoData({ ...tecnicoData, especialidad: e.target.value })}
                                    placeholder="Ej: Nutrición Deportiva, Nutrición Clínica..."
                                />
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest pl-1">Bio / Información adicional</label>
                                    <textarea
                                        className="input min-h-[120px] py-3 resize-none"
                                        value={tecnicoData.bio}
                                        onChange={(e) => setTecnicoData({ ...tecnicoData, bio: e.target.value })}
                                        placeholder="Cuéntanos un poco sobre tu trayectoria..."
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-50 flex justify-end">
                            <Button type="submit" loading={loading}>
                                Guardar cambios
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Sidebar Stats/Actions */}
                <div className="space-y-6">
                    <div className="card">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50 mb-6">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <Lock size={20} />
                            </div>
                            <h3 className="font-bold text-gray-900">Seguridad</h3>
                        </div>

                        <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed">
                            Mantén tu cuenta protegida cambiando tu contraseña periódicamente. Se enviará un código de verificación a tu email para confirmar el cambio.
                        </p>

                        <Button
                            variant="secondary"
                            className="w-full justify-center"
                            icon={Key}
                            onClick={() => setIsPwModalOpen(true)}
                        >
                            Cambiar contraseña
                        </Button>
                    </div>

                    <div className="card bg-gray-900 text-white border-none shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <User size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400 mb-1">Usuario Activo</p>
                            <h4 className="text-xl font-bold mb-4">{user?.nombre}</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <CheckCircle2 size={14} className="text-primary-500" />
                                    Verificado el {new Date(user?.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <FileText size={14} className="text-primary-500" />
                                    Sesión persistente activada
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isPwModalOpen}
                onClose={() => {
                    setIsPwModalOpen(false);
                    setPwStep(0);
                }}
                title="Cambiar Contraseña"
                maxWidth="max-w-md"
            >
                {pwStep === 0 && (
                    <form onSubmit={handleVerifyCurrentPassword} className="space-y-4">
                        <p className="text-sm text-gray-500 mb-2">Por seguridad, introduzca su contraseña actual:</p>
                        <Input
                            label="Contraseña Actual"
                            type="password"
                            icon={Lock}
                            value={pwData.currentPassword}
                            onChange={(e) => setPwData({ ...pwData, currentPassword: e.target.value })}
                            required
                        />
                        <div className="pt-4 flex flex-col gap-2">
                            <Button type="submit" className="w-full justify-center">Siguiente</Button>
                            <Button variant="ghost" onClick={() => setIsPwModalOpen(false)} className="w-full justify-center">Cancelar</Button>
                        </div>
                    </form>
                )}

                {pwStep === 1 && (
                    <form onSubmit={handleStartCodeVerification} className="space-y-4">
                        <Input
                            label="Nueva Contraseña"
                            type="password"
                            icon={Lock}
                            value={pwData.newPassword}
                            onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })}
                            required
                        />
                        <Input
                            label="Confirmar Nueva Contraseña"
                            type="password"
                            icon={Lock}
                            value={pwData.confirmPassword}
                            onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })}
                            required
                        />
                        <div className="pt-4 flex flex-col gap-2">
                            <Button type="submit" className="w-full justify-center">Continuar</Button>
                            <Button variant="ghost" onClick={() => setPwStep(0)} className="w-full justify-center">Atrás</Button>
                        </div>
                    </form>
                )}

                {pwStep === 2 && (
                    <div className="space-y-6">
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                            <AlertCircle className="text-amber-600 mt-0.5" size={18} />
                            <p className="text-sm text-amber-800 font-medium">
                                Hemos enviado un código de 6 dígitos a su correo electrónico. Por favor, introdúzcalo para confirmar.
                            </p>
                        </div>
                        <Input
                            label="Código de Verificación"
                            placeholder="Ej: 123456"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="text-center tracking-[0.5em] text-lg font-bold"
                            maxLength={6}
                        />
                        <div className="flex flex-col gap-2">
                            <Button onClick={confirmPasswordReset} className="w-full justify-center">Validar y Cambiar</Button>
                            <Button variant="ghost" onClick={() => setPwStep(1)} className="w-full justify-center">Atrás</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
