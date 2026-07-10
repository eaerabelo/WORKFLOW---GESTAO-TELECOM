// JWT SECRET GERADO NA CRIPTOGRAFIA DO LOGIN - NÃO ALTERAR - ATENÇÃO!!!
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_telecom_2026';

export const requireAuth = (req, res, next) => {
    // Pegar o cabeçalho de autorização
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Acesso não autorizado. Token JWT ausente." });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { username, role, storeId }
        
        // FORÇA que o StoreId do token seja usado (Isolamento Multi-Tenant)
        req.query.storeId = decoded.storeId;
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
            req.body.storeId = decoded.storeId;
        }
        
        next();
    } catch (error) {
        return res.status(401).json({ error: "Sessão expirada ou Token inválido." });
    }
};
