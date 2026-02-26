import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAll, create } from '../store/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('__current_user__');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const login = (email, password) => {
        const usuarios = getAll('usuarios');
        const found = usuarios.find((u) => u.email === email && u.password === password);

        if (!found) return { success: false, error: 'Credenciales incorrectas' };

        if (found.activo === false) {
            return { success: false, error: 'Tu cuenta está pendiente de activación. Revisa tu email.' };
        }

        const { password: _, ...safeUser } = found;
        localStorage.setItem('__current_user__', JSON.stringify(safeUser));
        setUser(safeUser);
        return { success: true, user: safeUser };
    };

    const register = ({ nombre, apellidos, email, password, telefono }) => {
        const usuarios = getAll('usuarios');
        if (usuarios.find((u) => u.email === email)) {
            return { success: false, error: 'El email ya está registrado' };
        }

        const token = Math.random().toString(36).substring(2, 15);

        const newUser = create('usuarios', {
            nombre,
            apellidos,
            email,
            password,
            telefono,
            rol: 'paciente',
            activo: false,
            token_verificacion: token,
            tecnico_asignado_id: null,
            centro_asignado_id: null,
        });

        // Also create patient record, also inactive or just linked
        create('pacientes', {
            nombre,
            apellidos,
            email,
            telefono,
            tecnico_asignado_id: null,
            centro_asignado_id: null,
            usuario_id: newUser.id,
        });

        // Simulate email sending by logging the link
        console.log('--- SIMULACIÓN DE EMAIL ---');
        console.log(`Para activar tu cuenta, haz clic aquí: ${window.location.origin}/verify-email?token=${token}`);
        console.log('---------------------------');

        return { success: true, token };
    };

    const verifyEmail = (token) => {
        const usuarios = getAll('usuarios');
        const userIdx = usuarios.findIndex(u => u.token_verificacion === token);

        if (userIdx === -1) return { success: false, error: 'Token de verificación no válido' };

        usuarios[userIdx].activo = true;
        delete usuarios[userIdx].token_verificacion;

        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        return { success: true };
    };

    const logout = () => {
        localStorage.removeItem('__current_user__');
        setUser(null);
    };

    // Refresh user data from DB
    const refreshUser = () => {
        if (!user) return;
        const usuarios = getAll('usuarios');
        const fresh = usuarios.find((u) => u.id === user.id);
        if (fresh) {
            const { password: _, ...safeUser } = fresh;
            localStorage.setItem('__current_user__', JSON.stringify(safeUser));
            setUser(safeUser);
        }
    };

    const requestPasswordReset = (email) => {
        const usuarios = getAll('usuarios');
        const found = usuarios.find(u => u.email === email);
        if (!found) return { success: false, error: 'Email no encontrado' };

        const resetToken = Math.random().toString(36).substring(2, 15);
        found.reset_token = resetToken;
        localStorage.setItem('usuarios', JSON.stringify(usuarios));

        console.log('--- SIMULACIÓN DE RECUPERACIÓN ---');
        console.log(`Enlace de reset: ${window.location.origin}/reset-password?token=${resetToken}`);
        console.log('---------------------------------');

        return { success: true };
    };

    const resetPassword = (token, newPassword) => {
        const usuarios = getAll('usuarios');
        const foundIdx = usuarios.findIndex(u => u.reset_token === token);
        if (foundIdx === -1) return { success: false, error: 'Token no válido o expirado' };

        usuarios[foundIdx].password = newPassword;
        delete usuarios[foundIdx].reset_token;
        localStorage.setItem('usuarios', JSON.stringify(usuarios));

        return { success: true };
    };

    return (
        <AuthContext.Provider value={{
            user, login, logout, register, verifyEmail, refreshUser,
            requestPasswordReset, resetPassword
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
