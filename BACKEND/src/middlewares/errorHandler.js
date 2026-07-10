// Middleware Global de Tratamento de Erros E MANDAR PARA O FRONTEND ATRAVES DO SOCKET.IO
export const errorHandler = (err, req, res, next) => {
    console.error("🔥 [ERRO GLOBAL CAPTURADO]:", err.stack || err.message || err);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || "Erro Interno no Servidor";

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
