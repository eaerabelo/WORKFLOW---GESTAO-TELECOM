import fs from 'fs';

// Middleware para logar as requisições que chegam no backend
export const requestLogger = (req, res, next) => {
    const dataHora = new Date().toISOString();
    const metodo = req.method;
    const url = req.originalUrl;
    
    const logLine = `[${dataHora}] ${metodo} ${url}\n`;
    console.log(`[${dataHora}] ${metodo} ${url}`);
    
    try {
        fs.appendFileSync('requests.log', logLine);
    } catch(e) {}
    
    // Passa o bastão para a próxima função (a rota em si)
    next();
};
