import React, { useState, useEffect, useMemo } from "react";
import { getFirstName, getFirstAndLastName } from '../utils/nameFormatter.js';
import {
  Key,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Trash2,
  Edit3,
  X,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Users,
  Layers,
  Sparkles,
  Smartphone,
  Flame,
  FileSpreadsheet
} from "lucide-react";
import toast from "react-hot-toast";
import "../styles/Acessos/AcessoStyle.css";
import { apiSaveUser, apiDeleteUser, apiUnlockCofre } from "../services/acessosService.js";

// MATRIZ OFICIAL DE CREDENCIAMENTO E GOVERNANÇA TELECOM
const MAPA_PERMISSOES = {
  GERENTE: {
    title: "GERENTE",
    nivel: "Nível 1 - Gestão Master da Filial",
    corBadge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
    corBorda: "border-red-500/40",
    podeVer: [
      "Todas as 16 seções do sistema sem restrição",
      "Venda, Gross One Page, Residencial, Devices & Seguro",
      "Controle de SIMCard, Lote de ICCID e Selos Digitais",
      "Visão 360 e Ranking individual de todos os colaboradores",
      "Escala Geral de Trabalho e Folgas da Loja",
      "Mapa de Calor de Reprovados por CEP e Região",
      "Resultado DRE, Metas Globais e Parcial/Fechamento",
      "Campanhas Ativas, Apuração em Tempo Real e Aceites Digitais",
      "Histórico completo de Auditoria e Logs de Alterações"
    ],
    podeMexer: [
      "Alterar e cadastrar metas da filial e por vendedor",
      "Aprovar e modificar escalas de trabalho e folgas",
      "Autorizar quebra de travas do sistema (authModal Gerencial)",
      "Criar, pausar e definir regras de pontos para Campanhas",
      "Remover ou conceder Selos Digitais de ICCID/SIMCard",
      "Excluir ou editar registros de vendas, reprovados e propostas",
      "Gerenciar status de férias e bloqueios automáticos de usuários"
    ],
    podeOlhar: [
      "Mapa de Calor de viabilidade e motivos de reprovação no Maps",
      "Rankings diários, semanais e consolidados de vendas",
      "DRE de rentabilidade e projeção de faturamento da loja",
      "Taxa de conversão de esteiras de proposta e reoferta",
      "Relatório executivo exportável para diretoria da Claro"
    ]
  },
  SENIOR: {
    title: "SÊNIOR",
    nivel: "Nível 2 - Supervisão de Salão / Subgerente",
    corBadge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    corBorda: "border-blue-500/40",
    podeVer: [
      "Seção Venda e acompanhamento geral de salão",
      "Controle de SIMCard e validação de ICCID",
      "Visão 360 da equipe para direcionamento tático",
      "Escala de Trabalho publicada para consulta",
      "Reprovados e esteiras de viabilidade técnica",
      "Parcial & Fechamento diário da loja",
      "Campanhas ativas e ranking de apuração"
    ],
    podeMexer: [
      "Lançamento de vendas próprias e apoio a consultores",
      "Conferência e triagem de lotes de SIMCard",
      "Registro de tratativas na esteira de reprovados",
      "Dar aceite digital 'CIENTE' em campanhas elegíveis",
      "Preenchimento de checklists operacionais e abertura de chamados"
    ],
    podeOlhar: [
      "Painel de desempenho coletivo da filial",
      "Ranking de vendas e atingimento de metas diárias",
      "Mapa de viabilidade de CEPs para suporte ao salão",
      "Status de liberação de chips do estoque"
    ]
  },
  VENDEDOR: {
    title: "VENDEDOR",
    nivel: "Nível 3 - Consultor Comercial de Balcão",
    corBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    corBorda: "border-emerald-500/40",
    podeVer: [
      "Aba Venda (Gross One Page, Residencial, Devices & Seguro)",
      "Sua própria Visão 360 (Vendas individuais e atingimento)",
      "Sua própria Escala de Trabalho e dias de folga no mês",
      "Campanhas ativas nas quais esteja elegível",
      "Propostas e esteira de Reprovados para contestação",
      "Sistemas Claro e Scripts de Vendas e Argumentações"
    ],
    podeMexer: [
      "Lançamento de suas vendas individuais em tempo real",
      "Inserção de ICCID (validação obrigatória de exatos 20 dígitos)",
      "Dar aceite digital 'CIENTE' nos termos de novas campanhas",
      "Cadastrar novas propostas e registrar vendas reprovadas",
      "Consultar ferramentas de viabilidade residencial"
    ],
    podeOlhar: [
      "Sua pontuação e colocação na apuração da campanha",
      "Sua projeção de comissões e atingimento de cotas",
      "Histórico de vendas registradas em seu nome",
      "Script e argumentários de produtos Claro"
    ]
  },
  ADMINISTRAÇÃO: {
    title: "ADMINISTRAÇÃO",
    nivel: "Nível 3 - Backoffice, Caixa & Estoque",
    corBadge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
    corBorda: "border-orange-500/40",
    podeVer: [
      "Controle de SIMCard e conferência de ICCIDs",
      "Esteira de Propostas e conferência de contratos",
      "Módulo de Reprovados e auditoria cadastral",
      "Sistemas Claro de emissão de notas e ativações",
      "Escala própria de trabalho"
    ],
    podeMexer: [
      "Dar entrada e saída em lotes de chips físicos",
      "Marcar ICCID como 'Corrigido / Processado'",
      "Validação documental de propostas de clientes",
      "Atualizar status de contratos em esteira de validação"
    ],
    podeOlhar: [
      "Saldo e estoque de chips por tipo (DDD, e-SIM, Físico)",
      "Relatórios de divergências de contratos e cadastros",
      "Histórico de chips distribuídos por consultor"
    ]
  },
  "ASSISTENTE RELACIONAMENTO": {
    title: "ASSISTENTE RELACIONAMENTO",
    nivel: "Nível 4 - Pós-Venda & Atendimento ao Cliente",
    corBadge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    corBorda: "border-purple-500/40",
    podeVer: [
      "Módulo de Reprovados e esteiras de recusa",
      "Aba de Propostas e históricos de atendimento",
      "Scripts de Atendimento, Pós-Venda e Retenção",
      "Sistemas integrados de consulta de clientes"
    ],
    podeMexer: [
      "Registrar contato de reoferta em clientes reprovados",
      "Atualizar status da esteira de pós-venda",
      "Cadastrar novas tentativas de viabilidade de rede"
    ],
    podeOlhar: [
      "Mapa de calor de reprovações para entender regiões sem cobertura",
      "Histórico de reclamações e motivos de desistência",
      "Indicadores de satisfação e resolução de clientes"
    ]
  },
  GEEK: {
    title: "GEEK",
    nivel: "Nível 4 - Consultor de Tecnologia & Devices",
    corBadge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    corBorda: "border-indigo-500/40",
    podeVer: [
      "Módulo Geek e Manuais Técnicos de Smartphones/Aparelhos",
      "Aba Venda (foco em Devices, Acessórios, Seguros e Claro UP)",
      "Tabela de avaliação de Trocafy (Trade-In de Aparelhos)",
      "Propostas e Scripts de Ativação de Aparelhos"
    ],
    podeMexer: [
      "Lançamento de vendas de aparelhos e seguros vinculados",
      "Upload e atualização de manuais técnicos no módulo Geek",
      "Registro de laudos de aparelhos usados em Trade-In"
    ],
    podeOlhar: [
      "Tabelas de valores de Trade-In e seguros atualizadas",
      "Desempenho individual no indicador Devices & Seguro",
      "Manuais de procedimentos de garantia e assistência técnica"
    ]
  },
  "JOVEM APRENDIZ": {
    title: "JOVEM APRENDIZ",
    nivel: "Nível 5 - Apoio Operacional & Treinamento",
    corBadge: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
    corBorda: "border-teal-500/40",
    podeVer: [
      "Sistemas Claro e base de conhecimento",
      "Módulo Geek com manuais e treinamentos",
      "Scripts de atendimento e argumentações padrão",
      "Sua própria Escala de Trabalho e horários pedagógicos"
    ],
    podeMexer: [
      "Lançamentos operacionais básicos com supervisão de Sênior",
      "Consultas autorizadas de viabilidade simples"
    ],
    podeOlhar: [
      "Materiais educativos e cartilhas Claro",
      "Escala e horários de intervalo"
    ]
  },
  SUSPENDER: {
    title: "SUSPENDER",
    nivel: "Nível 0 - Acesso Bloqueado / Desligado",
    corBadge: "bg-neutral-800 text-neutral-400 border-neutral-700 line-through",
    corBorda: "border-neutral-800",
    podeVer: ["Nenhum módulo. Tela de bloqueio imediato."],
    podeMexer: ["Nenhuma ação. Permissões de escrita revogadas."],
    podeOlhar: ["Nenhum dado ou relatório disponível."]
  }
};

export function Acessos({
  setScheduleData,
  setMonthlyOverrides,
  setReprovadosData,
  globalUser,
  usersDB: propUsersDB = {},
  isGerente = false
}) {
  const [activeTabSub, setActiveTabSub] = useState("mapa"); // "mapa" | "cofre"
  const [selectedRole, setSelectedRole] = useState("GERENTE");
  const [searchCollaborator, setSearchCollaborator] = useState("");
  
  // Cofre states
  const [usersDB, setUsersDB] = useState(propUsersDB || {});
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPass, setMasterPass] = useState("");
  const [showPassword, setShowPassword] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "GERENTE",
    phone: "",
    email: "",
    birthDate: "",
    vacationStart: "",
    vacationEnd: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Sincroniza usersDB com prop caso atualize externamente
  useEffect(() => {
    if (propUsersDB && Object.keys(propUsersDB).length > 0 && (!usersDB || Object.keys(usersDB).length === 0)) {
      setUsersDB(propUsersDB);
    }
  }, [propUsersDB]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Validação de Gerente
  const isUserGerente = isGerente || globalUser?.role === "GERENTE";

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!masterPass) return;

    setIsUnlocking(true);
    try {
      const response = await apiUnlockCofre(masterPass);
      if (response && response.usersDB) {
        setUsersDB(response.usersDB);
      }
      if (response && response.token) {
        localStorage.setItem("jwt_token", response.token);
      }
      setIsUnlocked(true);
      toast.success("Cofre de Acessos Desbloqueado!");
    } catch (error) {
      toast.error(error.message || "Senha de desenvolvedor incorreta!");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setMasterPass("");
  };

  const toggleShowPass = (user) => {
    setShowPassword((prev) => ({ ...prev, [user]: !prev[user] }));
  };

  const openModal = (userKey = null) => {
    if (userKey) {
      setEditingUsername(userKey);
      setFormData({
        ...usersDB[userKey],
        username: userKey,
        password: usersDB[userKey].pass,
        email: usersDB[userKey].email || "",
        birthDate: usersDB[userKey].birthDate || "",
        vacationStart: usersDB[userKey].vacationStart || "",
        vacationEnd: usersDB[userKey].vacationEnd || "",
      });
    } else {
      setEditingUsername(null);
      setFormData({
        name: "",
        username: "",
        password: "",
        role: "GERENTE",
        phone: "",
        email: "",
        birthDate: "",
        vacationStart: "",
        vacationEnd: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (userKey) => {
    if (
      window.confirm(
        `Tem certeza que deseja apagar o usuário ${userKey}? Ele perderá o acesso instantaneamente.`
      )
    ) {
      try {
        const response = await apiDeleteUser(userKey, globalUser?.role);
        if (response && response.usersDB) {
          setUsersDB(response.usersDB);
        }
        toast.success("Usuário apagado com sucesso!");
      } catch (error) {
        toast.error("Erro ao apagar usuário: " + error.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) {
      toast.error("Preencha os campos obrigatórios!");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiSaveUser(editingUsername, {
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        email: formData.email,
        birthDate: formData.birthDate,
        vacationStart: formData.vacationStart,
        vacationEnd: formData.vacationEnd,
      });
      if (response && response.usersDB) {
        setUsersDB(response.usersDB);
      }
      if (response && response.token) {
        localStorage.setItem("jwt_token", response.token);
      }
      toast.success(
        editingUsername
          ? "Usuário atualizado com sucesso!"
          : "Conta criada com sucesso!"
      );
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case "GERENTE":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "SENIOR":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "ASSISTENTE RELACIONAMENTO":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
      case "ADMINISTRAÇÃO":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
      case "JOVEM APRENDIZ":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
      case "GEEK":
        return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400";
      case "SUSPENDER":
        return "bg-neutral-800 dark:bg-neutral-950 text-neutral-400 dark:text-neutral-600 line-through";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400";
    }
  };

  // Filtragem da lista de colaboradores para o mapa
  const sourceDB = (usersDB && Object.keys(usersDB).length > 0) ? usersDB : propUsersDB;
  const filteredCollaborators = useMemo(() => {
    const list = Object.entries(sourceDB || {}).map(([username, data]) => ({
      username,
      name: data?.name || username,
      role: data?.role || "VENDEDOR",
      onVacation: !!data?.onVacation,
      email: data?.email || "",
      phone: data?.phone || ""
    }));

    if (!searchCollaborator.trim()) return list;

    const term = searchCollaborator.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.username.toLowerCase().includes(term) ||
        c.role.toLowerCase().includes(term)
    );
  }, [sourceDB, searchCollaborator]);

  // Se o usuário não for Gerente, bloqueia o acesso com aviso seguro
  if (!isUserGerente) {
    return (
      <div className="acessos-locked-container p-8 text-center max-w-xl mx-auto">
        <div className="w-20 h-20 bg-red-500/10 dark:bg-red-950/30 border border-red-500/30 rounded-2xl flex items-center justify-center text-[#E3000F] mb-6 shadow-lg shadow-red-500/10">
          <ShieldAlert size={40} />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full text-xs font-black uppercase tracking-widest mb-3">
          Área Restrita ao Gerente da Filial
        </div>
        <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mb-3 tracking-tight">
          Mapa de Credenciamento Restrito
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
          O <strong>Mapa de Credencial</strong> e a matriz de permissões de governança (Ver, Mexer e Olhar) são de uso estritamente gerencial. Apenas usuários autenticados com o cargo de <strong>GERENTE</strong> possuem autorização para auditar o mapeamento de acessos da filial.
        </p>

        <div className="p-4 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 space-y-2">
          <p className="font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-2">
            <Lock size={14} className="text-[#E3000F]" /> Dúvidas sobre seu perfil de acesso?
          </p>
          <p>
            Caso necessite de permissões adicionais para a realização das suas tarefas, solicite a validação com o gerente da sua unidade ou através do canal corporativo de suporte.
          </p>
        </div>
      </div>
    );
  }

  // --- INTERFACE PARA GERENTE ---
  return (
    <div className="acessos-container">
      {/* HEADER SUPERIOR COM SELETOR DE ABAS */}
      <div className="acessos-header">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full justify-between">
          <div className="flex items-center gap-3">
            <div className="acessos-icon-box bg-gradient-to-br from-[#E3000F] to-red-800 text-white shadow-md shadow-red-500/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Governança & Acessos
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                  Exclusivo Gerente
                </span>
              </div>
              <p className="text-xs text-neutral-300 font-medium">
                Matriz de Credenciamento & Gestão de Usuários da Filial
              </p>
            </div>
          </div>

          {/* ABAS SUPERIORES */}
          <div className="flex items-center gap-2 bg-neutral-800/90 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-700 w-full sm:w-auto">
            <button
              onClick={() => setActiveTabSub("mapa")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTabSub === "mapa"
                  ? "bg-[#E3000F] text-white shadow-md shadow-red-600/30"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-700/50"
              }`}
            >
              <Shield size={15} /> Mapa de Credencial
            </button>
            <button
              onClick={() => setActiveTabSub("cofre")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTabSub === "cofre"
                  ? "bg-neutral-100 text-neutral-900 shadow-md"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-700/50"
              }`}
            >
              <Key size={15} /> {isUnlocked ? "Cofre Aberto" : "Cofre de Senhas"}
            </button>
          </div>
        </div>
      </div>

      {/* ABA 1: MAPA DE CREDENCIAL */}
      {activeTabSub === "mapa" && (
        <div className="acessos-content-area space-y-6">
          {/* BANNER / BADGE HOLOGRÁFICO "MAPA DE CREDENCIAL" */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-red-950 border border-red-900/40 p-5 sm:p-7 shadow-xl">
            <div className="absolute -right-8 -top-8 w-44 h-44 bg-[#E3000F]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-[11px] font-black uppercase tracking-widest">
                  <Sparkles size={13} className="text-red-400 animate-pulse" />
                  MAPA DE CREDENCIAL
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  Matriz de Permissões Telecom
                  <span className="text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono font-bold">
                    v2.5.0
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
                  Consulte com clareza institucional o que cada usuário da loja tem autorização para <strong>VER</strong> (módulos abertos), <strong>MEXER</strong> (ações e edições ativas) e até <strong>OLHAR</strong> (consultas analíticas sem edição).
                </p>
              </div>

              {/* IMAGEM / CARD ESTILIZADO DE CREDENCIAL */}
              <div className="w-full md:w-auto flex justify-center">
                <div className="w-72 sm:w-80 bg-neutral-900/90 backdrop-blur-md border border-red-500/30 rounded-2xl p-4 shadow-2xl relative overflow-hidden group hover:border-red-500/60 transition-all">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#E3000F] flex items-center justify-center text-white text-[10px] font-black">
                        CL
                      </div>
                      <span className="text-xs font-black text-white tracking-widest uppercase">
                        CLARO TELECOM
                      </span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      TOKEN ATIVO
                    </span>
                  </div>

                  <div className="space-y-1.5 text-center py-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-red-400 shadow-inner">
                      <ShieldCheck size={26} />
                    </div>
                    <p className="text-xs font-black text-white tracking-wider">
                      MAPA DE CREDENCIAL
                    </p>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      GOVERNANÇA & TRAVAS SEGURAS
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                    <span>FILIAL MATRIZ</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      100% BLINDADO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SELEÇÃO RÁPIDA DE CARGOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-[#E3000F]" />
                Selecione o Cargo para Inspecionar Permissões:
              </h3>
              <span className="text-xs text-neutral-500 font-medium">
                {Object.keys(MAPA_PERMISSOES).length} perfis mapeados
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {Object.keys(MAPA_PERMISSOES).map((roleKey) => {
                const roleData = MAPA_PERMISSOES[roleKey];
                const isSelected = selectedRole === roleKey;
                return (
                  <button
                    key={roleKey}
                    onClick={() => setSelectedRole(roleKey)}
                    className={`p-2.5 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? "bg-[#E3000F] text-white border-red-600 shadow-md shadow-red-600/30 font-black scale-102"
                        : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 font-bold"
                    }`}
                  >
                    <span className="text-[10px] tracking-wider truncate w-full">
                      {roleData.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DETALHAMENTO DO CARGO SELECIONADO: VER | MEXER | OLHAR */}
          {selectedRole && MAPA_PERMISSOES[selectedRole] && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200 font-black text-sm">
                    {selectedRole.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                        {MAPA_PERMISSOES[selectedRole].title}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${MAPA_PERMISSOES[selectedRole].corBadge}`}
                      >
                        {MAPA_PERMISSOES[selectedRole].nivel}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Regras de segurança e limites operacionais aplicados a esta função.
                    </p>
                  </div>
                </div>

                <div className="text-xs text-neutral-500 font-medium">
                  Colaboradores ativos nesta função:{" "}
                  <strong className="text-neutral-900 dark:text-white">
                    {
                      Object.values(sourceDB || {}).filter(
                        (u) => u?.role === selectedRole
                      ).length
                    }
                  </strong>
                </div>
              </div>

              {/* AS 3 COLUNAS OFICIAIS: VER | MEXER | OLHAR */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* 1. PODE VER */}
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-black text-xs uppercase tracking-wider pb-2 border-b border-blue-200/50 dark:border-blue-900/50">
                    <Eye size={16} /> O Que Pode Ver (Módulos)
                  </div>
                  <ul className="space-y-2">
                    {MAPA_PERMISSOES[selectedRole].podeVer.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2 leading-relaxed"
                      >
                        <CheckCircle2
                          size={14}
                          className="text-blue-500 shrink-0 mt-0.5"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. PODE MEXER */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-xs uppercase tracking-wider pb-2 border-b border-emerald-200/50 dark:border-emerald-900/50">
                    <Edit3 size={16} /> O Que Pode Mexer (Edição & Ações)
                  </div>
                  <ul className="space-y-2">
                    {MAPA_PERMISSOES[selectedRole].podeMexer.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2 leading-relaxed"
                      >
                        <CheckCircle2
                          size={14}
                          className="text-emerald-500 shrink-0 mt-0.5"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. PODE OLHAR */}
                <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-black text-xs uppercase tracking-wider pb-2 border-b border-purple-200/50 dark:border-purple-900/50">
                    <Search size={16} /> O Que Pode Olhar (Consultas & BI)
                  </div>
                  <ul className="space-y-2">
                    {MAPA_PERMISSOES[selectedRole].podeOlhar.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2 leading-relaxed"
                      >
                        <CheckCircle2
                          size={14}
                          className="text-purple-500 shrink-0 mt-0.5"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* MAPEAMENTO INDIVIDUAL DOS COLABORADORES DA LOJA */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-[#E3000F]" />
                  Credenciamento da Equipe da Loja
                </h3>
                <p className="text-xs text-neutral-400">
                  Visão consolidada de cada colaborador e seu nível de acesso atual.
                </p>
              </div>

              {/* BUSCA RÁPIDA DE COLABORADOR */}
              <div className="relative w-full sm:w-72">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="text"
                  placeholder="Buscar colaborador ou cargo..."
                  value={searchCollaborator}
                  onChange={(e) => setSearchCollaborator(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Colaborador</th>
                    <th className="px-4 py-3">Login</th>
                    <th className="px-4 py-3">Cargo Mapeado</th>
                    <th className="px-4 py-3">Pode Ver</th>
                    <th className="px-4 py-3">Pode Mexer</th>
                    <th className="px-4 py-3">Pode Olhar</th>
                    <th className="px-4 py-3 text-center rounded-r-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredCollaborators.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-6 text-center text-neutral-400">
                        Nenhum colaborador encontrado com os critérios de busca.
                      </td>
                    </tr>
                  ) : (
                    filteredCollaborators.map((user) => {
                      const perm = MAPA_PERMISSOES[user.role] || MAPA_PERMISSOES.VENDEDOR;
                      return (
                        <tr
                          key={user.username}
                          className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">
                            {user.name}
                          </td>
                          <td className="px-4 py-3 font-mono text-neutral-500">
                            {user.username}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleStyle(
                                user.role
                              )}`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 max-w-xs truncate" title={perm.podeVer.join(", ")}>
                            <span className="text-blue-600 dark:text-blue-400 font-semibold mr-1">👁️</span>
                            {perm.podeVer[0]}
                          </td>
                          <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 max-w-xs truncate" title={perm.podeMexer.join(", ")}>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold mr-1">✍️</span>
                            {perm.podeMexer[0]}
                          </td>
                          <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 max-w-xs truncate" title={perm.podeOlhar.join(", ")}>
                            <span className="text-purple-600 dark:text-purple-400 font-semibold mr-1">🔍</span>
                            {perm.podeOlhar[0]}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {user.onVacation ? (
                              <span className="acessos-badge-ferias">EM FÉRIAS</span>
                            ) : user.role === "SUSPENDER" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-600">
                                SUSPENSO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                ATIVO
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: COFRE DE SENHAS & USUÁRIOS */}
      {activeTabSub === "cofre" && (
        <>
          {!isUnlocked ? (
            <div className="acessos-locked-container">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                Cofre de Acessos
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 mb-8 text-center max-w-md">
                Área restrita ao desenvolvedor e diretoria. Insira a chave mestre para
                gerenciar logins, senhas e criar contas de liderança no sistema.
              </p>

              <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-4">
                <div className="relative">
                  <Key
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    size={18}
                  />
                  <input
                    type="password"
                    placeholder="Senha do Desenvolvedor"
                    value={masterPass}
                    onChange={(e) => setMasterPass(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-xl outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-mono tracking-widest text-center"
                  />
                </div>
                <button
                  type="submit"
                  className="acessos-btn-unlock"
                  disabled={isUnlocking}
                >
                  {isUnlocking ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Unlock size={18} />
                  )}
                  {isUnlocking ? "Verificando..." : "Desbloquear Cofre"}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="acessos-kpi-box">
                    <span className="acessos-kpi-label">Equipe</span>
                    <span className="acessos-kpi-value">
                      {Object.keys(usersDB || {}).length}
                    </span>
                  </div>
                  <div className="acessos-kpi-box">
                    <span className="acessos-kpi-label">Vendedores</span>
                    <span className="acessos-kpi-value">
                      {
                        Object.values(usersDB || {}).filter(
                          (u) => u?.role === "VENDEDOR"
                        ).length
                      }
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button onClick={() => openModal()} className="acessos-btn-primary">
                    <UserPlus size={16} /> Criar Conta de Liderança
                  </button>
                  <button onClick={handleLock} className="acessos-btn-danger">
                    <Lock size={16} /> Trancar Cofre
                  </button>
                </div>
              </div>

              <div className="acessos-content-area">
                <div className="acessos-table-container">
                  <table className="acessos-table">
                    <thead className="acessos-thead">
                      <tr>
                        <th className="px-6 py-4">Nome Completo</th>
                        <th className="px-6 py-4">Usuário (Login)</th>
                        <th className="px-6 py-4">E-mail Corporativo</th>
                        <th className="px-6 py-4">Senha</th>
                        <th className="px-6 py-4">Função / Nível</th>
                        <th className="px-6 py-4">Celular</th>
                        <th className="px-6 py-4">Nascimento</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {!usersDB || Object.keys(usersDB).length === 0 ? (
                        <tr>
                          <td
                            colSpan="8"
                            className="px-6 py-8 text-center text-neutral-400 dark:text-neutral-500"
                          >
                            Nenhum usuário registrado no banco de dados.
                          </td>
                        </tr>
                      ) : (
                        Object.entries(usersDB).map(([username, user]) => (
                          <tr key={username} className="acessos-tr-hover">
                            <td className="acessos-td-bold">
                              {user?.name || "-"}
                              {user?.onVacation && (
                                <span className="acessos-badge-ferias ml-2">
                                  EM FÉRIAS
                                </span>
                              )}
                            </td>
                            <td className="acessos-td-mono">{username}</td>
                            <td className="acessos-td-muted">{user.email || "-"}</td>
                            <td className="acessos-td">
                              <div className="flex items-center gap-2">
                                <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300 tracking-wider">
                                  {showPassword[username] ? user.pass : "••••••••"}
                                </span>
                                <button
                                  onClick={() => toggleShowPass(username)}
                                  className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                                >
                                  {showPassword[username] ? (
                                    <EyeOff size={16} />
                                  ) : (
                                    <Eye size={16} />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="acessos-td">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getRoleStyle(
                                  user.role
                                )}`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="acessos-td-mono">{user.phone || "-"}</td>
                            <td className="acessos-td-muted">
                              {user.birthDate
                                ? new Date(
                                    user.birthDate + "T12:00:00"
                                  ).toLocaleDateString("pt-BR")
                                : "-"}
                            </td>
                            <td className="acessos-td text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openModal(username)}
                                  className="acessos-btn-action-edit"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(username)}
                                  className="acessos-btn-action-delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE USUÁRIO */}
      {isModalOpen && (
        <div className="acessos-modal-overlay">
          <div className="acessos-modal-content">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
                {editingUsername ? "Editar Conta" : "Nova Conta de Liderança"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="acessos-label">Nome Completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="acessos-input-field"
                />
              </div>
              <div className="space-y-1.5">
                <label className="acessos-label">Usuário (Login)</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="acessos-input-field-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="acessos-label">
                  E-mail Corporativo <span className="text-[#E3000F]">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="acessos-input-field"
                  placeholder="exemplo@corporativo.com.br"
                />
              </div>
              <div className="space-y-1.5">
                <label className="acessos-label">Senha de Acesso</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="acessos-input-field-mono tracking-wider"
                />
              </div>
              <div className="space-y-1.5">
                <label className="acessos-label">Nível de Acesso (Função)</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="acessos-input-field font-bold"
                >
                  <option className="bg-white dark:bg-neutral-900" value="GERENTE">
                    GERENTE
                  </option>
                  <option className="bg-white dark:bg-neutral-900" value="SENIOR">
                    SÊNIOR
                  </option>
                  <option
                    className="bg-white dark:bg-neutral-900"
                    value="ASSISTENTE RELACIONAMENTO"
                  >
                    ASSISTENTE RELACIONAMENTO
                  </option>
                  <option
                    className="bg-white dark:bg-neutral-900"
                    value="ADMINISTRAÇÃO"
                  >
                    ADMINISTRAÇÃO
                  </option>
                  <option
                    className="bg-white dark:bg-neutral-900"
                    value="JOVEM APRENDIZ"
                  >
                    JOVEM APRENDIZ
                  </option>
                  <option className="bg-white dark:bg-neutral-900" value="GEEK">
                    GEEK
                  </option>
                  <option className="bg-white dark:bg-neutral-900" value="VENDEDOR">
                    VENDEDOR
                  </option>
                  <option
                    className="bg-white dark:bg-neutral-900 text-red-600 font-black"
                    value="SUSPENDER"
                  >
                    SUSPENDER ACESSO
                  </option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="acessos-label">Celular (Opcional)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="acessos-input-field-mono"
                  placeholder="+5511900000000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="acessos-label">
                  Data de Nascimento (Opcional)
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  min="1920-01-01"
                  max="2026-12-31"
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val) {
                      const p = val.split("-");
                      if (p[0] && p[0].length > 4) {
                        p[0] = p[0].slice(0, 4);
                        val = p.join("-");
                      }
                    }
                    setFormData({ ...formData, birthDate: val });
                  }}
                  className="acessos-input-field"
                />
              </div>

              <div className="acessos-date-group border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 bg-neutral-50 dark:bg-neutral-800/50 mt-2">
                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 block">
                  Período de Férias (Bloqueio Automático)
                </label>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <div className="w-full">
                    <label className="text-[10px] text-neutral-400 mb-1 block font-bold">
                      DATA DE SAÍDA
                    </label>
                    <input
                      type="date"
                      value={formData.vacationStart}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vacationStart: e.target.value,
                        })
                      }
                      className="acessos-input-field"
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-[10px] text-neutral-400 mb-1 block font-bold">
                      DATA DE RETORNO
                    </label>
                    <input
                      type="date"
                      value={formData.vacationEnd}
                      onChange={(e) =>
                        setFormData({ ...formData, vacationEnd: e.target.value })
                      }
                      className="acessos-input-field"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-neutral-400 mt-2">
                  * O login será suspenso no 1º dia e restaurado 1 dia após o retorno, automaticamente.
                </p>
              </div>
              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto justify-center px-6 py-2.5 bg-neutral-900 text-white font-medium rounded-xl hover:bg-black transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Salvar Conta"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
