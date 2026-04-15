import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    MapPin,
    User,
    Clock,
    ChevronRight,
    CheckCircle2,
    XSquare,
    AlertCircle,
    History,
    Info
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { toast } from 'react-hot-toast';
import { format, parseISO, isAfter, subHours } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MisCitas() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [paciente, setPaciente] = useState(null);
    const [citasList, setCitasList] = useState([]);
    const [technicalData, setTechnicalData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Find patient
            const { data: pacData } = await supabase.from('pacientes').select('*').eq('usuario_id', user?.id).single();
            setPaciente(pacData);
            
            const pacId = pacData?.id || user?.id;

            // Load citas for this patient
            const { data: userCitas } = await supabase
                .from('citas')
                .select('*')
                .eq('paciente_id', pacId);
                
            const items = userCitas || [];
            setCitasList(items);

            // Load additional ref data
            const [tecRes, cenRes, tiposRes] = await Promise.all([
                supabase.from('tecnicos').select('*'),
                supabase.from('centros_salas').select('*'),
                supabase.from('tipos_visita').select('*')
            ]);

            const tecnicos = tecRes.data || [];
            const centros = cenRes.data || [];
            const tipos = tiposRes.data || [];

            const tData = items.map(cita => ({
                ...cita,
                tecnico: tecnicos.find(t => t.id === cita.tecnico_id),
                centro: centros.find(c => c.id === cita.centro_id),
                tipo: tipos.find(t => t.id === cita.tipo_visita_id)
            })).sort((a, b) => a.fecha_hora_inicio.localeCompare(b.fecha_hora_inicio));

            setTechnicalData(tData);
        } catch (error) {
            console.error('Error loading mis citas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        if (user) loadData();
    }, [user]);

    const proximasCitas = technicalData.filter(c => c.estado === 'confirmada');
    const historialCitas = technicalData.filter(c => c.estado !== 'confirmada');

    const handleCancelarCita = async (cita) => {
        const fechaCita = parseISO(cita.fecha_hora_inicio);
        const limiteCancelacion = subHours(fechaCita, 24);

        if (!isAfter(new Date(), limiteCancelacion)) {
            if (window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
                // Update appointment status
                await supabase.from('citas').update({ estado: 'cancelada' }).eq('id', cita.id);

                // Return slots to 'libre' status
                if (cita.slot_id) {
                    await supabase.from('disponibilidad_slots').update({ estado: 'libre' }).eq('id', cita.slot_id);
                }

                toast.success('Cita cancelada correctamente');
                loadData();
            }
        } else {
            toast.error('No se puede cancelar una cita con menos de 24h de antelación. Por favor, contacta con la clínica.');
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mis Citas</h2>
                <p className="text-gray-500 mt-1 font-medium">Gestiona tus próximas visitas y revisa tu historial</p>
            </div>

            {/* Próximas Citas */}
            <section className="space-y-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center">
                        <Calendar size={18} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Próximas Visitas</h3>
                </div>

                {proximasCitas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {proximasCitas.map(cita => (
                            <div key={cita.id} className="card border border-primary-50 hover:shadow-xl transition-all relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-primary-600/10 transition-colors" />

                                <div className="flex justify-between items-start mb-6">
                                    <Badge variant="primary">Confirmada</Badge>
                                    <div className="flex flex-col items-end">
                                        <p className="text-sm font-bold text-primary-700">
                                            {format(parseISO(cita.fecha_hora_inicio), 'EEEE, d MMMM', { locale: es })}
                                        </p>
                                        <p className="text-xs text-gray-400 font-medium tracking-wide">
                                            {format(parseISO(cita.fecha_hora_inicio), 'HH:mm')} — {format(parseISO(cita.fecha_hora_fin), 'HH:mm')}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
                                            style={{ backgroundColor: cita.tipo?.color_hex }}
                                        >
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 leading-tight">{cita.tipo?.nombre}</h4>
                                            <p className="text-xs text-gray-500 font-medium">{cita.tipo?.duracion_minutos} minutos</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Profesional</p>
                                                <p className="text-sm font-bold text-gray-700 mt-1">{cita.tecnico?.nombre}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                <MapPin size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Ubicación</p>
                                                <p className="text-sm font-bold text-gray-700 mt-1">{cita.centro?.nombre}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {cita.notas && (
                                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex gap-3">
                                            <Info size={18} className="text-amber-600 flex-shrink-0" />
                                            <p className="text-xs text-amber-800 italic leading-relaxed">"{cita.notas}"</p>
                                        </div>
                                    )}

                                    <div className="pt-4 flex gap-3">
                                        <Button
                                            variant="danger"
                                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border-0"
                                            onClick={() => handleCancelarCita(cita)}
                                        >
                                            Cancelar cita
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => {
                                                const fechaCita = parseISO(cita.fecha_hora_inicio);
                                                const limiteCancelacion = subHours(fechaCita, 24);
                                                if (isAfter(new Date(), limiteCancelacion)) {
                                                    toast.error('No se puede cambiar la fecha con menos de 24h de antelación.');
                                                    return;
                                                }
                                                navigate('/paciente', { state: { rescheduleCitaId: cita.id } });
                                            }}
                                        >
                                            Cambiar fecha
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card bg-white/50 border-2 border-dashed border-gray-200 shadow-none py-16 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4">
                            <Calendar size={32} />
                        </div>
                        <h4 className="text-gray-500 font-bold">No tienes próximas citas</h4>
                        <p className="text-gray-400 text-sm mt-1 mb-8">¿Necesitas una revisión? Reserva un nuevo hueco ahora.</p>
                        <Button onClick={() => navigate('/paciente')}>Reservar Cita Ahora</Button>
                    </div>
                )}
            </section>

            {/* Historial */}
            <section className="space-y-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center">
                        <History size={18} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Historial de Visitas</h3>
                </div>

                <div className="card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="table-header">Fecha</th>
                                    <th className="table-header">Servicio</th>
                                    <th className="table-header">Profesional</th>
                                    <th className="table-header text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {historialCitas.length > 0 ? historialCitas.map(cita => (
                                    <tr key={cita.id} className="hover:bg-gray-50/20 transition-colors">
                                        <td className="table-cell">
                                            <p className="font-bold text-gray-900">{format(parseISO(cita.fecha_hora_inicio), 'dd/MM/yyyy')}</p>
                                            <p className="text-xs text-gray-400">{format(parseISO(cita.fecha_hora_inicio), 'HH:mm')}</p>
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cita.tipo?.color_hex }} />
                                                <span className="font-medium">{cita.tipo?.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="table-cell text-gray-500 text-sm font-medium">
                                            {cita.tecnico?.nombre}
                                        </td>
                                        <td className="table-cell text-right">
                                            {cita.estado === 'asistida' ? (
                                                <Badge variant="success">Asistida</Badge>
                                            ) : (
                                                <Badge variant="danger">Cancelada</Badge>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-gray-400 italic font-medium">No hay registros previos</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
