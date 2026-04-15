import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'https://www.gemmapascual.es/Programacion/api/api.php';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('auth_user');
        const token = localStorage.getItem('auth_token');
        
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_URL}?path=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, error: error.error || 'Error de conexión' };
            }

            const data = await response.json();
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            setUser(data.user);
            return { success: true };
        } catch (error) {
            return { success: false, error: 'No se pudo conectar con el servidor.' };
        }
    };

    const register = async ({ nombre, apellidos, email, password, telefono }) => {
        try {
            // Note: In a real app, registration should be a specific endpoint that hashes the password
            // For now, we'll assume the API has a /register endpoint or handles hashing if we send it to usuarios
            const response = await fetch(`${API_URL}?path=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, apellidos, email, password, telefono, rol: 'paciente' })
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, error: error.error || 'Error al registrarse' };
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Error de red.' };
        }
    };

    const logout = async () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
    };

    const verifyEmail = () => { return { success: true }; }; 

    const requestPasswordReset = async (email) => {
        try {
            const response = await fetch(`${API_URL}?path=request-password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            return { success: true }; // Always return success for security
        } catch (error) {
            return { success: false, error: 'Error de red.' };
        }
    };

    const resetPassword = async (token, newPassword) => {
        try {
            const response = await fetch(`${API_URL}?path=reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: newPassword })
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, error: error.error || 'Error al restablecer' };
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Error de red.' };
        }
    };

    const refreshUser = async () => {
        // Podríamos tener un endpoint /me
    };

    return (
        <AuthContext.Provider value={{
            user, login, logout, register, verifyEmail, refreshUser,
            requestPasswordReset, resetPassword, loading
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

