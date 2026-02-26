import React, { useState, useEffect } from 'react';
import {
    Settings,
    Type,
    Image as ImageIcon,
    FileText,
    Save,
    Maximize2,
    Palette,
    MapPin,
    Phone,
    Shield
} from 'lucide-react';
import { getAll, saveAll } from '../../store/db';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { toast } from 'react-hot-toast';

export default function GeneralConfig() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const data = getAll('site_config')[0];
        if (data) setConfig(data);
        setLoading(false);
    }, []);

    const handleSave = () => {
        saveAll('site_config', [config]);
        toast.success('Configuración guardada correctamente');
        // Redirigir o recargar si es necesario para aplicar cambios globales
        window.location.reload();
    };

    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setConfig({ ...config, [field]: reader.result });
        };
        reader.readAsDataURL(file);
    };

    if (loading || !config) return <div>Cargando...</div>;

    const fontOptions = ['Inter', 'Montserrat', 'Roboto', 'Outfit', 'Playfair Display', 'System'];

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Configuración General</h2>
                    <p className="text-gray-500 mt-1 font-medium">Personaliza la identidad visual y contenidos de tu clínica</p>
                </div>
                <Button onClick={handleSave} icon={Save} size="lg">Guardar Cambios</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Identidad del Sitio */}
                <div className="card space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <Palette className="text-primary-600" />
                        <h3 className="font-bold text-gray-900">Identidad Visual</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400">Título del Sitio</label>
                                <Input
                                    value={config.titulo}
                                    onChange={e => setConfig({ ...config, titulo: e.target.value.slice(0, 40) })}
                                    placeholder="Nombre de la clínica"
                                />
                                <p className="text-[10px] text-gray-400 text-right">{config.titulo.length}/40</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400 tracking-tighter">Fuente Título</label>
                                    <select
                                        className="input h-11 text-xs font-bold w-full"
                                        value={config.tituloFont}
                                        onChange={e => setConfig({ ...config, tituloFont: e.target.value })}
                                    >
                                        {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400 tracking-tighter">Tamaño (px)</label>
                                    <Input
                                        type="number"
                                        value={config.tituloSize}
                                        onChange={e => setConfig({ ...config, tituloSize: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400">Subtítulo</label>
                                <Input
                                    value={config.subtitulo}
                                    onChange={e => setConfig({ ...config, subtitulo: e.target.value.slice(0, 40) })}
                                    placeholder="Eslogan o descripción corta"
                                />
                                <p className="text-[10px] text-gray-400 text-right">{config.subtitulo.length}/40</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400 tracking-tighter">Fuente Subt.</label>
                                    <select
                                        className="input h-11 text-xs font-bold w-full"
                                        value={config.subtituloFont}
                                        onChange={e => setConfig({ ...config, subtituloFont: e.target.value })}
                                    >
                                        {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400 tracking-tighter">Tamaño (px)</label>
                                    <Input
                                        type="number"
                                        value={config.subtituloSize}
                                        onChange={e => setConfig({ ...config, subtituloSize: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Multimedia */}
                <div className="card space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <ImageIcon className="text-primary-600" />
                        <h3 className="font-bold text-gray-900">Multimedia (WebP recomendado)</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Logo */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase text-gray-400">Logotipo</label>
                            <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                                {config.logo ? (
                                    <img src={config.logo} style={{ width: `${config.logoWidth}px` }} className="h-auto object-contain" alt="Logo preview" />
                                ) : (
                                    <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                                        <ImageIcon size={32} />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/webp, image/*"
                                    className="hidden"
                                    id="logo-upload"
                                    onChange={e => handleFileUpload(e, 'logo')}
                                />
                                <label htmlFor="logo-upload" className="btn-secondary w-full text-center py-2 cursor-pointer text-xs">Cambiar Logo</label>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between">
                                    Ancho Logo: <span>{config.logoWidth}px</span>
                                </label>
                                <input
                                    type="range" min="20" max="200" step="5"
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    value={config.logoWidth}
                                    onChange={e => setConfig({ ...config, logoWidth: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Foto Personal */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase text-gray-400">Foto "Quién Soy"</label>
                            <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                                {config.foto ? (
                                    <img src={config.foto} style={{ width: `${config.fotoWidth}px` }} className="h-auto object-cover rounded-xl shadow-md" alt="Foto preview" />
                                ) : (
                                    <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                                        <Maximize2 size={32} />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/webp, image/*"
                                    className="hidden"
                                    id="foto-upload"
                                    onChange={e => handleFileUpload(e, 'foto')}
                                />
                                <label htmlFor="foto-upload" className="btn-secondary w-full text-center py-2 cursor-pointer text-xs">Cambiar Foto</label>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between">
                                    Ancho Foto: <span>{config.fotoWidth}px</span>
                                </label>
                                <input
                                    type="range" min="100" max="800" step="10"
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    value={config.fotoWidth}
                                    onChange={e => setConfig({ ...config, fotoWidth: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenido Amplio */}
                <div className="card space-y-6 lg:col-span-2">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <FileText className="text-primary-600" />
                        <h3 className="font-bold text-gray-900">Sección "Quién Soy" y Curriculum</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-widest">Currículum / Texto Biográfico</label>
                            <textarea
                                className="input min-h-[300px] w-full p-6 text-sm resize-none"
                                value={config.curriculum}
                                onChange={e => setConfig({ ...config, curriculum: e.target.value })}
                                style={{
                                    fontFamily: config.curriculumFont === 'System' ? 'sans-serif' : config.curriculumFont,
                                    lineHeight: config.curriculumHeight
                                }}
                            />
                        </div>
                        <div className="space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 h-fit">
                            <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-4">Estilo de Texto</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-gray-400">Tipo de letra</label>
                                    <select
                                        className="input h-10 text-xs font-bold w-full"
                                        value={config.curriculumFont}
                                        onChange={e => setConfig({ ...config, curriculumFont: e.target.value })}
                                    >
                                        {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 flex justify-between">
                                        Altura de línea: <span>{config.curriculumHeight}</span>
                                    </label>
                                    <input
                                        type="range" min="1" max="2.5" step="0.1"
                                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                        value={config.curriculumHeight}
                                        onChange={e => setConfig({ ...config, curriculumHeight: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card space-y-6 lg:col-span-2">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <MapPin className="text-primary-600" />
                        <h3 className="font-bold text-gray-900">Sección de Centros</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-widest">Información de los Centros</label>
                            <textarea
                                className="input min-h-[300px] w-full p-6 text-sm resize-none"
                                value={config.centrosTexto}
                                onChange={e => setConfig({ ...config, centrosTexto: e.target.value })}
                                style={{
                                    fontFamily: config.centrosFont === 'System' ? 'sans-serif' : config.centrosFont,
                                    lineHeight: config.centrosHeight
                                }}
                            />
                        </div>
                        <div className="space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 h-fit">
                            <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-4">Estilo de Texto</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-gray-400">Tipo de letra</label>
                                    <select
                                        className="input h-10 text-xs font-bold w-full"
                                        value={config.centrosFont}
                                        onChange={e => setConfig({ ...config, centrosFont: e.target.value })}
                                    >
                                        {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 flex justify-between">
                                        Altura de línea: <span>{config.centrosHeight}</span>
                                    </label>
                                    <input
                                        type="range" min="1" max="2.5" step="0.1"
                                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                        value={config.centrosHeight}
                                        onChange={e => setConfig({ ...config, centrosHeight: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card space-y-6 lg:col-span-2">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <Phone className="text-primary-600" />
                        <h3 className="font-bold text-gray-900">Sección de Contacto</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400 tracking-widest">Email de Contacto</label>
                                <Input
                                    type="email"
                                    value={config.contactoEmail}
                                    onChange={e => setConfig({ ...config, contactoEmail: e.target.value })}
                                    placeholder="ejemplo@clinica.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400 tracking-widest">Texto Informativo de Contacto</label>
                                <textarea
                                    className="input min-h-[300px] w-full p-6 text-sm resize-none"
                                    value={config.contactoTexto}
                                    onChange={e => setConfig({ ...config, contactoTexto: e.target.value })}
                                    style={{
                                        fontFamily: config.contactoFont === 'System' ? 'sans-serif' : config.contactoFont,
                                        lineHeight: config.contactoHeight
                                    }}
                                />
                            </div>
                        </div>
                        <div className="space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 h-fit">
                            <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-4">Estilo de Texto</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-gray-400">Tipo de letra</label>
                                    <select
                                        className="input h-10 text-xs font-bold w-full"
                                        value={config.contactoFont}
                                        onChange={e => setConfig({ ...config, contactoFont: e.target.value })}
                                    >
                                        {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 flex justify-between">
                                        Altura de línea: <span>{config.contactoHeight}</span>
                                    </label>
                                    <input
                                        type="range" min="1" max="2.5" step="0.1"
                                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                        value={config.contactoHeight}
                                        onChange={e => setConfig({ ...config, contactoHeight: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card space-y-6 lg:col-span-2">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <Shield className="text-primary-600" />
                        <h3 className="font-bold text-gray-900">Textos Legales</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-widest">Aviso Legal</label>
                            <textarea
                                className="input h-[300px] w-full p-4 text-xs resize-none font-mono"
                                value={config.legalAviso}
                                onChange={e => setConfig({ ...config, legalAviso: e.target.value })}
                                placeholder="Pega aquí el texto del Aviso Legal..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-widest">Política de Privacidad</label>
                            <textarea
                                className="input h-[300px] w-full p-4 text-xs resize-none font-mono"
                                value={config.legalPrivacidad}
                                onChange={e => setConfig({ ...config, legalPrivacidad: e.target.value })}
                                placeholder="Pega aquí la Política de Privacidad..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-widest">Política de Cookies</label>
                            <textarea
                                className="input h-[300px] w-full p-4 text-xs resize-none font-mono"
                                value={config.legalCookies}
                                onChange={e => setConfig({ ...config, legalCookies: e.target.value })}
                                placeholder="Pega aquí la Política de Cookies..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
