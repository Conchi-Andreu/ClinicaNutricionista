import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SiteConfigContext = createContext(null);

export function SiteConfigProvider({ children }) {
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('site_config')
                .select('*')
                .eq('id', 'global-config')
                .single();

            if (error) throw error;
            if (data) setConfig(data);
        } catch (error) {
            console.error('Error fetching site_config from Supabase:', error);
            // Fallback to empty to avoid crashing the app
            setConfig({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    // Allows admin panel to manually refresh config after an update
    const refreshConfig = async () => {
        await fetchConfig();
    };

    // Return an object that matches the fallback pattern expected by the legacy code
    return (
        <SiteConfigContext.Provider value={{ config, loading, refreshConfig }}>
            {children}
        </SiteConfigContext.Provider>
    );
}

export function useSiteConfig() {
    const ctx = useContext(SiteConfigContext);
    if (!ctx) throw new Error('useSiteConfig must be used within SiteConfigProvider');
    return ctx;
}
