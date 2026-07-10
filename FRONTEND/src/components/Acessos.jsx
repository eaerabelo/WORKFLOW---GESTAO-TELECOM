import React, { useState, useEffect } from "react";
import { getFirstName, getFirstAndLastName } from '../utils/nameFormatter.js';
import {
  Key,
  Lock,
  Unlock,
  ShieldAlert,
  Trash2,
  Edit3,
  X,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import "../styles/Acessos/AcessoStyle.css";
import { apiSaveUser, apiDeleteUser, apiUnlockCofre } from "../services/acessosService.js";

export function Acessos({
  setScheduleData,
  setMonthlyOverrides,
  setReprovadosData,
  globalUser,
}) {
  const [usersDB, setUsersDB] = useState({});
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
    phone: "",
    email: "",
    birthDate: "",
    vacationStart: "",
    vacationEnd: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!masterPass) return;

    setIsUnlocking(true);
    try {
      const response = await apiUnlockCofre(masterPass);
      if (response && response.usersDB) {
        setUsersDB(response.usersDB);
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
        `Tem certeza que deseja apagar o usuário ${userKey}? Ele perderá o acesso instantaneamente.`,
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
    if (
      !formData.name ||
      !formData.username ||
      !formData.password ||
      !formData.email
    ) {
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
      toast.success(
        editingUsername
          ? "Usuário atualizado com sucesso!"
          : "Conta criada com sucesso!",
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

  // --- TELA DE BLOQUEIO (CADEADO) ---
  if (!isUnlocked) {
    return (
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
          <button type="submit" className="acessos-btn-unlock" disabled={isUnlocking}>
            {isUnlocking ? <Loader2 size={18} className="animate-spin" /> : <Unlock size={18} />}
            {isUnlocking ? "Verificando..." : "Desbloquear Cofre"}
          </button>
        </form>
      </div>
    );
  }

  const totalFuncionarios = Object.keys(usersDB || {}).length;
  const totalVendedores = Object.values(usersDB || {}).filter(
    (u) => u?.role === "VENDEDOR",
  ).length;

  // --- TELA DO COFRE DESBLOQUEADO (TABELA E EDIÇÃO) ---
  return (
    <div className="acessos-container">
      <div className="acessos-header">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="acessos-icon-box">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Cofre de Acessos Desbloqueado</h2>
            <p className="text-xs text-neutral-400 font-medium">
              Gestão de Usuários, Senhas e Lideranças
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center w-full md:w-auto gap-3">
          <div className="flex gap-3 w-full sm:w-auto justify-between sm:justify-start sm:mr-2">
            <div className="acessos-kpi-box">
              <span className="acessos-kpi-label">Equipe</span>
              <span className="acessos-kpi-value">{totalFuncionarios}</span>
            </div>
            <div className="acessos-kpi-box">
              <span className="acessos-kpi-label">Vendedores</span>
              <span className="acessos-kpi-value">{totalVendedores}</span>
            </div>
          </div>
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
                    colSpan="6"
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
                        <span className="acessos-badge-ferias ml-2">EM FÉRIAS</span>
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
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getRoleStyle(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="acessos-td-mono">{user.phone || "-"}</td>
                    <td className="acessos-td-muted">
                      {user.birthDate
                        ? new Date(
                            user.birthDate + "T12:00:00",
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
                <label className="acessos-label">
                  Nível de Acesso (Função)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="acessos-input-field font-bold"
                >
                  <option
                    className="bg-white dark:bg-neutral-900"
                    value="GERENTE"
                  >
                    GERENTE
                  </option>
                  <option
                    className="bg-white dark:bg-neutral-900"
                    value="SENIOR"
                  >
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
                  <option
                    className="bg-white dark:bg-neutral-900"
                    value="VENDEDOR"
                  >
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
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                  className="acessos-input-field"
                />
              </div>

              <div className="acessos-date-group border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 bg-neutral-50 dark:bg-neutral-800/50 mt-2">
                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 block">
                  Período de Férias (Bloqueio Automático)
                </label>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <div className="w-full">
                    <label className="text-[10px] text-neutral-400 mb-1 block font-bold">DATA DE SAÍDA</label>
                    <input
                      type="date"
                      value={formData.vacationStart}
                      onChange={(e) => setFormData({ ...formData, vacationStart: e.target.value })}
                      className="acessos-input-field"
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-[10px] text-neutral-400 mb-1 block font-bold">DATA DE RETORNO</label>
                    <input
                      type="date"
                      value={formData.vacationEnd}
                      onChange={(e) => setFormData({ ...formData, vacationEnd: e.target.value })}
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
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : "Salvar Conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
