// Middleware para garantir que o storeId foi enviado
export const requireStoreId = (req, res, next) => {
    // Procura o storeId na URL (query), no corpo (body) ou no cabeçalho (headers) da requisição
    const storeId = req.query.storeId || req.body.storeId || req.headers['x-store-id'];
    
    if (!storeId) {
        return res.status(400).json({ error: "storeId é obrigatório. Requisição bloqueada pelo Middleware." });
    }
    
    // Se tem o storeId, atrela ao objeto req e deixa a requisição continuar
    req.storeId = storeId;
    next();
};
