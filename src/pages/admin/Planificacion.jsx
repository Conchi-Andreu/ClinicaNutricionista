import React, { useState, useMemo, useEffect } from 'react';
import {
    Calendar,
    Clock,
    Users,
    MapPin,
    Plus,
    Trash2,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    History
} from 'lucide-react';
import { getAll, create, remove, deleteSlotsBySelection } from '../../store/db';
import { useAuth } from '../../auth/AuthContext';
import { generateSlots, previewSlotCount, deleteSlotsForRule } from '../../store/slotGenerator';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import { toast } from 'react-hot-toast';

const DIAS = [
    { id: 'L', label: 'Lun' },
    { id: 'M', label: 'Mar' },
    { id: 'X', label: 'Mié' },
    { id: 'J', label: 'Jue' },
    { id: 'V', label: 'Vie' },
    { id: 'S', label: 'Sáb' },
    { id: 'D', label: 'Dom' },
];

export default function Planificacion() {
    const { user } = useAuth();
    const [reglas, setReglas] = useState([]);
    const [tecnicos] = useState(() => getAll('tecnicos'));
    const [centros] = useState(() => getAll('centros_salas').filter(c => c.activo));

    const currentTecnicoId = useMemo(() => {
        if (user?.rol !== 'tecnico') return null;
        const tec = tecnicos.find(t => t.usuario_id === user.id || t.email === user.email);
        return tec?.id;
    }, [user, tecnicos]);

    const currentTecnico = useMemo(() => {
        return tecnicos.find(t => t.id === currentTecnicoId);
    }, [currentTecnicoId, tecnicos]);

    useEffect(() => {
        const allReglas = getAll('planificacion_reglas');
        if (currentTecnicoId) {
            setReglas(allReglas.filter(r => r.tecnico_id === currentTecnicoId));
            setFormData(prev => ({ ...prev, tecnico_id: currentTecnicoId }));
        } else {
            setReglas(allReglas);
        }
    }, [currentTecnicoId]);

    const [formData, setFormData] = useState({
        tecnico_id: '',
        centro_id: '',
        fecha_desde: '',
        fecha_hasta: '',
        dias_semana: [],
        hora_inicio: '09:00',
        hora_fin: '14:00',
        intervalo_minutos: 30
    });

    const [previewCount, setPreviewCount] = useState(0);

    // Update preview count whenever form changes
    useEffect(() => {
        if (formData.fecha_desde && formData.fecha_hasta && formData.dias_semana.length > 0) {
            const count = previewSlotCount({
                ...formData,
                dias_semana: formData.dias_semana.join(',')
            });
            setPreviewCount(count);
        } else {
            setPreviewCount(0);
        }
    }, [formData]);

    const toggleDia = (diaId) => {
        setFormData(prev => ({
            ...prev,
            dias_semana: prev.dias_semana.includes(diaId)
                ? prev.dias_semana.filter(d => d !== diaId)
                : [...prev.dias_semana, diaId]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.dias_semana.length === 0) {
            toast.error('Debes seleccionar al menos un día de la semana');
            return;
        }

        const nuevaRegla = create('planificacion_reglas', {
            ...formData,
            dias_semana: formData.dias_semana.join(',')
        });

        const result = generateSlots(nuevaRegla);

        toast.success(`¡Éxito! Se han generado ${result.count} huecos de disponibilidad.`);
        if (result.conflicts > 0) {
            toast.error(`${result.conflicts} huecos no se crearon por conflicto de horario/técnico.`, { duration: 5000 });
        }

        setReglas(getAll('planificacion_reglas'));
        // Reset form
        setFormData({
            tecnico_id: '',
            centro_id: '',
            fecha_desde: '',
            fecha_hasta: '',
            dias_semana: [],
            hora_inicio: '09:00',
            hora_fin: '14:00',
            intervalo_minutos: 30
        });
    };

    const handleDeleteRegla = (regla) => {
        if (window.confirm('¿Eliminar esta regla? Se borrarán todos los huecos LIBRES generados por ella. Las citas ya reservadas se mantendrán.')) {
            deleteSlotsForRule(regla.id);
            remove('planificacion_reglas', regla.id);
            setReglas(getAll('planificacion_reglas'));
            toast.success('Regla y slots eliminados');
        }
    };

    const handleDeleteSelection = () => {
        const { tecnico_id, centro_id, fecha_desde, fecha_hasta } = formData;
        if (!tecnico_id || !centro_id || !fecha_desde || !fecha_hasta) {
            toast.error('Completa Técnico, Centro y Fechas para poder borrar.');
            return;
        }

        if (fecha_hasta < fecha_desde) {
            toast.error('La fecha de fin no puede ser anterior a la de inicio.');
            return;
        }

        if (window.confirm('¿Deseas eliminar todos los HUECOS LIBRES de esta selección? Las citas confirmadas no se tocarán.')) {
            const result = deleteSlotsBySelection(tecnico_id, centro_id, fecha_desde, fecha_hasta);
            toast.success(`Eliminados ${result.removed} huecos libres.`);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {user?.rol === 'tecnico' ? 'Mi Planificación' : 'Planificación Inteligente'}
                </h2>
                <p className="text-gray-500 mt-1 font-medium">
                    {user?.rol === 'tecnico' ? 'Genera tus huecos de disponibilidad basados en reglas' : 'Genera huecos de disponibilidad masivos basados en reglas recurrentes'}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Generator Form */}
                <div className="lg:col-span-1">
                    <div className="card sticky top-8 border-2 border-primary-50 shadow-xl shadow-primary-900/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                                <Sparkles size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Nuevo Generador</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="label mb-0">Técnico Asignado</label>
                                        {user?.rol === 'tecnico' && currentTecnicoId && (
                                            <Badge variant="success" className="text-[10px] py-0.5 animate-pulse">
                                                Conectado
                                            </Badge>
                                        )}
                                    </div>
                                    <select
                                        className="input appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%239CA3AF%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_1rem_center] bg-no-repeat disabled:bg-gray-50 disabled:text-gray-900 font-bold"
                                        value={formData.tecnico_id}
                                        onChange={(e) => setFormData({ ...formData, tecnico_id: e.target.value })}
                                        required
                                        disabled={user?.rol === 'tecnico'}
                                    >
                                        <option value="">Selecciona un técnico...</option>
                                        {tecnicos.map(t => (
                                            <option key={t.id} value={t.id}>{t.nombre} {t.apellidos}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="label">Centro / Sala</label>
                                    <select
                                        className="input appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%239CA3AF%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_1rem_center] bg-no-repeat"
                                        value={formData.centro_id}
                                        onChange={(e) => setFormData({ ...formData, centro_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecciona un centro...</option>
                                        {centros.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Fecha Desde"
                                        type="date"
                                        value={formData.fecha_desde}
                                        onChange={(e) => setFormData({ ...formData, fecha_desde: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Fecha Hasta"
                                        type="date"
                                        value={formData.fecha_hasta}
                                        onChange={(e) => setFormData({ ...formData, fecha_hasta: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="label">Días de la semana</label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {DIAS.map(dia => (
                                            <button
                                                key={dia.id}
                                                type="button"
                                                onClick={() => toggleDia(dia.id)}
                                                className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${formData.dias_semana.includes(dia.id)
                                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {dia.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Hora Inicio"
                                        type="time"
                                        value={formData.hora_inicio}
                                        onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Hora Fin"
                                        type="time"
                                        value={formData.hora_fin}
                                        onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                                        required
                                    />
                                </div>

                                <Input
                                    label="Intervalo (minutos)"
                                    type="number"
                                    min="5"
                                    step="5"
                                    value={formData.intervalo_minutos}
                                    onChange={(e) => setFormData({ ...formData, intervalo_minutos: parseInt(e.target.value) })}
                                    required
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-50 mt-6 space-y-3">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Previsualización</span>
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge variant={previewCount > 0 ? 'success' : 'secondary'}>
                                            {previewCount} huecos
                                        </Badge>
                                        {formData.fecha_desde && formData.fecha_hasta && formData.fecha_hasta < formData.fecha_desde && (
                                            <span className="text-[10px] text-red-500 font-bold animate-bounce">
                                                Fecha fin anterior a inicio
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button type="submit" className="w-full text-sm font-bold h-12" disabled={previewCount === 0 || (formData.fecha_hasta < formData.fecha_desde)}>
                                    Generar Disponibilidad
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleDeleteSelection}
                                    className="w-full text-xs font-bold text-red-500 hover:bg-red-50"
                                >
                                    Borrar Selección Actual
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Existing Rules List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <History size={20} className="text-gray-400" />
                            Historial de Reglas
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {reglas.length > 0 ? [...reglas].reverse().map((regla) => {
                            const tec = tecnicos.find(t => t.id === regla.tecnico_id);
                            const cen = centros.find(c => c.id === regla.centro_id);
                            return (
                                <div key={regla.id} className="card group hover:border-red-100 border border-transparent transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 leading-tight">
                                                    {tec?.nombre} {tec?.apellidos}
                                                    <span className="text-gray-400 font-medium px-2">—</span>
                                                    <span className="text-primary-600">{cen?.nombre}</span>
                                                </h4>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Calendar size={14} className="text-gray-300" />
                                                        {regla.fecha_desde} al {regla.fecha_hasta}
                                                    </span>
                                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Clock size={14} className="text-gray-300" />
                                                        {regla.hora_inicio} - {regla.hora_fin} ({regla.intervalo_minutos} min)
                                                    </span>
                                                </div>
                                                <div className="flex gap-1 mt-3">
                                                    {regla.dias_semana.split(',').map(d => (
                                                        <span key={d} className="w-7 h-7 bg-primary-50 text-primary-700 text-[10px] font-bold rounded-lg flex items-center justify-center border border-primary-100 uppercase">
                                                            {DIAS.find(day => day.id === d)?.label.slice(0, 1)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteRegla(regla)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            title="Eliminar regla y huecos libres"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="card text-center py-20 bg-transparent border-2 border-dashed border-gray-200 shadow-none">
                                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                                    <AlertCircle size={32} />
                                </div>
                                <h4 className="text-gray-500 font-bold">No hay reglas generadas</h4>
                                <p className="text-gray-400 text-sm mt-1 max-w-[240px] mx-auto">Configura un generador a la izquierda para empezar a llenar tu agenda.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
