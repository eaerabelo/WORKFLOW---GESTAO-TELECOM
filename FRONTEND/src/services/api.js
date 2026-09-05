// ----------------------------------------------------------------------------
// SERVIÇO DE COMUNICAÇÃO COM O BACKEND (API REST)
// Objetivo: Centralizar todos os 'fetch' da aplicação. O React (telas) nunca
// deve saber qual é a URL do banco ou como as requisições são feitas.
// ----------------------------------------------------------------------------
// Utilizando variável de ambiente para não quebrar em produção!
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

export const getAuthToken = () => localStorage.getItem('jwt_token');

export const authFetch = async (url, options = {}) => {
    const token = getAuthToken();
    const headers = { ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
};

// Helper para padronizar erros
export const handleResponse = async (res) => {
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${res.status}`);
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
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
};

export const solicitarRecuperacaoAPI = async (username, email) => {
    const res = await fetch(`${API_URL}/api/auth/esqueci-senha/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email })
    });
    return handleResponse(res);
};

export const resetarSenhaAPI = async (username, email, codigo, newPass) => {
    const res = await fetch(`${API_URL}/api/auth/esqueci-senha/resetar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, codigo, newPass })
    });
    return handleResponse(res);
};

export const solicitarCadastroAPI = async (username, email, nome, storeCode, isManagerSetup, pass, birthDate) => {
    console.log(`FETCHING TO: ${API_URL}/api/auth/cadastro/solicitar`);
    try {
        const res = await fetch(`${API_URL}/api/auth/cadastro/solicitar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, nome, storeCode, isManagerSetup, pass, birthDate })
        });
        return await handleResponse(res);
    } catch (error) {
        console.error("Falha ao chamar a API: ", error);
        throw error;
    }
};

export const efetivarCadastroAPI = async (storeId, username, email, codigo, userData) => {
    const res = await fetch(`${API_URL}/api/auth/cadastro/efetivar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, username, email, codigo, userData })
    });
    return handleResponse(res);
};

// ============================================================================
// SISTEMA (STATUS)
// ============================================================================
export const fetchStatus = async () => {
    const res = await fetch(`${API_URL}/api/status`); // Status não precisa de token
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
