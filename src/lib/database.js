import { supabase } from './supabase';

/**
 * Capa de abstracción para la base de datos de Supabase.
 * Emula las funciones de db.js para facilitar la migración.
 */

export async function getAll(table) {
    const { data, error } = await supabase
        .from(table)
        .select('*');

    if (error) {
        console.error(`Error al obtener datos de ${table}:`, error);
        return [];
    }
    return data;
}

export async function getById(table, id) {
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error al obtener item de ${table}:`, error);
        return null;
    }
    return data;
}

export async function create(table, itemData) {
    const { data, error } = await supabase
        .from(table)
        .insert([itemData])
        .select()
        .single();

    if (error) {
        console.error(`Error al crear en ${table}:`, error);
        throw error;
    }
    return data;
}

export async function update(table, id, itemData) {
    const { data, error } = await supabase
        .from(table)
        .update(itemData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error(`Error al actualizar en ${table}:`, error);
        throw error;
    }
    return data;
}

export async function remove(table, id) {
    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`Error al eliminar en ${table}:`, error);
        throw error;
    }
}

// Funciones específicas para la lógica de la clínica

export async function getSlotsDisponibles(tecnicoId, centroId, fecha) {
    const { data, error } = await supabase
        .from('disponibilidad_slots')
        .select('*')
        .eq('tecnico_id', tecnicoId)
        .eq('centro_id', centroId)
        .eq('fecha', fecha)
        .eq('estado', 'libre');

    if (error) {
        console.error('Error al obtener slots:', error);
        return [];
    }
    return data;
}
