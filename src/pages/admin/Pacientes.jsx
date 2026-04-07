import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    User,
    Phone,
    Mail,
    Calendar,
    ArrowRight,
    MessageSquare,
    MoreVertical,
    Clock,
    Edit2,
    Trash2,
    X
} from 'lucide-react';
import { getAll, update, remove } from '../../store/db';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';

export default function Pacientes() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState(() => getAll('pacientes'));
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        email: '',
        telefono: ''
    });

    const patients = useMemo(() => {
        const allPatients = items;
        const allCitas = getAll('citas');
        const allCentros = getAll('centros_salas');
        const now = new Date();

        return allPatients.map(paciente => {
            const patientCitas = allCitas.filter(c =>
                (c.paciente_id === paciente.id || c.paciente_id === paciente.usuario_id)
            );

            const pendingCount = patientCitas.filter(c => c.estado === 'confirmada').length;

            const nextCita = patientCitas
                .filter(c => c.estado === 'confirmada' && new Date(c.fecha_hora_inicio) >= now)
                .sort((a, b) => a.fecha_hora_inicio.localeCompare(b.fecha_hora_inicio))[0];

            let nextVisitInfo = null;
            if (nextCita) {
                const centro = allCentros.find(cen => cen.id === nextCita.centro_id);
                nextVisitInfo = {
                    fecha: nextCita.fecha_hora_inicio.split('T')[0],
                    hora: nextCita.fecha_hora_inicio.split('T')[1].slice(0, 5),
                    hora_fin: nextCita.fecha_hora_fin.split('T')[1].slice(0, 5),
                    centro: centro?.nombre || 'N/A'
                };
            }

            return {
                ...paciente,
                visitasPendientes: pendingCount,
                nextVisit: nextVisitInfo
            };
        }).filter(p => {
            const fullName = `${p.nombre} ${p.apellidos}`.toLowerCase();
            return fullName.includes(searchTerm.toLowerCase()) ||
                p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.telefono.includes(searchTerm);
        });
    }, [searchTerm]);

    const [openMenuId, setOpenMenuId] = useState(null);

    const handleViewVisits = (patientId) => {
        navigate(`/admin/citas?pacienteId=${patientId}`);
    };

    const handleOpenEdit = (patient) => {
        setEditingItem(patient);
        setFormData({
            nombre: patient.nombre,
            apellidos: patient.apellidos,
            email: patient.email,
            telefono: patient.telefono
        });
        setIsEditModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este paciente?')) {
            remove('pacientes', id);
            setItems(getAll('pacientes'));
            toast.success('Paciente eliminado correctamente');
        }
        setOpenMenuId(null);
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        update('pacientes', editingItem.id, formData);
        setItems(getAll('pacientes'));
        setIsEditModalOpen(false);
        toast.success('Datos del paciente actualizados');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Pacientes</h2>
                    <p className="text-gray-500 mt-1 font-medium">Consulta el listado completo y estado de tus pacientes</p>
                </div>
            </div>

            <div className="card">
                <div className="mb-8">
                    <Input
                        placeholder="Buscar por nombre, email o teléfono..."
                        icon={Search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto min-h-[300px] pb-24">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="table-header">Paciente</th>
                                <th className="table-header">Contacto</th>
                                <th className="table-header">Visitas Pendientes</th>
                                <th className="table-header">Próxima Visita</th>
                                <th className="table-header text-right min-w-[140px]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {patients.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="table-cell py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-white shadow-sm">
                                                {p.nombre?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 leading-none">{p.nombre} {p.apellidos}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">ID: {p.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Mail size={12} className="text-gray-400" />
                                                {p.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Phone size={12} className="text-gray-400" />
                                                {p.telefono}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${p.visitasPendientes > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                                                {p.visitasPendientes}
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium">citas por asistir</span>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        {p.nextVisit ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="text-gray-900 font-bold text-xs flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-primary-500" />
                                                    {p.nextVisit.fecha}
                                                </div>
                                                <div className="text-gray-400 text-[10px] flex items-center gap-1.5 uppercase font-medium">
                                                    <Clock size={10} /> {p.nextVisit.hora} - {p.nextVisit.hora_fin} • {p.nextVisit.centro}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Sin citas próximas</span>
                                        )}
                                    </td>
                                    <td className="table-cell text-right min-w-[140px]">
                                        <div className="flex justify-end gap-2 relative">
                                            <button
                                                onClick={() => handleViewVisits(p.usuario_id || p.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-600 hover:text-white transition-all text-xs font-bold shadow-sm"
                                                title="Ver historial de visitas"
                                            >
                                                <Calendar size={14} />
                                                Ver Visitas
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                                                    className={`p-1.5 rounded-lg transition-colors ${openMenuId === p.id ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:bg-gray-100'}`}
                                                    title="Más opciones"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {openMenuId === p.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setOpenMenuId(null)}
                                                        ></div>
                                                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-modal border border-gray-100 z-20 py-1 flex flex-col animate-fade-in">
                                                            <button
                                                                onClick={() => handleOpenEdit(p)}
                                                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                                                            >
                                                                <Edit2 size={14} /> Editar Datos
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(p.id)}
                                                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 size={14} /> Eliminar
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {patients.length === 0 && (
                        <div className="text-center py-20">
                            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                                <User size={32} />
                            </div>
                            <h4 className="text-gray-500 font-bold">No se encontraron pacientes</h4>
                            <p className="text-gray-400 text-sm mt-1">Prueba con otro término de búsqueda.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Edición */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Editar Paciente"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveEdit}>Guardar Cambios</Button>
                    </>
                }
            >
                <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
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
                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <Input
                        label="Teléfono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        required
                    />
                </form>
            </Modal>
        </div>
    );
}
