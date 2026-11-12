import "../styles/Campanhas/CampanhaStyle.css";
import React, { useState, useEffect, useMemo } from "react";
import {
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  X,
  Calendar,
  Target,
  Award,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Wifi,
  Smartphone,
  Flame,
  Zap,
  Sparkles,
  Shield,
  Star,
  Clock,
  Check,
  FileCheck2,
  TrendingUp,
  UserCheck,
  Crown,
  Medal
} from "lucide-react";
import toast from "react-hot-toast";
import { getTodaySP } from "../utils/masks";
import { getFirstName } from "../utils/nameFormatter.js";

// Tipos de Estilos de Campanhas Disponíveis
export const ESTILOS_CAMPANHA = [
  { id: "FIBRA", label: "Melhor Venda de Fibra", icon: Wifi, cor: "from-cyan-500 to-blue-600", textCor: "text-cyan-500", borderCor: "border-cyan-500/30", bgBadge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", desc: "Foco em Banda Larga Residencial e TV" },
  { id: "APARELHO", label: "Melhor Venda de Aparelho", icon: Smartphone, cor: "from-purple-500 to-indigo-600", textCor: "text-purple-500", borderCor: "border-purple-500/30", bgBadge: "bg-purple-500/10 text-purple-400 border-purple-500/30", desc: "Foco em Smartphones e Dispositivos" },
  { id: "ACE", label: "Melhor Venda de Acessórios", icon: Sparkles, cor: "from-emerald-500 to-teal-600", textCor: "text-emerald-500", borderCor: "border-emerald-500/30", bgBadge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", desc: "Foco em Películas, Áudio, Cabos e Capas" },
  { id: "GROSS_TOTAL", label: "Gross Total (Novas Linhas)", icon: Flame, cor: "from-[#E3000F] to-red-700", textCor: "text-[#E3000F]", borderCor: "border-red-500/30", bgBadge: "bg-red-500/10 text-red-400 border-red-500/30", desc: "Volume Total de Novas Linhas e Portabilidades" },
  { id: "COMBO", label: "Combo Multi & Convergência", icon: Zap, cor: "from-amber-500 to-orange-600", textCor: "text-amber-500", borderCor: "border-amber-500/30", bgBadge: "bg-amber-500/10 text-amber-400 border-amber-500/30", desc: "Venda casada Fibra + Móvel e Rentabilidade" },
  { id: "LIVRE", label: "Incentivo Geral de Loja", icon: Award, cor: "from-neutral-700 to-neutral-900", textCor: "text-neutral-400", borderCor: "border-neutral-500/30", bgBadge: "bg-neutral-500/10 text-neutral-300 border-neutral-500/30", desc: "Campanha Aberta / Regra Customizada" }
];

export const checkHasNewCampanha = (campanhas, globalUser) => {
  try {
    const viewed = globalUser?.viewedCampanhas || {};
    return (campanhas || []).some((camp) => {
      const lastUpdated = camp.updatedAt || camp.id;
      const isRecent = Date.now() - lastUpdated < 15 * 24 * 60 * 60 * 1000;
      if (!isRecent) return false;
      return viewed[camp.id] !== lastUpdated;
    });
  } catch {
    return false;
  }
};

export function Campanha({
  globalUser,
  campanhasData = [],
  setCampanhasData,
  updateUserProfile,
  salesData = [],
  usersDB = {},
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCampIdForStatus, setSelectedCampIdForStatus] = useState(null);
  const [aceiteModal, setAceiteModal] = useState({ isOpen: false, campanha: null });

  const [formData, setFormData] = useState({
    titulo: "",
    tipoCampanha: "FIBRA",
    pontosFibra: "10",
    pontosPos: "5",
    pontosControle: "4",
    pontosAparelho: "8",
    pontosAcessorio: "3",
    pontosGross: "2",
    metaPontos: "100",
    regraPontos: "",
    descricao: "",
    premio: "",
    ganhadores: "",
    dataInicio: "",
    dataFim: "",
    status: "ATIVA",
  });

  const viewedCampanhas = globalUser?.viewedCampanhas || {};

  const canEdit = ["GERENTE", "SENIOR", "ADMINISTRAÇÃO", "GEEK"].includes(
    globalUser?.role,
  );

  const safeVendedores = useMemo(() => {
    return Object.values(usersDB || {})
      .filter((u) => !u?.role || u?.role === "VENDEDOR")
      .map((u) => String(u?.name || ""))
      .filter(Boolean);
  }, [usersDB]);

  // Campanha selecionada para exibição no Painel de Status
  const activeCampanhaForStatus = useMemo(() => {
    if (!campanhasData.length) return null;
    if (selectedCampIdForStatus) {
      const found = campanhasData.find((c) => c.id === selectedCampIdForStatus);
      if (found) return found;
    }
    const ativa = campanhasData.find((c) => c.status === "ATIVA");
    return ativa || campanhasData[0] || null;
  }, [campanhasData, selectedCampIdForStatus]);

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({
      titulo: "",
      tipoCampanha: "FIBRA",
      pontosFibra: "10",
      pontosPos: "5",
      pontosControle: "4",
      pontosAparelho: "8",
      pontosAcessorio: "3",
      pontosGross: "2",
      metaPontos: "100",
      regraPontos: "1 venda Fibra = 10 pts • 1 Pós = 5 pts • 1 Controle = 4 pts • 1 Aparelho = 8 pts",
      descricao: "",
      premio: "",
      ganhadores: "",
      dataInicio: "",
      dataFim: "",
      status: "ATIVA",
    });
    setIsModalOpen(true);
  };

  const markAsViewed = (camp) => {
    const lastUpdated = camp.updatedAt || camp.id;
    if (viewedCampanhas[camp.id] !== lastUpdated) {
      const newViewed = { ...viewedCampanhas, [camp.id]: lastUpdated };
      updateUserProfile({ viewedCampanhas: newViewed });
    }
  };

  const isCampNew = (camp) => {
    const lastUpdated = camp.updatedAt || camp.id;
    const isRecent = Date.now() - lastUpdated < 15 * 24 * 60 * 60 * 1000;
    if (!isRecent) return false;
    return viewedCampanhas[camp.id] !== lastUpdated;
  };

  const hasNews = (campanhasData || []).some(isCampNew);

  const handleEdit = (campanha) => {
    setEditingId(campanha.id);
    setFormData({
      tipoCampanha: "FIBRA",
      pontosFibra: campanha.pontosFibra || "10",
      pontosPos: campanha.pontosPos || "5",
      pontosControle: campanha.pontosControle || "4",
      pontosAparelho: campanha.pontosAparelho || "8",
      pontosAcessorio: campanha.pontosAcessorio || "3",
      pontosGross: campanha.pontosGross || "2",
      metaPontos: campanha.metaPontos || "100",
      regraPontos: campanha.regraPontos || "",
      ...campanha,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta campanha?")) {
      setCampanhasData((prev) => prev.filter((c) => c.id !== id));
      toast.success("Campanha excluída com sucesso!");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.dataInicio || !formData.dataFim) {
      toast.error("Preencha os campos obrigatórios (Título e Datas).");
      return;
    }

    if (editingId) {
      setCampanhasData((prev) =>
        prev.map((c) =>
          c.id === editingId ? { ...c, ...formData, updatedAt: Date.now() } : c,
        ),
      );
      toast.success("Campanha atualizada com sucesso!");
    } else {
      setCampanhasData((prev) => [
        { ...formData, id: Date.now(), updatedAt: Date.now(), aceites: {} },
        ...prev,
      ]);
      toast.success("Nova campanha lançada!");
    }
    setIsModalOpen(false);
  };

  // ACEITE DIGITAL
  const handleDarAceiteDigital = (campanha) => {
    setAceiteModal({ isOpen: true, campanha });
  };

  const handleConfirmarAceite = () => {
    if (!aceiteModal.campanha || !globalUser) return;
    const campId = aceiteModal.campanha.id;
    const userKey = globalUser.username || globalUser.name || "COLABORADOR";
    const userName = globalUser.name || userKey;

    setCampanhasData((prev) =>
      prev.map((c) => {
        if (c.id === campId) {
          const currentAceites = c.aceites || {};
          return {
            ...c,
            aceites: {
              ...currentAceites,
              [userKey]: {
                nome: userName,
                dataAceite: Date.now(),
              },
            },
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );

    toast.success("Aceite digital registrado com sucesso! Você agora é elegível na campanha.");
    setAceiteModal({ isOpen: false, campanha: null });
  };

  const checkUserHasAceite = (campanha, user) => {
    if (!campanha || !user) return false;
    const aceites = campanha.aceites || {};
    const keyUser = user.username || "";
    const keyName = user.name || "";
    return !!(aceites[keyUser] || aceites[keyName] || Object.values(aceites).some(a => a?.nome === keyName));
  };

  const formatDateBR = (dateStr) => {
    if (!dateStr) return "-";
    const parts = String(dateStr).split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // CÁLCULO DOS INDICADORES E PONTOS EM TEMPO REAL POR VENDEDOR
  const apuracaoCampanha = useMemo(() => {
    if (!activeCampanhaForStatus) return { ranking: [], lider: null, totalVendasCampanha: 0 };

    const camp = activeCampanhaForStatus;
    const pFibra = Number(camp.pontosFibra || 10);
    const pPos = Number(camp.pontosPos || 5);
    const pControle = Number(camp.pontosControle || 4);
    const pAparelho = Number(camp.pontosAparelho || 8);
    const pAce = Number(camp.pontosAcessorio || 3);
    const pGross = Number(camp.pontosGross || 2);

    const dInicio = camp.dataInicio ? new Date(camp.dataInicio + "T00:00:00").getTime() : 0;
    const dFim = camp.dataFim ? new Date(camp.dataFim + "T23:59:59").getTime() : Infinity;

    // Filtra vendas de salesData no período
    const vendasPeriodo = (salesData || []).filter((sale) => {
      if (!sale.data) return false;
      let saleTime = 0;
      if (typeof sale.data === "string") {
        if (sale.data.includes("-")) {
          saleTime = new Date(sale.data + "T12:00:00").getTime();
        } else if (sale.data.includes("/")) {
          const parts = sale.data.split("/");
          if (parts.length === 3) {
            saleTime = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`).getTime();
          }
        }
      }
      return saleTime >= dInicio && saleTime <= dFim;
    });

    const sellersMap = {};
    safeVendedores.forEach((v) => {
      sellersMap[v] = {
        nome: v,
        fibra: 0,
        pos: 0,
        controle: 0,
        aparelho: 0,
        acessorio: 0,
        gross: 0,
        totalPontos: 0,
        temAceite: false,
      };
    });

    // Marca aceites
    const aceitesCamp = camp.aceites || {};
    Object.keys(sellersMap).forEach((vNome) => {
      const match = Object.values(aceitesCamp).some(
        (a) => String(a?.nome || "").toUpperCase() === vNome.toUpperCase()
      ) || !!aceitesCamp[vNome];
      sellersMap[vNome].temAceite = match;
    });

    // Contabiliza cada venda
    vendasPeriodo.forEach((sale) => {
      const v = sale.vendedor;
      if (!v) return;
      if (!sellersMap[v]) {
        sellersMap[v] = {
          nome: v,
          fibra: 0,
          pos: 0,
          controle: 0,
          aparelho: 0,
          acessorio: 0,
          gross: 0,
          totalPontos: 0,
          temAceite: false,
        };
        const match = Object.values(aceitesCamp).some(
          (a) => String(a?.nome || "").toUpperCase() === v.toUpperCase()
        ) || !!aceitesCamp[v];
        sellersMap[v].temAceite = match;
      }

      const pBase = String(sale.produto || "").toUpperCase();
      const q = sale.qtda === 0 || sale.qtda === "0" ? 0 : Number(sale.qtda) || 1;
      const op = String(sale.operacao || "").toUpperCase();
      const sub = String(sale.subProduto || "").toUpperCase();

      let isFibra = false;
      let isPos = false;
      let isControle = false;
      let isAparelho = false;
      let isAce = false;

      if (pBase.includes("FIBRA") || pBase.includes("BANDA LARGA")) {
        isFibra = true;
        sellersMap[v].fibra += q;
      } else if (pBase.includes("PÓS") || pBase.includes("POS")) {
        isPos = true;
        sellersMap[v].pos += q;
      } else if (pBase.includes("CONTROLE") || pBase.includes("FLEX")) {
        isControle = true;
        sellersMap[v].controle += q;
      } else if (pBase.includes("APARELHO") || pBase.includes("SMARTPHONE")) {
        isAparelho = true;
        sellersMap[v].aparelho += q;
      } else if (pBase.includes("ACESSÓRIO") || pBase.includes("ACESSORIO") || pBase.includes("PELÍCULA") || pBase.includes("PELICULA")) {
        isAce = true;
        sellersMap[v].acessorio += q;
      }

      // Gross total
      if (isPos || isControle || pBase.includes("DEP") || pBase.includes("PME")) {
        sellersMap[v].gross += q;
      }
    });

    // Calcula pontos (somente pontua no ranking oficial quem deu o aceite digital)
    const ranking = Object.values(sellersMap).map((seller) => {
      const pontos =
        seller.fibra * pFibra +
        seller.pos * pPos +
        seller.controle * pControle +
        seller.aparelho * pAparelho +
        seller.acessorio * pAce +
        seller.gross * pGross;

      return {
        ...seller,
        totalPontos: pontos,
      };
    });

    // Ordenação: elegíveis com aceite e maior pontuação primeiro
    ranking.sort((a, b) => {
      if (a.temAceite && !b.temAceite) return -1;
      if (!a.temAceite && b.temAceite) return 1;
      return b.totalPontos - a.totalPontos;
    });

    const liderElegivel = ranking.find((r) => r.temAceite && r.totalPontos > 0) || ranking[0] || null;

    return {
      ranking,
      lider: liderElegivel,
      totalVendasCampanha: vendasPeriodo.length,
    };
  }, [activeCampanhaForStatus, salesData, safeVendedores]);

  return (
    <div className="campanha-container p-4 sm:p-6 space-y-6">
      {/* CABEÇALHO ELEGANTE E TECNOLÓGICO */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-black rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E3000F] to-orange-500 p-0.5 shadow-lg shadow-red-500/30 shrink-0">
            <div className="w-full h-full bg-black/60 backdrop-blur-md rounded-[14px] flex items-center justify-center text-white">
              <Megaphone size={26} className="animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                Painel de Campanhas & Incentivos
              </h2>
              {hasNews ? (
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[#E3000F] text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E3000F]"></span>
                  Novidades
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                  Atualizado
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 font-medium mt-1">
              Competições oficiais, regras de pontuação por indicador com apuração automática em tempo real.
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenModal}
            className="relative z-10 px-6 py-3.5 bg-gradient-to-r from-[#E3000F] to-red-700 hover:from-red-600 hover:to-red-800 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-red-600/30 flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus size={18} />
            <span>Lançar Nova Campanha</span>
          </button>
        )}
      </div>

      {/* CORPO / GRID DE CARDS DAS CAMPANHAS */}
      <div className="w-full">
        {(campanhasData || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-3xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-4">
              <Trophy size={32} />
            </div>
            <h3 className="text-base font-extrabold text-neutral-800 dark:text-neutral-100 uppercase tracking-wide">
              Nenhuma campanha ativa no momento
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mt-1">
              Quando a gerência ou liderança lançar novos incentivos e metas por pontuação, eles serão exibidos aqui em tempo real.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(campanhasData || []).map((camp) => {
              const estilo = ESTILOS_CAMPANHA.find(e => e.id === camp.tipoCampanha) || ESTILOS_CAMPANHA[0];
              const IconeEstilo = estilo.icon;
              const isAtiva = camp.status === "ATIVA";
              const userHasAceite = checkUserHasAceite(camp, globalUser);

              return (
                <div
                  key={camp.id}
                  onMouseEnter={() => markAsViewed(camp)}
                  onClick={() => setSelectedCampIdForStatus(camp.id)}
                  className={`relative rounded-3xl p-6 transition-all duration-300 border flex flex-col justify-between group shadow-lg cursor-pointer ${
                    activeCampanhaForStatus?.id === camp.id
                      ? "ring-2 ring-[#E3000F] shadow-red-500/10"
                      : ""
                  } ${
                    isAtiva
                      ? "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-[#E3000F]/50 hover:shadow-2xl hover:-translate-y-1"
                      : "bg-neutral-100/60 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-75"
                  }`}
                >
                  {isCampNew(camp) && (
                    <span className="absolute -top-2.5 -right-2.5 px-2.5 py-0.5 rounded-full bg-[#E3000F] text-white text-[9px] font-black uppercase tracking-widest shadow-md animate-bounce">
                      Nova!
                    </span>
                  )}

                  <div>
                    {/* TOPO DO CARD: BADGE DO ESTILO + STATUS */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${estilo.bgBadge}`}>
                        <IconeEstilo size={13} />
                        <span>{estilo.label}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                          isAtiva
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                        }`}>
                          {camp.status}
                        </span>

                        {canEdit && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleEdit(camp)}
                              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              title="Editar"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(camp.id)}
                              className="p-1 rounded-lg text-neutral-400 hover:text-[#E3000F] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TÍTULO E DESCRIÇÃO */}
                    <h3 className="font-black text-lg text-neutral-900 dark:text-white tracking-wide uppercase mb-2">
                      {camp.titulo}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4 line-clamp-3">
                      {camp.descricao || "Participe da campanha atingindo as metas e acumulando pontos!"}
                    </p>

                    {/* CAIXINHA DE PESOS POR INDICADOR */}
                    <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
                        <span className="flex items-center gap-1"><Target size={12} className="text-[#E3000F]" /> Tabela de Pontos:</span>
                        {camp.metaPontos && <span className="text-amber-500">Meta: {camp.metaPontos} pts</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold text-center">
                        <div className="bg-white dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
                          <span className="text-[9px] text-neutral-400 block uppercase">Fibra</span>
                          <span className="text-[#E3000F] font-black">+{camp.pontosFibra || 10}</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
                          <span className="text-[9px] text-neutral-400 block uppercase">Pós</span>
                          <span className="text-blue-500 font-black">+{camp.pontosPos || 5}</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
                          <span className="text-[9px] text-neutral-400 block uppercase">Ctrl</span>
                          <span className="text-purple-500 font-black">+{camp.pontosControle || 4}</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
                          <span className="text-[9px] text-neutral-400 block uppercase">Apar</span>
                          <span className="text-amber-500 font-black">+{camp.pontosAparelho || 8}</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
                          <span className="text-[9px] text-neutral-400 block uppercase">Ace</span>
                          <span className="text-emerald-500 font-black">+{camp.pontosAcessorio || 3}</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
                          <span className="text-[9px] text-neutral-400 block uppercase">Gross</span>
                          <span className="text-rose-500 font-black">+{camp.pontosGross || 2}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RODAPÉ DO CARD: PRAZO, PRÊMIO E ACEITE DIGITAL */}
                  <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-[#E3000F]" />
                        <span>{formatDateBR(camp.dataInicio)} até {formatDateBR(camp.dataFim)}</span>
                      </div>
                      <span className="text-[10px] uppercase font-black text-neutral-400">
                        {Object.keys(camp.aceites || {}).length} Aceite(s)
                      </span>
                    </div>

                    {camp.premio && (
                      <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center gap-2.5">
                        <Award size={16} className="text-amber-500 shrink-0" />
                        <span className="text-xs font-black text-neutral-900 dark:text-white truncate block">
                          {camp.premio}
                        </span>
                      </div>
                    )}

                    {/* BOTÃO DE ACEITE DIGITAL OU STATUS CONFIRMADO */}
                    <div onClick={e => e.stopPropagation()}>
                      {userHasAceite ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider">
                          <FileCheck2 size={15} />
                          <span>Aceite Digital Ativo</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDarAceiteDigital(camp)}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#E3000F] to-red-700 hover:from-red-600 hover:to-red-800 text-white flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider shadow-md shadow-red-500/20 transition-all active:scale-98"
                        >
                          <CheckCircle2 size={15} />
                          <span>Dar Aceite Digital</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PAINEL "STATUS DA CAMPANHA": APURAÇÃO EM TEMPO REAL POR INDICADOR */}
      {activeCampanhaForStatus && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
          {/* HEADER DO PAINEL DE STATUS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center shadow-lg shadow-yellow-500/20 font-black">
                <Trophy size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white uppercase tracking-wide">
                    Status da Campanha: {activeCampanhaForStatus.titulo}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Tempo Real
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Pontuação gerada automaticamente a cada item vendido no período ({formatDateBR(activeCampanhaForStatus.dataInicio)} a {formatDateBR(activeCampanhaForStatus.dataFim)}).
                </p>
              </div>
            </div>

            {/* SELETOR SE HOUVER MAIS DE UMA CAMPANHA */}
            {campanhasData.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 uppercase">Campanha:</span>
                <select
                  value={activeCampanhaForStatus.id}
                  onChange={(e) => setSelectedCampIdForStatus(Number(e.target.value))}
                  className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl text-xs font-bold uppercase outline-none focus:border-[#E3000F]"
                >
                  {campanhasData.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titulo} ({c.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* CARD DE DESTAQUE: LÍDER ATUAL / GANHADOR PROVISÓRIO */}
          {apuracaoCampanha.lider && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black text-xl shadow-md">
                  🥇
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    Líder da Campanha (Ganhador Provisório)
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white uppercase">
                    {apuracaoCampanha.lider.nome}
                  </h4>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {apuracaoCampanha.lider.temAceite ? "✅ Aceite Digital Confirmado (Elegível)" : "⚠️ Pendente de Aceite Digital"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/70 dark:bg-neutral-900/70 border border-amber-500/30 px-5 py-3 rounded-2xl self-start sm:self-center">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block text-right">
                    Pontuação Total
                  </span>
                  <span className="text-2xl font-black text-[#E3000F] block text-right">
                    {apuracaoCampanha.lider.totalPontos} <span className="text-xs font-bold text-neutral-400">pts</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TABELA DE APURAÇÃO POR INDICADOR ESTILO GESTÃO */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="bg-neutral-900 text-white dark:bg-black">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-neutral-800 text-center w-12">#</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-neutral-800">Colaborador / Vendedor</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-neutral-800 text-center">
                    Fibra (+{activeCampanhaForStatus.pontosFibra || 10}pts)
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-neutral-800 text-center">
                    Pós (+{activeCampanhaForStatus.pontosPos || 5}pts)
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-neutral-800 text-center">
                    Controle (+{activeCampanhaForStatus.pontosControle || 4}pts)
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-neutral-800 text-center">
                    Aparelho (+{activeCampanhaForStatus.pontosAparelho || 8}pts)
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-neutral-800 text-center">
                    Acessório (+{activeCampanhaForStatus.pontosAcessorio || 3}pts)
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-neutral-800 text-center bg-red-600/30 text-red-200">
                    Total de Pontos
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">
                    Aceite Digital
                  </th>
                </tr>
              </thead>
              <tbody>
                {apuracaoCampanha.ranking.map((seller, idx) => {
                  const isTop1 = idx === 0 && seller.temAceite;
                  const isTop2 = idx === 1 && seller.temAceite;
                  const isTop3 = idx === 2 && seller.temAceite;

                  return (
                    <tr
                      key={seller.nome}
                      className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors border-b border-neutral-100 dark:border-neutral-800/80 ${
                        isTop1 ? "bg-amber-500/5 font-bold" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center font-black">
                        {isTop1 ? "🥇 1º" : isTop2 ? "🥈 2º" : isTop3 ? "🥉 3º" : `${idx + 1}º`}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                        <span>{getFirstName(seller.nome)}</span>
                        {seller.temAceite ? (
                          <span className="text-[10px] text-emerald-500 font-bold" title="Aceite Confirmado">
                            <CheckCircle2 size={13} className="inline" />
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{seller.fibra}</span>
                        <span className="text-[10px] text-neutral-400 block font-normal">
                          ({seller.fibra * Number(activeCampanhaForStatus.pontosFibra || 10)} pts)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{seller.pos}</span>
                        <span className="text-[10px] text-neutral-400 block font-normal">
                          ({seller.pos * Number(activeCampanhaForStatus.pontosPos || 5)} pts)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{seller.controle}</span>
                        <span className="text-[10px] text-neutral-400 block font-normal">
                          ({seller.controle * Number(activeCampanhaForStatus.pontosControle || 4)} pts)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{seller.aparelho}</span>
                        <span className="text-[10px] text-neutral-400 block font-normal">
                          ({seller.aparelho * Number(activeCampanhaForStatus.pontosAparelho || 8)} pts)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{seller.acessorio}</span>
                        <span className="text-[10px] text-neutral-400 block font-normal">
                          ({seller.acessorio * Number(activeCampanhaForStatus.pontosAcessorio || 3)} pts)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-black text-base text-[#E3000F] font-mono">
                        {seller.totalPontos}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {seller.temAceite ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[10px] font-black uppercase">
                            Elegível
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase">
                            Sem Aceite
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE ACEITE DIGITAL */}
      {aceiteModal.isOpen && aceiteModal.campanha && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 flex flex-col space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/20 text-[#E3000F] flex items-center justify-center shrink-0">
                <FileCheck2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-neutral-900 dark:text-white uppercase">
                  Aceite Digital de Participação
                </h3>
                <p className="text-xs text-neutral-400">Termos e Métricas da Campanha</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-neutral-500 uppercase">Campanha:</span>
                <span className="font-black text-neutral-900 dark:text-white uppercase">{aceiteModal.campanha.titulo}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-neutral-500 uppercase">Período:</span>
                <span className="font-bold text-neutral-700 dark:text-neutral-300">
                  {formatDateBR(aceiteModal.campanha.dataInicio)} até {formatDateBR(aceiteModal.campanha.dataFim)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-neutral-500 uppercase">Premiação:</span>
                <span className="font-bold text-[#E3000F]">{aceiteModal.campanha.premio || "Definida pela Gerência"}</span>
              </div>
            </div>

            <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed space-y-2">
              <p>
                Ao confirmar o seu <strong>Aceite Digital</strong>, você declara estar ciente e de acordo com todas as regras, pesos de indicadores e metas estabelecidas para esta campanha.
              </p>
              <p className="text-[11px] text-neutral-400">
                * Somente vendas devidamente registradas no sistema dentro da vigência serão computadas.
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAceiteModal({ isOpen: false, campanha: null })}
                className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAceite}
                className="px-6 py-2.5 bg-gradient-to-r from-[#E3000F] to-red-700 hover:from-red-600 hover:to-red-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/30 flex items-center gap-1.5"
              >
                <Check size={16} />
                <span>Confirmar e Participar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INTELIGENTE E CENTRALIZADO DE CRIAÇÃO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/20 text-[#E3000F] flex items-center justify-center">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white">
                    {editingId ? "Editar Campanha de Vendas" : "Lançar Nova Campanha de Vendas"}
                  </h3>
                  <p className="text-xs text-neutral-400">Defina o foco comercial, pesos por indicador e regras</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* SELETOR DE ESTILO DA CAMPANHA */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                  1. Estilo / Indicador Foco da Campanha <span className="text-[#E3000F]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ESTILOS_CAMPANHA.map((estilo) => {
                    const Icone = estilo.icon;
                    const isSelected = formData.tipoCampanha === estilo.id;
                    return (
                      <button
                        type="button"
                        key={estilo.id}
                        onClick={() => setFormData({ ...formData, tipoCampanha: estilo.id })}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-black border-transparent shadow-lg scale-102"
                            : "bg-neutral-50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icone size={18} className={isSelected ? "text-[#E3000F]" : estilo.textCor} />
                          {isSelected && <CheckCircle2 size={14} className="text-[#E3000F]" />}
                        </div>
                        <div>
                          <span className="font-extrabold text-xs block leading-tight">{estilo.label}</span>
                          <span className="text-[9px] opacity-70 block leading-tight mt-0.5">{estilo.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TÍTULO DA CAMPANHA */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                  2. Título da Campanha <span className="text-[#E3000F]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase outline-none focus:border-[#E3000F]"
                  placeholder="EX: CAMPANHA DE HALLOWEEN • ACELERA TELECOM"
                  required
                />
              </div>

              {/* BLOCO CENTRALIZADO DE PONTOS POR CADA INDICADOR */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-[#E3000F] tracking-wide">
                    <Sparkles size={16} />
                    <span>3. Regra de Pontos por Cada Indicador</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">Pesos customizáveis</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                      Pontos por Fibra
                    </label>
                    <input
                      type="number"
                      value={formData.pontosFibra}
                      onChange={(e) => setFormData({ ...formData, pontosFibra: e.target.value })}
                      placeholder="10"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                      Pontos por Pós-Pago
                    </label>
                    <input
                      type="number"
                      value={formData.pontosPos}
                      onChange={(e) => setFormData({ ...formData, pontosPos: e.target.value })}
                      placeholder="5"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                      Pontos por Controle
                    </label>
                    <input
                      type="number"
                      value={formData.pontosControle}
                      onChange={(e) => setFormData({ ...formData, pontosControle: e.target.value })}
                      placeholder="4"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                      Pontos por Aparelho
                    </label>
                    <input
                      type="number"
                      value={formData.pontosAparelho}
                      onChange={(e) => setFormData({ ...formData, pontosAparelho: e.target.value })}
                      placeholder="8"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                      Pontos por Acessório
                    </label>
                    <input
                      type="number"
                      value={formData.pontosAcessorio}
                      onChange={(e) => setFormData({ ...formData, pontosAcessorio: e.target.value })}
                      placeholder="3"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                      Pontos por Gross Total
                    </label>
                    <input
                      type="number"
                      value={formData.pontosGross}
                      onChange={(e) => setFormData({ ...formData, pontosGross: e.target.value })}
                      placeholder="2"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="block text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    Meta Mínima de Pontos
                  </label>
                  <input
                    type="number"
                    value={formData.metaPontos}
                    onChange={(e) => setFormData({ ...formData, metaPontos: e.target.value })}
                    placeholder="Ex: 100"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                  />
                </div>
              </div>

              {/* REGRAS E DESCRIÇÃO */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                  4. Descrição Geral / Mecânica de Participação
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#E3000F] resize-none"
                  placeholder="Explique os critérios de desempate, período de apuração e orientações aos vendedores..."
                />
              </div>

              {/* DATAS (COM TRAVA DE 4 DÍGITOS NO ANO) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                    Data Início <span className="text-[#E3000F]">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dataInicio}
                    min="2020-01-01"
                    max="2026-12-31"
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val) {
                        const p = val.split('-');
                        if (p[0] && p[0].length > 4) {
                          p[0] = p[0].slice(0, 4);
                          val = p.join('-');
                        }
                      }
                      setFormData({ ...formData, dataInicio: val });
                    }}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#E3000F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                    Data Fim <span className="text-[#E3000F]">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dataFim}
                    min="2020-01-01"
                    max="2026-12-31"
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val) {
                        const p = val.split('-');
                        if (p[0] && p[0].length > 4) {
                          p[0] = p[0].slice(0, 4);
                          val = p.join('-');
                        }
                      }
                      setFormData({ ...formData, dataFim: val });
                    }}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#E3000F]"
                  />
                </div>
              </div>

              {/* PREMIAÇÃO E STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                    Premiação
                  </label>
                  <input
                    type="text"
                    value={formData.premio}
                    onChange={(e) => setFormData({ ...formData, premio: e.target.value })}
                    placeholder="Ex: Folga, R$ 200 no Vale, Troféu..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#E3000F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                    Status da Campanha
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#E3000F]"
                  >
                    <option value="ATIVA">ATIVA</option>
                    <option value="EM APURAÇÃO">EM APURAÇÃO</option>
                    <option value="ENCERRADA">ENCERRADA</option>
                  </select>
                </div>
              </div>

              {/* GANHADORES */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                  Ganhador(es) Registrado(s)
                </label>
                <input
                  type="text"
                  value={formData.ganhadores || ""}
                  onChange={(e) => setFormData({ ...formData, ganhadores: e.target.value })}
                  placeholder="Ex: 1º Lugar: João Silva • 2º Lugar: Maria Santos"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#E3000F]"
                />
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#E3000F] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/30 transition-all"
                >
                  {editingId ? "Salvar Alterações" : "Lançar Campanha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
