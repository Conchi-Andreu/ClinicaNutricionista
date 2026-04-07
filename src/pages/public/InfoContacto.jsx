import React, { useState } from 'react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { toast } from 'react-hot-toast';

export default function InfoContacto() {
    const { user } = useAuth();
    const { config } = useSiteConfig();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [formData, setFormData] = useState({
        asunto: '',
        mensaje: '',
        email: user?.email || ''
    });

    if (!config) return <div className="p-8 text-center text-gray-500 font-medium">Cargando información...</div>;

    const fontStyle = {
        fontFamily: config.contactoFont === 'System' ? 'inherit' : config.contactoFont,
        lineHeight: config.contactoHeight
    };

    const handleSend = (e) => {
        e.preventDefault();
        setSending(true);

        // Simulación de envío de email
        setTimeout(() => {
            console.log('--- SIMULACIÓN DE ENVÍO DE EMAIL ---');
            console.log(`De: ${formData.email}`);
            console.log(`Para: ${config.contactoEmail}`);
            console.log(`Asunto: ${formData.asunto}`);
            console.log(`Mensaje: ${formData.mensaje}`);
            console.log('------------------------------------');

            setSending(false);
            setIsModalOpen(false);
            setFormData({ ...formData, asunto: '', mensaje: '' });
            toast.success('Mensaje enviado correctamente. Te responderemos pronto.');
        }, 1500);
    };

    return (
        <div className="max-w-4xl mx-auto py-12 animate-fade-in">
            <div className="text-center mb-16">
                <h2
                    className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4"
                    style={{ fontFamily: config.tituloFont === 'System' ? 'inherit' : config.tituloFont }}
                >
                    Contacto
                </h2>
                <p className="text-gray-500 text-lg font-medium">Estamos aquí para resolver tus dudas y acompañarte en tu proceso.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="card p-8 flex flex-col items-center text-center group hover:scale-105 transition-all">
                    <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                        <Phone size={28} />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Llámanos</h4>
                    <p className="text-sm text-gray-500 font-medium">Atención telefónica de Lunes a Viernes de 9:00 a 20:00.</p>
                </div>
                {user ? (
                    <div
                        onClick={() => setIsModalOpen(true)}
                        className="card p-8 flex flex-col items-center text-center group hover:scale-105 transition-all cursor-pointer border-primary-100 bg-primary-50/20 shadow-lg shadow-primary-50"
                    >
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Mail size={28} />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Mensaje Directo</h4>
                        <span className="text-sm text-primary-600 font-bold hover:underline mb-2">{config.contactoEmail}</span>
                        <p className="text-sm text-gray-500 font-medium">Escríbenos desde el portal.</p>
                        <div className="mt-4 px-3 py-1 bg-primary-100 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                            Portal del Paciente
                        </div>
                    </div>
                ) : (
                    <a
                        href={`mailto:${config.contactoEmail}`}
                        className="card p-8 flex flex-col items-center text-center group hover:scale-105 transition-all"
                    >
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Mail size={28} />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Escríbenos</h4>
                        <span className="text-sm text-primary-600 font-bold hover:underline mb-2">{config.contactoEmail}</span>
                        <p className="text-sm text-gray-500 font-medium">Envíanos un correo electrónico.</p>
                    </a>
                )}
                <div className="card p-8 flex flex-col items-center text-center group hover:scale-105 transition-all">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <MapPin size={28} />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Visítanos</h4>
                    <p className="text-sm text-gray-500 font-medium">Consulta nuestra red de centros para encontrar el más cercano.</p>
                </div>
            </div>

            <div className="card shadow-2xl border-none p-10 md:p-16 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary-600"></div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                    <Phone className="text-primary-600" /> Información Adicional
                </h3>
                <div
                    className="text-gray-600 text-xl whitespace-pre-wrap"
                    style={fontStyle}
                >
                    {config.contactoTexto}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Enviar mensaje a la clínica"
            >
                <form onSubmit={handleSend} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Tu Email</label>
                        <Input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="tu@email.com"
                            readOnly={!!user}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Asunto</label>
                        <Input
                            required
                            valid={formData.asunto.length > 3}
                            value={formData.asunto}
                            onChange={e => setFormData({ ...formData, asunto: e.target.value })}
                            placeholder="¿En qué podemos ayudarte?"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Mensaje</label>
                        <textarea
                            required
                            className="input min-h-[150px] w-full p-4 text-sm resize-none"
                            value={formData.mensaje}
                            onChange={e => setFormData({ ...formData, mensaje: e.target.value })}
                            placeholder="Escribe aquí tu consulta detallada..."
                        />
                    </div>
                    <div className="pt-4 flex flex-col gap-3">
                        <Button
                            type="submit"
                            loading={sending}
                            icon={Send}
                            className="w-full h-12 shadow-lg shadow-primary-100"
                        >
                            {sending ? 'Enviando...' : 'Enviar Mensaje'}
                        </Button>
                        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                            Al enviar este mensaje, aceptas nuestra <Link to="/paciente/legal/privacidad" className="underline">Política de Privacidad</Link>.
                            Tu consulta será recibida por {config.contactoEmail}.
                        </p>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
