import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { getOracleConnection } from './src/config/oracle.js';
import { consultarIA } from './src/controllers/iaController.js';
import salesRoutes from './src/routes/salesRoutes.js';
import simcardRoutes from './src/routes/simcardRoutes.js';
import reprovadosRoutes from './src/routes/reprovadosRoutes.js';
import campanhasRoutes from './src/routes/campanhasRoutes.js';
import acessosRoutes from './src/routes/acessosRoutes.js';
import geekDocsRoutes from './src/routes/geekDocsRoutes.js';
import configRoutes from './src/routes/configRoutes.js';
import calcRoutes from './src/routes/calcRoutes.js';
import areaLojasRoutes from './src/routes/areaLojasRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import updatesRoutes from './src/routes/updatesRoutes.js';
import sistemasRoutes from './src/routes/sistemasRoutes.js';
import colaboradoresRoutes from './src/routes/colaboradoresRoutes.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requireAuth } from './src/middlewares/authMiddleware.js';
import { requestLogger } from './src/middlewares/logger.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import { ENV } from './src/config/env.js';
import { initCronJobs } from './src/jobs/cronJobs.js';

const app = express();
app.set('trust proxy', 1); // Confia no Nginx para o X-Forwarded-For (Rate Limiter)
const PORT = ENV.PORT;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  /\.vercel\.app$/, 
  /\.web\.app$/, 
  /\.firebaseapp\.com$/,
  /\.nip\.io$/
];

// Criando o Servidor HTTP nativo e acoplando o Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            for (let i = 0; i < allowedOrigins.length; i++) {
                const allowed = allowedOrigins[i];
                if (typeof allowed === 'string' && origin === allowed) {
                    return callback(null, true);
                } else if (allowed instanceof RegExp && allowed.test(origin)) {
                    return callback(null, true);
                }
            }
            callback(null, true);
        },
        methods: ["GET", "POST"]
    }
});
app.set('io', io); // Injetando o Socket.io no app para as rotas poderem usar!

// Iniciando as rotinas em background (Jobs)
initCronJobs(io);

// Rate Limiter: Máximo 500 requisições por IP a cada 15 minutos
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' }
});
app.use('/api', limiter);

// Middlewares de Segurança e Comunicação
app.use(helmet());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        for (let i = 0; i < allowedOrigins.length; i++) {
            const allowed = allowedOrigins[i];
            if (typeof allowed === 'string' && origin === allowed) {
                return callback(null, true);
            } else if (allowed instanceof RegExp && allowed.test(origin)) {
                return callback(null, true);
            }
        }
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-ID', 'Accept']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(requestLogger); // Log de todas as requisições

// ============================================================================
// 🔥 ROTAS DE STATUS E HEALTH CHECK
// ============================================================================

const getHolidayMessage = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1; // 1-12
    const dayOfWeek = today.getDay(); // 0-6 (Dom-Sab)

    if (day === 1 && month === 1) return { title: "Feliz Ano Novo!", desc: "Que este ano seja repleto de conquistas.", icon: "🌟" };
    if (day === 8 && month === 3) return { title: "Feliz Dia da Mulher!", desc: "Homenagem especial a todas as mulheres.", icon: "🌷" };
    if (month === 5 && dayOfWeek === 0 && day >= 8 && day <= 14) return { title: "Feliz Dia das Mães!", desc: "Um abraço carinhoso a todas as mães guerreiras.", icon: "🤍" };
    if (day === 12 && month === 6) return { title: "Feliz Dia dos Namorados!", desc: "Celebre o amor e espalhe coisas boas.", icon: "🤍" };
    if (month === 8 && dayOfWeek === 0 && day >= 8 && day <= 14) return { title: "Feliz Dia dos Pais!", desc: "Um grande abraço a todos os pais.", icon: "👔" };
    if (day === 15 && month === 9) return { title: "Feliz Dia do Cliente!", desc: "Obrigado por nos inspirar a ser melhores.", icon: "🤝" };
    if (day === 1 && month === 10) return { title: "Feliz Dia do Vendedor!", desc: "Parabéns por moverem nossa loja com dedicação!", icon: "🚀" };
    if (day === 12 && month === 10) return { title: "Feliz Dia das Crianças!", desc: "Nunca perca a alegria de criança.", icon: "🧸" };
    if (day === 25 && month === 12) return { title: "Feliz Natal!", desc: "Que a magia do Natal ilumine sua vida.", icon: "🎄" };
    if (day === 31 && month === 12) return { title: "Feliz Véspera de Ano Novo!", desc: "Prepare-se para um ano incrível.", icon: "🎆" };

    return null;
};

app.get('/api/status', async (req, res) => {
    const memory = process.memoryUsage();
    let oracleStatus = 'conectado';
    let oracleDBSizeMB = 0;
    try {
        const conn = await getOracleConnection();
        const sizeRes = await conn.execute('SELECT sum(bytes)/1024/1024 as SIZE_MB FROM user_segments');
        if (sizeRes.rows && sizeRes.rows.length > 0 && sizeRes.rows[0].SIZE_MB) {
            oracleDBSizeMB = sizeRes.rows[0].SIZE_MB;
        }
        await conn.close();
    } catch (e) {
        oracleStatus = 'erro_conexao';
    }

    res.json({ 
        status: 'online', 
        message: '🚀 Servidor Backend do WorkFlow está rodando perfeitamente e conectado na Oracle!',
        timestamp: new Date().toISOString(),
        oracleDB: oracleStatus,
        oracleDBSizeMB: oracleDBSizeMB,
        holidayMessage: getHolidayMessage(),
        memoriaRAM: {
            totalAlocadoRSS: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            heapUsado: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`
        }
    });
});

app.get('/api/test-db', async (req, res) => {
    try {
        const conn = await getOracleConnection();
        const snapshot = await conn.execute(`SELECT COUNT(*) as QTD FROM VENDAS`);
        await conn.close();
        res.json({ success: true, message: 'Conexão com Oracle estabelecida com sucesso!', totalVendas: snapshot.rows[0].QTD });
    } catch (error) {
        console.error("Erro no Oracle DB:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ROTA DE INTELIGÊNCIA ARTIFICIAL
 */
app.post('/api/consultar-ia', consultarIA);

// ============================================================================
// 🔥 FUNÇÕES ÚTEIS PARA O BANCO ORACLE
// ============================================================================

// As funções queryTable e syncTable agora residem na cozinha (services/oracleService.js)
// e foram importadas no topo do arquivo.

// ============================================================================
// 🔥 ROTAS DA API (MODULARIZADAS)
// ============================================================================
// Rota de Autenticação (Pública)
app.use('/api/auth', authRoutes);
// Rotas Protegidas por JWT
app.use('/api/vendas', requireAuth, salesRoutes);
app.use('/api/simcards', requireAuth, simcardRoutes);
app.use('/api/reprovados', requireAuth, reprovadosRoutes);
app.use('/api/campanhas', requireAuth, campanhasRoutes);
app.use('/api/acessos', requireAuth, acessosRoutes);
app.use('/api/geek-docs', requireAuth, geekDocsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/calcular', requireAuth, calcRoutes);
app.use('/api/area-lojas', requireAuth, areaLojasRoutes);
app.use('/api/updates', updatesRoutes); // Rotas de atualizacoes (A autenticacao ja esta na rota se necessario)
app.use('/api/sistemas', sistemasRoutes);
app.use('/api/colaboradores', requireAuth, colaboradoresRoutes);

// Middleware de tratamento de erros SEMPRE por último nas rotas!
app.use(errorHandler);

// ============================================================================
// 🔥 SOCKET.IO EVENTOS
// ============================================================================
io.on('connection', (socket) => {
    console.log(`🔌 Novo computador conectado: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`❌ Computador desconectado: ${socket.id}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`🟢 Backend Oracle inicializado na porta ${PORT}`);
    console.log(`👉 Teste acessando: http://localhost:${PORT}/api/status`);
});
