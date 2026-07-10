import React, { useState, useEffect } from 'react';
import { Phone, BookOpen, Zap, Lock, Users, Rocket, Sparkles, Check, Calculator, Edit3, CalendarDays, Megaphone, Globe, ClipboardList, Presentation, LineChart, FileText, Home, Printer, Target, MonitorPlay } from 'lucide-react';
import { getLatestUpdateAPI } from '../services/api.js';
import '../styles/Atualizacoes/Atualizacoes.css';

const ICON_MAP = {
    Phone, BookOpen, Zap, Lock, Users, Rocket, Sparkles, Check, Calculator, Edit3, 
    CalendarDays, Megaphone, Globe, ClipboardList, Presentation, LineChart, FileText, 
    Home, Printer, Target, MonitorPlay
};

export function Atualizacoes({ globalUser, updateUserProfile, usersDB = {} }) {
    const [isOpen, setIsOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(5);
    const [hasBeenClosedInSession, setHasBeenClosedInSession] = useState(false);
    const [systemUpdates, setSystemUpdates] = useState(null);

    useEffect(() => {
        if (!globalUser || hasBeenClosedInSession) return;

        const checkUpdates = async () => {
            try {
                // Busca a versão mais recente do backend
                const updates = await getLatestUpdateAPI();
                setSystemUpdates(updates);

                const dbUser = usersDB[globalUser.username];
                const lastSeen = dbUser?.lastSeenUpdateVersion || globalUser.lastSeenUpdateVersion;

                if (lastSeen !== updates.version) {
                    setIsOpen(true);
                } else {
                    setIsOpen(false);
                }
            } catch (error) {
                console.error("Erro ao verificar atualizações:", error);
            }
        };

        checkUpdates();
    }, [globalUser, usersDB, hasBeenClosedInSession]);

    useEffect(() => {
        if (isOpen && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, timeLeft]);

    const handleClose = () => {
        if (timeLeft > 0 || !systemUpdates) return;
        updateUserProfile({ lastSeenUpdateVersion: systemUpdates.version });
        setHasBeenClosedInSession(true);
        setIsOpen(false);
    };

    if (!isOpen || !globalUser || !systemUpdates) return null;

    return (
        <div className="atualizacoes-overlay">
            <div className="atualizacoes-container">
                <div className="atualizacoes-header">
                    <div className="atualizacoes-header-icon-bg"><Rocket size={100} className="text-white" /></div>
                    <div className="atualizacoes-header-content">
                        <div className="atualizacoes-header-sparkles"><Sparkles size={32} /></div>
                        <h2 className="atualizacoes-title">{systemUpdates.title}</h2>
                        <p className="atualizacoes-subtitle">{systemUpdates.subtitle}</p>
                    </div>
                </div>

                <div className="atualizacoes-body">
                    {systemUpdates.features.map((feature, idx) => {
                        if (!feature.roles.includes('ALL') && !feature.roles.includes(globalUser?.role)) return null;
                        
                        const IconComponent = ICON_MAP[feature.icon] || Sparkles;

                        return (
                            <div key={idx} className="atualizacoes-feature">
                                <div className="atualizacoes-feature-icon-container">
                                    <IconComponent size={18} className={feature.color} />
                                </div>
                                <div>
                                    <h4 className="atualizacoes-feature-title">{feature.title}</h4>
                                    <p className="atualizacoes-feature-desc">{feature.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="atualizacoes-footer">
                    <button
                        onClick={handleClose}
                        disabled={timeLeft > 0}
                        className={`atualizacoes-btn ${timeLeft > 0 ? 'atualizacoes-btn-disabled' : 'atualizacoes-btn-active'}`}
                    >
                        {timeLeft > 0 ? `LEIA AS NOVIDADES (${timeLeft}s)` : <><Check size={18} /> CIENTE</>}
                    </button>
                </div>
            </div>
        </div>
    );
}