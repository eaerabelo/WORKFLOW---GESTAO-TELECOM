import React, { useState, useEffect } from 'react';
import { Phone, BookOpen, Zap, Lock, Users, Rocket, Sparkles, Check, Calculator, Edit3, CalendarDays, Megaphone, Globe, ClipboardList, Presentation, LineChart, FileText, Home, Printer } from 'lucide-react';

// =========================================================================
// 🚀 NOTAS DE ATUALIZAÇÃO DO SISTEMA (MODAL ÚNICO DE NOVIDADES)
// =========================================================================
const SYSTEM_UPDATES = {
    version: 'v2.0.0', // Atualize a versão aqui para que a tela reapareça nas próximas atualizações
    title: 'NOVOS RECURSOS E AJUSTES',
    subtitle: 'Confira as últimas melhorias implementadas no painel para facilitar sua rotina.',
    features: [
        {
            icon: <Calculator size={18} className="text-orange-500" />,
            title: 'Ajuste na Regra de Bônus Unitário',
            desc: 'O bônus do Fator RV que era pago ao ultrapassar 100% das metas de TV e Fibra foi removido. A partir de agora, apenas as vendas de Pós-Pago que excederem a meta continuarão gerando o valor extra.',
            roles: ['ALL']
        },
        {
            icon: <Home size={18} className="text-blue-500" />,
            title: 'Novo Controle de Estoque TV Box',
            desc: 'Uma nova aba dedicada foi adicionada ao "Controle de SIM Cards" para gerenciar o estoque de TV Box, permitindo o registro de CAID, data de entrada, vendedor e cliente.',
            roles: ['ALL']
        },
        {
            icon: <Megaphone size={18} className="text-green-500" />,
            title: 'Notificações Automáticas',
            desc: 'O sistema agora envia lembretes automáticos para os Gestores sobre o envio da parcial de vendas e para os Vendedores sobre o acompanhamento de instalações residenciais (UR).',
            roles: ['ALL']
        }
    ]
};

export function Atualizacoes({ globalUser, updateUserProfile }) {
    const [isOpen, setIsOpen] = useState(() => {
        const savedVersion = globalUser?.lastSeenUpdateVersion;
        return savedVersion !== SYSTEM_UPDATES.version;
    });

    // Estado para travar o botão por 5 segundos
    const [timeLeft, setTimeLeft] = useState(5);

    useEffect(() => {
        if (globalUser) {
            setIsOpen(globalUser.lastSeenUpdateVersion !== SYSTEM_UPDATES.version);
        }
    }, [globalUser]);

    useEffect(() => {
        if (isOpen && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, timeLeft]);

    const handleClose = () => {
        if (timeLeft > 0) return; // Bloqueia a ação se o timer não zerou
        updateUserProfile({ lastSeenUpdateVersion: SYSTEM_UPDATES.version });
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