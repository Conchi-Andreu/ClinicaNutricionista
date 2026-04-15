import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Clock,
    User,
    MapPin,
    Calendar as CalendarIcon,
    Tag,
    ArrowRight,
    Info
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { getFreeSlotsForPatient } from '../../store/slotGenerator';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { toast } from 'react-hot-toast';

const STEPS = [
    { id: 1, name: 'Servicio', icon: Tag },
    { id: 2, name: 'Horario', icon: CalendarIcon },
    { id: 3, name: 'Confirmar', icon: CheckCircle2 },
];

export default function BookingWizard() {
    const { user } = useAuth();
    const location = useLocation();
    const rescheduleCitaId = location.state?.rescheduleCitaId;
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // State for selections
    const [selectedTipo, setSelectedTipo] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [notas, setNotas] = useState('');

    const [tecnicos, setTecnicos] = useState([]);
    const [centros, setCentros] = useState([]);
    const [tiposVisita, setTiposVisita] = useState([]);
    const [pacienteId, setPacienteId] = useState(null);

    const [tecnico, setTecnico] = useState(null);
    const [centro, setCentro] = useState(null);
    const [freeSlotsByDate, setFreeSlotsByDate] = useState({});

    const { refreshUser } = useAuth();
    
    // Load initial context (tecnicos, centros, etc)
    useEffect(() => {
        const loadInitialData = async () => {
            const [tecRes, cenRes, tiposRes, pacRes] = await Promise.all([
                supabase.from('tecnicos').select('*'),
                supabase.from('centros_salas').select('*').eq('activo', true),
                supabase.from('tipos_visita').select('*'),
                supabase.from('pacientes').select('*').eq('usuario_id', user.id).single()
            ]);
            
            const loadedTecnicos = tecRes.data || [];
            const loadedCentros = cenRes.data || [];
            
            setTecnicos(loadedTecnicos);
            setCentros(loadedCentros);
            setTiposVisita(tiposRes.data || []);
            
            if (pacRes.data) {
                setPacienteId(pacRes.data.id);
            }
            
            setTecnico(loadedTecnicos.find(t => t.id === user?.tecnico_asignado_id) || loadedTecnicos[0] || null);
            setCentro(loadedCentros.find(c => c.id === user?.centro_asignado_id) || loadedCentros[0] || null);
            
            // Reagendando
            if (rescheduleCitaId) {
                const { data: target } = await supabase.from('citas').select('*').eq('id', rescheduleCitaId).single();
                if (target) {
                    const tipo = (tiposRes.data || []).find(t => t.id === target.tipo_visita_id);
                    const tec = loadedTecnicos.find(t => t.id === target.tecnico_id);
                    const cen = loadedCentros.find(c => c.id === target.centro_id);

                    if (tipo) setSelectedTipo(tipo);
                    if (tec) setTecnico(tec);
                    if (cen) setCentro(cen);
                    if (target.notas) setNotas(target.notas);

                    toast.success('Reagendando cita: Elige el nuevo horario', { icon: '🔄' });
                    setStep(2);
                }
            }
        };
        loadInitialData();
    }, [user, rescheduleCitaId]);

    // Fetch free slots async when preferences change
    useEffect(() => {
        const fetchSlots = async () => {
            if (!selectedTipo || !tecnico || !centro) {
                setFreeSlotsByDate({});
                return;
            }
            const slots = await getFreeSlotsForPatient(tecnico.id, centro.id, selectedTipo.duracion_minutos);
            setFreeSlotsByDate(slots || {});
        };
        fetchSlots();
    }, [selectedTipo, tecnico, centro]);

    // Handle preference changes
    const handleChangeTecnico = async (e) => {
        const newTec = tecnicos.find(t => t.id === e.target.value);
        if (newTec) {
            setTecnico(newTec);
            await supabase.from('usuarios').update({ tecnico_asignado_id: newTec.id }).eq('id', user.id);
            if (pacienteId) {
                await supabase.from('pacientes').update({ tecnico_asignado_id: newTec.id }).eq('id', pacienteId);
            }

            refreshUser();
            toast.success(`Ahora verás la agenda de ${newTec.nombre}`);
            setStep(1);
            setSelectedTipo(null);
        }
    };

    const handleChangeCentro = async (e) => {
        const newCentro = centros.find(c => c.id === e.target.value);
        if (newCentro) {
            setCentro(newCentro);
            await supabase.from('usuarios').update({ centro_asignado_id: newCentro.id }).eq('id', user.id);
            if (pacienteId) {
                await supabase.from('pacientes').update({ centro_asignado_id: newCentro.id }).eq('id', pacienteId);
            }

            refreshUser();
            toast.success(`Cambiado a: ${newCentro.nombre}`);
            setStep(1);
            setSelectedTipo(null);
        }
    };

    const availableDates = useMemo(() => Object.keys(freeSlotsByDate), [freeSlotsByDate]);

    const handleSelectTipo = (tipo) => {
        setSelectedTipo(tipo);
        setStep(2);
    };

    const handleDateClick = (info) => {
        // Utilizar fecha local para evitar desfases
        const d = info.date;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        if (availableDates.includes(dateStr)) {
            setSelectedDate(dateStr);
            setSelectedSlot(null);
        } else {
            toast.error('No hay disponibilidad para este día.');
        }
    };

    const handleConfirm = async () => {
        if (!selectedSlot) return;

        setStep(100);

        try {
            // 1. If rescheduling, free old slots first
            if (rescheduleCitaId) {
                const { data: oldCita } = await supabase.from('citas').select('*').eq('id', rescheduleCitaId).single();
                if (oldCita) {
                    await supabase.from('disponibilidad_slots').update({ estado: 'libre' }).eq('id', oldCita.slot_id);
                }
            }

            // 2. Process the new appointment / update
            const citaData = {
                paciente_id: pacienteId || user.id,
                tecnico_id: tecnico.id,
                centro_id: centro.id,
                tipo_visita_id: selectedTipo.id,
                slot_id: selectedSlot.id,
                fecha_hora_inicio: `${selectedSlot.fecha}T${selectedSlot.hora_inicio}`,
                fecha_hora_fin: `${selectedSlot.fecha}T${selectedSlot.hora_fin}`,
                notas: notas,
                estado: 'confirmada'
            };

            if (rescheduleCitaId) {
                await supabase.from('citas').update(citaData).eq('id', rescheduleCitaId);
            } else {
                await supabase.from('citas').insert([citaData]);
            }

            // 3. Mark new slots as occupied
            const idsToUpdate = selectedSlot.slotIds || [selectedSlot.id];
            await supabase.from('disponibilidad_slots').update({ estado: 'ocupado' }).in('id', idsToUpdate);

            toast.success(rescheduleCitaId ? '¡Cita reagendada con éxito!' : '¡Cita reservada con éxito!', { duration: 5000 });
            setStep(4);
        } catch (error) {
            toast.error('Error al confirmar la reserva.');
            setStep(3);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-4">
            {/* Header Info - Interactive Selectors */}
            <div className="bg-white rounded-3xl p-6 shadow-card mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-gray-50">
                <div className="flex items-center gap-5 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 shadow-inner overflow-hidden shrink-0">
                        {tecnico?.avatar ? <img src={tecnico.avatar} className="w-full h-full object-cover" alt="" /> : <User size={32} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="text-[10px] text-primary-600 font-bold uppercase tracking-widest mb-1 block">Tu Profesional</label>
                        <select
                            value={tecnico?.id || ''}
                            onChange={handleChangeTecnico}
                            className="bg-transparent text-xl font-extrabold text-gray-900 border-none p-0 focus:ring-0 cursor-pointer w-full truncate appearance-none hover:text-primary-600 transition-colors"
                        >
                            {tecnicos.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre} {t.apellidos}</option>
                            ))}
                        </select>
                        <p className="text-gray-400 text-xs font-medium truncate">{tecnico?.especialidad || 'General'}</p>
                    </div>
                </div>

                <div className="h-12 w-px bg-gray-100 hidden md:block"></div>

                <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                        <MapPin size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 block">Centro de Atención</label>
                        <select
                            value={centro?.id || ''}
                            onChange={handleChangeCentro}
                            className="bg-transparent font-bold text-gray-900 border-none p-0 focus:ring-0 cursor-pointer w-full truncate appearance-none hover:text-primary-600 transition-colors"
                        >
                            {centros.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stepper Navigation */}
            {step < 4 && (
                <div className="flex items-center justify-between mb-12 px-2 max-w-sm mx-auto">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <div className="flex flex-col items-center gap-2 relative">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border-2 ${step >= s.id ? 'bg-primary-600 border-primary-600 text-white shadow-primary-200' : 'bg-white border-gray-200 text-gray-300'
                                    }`}>
                                    <s.icon size={20} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-tighter ${step >= s.id ? 'text-primary-700' : 'text-gray-400'}`}>
                                    {s.name}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`h-0.5 w-12 sm:w-20 -mt-6 transition-colors duration-500 ${step > s.id ? 'bg-primary-600' : 'bg-gray-200'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* Step 1: Select Service */}
            {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-extrabold text-gray-900">¿Qué servicio necesitas hoy?</h3>
                        <p className="text-gray-500 mt-2 font-medium">Selecciona una opción para ver la disponibilidad</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tiposVisita.map(tipo => (
                            <button
                                key={tipo.id}
                                onClick={() => handleSelectTipo(tipo)}
                                className="card flex flex-col text-left group hover:scale-[1.03] hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer border-transparent"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                                        style={{ backgroundColor: tipo.color_hex }}
                                    >
                                        <Clock size={24} />
                                    </div>
                                    <Badge variant="secondary">{tipo.duracion_minutos} min</Badge>
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors uppercase tracking-tight">{tipo.nombre}</h4>
                                <p className="text-gray-500 text-sm mt-3 leading-relaxed flex-grow">{tipo.descripcion}</p>
                                <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between text-primary-600 font-bold text-sm">
                                    Ver horarios disponibles
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                    <div className="lg:col-span-12 flex justify-start mb-2">
                        <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary-600 transition-colors">
                            <ChevronLeft size={18} /> Volver a selección de servicio
                        </button>
                    </div>

                    {/* Calendar Side */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="card p-4 overflow-hidden shadow-xl border-none">
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                locale="es"
                                firstDay={1}
                                height="auto"
                                dateClick={handleDateClick}
                                headerToolbar={{
                                    left: 'prev,next',
                                    center: 'title',
                                    right: 'today'
                                }}
                                dayCellClassNames={(arg) => {
                                    // Utilizar fecha local para evitar desfases de zona horaria (UTC vs Local)
                                    const d = arg.date;
                                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                                    if (selectedDate === dateStr) {
                                        return 'bg-primary-600 !text-white font-bold ring-2 ring-primary-700 ring-offset-2 z-10';
                                    }
                                    if (availableDates.includes(dateStr)) {
                                        return 'bg-primary-100 hover:bg-primary-200 cursor-pointer text-primary-950 font-black border-2 border-primary-200';
                                    }
                                    return 'text-gray-300'; // Días no disponibles más apagados
                                }}
                                events={availableDates.map(d => ({
                                    start: d,
                                    display: 'background',
                                    backgroundColor: '#1A6B4A30' // Fondo un poco más visible también
                                }))}
                            />
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl border border-primary-100 text-primary-700">
                            <Info size={20} className="flex-shrink-0" />
                            <p className="text-xs font-medium leading-relaxed">
                                Selecciona un día en el calendario (marcados en <span className="font-bold underline">verde</span>) para ver las horas disponibles para una visita de <span className="font-bold">{selectedTipo.duracion_minutos} minutos</span>.
                            </p>
                        </div>
                    </div>

                    {/* Slots Side */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="card h-fit sticky top-24">
                            <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Clock size={20} className="text-gray-400" />
                                Horas para el {selectedDate || '...'}
                            </h4>

                            {!selectedDate ? (
                                <div className="py-12 text-center">
                                    <p className="text-gray-400 text-sm font-medium">Elige un día para ver horarios</p>
                                </div>
                            ) : freeSlotsByDate[selectedDate]?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto px-1">
                                    {freeSlotsByDate[selectedDate].map((slot, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`slot-pill ${selectedSlot === slot ? 'selected' : ''}`}
                                        >
                                            {slot.hora_inicio}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Sin huecos libres</p>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-gray-50">
                                <Button
                                    className="w-full h-12 shadow-lg shadow-primary-200"
                                    disabled={!selectedSlot}
                                    onClick={() => setStep(3)}
                                >
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
                <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
                    <div className="text-center">
                        <h3 className="text-2xl font-extrabold text-gray-900">Resumen y Confirmación</h3>
                        <p className="text-gray-500 mt-2 font-medium">Revisa los detalles antes de agendar tu cita</p>
                    </div>

                    <div className="card space-y-6 divide-y divide-gray-50">
                        {/* Professional */}
                        <div className="flex items-start gap-4 pb-6">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                                <User size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Nutricionista</p>
                                <h5 className="font-bold text-gray-900">{tecnico.nombre} {tecnico.apellidos}</h5>
                                <p className="text-xs text-gray-500 font-medium">{tecnico.especialidad}</p>
                            </div>
                        </div>

                        {/* Visit & Location */}
                        <div className="grid grid-cols-2 gap-4 py-6">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tipo de Visita</p>
                                <Badge variant="primary">{selectedTipo.nombre}</Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Centro / Sala</p>
                                <p className="text-sm font-bold text-gray-900">{centro.nombre}</p>
                            </div>
                        </div>

                        {/* DateTime */}
                        <div className="bg-primary-50 -mx-6 px-8 py-6 flex items-center justify-between border-y border-primary-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-primary-100">
                                    <CalendarIcon size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{selectedDate}</p>
                                    <p className="text-xs text-primary-700 font-semibold">{selectedSlot.hora_inicio} — {selectedSlot.hora_fin}</p>
                                </div>
                            </div>
                            <Badge variant="success" className="bg-white border-primary-200">{selectedTipo.duracion_minutos} min</Badge>
                        </div>

                        {/* User Details & Notes */}
                        <div className="pt-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1">Nombre</label>
                                    <p className="text-sm font-medium text-gray-900 px-1 mt-1">{user.nombre} {user.apellidos}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1">Email</label>
                                    <p className="text-sm font-medium text-gray-900 px-1 mt-1">{user.email}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1 mb-2 block">Dinos algo más (opcional)</label>
                                <textarea
                                    className="input h-24 resize-none"
                                    placeholder="Escribe aquí cualquier observación o motivo de la consulta..."
                                    value={notas}
                                    onChange={(e) => setNotas(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button variant="secondary" className="flex-1 h-14" onClick={() => setStep(2)}>Anterior</Button>
                        <Button className="flex-2 sm:flex-[2] h-14 shadow-xl shadow-primary-200" onClick={handleConfirm}>Confirmar Reserva</Button>
                    </div>
                </div>
            )}

            {/* Final Step: Success */}
            {step === 4 && (
                <div className="max-w-md mx-auto py-12 text-center animate-fade-in">
                    <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-900/10 border-2 border-green-100">
                        <CheckCircle2 size={48} />
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {rescheduleCitaId ? '¡Cita Reagendada!' : '¡Cita Agendada!'}
                    </h3>
                    <p className="text-gray-500 mt-4 font-medium leading-relaxed">
                        {rescheduleCitaId
                            ? 'Tu cita ha sido movida correctamente al nuevo horario. El hueco anterior ha sido liberado.'
                            : 'Hemos registrado tu cita correctamente. Recibirás un correo de confirmación con los detalles.'}
                    </p>

                    <div className="mt-12 space-y-3">
                        <Button className="w-full h-12" onClick={() => navigate('/paciente/mis-citas')}>Ver mis citas</Button>
                        <Button variant="ghost" className="w-full h-12" onClick={() => { setStep(1); setSelectedTipo(null); setSelectedDate(null); setSelectedSlot(null); setNotas(''); }}>Reservar otra cita</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
