import { API_URL, handleResponse, authFetch } from './api.js';

export const apiSaveUser = async (editingUsername, userData) => {
    const res = await authFetch(`${API_URL}/api/acessos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ editingUsername, userData })
    });
    return handleResponse(res);
};

export const apiDeleteUser = async (username, role) => {
    const res = await authFetch(`${API_URL}/api/acessos/${username}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
    });
    return handleResponse(res);
};

export const apiUnlockCofre = async (masterPass) => {
    const res = await authFetch(`${API_URL}/api/acessos/unlock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ masterPass })
    });
    return handleResponse(res);
};
