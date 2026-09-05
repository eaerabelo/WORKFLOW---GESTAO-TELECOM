// Importações de Hooks nativos do React utilizados para gerenciar ciclo de vida, estado e referências
import React, { useState, useEffect, useRef } from 'react';

// Importação de Ícones da biblioteca lucide-react para utilizar na interface
import {
  Menu, X, Search, ChevronRight, UserPlus,
  Users, BarChart3, FileText, Database, Home,
  Target, AlertOctagon, Phone, CreditCard, Briefcase, AlertCircle, Check, Lock,
  Key, CalendarDays, UserCircle, LogOut, Crown, Undo, Sun, Moon, ClipboardCheck, Cpu, Bell, Wifi, Copy, Calculator, Megaphone, Trophy, DollarSign, BookOpen, Zap, AlertTriangle, WifiOff, Map as MapIcon, Loader2, Activity
} from 'lucide-react';

// Importação de biblioteca de Toasts para feedback visual de ações em tela
import toast, { Toaster } from 'react-hot-toast';

// Acesso direto ao Firebase restaurado provisoriamente (Serverless Multi-Tenant)
// Acesso via API Oracle / Websocket
import { io } from 'socket.io-client';
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// Importações de constantes como usuários padrões e base para as metas
import {
  METAS_PADRAO
} from './utils/constants';

// Importação de função utilitária para capturar data ajustada ao fuso horário
import {
  getTodaySP
} from './utils/masks';

// Importações de Módulos (Componentes) que constroem as telas do Sistema
import { Sistemas } from './components/Sistemas.jsx';
import { EscalaTrabalho } from './components/EscalaTrabalho.jsx';
import { Acessos } from './components/Acessos.jsx';
import { Colaboradores } from './components/Colaboradores.jsx';
import { ControleSimcard } from './components/ControleSimcard.jsx';
import { Gestao } from './components/Gestao.jsx';
import { Venda } from './components/Venda.jsx';
import { Proposta } from './components/Proposta.jsx';
import { UrResidencial } from './components/UrResidencial.jsx';
import { Reprovados } from './components/Reprovados.jsx';
import { Resultado } from './components/Resultado.jsx';
import { Login } from './components/Login.jsx';
import { ParcialFechamento } from './components/ParcialFechamento.jsx';
import { Geek, checkHasNewGeek } from './components/Geek.jsx';
import { Scripts } from './components/Scripts.jsx';
import { FatorRvv } from './components/FatorRvv.jsx';
import { Campanha, checkHasNewCampanha } from './components/Campanha.jsx';
import { Tutorial } from './components/Tutorial.jsx';
import { Atualizacoes } from './components/Atualizacoes.jsx';
import { AreaLojas } from './components/AreaLojas.jsx';
import wfLogo from './assets/logo_WF.png';
import qrWifiImg from "./assets/QR_CODEWIFI.png";

// Importação da Camada de Serviços (API)
import { 
  fetchStatus, fetchSales, fetchConfig, fetchSimcards, 
  fetchReprovados, fetchGeekDocs, fetchCampanhas, 
  syncCollectionDynamic, syncConfigData 
} from './services/api.js';
import { getCurrentStoreName, getCurrentStoreCode } from './utils/stores.js';

// Multi-Tenant: Identificador dinâmico da loja
const STORE_ID = (typeof window !== 'undefined' ? localStorage.getItem('storeId') : null) || 'uniao_osasco';

// Variáveis seguras (Fallback) caso as constantes falhem ou estejam ausentes
const safeMetasPadrao = METAS_PADRAO;


// Função / Componente Principal do Aplicativo (Ponto de Entrada)
export default function App() {
  // Define se o menu lateral estará aberto (Por padrão abre para PC e fecha para mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  // Aba ativa selecionada no painel principal
  const [activeTab, setActiveTab] = useState('VENDA');

  // --- ESTADOS DE MONITORAMENTO DO SERVIDOR ---
  const [isOffline, setIsOffline] = useState(false);
  const [dbSizeMB, setDbSizeMB] = useState(null);

  // --- TEMA (LIGHT/DARK) ---
  // Recupera o tema do localStorage e define o tema atual da interface
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme-preference');
      if (savedTheme) return savedTheme;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Aplica as classes do Tailwind no root do HTML toda vez que o tema mudar
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme-preference', theme);
  }, [theme]);

  // Função simples para alternar entre Dark / Light
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // --- LÓGICA DE MONITORAMENTO (ALERTA VERMELHO) E TAMANHO DO BANCO ---
  useEffect(() => {
    // Escuta os eventos do Socket já existente
    socket.on('disconnect', () => setIsOffline(true));
    socket.on('connect', () => setIsOffline(false));

    // Polling contínuo a cada 30 segundos para checar o banco
    const checkStatus = async () => {
      try {
        const data = await fetchStatus();
        setIsOffline(false);
        if (data.oracleDBSizeMB !== undefined) {
          setDbSizeMB(data.oracleDBSizeMB);
        }
      } catch (e) {
        setIsOffline(true);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);

    return () => {
      socket.off('disconnect');
      socket.off('connect');
      clearInterval(interval);
    };
  }, []);

  // --- ESTADOS DO SISTEMA DE LOGIN GLOBAL ---
  // Carrega o usuário da sessão a partir do LocalStorage com validade de 30 minutos
  const [globalUser, setGlobalUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sessionUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Só mantém o login se não passou de 30 minutos sem atividade
          if (Date.now() - parsed.loginTime < 30 * 60 * 1000) return parsed;
          localStorage.removeItem('sessionUser');
        } catch (e) { }
      }
    }
    return null;
  });

  // Estado do Modal de Autenticação (quando ação crítica é exigida)
  const [authModal, setAuthModal] = useState({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
  const [authCredentials, setAuthCredentials] = useState({ user: '', password: '' });
  const [authError, setAuthError] = useState('');

  // --- NOTIFICAÇÕES GLOBAIS (SININHO) ---
  // Estado responsável por carregar/salvar alertas do sininho no cabeçalho
  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_notifications');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved); 
          if (Array.isArray(parsed)) return parsed;
        } catch (e) { }
      }
    }
    return [];
  });
  // Controle de visibilidade do popover das notificações
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  // Conta notificações não lidas
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  // Estado do Modal de Wi-Fi
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isUrReminderModalOpen, setIsUrReminderModalOpen] = useState(false);

  // Persiste as notificações localmente a cada atualização
  useEffect(() => {
    localStorage.setItem('user_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Marca tudo como lido quando o usuário abre o popover de notificações
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // --- ALERTA DE PARCIAL DE VENDAS (GESTOR) ---
  useEffect(() => {
    if (!['GERENTE', 'SENIOR', 'GEEK', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO'].includes(globalUser?.role)) return;

    const checkParcialTime = () => {
      const now = new Date();
      const h = now.getHours();
      
      // Horários designados para parciais
      const targetHours = [14, 16, 18];
      if (targetHours.includes(h)) {
        const lastHour = localStorage.getItem('lastParcialHour');
        const lastDate = localStorage.getItem('lastParcialDate');
        const todayDate = now.toLocaleDateString('pt-BR');

        if (lastHour !== String(h) || lastDate !== todayDate) {
          
          // Usa o Toast nativo para garantir que a notificação apareça sempre no topo, livre de problemas visuais
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-fade-in' : 'opacity-0'} max-w-[calc(100vw-32px)] sm:max-w-md w-full mx-auto bg-white dark:bg-neutral-900 shadow-2xl rounded-xl border-l-4 border-[#E3000F] pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-[#E3000F] shrink-0">
                    <AlertCircle size={22} />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Atenção Gestor!</p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Já é hora de enviar a <strong className="text-[#E3000F]">Parcial de Vendas</strong> no grupo do WhatsApp da equipe.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ), { duration: 60000, position: 'top-center', id: `parcial-toast-${h}` });

          // Adiciona as parciais dentro do log de Notificações
          setNotifications(prev => {
            const newNotif = {
              id: `parcial-${todayDate}-${h}`,
              title: `Lembrete: Enviar Parcial`,
              desc: `Já é hora de enviar a parcial de vendas das ${h}h.`,
              time: Date.now(),
              read: false,
              type: 'parcial'
            };
            return [newNotif, ...(Array.isArray(prev) ? prev : []).filter(n => n.id !== newNotif.id)].slice(0, 20);
          });

          localStorage.setItem('lastParcialHour', String(h));
          localStorage.setItem('lastParcialDate', todayDate);
        }
      }
    };

    const interval = setInterval(checkParcialTime, 60000);
    checkParcialTime();

    return () => clearInterval(interval);
  }, [globalUser?.role]);

  // --- ALERTA DE ACOMPANHAMENTO UR (VENDEDOR) ---
  useEffect(() => {
    if (globalUser?.role !== 'VENDEDOR') return;

    const checkUrDate = () => {
      const now = new Date();
      const dayOfMonth = now.getDate();
      const currentMonthYear = `${now.getFullYear()}-${now.getMonth() + 1}`;

      // Dispara a notificação apenas no dia 20 de cada mês
      if (dayOfMonth === 20) {
        const lastUrNotification = localStorage.getItem('lastUrNotification');

        if (lastUrNotification !== currentMonthYear) {
          const newNotif = {
            id: `ur-reminder-${currentMonthYear}`,
            title: `Acompanhe suas Instalações!`,
            desc: `Lembre-se de verificar a aba "UR RESIDENCIAL" para acompanhar o status de suas vendas de fibra e TV.`,
            time: Date.now(),
            read: false,
            type: 'ur-reminder' // Novo tipo para ícone
          };

          setNotifications(prev => [newNotif, ...(Array.isArray(prev) ? prev : []).filter(n => n.id !== newNotif.id)].slice(0, 20));
          setIsUrReminderModalOpen(true);

          localStorage.setItem('lastUrNotification', currentMonthYear);
        }
      }
    };

    const interval = setInterval(checkUrDate, 60 * 60 * 1000); // Verifica a cada hora
    checkUrDate(); // Verifica imediatamente ao carregar
    return () => clearInterval(interval);
  }, [globalUser?.role]);

  // --- ESTADOS DE BANCO DE DADOS (NUVEM - FIREBASE) ---
  // Armazena todos os registros do Banco de Dados sincronizados em Real-Time
  const [simcardsData, setSimcardsData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [reprovadosData, setReprovadosData] = useState([]);
  const [geekDocs, setGeekDocs] = useState([]);
  const [campanhasData, setCampanhasData] = useState([]);
  const [usersDB, setUsersDB] = useState({});
  const [scheduleData, setScheduleData] = useState({});
  const [monthlyOverrides, setMonthlyOverrides] = useState({});
  const [pricingData, setPricingData] = useState({});
  // Define se o primeiro carregamento da Nuvem já foi finalizado
  const [isBackendReady, setisBackendReady] = useState(false);

  // --- ESTADOS DE CONEXÃO (INTERNET E BANCO DE DADOS) ---
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSocketConnected, setIsSocketConnected] = useState(true);

  // Monitora a conexão de internet do navegador do usuário
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- NOVIDADES GEEK ---
  const [hasNewGeek, setHasNewGeek] = useState(false);
  useEffect(() => {
    if (globalUser) {
      setHasNewGeek(checkHasNewGeek(geekDocs, globalUser));
    }
  }, [geekDocs, globalUser]);

  // --- NOVIDADES CAMPANHA ---
  const [hasNewCampanha, setHasNewCampanha] = useState(false);
  useEffect(() => {
    if (globalUser) {
      setHasNewCampanha(checkHasNewCampanha(campanhasData, globalUser));
    }
  }, [campanhasData, globalUser]);

  // --- ESTADOS DE GESTÃO DE METAS (MONTH-BY-MONTH) ---
  // Filtro de Mês e Metas
  const currentYYYYMM = getTodaySP().slice(0, 7);
  const [globalMonth, setGlobalMonth] = useState(currentYYYYMM);
  const [goalsDB, setGoalsDB] = useState({});
  const activeMetas = (goalsDB || {})[currentYYYYMM] || safeMetasPadrao;

  // Adiciona notificação global se o Administrador atualizar as Metas de Vendas do mês vigente
  useEffect(() => {
    const metasLastUpdated = (goalsDB || {})[currentYYYYMM]?.lastUpdated;
    if (metasLastUpdated && isBackendReady) {
      const savedLastUpdated = localStorage.getItem('last_seen_metas_update');
      if (!savedLastUpdated || metasLastUpdated > parseInt(savedLastUpdated, 10)) {
        if (savedLastUpdated) { 
          setNotifications(prev => {
            const newNotif = {
              id: `metas-${metasLastUpdated}`,
              title: `Novas Metas Definidas!`,
              desc: `O espelho de metas para o mês foi atualizado pela Gestão.`,
              time: metasLastUpdated,
              read: false,
              type: 'meta'
            };
            return [newNotif, ...(Array.isArray(prev) ? prev : []).filter(n => n.id !== newNotif.id)].slice(0, 20);
          });
        }
        localStorage.setItem('last_seen_metas_update', String(metasLastUpdated));
      }
    }
  }, [goalsDB, currentYYYYMM, isBackendReady]);

  // --- ALERTA DE PRECIFICAÇÃO ---
  useEffect(() => {
    const pricingLastUpdated = pricingData?.lastUpdated;
    if (pricingLastUpdated && isBackendReady) {
      const savedLastUpdated = localStorage.getItem('last_seen_pricing_update');
      const currentDataStr = JSON.stringify({ movel: pricingData?.movel || [], residencial: pricingData?.residencial || [] });
      const savedDataStr = localStorage.getItem('last_seen_pricing_data');

      if (!savedLastUpdated || pricingLastUpdated > parseInt(savedLastUpdated, 10)) {
        if (savedLastUpdated && savedDataStr !== currentDataStr) { 
          setNotifications(prev => {
            const newNotif = {
              id: `pricing-${pricingLastUpdated}`,
              title: `Tabela de Preços Atualizada!`,
              desc: `Os planos e valores foram atualizados pela Gestão.`,
              time: pricingLastUpdated,
              read: false,
              type: 'pricing'
            };
            return [newNotif, ...(Array.isArray(prev) ? prev : []).filter(n => n.id !== newNotif.id)].slice(0, 20);
          });
          toast.success('A Tabela de Preços foi atualizada!', { icon: '💲' });
        }
        localStorage.setItem('last_seen_pricing_update', String(pricingLastUpdated));
        localStorage.setItem('last_seen_pricing_data', currentDataStr);
      }
    }
  }, [pricingData, isBackendReady]);

  // --- ALERTA DE CAMPANHAS (LANÇAMENTOS E VENCEDORES) ---
  useEffect(() => {
    if (!isBackendReady || !campanhasData) return;

    const savedLastSeenStr = localStorage.getItem('last_seen_campanhas');
    const savedLastSeen = savedLastSeenStr ? JSON.parse(savedLastSeenStr) : null;
    const currentSeen = savedLastSeen || {};
    let hasUpdates = false;

    campanhasData.forEach(camp => {
      const seen = currentSeen[camp.id];

      // 1. Detectar Lançamento de Nova Campanha
      if (!seen) {
        // Se o cache local já existia OU se a campanha foi criada agora mesmo (nos últimos 10s), notifica!
        const isRecent = camp.id > Date.now() - 10000;
        
        if (savedLastSeen !== null || isRecent) {
          setNotifications(prev => {
            const newNotif = { id: `camp-${camp.id}`, title: `Nova Campanha!`, desc: `A campanha "${camp.titulo}" foi lançada pela liderança. Confira as regras e participe!`, time: Date.now(), read: false, type: 'campanha' };
            return [newNotif, ...(Array.isArray(prev) ? prev : []).filter(n => n.id !== newNotif.id)].slice(0, 20);
          });
          toast(`Nova Campanha Lançada: ${camp.titulo}`, { icon: '📣', duration: 5000 });
        }
        
        currentSeen[camp.id] = { ganhadores: camp.ganhadores || '' };
        hasUpdates = true;
      } 
      // 2. Detectar Adição/Alteração de Ganhadores
      else if (camp.ganhadores && camp.ganhadores !== seen.ganhadores) {
        setNotifications(prev => {
          const newNotif = { id: `camp-win-${camp.id}-${Date.now()}`, title: `Temos Ganhadores! 🏆`, desc: `O resultado da campanha "${camp.titulo}" foi divulgado! Confira os vencedores.`, time: Date.now(), read: false, type: 'campanha_win' };
          return [newNotif, ...(Array.isArray(prev) ? prev : []).filter(n => n.id !== newNotif.id)].slice(0, 20);
        });
        toast(`Ganhadores anunciados na campanha: ${camp.titulo}`, { icon: '🏆', duration: 6000 });
        
        currentSeen[camp.id].ganhadores = camp.ganhadores;
        hasUpdates = true;
      }
    });

    if (hasUpdates || savedLastSeen === null) {
      localStorage.setItem('last_seen_campanhas', JSON.stringify(currentSeen));
    }
  }, [campanhasData, isBackendReady]);

  // --- ESTADOS DO DASHBOARD DE VENDAS ---
  // Seleção e visualização global de determinado colaborador
  const [selectedSeller, setSelectedSeller] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sessionUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Date.now() - parsed.loginTime < 30 * 60 * 1000 && parsed.role === 'VENDEDOR') return parsed.name;
        } catch (e) { }
      }
    }
    return null;
  });

  // Referência do último estado salvo na nuvem para não sobrescrever dados sem necessidade
  const cloudRefs = useRef({
    sales: [],
    simcards: [],
    reprovados: [],
    geekDocs: [],
    campanhas: [],
    config: ''
  });

  // Função para atualizar o perfil do usuário logado e refletir no banco de dados (ex: lidos de novidades)
  const updateUserProfile = (updates) => {
    if (!globalUser?.username) return;

    setUsersDB(prev => {
      const upperUsername = globalUser.username.toUpperCase();
      const rawUser = prev[upperUsername] || {}[globalUser.username] || {}[globalUser.username.toLowerCase()] || {};
      const currentDbUser = (rawUser && rawUser.role) ? rawUser : {};
      const newDbUser = { ...currentDbUser, ...updates };
        
      return {
        ...prev,
        [upperUsername]: newDbUser
      };
    });

    setGlobalUser(prev => {
      const newUser = { ...prev, ...updates };
      localStorage.setItem('sessionUser', JSON.stringify(newUser));
      return newUser;
    });
  };

  // --- SISTEMA DE DESFAZER (UNDO / CTRL+Z) ---
  // Stack local do estado que armazena os últimos "Delete" efetuados
  const [undoStack, setUndoStack] = useState([]);

  const addToUndoStack = (type, state) => {
    setUndoStack(s => {
      const nextStack = [...s, { type, state }];
      if (nextStack.length > 50) return nextStack.slice(nextStack.length - 50);
      return nextStack;
    });
  };

  // Função para retornar a última versão dos dados (CTRL+Z/Desfazer)
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack[undoStack.length - 1];
    
    if (lastAction) {
      if (lastAction.type === 'salesData') setSalesData(lastAction.state);
      if (lastAction.type === 'simcardsData') setSimcardsData(lastAction.state);
      if (lastAction.type === 'reprovadosData') setReprovadosData(lastAction.state);
      if (lastAction.type === 'geekDocs') setGeekDocs(lastAction.state);
      if (lastAction.type === 'campanhasData') setCampanhasData(lastAction.state);
      toast.success('Ação desfeita com sucesso! (Ctrl+Z)');
    }
    
    setUndoStack(prevStack => prevStack.slice(0, -1));
  };

  // Listener para capturar o atalho de teclado Control+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'z') {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isInputFocused = ['input', 'textarea', 'select'].includes(activeTag);

        if (!isInputFocused && undoStack.length > 0) {
          e.preventDefault();
          handleUndo();
        }
      }
      if (e.key === 'Escape' && authModal.isOpen) {
        setAuthModal({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
      }
      if (e.key === 'Escape' && isWifiModalOpen) {
        setIsWifiModalOpen(false);
      }
    };

    const handleConfigUpdate = (newConfig) => {
      if (newConfig.systemMeta) setSystemMeta(newConfig.systemMeta);
      if (newConfig.userMetas) setUserMetas(newConfig.userMetas);
      if (newConfig.campanhas) setCampanhasData(newConfig.campanhas);
      if (newConfig.geekDocs) setGeekDocs(newConfig.geekDocs);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, authModal.isOpen, isWifiModalOpen]);

  // Listener para fechar o popover das notificações ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isNotificationsOpen && !e.target.closest('.notification-container')) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  // Interceptadores (Wrappers) para detectar alterações na nuvem e criar o backup automático na Stack (para o Undo)
  const handleSetSalesData = (action) => {
    setSalesData(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(prev) && Array.isArray(next) && JSON.stringify(prev) !== JSON.stringify(next)) {
        addToUndoStack('salesData', prev);
      }
      return next;
    });
  };

  const handleSetSimcardsData = (action) => {
    setSimcardsData(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(prev) && Array.isArray(next) && JSON.stringify(prev) !== JSON.stringify(next)) {
        addToUndoStack('simcardsData', prev);
      }
      return next;
    });
  };

  const handleSetReprovadosData = (action) => {
    setReprovadosData(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(prev) && Array.isArray(next) && JSON.stringify(prev) !== JSON.stringify(next)) {
        addToUndoStack('reprovadosData', prev);
      }
      return next;
    });
  };

  const handleSetGeekDocs = (action) => {
    setGeekDocs(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(prev) && Array.isArray(next) && JSON.stringify(prev) !== JSON.stringify(next)) {
        addToUndoStack('geekDocs', prev);
      }
      return next;
    });
  };

  const handleSetCampanhasData = (action) => {
    setCampanhasData(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(prev) && Array.isArray(next) && JSON.stringify(prev) !== JSON.stringify(next)) {
        addToUndoStack('campanhasData', prev);
      }
      return next;
    });
  };

  // 1. CARREGAMENTO REAL-TIME VIA ORACLE E SOCKET.IO
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [vendas, config, estoque, reprovados, geek, campanhas] = await Promise.all([
          fetchSales(),
          fetchConfig(),
          fetchSimcards(),
          fetchReprovados(),
          fetchGeekDocs(),
          fetchCampanhas()
        ]);

        // Ordenações
        const sortChronologically = (a, b) => {
          const getTime = (d) => (typeof d === 'string') ? new Date(d.includes('/') ? d.split('/').reverse().join('-') : d.substring(0, 10)).getTime() : 0;
          const timeA = getTime(a.data);
          const timeB = getTime(b.data);
          if (timeA !== timeB) return timeB - timeA;
          return (b.id || 0) - (a.id || 0);
        };

        vendas.sort(sortChronologically);
        reprovados.sort(sortChronologically);
        estoque.sort((a, b) => b.id - a.id);
        geek.sort((a, b) => b.id - a.id);
        campanhas.sort((a, b) => b.id - a.id);

        setSalesData(vendas);
        cloudRefs.current.sales = vendas;

        setSimcardsData(estoque);
        cloudRefs.current.simcards = estoque;

        setReprovadosData(reprovados);
        cloudRefs.current.reprovados = reprovados;

        setGeekDocs(geek);
        cloudRefs.current.geekDocs = geek;

        setCampanhasData(campanhas);
        cloudRefs.current.campanhas = campanhas;

        const recoveredUsers = (config && config.usersDB && Object.keys(config.usersDB).length > 0) ? config.usersDB : {};
        const recoveredGoals = (config && config.goalsDB && Object.keys(config.goalsDB).length > 0) ? config.goalsDB : { [currentYYYYMM]: { ...safeMetasPadrao } };
        const recoveredPricing = (config && config.pricingData && Object.keys(config.pricingData).length > 0) ? config.pricingData : {};

        setUsersDB(recoveredUsers);
        setGoalsDB(recoveredGoals);
        setPricingData(recoveredPricing);
        if (config && config.scheduleData) setScheduleData(config.scheduleData);
        if (config && config.monthlyOverrides) setMonthlyOverrides(config.monthlyOverrides);

        cloudRefs.current.config = JSON.stringify({
          usersDB: recoveredUsers,
          goalsDB: recoveredGoals,
          scheduleData: config?.scheduleData || {},
          monthlyOverrides: config?.monthlyOverrides || {},
          pricingData: recoveredPricing
        });

        setisBackendReady(true);
      } catch (err) {
        console.error("Erro ao buscar dados da Oracle:", err);
        setisBackendReady(true); // Evita tela de carregamento infinita se a API falhar
      }
    };

    fetchAllData();

    // SOCKET.IO LISTENERS
    socket.on('connect', () => setIsSocketConnected(true));
    socket.on('disconnect', () => setIsSocketConnected(false));
    socket.on('connect_error', () => setIsSocketConnected(false));

    socket.on('vendas-atualizadas', (sId) => { if (sId === STORE_ID) fetchAllData(); });
    socket.on('simcards-atualizados', (sId) => { if (sId === STORE_ID) fetchAllData(); });
    socket.on('reprovados-atualizados', (sId) => { if (sId === STORE_ID) fetchAllData(); });
    socket.on('geek-docs-atualizados', (sId) => { if (sId === STORE_ID) fetchAllData(); });
    socket.on('campanhas-atualizadas', (sId) => { if (sId === STORE_ID) fetchAllData(); });
    socket.on('config-atualizada', (sId) => { if (sId === STORE_ID) fetchAllData(); });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('vendas-atualizadas');
      socket.off('simcards-atualizados');
      socket.off('reprovados-atualizados');
      socket.off('geek-docs-atualizados');
      socket.off('campanhas-atualizadas');
      socket.off('config-atualizada');
    };
  }, []);

  // 2. AUTO-SAVE NA API ORACLE (Smart Diff)
  useEffect(() => {
    if (!isBackendReady) return;
    const timeoutId = setTimeout(async () => {
      try {
        let hasChanges = false;
        const safeStr = (obj) => JSON.stringify(obj || {});

        const syncCollectionOracle = async (localArray, cloudArray, endpoint) => {
          const localMap = new Map((localArray || []).map(item => [String(item.id), item]));
          const cloudMap = new Map((cloudArray || []).map(item => [String(item.id), item]));

          const upserts = [];
          const deletes = [];

          localMap.forEach((item, id) => {
            const cloudItem = cloudMap.get(id);
            if (!cloudItem || safeStr(item) !== safeStr(cloudItem)) {
              upserts.push(item);
            }
          });

          cloudMap.forEach((item, id) => {
            if (!localMap.has(id)) {
              deletes.push(id);
            }
          });

          if (upserts.length > 0 || deletes.length > 0) {
            await syncCollectionDynamic(endpoint, upserts, deletes);
            hasChanges = true;
          }
        };

        await syncCollectionOracle(salesData, cloudRefs.current.sales, 'vendas');
        await syncCollectionOracle(simcardsData, cloudRefs.current.simcards, 'simcards');
        await syncCollectionOracle(reprovadosData, cloudRefs.current.reprovados, 'reprovados');
        await syncCollectionOracle(geekDocs, cloudRefs.current.geekDocs, 'geek-docs');
        await syncCollectionOracle(campanhasData, cloudRefs.current.campanhas, 'campanhas');

        // Config Global
        const currentConfigStr = safeStr({ usersDB, goalsDB, scheduleData, monthlyOverrides, pricingData });
        if (cloudRefs.current.config !== '' && currentConfigStr !== cloudRefs.current.config) {
          await syncConfigData(JSON.parse(currentConfigStr));
          cloudRefs.current.config = currentConfigStr;
        }

        if (hasChanges) {
          cloudRefs.current.sales = [...salesData];
          cloudRefs.current.simcards = [...simcardsData];
          cloudRefs.current.reprovados = [...reprovadosData];
          cloudRefs.current.geekDocs = [...geekDocs];
          cloudRefs.current.campanhas = [...campanhasData];
        }
      } catch (error) {
        console.error("Erro no Auto-Save Oracle:", error);
      }
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [salesData, simcardsData, reprovadosData, geekDocs, campanhasData, goalsDB, scheduleData, monthlyOverrides, usersDB, pricingData, isBackendReady]);

  // 3. TIMER DE SESSÃO EXPIRADA POR INATIVIDADE (30 MINUTOS)
  // Monitoramento de inatividade global do usuário, fazendo Logout automático caso ocioso
  useEffect(() => {
    if (!globalUser) return;

    let timeoutId;

    const logout = () => {
      setGlobalUser(null);
      setSelectedSeller(null);
      localStorage.removeItem('sessionUser');
      setAuthModal({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
      toast.error('Sessão expirada por inatividade. Faça login novamente para continuar.', { duration: 5000 });
    };

    const resetTimer = () => {
      const saved = localStorage.getItem('sessionUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.loginTime = Date.now();
          localStorage.setItem('sessionUser', JSON.stringify(parsed));
        } catch (e) { }
      }

      clearTimeout(timeoutId);
      timeoutId = setTimeout(logout, 30 * 60 * 1000);
    };

    const timeLeft = (30 * 60 * 1000) - (Date.now() - globalUser.loginTime);
    if (timeLeft <= 0) {
      logout();
      return;
    }

    resetTimer();

    let isThrottled = false;
    const handleActivity = () => {
      if (!isThrottled) {
        resetTimer();
        isThrottled = true;
        setTimeout(() => { isThrottled = false; }, 60000); // Atualiza no máximo a cada 1 minuto
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, handleActivity));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, handleActivity));
    };
  }, [globalUser]);

  // 4. SINCRONIZAÇÃO EM TEMPO REAL DAS PERMISSÕES DO USUÁRIO ATUAL
  // Observa caso os cargos do usuário logado mudem no Banco e os desloga/altera na hora
  useEffect(() => {
    if (globalUser && globalUser.username && isBackendReady) {
      const upperUsername = globalUser.username.toUpperCase();
      const rawUser = (usersDB || {})[upperUsername] || {}[globalUser.username] || {}[globalUser.username.toLowerCase()];
      const currentDbUser = (rawUser && rawUser.role) ? rawUser : null;
      if (currentDbUser && (currentDbUser.role !== globalUser.role || currentDbUser.onVacation)) {
        if (currentDbUser.role === 'SUSPENDER' || currentDbUser.onVacation) {
          setGlobalUser(null);
          setSelectedSeller(null);
          localStorage.removeItem('sessionUser');
          setActiveTab('VENDA');
          toast.error(currentDbUser.onVacation ? 'Sua sessão foi encerrada por motivo de Férias.' : 'Sua conta foi suspensa temporariamente.', { duration: 6000 });
          return;
        }
        const updatedUser = { ...globalUser, role: currentDbUser.role, name: currentDbUser.name };
        setGlobalUser(updatedUser);
        localStorage.setItem('sessionUser', JSON.stringify(updatedUser));
        toast.success(`Atenção: Suas permissões foram atualizadas para ${currentDbUser.role}!`, { icon: '🔄' });
      }
    }
  }, [usersDB, globalUser?.role, globalUser?.username, isBackendReady]);

  // Abas Dinâmicas de acordo com o Menu Lateral
  const sidebarSections = [
    { name: 'ACESSOS', icon: <Key size={18} /> },
    { name: 'CAMPANHAS', icon: <Megaphone size={18} /> },
    { name: 'COLABORADORES', icon: <Users size={18} /> },
    { name: 'CONTROLE-SIMCARD', icon: <Phone size={18} /> },
    { name: 'ESCALA DE TRABALHO', icon: <CalendarDays size={18} /> },
    // { name: 'FATOR RV', icon: <Calculator size={18} /> }, // Oculto temporariamente a pedido
    { name: 'GESTÃO', icon: <Target size={18} /> },
    // { name: 'PROPOSTA', icon: <FileText size={18} /> }, // Oculto temporariamente a pedido
    { name: 'REPROVADOS', icon: <AlertOctagon size={18} /> },
    { name: 'RESULTADO', icon: <BarChart3 size={18} /> },
    { name: 'SCRIPTS', icon: <Copy size={18} /> },
    { name: 'SISTEMAS', icon: <Database size={18} /> },
    { name: 'UR-RESIDENCIAL', icon: <Briefcase size={18} /> },
    { name: 'VENDA', icon: <CreditCard size={18} /> },
    { name: 'PARCIAL & FECHAMENTO', icon: <ClipboardCheck size={18} /> },
    // { name: 'ÁREA - LOJAS', icon: <MapIcon size={18} /> }, // Oculto temporariamente a pedido
    { name: 'GEEK', icon: <Cpu size={18} /> }
  ].sort((a, b) => a.name.localeCompare(b.name));

  // --- REGRAS DE HIERARQUIA DERIVADAS DO LOGIN ---
  // Determina através de variáveis booleanas as permissões de acordo com os cargos
  const isGerente = globalUser?.role === 'GERENTE';
  const isSeniorEquivalent = ['SENIOR', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO', 'JOVEM APRENDIZ', 'GEEK'].includes(globalUser?.role);
  
  const canModifySimcard = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'JOVEM APRENDIZ', 'GEEK'].includes(globalUser?.role);
  const canEditSchedule = isGerente;
  const hasScheduleAccess = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK'].includes(globalUser?.role);
  const hasMetaAccess = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK', 'JOVEM APRENDIZ', 'ASSISTENTE RELACIONAMENTO'].includes(globalUser?.role);
  const canEditMeta = ['GERENTE', 'SENIOR'].includes(globalUser?.role);
  const hasParcialAccess = ['GERENTE', 'SENIOR', 'GEEK', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO'].includes(globalUser?.role);
  const hasAreaLojasAccess = ['GERENTE', 'SENIOR', 'GEEK'].includes(globalUser?.role);
  const isVendedor = globalUser?.role === 'VENDEDOR';

  // --- LÓGICA DE LOGIN ---
  // Envio do formulário de autenticação global e/ou de senhas específicas
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const upperUser = authCredentials.user ? authCredentials.user.toUpperCase() : '';
    const userMatched = (usersDB || {})[upperUser] || {}[authCredentials.user] || {}[authCredentials.user?.toLowerCase()];
    if (userMatched && userMatched.pass === authCredentials.password) {
      if (userMatched.role === 'SUSPENDER') {
        setAuthError('Conta suspensa temporariamente. Procure o Gerente.');
        return;
      }
      if (userMatched.onVacation) {
        setAuthError('Sua conta está bloqueada por motivo de Férias.');
        return;
      }
      if (authModal.requiredRole && authModal.requiredRole !== userMatched.role) {
        if (authModal.requiredRole === 'SENIOR' && !['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK'].includes(userMatched.role)) {
          setAuthError('Acesso negado. Requer permissão de Sênior ou superior.');
          return;
        }
        if (authModal.requiredRole === 'GERENTE' && userMatched.role !== 'GERENTE') {
          setAuthError('Acesso negado. Requer permissão de Gerente.');
          return;
        }
      }
      const userWithTime = { ...userMatched, username: authCredentials.user, loginTime: Date.now() };
      setGlobalUser(userWithTime);
      localStorage.setItem('sessionUser', JSON.stringify(userWithTime));
      setAuthError('');
      if (userMatched.role === 'VENDEDOR') setSelectedSeller(userMatched.name);
      if (authModal.pendingAction === 'DELETE' && authModal.pendingId !== null && ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'JOVEM APRENDIZ', 'GEEK'].includes(userMatched.role)) {
        handleSetSimcardsData(prev => prev.filter(item => item.id !== authModal.pendingId));
      }
      setAuthModal({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
      setAuthCredentials({ user: '', password: '' });
      if (activeTab === 'GESTÃO' && !['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK', 'JOVEM APRENDIZ', 'ASSISTENTE RELACIONAMENTO'].includes(userMatched.role)) setActiveTab('VENDA');
      if (activeTab === 'ESCALA DE TRABALHO' && !['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK'].includes(userMatched.role)) setActiveTab('VENDA');
      if (activeTab === 'PARCIAL & FECHAMENTO' && !['GERENTE', 'SENIOR', 'GEEK', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO'].includes(userMatched.role)) setActiveTab('VENDA');
      if (activeTab === 'ACESSOS' && userMatched.role !== 'GERENTE') setActiveTab('VENDA');
      if (activeTab === 'ÁREA - LOJAS' && !['GERENTE', 'SENIOR', 'GEEK'].includes(userMatched.role)) setActiveTab('VENDA');
    } else {
      setAuthError('Usuário ou senha incorretos. Acesso negado.');
    }
  };

  // Logout manual e remoção de credenciais
  const handleLogout = () => {
    setGlobalUser(null);
    setSelectedSeller(null);
    localStorage.removeItem('sessionUser');
    if (activeTab === 'GESTÃO' || activeTab === 'ESCALA DE TRABALHO' || activeTab === 'ACESSOS' || activeTab === 'PARCIAL & FECHAMENTO' || activeTab === 'ÁREA - LOJAS') setActiveTab('VENDA');
  };


  // =========================================================
  // 🛡️ TELA DE BLOQUEIO INICIAL (LOGIN OBRIGATÓRIO)
  // =========================================================
  // Renderiza tela de Loading enquanto as Collections não estão preparadas
  if (!isBackendReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900 font-sans flex-col gap-4">
        <div className="w-12 h-12 border-4 border-[#E3000F] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm animate-pulse">Conectando ao Servidor Principal (Oracle) e Sincronizando Banco de Dados...</p>
      </div>
    );
  }

  // Se o usuário não está logado globalmente, exibe a tela de Login
  if (!globalUser) {
    return (
      <>
        <Toaster position="top-center" containerStyle={{ top: 80 }} />
        <Login 
          usersDB={{ ...{}, ...(usersDB || {}) }} 
          setUsersDB={setUsersDB} 
          onLogin={(userData, username) => {
            const userWithTime = { ...userData, username, loginTime: Date.now() };

            localStorage.setItem('sessionUser', JSON.stringify(userWithTime));
                
            toast.loading('Iniciando e buscando atualizações...', { duration: 1500 });
            setTimeout(() => {
              window.location.reload();
            }, 1200);
          }} 
        />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F5F5] dark:bg-neutral-950 font-sans overflow-hidden print:overflow-visible print:h-auto print:block text-neutral-800 dark:text-neutral-100 print:bg-white transition-colors duration-500">
      <Toaster position="top-center" containerStyle={{ top: 80 }} />

      {/* Overlay da Barra Lateral em dispositivos Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-20 md:hidden animate-fade-in backdrop-blur-sm no-print" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar - Menu de Navegação Esquerdo */}
      <aside className={`${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-0 md:translate-x-0'} no-print overflow-hidden shrink-0 transition-all duration-500 ease-in-out bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col z-30 fixed md:relative top-0 left-0 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none`}>
        <div className="h-16 flex items-center px-6 border-b border-neutral-100 dark:border-neutral-800 min-w-[16rem] shrink-0">
          <div className="flex items-center text-[#E3000F] font-bold text-xl tracking-tight">
            <img src={wfLogo} alt="WorkFlow Logo" className="w-16 h-auto m-0 object-contain -mr-1" />
            <span>WORKFLOW</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 min-w-[16rem] scrollbar-hide">
          <div className="px-4 mb-2 text-xs font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider">MÓDULOS (A-Z)</div>
          <ul className="space-y-1 px-3">
            {sidebarSections.map((section) => {
              if (section.name === 'GESTÃO' && !hasMetaAccess) return null;
              if (section.name === 'ESCALA DE TRABALHO' && !hasScheduleAccess) return null;
              if (section.name === 'PARCIAL & FECHAMENTO' && !hasParcialAccess) return null;
              if (section.name === 'ACESSOS' && !isGerente) return null;
              // if (section.name === 'ÁREA - LOJAS' && !hasAreaLojasAccess) return null; // Já oculto no array


              return (
                <li key={section.name}>
                  <button 
                    onClick={() => { 
                      if (activeTab === section.name) {
                        setIsSidebarOpen(false);
                      } else {
                        setActiveTab(section.name); 
                      }
                      if (window.innerWidth < 768) setIsSidebarOpen(false); 
                    }} 
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === section.name ? 'bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F]' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
                    title={activeTab === section.name ? "Clique para recolher o menu lateral" : ""}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${activeTab === section.name ? 'text-[#E3000F]' : 'text-neutral-400'}`}>{section.icon}</span>
                      <div className="flex items-center gap-1.5">
                        {section.name}
                        {section.name === 'GEEK' && hasNewGeek && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E3000F]"></span>
                          </span>
                        )}
                        {section.name === 'CAMPANHAS' && hasNewCampanha && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E3000F]"></span>
                          </span>
                        )}
                      </div>
                    </div>
                    {activeTab === section.name && <ChevronRight size={14} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* MONITORAMENTO DO BANCO DE DADOS (ORACLE) */}
        {dbSizeMB !== null && (
          <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400" title="Tamanho atual do banco de dados na Oracle">
              <Database size={14} className="text-[#E3000F]" />
              <span>Oracle DB: {Number(dbSizeMB).toFixed(2)} MB</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden print:overflow-visible print:h-auto print:block bg-white dark:bg-neutral-950">

        {/* Cabeçalho de Ações e Informações */}
        <header className="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 lg:px-8 shrink-0 no-print transition-colors duration-500">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-neutral-500 dark:text-neutral-400 transition-colors"><Menu size={20} /></button>
            <h1 
              onDoubleClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="text-lg font-medium text-neutral-800 dark:text-neutral-100 hidden sm:block cursor-pointer select-none hover:text-[#E3000F] transition-colors"
              title="Duplo clique para expandir/recolher o menu lateral"
            >
              {activeTab}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-5">

            {/* Botão de Desfazer Exclusão */}
            {undoStack.length > 0 && (
              <button 
                onClick={handleUndo} 
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors animate-fade-in"
                title="Desfazer exclusão (Ctrl+Z)"
              >
                <Undo size={16} /> Desfazer
              </button>
            )}
            
            {/* Botão Global de Tutorial */}
            <button 
              onClick={() => setIsTutorialOpen(true)} 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-[#E3000F] dark:text-red-400 rounded-lg text-sm font-medium transition-colors animate-fade-in"
              title="Ver Tutorial desta Tela"
            >
              <BookOpen size={16} /> <span className="hidden lg:inline">Tutorial</span>
            </button>

            

            {/* Botão Wi-Fi para Clientes */}
            <button 
              onClick={() => setIsWifiModalOpen(true)} 
              className="hidden sm:flex p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400 transition-colors" 
              title="Wi-Fi para Clientes"
            >
              <Wifi size={20} />
            </button>

            {/* Seletor do Theme Light/Dark */}
            <button onClick={toggleTheme} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400 transition-colors" title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* SINO DE NOTIFICAÇÕES */}
            {/* Dropdown/Popover das Notificações Recebidas */}
            <div className="relative notification-container">
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (unreadCount > 0 && !isNotificationsOpen) markAllAsRead();
                }} 
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400 transition-colors relative"
                title="Notificações"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E3000F] rounded-full ring-2 ring-white dark:ring-neutral-900 animate-pulse"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="fixed top-16 left-2 right-2 sm:absolute sm:top-12 sm:left-auto sm:right-0 md:-right-4 sm:w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl rounded-2xl overflow-hidden z-50 animate-fade-in origin-top-right">
                  <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50">
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Notificações</h3>
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])} className="text-[10px] font-bold text-neutral-500 hover:text-[#E3000F] uppercase tracking-wider">Limpar tudo</button>
                    )}
                  </div>
                  <div className="max-h-[60vh] sm:max-h-[350px] overflow-y-auto scrollbar-thin">
                    {(!Array.isArray(notifications) || notifications.length === 0) ? (
                      <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma notificação nova.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {notifications.map(notif => (
                          <div key={notif.id} className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${!notif.read ? 'bg-red-50/30 dark:bg-[#E3000F]/5' : ''}`}>
                            <div className="flex gap-3">
                              <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'parcial' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
                                notif.type === 'campanha' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
                                  notif.type === 'campanha_win' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500' : 
                                    notif.type === 'pricing' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500' :
                                      notif.type === 'ur-reminder' ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' :
                                        'bg-red-100 text-[#E3000F] dark:bg-red-900/30'
                                }`}>
                                {notif.type === 'parcial' ? <ClipboardCheck size={16} /> : 
                                  notif.type === 'campanha' ? <Megaphone size={16} /> : 
                                    notif.type === 'campanha_win' ? <Trophy size={16} /> : 
                                      notif.type === 'pricing' ? <DollarSign size={16} /> :
                                        notif.type === 'ur-reminder' ? <Home size={16} /> :
                                          <Target size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-sm mb-0.5 leading-tight ${!notif.read ? 'font-bold text-neutral-900 dark:text-white' : 'font-medium text-neutral-700 dark:text-neutral-300'}`}>{notif.title}</h4>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed break-words">{notif.desc}</p>
                                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-2 block">
                                  {new Date(notif.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Identificação de Empresa */}
            <div className="hidden sm:flex items-center justify-center mx-2">
              <div className="text-[#E3000F] font-black text-xl tracking-tighter uppercase">{getCurrentStoreName()} - {getCurrentStoreCode()}</div>
            </div>

            {/* Dropdown/Perfil do Usuário Global Logado */}
            <div className="pl-2 sm:pl-4 border-l border-neutral-200 dark:border-neutral-800">
              {globalUser && (
                <div className="flex items-center gap-2 sm:gap-3 group">
                  <div className="text-right flex flex-col justify-center">
                    <div className="text-sm font-bold text-neutral-800 dark:text-neutral-100 leading-tight hidden sm:block">{String(globalUser?.name || '').split(' ').slice(0, 2).join(' ') || 'Usuário'}</div>
                    <div className="text-sm font-bold text-neutral-800 dark:text-neutral-100 leading-tight sm:hidden">{String(globalUser?.name || '').split(' ').slice(0, 2).join(' ') || 'Usuário'}</div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide font-medium">{globalUser?.role || ''}</div>
                  </div>
                  <div className="relative cursor-pointer">
                    <div className="w-10 h-10 bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] rounded-full flex items-center justify-center border border-red-100 dark:border-[#E3000F]/20 group-hover:bg-[#E3000F] group-hover:text-white transition-colors">
                      {isGerente ? <Crown size={18} /> : <UserCircle size={22} />}
                    </div>
                    <div onClick={handleLogout} className="absolute top-12 right-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-xl py-2 w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex items-center justify-center gap-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 z-50">
                      <LogOut size={16} /> Sair
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto print:overflow-visible print:h-auto print:block print:p-0 print:bg-white p-2 sm:p-4 lg:p-8 bg-neutral-50 dark:bg-neutral-950 print-area-wrapper transition-colors duration-500">

          {/* Roteador/Renderizador do Conteúdo Principal conforme as Abas ativas */}
          {activeTab === 'GESTÃO' ? (
            <Gestao hasAccess={hasMetaAccess} canEdit={canEditMeta} setAuthModal={setAuthModal} goalsDB={goalsDB} setGoalsDB={setGoalsDB} currentYYYYMM={currentYYYYMM} usersDB={usersDB} salesData={salesData} globalMonth={globalMonth} />
          ) : activeTab === 'VENDA' ? (
            <Venda salesData={salesData} setSalesData={handleSetSalesData} isVendedor={isVendedor} globalUser={globalUser} usersDB={usersDB} globalMonth={globalMonth} />
          ) : activeTab === 'CONTROLE-SIMCARD' ? (
            <ControleSimcard simcardsData={simcardsData} setSimcardsData={handleSetSimcardsData} canModifySimcard={canModifySimcard} globalUser={globalUser} setAuthModal={setAuthModal} usersDB={usersDB} />
          ) : activeTab === 'COLABORADORES' ? (
            <Colaboradores selectedSeller={selectedSeller} setSelectedSeller={setSelectedSeller} isVendedor={isVendedor} globalUser={globalUser} salesData={salesData} goalsDB={goalsDB} usersDB={usersDB} setAuthModal={setAuthModal} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} />
          ) : activeTab === 'ESCALA DE TRABALHO' ? (
            <EscalaTrabalho canEditSchedule={canEditSchedule} scheduleData={scheduleData} setScheduleData={setScheduleData} monthlyOverrides={monthlyOverrides} setMonthlyOverrides={setMonthlyOverrides} hasAccess={hasScheduleAccess} setAuthModal={setAuthModal} usersDB={usersDB} />
          ) : activeTab === 'SISTEMAS' ? (
            <Sistemas />
          ) : activeTab === 'ACESSOS' ? (
            <Acessos setScheduleData={setScheduleData} setMonthlyOverrides={setMonthlyOverrides} setReprovadosData={handleSetReprovadosData} globalUser={globalUser} />
          ) : activeTab === 'UR-RESIDENCIAL' ? (
            <UrResidencial salesData={salesData} setSalesData={handleSetSalesData} globalUser={globalUser} isGerente={isGerente} usersDB={usersDB} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} />
          ) : activeTab === 'PROPOSTA' ? (
            <Proposta globalUser={globalUser} />
          ) : activeTab === 'REPROVADOS' ? (
            <Reprovados reprovadosData={reprovadosData} setReprovadosData={handleSetReprovadosData} globalUser={globalUser} isGerente={isGerente} isVendedor={isVendedor} usersDB={usersDB} globalMonth={globalMonth} />
          ) : activeTab === 'RESULTADO' ? (
            <Resultado salesData={salesData} goalsDB={goalsDB} usersDB={usersDB} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} />
          ) : activeTab === 'ÁREA - LOJAS' ? (
            <AreaLojas globalMonth={globalMonth} />
          ) : activeTab === 'PARCIAL & FECHAMENTO' ? (
            <ParcialFechamento hasAccess={hasParcialAccess} salesData={salesData} goalsDB={goalsDB} globalMonth={globalMonth} />
          ) : activeTab === 'GEEK' ? (
            <Geek geekDocs={geekDocs} setGeekDocs={handleSetGeekDocs} isGerente={isGerente} globalUser={globalUser} updateUserProfile={updateUserProfile} />
          ) : activeTab === 'SCRIPTS' ? (
            <Scripts globalUser={globalUser} usersDB={usersDB} />
          ) : activeTab === 'CAMPANHAS' ? (
            <Campanha globalUser={globalUser} campanhasData={campanhasData} setCampanhasData={handleSetCampanhasData} updateUserProfile={updateUserProfile} />
          ) : activeTab === 'FATOR RV' ? (
            <FatorRvv globalUser={globalUser} salesData={salesData} goalsDB={goalsDB} usersDB={usersDB} globalMonth={globalMonth} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 animate-fade-in border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-white/50 dark:bg-neutral-900/50">
              <Database size={48} className="mb-4 text-neutral-300" />
              <h2 className="text-xl font-medium text-neutral-600 dark:text-neutral-400 mb-2">Módulo {activeTab}</h2>
            </div>
          )}
        </div>

        <footer className="w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 py-3 shrink-0 no-print flex items-center justify-center transition-colors duration-500">
          <p className="text-[10px] sm:text-xs text-neutral-400 font-semibold tracking-widest uppercase text-center px-4 whitespace-nowrap">
            <span className="hidden sm:inline">&copy; {new Date().getFullYear()} Todos os direitos reservados <span className="text-[#E3000F] mx-1">-</span> Desenvolvido por Matheus Rabelo <span className="text-[#E3000F] mx-1">-</span></span>
            <span className="sm:hidden">&copy; {new Date().getFullYear()} Dev: Matheus Rabelo</span>
          </p>
        </footer>
      </main>

      {/* ========================================================= */}
      {/* 🛡️ MÓDULO 7: MODAIS GLOBAIS DE SISTEMA */}
      {/* ========================================================= */}

      {/* MODAL DE AUTENTICAÇÃO DO SISTEMA (LOGIN GLOBAL) */}
      {authModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800 rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2"><Lock size={18} className="text-[#E3000F]" /> Login do Sistema</h2>
                </div>
                <button onClick={() => setAuthModal({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null })} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 rounded-full transition-colors"><X size={18} /></button>
              </div>

              <form onSubmit={handleAuthSubmit} className="p-6 space-y-4 bg-white dark:bg-neutral-900 rounded-b-2xl">
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
                  Acesse o painel para liberar permissões e customizar seu perfil de visualização de acordo com sua função.
                </div>

                {authError && (
                  <div className="bg-red-50 text-[#E3000F] text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2">
                    <AlertCircle size={14} /> {authError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Matrícula / Usuário</label>
                  <input
                    type="text"
                    value={authCredentials.user}
                    onChange={e => setAuthCredentials({ ...authCredentials, user: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Senha</label>
                  <input
                    type="password"
                    value={authCredentials.password}
                    onChange={e => setAuthCredentials({ ...authCredentials, password: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] tracking-widest"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="submit" className="w-full py-3 bg-[#E3000F] text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2">
                    <Check size={16} /> Confirmar Acesso
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE WI-FI PARA CLIENTES */}
      {isWifiModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print flex items-center justify-center" onClick={() => setIsWifiModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm animate-fade-in flex flex-col items-center p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-50 dark:bg-[#E3000F]/10 rounded-full flex items-center justify-center text-[#E3000F] mb-4">
              <Wifi size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 mb-2 tracking-tight">Wi-Fi LOJA_CLIENTE</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              Escaneie o QR Code abaixo para se conectar à internet automaticamente.
            </p>
            
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 mb-6 w-full max-w-[280px] aspect-square">
              <img 
                src={qrWifiImg} 
                alt="QR Code Wi-Fi" 
                className="w-full h-full object-contain rounded-xl" 
              />
            </div>

            <button onClick={() => setIsWifiModalOpen(false)} className="w-full py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl transition-colors">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL DE TUTORIAIS */}
      {isTutorialOpen && (
        <Tutorial onClose={() => setIsTutorialOpen(false)} defaultTab={activeTab} globalUser={globalUser} />
      )}

      {/* MODAL DE ATUALIZAÇÕES (NOVIDADES) EXTRAÍDO */}
      <Atualizacoes globalUser={globalUser} updateUserProfile={updateUserProfile} usersDB={usersDB} />

      {/* MODAL DE LEMBRETE UR RESIDENCIAL */}
      {isUrReminderModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print flex items-center justify-center" onClick={() => setIsUrReminderModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-fade-in flex flex-col items-center p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-cyan-50 dark:bg-cyan-900/20 rounded-full flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-4 border-4 border-white dark:border-neutral-900 shadow-lg">
              <Home size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 mb-2 tracking-tight">Acompanhe suas Instalações!</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              Lembre-se de verificar a aba <strong className="text-neutral-700 dark:text-neutral-300">"UR RESIDENCIAL"</strong> para acompanhar o status de suas vendas de fibra e TV. Não deixe nenhuma venda cair por falta de acompanhamento!
            </p>

            <button 
              onClick={() => {
                setIsUrReminderModalOpen(false);
                setActiveTab('UR-RESIDENCIAL');
              }} 
              className="w-full py-3 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
            >
              <Check size={18} /> CIENTE, IR PARA A ABA
            </button>
          </div>
        </div>
      )}

      {/* ALERTA GLOBAL DE FALHA DE CONEXÃO COM O SERVIDOR ORACLE */}
      {isOffline && (
        <div className="fixed inset-0 z-[9999] bg-[#E3000F] flex flex-col items-center justify-center text-white animate-fade-in p-6 text-center">
          <div className="bg-white/10 p-6 rounded-full mb-6 backdrop-blur-sm animate-pulse">
            <WifiOff size={80} className="text-white" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight drop-shadow-lg uppercase">SISTEMA OFFLINE</h1>
          <p className="text-xl sm:text-2xl mb-8 max-w-2xl font-medium drop-shadow-md">
            O painel perdeu a conexão com o servidor da Oracle ou você está sem internet.
          </p>
          <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
            <Loader2 size={20} className="animate-spin" />
            <span className="font-semibold tracking-wider uppercase text-sm">Tentando reconectar automaticamente...</span>
          </div>
        </div>
      )}
    </div>
  );
} 
