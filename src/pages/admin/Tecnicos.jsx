import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Mail,
    Award,
    Camera,
    User as UserIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { toast } from 'react-hot-toast';

export default function Tecnicos() {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        fetchTecnicos();
    }, []);

    const fetchTecnicos = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('tecnicos').select('*').order('createdAt', { ascending: false });
        if (error) {
            toast.error('Error al cargar técnicos: ' + error.message);
        } else {
            setItems(data || []);
        }
        setIsLoading(false);
    };

    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        email: '',
        especialidad: '',
        password_hash: 'pass123',
        avatar: null
    });

    const filteredItems = useMemo(() => {
        return items.filter(item =>
            `${item.nombre} ${item.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.especialidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                apellidos: '',
                email: '',
                especialidad: '',
                password_hash: 'pass123',
                avatar: null
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (editingItem) {
            const { error } = await supabase.from('tecnicos').update(formData).eq('id', editingItem.id);
            if (error) {
                toast.error('Error al actualizar: ' + error.message);
                return;
            }
            toast.success('Técnico actualizado correctamente');
        } else {
            const { error } = await supabase.from('tecnicos').insert([formData]);
            if (error) {
                toast.error('Error al crear: ' + error.message);
                return;
            }
            toast.success('Técnico creado correctamente');
        }
        
        fetchTecnicos();
        setIsModalOpen(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este técnico?')) {
            const { error } = await supabase.from('tecnicos').delete().eq('id', id);
            if (error) {
                toast.error('Error al eliminar: ' + error.message);
            } else {
                toast.success('Técnico eliminado');
                fetchTecnicos();
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Equipo Técnico</h2>
                    <p className="text-gray-500 mt-1 font-medium">Gestiona los profesionales asistenciales de la clínica</p>
                </div>
                <Button onClick={() => handleOpenModal()} icon={Plus}>Añadir Técnico</Button>
            </div>

            <div className="card">
                <div className="mb-6 relative">
                    <Input
                        placeholder="Buscar por nombre, especialidad o email..."
                        icon={Search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="table-header">Profesional</th>
                                <th className="table-header">Especialidad</th>
                                <th className="table-header">Contacto</th>
                                <th className="table-header text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-gray-500">Cargando técnicos...</td>
                                </tr>
                            ) : filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="table-cell py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold overflow-hidden shadow-inner">
                                                {item.avatar ? <img src={item.avatar} alt="" /> : <UserIcon size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{item.nombre} {item.apellidos}</p>
                                                <p className="text-xs text-gray-400">ID: {item.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <Badge variant="info">
                                            <Award size={12} className="mr-1" />
                                            {item.especialidad}
                                        </Badge>
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex flex-col">
                                            <span className="inline-flex items-center gap-1.5 text-gray-600 font-medium">
                                                <Mail size={14} className="text-gray-400" />
                                                {item.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="table-cell text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(!isLoading && filteredItems.length === 0) && (
                        <div className="text-center py-12 text-gray-400">No se encontraron técnicos</div>
                    )}
                </div>
            </div>

            {/* Modal CRUD */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? 'Editar Técnico' : 'Nuevo Técnico'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit}>{editingItem ? 'Guardar Cambios' : 'Crear Técnico'}</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-[2rem] bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 overflow-hidden">
                                <Camera size={32} />
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-[2rem] transition-opacity cursor-pointer text-white text-[10px] font-bold">
                                CAMBIAR
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Nombre"
                            placeholder="Ej: Laura"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                        <Input
                            label="Apellidos"
                            placeholder="Ej: García Martínez"
                            value={formData.apellidos}
                            onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        label="Email"
                        type="email"
                        placeholder="laura@clinica.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />

                    <Input
                        label="Especialidad"
                        placeholder="Ej: Nutrición Clínica"
                        value={formData.especialidad}
                        onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                        required
                    />
                </form>
            </Modal>
        </div>
    );
}
