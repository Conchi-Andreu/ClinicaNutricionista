import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = async (authUser) => {
        if (!authUser) {
           setUser(null);
           setLoading(false);
           return;
        }

        const { data: profile } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', authUser.email)
            .single();
        
        if (profile) {
            setUser({ ...authUser, ...profile });
        } else {
            setUser(null); 
        }
        setLoading(false);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            loadProfile(session?.user);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            loadProfile(session?.user);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: 'Credenciales incorrectas o email sin verificar.' };
        return { success: true };
    };

    const register = async ({ nombre, apellidos, email, password, telefono }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nombre, apellidos, telefono }
            }
        });

        if (error) return { success: false, error: 'Este email ya está en uso o es inválido.' };

        if (data.user) {
            // Check if profile exists across race conditions
            const { data: existing } = await supabase.from('usuarios').select('id').eq('email', email).single();
            if (!existing) {
                await supabase.from('usuarios').insert({
                    usuario_id: data.user.id,
                    nombre,
                    apellidos,
                    email,
                    telefono,
                    rol: 'paciente',
                    activo: true
                });

                await supabase.from('pacientes').insert({
                    usuario_id: data.user.id,
                    nombre,
                    apellidos,
                    email,
                    telefono
                });
            }
        }

        return { success: true, needsEmailVerification: !data.session };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const verifyEmail = () => { return { success: true }; }; // Supabase Magic Link handles this

    const requestPasswordReset = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
    };

    const resetPassword = async (token, newPassword) => {
        // Note: With supabase, token isn't manually verified here if using magic links properly,
        // but if using updateUser, the session is already active via the link!
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) return { success: false, error: error.message };
        return { success: true };
    };

    const refreshUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await loadProfile(session?.user);
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
