const API_URL = import.meta.env.VITE_API_URL || 'https://www.gemmapascual.es/Programacion/api/api.php';

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/Programacion/login';
        }
        const error = await response.json();
        throw new Error(error.error || 'Error en la petición API');
    }

    return response.json();
}

/**
 * Capa de abstracción para la base de datos MySQL vía PHP API.
 */

export async function getAll(table) {
    try {
        return await apiRequest(`?table=${table}`);
    } catch (error) {
        console.error(`Error al obtener datos de ${table}:`, error);
        return [];
    }
}

export async function getById(table, id) {
    try {
        return await apiRequest(`?table=${table}&id=${id}`);
    } catch (error) {
        console.error(`Error al obtener item de ${table}:`, error);
        return null;
    }
}

export async function create(table, itemData) {
    const result = await apiRequest(`?table=${table}`, {
        method: 'POST',
        body: JSON.stringify(itemData)
    });
    return result;
}

export async function update(table, id, itemData) {
    const result = await apiRequest(`?table=${table}&id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData)
    });
    return result;
}

export async function remove(table, id) {
    return await apiRequest(`?table=${table}&id=${id}`, {
        method: 'DELETE'
    });
}

// Funciones específicas para la lógica de la clínica

export async function getSlotsDisponibles(tecnicoId, centroId, fecha) {
    try {
        return await apiRequest(`?table=disponibilidad_slots&tecnico_id=${tecnicoId}&centro_id=${centroId}&fecha=${fecha}&estado=libre`);
    } catch (error) {
        console.error('Error al obtener slots:', error);
        return [];
    }
}

