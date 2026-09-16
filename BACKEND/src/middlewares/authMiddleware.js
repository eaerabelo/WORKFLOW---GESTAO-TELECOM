// JWT SECRET GERADO NA CRIPTOGRAFIA DO LOGIN - NÃO ALTERAR - ATENÇÃO!!!
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("FALHA CRÍTICA DE SEGURANÇA: JWT_SECRET não configurado no .env");
}

export const requireAuth = (req, res, next) => {
    // Tenta pegar o token do cookie (mais seguro) ou do cabeçalho de autorização (fallback)
    let token = req.cookies?.jwt_token;
    
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ error: "Acesso não autorizado. Token JWT ausente." });
    }

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
