import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { calcularFatorRV, aplicarRegrasDeProduto, calcularFatorRVSenior, calcularFatorRVGerente, calcularFatorRVGeek, calcularFatorRVAssistente, calcularFatorRVAdministrativo } from './utils/rules.js';
import { db } from './firebase.js'; // <-- Importando o banco de dados seguro
import { consultarIA } from './controllers/iaController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const storeId = process.env.STORE_ID || 'uniao_osasco'; // Puxa o nome da loja do .env

// Criando o Servidor HTTP nativo e acoplando o Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Permite que o frontend conecte via WebSocket
        methods: ["GET", "POST"]
    }
});

// Middlewares de Segurança e Comunicação
app.use(cors()); // Permite que o Frontend converse com o Backend
app.use(express.json({ limit: '50mb' })); // Limite aumentado para suportar Planilhas e Lotes gigantes
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================================
// 🔥 CACHE EM MEMÓRIA (ANTI-QUOTA EXCEEDED)
// Em vez de ler do banco toda vez que o Frontend pede (esgotando a cota diária),
// o servidor Node.js baixa tudo 1 única vez quando liga, e mantém na memória RAM!
// ============================================================================
let cacheVendas = [];
let cacheSimcards = [];
let cacheReprovados = [];
let cacheGeekDocs = [];
let cacheCampanhas = [];
let cacheConfig = {};

// Promises para o Servidor não responder VAZIO enquanto o Firebase ainda está baixando os dados
let resolveVendas; const vendasReady = new Promise(r => resolveVendas = r);
let resolveSimcards; const simcardsReady = new Promise(r => resolveSimcards = r);
let resolveReprovados; const reprovadosReady = new Promise(r => resolveReprovados = r);
let resolveGeekDocs; const geekDocsReady = new Promise(r => resolveGeekDocs = r);
let resolveCampanhas; const campanhasReady = new Promise(r => resolveCampanhas = r);
let resolveConfig; const configReady = new Promise(r => resolveConfig = r);

console.log("⏳ Iniciando o Cache em Memória do Banco de Dados...");

// Os "onSnapshot" no backend mantêm a RAM sempre atualizada lendo apenas a "diferença" do banco
db.collection(`vendas_${storeId}`).onSnapshot(snap => { 
    cacheVendas = snap.docs.map(doc => doc.data()); 
    console.log(`✅ Vendas cacheadas: ${cacheVendas.length}`);
    resolveVendas();
    io.emit('vendas-atualizadas'); // Notifica os clientes que os dados de vendas foram atualizados no cache
});
db.collection(`estoque_${storeId}`).onSnapshot(snap => { 
    cacheSimcards = snap.docs.map(doc => doc.data());
    resolveSimcards();
    io.emit('simcards-atualizados');
});
db.collection(`reprovados_${storeId}`).onSnapshot(snap => { 
    cacheReprovados = snap.docs.map(doc => doc.data());
    resolveReprovados();
    io.emit('reprovados-atualizados');
});
db.collection(`geek_docs_${storeId}`).onSnapshot(snap => { 
    cacheGeekDocs = snap.docs.map(doc => doc.data());
    resolveGeekDocs();
    io.emit('geek-docs-atualizados');
});
db.collection(`campanhas_${storeId}`).onSnapshot(snap => { 
    cacheCampanhas = snap.docs.map(doc => doc.data());
    resolveCampanhas();
    io.emit('campanhas-atualizadas');
});
db.collection('lojas').doc(`${storeId}_config`).onSnapshot(snap => { 
    if (snap.exists) {
        cacheConfig = snap.data();
    } else {
        cacheConfig = {};
    }
    resolveConfig();
    io.emit('config-atualizada');
});

// Rota Inicial de Teste (Health Check)
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online', 
        message: '🚀 Servidor Backend do Painel Claro está rodando perfeitamente!',
        timestamp: new Date().toISOString()
    });
});

// Rota de Teste do Banco de Dados
app.get('/api/test-db', async (req, res) => {
    try {
        // Tenta ler 1 venda só para ver se a chave privada funcionou
        const snapshot = await db.collection(`vendas_${storeId}`).limit(1).get();
        const temDados = !snapshot.empty;
        res.json({ success: true, message: 'Conexão com Firestore Admin estabelecida!', temDados });
    } catch (error) {
        console.error("Erro no Firebase Admin:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ROTA DE INTELIGÊNCIA ARTIFICIAL
 * A lógica agora está 100% isolada no arquivo controllers/iaController.js
 */
app.post('/api/consultar-ia', consultarIA);

/**
 * ROTAS DE BANCO DE DADOS (API REST)
 * Substituindo a conexão direta do Frontend
 */

// Rota para listar todas as vendas filtradas por data
app.get('/api/vendas', async (req, res) => {
    try {
        // Trava a rota até o Firebase terminar de colocar as vendas na Memória RAM
        await vendasReady; 

        const { start, end } = req.query;
        
        // Puxa as vendas direto da MEMÓRIA RAM (Custo de Leitura Firebase = ZERO)
        let vendas = [...cacheVendas];

        if (start && end) {
            vendas = vendas.filter(v => {
                let dateIso = v.data || '';
                if (dateIso.includes('/')) {
                    dateIso = dateIso.split('/').reverse().join('-');
                }
                return dateIso >= start && dateIso <= end;
            });
        }

        res.json(vendas);
    } catch (error) {
        console.error("Erro ao buscar vendas:", error);
        res.status(500).json({ error: error.message });
    }
});

// Rota de Sincronização em Lote (Auto-Save do Frontend)
app.post('/api/vendas/sync', async (req, res) => {
    try {
        const { upserts, deletes } = req.body;
        const batch = db.batch();
        
        if (upserts && upserts.length > 0) {
            upserts.forEach(venda => {
                const docRef = db.collection(`vendas_${storeId}`).doc(String(venda.id));
                batch.set(docRef, venda);
            });
        }
        
        if (deletes && deletes.length > 0) {
            deletes.forEach(id => {
                const docRef = db.collection(`vendas_${storeId}`).doc(String(id));
                batch.delete(docRef);
            });
        }
        
        await batch.commit();
        
        // O onSnapshot do backend já vai detectar a mudança e emitir o 'vendas-atualizadas' automaticamente.
        
        res.json({ success: true, message: 'Lote de vendas sincronizado com sucesso!' });
    } catch (error) {
        console.error("Erro ao sincronizar lote de vendas:", error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para listar estoque de simcards
app.get('/api/simcards', async (req, res) => {
    try {
        await simcardsReady;
        const simcards = cacheSimcards;
        res.json(simcards);
    } catch (error) {
        console.error("Erro ao buscar simcards:", error);
        res.status(500).json({ error: error.message });
    }
});

// Rota de Sincronização em Lote de Simcards
app.post('/api/simcards/sync', async (req, res) => {
    try {
        const { upserts, deletes } = req.body;
        const batch = db.batch();
        
        if (upserts && upserts.length > 0) {
            upserts.forEach(item => {
                const docRef = db.collection(`estoque_${storeId}`).doc(String(item.id));
                batch.set(docRef, item);
            });
        }
        
        if (deletes && deletes.length > 0) {
            deletes.forEach(id => {
                const docRef = db.collection(`estoque_${storeId}`).doc(String(id));
                batch.delete(docRef);
            });
        }
        
        await batch.commit();
        // O onSnapshot do backend já vai detectar a mudança e emitir o 'simcards-atualizados' automaticamente.
        res.json({ success: true, message: 'Estoque sincronizado com sucesso!' });
    } catch (error) {
        console.error("Erro ao sincronizar estoque:", error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para listar Reprovados
app.get('/api/reprovados', async (req, res) => {
    try {
        await reprovadosReady;

        const { start, end } = req.query;
        
        // Puxa as vendas direto da MEMÓRIA RAM
        let reprovados = [...cacheReprovados];

        if (start && end) {
            reprovados = reprovados.filter(r => {
                let dateIso = r.data || '';
                if (dateIso.includes('/')) {
                    dateIso = dateIso.split('/').reverse().join('-');
                }
                return dateIso >= start && dateIso <= end;
            });
        }

        res.json(reprovados);
    } catch (error) {
        console.error("Erro ao buscar reprovados:", error);
        res.status(500).json({ error: error.message });
    }
});

// Rota de Sincronização em Lote de Reprovados
app.post('/api/reprovados/sync', async (req, res) => {
    try {
        const { upserts, deletes } = req.body;
        const batch = db.batch();
        
        if (upserts && upserts.length > 0) {
            upserts.forEach(item => {
                const docRef = db.collection(`reprovados_${storeId}`).doc(String(item.id));
                batch.set(docRef, item);
            });
        }
        
        if (deletes && deletes.length > 0) {
            deletes.forEach(id => {
                const docRef = db.collection(`reprovados_${storeId}`).doc(String(id));
                batch.delete(docRef);
            });
        }
        
        await batch.commit();
        // O onSnapshot do backend já vai detectar a mudança e emitir o 'reprovados-atualizados' automaticamente.
        res.json({ success: true, message: 'Reprovados sincronizados com sucesso!' });
    } catch (error) {
        console.error("Erro ao sincronizar reprovados:", error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para listar Geek Docs
app.get('/api/geek-docs', async (req, res) => {
    try {
        await geekDocsReady;
        const docs = cacheGeekDocs;
        res.json(docs);
    } catch (error) {
        console.error("Erro ao buscar geek docs:", error);
        res.status(500).json({ error: error.message });
    }
});

// Rota de Sincronização em Lote de Geek Docs
app.post('/api/geek-docs/sync', async (req, res) => {
    try {
        const { upserts, deletes } = req.body;
        const batch = db.batch();
        
        if (upserts && upserts.length > 0) {
            upserts.forEach(item => {
                const docRef = db.collection(`geek_docs_${storeId}`).doc(String(item.id));
                batch.set(docRef, item);
            });
        }
        
        if (deletes && deletes.length > 0) {
            deletes.forEach(id => {
                const docRef = db.collection(`geek_docs_${storeId}`).doc(String(id));
                batch.delete(docRef);
            });
        }
        
        await batch.commit();
        // O onSnapshot do backend já vai detectar a mudança e emitir o 'geek-docs-atualizados' automaticamente.
        res.json({ success: true, message: 'Geek Docs sincronizados com sucesso!' });
    } catch (error) {
        console.error("Erro ao sincronizar geek docs:", error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para listar Campanhas
app.get('/api/campanhas', async (req, res) => {
    try {
        await campanhasReady;
        const campanhas = cacheCampanhas;
        res.json(campanhas);
    } catch (error) {
        console.error("Erro ao buscar campanhas:", error);
        res.status(500).json({ error: error.message });
    }
});

// Rota de Sincronização em Lote de Campanhas
app.post('/api/campanhas/sync', async (req, res) => {
    try {
        const { upserts, deletes } = req.body;
        const batch = db.batch();
        
        if (upserts && upserts.length > 0) {
            upserts.forEach(item => {
                const docRef = db.collection(`campanhas_${storeId}`).doc(String(item.id));
                batch.set(docRef, item);
            });
        }
        
        if (deletes && deletes.length > 0) {
            deletes.forEach(id => {
                const docRef = db.collection(`campanhas_${storeId}`).doc(String(id));
                batch.delete(docRef);
            });
        }
        
        await batch.commit();
        // O onSnapshot do backend já vai detectar a mudança e emitir o 'campanhas-atualizadas' automaticamente.
        res.json({ success: true, message: 'Campanhas sincronizadas com sucesso!' });
    } catch (error) {
        console.error("Erro ao sincronizar campanhas:", error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para listar configurações globais (Usuários, Metas, Escalas)
app.get('/api/config', async (req, res) => {
    try {
        await configReady;
        res.json(cacheConfig);
    } catch (error) {
        console.error("Erro ao buscar configurações:", error);
        res.status(500).json({ error: error.message });
    }
});

// Rota de Sincronização em Lote de Configurações Globais
app.post('/api/config/sync', async (req, res) => {
    try {
        const configData = req.body;
        await db.collection('lojas').doc(`${storeId}_config`).set(configData);
        res.json({ success: true, message: 'Configurações sincronizadas com sucesso!' });
    } catch (error) {
        console.error("Erro ao sincronizar configurações:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * ROTAS DE CÁLCULO FINANCEIRO
 * Estas rotas protegem as regras de comissão. O frontend envia os dados brutos
 * e recebe os valores processados.
 */

app.post('/api/calcular-receita-venda', (req, res) => {
    try {
        const { sale, metricasVendedor } = req.body;
        const receitaFinal = aplicarRegrasDeProduto(sale, metricasVendedor || {});
        res.json({ receitaBase: receitaFinal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nova Rota para Calcular Múltiplas Vendas de 1 vez só (Performance Otimizada)
app.post('/api/calcular-lote-receita', (req, res) => {
    try {
        const { sales, metricasVendedor } = req.body;
        if (!sales || !Array.isArray(sales)) return res.json({ resultados: [] });
        
        const resultados = sales.map(sale => ({
            id: sale.id,
            receitaBase: aplicarRegrasDeProduto(sale, metricasVendedor || {})
        }));
        res.json({ resultados });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/calcular-rv', (req, res) => {
    try {
        const { pctAtingimento, totalComissao, role, metricasExtras } = req.body;
        let resultado;
        
        switch (role) {
            case 'SENIOR':
                resultado = calcularFatorRVSenior(pctAtingimento, totalComissao, metricasExtras || {});
                break;
            case 'GERENTE':
                resultado = calcularFatorRVGerente(pctAtingimento, totalComissao, metricasExtras || {});
                break;
            case 'GEEK':
                resultado = calcularFatorRVGeek(pctAtingimento, totalComissao, metricasExtras || {});
                break;
            case 'ASSISTENTE RELACIONAMENTO':
                resultado = calcularFatorRVAssistente(pctAtingimento, totalComissao, metricasExtras || {});
                break;
            case 'ADMINISTRAÇÃO':
                resultado = calcularFatorRVAdministrativo(pctAtingimento, totalComissao, metricasExtras || {});
                break;
            case 'VENDEDOR':
            default:
                resultado = calcularFatorRV(pctAtingimento, totalComissao, metricasExtras || {});
                break;
        }
        
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eventos do Socket.io (Apenas para logar quem entra e sai no Terminal)
io.on('connection', (socket) => {
    console.log(`🔌 Novo computador conectado: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`❌ Computador desconectado: ${socket.id}`);
    });
});

// ATENÇÃO: Mudamos de app.listen para httpServer.listen
httpServer.listen(PORT, () => {
    console.log(`🟢 Backend inicializado na porta ${PORT}`);
    console.log(`👉 Teste acessando: http://localhost:${PORT}/api/status`);
});