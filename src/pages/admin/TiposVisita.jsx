import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Clock,
    Tag,
    Palette
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';

const PRESET_COLORS = [
    '#1A6B4A', '#4db88d', '#82d2ae', '#2a9d70',
    '#2563eb', '#4f46e5', '#7c3aed', '#db2777',
    '#ea580c', '#d97706', '#ca8a04', '#65a30d'
];

export default function TiposVisita() {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        fetchTiposVisita();
    }, []);

    const fetchTiposVisita = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('tipos_visita').select('*').order('createdAt', { ascending: false });
        if (error) {
            toast.error('Error al cargar servicios: ' + error.message);
        } else {
            setItems(data || []);
        }
        setIsLoading(false);
    };

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        duracion_minutos: 30,
        color_hex: '#1A6B4A'
    });

    const filteredItems = useMemo(() => {
        return items.filter(item =>
            item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
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
                descripcion: '',
                duracion_minutos: 30,
                color_hex: '#1A6B4A'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (editingItem) {
            const { error } = await supabase.from('tipos_visita').update(formData).eq('id', editingItem.id);
            if (error) {
                toast.error('Error al actualizar: ' + error.message);
                return;
            }
            toast.success('Servicio actualizado');
        } else {
            const { error } = await supabase.from('tipos_visita').insert([formData]);
            if (error) {
                toast.error('Error al crear: ' + error.message);
                return;
            }
            toast.success('Servicio creado');
        }
        
        fetchTiposVisita();
        setIsModalOpen(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar este tipo de visita?')) {
            const { error } = await supabase.from('tipos_visita').delete().eq('id', id);
            if (error) {
                toast.error('Error al eliminar: ' + error.message);
            } else {
                toast.success('Servicio eliminado');
                fetchTiposVisita();
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Servicios / Tipos de Visita</h2>
                    <p className="text-gray-500 mt-1 font-medium">Define los servicios que ofreces y su duración</p>
                </div>
                <Button onClick={() => handleOpenModal()} icon={Plus}>Añadir Servicio</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                    <div key={item.id} className="card relative group hover:border-primary-100 border border-transparent transition-all">
                        <div
                            className="absolute top-0 right-0 w-16 h-16 opacity-5 pointer-events-none rounded-bl-[4rem]"
                            style={{ backgroundColor: item.color_hex }}
                        />

                        <div className="flex items-start justify-between mb-4">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110"
                                style={{ backgroundColor: item.color_hex }}
                            >
                                <Tag size={20} />
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-primary-600 rounded-lg bg-gray-50">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg bg-gray-50">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors uppercase tracking-tight">{item.nombre}</h3>
                        <p className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed h-10">{item.descripcion}</p>

                        <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-700 font-bold bg-gray-50 px-3 py-1.5 rounded-xl">
                                <Clock size={16} className="text-primary-600" />
                                <span className="text-sm">{item.duracion_minutos} min</span>
                            </div>
                            <div
                                className="w-4 h-4 rounded-full border-2 border-white ring-2 ring-gray-100 flex-shrink-0"
                                style={{ backgroundColor: item.color_hex }}
                            />
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="lg:col-span-3 card flex items-center justify-center py-20 text-gray-500">Cargando servicios...</div>
                )}
                {!isLoading && filteredItems.length === 0 && (
                    <div className="lg:col-span-3 card flex items-center justify-center py-20 text-gray-400 font-medium">
                        No hay servicios configurados. ¡Crea el primero!
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? 'Editar Servicio' : 'Nuevo Servicio'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit}>{editingItem ? 'Guardar' : 'Crear Servicio'}</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Nombre del Servicio"
                        placeholder="Ej: Primera Consulta"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                    />
                    <Input
                        label="Descripción corta"
                        placeholder="En qué consiste este servicio..."
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                    <Input
                        label="Duración (minutos)"
                        type="number"
                        min="5"
                        step="5"
                        value={formData.duracion_minutos}
                        onChange={(e) => setFormData({ ...formData, duracion_minutos: parseInt(e.target.value) })}
                        required
                        icon={Clock}
                    />

                    <div>
                        <label className="label flex items-center gap-2">
                            <Palette size={16} /> Color Etiqueta
                        </label>
                        <div className="grid grid-cols-6 gap-3 mt-3">
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color_hex: color })}
                                    className={`w-full aspect-square rounded-xl border-4 transition-all ${formData.color_hex === color ? 'border-primary-100 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <div className="mt-4 flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: formData.color_hex }} />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">Color Seleccionado: {formData.color_hex}</span>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
