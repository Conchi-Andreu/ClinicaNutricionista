// ====================================================
// db.js — LocalStorage Database Engine
// Simulates a relational PostgreSQL-like structure
// ====================================================

const COLLECTIONS = [
    'tecnicos',
    'centros_salas',
    'tipos_visita',
    'planificacion_reglas',
    'disponibilidad_slots',
    'citas',
    'pacientes',
    'usuarios',
    'site_config',
];

// ─── Generic CRUD ────────────────────────────────────

export function getAll(collection) {
    try {
        return JSON.parse(localStorage.getItem(collection) || '[]');
    } catch {
        return [];
    }
}

export function getById(collection, id) {
    return getAll(collection).find((item) => item.id === id) || null;
}

export function create(collection, data) {
    const items = getAll(collection);
    const newItem = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    localStorage.setItem(collection, JSON.stringify([...items, newItem]));
    return newItem;
}

export function update(collection, id, data) {
    const items = getAll(collection);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    localStorage.setItem(collection, JSON.stringify(items));
    return updated;
}

export function remove(collection, id) {
    const items = getAll(collection).filter((i) => i.id !== id);
    localStorage.setItem(collection, JSON.stringify(items));
}

export function saveAll(collection, items) {
    localStorage.setItem(collection, JSON.stringify(items));
}

// ─── Seed Data ───────────────────────────────────────

export function seedInitialData() {
    if (localStorage.getItem('__seeded__')) return;

    // Usuarios (admin + tecnicos + pacientes)
    const admin = { id: 'usr-admin', nombre: 'Administrador', apellidos: 'Sistema', email: 'admin@clinica.com', password: 'admin123', rol: 'admin', activo: true, createdAt: new Date().toISOString() };
    const tec1User = { id: 'usr-tec1', nombre: 'Laura', apellidos: 'García Martínez', email: 'laura@clinica.com', password: 'pass123', rol: 'tecnico', activo: true, createdAt: new Date().toISOString() };
    const pac1 = { id: 'usr-pac1', nombre: 'Ana', apellidos: 'Fernández Torres', email: 'ana@email.com', password: 'ana123', rol: 'paciente', activo: true, telefono: '612345678', tecnico_asignado_id: 'tec-001', centro_asignado_id: 'cen-001', createdAt: new Date().toISOString() };
    const pac2 = { id: 'usr-pac2', nombre: 'Pedro', apellidos: 'Morales Gil', email: 'pedro@email.com', password: 'pedro123', rol: 'paciente', activo: true, telefono: '698765432', tecnico_asignado_id: 'tec-002', centro_asignado_id: 'cen-002', createdAt: new Date().toISOString() };
    localStorage.setItem('usuarios', JSON.stringify([admin, tec1User, pac1, pac2]));

    // Técnicos (vincular a usuario)
    const t1 = { id: 'tec-001', nombre: 'Laura', apellidos: 'García Martínez', email: 'laura@clinica.com', especialidad: 'Nutrición Clínica', password_hash: 'pass123', avatar: null, usuario_id: 'usr-tec1', createdAt: new Date().toISOString() };
    const t2 = { id: 'tec-002', nombre: 'Carlos', apellidos: 'Reyes López', email: 'carlos@clinica.com', especialidad: 'Nutrición Deportiva', password_hash: 'pass123', avatar: null, createdAt: new Date().toISOString() };
    const t3 = { id: 'tec-003', nombre: 'Marta', apellidos: 'Sánchez Vidal', email: 'marta@clinica.com', especialidad: 'Nutrición Pediátrica', password_hash: 'pass123', avatar: null, createdAt: new Date().toISOString() };
    localStorage.setItem('tecnicos', JSON.stringify([t1, t2, t3]));

    // Centros/Salas
    const c1 = { id: 'cen-001', nombre: 'Centro Norte', direccion: 'Calle Mayor 12, Madrid', capacidad: 3, activo: true, horaApertura: '09:00', horaCierre: '20:00', createdAt: new Date().toISOString() };
    const c2 = { id: 'cen-002', nombre: 'Sala Sur - Consulta A', direccion: 'Av. del Sur 45, Madrid', capacidad: 1, activo: true, horaApertura: '08:00', horaCierre: '18:00', createdAt: new Date().toISOString() };
    const c3 = { id: 'cen-003', nombre: 'Centro Online', direccion: 'Videollamada', capacidad: 10, activo: true, horaApertura: '07:00', horaCierre: '22:00', createdAt: new Date().toISOString() };
    localStorage.setItem('centros_salas', JSON.stringify([c1, c2, c3]));

    // Tipos de visita
    const v1 = { id: 'vis-001', nombre: 'Primera Consulta', descripcion: 'Evaluación inicial completa con análisis nutricional', duracion_minutos: 60, color_hex: '#1A6B4A', createdAt: new Date().toISOString() };
    const v2 = { id: 'vis-002', nombre: 'Seguimiento', descripcion: 'Revisión de progreso y ajuste de plan alimentario', duracion_minutos: 30, color_hex: '#4db88d', createdAt: new Date().toISOString() };
    const v3 = { id: 'vis-003', nombre: 'Control Mensual', descripcion: 'Pesaje y control de parámetros mensuales', duracion_minutos: 20, color_hex: '#82d2ae', createdAt: new Date().toISOString() };
    const v4 = { id: 'vis-004', nombre: 'Plan Deportivo', descripcion: 'Diseño de dieta para rendimiento deportivo', duracion_minutos: 60, color_hex: '#2563eb', createdAt: new Date().toISOString() };
    localStorage.setItem('tipos_visita', JSON.stringify([v1, v2, v3, v4]));

    // Pacientes (tabla extendida)
    const p1 = { id: 'pac-001', nombre: 'Ana', apellidos: 'Fernández Torres', email: 'ana@email.com', telefono: '612345678', tecnico_asignado_id: 'tec-001', centro_asignado_id: 'cen-001', usuario_id: 'usr-pac1', createdAt: new Date().toISOString() };
    const p2 = { id: 'pac-002', nombre: 'Pedro', apellidos: 'Morales Gil', email: 'pedro@email.com', telefono: '698765432', tecnico_asignado_id: 'tec-002', centro_asignado_id: 'cen-002', usuario_id: 'usr-pac2', createdAt: new Date().toISOString() };
    localStorage.setItem('pacientes', JSON.stringify([p1, p2]));

    localStorage.setItem('disponibilidad_slots', JSON.stringify([]));
    localStorage.setItem('citas', JSON.stringify([]));
    localStorage.setItem('planificacion_reglas', JSON.stringify([]));

    // Configuración Inicial del Sitio
    const defaultConfig = {
        id: 'global-config',
        titulo: 'Clínica Nutricionista',
        tituloFont: 'Montserrat',
        tituloSize: '24',
        subtitulo: 'Expertos en Salud Nutricional',
        subtituloFont: 'Inter',
        subtituloSize: '12',
        logo: null, // Guardaremos Base64 o URL
        logoWidth: '40',
        foto: null,
        fotoWidth: '300',
        curriculum: 'Bienvenido a nuestra clínica. Contamos con años de experiencia en el sector...',
        curriculumFont: 'Inter',
        curriculumHeight: '1.6',
        centrosTexto: 'Nuestros centros están equipados con la última tecnología...',
        centrosFont: 'Inter',
        centrosHeight: '1.6',
        contactoTexto: 'Puedes contactarnos en el teléfono 900 123 456 o en el email hola@clinica.com...',
        contactoFont: 'Inter',
        contactoHeight: '1.6',
        contactoEmail: 'hola@clinica.com',
        legalAviso: 'AVISO LEGAL\\n\\n1. INFORMACIÓN IDENTIFICATIVA\\nTitular: Clínica Nutricionista Profesional\\nCIF/NIF: [A rellenar]\\nDirección: [Dirección Física de la Clínica]\\nEmail: hola@clinica.com\\nColegio Profesional: Colegio de Dietistas-Nutricionistas (Número de Colegiado: [A rellenar])\\n\\n2. CONDICIONES DE USO\\nEl acceso y/o uso de este portal le atribuye la condición de USUARIO, que acepta estas Condiciones.\\n\\n3. PROPIEDAD INTELECTUAL\\nLos contenidos (textos, imágenes, logos) son propiedad del titular.',
        legalPrivacidad: 'POLÍTICA DE PRIVACIDAD\\n\\n1. FINALIDAD\\nGestión de citas y planes nutricionales.\\n\\n2. TRATAMIENTO DE DATOS\\nSus datos de salud son tratados con confidencialidad bajo la base legal de asistencia sanitaria.\\n\\n3. DERECHOS\\nPuede ejercer sus derechos (ARCO) enviando un email a: privacidad@clinica.com',
        legalCookies: 'POLÍTICA DE COOKIES\\n\\n1. COOKIES TÉCNICAS (Necesarias)\\nPara identificar la sesión y el acceso al Portal del Paciente.\\n\\n2. PERSONALIZACIÓN Y ANÁLISIS\\nPara mejorar la experiencia y estadísticas de uso.'
    };
    localStorage.setItem('site_config', JSON.stringify([defaultConfig]));

    localStorage.setItem('__seeded__', 'true');
}

// Migration: Ensure site_config exists even for old sessions
if (!localStorage.getItem('site_config')) {
    const defaultConfig = {
        id: 'global-config',
        titulo: 'Clínica Nutricionista',
        tituloFont: 'Montserrat',
        tituloSize: '24',
        subtitulo: 'Expertos en Salud Nutricional',
        subtituloFont: 'Inter',
        subtituloSize: '12',
        logo: null,
        logoWidth: '40',
        foto: null,
        fotoWidth: '300',
        curriculum: 'Bienvenido a nuestra clínica. Contamos con años de experiencia en el sector...',
        curriculumFont: 'Inter',
        curriculumHeight: '1.6',
        centrosTexto: 'Nuestros centros están equipados con la última tecnología...',
        centrosFont: 'Inter',
        centrosHeight: '1.6',
        contactoTexto: 'Puedes contactarnos en el teléfono 900 123 456 o en el email hola@clinica.com...',
        contactoFont: 'Inter',
        contactoHeight: '1.6',
        contactoEmail: 'hola@clinica.com',
        legalAviso: 'AVISO LEGAL\\n\\n1. INFORMACIÓN IDENTIFICATIVA\\nTitular: Clínica Nutricionista Profesional\\nCIF/NIF: [A rellenar]\\nDirección: [Dirección Física de la Clínica]\\nEmail: hola@clinica.com\\nColegio Profesional: Colegio de Dietistas-Nutricionistas (Número de Colegiado: [A rellenar])\\n\\n2. CONDICIONES DE USO\\nEl acceso y/o uso de este portal le atribuye la condición de USUARIO, que acepta estas Condiciones.\\n\\n3. PROPIEDAD INTELECTUAL\\nLos contenidos (textos, imágenes, logos) son propiedad del titular.',
        legalPrivacidad: 'POLÍTICA DE PRIVACIDAD\\n\\n1. FINALIDAD\\nGestión de citas y planes nutricionales.\\n\\n2. TRATAMIENTO DE DATOS\\nSus datos de salud son tratados con confidencialidad bajo la base legal de asistencia sanitaria.\\n\\n3. DERECHOS\\nPuede ejercer sus derechos (ARCO) enviando un email a: privacidad@clinica.com',
        legalCookies: 'POLÍTICA DE COOKIES\\n\\n1. COOKIES TÉCNICAS (Necesarias)\\nPara identificar la sesión y el acceso al Portal del Paciente.\\n\\n2. PERSONALIZACIÓN Y ANÁLISIS\\nPara mejorar la experiencia y estadísticas de uso.'
    };
    localStorage.setItem('site_config', JSON.stringify([defaultConfig]));
}

// Final check to ensure legal texts are populated in existing installs
const existingConfig = JSON.parse(localStorage.getItem('site_config') || '[]');
if (existingConfig.length > 0 && (!existingConfig[0].legalAviso || existingConfig[0].legalAviso.length < 500)) {
    existingConfig[0].legalAviso = `AVISO LEGAL Y CONDICIONES GENERALES DE USO

1. INFORMACIÓN IDENTIFICATIVA
En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se hace constar que el titular de este sitio web es Gemma Pascual (en adelante, la Clínica), con domicilio en [DIRECCIÓN COMPLETA DE LA CLÍNICA]. Email de contacto: hola@clinica.com. NIF: [NIF DEL TITULAR]. 

Como profesional sanitario, se hace constar que el titular pertenece al Colegio Oficial de Dietistas-Nutricionistas de [PROVINCIA], con número de colegiado [NÚMERO].

2. OBJETO Y ÁMBITO DE APLICACIÓN
Las presentes Condiciones Generales regulan el acceso, navegación y uso del sitio web, así como las responsabilidades derivadas de la utilización de sus contenidos. El acceso a la web atribuye la condición de Usuario, aceptando plenamente todas y cada una de las condiciones aquí incluidas.

3. PROPIEDAD INTELECTUAL E INDUSTRIAL
El Titular por sí o como cesionaria, es dueña de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma (título enunciativo: imágenes, sonido, audio, vídeo, software o textos; marcas o logotipos, combinaciones de colores, estructura y diseño). Todos los derechos reservados.

4. EXCLUSIÓN DE GARANTÍAS Y RESPONSABILIDAD
El Titular no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos o lesivos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.`;

    existingConfig[0].legalPrivacidad = `POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS (RGPD)

1. RESPONSABLE DEL TRATAMIENTO
Responsable: Gemma Pascual 
Dirección: [DIRECCIÓN COMPLETA]
Email: privacidad@clinica.com

2. CATEGORÍAS DE DATOS Y FINALIDAD
Tratamos datos identificativos (nombre, apellidos, DNI, contacto) y categorías especiales de datos (datos de salud, antecedentes médicos, hábitos alimentarios). La finalidad es la prestación de servicios de asistencia sanitaria nutricional, gestión de citas, seguimiento clínico y facturación.

3. LEGITIMACIÓN DEL TRATAMIENTO
La base legal para el tratamiento de sus datos es:
- El consentimiento explícito del interesado (Artículo 9.2.a del RGPD).
- La prestación de asistencia sanitaria o tratamiento bajo la responsabilidad de un profesional sanitario sujeto al secreto profesional (Artículo 9.2.h del RGPD).

4. PLAZO DE CONSERVACIÓN
De acuerdo con la Ley 41/2002 de autonomía del paciente, la historia clínica se conservará durante el tiempo que sea necesario para la atención sanitaria y, como mínimo, durante cinco años contados desde la fecha del alta de cada proceso asistencial.

5. DESTINATARIOS
No se cederán datos a terceros salvo obligación legal o que sea estrictamente necesario para la prestación del servicio sanitario (laboratorios, centros de análisis).

6. DERECHOS
Cualquier persona tiene derecho a obtener confirmación sobre si estamos tratando datos personales que les conciernan o no. Las personas interesadas tienen derecho a acceder a sus datos personales, así como a solicitar la rectificación de los datos inexactos o, en su caso, solicitar su supresión cuando, entre otros motivos, los datos ya no sean necesarios para los fines que fueron recogidos.`;

    existingConfig[0].legalCookies = `POLÍTICA DE COOKIES DETALLADA

Este sitio web utiliza cookies para mejorar la navegación del usuario y obtener datos estadísticos.

1. ¿QUÉ SON LAS COOKIES?
Una cookie es un fichero que se descarga en su ordenador al acceder a determinadas páginas web. Las cookies permiten a una página web, entre otras cosas, almacenar y recuperar información sobre los hábitos de navegación de un usuario o de su equipo.

2. TIPOS DE COOKIES UTILIZADAS EN ESTE SITIO WEB
- COOKIES TÉCNICAS: Son esenciales para el funcionamiento del Portal del Paciente. Gestionan el inicio de sesión y la seguridad de la cuenta. No pueden ser desactivadas sin que la web deje de funcionar correctamente.
- COOKIES DE PERSONALIZACIÓN: Permiten recordar preferencias como el idioma o configuraciones de visualización de tablas.
- COOKIES ANALÍTICAS (Si se activan): Recopilan información sobre el uso del sitio de forma anónima para realizar análisis estadísticos de tráfico.

3. GESTIÓN Y DESACTIVACIÓN DE COOKIES
Usted puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones del navegador instalado en su ordenador:
- Chrome
- Firefox
- Microsoft Edge
- Safari

Si bloquea el uso de cookies en su navegador es posible que algunos servicios o funcionalidades de la página web no estén disponibles.`;

    localStorage.setItem('site_config', JSON.stringify(existingConfig));
}

/**
 * Deletes all FREE slots for a specific tecnico, centro and date range.
 */
export function deleteSlotsBySelection(tecnico_id, centro_id, fecha_desde, fecha_hasta) {
    const slots = getAll('disponibilidad_slots');
    const initialCount = slots.length;

    const cleanedSlots = slots.filter(s => {
        // Only consider 'libre' slots for deletion
        if (s.estado !== 'libre') return true;

        const isSameTecnico = String(s.tecnico_id) === String(tecnico_id);
        const isSameCentro = String(s.centro_id) === String(centro_id);
        const isInRange = s.fecha >= fecha_desde && s.fecha <= fecha_hasta;

        return !(isSameTecnico && isSameCentro && isInRange);
    });

    saveAll('disponibilidad_slots', cleanedSlots);
    return { removed: initialCount - cleanedSlots.length };
}

/**
 * Puesta a cero de la base de datos para producción.
 * Borra todo excepto al administrador actual.
 */
export function factoryReset(currentAdminId) {
    const adminUser = getAll('usuarios').find(u => u.id === currentAdminId);

    // Lista de colecciones a vaciar
    const collectionsToClear = [
        'tecnicos',
        'centros_salas',
        'tipos_visita',
        'planificacion_reglas',
        'disponibilidad_slots',
        'citas',
        'pacientes'
    ];

    collectionsToClear.forEach(col => {
        localStorage.setItem(col, JSON.stringify([]));
    });

    // En usuarios solo dejamos al admin que ha hecho el reset
    localStorage.setItem('usuarios', JSON.stringify(adminUser ? [adminUser] : []));

    // Marcamos como no sembrado para que no se recarguen los datos de ejemplo
    localStorage.setItem('__seeded__', 'true');

    return true;
}
