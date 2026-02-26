// ====================================================
// slotGenerator.js — Agenda Generation Engine
// Converts a planificacion_regla into disponibilidad_slots
// ====================================================

import { addDays, parseISO, format, isWithinInterval, getDay } from 'date-fns';
import { getAll, create, saveAll } from './db';

const DAY_MAP = { L: 1, M: 2, X: 3, J: 4, V: 5, S: 6, D: 0 };

/**
 * Generates time slots from a rule.
 * @param {Object} regla - planificacion_regla object
 * @returns {{ count: number, conflicts: number }} result stats
 */
export function generateSlots(regla) {
    const { id: regla_id, tecnico_id, centro_id, fecha_desde, fecha_hasta, dias_semana, hora_inicio, hora_fin, intervalo_minutos } = regla;

    const diasArray = dias_semana.split(',').map((d) => DAY_MAP[d.trim()]);
    const existingSlots = getAll('disponibilidad_slots');
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
                const conflict = existingSlots.some(
                    (s) =>
                        s.tecnico_id === tecnico_id &&
                        s.fecha === dateStr &&
                        s.hora_inicio === fromTime
                );

                if (conflict) {
                    conflicts++;
                } else {
                    const slot = {
                        id: crypto.randomUUID(),
                        tecnico_id,
                        centro_id,
                        regla_id,
                        fecha: dateStr,
                        hora_inicio: fromTime,
                        hora_fin: toTime,
                        estado: 'libre',
                        createdAt: new Date().toISOString(),
                    };
                    newSlots.push(slot);
                    existingSlots.push(slot); // prevent duplicates within same generation
                }

                slotStart += intervalo_minutos;
            }
        }
        current = addDays(current, 1);
    }

    saveAll('disponibilidad_slots', existingSlots);
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
export function getFreeSlotsForPatient(tecnico_id, centro_id, duracion_minutos, intervalo_minutos = 30) {
    const allSlots = getAll('disponibilidad_slots').filter(
        (s) => s.tecnico_id === tecnico_id && s.centro_id === centro_id && s.estado === 'libre'
    );

    const slotsNeeded = Math.ceil(duracion_minutos / intervalo_minutos);

    if (slotsNeeded <= 1) {
        return groupByDate(allSlots);
    }

    // Group consecutive slots
    const validSlots = [];
    const byDate = groupByDate(allSlots);

    for (const [date, slots] of Object.entries(byDate)) {
        const sorted = slots.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
        const groups = [];

        for (let i = 0; i <= sorted.length - slotsNeeded; i++) {
            let consecutive = true;
            for (let j = 0; j < slotsNeeded - 1; j++) {
                if (sorted[i + j].hora_fin !== sorted[i + j + 1].hora_inicio) {
                    consecutive = false;
                    break;
                }
            }
            if (consecutive) {
                groups.push({
                    ...sorted[i],
                    hora_fin: sorted[i + slotsNeeded - 1].hora_fin,
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
export function deleteSlotsForRule(regla_id) {
    const slots = getAll('disponibilidad_slots').filter((s) => s.regla_id !== regla_id);
    saveAll('disponibilidad_slots', slots);
}
