import React, { useMemo } from 'react';
import {
    Users,
    MapPin,
    Calendar as CalendarIcon,
    ClipboardCheck,
    TrendingUp,
    ArrowUpRight,
    Plus,
    Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthContext';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';

import { toast } from 'react-hot-toast';
import { History, FileEdit } from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext';

export default function Dashboard() {
    const { user } = useAuth();
    const { config: siteConfig } = useSiteConfig();
    const [isNotesModalOpen, setIsNotesModalOpen] = React.useState(false);
    const [selectedCita, setSelectedCita] = React.useState(null);
    const [visitNotes, setVisitNotes] = React.useState('');

    const [allCitas, setAllCitas] = React.useState([]);

    const [tecnicosList, setTecnicosList] = React.useState([]);
    const [centrosList, setCentrosList] = React.useState([]);
    const [pacientesList, setPacientesList] = React.useState([]);
    const [slotsList, setSlotsList] = React.useState([]);
    const [tiposList, setTiposList] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        const [citasRes, tecRes, cenRes, pacRes, slotsRes, tiposRes] = await Promise.all([
            supabase.from('citas').select('*'),
            supabase.from('tecnicos').select('*'),
            supabase.from('centros_salas').select('*'),
            supabase.from('pacientes').select('*'),
            supabase.from('disponibilidad_slots').select('tecnico_id,estado'),
            supabase.from('tipos_visita').select('*')
        ]);
        
        setAllCitas(citasRes.data || []);
        setTecnicosList(tecRes.data || []);
        setCentrosList(cenRes.data || []);
        setPacientesList(pacRes.data || []);
        setSlotsList(slotsRes.data || []);
        setTiposList(tiposRes.data || []);
        setIsLoading(false);
    };

    const currentTecnicoId = useMemo(() => {
        if (user?.rol !== 'tecnico') return null;
        const tec = tecnicosList.find(t => t.usuario_id === user.id || t.email === user.email);
        return tec?.id;
    }, [user, tecnicosList]);

    const stats = useMemo(() => {
        const hoy = new Date().toISOString().split('T')[0];

        // Filter by technician if needed
        const filteredCitas = currentTecnicoId
            ? (allCitas || []).filter(c => c.tecnico_id === currentTecnicoId)
            : (allCitas || []);

        const filteredSlots = currentTecnicoId
            ? (slotsList || []).filter(s => s.tecnico_id === currentTecnicoId)
            : (slotsList || []);

        const citasHoy = filteredCitas.filter(c => c?.fecha_hora_inicio?.startsWith(hoy)).length;
        const slotsLibresSemana = filteredSlots.filter(s => s?.estado === 'libre').length;

        if (user?.rol === 'tecnico') {
            return [
                { label: 'Tus Citas Hoy', value: citasHoy, icon: CalendarIcon, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
                { label: 'Tus Huecos Libres', value: slotsLibresSemana, icon: ClipboardCheck, color: 'text-primary-600', bg: 'bg-primary-50', trend: 'Estable' },
                { label: 'Total Tus Citas', value: filteredCitas.length, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+5' },
            ];
        }

        return [
            { label: 'Citas Hoy', value: citasHoy, icon: CalendarIcon, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
            { label: 'Técnicos Activos', value: tecnicosList.length, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50', trend: 'Estable' },
            { label: 'Centros / Salas', value: centrosList.filter(c => c.activo).length, icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Sin cambios' },
            { label: 'Total Pacientes', value: pacientesList.length, icon: ClipboardCheck, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+5' },
        ];
    }, [currentTecnicoId, user, allCitas, tecnicosList, centrosList, pacientesList, slotsList]);

    const proximasCitas = useMemo(() => {
        let filtered = (allCitas || []);
        if (currentTecnicoId) {
            filtered = filtered.filter(c => c.tecnico_id === currentTecnicoId);
        }

        filtered = filtered.sort((a,b) => b.fecha_hora_inicio.localeCompare(a.fecha_hora_inicio));

        return filtered.slice(0, 5).map(cita => ({
            ...cita,
            paciente: (pacientesList || []).find(p => p.id === cita?.paciente_id || p.usuario_id === cita?.paciente_id),
            tipo: (tiposList || []).find(t => t.id === cita?.tipo_visita_id)
        }));
    }, [currentTecnicoId, allCitas, pacientesList, tiposList]);

    const patientHistory = useMemo(() => {
        if (!selectedCita?.paciente_id) return [];
        return allCitas
            .filter(c =>
                (String(c.paciente_id) === String(selectedCita.paciente_id)) &&
                c.notas_visita &&
                c.id !== selectedCita.id
            )
            .sort((a, b) => a.fecha_hora_inicio.localeCompare(b.fecha_hora_inicio));
    }, [selectedCita, allCitas]);

    const handleOpenNotes = (cita) => {
        setSelectedCita(cita);
        setVisitNotes(cita.notas_visita || '');
        setIsNotesModalOpen(true);
    };

    const handleSaveNotes = async () => {
        const { error } = await supabase.from('citas').update({ notas_visita: visitNotes }).eq('id', selectedCita.id);
        if (error) { toast.error(error.message); return; }
        setIsNotesModalOpen(false);
        toast.success('Datos de la visita guardados correctamente');
        fetchDashboardData();
    };

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex flex-col gap-4">
                        {/* Branding: anagrama + título + subtítulo */}
                        <div className="flex items-center gap-3">
                            {siteConfig.logo ? (
                                <img
                                    src={siteConfig.logo}
                                    style={{ width: `${Math.min(siteConfig.logoWidth, 48)}px` }}
                                    className="h-auto object-contain"
                                    alt="Logo"
                                />
                            ) : (
                                <div className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-md overflow-hidden">
                                    <CalendarIcon size={22} />
                                </div>
                            )}
                            <div>
                                <p
                                    className="font-bold text-gray-900 leading-tight"
                                    style={{
                                        fontFamily: siteConfig.tituloFont === 'System' ? 'inherit' : siteConfig.tituloFont,
                                        fontSize: `${siteConfig.tituloSize || 18}px`
                                    }}
                                >
                                    {siteConfig.titulo || 'Clínica'}
                                </p>
                                <p
                                    className="text-primary-600 font-bold uppercase tracking-wider"
                                    style={{
                                        fontFamily: siteConfig.subtituloFont === 'System' ? 'inherit' : siteConfig.subtituloFont,
                                        fontSize: `${siteConfig.subtituloSize || 11}px`
                                    }}
                                >
                                    {siteConfig.subtitulo || 'Nutricionista'}
                                </p>
                            </div>
                        </div>
                        {/* Dashboard title + description */}
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                {user?.rol === 'tecnico' ? 'Mi Panel' : 'Dashboard General'}
                            </h2>
                            <p className="text-gray-500 mt-1 font-medium">
                                {user?.rol === 'tecnico' ? 'Resumen de tu actividad y próximas citas' : 'Resumen del estado actual de la clínica'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action buttons - Now in its own line */}
                <div className="flex gap-3">
                    <Link to="/admin/planificacion">
                        <Button variant="secondary" icon={Plus}>Nueva Planificación</Button>
                    </Link>
                    <Link to="/admin/agenda">
                        <Button icon={CalendarIcon}>Ver Agenda</Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="card group hover:scale-[1.02] transition-transform duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-sm`}>
                                <stat.icon size={24} />
                            </div>
                            <div className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
                                <TrendingUp size={12} />
                                {stat.trend}
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity / Appointments */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-900">Últimas Citas Registradas</h3>
                        <Link to="/admin/citas" className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                            Ver todas <ArrowUpRight size={16} />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="table-header">Paciente</th>
                                    <th className="table-header">Servicio</th>
                                    <th className="table-header">Fecha / Hora</th>
                                    <th className="table-header text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {proximasCitas.length > 0 ? proximasCitas.map((cita) => (
                                    <tr key={cita.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="table-cell">
                                            <button
                                                onClick={() => handleOpenNotes(cita)}
                                                className="font-bold text-gray-900 hover:text-primary-600 transition-colors text-left"
                                            >
                                                {cita.paciente?.nombre} {cita.paciente?.apellidos}
                                            </button>
                                        </td>
                                        <td className="table-cell">
                                            <span
                                                className="px-2 py-1 rounded-lg text-xs font-bold border"
                                                style={{ background: `${cita.tipo?.color_hex}15`, color: cita.tipo?.color_hex, borderColor: `${cita.tipo?.color_hex}30` }}
                                            >
                                                {cita.tipo?.nombre}
                                            </span>
                                        </td>
                                        <td className="table-cell text-gray-500 font-medium">
                                            {cita?.fecha_hora_inicio?.replace('T', ' ') || ''}
                                        </td>
                                        <td className="table-cell text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                {cita.estado === 'confirmada' && <Badge variant="primary">Confirmada</Badge>}
                                                {cita.estado === 'asistida' && <Badge variant="success">Asistida</Badge>}
                                                {cita.estado === 'cancelada' && <Badge variant="danger">Cancelada</Badge>}
                                                <Badge variant={cita.pagado ? 'success' : 'warning'} className="text-[9px] py-0 px-1.5 h-auto">
                                                    {cita.pagado ? 'Pagada' : 'Pendiente Pago'}
                                                </Badge>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-gray-400 font-medium italic">No hay citas registradas recientemente</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Links / Tips */}
                <div className="space-y-6">
                    <div className="card bg-primary-600 text-white shadow-xl shadow-primary-200">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                            <Plus className="text-white" size={24} />
                        </div>
                        <h4 className="text-xl font-bold mb-2">Planificación Rápida</h4>
                        <p className="text-primary-50 text-sm mb-6 leading-relaxed">
                            Genera huecos de disponibilidad masivos para tus técnicos de forma sencilla.
                        </p>
                        <Link to="/admin/planificacion">
                            <Button className="w-full bg-white text-primary-700 hover:bg-primary-50 border-0 h-12 shadow-md">
                                Ir al generador
                            </Button>
                        </Link>
                    </div>

                    <div className="card border-2 border-dashed border-gray-200 bg-transparent shadow-none flex flex-col items-center justify-center py-10 text-center">
                        <div className="p-4 bg-gray-100 rounded-full mb-4 text-gray-400">
                            <Settings size={22} />
                        </div>
                        <h5 className="font-bold text-gray-900">Ajustes del Sistema</h5>
                        <p className="text-xs text-gray-500 mt-1 max-w-[180px]">Configura los horarios base de tus centros y clínicas.</p>
                    </div>
                </div>
            </div>

            {/* Modal de Notas de Visita / Historial Clínico */}
            <Modal
                isOpen={isNotesModalOpen}
                onClose={() => setIsNotesModalOpen(false)}
                title="Información de la Visita e Historial"
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsNotesModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveNotes}>Guardar Datos</Button>
                    </>
                }
            >
                {selectedCita && (
                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Paciente</p>
                                <p className="font-bold text-gray-900">{selectedCita.paciente?.nombre} {selectedCita.paciente?.apellidos}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Cita Seleccionada</p>
                                <p className="text-xs font-bold text-primary-600">{selectedCita.fecha_hora_inicio?.split('T')[0]}</p>
                            </div>
                        </div>

                        {/* Historial en el editor */}
                        {patientHistory.length > 0 && (
                            <div className="space-y-4">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <History size={14} className="text-primary-500" /> Historial Clínico
                                </h5>
                                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {patientHistory.map((prev, idx) => (
                                        <div key={prev.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase">Visita #{idx + 1}</span>
                                                <span className="text-[10px] font-bold text-gray-500">{prev.fecha_hora_inicio.split('T')[0]}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap italic">
                                                "{prev.notas_visita}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-b border-dashed border-gray-200"></div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="label flex items-center gap-2">
                                <FileEdit size={16} className="text-primary-600" />
                                Datos de esta Visita
                            </label>
                            <textarea
                                className="input min-h-[200px] resize-none py-4 text-sm leading-relaxed"
                                placeholder="Escribe aquí los detalles de la consulta..."
                                value={visitNotes}
                                onChange={(e) => setVisitNotes(e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
