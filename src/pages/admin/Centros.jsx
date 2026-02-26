import React, { useState, useMemo } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    MapPin,
    Users,
    CheckCircle2,
    XCircle,
    Building2
} from 'lucide-react';
import { getAll, create, update, remove } from '../../store/db';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { toast } from 'react-hot-toast';

export default function Centros() {
    const [items, setItems] = useState(() => getAll('centros_salas'));
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        capacidad: 1,
        activo: true,
        horaApertura: '09:00',
        horaCierre: '20:00'
    });

    const filteredItems = useMemo(() => {
        return items.filter(item =>
            item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.direccion.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData({
                nombre: '',
                direccion: '',
                capacidad: 1,
                activo: true,
                horaApertura: '09:00',
                horaCierre: '20:00'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            update('centros_salas', editingItem.id, formData);
            toast.success('Centro actualizado');
        } else {
            create('centros_salas', formData);
            toast.success('Centro creado');
        }
        setItems(getAll('centros_salas'));
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Eliminar este centro? Se perderán las relaciones de disponibilidad.')) {
            remove('centros_salas', id);
            setItems(getAll('centros_salas'));
            toast.success('Centro eliminado');
        }
    };

    const toggleStatus = (item) => {
        update('centros_salas', item.id, { activo: !item.activo });
        setItems(getAll('centros_salas'));
        toast.success(`Centro ${!item.activo ? 'activado' : 'desactivado'}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Centros y Salas</h2>
                    <p className="text-gray-500 mt-1 font-medium">Ubicaciones físicas donde se prestan servicios</p>
                </div>
                <Button onClick={() => handleOpenModal()} icon={Plus}>Añadir Centro</Button>
            </div>

            <div className="card">
                <div className="mb-6">
                    <Input
                        placeholder="Buscar por nombre o dirección..."
                        icon={Search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="table-header">Centro / Sala</th>
                                <th className="table-header">Ubicación</th>
                                <th className="table-header">Horario Base</th>
                                <th className="table-header">Estado</th>
                                <th className="table-header text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="table-cell py-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl ${item.activo ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{item.nombre}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                                    <Users size={12} />
                                                    Capacidad: {item.capacidad} pers.
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                                            <MapPin size={14} className="text-gray-400" />
                                            {item.direccion}
                                        </span>
                                    </td>
                                    <td className="table-cell">
                                        <Badge variant="secondary">
                                            {item.horaApertura} - {item.horaCierre}
                                        </Badge>
                                    </td>
                                    <td className="table-cell">
                                        <button onClick={() => toggleStatus(item)}>
                                            {item.activo ? (
                                                <Badge variant="success" className="cursor-pointer hover:bg-green-100 transition-colors">
                                                    <CheckCircle2 size={12} className="mr-1" /> Activo
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200 transition-colors">
                                                    <XCircle size={12} className="mr-1" /> Inactivo
                                                </Badge>
                                            )}
                                        </button>
                                    </td>
                                    <td className="table-cell text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-primary-600 rounded-lg">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredItems.length === 0 && (
                        <div className="text-center py-12 text-gray-400">No se encontraron centros</div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? 'Editar Centro' : 'Nuevo Centro'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit}>{editingItem ? 'Guardar' : 'Crear'}</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Nombre del Centro / Sala"
                        placeholder="Ej: Sala A - Planta 1"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                    />
                    <Input
                        label="Dirección / Localización"
                        placeholder="Ej: Calle Gran Vía 20, Madrid"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        required
                        icon={MapPin}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Capacidad (Personal/Pacientes)"
                            type="number"
                            min="1"
                            value={formData.capacidad}
                            onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) })}
                            required
                        />
                        <div className="flex flex-col justify-center">
                            <label className="label">Estado</label>
                            <div className="flex items-center gap-3 h-10">
                                <input
                                    type="checkbox"
                                    checked={formData.activo}
                                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                    className="rounded text-primary-600 focus:ring-primary-500 w-5 h-5"
                                />
                                <span className="text-sm font-medium text-gray-600">Centro en servicio</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Hora Apertura"
                            type="time"
                            value={formData.horaApertura}
                            onChange={(e) => setFormData({ ...formData, horaApertura: e.target.value })}
                            required
                        />
                        <Input
                            label="Hora Cierre"
                            type="time"
                            value={formData.horaCierre}
                            onChange={(e) => setFormData({ ...formData, horaCierre: e.target.value })}
                            required
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
