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
} from "lucide-react";
import toast from "react-hot-toast";
import { getTodaySP } from "../utils/masks";

export const checkHasNewCampanha = (campanhas, globalUser) => {
  try {
    const viewed = globalUser?.viewedCampanhas || {};
    return (campanhas || []).some((camp) => {
      const lastUpdated = camp.updatedAt || camp.id;
      const isRecent = Date.now() - lastUpdated < 15 * 24 * 60 * 60 * 1000; // 15 dias
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
    setFormData({ ...campanha });
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
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    if (editingId) {
      setCampanhasData((prev) =>
        prev.map((c) =>
          c.id === editingId ? { ...c, ...formData, updatedAt: Date.now() } : c,
        ),
      );
      toast.success("Campanha atualizada!");
    } else {
      setCampanhasData((prev) => [
        { ...formData, id: Date.now(), updatedAt: Date.now() },
        ...prev,
      ]);
      toast.success("Nova campanha lançada!");
    }
    setIsModalOpen(false);
  };

  return (
    <div className="campanha-container">
      {/* CABEÇALHO */}
      <div className="campanha-header">
        <div className="campanha-header-left">
          <div className="campanha-icon-box">
            <Megaphone size={22} />
          </div>
          <div>
            <div className="campanha-header-left">
              <h2 className="campanha-title">Painel de Campanhas</h2>
              {hasNews ? (
                <span className="campanha-badge-new">
                  <span className="campanha-badge-new-dot"></span>
                  Novidades
                </span>
              ) : (
                <span className="campanha-badge-viewed">Tudo Visto</span>
              )}
            </div>
            <p className="campanha-subtitle">
              Incentivos, prêmios e campanhas vigentes na operação.
            </p>
          </div>
        </div>
        {canEdit && (
          <button onClick={handleOpenModal} className="campanha-btn-launch">
            <Plus size={18} /> Lançar Campanha
          </button>
        )}
      </div>

      {/* CORPO */}
      <div className="campanha-content">
        {(campanhasData || []).length === 0 ? (
          <div className="campanha-empty-state">
            <div className="campanha-empty-icon">
              <Award size={32} />
            </div>
            <h3 className="campanha-empty-title">
              Nenhuma campanha ativa no momento
            </h3>
            <p className="campanha-empty-subtitle">
              Quando a liderança lançar novos incentivos, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="campanha-grid">
            {(campanhasData || []).map((camp) => (
              <div
                key={camp.id}
                onMouseEnter={() => markAsViewed(camp)}
                className={`campanha-card-base group ${camp.status === "ATIVA" ? "campanha-card-active" : "campanha-card-inactive"}`}
              >
                {isCampNew(camp) && (
                  <span className="campanha-card-new-indicator">
                    <span className="campanha-card-new-ping"></span>
                    <span
                      className="campanha-card-new-dot"
                      title="Nova campanha ou alterada recentemente"
                    ></span>
                  </span>
                )}
                {camp.status === "ATIVA" && (
                  <div className="campanha-card-active-bar"></div>
                )}

                <div className="campanha-card-header">
                  <span
                    className={`campanha-card-status-base ${camp.status === "ATIVA" ? "campanha-card-status-active" : "campanha-card-status-inactive"}`}
                  >
                    {camp.status === "ATIVA" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <AlertCircle size={12} />
                    )}{" "}
                    {camp.status}
                  </span>
                  {canEdit && (
                    <div className="campanha-card-actions group-hover:opacity-100">
                      <button
                        onClick={() => handleEdit(camp)}
                        className="campanha-action-btn-edit"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(camp.id)}
                        className="campanha-action-btn-delete"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="campanha-card-title">{camp.titulo}</h3>
                <div className="campanha-card-desc scrollbar-thin">{camp.descricao}</div>

                <div className="campanha-card-footer">
                  <div className="campanha-card-date">
                    <Calendar size={14} className="campanha-card-date-icon" />
                    {camp.dataInicio.split("-").reverse().join("/")} até{" "}
                    {camp.dataFim.split("-").reverse().join("/")}
                  </div>
                  {camp.premio && (
                    <div className="campanha-card-prize-box">
                      <Award size={16} className="campanha-card-prize-icon" />
                      <div>
                        <span className="campanha-card-prize-label">
                          Prêmio
                        </span>
                        <span className="campanha-card-prize-value">
                          {camp.premio}
                        </span>
                      </div>
                    </div>
                  )}
                  {camp.ganhadores && (
                    <div className="campanha-card-winner-box">
                      <Trophy size={16} className="campanha-card-winner-icon" />
                      <div>
                        <span className="campanha-card-winner-label">
                          Ganhador(es)
                        </span>
                        <span className="campanha-card-winner-value">
                          {camp.ganhadores}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CAMPANHA */}
      {isModalOpen && (
        <div className="campanha-modal-overlay no-print">
          <div className="campanha-modal-container">
            <div className="campanha-modal-header">
              <h2 className="campanha-modal-title">
                <Target size={18} className="campanha-modal-icon" />{" "}
                {editingId ? "Editar Campanha" : "Lançar Nova Campanha"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="campanha-modal-close"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="campanha-form">
              <div className="campanha-form-group">
                <label className="campanha-form-label">
                  Título da Campanha{" "}
                  <span className="campanha-form-asterisk">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      titulo: e.target.value.toUpperCase(),
                    })
                  }
                  className="campanha-form-input"
                  placeholder="Ex: ACELERA FIBRA"
                  required
                />
              </div>
              <div className="campanha-form-group">
                <label className="campanha-form-label">
                  Regras / Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  className="campanha-form-textarea"
                  placeholder="Cole aqui o texto da campanha..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="campanha-form-group">
                  <label className="campanha-form-label">
                    Data Início{" "}
                    <span className="campanha-form-asterisk">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) =>
                      setFormData({ ...formData, dataInicio: e.target.value })
                    }
                    className="campanha-form-input-normal"
                    required
                  />
                </div>
                <div className="campanha-form-group">
                  <label className="campanha-form-label">
                    Data Fim <span className="campanha-form-asterisk">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) =>
                      setFormData({ ...formData, dataFim: e.target.value })
                    }
                    className="campanha-form-input-normal"
                    required
                  />
                </div>
              </div>
              <div className="campanha-form-group">
                <label className="campanha-form-label">Prêmio (Opcional)</label>
                <textarea
                  value={formData.premio}
                  onChange={(e) =>
                    setFormData({ ...formData, premio: e.target.value })
                  }
                  className="campanha-form-textarea-prize"
                  placeholder="Ex: Reduzido, Folga..."
                />
              </div>
              <div className="campanha-form-group">
                <label className="campanha-form-label">
                  Ganhador(es) (Opcional)
                </label>
                <textarea
                  value={formData.ganhadores || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, ganhadores: e.target.value })
                  }
                  className="campanha-form-textarea-winner"
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="campanha-form-group">
                <label className="campanha-form-label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="campanha-form-select"
                >
                  <option className="campanha-form-select-option" value="ATIVA">
                    ATIVA
                  </option>
                  <option
                    className="campanha-form-select-option"
                    value="ENCERRADA"
                  >
                    ENCERRADA
                  </option>
                </select>
              </div>
              <div className="campanha-form-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="campanha-form-btn-cancel"
                >
                  Cancelar
                </button>
                <button type="submit" className="campanha-form-btn-submit">
                  {editingId ? "Salvar Edição" : "Lançar Campanha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
