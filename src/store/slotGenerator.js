// ====================================================
// slotGenerator.js — Agenda Generation Engine
// Converts a planificacion_regla into disponibilidad_slots
// ====================================================

import { addDays, parseISO, format, isWithinInterval, getDay } from 'date-fns';
import { getAll, create, remove } from '../lib/database';

const DAY_MAP = { L: 1, M: 2, X: 3, J: 4, V: 5, S: 6, D: 0 };

/**
 * Generates time slots from a rule.
 * @param {Object} regla - planificacion_regla object
 * @returns {{ count: number, conflicts: number }} result stats
 */
export async function generateSlots(regla) {
    const { id: regla_id, tecnico_id, centro_id, fecha_desde, fecha_hasta, dias_semana, hora_inicio, hora_fin, intervalo_minutos } = regla;

    const diasArray = dias_semana.split(',').map((d) => DAY_MAP[d.trim()]);
    
    // Fetch only slots for the same tecnico to check for conflicts
    const existingSlots = await getAll(`disponibilidad_slots&tecnico_id=${tecnico_id}`);
    
    const newSlots = [];
    let conflicts = 0;

    let current = parseISO(fecha_desde);
    const end = parseISO(fecha_hasta);

    while (current <= end) {
        const dayOfWeek = getDay(current);
        if (diasArray.includes(dayOfWeek)) {
            const dateStr = format(current, 'yyyy-MM-dd');

            // Generate time slots for this day
            const [startH, startM] = hora_inicio.split(':').map(Number);
            const [endH, endM] = hora_fin.split(':').map(Number);
            let slotStart = startH * 60 + startM;
            const slotEnd = endH * 60 + endM;

            while (slotStart + intervalo_minutos <= slotEnd) {
                const fromTime = minutesToTime(slotStart);
                const toTime = minutesToTime(slotStart + intervalo_minutos);

                // Conflict check: same tecnico, same date, overlapping time
                const conflict = existingSlots?.some(
                    (s) => s.fecha === dateStr && s.hora_inicio.slice(0, 5) === fromTime
                );

                if (conflict) {
                    conflicts++;
                } else {
                    const slot = {
                        tecnico_id,
                        centro_id,
                        regla_id,
                        fecha: dateStr,
                        hora_inicio: fromTime,
                        hora_fin: toTime,
                        estado: 'libre'
                    };
                    newSlots.push(slot);
                    // Add to existing memory array immediately to prevent intra-batch duplicates
                    existingSlots.push({ fecha: dateStr, hora_inicio: fromTime });
                }

                slotStart += intervalo_minutos;
            }
        }
        current = addDays(current, 1);
    }

    if (newSlots.length > 0) {
        // Bulk insert
        await create('disponibilidad_slots', newSlots);
    }
    
    return { count: newSlots.length, conflicts };
}

function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

/**
 * Counts how many slots a rule would generate (preview, no DB write)
 */
export function previewSlotCount(regla) {
    const { fecha_desde, fecha_hasta, dias_semana, hora_inicio, hora_fin, intervalo_minutos } = regla;
    if (!fecha_desde || !fecha_hasta || !dias_semana || !hora_inicio || !hora_fin || !intervalo_minutos) return 0;

    const diasArray = dias_semana.split(',').map((d) => DAY_MAP[d.trim()]).filter((d) => d !== undefined);
    let count = 0;
    let current = parseISO(fecha_desde);
    const end = parseISO(fecha_hasta);

    const [startH, startM] = hora_inicio.split(':').map(Number);
    const [endH, endM] = hora_fin.split(':').map(Number);
    const slotsPerDay = Math.floor(((endH * 60 + endM) - (startH * 60 + startM)) / intervalo_minutos);

    while (current <= end) {
        if (diasArray.includes(getDay(current))) count += slotsPerDay;
        current = addDays(current, 1);
    }
    return count;
}

/**
 * Get free slots for a patient booking, grouped by date
 * Supports multi-slot grouping for longer visit types
 */
export async function getFreeSlotsForPatient(tecnico_id, centro_id, duracion_minutos, intervalo_minutos = 30) {
    const allSlots = await getAll(`disponibilidad_slots&tecnico_id=${tecnico_id}&centro_id=${centro_id}&estado=libre`);

    if (!allSlots) return {};

    const slotsNeeded = Math.ceil(duracion_minutos / intervalo_minutos);

    if (slotsNeeded <= 1) {
        return groupByDate(allSlots);
    }

    // Group consecutive slots
    const validSlots = {};
    const byDate = groupByDate(allSlots);

    for (const [date, slots] of Object.entries(byDate)) {
        const sorted = slots.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
        const groups = [];

        for (let i = 0; i <= sorted.length - slotsNeeded; i++) {
            let consecutive = true;
            for (let j = 0; j < slotsNeeded - 1; j++) {
                if (sorted[i + j].hora_fin.slice(0, 5) !== sorted[i + j + 1].hora_inicio.slice(0, 5)) {
                    consecutive = false;
                    break;
                }
            }
            if (consecutive) {
                groups.push({
                    ...sorted[i],
                    hora_fin: sorted[i + slotsNeeded - 1].hora_fin.slice(0, 5),
                    slotIds: sorted.slice(i, i + slotsNeeded).map((s) => s.id),
                });
            }
        }
        if (groups.length > 0) validSlots[date] = groups;
    }

    return validSlots;
}

function groupByDate(slots) {
    return slots.reduce((acc, slot) => {
        if (!acc[slot.fecha]) acc[slot.fecha] = [];
        acc[slot.fecha].push(slot);
        return acc;
    }, {});
}

/**
 * Delete all slots generated by a rule
 */
export async function deleteSlotsForRule(regla_id) {
    // Note: The generic remove helper in database.js only supports remove by ID.
    // We need a way to delete with filters.
    // For now, let's assume we can pass filters to a custom endpoint or update remove.
    // Given the current api.php, DELETE only takes ID.
    
    // Alternative: fetch IDs first and delete them? Very inefficient.
    // Better: update api.php to handle filters in DELETE or add a specific action.
    
    // I'll update api.php to allow filters in DELETE if ID is not provided.
    const slots = await getAll(`disponibilidad_slots&regla_id=${regla_id}&estado=libre`);
    for (const slot of slots) {
        await remove('disponibilidad_slots', slot.id);
    }
}
