import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, Camera, User, Calendar, MapPin, Phone, Mail, Award,
    Sparkles, ShieldCheck, Save, CheckCircle2, Briefcase, Star, TrendingUp, Crown, Trash2, Search, Shirt, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProfileAPI, saveProfileAPI } from '../services/api.js';

export const Profile = ({ globalUser, onBack, onProfileUpdated }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const fileInputRef = useRef(null);

    const loginCode = String(globalUser?.username || 'COLABORADOR').toUpperCase();

    const [profile, setProfile] = useState({
        username: loginCode,
        name: globalUser?.name || '',
        role: globalUser?.role || 'VENDEDOR',
        storeName: 'LP RAPOSO',
        storeCode: 'K7W8',
        birthDate: '',
        age: '',
        phone: '',
        email: '',
        address: '',
        addressNumber: '',
        neighborhood: '',
        city: '',
        state: 'SP',
        cep: '',
        uniformShirt: '',
        uniformPants: '',
        uniformJacket: '',
        bio: '',
        admissionDate: '',
        specialty: '',
        featuredIndicator: '',
        featuredPeriod: '',
        featuredNote: '',
        photoUrl: ''
    });

    const [highlights, setHighlights] = useState({
        totals: { receita: 0, posPago: 0, controle: 0, fibra: 0, tv: 0, devices: 0, adicionais: 0, portabilidade: 0, totalVendas: 0 },
        topSpotlight: {
            indicator: 'PERFORMANCE GLOBAL & ATENDIMENTO CONSULTIVO',
            period: `Temporada ${new Date().getFullYear()}`,
            note: 'Profissional reconhecido pela excelência na condução de propostas e fidelização de clientes.'
        },
        badges: []
    });

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetchProfileAPI(loginCode);
                if (mounted && res?.profile) {
                    setProfile(prev => ({ ...prev, ...res.profile }));
                }
                if (mounted && res?.highlights) {
                    setHighlights(res.highlights);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [loginCode]);

    const lookupCep = async (rawCep) => {
        const cleanCep = String(rawCep || '').replace(/\D/g, '');
        if (cleanCep.length !== 8) {
            toast.error('Digite um CEP válido com 8 dígitos (Ex: 05577-200).');
            return;
        }
        setLoadingCep(true);
        try {
            let data = null;
            try {
                const r1 = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const j1 = await r1.json();
                if (j1 && !j1.erro) {
                    data = {
                        address: j1.logradouro || '',
                        neighborhood: j1.bairro || '',
                        city: j1.localidade || '',
                        state: j1.uf || ''
                    };
                }
            } catch (err1) {}

            if (!data) {
                const r2 = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
                if (r2.ok) {
                    const j2 = await r2.json();
                    data = {
                        address: j2.street || '',
                        neighborhood: j2.neighborhood || '',
                        city: j2.city || '',
                        state: j2.state || ''
                    };
                }
            }

            if (data) {
                setProfile(prev => ({
                    ...prev,
                    cep: `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`,
                    address: data.address || prev.address,
                    neighborhood: data.neighborhood || prev.neighborhood,
                    city: data.city || prev.city,
                    state: (data.state || prev.state || 'SP').toUpperCase()
                }));
                toast.success('Endereço localizado pelo CEP!');
            } else {
                toast.error('CEP não encontrado.');
            }
        } catch (err) {
            toast.error('Não foi possível consultar o CEP no momento.');
        } finally {
            setLoadingCep(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'cep') {
            const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
            const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
            setProfile(prev => ({ ...prev, cep: formatted }));
            if (digits.length === 8) {
                lookupCep(digits);
            }
            return;
        }
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxDim = 320;
                let w = img.width;
                let h = img.height;
                if (w > h) {
                    if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
                } else {
                    if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
                const nextProfile = { ...profile, photoUrl: compressedBase64 };
                setProfile(nextProfile);
                if (onProfileUpdated) {
                    onProfileUpdated({ name: nextProfile.name, photoUrl: compressedBase64 });
                }
                saveProfileAPI(loginCode, nextProfile)
                    .then(() => toast.success('Foto de perfil atualizada e sincronizada!'))
                    .catch(() => toast.success('Foto carregada! Clique em "Salvar Perfil" para confirmar.'));
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = async () => {
        if (!profile.photoUrl) return;
        const nextProfile = { ...profile, photoUrl: '' };
        setProfile(nextProfile);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onProfileUpdated) {
            onProfileUpdated({ name: nextProfile.name, photoUrl: '' });
        }
        try {
            await saveProfileAPI(loginCode, nextProfile);
            toast.success('Foto de perfil removida com sucesso!');
        } catch (err) {
            toast.error('Erro ao sincronizar remoção da foto.');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await saveProfileAPI(loginCode, profile);
            if (res?.profile) {
                setProfile(prev => ({ ...prev, ...res.profile }));
                if (onProfileUpdated) {
                    onProfileUpdated({ name: res.profile.name, photoUrl: res.profile.photoUrl });
                }
            }
            toast.success('Perfil salvo e atualizado com sucesso!');
        } catch (err) {
            toast.error(err.message || 'Não foi possível salvar o perfil.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#F7F7F8] dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 flex flex-col animate-fade-in overflow-y-auto">
            {/* Barra Superior Minimalista (Tela Individual mantendo a mesma URL) */}
            <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 sm:px-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-[#E3000F] hover:text-white text-neutral-700 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                    >
                        <ArrowLeft size={15} />
                        <span>Voltar ao Painel</span>
                    </button>
                    <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />
                    <span className="text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 hidden sm:inline">
                        Espaço do Colaborador • Perfil Executivo
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                        {loginCode} - {profile.name}
                    </span>
                </div>
            </header>

            <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                {/* Hero Card Fino & Elegante do Perfil */}
                <section className="relative rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
                    <div className="h-28 sm:h-36 bg-gradient-to-r from-neutral-900 via-[#2a080c] to-[#E3000F] relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_60%)]" />
                        <div className="absolute bottom-3 right-5 hidden sm:flex items-center gap-2 bg-black/35 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-white text-[11px] font-bold tracking-wider uppercase">
                            <Sparkles size={13} className="text-amber-400" />
                            <span>{profile.storeName} • {profile.storeCode}</span>
                        </div>
                    </div>

                    <div className="px-5 sm:px-8 pb-6 pt-4 sm:pt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10 bg-white dark:bg-neutral-900">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                            {/* Avatar / Upload de Foto */}
                            <div className="relative group w-24 h-24 sm:w-28 sm:h-28 -mt-16 sm:-mt-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-4 border-white dark:border-neutral-900 shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                                {profile.photoUrl ? (
                                    <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-neutral-400 dark:text-neutral-500" />
                                )}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold uppercase tracking-wider gap-1 cursor-pointer"
                                    title="Alterar Foto de Perfil"
                                >
                                    <Camera size={18} />
                                    <span>Foto</span>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                />
                            </div>

                            <div className="pt-1 sm:pb-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-white uppercase">
                                        {profile.name || 'COLABORADOR'}
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-[#E3000F]/15 text-[#E3000F] border border-red-200/60 dark:border-[#E3000F]/30">
                                        {profile.role}
                                    </span>
                                </div>
                                <p className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500 mt-0.5 uppercase tracking-wider">
                                    LOGIN: {loginCode} • {String(profile.role || 'COLABORADOR').toUpperCase()}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-end">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition-colors"
                            >
                                <Camera size={14} className="text-[#E3000F]" />
                                <span>{profile.photoUrl ? 'Trocar Foto' : 'Adicionar Foto'}</span>
                            </button>
                            {profile.photoUrl && (
                                <button
                                    type="button"
                                    onClick={handleRemovePhoto}
                                    className="px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 transition-colors"
                                    title="Remover foto do perfil"
                                >
                                    <Trash2 size={14} />
                                    <span>Remover Foto</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 rounded-xl bg-[#E3000F] hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-500/20 flex items-center gap-1.5 transition-all"
                            >
                                <Save size={14} />
                                <span>{saving ? 'Salvando...' : 'Salvar Perfil'}</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* VITRINE ELEGANTE DE DESTAQUE AO LONGO DO ANO / MÊS */}
                <section className="rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-[#1f070a] text-white p-6 sm:p-8 shadow-lg border border-neutral-800 relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 opacity-5 pointer-events-none">
                        <Crown size={180} />
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 border-b border-white/10 pb-6">
                        <div className="space-y-2 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                                <Award size={13} />
                                <span>Categoria de Destaque Automática • Melhor Indicador</span>
                            </div>
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
                                {highlights.topSpotlight?.indicator || profile.featuredIndicator || 'PERFORMANCE GLOBAL & ATENDIMENTO CONSULTIVO'}
                            </h2>
                            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                                {highlights.topSpotlight?.note || profile.featuredNote}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 shrink-0">
                            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                                <TrendingUp size={22} />
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                    Melhor Período Apurado
                                </span>
                                <span className="text-base font-black text-amber-300 uppercase">
                                    {highlights.topSpotlight?.period || profile.featuredPeriod || `Temporada ${new Date().getFullYear()}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Insígnias de Especialidade por Indicador */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-6 relative z-10">
                        {(highlights.badges || []).map((b) => (
                            <div
                                key={b.id}
                                className={`rounded-2xl p-4 border transition-all ${
                                    b.active
                                        ? 'bg-white/10 border-amber-400/40 shadow-md'
                                        : 'bg-white/[0.03] border-white/10 opacity-80'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">
                                        {b.tier}
                                    </span>
                                    <Star size={13} className={b.active ? 'text-amber-400 fill-amber-400' : 'text-neutral-500'} />
                                </div>
                                <div className="text-xs font-black text-white uppercase leading-snug mb-1">
                                    {b.indicator}
                                </div>
                                <p className="text-[11px] text-neutral-300 leading-relaxed mb-2">
                                    {b.metricLabel}
                                </p>
                                <div className="text-[10px] font-mono text-amber-300/90 font-semibold">
                                    Ref: {b.period}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FORMULÁRIO DE DADOS PESSOAIS, ENDEREÇO E CONFIGURAÇÃO DE DESTAQUE */}
                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Coluna 1: Dados Pessoais & Contato */}
                    <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
                        <div className="flex items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                            <div className="p-2 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F]">
                                <User size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                                    Dados Pessoais & Identificação
                                </h3>
                                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                                    Mantenha seu cadastro pessoal, idade, data e endereço atualizados
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                            <div className="sm:col-span-8">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleChange}
                                    placeholder="Seu nome completo"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold uppercase text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>

                            <div className="sm:col-span-4">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    Idade
                                </label>
                                <input
                                    type="number"
                                    name="age"
                                    value={profile.age}
                                    onChange={handleChange}
                                    placeholder="Ex: 26"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>

                            <div className="sm:col-span-4">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    Data de Nascimento
                                </label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={profile.birthDate}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>

                            <div className="sm:col-span-4">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    Telefone / WhatsApp
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    placeholder="(11) 90000-0000"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>

                            <div className="sm:col-span-4">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    Data de Admissão / Início
                                </label>
                                <input
                                    type="date"
                                    name="admissionDate"
                                    value={profile.admissionDate}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>

                            <div className="sm:col-span-12">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    E-mail Corporativo / Pessoal
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                    placeholder="colaborador@corporativo.com.br"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>

                            <div className="sm:col-span-5">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    CEP (Busca Automática)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="cep"
                                        value={profile.cep}
                                        onChange={handleChange}
                                        placeholder="00000-000"
                                        maxLength={9}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold font-mono text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => lookupCep(profile.cep)}
                                        disabled={loadingCep}
                                        className="px-3 py-2.5 rounded-xl bg-[#E3000F] hover:bg-red-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 transition-colors shadow-sm"
                                        title="Buscar Endereço pelo CEP"
                                    >
                                        <Search size={13} />
                                        <span>{loadingCep ? '...' : 'CEP'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="sm:col-span-5">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    Cidade
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={profile.city}
                                    onChange={handleChange}
                                    placeholder="São Paulo"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    UF
                                </label>
                                <input
                                    type="text"
                                    name="state"
                                    maxLength={2}
                                    value={profile.state}
                                    onChange={handleChange}
                                    placeholder="SP"
                                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold uppercase text-center text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    Endereço Residencial (Rua / Avenida)
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={profile.address}
                                    onChange={handleChange}
                                    placeholder="Preenchido pelo CEP ou digite a rua..."
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    Nº / Compl.
                                </label>
                                <input
                                    type="text"
                                    name="addressNumber"
                                    value={profile.addressNumber || ''}
                                    onChange={handleChange}
                                    placeholder="Ex: 120"
                                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>

                            <div className="sm:col-span-4">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    Bairro
                                </label>
                                <input
                                    type="text"
                                    name="neighborhood"
                                    value={profile.neighborhood}
                                    onChange={handleChange}
                                    placeholder="Bairro"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>

                            {/* BLOCO TAMANHO DE UNIFORME (CAMISETA, CALÇA E BLUSA) */}
                            <div className="sm:col-span-12 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 rounded-lg bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F]">
                                        <Shirt size={15} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                                            Tamanho de Uniforme
                                        </h4>
                                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                            Informe as numerações de Camiseta, Calça e Blusa/Jaqueta
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                            Camiseta
                                        </label>
                                        <select
                                            name="uniformShirt"
                                            value={profile.uniformShirt || ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                        >
                                            <option value="">Selecione</option>
                                            {['PP', 'P', 'M', 'G', 'GG', 'XG', 'EXG', 'BABY LOOK P', 'BABY LOOK M', 'BABY LOOK G'].map(sz => (
                                                <option key={sz} value={sz}>{sz}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                            Calça
                                        </label>
                                        <select
                                            name="uniformPants"
                                            value={profile.uniformPants || ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                        >
                                            <option value="">Selecione</option>
                                            {['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', 'P', 'M', 'G', 'GG'].map(sz => (
                                                <option key={sz} value={sz}>{sz}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                            Blusa / Jaqueta
                                        </label>
                                        <select
                                            name="uniformJacket"
                                            value={profile.uniformJacket || ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                        >
                                            <option value="">Selecione</option>
                                            {['PP', 'P', 'M', 'G', 'GG', 'XG', 'EXG'].map(sz => (
                                                <option key={sz} value={sz}>{sz}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna 2: Categoria de Destaque Automática & Especialidade do Vendedor */}
                    <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between space-y-5">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-2.5 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                                        <Award size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                                            Selo de Destaque no Ano / Mês
                                        </h3>
                                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                                            Calculado automaticamente onde você é melhor
                                        </p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                                    <Sparkles size={11} /> Automático
                                </span>
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    <span>Especialidade Principal Apurada</span>
                                    <Lock size={11} className="text-amber-500" />
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={highlights.topSpotlight?.specialty || profile.specialty || 'Consultoria Completa (Móvel, Fibra & Devices)'}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-xs font-bold text-amber-900 dark:text-amber-300 outline-none cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    <span>Categoria de Destaque (Melhor Indicador)</span>
                                    <Lock size={11} className="text-amber-500" />
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={highlights.topSpotlight?.indicator || profile.featuredIndicator || 'PERFORMANCE GLOBAL & ATENDIMENTO CONSULTIVO'}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-xs font-black text-[#E3000F] dark:text-amber-400 outline-none cursor-not-allowed uppercase"
                                />
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    <span>Mês / Temporada de Melhor Desempenho</span>
                                    <Lock size={11} className="text-amber-500" />
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={highlights.topSpotlight?.period || profile.featuredPeriod || `Temporada ${new Date().getFullYear()}`}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 outline-none cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    <span>Leitura Automática do Destaque</span>
                                    <Lock size={11} className="text-amber-500" />
                                </label>
                                <textarea
                                    rows={3}
                                    readOnly
                                    value={highlights.topSpotlight?.note || profile.featuredNote}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300 outline-none cursor-not-allowed resize-none leading-relaxed"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                    Lema / Frase Pessoal no Perfil
                                </label>
                                <input
                                    type="text"
                                    name="bio"
                                    value={profile.bio}
                                    onChange={handleChange}
                                    placeholder="Sua frase de inspiração profissional..."
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onBack}
                                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 rounded-xl bg-[#E3000F] hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-500/20 flex items-center gap-2 transition-all"
                            >
                                <CheckCircle2 size={15} />
                                <span>{saving ? 'Salvando...' : 'Confirmar e Salvar'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};
