import React, { useState, useEffect } from 'react';
import { Phone, BookOpen, Zap, Lock, Users, Rocket, Sparkles, Check, Calculator, Edit3, CalendarDays, Megaphone, Globe, ClipboardList, Presentation, LineChart, FileText, Home, Printer, Target, MonitorPlay } from 'lucide-react';

// =========================================================================
// 🚀 NOTAS DE ATUALIZAÇÃO DO SISTEMA (MODAL ÚNICO DE NOVIDADES)
// =========================================================================
const SYSTEM_UPDATES = {
    version: 'v2.2.0', // Atualizado para exibir as novas funcionalidades
    title: 'NOVAS ATUALIZAÇÕES DO PAINEL',
    subtitle: 'Confira as últimas melhorias implementadas no painel para facilitar sua rotina.',
    features: [
        {
            icon: <Target size={18} className="text-blue-500" />,
            title: 'Novos Indicadores com Porcentagem de Meta',
            desc: 'Os cartões de Indicadores agora mostram a porcentagem exata atingida por cada vendedor individualmente. Além disso, criamos a seção "LOJA - INDICADORES" no fim da página para você visualizar o desempenho consolidado de toda a equipe!',
            roles: ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK', 'JOVEM APRENDIZ', 'ASSISTENTE RELACIONAMENTO']
        },
        {
            icon: <CalendarDays size={18} className="text-green-500" />,
            title: 'Datas no Padrão Brasileiro',
            desc: 'Todas as telas, filtros e exportações agora utilizam nativamente o padrão brasileiro de datas (DD/MM/AAAA) até no Banco de Dados, resolvendo de vez problemas com relatórios e planilhas.',
            roles: ['ALL']
        },
        {
            icon: <MonitorPlay size={18} className="text-purple-500" />,
            title: 'Correção Inteligente no Estoque TV BOX',
            desc: 'Foi corrigido um bug chato na inserção do Estoque de TV Box! O botão de salvar não trava mais, pois o formulário agora valida exclusivamente e de forma inteligente apenas os seus lotes de CAIDs.',
            roles: ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'JOVEM APRENDIZ', 'GEEK']
        },
        {
            icon: <Globe size={18} className="text-orange-500" />,
            title: 'Sincronização Global de Telas',
            desc: 'A tela de novidades (esta que você está lendo) agora está sincronizada no seu usuário. Não importa se você acessar pelo celular ou por outro computador: ao fechar o aviso, ele nunca mais aparecerá repetido.',
            roles: ['ALL']
        }
    ]
};

export function Atualizacoes({ globalUser, updateUserProfile, usersDB = {} }) {
    const [isOpen, setIsOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(5);
    const [hasBeenClosedInSession, setHasBeenClosedInSession] = useState(false);

    useEffect(() => {
        if (!globalUser || hasBeenClosedInSession) return;

        // O banco de dados é a fonte da verdade. Se o usuário estiver em outro IP/PC,
        // o globalUser (localStorage) pode estar desatualizado, mas o usersDB vai chegar fresquinho do servidor.
        const dbUser = usersDB[globalUser.username];
        const lastSeen = dbUser?.lastSeenUpdateVersion || globalUser.lastSeenUpdateVersion;

        if (lastSeen !== SYSTEM_UPDATES.version) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [globalUser, usersDB, hasBeenClosedInSession]);

    useEffect(() => {
        if (isOpen && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, timeLeft]);

    const handleClose = () => {
        if (timeLeft > 0) return; // Bloqueia a ação se o timer não zerou
        updateUserProfile({ lastSeenUpdateVersion: SYSTEM_UPDATES.version });
        setHasBeenClosedInSession(true);
        setIsOpen(false);
    };

    if (!isOpen || !globalUser) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center no-print animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden transform transition-all scale-100 opacity-100">
                <div className="bg-gradient-to-r from-[#E3000F] to-red-600 p-6 sm:p-8 text-center relative overflow-hidden shrink-0">
                    <div className="absolute -right-4 -top-4 opacity-20 transform rotate-12 pointer-events-none"><Rocket size={100} className="text-white" /></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg border border-white/30"><Sparkles size={32} /></div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">{SYSTEM_UPDATES.title}</h2>
                        <p className="text-red-100 text-sm font-medium max-w-sm mx-auto">{SYSTEM_UPDATES.subtitle}</p>
                    </div>
                </div>

                <div className="p-6 sm:p-8 space-y-5 max-h-[50vh] overflow-y-auto scrollbar-thin bg-white dark:bg-neutral-900">
                    {SYSTEM_UPDATES.features.map((feature, idx) => {
                        if (!feature.roles.includes('ALL') && !feature.roles.includes(globalUser?.role)) return null;
                        return (
                            <div key={idx} className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-700 shadow-sm">{feature.icon}</div>
                                <div><h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 leading-tight mb-1">{feature.title}</h4><p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{feature.desc}</p></div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-5 sm:p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
                    <button
                        onClick={handleClose}
                        disabled={timeLeft > 0}
                        className={`w-full py-3.5 text-white text-sm font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${timeLeft > 0 ? 'bg-neutral-400 dark:bg-neutral-700 cursor-not-allowed opacity-80' : 'bg-[#E3000F] hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5'}`}
                    >
                        {timeLeft > 0 ? `LEIA AS NOVIDADES (${timeLeft}s)` : <><Check size={18} /> CIENTE</>}
                    </button>
                </div>
            </div>
        </div>
    );
} 