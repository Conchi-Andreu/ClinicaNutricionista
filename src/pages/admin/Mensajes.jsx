import React, { useState, useEffect } from 'react';
import { getAll, update, remove } from '../../lib/database';
import { 
    Mail, 
    Trash2, 
    Search, 
    Eye, 
    Clock, 
    CheckCircle2, 
    XCircle,
    ChevronRight,
    MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

export default function Mensajes() {
    const [mensajes, setMensajes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMensaje, setSelectedMensaje] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        fetchMensajes();
    }, []);

    const fetchMensajes = async () => {
        setLoading(true);
        try {
            const data = await getAll('mensajes');
            // Ordenar por fecha descendente (asumiendo que vienen de MySQL)
            const sortedData = [...data].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            setMensajes(sortedData);
        } catch (error) {
            console.error('Error al cargar mensajes:', error);
            toast.error('No se pudieron cargar los mensajes');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRead = async (mensaje) => {
        try {
            await update('mensajes', mensaje.id, { leido: !mensaje.leido });
            fetchMensajes();
            toast.success(mensaje.leido ? 'Marcado como no leído' : 'Marcado como leído');
        } catch (error) {
            toast.error('Error al actualizar el estado');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este mensaje?')) return;
        
        try {
            await remove('mensajes', id);
            fetchMensajes();
            toast.success('Mensaje eliminado');
            if (selectedMensaje?.id === id) setIsViewModalOpen(false);
        } catch (error) {
            toast.error('Error al eliminar el mensaje');
        }
    };

    const handleView = (mensaje) => {
        setSelectedMensaje(mensaje);
        setIsViewModalOpen(true);
        if (!mensaje.leido) {
            handleToggleRead(mensaje);
        }
    };

    const filteredMensajes = mensajes.filter(m => 
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.asunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.mensaje.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mensajes de Contacto</h1>
                    <p className="text-gray-500 mt-1">Gestión de consultas recibidas a través de la web</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por email, asunto..."
                        className="input pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-500 font-medium">Cargando mensajes...</p>
                </div>
            ) : filteredMensajes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm text-center px-6">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                        <Mail size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No hay mensajes</h3>
                    <p className="text-gray-500 max-w-xs mt-2">
                        {searchTerm ? 'No se encontraron mensajes que coincidan con tu búsqueda.' : 'Aún no has recibido ninguna consulta a través del formulario de contacto.'}
                    </p>
                    {searchTerm && (
                        <Button variant="secondary" className="mt-6" onClick={() => setSearchTerm('')}>
                            Limpiar búsqueda
                        </Button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">De</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Asunto</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Fecha</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredMensajes.map((mensaje) => (
                                    <tr key={mensaje.id} className={`group hover:bg-gray-50/50 transition-colors ${!mensaje.leido ? 'bg-primary-50/20' : ''}`}>
                                        <td className="px-6 py-4">
                                            {mensaje.leido ? (
                                                <Badge variant="success" icon={CheckCircle2}>Leído</Badge>
                                            ) : (
                                                <Badge variant="warning" icon={Clock}>Nuevo</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-900">{mensaje.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-600 line-clamp-1">{mensaje.asunto}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(mensaje.fecha).toLocaleDateString('es-ES', { 
                                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleView(mensaje)}
                                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                                    title="Ver mensaje"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleRead(mensaje)}
                                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                                    title={mensaje.leido ? "Marcar como no leído" : "Marcar como leído"}
                                                >
                                                    {mensaje.leido ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(mensaje.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
                    </div>
                </div>
            )}

            {/* Modal de Vista de Mensaje */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detalles del Mensaje"
                icon={Mail}
            >
                {selectedMensaje && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-600 shadow-sm">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Remitente</p>
                                    <p className="font-semibold text-gray-900">{selectedMensaje.email}</p>
                                </div>
                            </div>
                            <div className="text-left md:text-right">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Recibido el</p>
                                <p className="text-sm font-medium text-gray-700">
                                    {new Date(selectedMensaje.fecha).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Asunto</p>
                            <p className="text-lg font-bold text-gray-900">{selectedMensaje.asunto}</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Cuerpo del mensaje</p>
                            <div className="p-6 bg-white border border-gray-100 rounded-2xl text-gray-700 leading-relaxed whitespace-pre-wrap shadow-inner min-h-[150px]">
                                {selectedMensaje.mensaje}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={() => {
                                    window.location.href = `mailto:${selectedMensaje.email}?subject=Re: ${selectedMensaje.asunto}`;
                                }}
                                icon={Mail}
                            >
                                Responder por Email
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setIsViewModalOpen(false)}
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
