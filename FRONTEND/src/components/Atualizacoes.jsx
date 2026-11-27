import React, { useState, useEffect } from 'react';
import {
    Phone, BookOpen, Zap, Lock, Users, Rocket, Sparkles, Check, Calculator, Edit3,
    CalendarDays, Megaphone, Globe, ClipboardList, Presentation, LineChart, FileText,
    Home, Printer, Target, MonitorPlay, Layers, ShieldCheck, ZoomIn, X
} from 'lucide-react';
import { getLatestUpdateAPI } from '../services/api.js';
import imgBoasVindas from '../assets/tutoriais/work_boasvindas.jpeg';
import '../styles/Atualizacoes/Atualizacoes.css';

const ICON_MAP = {
    Phone, BookOpen, Zap, Lock, Users, Rocket, Sparkles, Check, Calculator, Edit3,
    CalendarDays, Megaphone, Globe, ClipboardList, Presentation, LineChart, FileText,
    Home, Printer, Target, MonitorPlay, Layers, ShieldCheck
};

// Versão da recepção de Boas-Vindas e Atualizações (exibida para novos usuários e novas versões)
const CURRENT_WELCOME_VERSION = 'v2.6.0';

const DEFAULT_WELCOME_UPDATES = {
    version: CURRENT_WELCOME_VERSION,
    title: 'BEM-VINDO AO WORKFLOW!',
    subtitle: 'Conheça a visão geral do sistema e confira as novas atualizações liberadas para a sua loja.',
    features: [
        {
            icon: 'CalendarDays',
            color: 'text-[#E3000F]',
            title: 'Nova Matriz Tecnológica de Escala (6x1 e 5x2 — 42h)',
            desc: 'Escala mensal por siglas oficiais (T, M, I, N, F), sugestor automático em loop, carga horária de 42h na 5x2, exportação Excel e impressão A4 Paisagem.',
            roles: ['ALL']
        },
        {
            icon: 'Layers',
            color: 'text-indigo-500',
            title: 'Hub Geek — Bundles Oficiais & Códigos SAP',
            desc: 'Consulta rápida de ofertas conjuntas Samsung, Motorola e Apple (Relógios & Fones, Capas MagSafe e Multi Friday) com cópia de código SAP em 1 clique.',
            roles: ['ALL']
        },
        {
            icon: 'Home',
            color: 'text-amber-500',
            title: 'Alerta Automático de 5 Dias na UR Residencial',
            desc: 'Monitoramento inteligente de contratos agendados não conectados em até 5 dias, com notificação direta em segundo plano no PC e Celular (Android & iOS).',
            roles: ['ALL']
        },
        {
            icon: 'BookOpen',
            color: 'text-emerald-500',
            title: 'Central de Treinamento Visual & Regras',
            desc: 'Novos guias ilustrados passo a passo com Regras e Termos oficiais em cada módulo do sistema.',
            roles: ['ALL']
        }
    ]
};

export function Atualizacoes({ globalUser, updateUserProfile, usersDB = {} }) {
    const [isOpen, setIsOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(5);
    const [hasBeenClosedInSession, setHasBeenClosedInSession] = useState(false);
    const [systemUpdates, setSystemUpdates] = useState(DEFAULT_WELCOME_UPDATES);
    const [activeView, setActiveView] = useState('BOAS_VINDAS'); // 'BOAS_VINDAS' | 'NOVIDADES'
    const [isZoomOpen, setIsZoomOpen] = useState(false);

    useEffect(() => {
        if (!globalUser || hasBeenClosedInSession) return;

        const userKey = String(globalUser.username || '').toUpperCase();
        const localStorageKey = `wf_seen_welcome_${userKey}`;

        const checkUpdates = async () => {
            let effectiveUpdates = DEFAULT_WELCOME_UPDATES;

            try {
                const remote = await getLatestUpdateAPI();
                if (remote && remote.version) {
                    // Usa a versão mais recente entre o servidor e o pacote atual v2.6.0
                    const targetVersion =
                        remote.version > CURRENT_WELCOME_VERSION ? remote.version : CURRENT_WELCOME_VERSION;
                    effectiveUpdates = {
                        ...remote,
                        version: targetVersion,
                        features:
                            targetVersion === CURRENT_WELCOME_VERSION
                                ? DEFAULT_WELCOME_UPDATES.features
                                : remote.features || DEFAULT_WELCOME_UPDATES.features
                    };
                }
            } catch (error) {
                // Mantém DEFAULT_WELCOME_UPDATES para garantir recepção a novos usuários mesmo offline
            }

            setSystemUpdates(effectiveUpdates);

            const dbUser =
                usersDB[userKey] ||
                usersDB[globalUser.username] ||
                Object.values(usersDB || {}).find(
                    (u) => String(u?.username || '').toUpperCase() === userKey
                );

            const lastSeenDb = dbUser?.lastSeenUpdateVersion || globalUser.lastSeenUpdateVersion;
            const lastSeenLocal =
                typeof window !== 'undefined' ? localStorage.getItem(localStorageKey) : null;

            if (lastSeenDb !== effectiveUpdates.version && lastSeenLocal !== effectiveUpdates.version) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };

        checkUpdates();
    }, [globalUser, usersDB, hasBeenClosedInSession]);

    useEffect(() => {
        if (isOpen && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, timeLeft]);

    const handleClose = () => {
        if (timeLeft > 0 || !systemUpdates) return;
        const userKey = String(globalUser?.username || '').toUpperCase();
        if (typeof window !== 'undefined' && userKey) {
            localStorage.setItem(`wf_seen_welcome_${userKey}`, systemUpdates.version);
        }
        updateUserProfile({ lastSeenUpdateVersion: systemUpdates.version });
        setHasBeenClosedInSession(true);
        setIsOpen(false);
    };

    if (!isOpen || !globalUser || !systemUpdates) return null;

    return (
        <>
            <div className="atualizacoes-overlay">
                <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-800">
                    {/* CABEÇALHO COMPACTO COM ABAS: BOAS-VINDAS (IMAGEM) | RESUMO DE ATUALIZAÇÕES */}
                    <div className="bg-gradient-to-r from-neutral-950 via-[#2a070b] to-[#E3000F] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                                        Bem-vindo ao WorkFlow
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full bg-black/35 border border-white/20 text-[10px] font-black text-amber-300 uppercase tracking-wider">
                                        {systemUpdates.version}
                                    </span>
                                </div>
                                <p className="text-xs text-red-100/90 font-medium">
                                    Recepção oficial e guia rápido de atualizações da plataforma
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/15 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setActiveView('BOAS_VINDAS')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                    activeView === 'BOAS_VINDAS'
                                        ? 'bg-white text-[#E3000F] shadow-sm'
                                        : 'text-white/80 hover:text-white'
                                }`}
                            >
                                Visão Geral
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveView('NOVIDADES')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                    activeView === 'NOVIDADES'
                                        ? 'bg-white text-[#E3000F] shadow-sm'
                                        : 'text-white/80 hover:text-white'
                                }`}
                            >
                                Novidades ({systemUpdates.version})
                            </button>
                        </div>
                    </div>

                    {/* CORPO: IMAGEM OFICIAL WORK_BOASVINDAS OU LISTA DE RECURSOS */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center">
                        {activeView === 'BOAS_VINDAS' ? (
                            <div className="relative group w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-lg bg-neutral-950">
                                <img
                                    src={imgBoasVindas}
                                    alt="Bem-vindo ao WorkFlow — Entenda o Sistema"
                                    onClick={() => setIsZoomOpen(true)}
                                    className="w-full h-auto max-h-[65vh] object-contain mx-auto cursor-zoom-in block"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsZoomOpen(true)}
                                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/15 transition-all cursor-pointer"
                                >
                                    <ZoomIn size={14} />
                                    <span>Ampliar Imagem</span>
                                </button>
                            </div>
                        ) : (
                            <div className="w-full space-y-3.5 p-2">
                                {(systemUpdates.features || []).map((feature, idx) => {
                                    if (
                                        Array.isArray(feature.roles) &&
                                        !feature.roles.includes('ALL') &&
                                        !feature.roles.includes(globalUser?.role)
                                    ) {
                                        return null;
                                    }
                                    const IconComponent = ICON_MAP[feature.icon] || Sparkles;
                                    return (
                                        <div
                                            key={idx}
                                            className="flex gap-3.5 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-700">
                                                <IconComponent size={18} className={feature.color} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 mb-0.5">
                                                    {feature.title}
                                                </h4>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                                    {feature.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* RODAPÉ DE CONFIRMAÇÃO */}
                    <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium text-center sm:text-left">
                            Você pode rever este guia e as regras a qualquer momento clicando em <strong className="text-[#E3000F]">Tutorial</strong> no topo.
                        </span>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={timeLeft > 0}
                            className={`w-full sm:w-auto px-8 py-3 rounded-xl text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                timeLeft > 0
                                    ? 'bg-neutral-400 dark:bg-neutral-700 cursor-not-allowed opacity-80'
                                    : 'bg-[#E3000F] hover:bg-red-700 shadow-lg shadow-red-500/30 cursor-pointer'
                            }`}
                        >
                            {timeLeft > 0 ? (
                                `AGUARDE (${timeLeft}s)`
                            ) : (
                                <>
                                    <Check size={18} />
                                    <span>CIENTE • ACESSAR SISTEMA</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* LIGHTBOX DE ZOOM EM TELA CHEIA DA IMAGEM WORK_BOASVINDAS */}
            {isZoomOpen && (
                <div
                    className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-fade-in cursor-zoom-out"
                    onClick={() => setIsZoomOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setIsZoomOpen(false)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={22} />
                    </button>
                    <img
                        src={imgBoasVindas}
                        alt="Bem-vindo ao WorkFlow Ampliado"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                    />
                </div>
            )}
        </>
    );
}
