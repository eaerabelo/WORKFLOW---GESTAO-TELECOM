import "../styles/Campanhas/CampanhaStyle.css";
import React, { useState, useEffect } from "react";
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
  Clock
} from "lucide-react";
import toast from "react-hot-toast";
import { getTodaySP } from "../utils/masks";

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
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    titulo: "",
    tipoCampanha: "FIBRA",
    pontosPorVenda: "10",
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

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({
      titulo: "",
      tipoCampanha: "FIBRA",
      pontosPorVenda: "10",
      metaPontos: "100",
      regraPontos: "1 venda do indicador = 10 pontos",
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
      pontosPorVenda: "10",
      metaPontos: "100",
      regraPontos: "",
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
        { ...formData, id: Date.now(), updatedAt: Date.now() },
        ...prev,
      ]);
      toast.success("Nova campanha lançada!");
    }
    setIsModalOpen(false);
  };

  const formatDateBR = (dateStr) => {
    if (!dateStr) return "-";
    const parts = String(dateStr).split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

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
              Competições oficiais, campanhas por indicador com acúmulo de pontos e premiações da equipe.
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

              return (
                <div
                  key={camp.id}
                  onMouseEnter={() => markAsViewed(camp)}
                  className={`relative rounded-3xl p-6 transition-all duration-300 border flex flex-col justify-between group shadow-lg ${
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
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
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

                    {/* CAIXINHA DE PONTUAÇÃO & ACÚMULO DE PONTOS */}
                    {(camp.pontosPorVenda || camp.metaPontos || camp.regraPontos) && (
                      <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-neutral-500 dark:text-neutral-400 uppercase text-[9px] tracking-wider flex items-center gap-1">
                            <Target size={12} className="text-[#E3000F]" /> Pontos / Venda:
                          </span>
                          <span className="font-black text-[#E3000F] bg-red-500/10 px-2 py-0.5 rounded-md">
                            +{camp.pontosPorVenda || 10} pts
                          </span>
                        </div>
                        {camp.metaPontos && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-neutral-500 dark:text-neutral-400 uppercase text-[9px] tracking-wider flex items-center gap-1">
                              <Star size={12} className="text-amber-500" /> Meta Mínima:
                            </span>
                            <span className="font-black text-amber-600 dark:text-amber-400">
                              {camp.metaPontos} pts
                            </span>
                          </div>
                        )}
                        {camp.regraPontos && (
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono border-t border-neutral-200/50 dark:border-neutral-700/50 pt-1.5">
                            {camp.regraPontos}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* RODAPÉ DO CARD: PRAZO, PRÊMIO E GANHADORES */}
                  <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                      <Clock size={13} className="text-[#E3000F]" />
                      <span>{formatDateBR(camp.dataInicio)} até {formatDateBR(camp.dataFim)}</span>
                    </div>

                    {camp.premio && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                          <Award size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                            Premiação
                          </span>
                          <span className="text-xs font-black text-neutral-900 dark:text-white truncate block">
                            {camp.premio}
                          </span>
                        </div>
                      </div>
                    )}

                    {camp.ganhadores && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                          <Trophy size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                            Ganhador(es)
                          </span>
                          <span className="text-xs font-black text-neutral-900 dark:text-white truncate block">
                            {camp.ganhadores}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                  <p className="text-xs text-neutral-400">Defina o foco comercial, regras e pontuação da competição</p>
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
                  placeholder="EX: ACELERA FIBRA • MÊS DA CONVERGÊNCIA"
                  required
                />
              </div>

              {/* BLOCO CENTRALIZADO DE PONTUAÇÃO & ACÚMULO DE PONTOS */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-[#E3000F] tracking-wide">
                  <Sparkles size={16} />
                  <span>3. Sistema de Pontuação & Metas</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                      Pontos por Venda
                    </label>
                    <input
                      type="number"
                      value={formData.pontosPorVenda}
                      onChange={(e) => setFormData({ ...formData, pontosPorVenda: e.target.value })}
                      placeholder="Ex: 10"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
                    />
                  </div>
                  <div>
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
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    Regra Adicional de Acúmulo de Pontos (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.regraPontos}
                    onChange={(e) => setFormData({ ...formData, regraPontos: e.target.value })}
                    placeholder="Ex: Fibra 500MB = 10 pts • Fibra 1GB = 20 pts • Venda casada dobra pontos"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#E3000F]"
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
