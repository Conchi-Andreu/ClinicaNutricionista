import React, { useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
    Filter,
    MapPin,
    Users,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    CheckCircle2,
    Clock,
    User,
    Phone,
    Mail as MailIcon,
    FileText,
    StickyNote,
    History,
    DollarSign,
    FileEdit,
    CreditCard
} from 'lucide-react';
import { getAll, update } from '../../store/db';
import { useAuth } from '../../auth/AuthContext';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';

export default function Agenda() {
    const { user } = useAuth();
    const calendarRef = useRef(null);
    const [tecnicos, setTecnicos] = useState([]);
    const [centros, setCentros] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [filterTecnico, setFilterTecnico] = useState('');
    const [filterCentro, setFilterCentro] = useState('');

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [visitNotes, setVisitNotes] = useState('');
    const [currentView, setCurrentView] = useState('timeGridWeek');

    const [slots, setSlots] = useState([]);
    const [citas, setCitas] = useState([]);
    const [pacientes, setPacientes] = useState([]);

    const loadData = () => {
        const allTecs = getAll('tecnicos');
        setTecnicos(allTecs);
        setCentros(getAll('centros_salas').filter(c => c.activo));
        setTipos(getAll('tipos_visita'));
        setSlots(getAll('disponibilidad_slots'));
        setCitas(getAll('citas'));
        setPacientes(getAll('pacientes'));

        if (user?.rol === 'tecnico') {
            const tec = allTecs.find(t => t.usuario_id === user.id || t.email === user.email);
            if (tec) setFilterTecnico(tec.id);
        }
    };

    // Load data on mount
    React.useEffect(() => {
        loadData();
    }, []);

    // Load events (slots + citas)
    const events = useMemo(() => {
        if (!slots.length && !citas.length) return [];

        const getID = (val) => {
            if (typeof val === 'object' && val !== null && val.id) return String(val.id).trim();
            return String(val || '').trim();
        };

        const normalizeTime = (t) => String(t || '').replace('T', ' ').slice(0, 16);

        let processedSlots = slots;
        if (filterTecnico) processedSlots = processedSlots.filter(s => getID(s.tecnico_id) === getID(filterTecnico));
        if (filterCentro) processedSlots = processedSlots.filter(s => getID(s.centro_id) === getID(filterCentro));

        // Slots as events (defensive filtering)
        const slotEvents = (processedSlots || []).filter(s => {
            // Already occupied in DB? Hide.
            if (s.estado === 'ocupado') return false;

            const sStart = normalizeTime(`${s.fecha} ${s.hora_inicio}`);
            const sEnd = normalizeTime(`${s.fecha} ${s.hora_fin}`);

            const sTech = getID(s.tecnico_id);
            const sCen = getID(s.centro_id);

            // Check if ANY cita overlaps this slot for the same tecnico/centro
            const isOverlap = (citas || []).some(c => {
                if (c.estado === 'cancelada') return false;

                const cTech = getID(c.tecnico_id);
                const cCen = getID(c.centro_id);

                if (cTech !== sTech || cCen !== sCen) return false;

                const cStart = normalizeTime(c.fecha_hora_inicio);
                const cEnd = normalizeTime(c.fecha_hora_fin);

                // Overlap condition: max(sStart, cStart) < min(sEnd, cEnd)
                const intersectionStart = sStart > cStart ? sStart : cStart;
                const intersectionEnd = sEnd < cEnd ? sEnd : cEnd;

                return intersectionStart < intersectionEnd;
            });

            return !isOverlap;
        }).map(s => {
            if (!s?.fecha || !s?.hora_inicio) return null;
            const tec = (tecnicos || []).find(t => getID(t.id) === getID(s.tecnico_id));
            const cen = (centros || []).find(c => getID(c.id) === getID(s.centro_id));

            return {
                id: `slot-${s.id}`,
                title: 'Libre',
                start: `${s.fecha}T${s.hora_inicio}`,
                end: s.hora_fin ? `${s.fecha}T${s.hora_fin}` : undefined,
                backgroundColor: '#ecfdf5',
                borderColor: '#1A6B4A',
                textColor: '#065f46',
                allDay: false,
                extendedProps: { ...s, tecnico: tec, centro: cen, type: 'slot' }
            };
        }).filter(Boolean);

        // Citas as events
        const citaEvents = (citas || []).map(c => {
            const tec = (tecnicos || []).find(t => String(t.id) === String(c?.tecnico_id));
            const cen = (centros || []).find(cn => String(cn.id) === String(c?.centro_id));
            const pac = (pacientes || []).find(p => String(p.id) === String(c?.paciente_id) || String(p.usuario_id) === String(c?.paciente_id));
            const tipo = (tipos || []).find(t => String(t.id) === String(c?.tipo_visita_id));

            if (filterTecnico && String(c?.tecnico_id) !== String(filterTecnico)) return null;
            if (filterCentro && String(c?.centro_id) !== String(filterCentro)) return null;
            if (!c?.fecha_hora_inicio) return null;

            return {
                id: `cita-${c.id}`,
                title: `${pac?.nombre || 'Paciente'} (${tipo?.nombre || 'Servicio'})`,
                start: c.fecha_hora_inicio,
                end: c.fecha_hora_fin,
                backgroundColor: tipo?.color_hex || '#1A6B4A',
                borderColor: tipo?.color_hex || '#1A6B4A',
                textColor: '#fff',
                allDay: false,
                extendedProps: { ...c, paciente: pac, tipo, tecnico: tec, centro: cen, type: 'cita' }
            };
        }).filter(Boolean);

        return [...slotEvents, ...citaEvents];
    }, [filterTecnico, filterCentro, tecnicos, centros, tipos, slots, citas, pacientes]);

    const handleEventClick = (info) => {
        setSelectedEvent(info.event.extendedProps);
        setIsModalOpen(true);
    };

    const patientHistory = useMemo(() => {
        if (!selectedEvent?.paciente_id || selectedEvent?.type !== 'cita') return [];
        return citas
            .filter(c =>
                (String(c.paciente_id) === String(selectedEvent.paciente_id)) &&
                c.notas_visita &&
                c.id !== selectedEvent.id
            )
            .sort((a, b) => a.fecha_hora_inicio.localeCompare(b.fecha_hora_inicio));
    }, [selectedEvent, citas]);

    const handleTogglePago = (cita) => {
        const nuevoEstadoPago = !cita.pagado;
        update('citas', cita.id, { pagado: nuevoEstadoPago });
        loadData(); // Reload all agenda data
        // Update selected event locally to reflect change immediately in modal
        setSelectedEvent(prev => ({ ...prev, pagado: nuevoEstadoPago }));
        toast.success(nuevoEstadoPago ? 'Cita marcada como PAGADA' : 'Cita marcada como PENDIENTE DE PAGO');
    };

    const handleOpenNotes = (cita) => {
        // Close detail modal first
        setIsModalOpen(false);
        setVisitNotes(cita.notas_visita || '');
        setIsNotesModalOpen(true);
    };

    const handleSaveNotes = () => {
        update('citas', selectedEvent.id, { notas_visita: visitNotes });
        loadData();
        setIsNotesModalOpen(false);
        toast.success('Datos de la visita guardados correctamente');
    };

    const next = () => calendarRef.current.getApi().next();
    const prev = () => calendarRef.current.getApi().prev();
    const today = () => calendarRef.current.getApi().today();
    const changeView = (view) => {
        calendarRef.current.getApi().changeView(view);
        setCurrentView(view);
    };

    const nextAvailableDate = useMemo(() => {
        if (!events.length) return null;
        const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
        const now = new Date().toISOString();
        return sorted.find(e => e.start >= now)?.start?.split('T')[0];
    }, [events]);

    const goToNextEvent = () => {
        if (nextAvailableDate && calendarRef.current) {
            calendarRef.current.getApi().gotoDate(nextAvailableDate);
            toast.success(`Navegando al ${nextAvailableDate}`);
        }
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {user?.rol === 'tecnico' ? 'Mi Agenda' : 'Agenda Global'}
                    </h2>
                    <p className="text-gray-500 mt-1 font-medium">
                        {user?.rol === 'tecnico' ? 'Visualiza tu disponibilidad y citas' : 'Visualiza la disponibilidad y citas de todo el equipo'}
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => changeView('dayGridMonth')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${currentView === 'dayGridMonth' ? 'bg-primary-600 text-white' : 'hover:bg-gray-50 text-gray-500'}`}
                    >
                        Mes
                    </button>
                    <button
                        onClick={() => changeView('timeGridWeek')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${currentView === 'timeGridWeek' ? 'bg-primary-600 text-white' : 'hover:bg-gray-50 text-gray-500'}`}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => changeView('timeGridDay')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${currentView === 'timeGridDay' ? 'bg-primary-600 text-white' : 'hover:bg-gray-50 text-gray-500'}`}
                    >
                        Día
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card py-4 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                        <Filter size={18} />
                    </div>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Filtros</span>
                </div>

                <div className="flex-1 flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            className="input pl-10 h-11 text-xs font-semibold disabled:bg-gray-50 disabled:text-gray-400"
                            value={filterTecnico}
                            onChange={(e) => setFilterTecnico(e.target.value)}
                            disabled={user?.rol === 'tecnico'}
                        >
                            <option value="">Todos los Técnicos</option>
                            {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellidos}</option>)}
                        </select>
                    </div>

                    <div className="relative flex-1 min-w-[200px]">
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            className="input pl-10 h-11 text-xs font-semibold"
                            value={filterCentro}
                            onChange={(e) => setFilterCentro(e.target.value)}
                        >
                            <option value="">Todos los Centros</option>
                            {centros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden lg:flex flex-col items-end mr-4 pr-4 border-r border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</span>
                        <div className="flex gap-3 text-[10px] font-extrabold">
                            <span className="text-primary-600">
                                {events.filter(e => e.extendedProps.type === 'slot').length} HUECOS
                            </span>
                            <span className="text-amber-600">
                                {events.filter(e => e.extendedProps.type === 'cita').length} CITAS
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {nextAvailableDate && (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="bg-primary-50 text-primary-700 border-primary-100 mr-1"
                                onClick={goToNextEvent}
                            >
                                Ver próxima cita
                            </Button>
                        )}
                    </div>
                    <Button variant="secondary" size="sm" onClick={prev} icon={ChevronLeft} />
                    <Button variant="secondary" size="sm" onClick={today}>Hoy</Button>
                    <Button variant="secondary" size="sm" onClick={next} icon={ChevronRight} />
                </div>
            </div>

            {/* Calendar Area */}
            <div className="flex-1 card p-0 overflow-hidden min-h-[600px] border-none shadow-xl">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={false}
                    events={events}
                    eventClick={handleEventClick}
                    height="800px"
                    allDaySlot={false}
                    slotMinTime="07:00:00"
                    slotMaxTime="22:00:00"
                    locale="es"
                    firstDay={1}
                    editable={false}
                    droppable={false}
                    slotDuration="00:30:00"
                    nowIndicator={true}
                    dayMaxEvents={true}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        meridiem: false
                    }}
                />
            </div>

            {/* Event Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedEvent?.type === 'cita' ? 'Detalle de Cita' : 'Detalle de Slot'}
                maxWidth={selectedEvent?.type === 'cita' ? 'max-w-2xl' : 'max-w-md'}
                footer={
                    <div className="flex items-center gap-2">
                        {selectedEvent?.type === 'cita' && (
                            <Button
                                variant="secondary"
                                onClick={() => handleOpenNotes(selectedEvent)}
                                icon={FileEdit}
                            >
                                Introducir Datos
                            </Button>
                        )}
                        <Button onClick={() => setIsModalOpen(false)}>Cerrar</Button>
                    </div>
                }
            >
                {selectedEvent && (
                    <div className="space-y-6">
                        {selectedEvent.type === 'cita' ? (
                            <div className="space-y-8">
                                {/* Info Principal (Igual que en Citas) */}
                                <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-200"
                                        style={{ backgroundColor: selectedEvent.tipo?.color_hex || '#1A6B4A' }}
                                    >
                                        {selectedEvent.paciente?.nombre?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xl font-bold text-gray-900 leading-tight">
                                            {selectedEvent.paciente?.nombre} {selectedEvent.paciente?.apellidos}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            {selectedEvent.estado === 'confirmada' && <Badge variant="primary">Confirmada</Badge>}
                                            {selectedEvent.estado === 'asistida' && <Badge variant="success">Asistida</Badge>}
                                            {selectedEvent.estado === 'cancelada' && <Badge variant="danger">Cancelada</Badge>}
                                            <Badge variant={selectedEvent.pagado ? 'success' : 'warning'}>
                                                {selectedEvent.pagado ? 'PAGADO' : 'PENDIENTE DE PAGO'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleTogglePago(selectedEvent)}
                                        className={`p-3 rounded-xl transition-all shadow-sm border ${selectedEvent.pagado ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}
                                        title={selectedEvent.pagado ? "Marcar como pendiente" : "Marcar como pagado"}
                                    >
                                        <DollarSign size={24} />
                                    </button>
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
                                                    <p className="font-semibold text-gray-700">{selectedEvent.paciente?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                                    <Phone size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Teléfono</p>
                                                    <p className="font-semibold text-gray-700">{selectedEvent.paciente?.telefono || 'No disponible'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Datos de la cita */}
                                    <div className="space-y-4">
                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <CalendarIcon size={14} className="text-primary-500" /> Detalles de Cita
                                        </h5>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                                    <Clock size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Horario</p>
                                                    <p className="font-semibold text-gray-700 text-xs">
                                                        {selectedEvent.fecha_hora_inicio.replace('T', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                                    <MapPin size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Ubicación</p>
                                                    <p className="font-semibold text-gray-700">{selectedEvent.centro?.nombre}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Historial Clínico Completo */}
                                <div className="space-y-4 pt-6 border-t border-gray-100">
                                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <History size={14} className="text-primary-500" /> Historial Clínico y Evolución
                                    </h5>

                                    <div className="space-y-4">
                                        {[...patientHistory, ...(selectedEvent.notas_visita ? [selectedEvent] : [])]
                                            .sort((a, b) => a.fecha_hora_inicio.localeCompare(b.fecha_hora_inicio))
                                            .map((visita, idx) => (
                                                <div key={visita.id} className={`p-4 rounded-2xl border ${visita.id === selectedEvent.id ? 'bg-primary-50/30 border-primary-100' : 'bg-gray-50/50 border-gray-100'}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase">Visita #{idx + 1}</span>
                                                            {visita.id === selectedEvent.id && (
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

                                        {patientHistory.length === 0 && !selectedEvent.notas_visita && (
                                            <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                <p className="text-xs text-gray-400 font-medium">No hay registros clínicos registrados.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notas de la Reserva */}
                                {selectedEvent.notas && (
                                    <div className="space-y-2">
                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Observaciones de la Reserva</h5>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-600 italic">
                                            "{selectedEvent.notas}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Slot Detail (Hueco Libre) */
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                                        <Clock size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900">Hueco Disponible</h4>
                                        <p className="text-sm text-gray-500 font-medium">Listo para nueva reserva</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Users size={18} className="text-gray-400" />
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Técnico</p>
                                            <p className="text-sm font-bold text-gray-800">{selectedEvent.tecnico?.nombre} {selectedEvent.tecnico?.apellidos}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin size={18} className="text-gray-400" />
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Ubicación</p>
                                            <p className="text-sm font-bold text-gray-800">{selectedEvent.centro?.nombre}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CalendarIcon size={18} className="text-gray-400" />
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Horario</p>
                                            <p className="text-sm font-bold text-gray-800">
                                                {selectedEvent.fecha} {selectedEvent.hora_inicio} - {selectedEvent.hora_fin}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal de Notas de Visita / Introducir Datos (Copiado de Citas) */}
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
                {selectedEvent && (
                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Paciente</p>
                                <p className="font-bold text-gray-900">{selectedEvent.paciente?.nombre} {selectedEvent.paciente?.apellidos}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Visita Actual</p>
                                <p className="text-xs font-bold text-primary-600">{selectedEvent.fecha_hora_inicio?.split('T')[0]}</p>
                            </div>
                        </div>

                        {/* Historial en el editor */}
                        {patientHistory.length > 0 && (
                            <div className="space-y-4">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <History size={14} className="text-primary-500" /> Consultar Historial Previos
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
                                Datos de la Visita Actual
                            </label>
                            <textarea
                                className="input min-h-[250px] resize-none py-4 text-sm leading-relaxed"
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
