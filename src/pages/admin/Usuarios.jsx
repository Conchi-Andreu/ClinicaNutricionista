import React, { useState } from 'react';
import { Users, Shield, User as UserIcon, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import { getAll, update, create } from '../../store/db';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState(() => getAll('usuarios'));
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [tecnicoData, setTecnicoData] = useState({ especialidad: '' });

    const handleOpenEdit = (user) => {
        setEditingUser({ ...user });
        const tecs = getAll('tecnicos');
        const tec = tecs.find(t => t.usuario_id === user.id || t.email === user.email);
        setTecnicoData(tec ? { ...tec } : { especialidad: '' });
        setIsModalOpen(true);
    };

    const handleSaveUser = (e) => {
        e.preventDefault();

        // 1. Update basic user data
        const updatedUser = update('usuarios', editingUser.id, {
            nombre: editingUser.nombre,
            apellidos: editingUser.apellidos,
            rol: editingUser.rol,
            email: editingUser.email
        });

        if (updatedUser) {
            // 2. Handle tecnico specific logic
            if (editingUser.rol === 'tecnico') {
                const tecs = getAll('tecnicos');
                const existingTec = tecs.find(t => t.usuario_id === editingUser.id || t.email === editingUser.email);

                const techRecord = {
                    ...tecnicoData,
                    nombre: editingUser.nombre,
                    apellidos: editingUser.apellidos,
                    email: editingUser.email,
                    usuario_id: editingUser.id
                };

                if (existingTec) {
                    update('tecnicos', existingTec.id, techRecord);
                } else {
                    create('tecnicos', techRecord);
                }
            }

            setUsuarios(getAll('usuarios'));
            setIsModalOpen(false);
            toast.success('Usuario actualizado correctamente');
        }
    };

    const filteredUsers = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (rol) => {
        switch (rol) {
            case 'admin': return <Badge variant="danger">Admin</Badge>;
            case 'tecnico': return <Badge variant="warning">Técnico</Badge>;
            default: return <Badge variant="secondary">Paciente</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Usuarios</h2>
                <p className="text-gray-500 mt-1 font-medium">Administra los roles y accesos de los usuarios registrados</p>
            </div>

            <div className="card">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, apellidos o email..."
                            className="input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="py-4 px-1 text-xs font-bold text-gray-400 uppercase tracking-widest">Usuario</th>
                                <th className="py-4 px-1 text-xs font-bold text-gray-400 uppercase tracking-widest">Contacto</th>
                                <th className="py-4 px-1 text-xs font-bold text-gray-400 uppercase tracking-widest">Rol Actual</th>
                                <th className="py-4 px-1 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Acciones de Rol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-bold">
                                                {u.nombre[0]}{u.apellidos[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{u.nombre} {u.apellidos}</div>
                                                <div className="text-xs text-gray-500">ID: {u.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-1">
                                        <div className="text-sm text-gray-600 flex items-center gap-1.5">
                                            <Mail size={14} className="text-gray-400" />
                                            {u.email}
                                        </div>
                                        {u.telefono && (
                                            <div className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                                                <Phone size={14} className="text-gray-400" />
                                                {u.telefono}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-1">
                                        {getRoleBadge(u.rol)}
                                    </td>
                                    <td className="py-4 px-1 text-right">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleOpenEdit(u)}
                                        >
                                            Modificar
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Users size={32} />
                        </div>
                        <h3 className="font-bold text-gray-900">No se encontraron usuarios</h3>
                        <p className="text-gray-500 text-sm">Prueba con otros términos de búsqueda.</p>
                    </div>
                )}
            </div>

            {/* Modal de Edición */}
            {isModalOpen && editingUser && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Modificar Usuario"
                    footer={
                        <>
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveUser}>Guardar Cambios</Button>
                        </>
                    }
                >
                    <form onSubmit={handleSaveUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Nombre"
                                value={editingUser.nombre}
                                onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                                required
                            />
                            <Input
                                label="Apellidos"
                                value={editingUser.apellidos}
                                onChange={(e) => setEditingUser({ ...editingUser, apellidos: e.target.value })}
                                required
                            />
                        </div>
                        <Input
                            label="Email"
                            type="email"
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                            required
                        />

                        <div>
                            <label className="label">Rol del Usuario</label>
                            <select
                                className="input"
                                value={editingUser.rol}
                                onChange={(e) => setEditingUser({ ...editingUser, rol: e.target.value })}
                            >
                                <option value="paciente">Paciente / Usuario</option>
                                <option value="tecnico">Técnico</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>

                        {/* Campos específicos para Técnico */}
                        {editingUser.rol === 'tecnico' && (
                            <div className="pt-4 border-t border-gray-100 space-y-4 animate-slide-up">
                                <h4 className="text-sm font-bold text-primary-700 uppercase tracking-wider">Detalles de Técnico</h4>
                                <Input
                                    label="Especialidad"
                                    placeholder="Ej: Nutrición Deportiva"
                                    value={tecnicoData.especialidad}
                                    onChange={(e) => setTecnicoData({ ...tecnicoData, especialidad: e.target.value })}
                                    required={editingUser.rol === 'tecnico'}
                                />
                                <Input
                                    label="Bio / Información Adicional"
                                    placeholder="Descripción corta del perfil..."
                                    value={tecnicoData.bio || ''}
                                    onChange={(e) => setTecnicoData({ ...tecnicoData, bio: e.target.value })}
                                />
                            </div>
                        )}

                        {/* Campos específicos para Admin (Simulados según petición "lo mismo para admin") */}
                        {editingUser.rol === 'admin' && (
                            <div className="pt-4 border-t border-gray-100 space-y-4 animate-slide-up">
                                <h4 className="text-sm font-bold text-red-700 uppercase tracking-wider">Privilegios de Administrador</h4>
                                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                    <p className="text-xs text-red-600 font-medium">
                                        Este usuario tendrá acceso total a la configuración de centros, técnicos y roles.
                                    </p>
                                </div>
                            </div>
                        )}
                    </form>
                </Modal>
            )}
        </div>
    );
}
