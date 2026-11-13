// ----------------------------------------------------------------------------
// SERVIÇO DE COMUNICAÇÃO COM O BACKEND (API REST)
// Objetivo: Centralizar todos os 'fetch' da aplicação. O React (telas) nunca
// deve saber qual é a URL do banco ou como as requisições são feitas.
// ----------------------------------------------------------------------------
// Utilizando variável de ambiente para não quebrar em produção!
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

export const getAuthToken = () => localStorage.getItem('jwt_token');

export const MSG_SERVIDOR_OFFLINE = "SERVIDOR FORA MOMENTANEAMENTE, TENTE NOVAMENTE MAIS TARDE...";

// Wrapper seguro de fetch que intercepta 'Failed to fetch' e quedas de rede
export const safeFetch = async (url, options = {}) => {
    try {
        const res = await fetch(url, options);
        return res;
    } catch (err) {
        const msg = String(err?.message || '');
        if (
            msg.toLowerCase().includes('failed to fetch') ||
            msg.toLowerCase().includes('networkerror') ||
            msg.toLowerCase().includes('load failed') ||
            msg.toLowerCase().includes('fetch failed') ||
            msg.toLowerCase().includes('network error')
        ) {
            throw new Error(MSG_SERVIDOR_OFFLINE);
        }
        throw err;
    }
};

export const authFetch = async (url, options = {}) => {
    const token = getAuthToken();
    const headers = { ...(options.headers || {}) };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return safeFetch(url, { ...options, headers, credentials: 'include' });
};

// Helper para padronizar erros
export const handleResponse = async (res) => {
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status >= 502 && res.status <= 504) {
            throw new Error(MSG_SERVIDOR_OFFLINE);
        }
        const rawErr = errorData.error || `Erro HTTP: ${res.status}`;
        if (String(rawErr).toLowerCase().includes('failed to fetch')) {
            throw new Error(MSG_SERVIDOR_OFFLINE);
        }
        throw new Error(rawErr);
    }
    return res.json();
};

export const getLatestUpdateAPI = async () => {
    const res = await authFetch(`${API_URL}/api/updates/latest`);
    return handleResponse(res);
};

export const getSistemasAPI = async () => {
    const res = await authFetch(`${API_URL}/api/sistemas`);
    return handleResponse(res);
};

// ============================================================================
// AUTENTICAÇÃO E STATUS
// ============================================================================
export const loginAPI = async (username, password) => {
    const res = await safeFetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
};

export const solicitarRecuperacaoAPI = async (username, email) => {
    const res = await safeFetch(`${API_URL}/api/auth/esqueci-senha/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email })
    });
    return handleResponse(res);
};

export const resetarSenhaAPI = async (username, email, codigo, newPass, recoveryToken) => {
    const res = await safeFetch(`${API_URL}/api/auth/esqueci-senha/resetar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, codigo, newPass, recoveryToken })
    });
    return handleResponse(res);
};

export const solicitarCadastroAPI = async (username, email, nome, storeCode, setupKey, pass, birthDate, phone) => {
    console.log(`FETCHING TO: ${API_URL}/api/auth/cadastro/solicitar`);
    try {
        const res = await safeFetch(`${API_URL}/api/auth/cadastro/solicitar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, email, nome, storeCode, setupKey, pass, birthDate, phone })
        });
        return await handleResponse(res);
    } catch (error) {
        console.error("Falha ao chamar a API: ", error);
        throw error;
    }
};

export const efetivarCadastroAPI = async (email, codigo, registrationToken) => {
    const res = await safeFetch(`${API_URL}/api/auth/cadastro/efetivar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, codigo, registrationToken })
    });
    return handleResponse(res);
};

export const logoutAPI = async () => {
    const res = await safeFetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
    });
    return handleResponse(res);
};

// ============================================================================
// SISTEMA (STATUS)
// ============================================================================
export const fetchStatus = async () => {
    const res = await safeFetch(`${API_URL}/api/status`); // Status não precisa de token
    return handleResponse(res);
};

// ============================================================================
// VENDAS
// ============================================================================
export const fetchSales = async (start = '', end = '') => {
    let url = `${API_URL}/api/vendas?_t=${Date.now()}`;
    if (start) url += `&start=${start}`;
    if (end) url += `&end=${end}`;
    const res = await authFetch(url);
    return handleResponse(res);
};

export const syncSalesData = async (upserts, deletes) => {
    const res = await authFetch(`${API_URL}/api/vendas/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upserts, deletes })
    });
    return handleResponse(res);
};

// ============================================================================
// SIMCARDS (ESTOQUE):SE CONECTA COM O BANCO DE DADOS ORACLE PARA TRAZER OS DADOS
// ============================================================================
export const fetchSimcards = async () => {
    const res = await authFetch(`${API_URL}/api/simcards`);
    return handleResponse(res);
};

export const syncSimcardsData = async (upserts, deletes) => {
    const res = await authFetch(`${API_URL}/api/simcards/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upserts, deletes })
    });
    return handleResponse(res);
};

// ============================================================================
// REPROVADOS (AUDITORIA): SE CONECTA COM O BANCO DE DADOS ORACLE PARA TRAZER OS DADOS
// ============================================================================
export const fetchReprovados = async (start = '', end = '') => {
    let url = `${API_URL}/api/reprovados?_t=${Date.now()}`;
    if (start) url += `&start=${start}`;
    if (end) url += `&end=${end}`;
    const res = await authFetch(url);
    return handleResponse(res);
};

export const syncReprovadosData = async (upserts, deletes) => {
    const res = await authFetch(`${API_URL}/api/reprovados/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upserts, deletes })
    });
    return handleResponse(res);
};

// ============================================================================
// GEEK DOCS
// ============================================================================
export const fetchGeekDocs = async () => {
    const res = await authFetch(`${API_URL}/api/geek-docs`);
    return handleResponse(res);
};

export const syncGeekDocsData = async (upserts, deletes) => {
    const res = await authFetch(`${API_URL}/api/geek-docs/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upserts, deletes })
    });
    return handleResponse(res);
};

// ============================================================================
// CAMPANHAS
// ============================================================================
export const fetchCampanhas = async () => {
    const res = await authFetch(`${API_URL}/api/campanhas`);
    return handleResponse(res);
};

export const syncCampanhasData = async (upserts, deletes) => {
    const res = await authFetch(`${API_URL}/api/campanhas/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upserts, deletes })
    });
    return handleResponse(res);
};

// ============================================================================
// CONFIGURAÇÕES GLOBAIS (Metas, Usuários, etc)
// ============================================================================
export const fetchConfig = async () => {
    const storeId = localStorage.getItem('storeId') || 'uniao_osasco';
    const res = await authFetch(`${API_URL}/api/config?storeId=${storeId}`);
    return handleResponse(res);
};

export const syncConfigData = async (configData) => {
    const storeId = localStorage.getItem('storeId') || 'uniao_osasco';
    const res = await authFetch(`${API_URL}/api/config/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, configData })
    });
    return handleResponse(res);
};

// ============================================================================
// ÁREA LOJAS (RANKING CALCULADO NO BACKEND)
// ============================================================================
export const fetchAreaLojas = async (month) => {
    const res = await authFetch(`${API_URL}/api/area-lojas?month=${month}`);
    return handleResponse(res);
};

// ============================================================================
// COLABORADORES (DASHBOARD CALCULADO NO BACKEND)
// ============================================================================
export const fetchColaboradoresDashboard = async (month) => {
    const storeId = localStorage.getItem('storeId') || 'uniao_osasco';
    // Format needs to be MM-YYYY, but month comes as YYYY-MM
    let formattedMonth = month;
    if (month && month.includes('-')) {
        const parts = month.split('-');
        if (parts[0].length === 4) {
            formattedMonth = `${parts[1]}-${parts[0]}`;
        }
    }
    const res = await authFetch(`${API_URL}/api/colaboradores/dashboard?month=${formattedMonth}&storeId=${storeId}`);
    return handleResponse(res);
};

// Função genérica de sync dinâmico (Para manter compatibilidade com o código legado que usa a variável `endpoint`)
export const syncCollectionDynamic = async (endpoint, upserts, deletes) => {
    const res = await authFetch(`${API_URL}/api/${endpoint}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upserts, deletes })
    });
    return handleResponse(res);
};


// ============================================================================
// PERFIL (profile.js) E AJUDA / ARGUMENTAÇÕES (help.js)
// ============================================================================
export const fetchProfileAPI = async (username) => {
    const storeId = localStorage.getItem('storeId') || 'shopping_raposo';
    const res = await authFetch(`${API_URL}/api/profile?username=${encodeURIComponent(username || '')}&storeId=${encodeURIComponent(storeId)}`);
    return handleResponse(res);
};

export const enviarIdeiaScriptAPI = async (titulo, ideia, autor, loja) => {
    const res = await authFetch(`${API_URL}/api/sistemas/scripts/ideia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, ideia, autor, loja })
    });
    return handleResponse(res);
};

export const saveProfileAPI = async (username, profile) => {
    const storeId = localStorage.getItem('storeId') || 'shopping_raposo';
    const res = await authFetch(`${API_URL}/api/profile/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, storeId, profile })
    });
    return handleResponse(res);
};

export const fetchHelpAPI = async () => {
    const storeId = localStorage.getItem('storeId') || 'shopping_raposo';
    const res = await authFetch(`${API_URL}/api/help?storeId=${encodeURIComponent(storeId)}`);
    return handleResponse(res);
};

export const createArgumentacaoAPI = async (payload) => {
    const storeId = localStorage.getItem('storeId') || 'shopping_raposo';
    const res = await authFetch(`${API_URL}/api/help/argumentacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, storeId })
    });
    return handleResponse(res);
};

export const deleteArgumentacaoAPI = async (id) => {
    const storeId = localStorage.getItem('storeId') || 'shopping_raposo';
    const res = await authFetch(`${API_URL}/api/help/argumentacao/${encodeURIComponent(id)}?storeId=${encodeURIComponent(storeId)}`, {
        method: 'DELETE'
    });
    return handleResponse(res);
};
