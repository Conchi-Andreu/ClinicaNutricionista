import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Search,
    Download,
    Filter,
    Calendar,
    Users,
    MapPin,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Eye,
    Clock,
    X,
    CreditCard,
    FileEdit,
    DollarSign
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { User, FileText, Phone, Mail as MailIcon, CreditCard as CardIcon, StickyNote, History } from 'lucide-react';

export default function Citas() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCita, setSelectedCita] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [visitNotes, setVisitNotes] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [citasList, setCitasList] = useState([]);
    const [pacientesList, setPacientesList] = useState([]);
    const [tecnicosList, setTecnicosList] = useState([]);
    const [centrosList, setCentrosList] = useState([]);
    const [tiposList, setTiposList] = useState([]);

    // Initial Defaults
    const today = new Date().toISOString().split('T')[0];

    const [filterEstado, setFilterEstado] = useState('confirmada');
    const [filterFecha, setFilterFecha] = useState(today);
    const [filterCentro, setFilterCentro] = useState('');
    const [filterTecnico, setFilterTecnico] = useState('');

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        setIsLoading(true);
        const [citasRes, pacRes, tecRes, cenRes, tiposRes] = await Promise.all([
            supabase.from('citas').select('*'),
            supabase.from('pacientes').select('*'),
            supabase.from('tecnicos').select('*'),
            supabase.from('centros_salas').select('*'),
            supabase.from('tipos_visita').select('*')
        ]);
        
        setCitasList(citasRes.data || []);
        setPacientesList(pacRes.data || []);
        
        const loadedTecnicos = tecRes.data || [];
        setTecnicosList(loadedTecnicos);
        
        setCentrosList(cenRes.data || []);
        setTiposList(tiposRes.data || []);
        
        // Auto-assign tech filter if it's a technical user
        if (user?.rol === 'tecnico') {
             const found = loadedTecnicos.find(t => t.usuario_id === user.id || t.email === user.email);
             if (found) setFilterTecnico(found.id);
        }
        
        setIsLoading(false);
    };

    const pacienteIdFilter = searchParams.get('pacienteId');
    const filteredPaciente = useMemo(() => {
        if (!pacienteIdFilter) return null;
        return pacientesList.find(p => p.id === pacienteIdFilter || p.usuario_id === pacienteIdFilter);
    }, [pacienteIdFilter, pacientesList]);

    const data = useMemo(() => {
        return (citasList || []).map(cita => ({
            ...cita,
            paciente: (pacientesList || []).find(p => p.id === cita?.paciente_id || p.usuario_id === cita?.paciente_id),
            tecnico: (tecnicosList || []).find(t => t.id === cita?.tecnico_id),
            centro: (centrosList || []).find(c => c.id === cita?.centro_id),
            tipo: (tiposList || []).find(t => t.id === cita?.tipo_visita_id)
        })).filter(cita => {
            const nameMatch = `${cita.paciente?.nombre || ''} ${cita.paciente?.apellidos || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
            const estadoMatch = !filterEstado || cita.estado === filterEstado;
            const patientIdMatch = !pacienteIdFilter || cita.paciente_id === pacienteIdFilter || cita.paciente?.usuario_id === pacienteIdFilter;

            const tecnicoMatch = !filterTecnico || cita.tecnico_id === filterTecnico;
            const centroMatch = !filterCentro || cita.centro_id === filterCentro;
            const fechaMatch = !filterFecha || (cita.fecha_hora_inicio && cita.fecha_hora_inicio.startsWith(filterFecha));

            return nameMatch && estadoMatch && patientIdMatch && tecnicoMatch && centroMatch && fechaMatch;
        }).sort((a, b) => (a?.fecha_hora_inicio || '').localeCompare(b?.fecha_hora_inicio || ''));
    }, [citasList, pacientesList, tecnicosList, centrosList, tiposList, searchTerm, filterEstado, filterFecha, filterCentro, filterTecnico, pacienteIdFilter, user]);

    const handleUpdateEstado = async (id, nuevoEstado) => {
        const { error } = await supabase.from('citas').update({ estado: nuevoEstado }).eq('id', id);
        if (error) { toast.error(error.message); return; }
        toast.success(`Cita marcada como ${nuevoEstado}`);
        fetchData();
    };

    const handleTogglePago = async (cita) => {
        const nuevoEstadoPago = !cita.pagado;
        const { error } = await supabase.from('citas').update({ pagado: nuevoEstadoPago }).eq('id', cita.id);
        if (error) { toast.error(error.message); return; }
        toast.success(nuevoEstadoPago ? 'Cita marcada como PAGADA' : 'Cita marcada como PENDIENTE DE PAGO');
        fetchData();
    };

    const handleOpenNotes = (cita) => {
        setSelectedCita(cita);
        setVisitNotes(cita.notas_visita || '');
        setIsNotesModalOpen(true);
    };

    const patientHistory = useMemo(() => {
        if (!selectedCita?.paciente_id) return [];
        return citasList
            .filter(c =>
                (c.paciente_id === selectedCita.paciente_id) &&
                c.notas_visita &&
                c.id !== selectedCita.id
            )
            .sort((a, b) => a.fecha_hora_inicio.localeCompare(b.fecha_hora_inicio));
    }, [selectedCita, citasList]);

    const handleSaveNotes = async () => {
        const { error } = await supabase.from('citas').update({ notas_visita: visitNotes }).eq('id', selectedCita.id);
        if (error) { toast.error(error.message); return; }
        setSelectedCita(prev => ({ ...prev, notas_visita: visitNotes }));
        toast.success('Datos de la visita guardados correctamente');
        setIsNotesModalOpen(false);
        fetchData();
    };

    const handleViewDetails = (cita) => {
        setSelectedCita(cita);
        setIsModalOpen(true);
    };

    const exportToExcel = () => {
        const exportData = data.map(c => ({
            Fecha: c?.fecha_hora_inicio?.split('T')[0] || '',
            Hora: c?.fecha_hora_inicio?.split('T')[1]?.slice(0, 5) || '',
            Paciente: `${c.paciente?.nombre || ''} ${c.paciente?.apellidos || ''}`,
            Técnico: `${c.tecnico?.nombre || ''} ${c.tecnico?.apellidos || ''}`,
            Centro: c.centro?.nombre || '',
            Servicio: c.tipo?.nombre || '',
            Duración: `${c.tipo?.duracion_minutos || 0} min`,
            Estado: (c.estado || '').toUpperCase(),
            Notas: c.notas || ''
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Citas");
        XLSX.writeFile(wb, `Listado_Citas_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Excel generado correctamente');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {user?.rol === 'tecnico' ? 'Mis Citas' : 'Gestión de Citas'}
                    </h2>
                    <p className="text-gray-500 mt-1 font-medium">
                        {user?.rol === 'tecnico' ? 'Tus próximas visitas y control de pacientes' : 'Historial completo y control de asistencia de pacientes'}
                    </p>
                </div>
                <Button onClick={exportToExcel} variant="secondary" icon={Download}>Exportar Excel</Button>
            </div>

            {filteredPaciente && (
                <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary-600 shadow-sm font-bold text-lg">
                            {filteredPaciente.nombre.charAt(0)}
                        </div>
                        <div>
                            <p className="text-xs text-primary-600 font-bold uppercase tracking-wider mb-0.5">Filtrando por paciente</p>
                            <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
                                {filteredPaciente.nombre} {filteredPaciente.apellidos}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={() => setSearchParams({})}
                        className="p-2 hover:bg-white rounded-lg text-primary-600 transition-colors flex items-center gap-2 font-bold text-xs"
                    >
                        <X size={16} /> Quitar filtro
                    </button>
                </div>
            )}

            <div className="card">
                {/* Advanced Filters */}
                <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4 italic">
                            <Input
                                placeholder="Paciente por nombre..."
                                icon={Search}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                                <input
                                    type="date"
                                    className="input pl-10 h-11 text-xs font-bold w-full"
                                    value={filterFecha}
                                    onChange={(e) => setFilterFecha(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <select
                                    className="input pl-10 h-11 text-xs font-bold w-full appearance-none"
                                    value={filterEstado}
                                    onChange={(e) => setFilterEstado(e.target.value)}
                                >
                                    <option value="">Cualquier estado</option>
                                    <option value="confirmada">Confirmada</option>
                                    <option value="asistida">Asistida</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <select
                                    className="input pl-10 h-11 text-xs font-bold w-full appearance-none"
                                    value={filterCentro}
                                    onChange={(e) => setFilterCentro(e.target.value)}
                                >
                                    <option value="">Cualquier Centro</option>
                                    {centrosList.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            {user?.rol === 'admin' ? (
                                <div className="relative">
                                    <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <select
                                        className="input pl-10 h-11 text-xs font-bold w-full appearance-none"
                                        value={filterTecnico}
                                        onChange={(e) => setFilterTecnico(e.target.value)}
                                    >
                                        <option value="">Cualquier Profesional</option>
                                        {tecnicosList.map(t => (
                                            <option key={t.id} value={t.id}>{t.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="h-11 flex items-center px-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-500 italic">
                                    Mi Agenda Personal
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterEstado('confirmada');
                                setFilterFecha(today);
                                setFilterCentro('');
                                if (user?.rol === 'admin') setFilterTecnico('');
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary-600 flex items-center gap-1.5 transition-colors"
                        >
                            <X size={14} /> Limpiar Filtros
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="table-header">Paciente</th>
                                <th className="table-header">Servicio / Centro</th>
                                <th className="table-header">Fecha y Hora</th>
                                <th className="table-header">Atendido por</th>
                                <th className="table-header">Estado Pago</th>
                                <th className="table-header">Estado Cita</th>
                                <th className="table-header text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan="7" className="py-12 text-center text-gray-500">Cargando citas...</td></tr>
                            ) : data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="table-cell py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-white shadow-sm">
                                                {item.paciente?.nombre?.charAt(0)}
                                            </div>
                                            <button
                                                onClick={() => handleOpenNotes(item)}
                                                className="text-left group/name"
                                            >
                                                <p className="font-bold text-gray-900 leading-none group-hover/name:text-primary-600 transition-colors">
                                                    {item.paciente?.nombre} {item.paciente?.apellidos}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{item.paciente?.email}</p>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: item.tipo?.color_hex }}>
                                                {item.tipo?.nombre}
                                            </span>
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <MapPin size={10} /> {item.centro?.nombre}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <div className="text-gray-900 font-bold text-sm">
                                            {item.fecha_hora_inicio.split('T')[0]}
                                        </div>
                                        <div className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                                            <Clock size={12} /> {item.fecha_hora_inicio.split('T')[1].slice(0, 5)} - {item.fecha_hora_fin.split('T')[1].slice(0, 5)}
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-primary-400"></span>
                                            <span className="text-xs font-semibold text-gray-700">{item.tecnico?.nombre} {item.tecnico?.apellidos}</span>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${item.pagado ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                            <span className={`text-xs font-bold ${item.pagado ? 'text-green-700' : 'text-amber-700'}`}>
                                                {item.pagado ? 'PAGADO' : 'PENDIENTE'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        {item.estado === 'confirmada' && <Badge variant="primary">Confirmada</Badge>}
                                        {item.estado === 'asistida' && <Badge variant="success">Asistida</Badge>}
                                        {item.estado === 'cancelada' && <Badge variant="danger">Cancelada</Badge>}
                                    </td>
                                    <td className="table-cell text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.estado === 'confirmada' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateEstado(item.id, 'asistida')}
                                                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Marcar como asistida"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateEstado(item.id, 'cancelada')}
                                                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Cancelar cita"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleTogglePago(item)}
                                                className={`p-2 rounded-lg transition-colors ${item.pagado ? 'text-green-600 hover:bg-green-50' : 'text-amber-500 hover:bg-amber-50'}`}
                                                title={item.pagado ? "Marcar como pendiente" : "Marcar como pagado"}
                                            >
                                                <DollarSign size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenNotes(item)}
                                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                title="Introducir datos visita"
                                            >
                                                <FileEdit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleViewDetails(item)}
                                                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Ver detalles"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(!isLoading && data.length === 0) && (
                        <div className="text-center py-20">
                            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                                <Calendar size={32} />
                            </div>
                            <h4 className="text-gray-500 font-bold">No se encontraron citas</h4>
                            <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Detalles de Cita */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Detalles de la Cita"
                footer={
                    <Button onClick={() => setIsModalOpen(false)}>Cerrar</Button>
                }
            >
                {selectedCita && (
                    <div className="space-y-8">
                        {/* Info Principal */}
                        <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-200">
                                {selectedCita.paciente?.nombre?.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-gray-900 leading-tight">
                                    {selectedCita.paciente?.nombre} {selectedCita.paciente?.apellidos}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {selectedCita.estado === 'confirmada' && <Badge variant="primary">Confirmada</Badge>}
                                    {selectedCita.estado === 'asistida' && <Badge variant="success">Asistida</Badge>}
                                    {selectedCita.estado === 'cancelada' && <Badge variant="danger">Cancelada</Badge>}
                                    <Badge variant={selectedCita.pagado ? 'success' : 'warning'}>
                                        {selectedCita.pagado ? 'PAGADO' : 'PENDIENTE DE PAGO'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Datos de contacto */}
                            <div className="space-y-4">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <User size={14} className="text-primary-500" /> Datos de Contacto
                                </h5>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                            <MailIcon size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Email</p>
                                            <p className="font-semibold text-gray-700">{selectedCita.paciente?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                            <Phone size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Teléfono</p>
                                            <p className="font-semibold text-gray-700">{selectedCita.paciente?.telefono || 'No disponible'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Datos de la cita */}
                            <div className="space-y-4">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar size={14} className="text-primary-500" /> Detalles de Cita
                                </h5>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                            <Clock size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Horario</p>
                                            <p className="font-semibold text-gray-700">
                                                {selectedCita.fecha_hora_inicio.split('T')[0]} · {selectedCita.fecha_hora_inicio.split('T')[1].slice(0, 5)} - {selectedCita.fecha_hora_fin.split('T')[1].slice(0, 5)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                            <MapPin size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Ubicación</p>
                                            <p className="font-semibold text-gray-700">{selectedCita.centro?.nombre}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Servicio */}
                        <div className="p-4 bg-primary-50/50 rounded-2xl border border-primary-100/50">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText size={16} className="text-primary-600" />
                                <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">Servicio Solicitado</span>
                            </div>
                            <h6 className="font-bold text-gray-900 text-lg">{selectedCita.tipo?.nombre}</h6>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{selectedCita.tipo?.descripcion}</p>
                            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-white px-3 py-1.5 rounded-full border border-primary-100">
                                <Clock size={12} /> {selectedCita.tipo?.duracion_minutos} minutos de duración
                            </div>
                        </div>

                        {/* Historial Clínico Completo (En el Detalle) */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <History size={14} className="text-primary-500" /> Historial Clínico y Evolución
                            </h5>

                            <div className="space-y-4">
                                {/* Combinamos todas las notas incluyendo la actual en una lista cronológica para lectura */}
                                {[...patientHistory, ...(selectedCita.notas_visita ? [selectedCita] : [])]
                                    .sort((a, b) => a.fecha_hora_inicio.localeCompare(b.fecha_hora_inicio))
                                    .map((visita, idx) => (
                                        <div key={visita.id} className={`p-4 rounded-2xl border ${visita.id === selectedCita.id ? 'bg-primary-50/30 border-primary-100' : 'bg-gray-50/50 border-gray-100'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase">Visita #{idx + 1}</span>
                                                    {visita.id === selectedCita.id && (
                                                        <Badge variant="primary" className="text-[8px] py-0 uppercase">Actual</Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-gray-500">{visita.fecha_hora_inicio.split('T')[0]}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {visita.notas_visita}
                                            </p>
                                        </div>
                                    ))}

                                {patientHistory.length === 0 && !selectedCita.notas_visita && (
                                    <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-xs text-gray-400 font-medium">No hay registros clínicos en esta visita todavía.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notas de la Reserva */}

                        {selectedCita.notas && (
                            <div className="space-y-2">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Observaciones de la Reserva</h5>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-600 italic">
                                    "{selectedCita.notas}"
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal de Notas de Visita / Introducir Datos */}
            <Modal
                isOpen={isNotesModalOpen}
                onClose={() => setIsNotesModalOpen(false)}
                title="Información de la Visita"
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
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Visita Actual</p>
                                <p className="text-xs font-bold text-primary-600">{selectedCita.fecha_hora_inicio.split('T')[0]}</p>
                            </div>
                        </div>

                        {/* Historial de Notas Previas */}
                        {patientHistory.length > 0 && (
                            <div className="space-y-4">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <History size={14} className="text-primary-500" /> Historial Clínico (Menor a Mayor fecha)
                                </h5>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {patientHistory.map((prev, idx) => (
                                        <div key={prev.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase">Visita #{idx + 1}</span>
                                                <Badge variant="secondary" className="text-[9px] py-0">
                                                    {prev.fecha_hora_inicio.split('T')[0]}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap italic">
                                                "{prev.notas_visita}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-b border-dashed border-gray-200 pt-2"></div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="label flex items-center gap-2">
                                <FileEdit size={16} className="text-primary-600" />
                                Datos de la Visita Actual
                            </label>
                            <textarea
                                className="input min-h-[250px] resize-none py-4 text-sm leading-relaxed focus:ring-primary-500/20"
                                placeholder="Escribe aquí los detalles de la consulta actual..."
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
