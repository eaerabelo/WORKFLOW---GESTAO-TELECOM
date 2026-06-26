import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { getOracleConnection } from './db_oracle.js';
import { calcularFatorRV, aplicarRegrasDeProduto, calcularFatorRVSenior, calcularFatorRVGerente, calcularFatorRVGeek, calcularFatorRVAssistente, calcularFatorRVAdministrativo } from './utils/rules.js';
import { consultarIA } from './controllers/iaController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Criando o Servidor HTTP nativo e acoplando o Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middlewares de Segurança e Comunicação
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================================
// 🔥 ROTAS DE STATUS E HEALTH CHECK
// ============================================================================

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
        message: '🚀 Servidor Backend do Painel Claro está rodando perfeitamente e conectado na Oracle!',
        timestamp: new Date().toISOString(),
        oracleDB: oracleStatus,
        oracleDBSizeMB: oracleDBSizeMB,
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

async function queryTable(tableName, storeId, startDate, endDate) {
    const conn = await getOracleConnection();
    try {
        let sql = `SELECT DOCUMENT_DATA FROM ${tableName} WHERE STORE_ID = :storeId`;
        let params = { storeId };

        const res = await conn.execute(sql, params);
        let items = res.rows.map(r => JSON.parse(r.DOCUMENT_DATA));

        if (startDate && endDate) {
            items = items.filter(v => {
                let dateIso = v.data || '';
                if (dateIso.includes('/')) {
                    dateIso = dateIso.split('/').reverse().join('-');
                }
                return dateIso >= startDate && dateIso <= endDate;
            });
        }
        return items;
    } finally {
        await conn.close();
    }
}

async function syncTable(tableName, storeId, upserts, deletes) {
    const conn = await getOracleConnection();
    try {
        // Como o batch exige arrays, vamos simplificar processando um a um, pois na prática os upserts são pequenos (1 item geralmente)
        if (upserts && upserts.length > 0) {
            for (const item of upserts) {
                const itemId = String(item.id);
                // Vendedor, Produto e Receita são colunas apenas da tabela VENDAS, as outras só tem DOCUMENT_DATA por padrão
                // Para manter genérico, vamos dar MERGE usando ID, STORE_ID e DOCUMENT_DATA.
                // Mas para VENDAS nós tínhamos VENDEDOR, PRODUTO, RECEITA etc.
                if (tableName === 'VENDAS') {
                    await conn.execute(
                        `MERGE INTO VENDAS v
                        USING (SELECT :id_val AS ID FROM DUAL) src
                        ON (v.ID = src.ID)
                        WHEN MATCHED THEN
                            UPDATE SET 
                                STORE_ID = :storeId, DATA_VENDA = :dataVenda, VENDEDOR = :vendedor, PRODUTO = :produto, RECEITA = :receita, DOCUMENT_DATA = :documentData
                        WHEN NOT MATCHED THEN
                            INSERT (ID, STORE_ID, DATA_VENDA, VENDEDOR, PRODUTO, RECEITA, DOCUMENT_DATA)
                            VALUES (:id_val, :storeId, :dataVenda, :vendedor, :produto, :receita, :documentData)`,
                        {
                            id_val: itemId,
                            storeId: storeId,
                            dataVenda: item.data || '',
                            vendedor: item.vendedor || '',
                            produto: item.produto || '',
                            receita: Number(item.receita) || 0,
                            documentData: JSON.stringify(item)
                        },
                        { autoCommit: false }
                    );
                } else {
                    await conn.execute(
                        `MERGE INTO ${tableName} v
                        USING (SELECT :id_val AS ID FROM DUAL) src
                        ON (v.ID = src.ID)
                        WHEN MATCHED THEN
                            UPDATE SET STORE_ID = :storeId, DOCUMENT_DATA = :documentData
                        WHEN NOT MATCHED THEN
                            INSERT (ID, STORE_ID, DOCUMENT_DATA)
                            VALUES (:id_val, :storeId, :documentData)`,
                        {
                            id_val: itemId,
                            storeId: storeId,
                            documentData: JSON.stringify(item)
                        },
                        { autoCommit: false }
                    );
                }
            }
        }
        
        if (deletes && deletes.length > 0) {
            for (const id of deletes) {
                await conn.execute(`DELETE FROM ${tableName} WHERE ID = :id AND STORE_ID = :storeId`, { id: String(id), storeId }, { autoCommit: false });
            }
        }
        
        await conn.commit();
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        await conn.close();
    }
}

// ============================================================================
// 🔥 ROTAS DE BANCO DE DADOS (API REST ORACLE)
// ============================================================================

// VENDAS
app.get('/api/vendas', async (req, res) => {
    try {
        const { storeId, start, end } = req.query;
        if (!storeId) return res.status(400).json({ error: "storeId é obrigatório" });
        const vendas = await queryTable('VENDAS', storeId, start, end);
        res.json(vendas);
    } catch (error) {
        console.error("Erro ao buscar vendas:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vendas/sync', async (req, res) => {
    try {
        const { storeId, upserts, deletes } = req.body;
        if (!storeId) return res.status(400).json({ error: "storeId é obrigatório" });
        
        await syncTable('VENDAS', storeId, upserts, deletes);
        io.emit('vendas-atualizadas', storeId); 
        res.json({ success: true, message: 'Vendas sincronizadas com sucesso na Oracle!' });
    } catch (error) {
        console.error("Erro ao sincronizar vendas:", error);
        res.status(500).json({ error: error.message });
    }
});

// SIMCARDS (ESTOQUE)
app.get('/api/simcards', async (req, res) => {
    try {
        const { storeId } = req.query;
        if (!storeId) return res.status(400).json({ error: "storeId é obrigatório" });
        const simcards = await queryTable('ESTOQUE', storeId);
        res.json(simcards);
    } catch (error) {
        console.error("Erro ao buscar simcards:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/simcards/sync', async (req, res) => {
    try {
        const { storeId, upserts, deletes } = req.body;
        if (!storeId) return res.status(400).json({ error: "storeId é obrigatório" });
        
        await syncTable('ESTOQUE', storeId, upserts, deletes);
        io.emit('simcards-atualizados', storeId);
        res.json({ success: true, message: 'Estoque sincronizado com sucesso na Oracle!' });
    } catch (error) {
        console.error("Erro ao sincronizar estoque:", error);
        res.status(500).json({ error: error.message });
    }
});

// REPROVADOS
app.get('/api/reprovados', async (req, res) => {
    try {
        const { storeId, start, end } = req.query;
        if (!storeId) return res.status(400).json({ error: "storeId é obrigatório" });
        const reprovados = await queryTable('REPROVADOS', storeId, start, end);
        res.json(reprovados);
    } catch (error) {
        console.error("Erro ao buscar reprovados:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reprovados/sync', async (req, res) => {
    try {
        const { storeId, upserts, deletes } = req.body;
        if (!storeId) return res.status(400).json({ error: "storeId é obrigatório" });
        
        await syncTable('REPROVADOS', storeId, upserts, deletes);
        io.emit('reprovados-atualizados', storeId);
        res.json({ success: true, message: 'Reprovados sincronizados!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GEEK DOCS
app.get('/api/geek-docs', async (req, res) => {
    try {
        const { storeId } = req.query;
        if (!storeId) return res.status(400).json({ error: "storeId é obrigatório" });
        const docs = await queryTable('GEEK_DOCS', storeId);
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/geek-docs/sync', async (req, res) => {
    try {
        const { storeId, upserts, deletes } = req.body;
        if (!storeId) return res.status(400).json({ error: "storeId é obrigatório" });
        
        await syncTable('GEEK_DOCS', storeId, upserts, deletes);
        io.emit('geek-docs-atualizados', storeId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CAMPANHAS
app.get('/api/campanhas', async (req, res) => {
    try {
        const { storeId } = req.query;
        if (!storeId) return res.status(400).json({ error: "storeId é obrigatório" });
        const campanhas = await queryTable('CAMPANHAS', storeId);
        res.json(campanhas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/campanhas/sync', async (req, res) => {
    try {
        const { storeId, upserts, deletes } = req.body;
        if (!storeId) return res.status(400).json({ error: "storeId é obrigatório" });
        
        await syncTable('CAMPANHAS', storeId, upserts, deletes);
        io.emit('campanhas-atualizadas', storeId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CONFIGURACOES GLOBAIS (Metas, Escalas, Usuários)
app.get('/api/config', async (req, res) => {
    try {
        const { storeId } = req.query;
        if (!storeId) return res.status(400).json({ error: "storeId é obrigatório" });
        
        const conn = await getOracleConnection();
        const result = await conn.execute(`SELECT DOCUMENT_DATA FROM CONFIGURACOES WHERE STORE_ID = :storeId`, { storeId });
        await conn.close();
        
        if (result.rows.length > 0) {
            res.json(JSON.parse(result.rows[0].DOCUMENT_DATA));
        } else {
            res.json({});
        }
    } catch (error) {
        console.error("Erro ao buscar configurações:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/config/sync', async (req, res) => {
    try {
        const { storeId, configData } = req.body;
        if (!storeId) return res.status(400).json({ error: "storeId é obrigatório" });

        const conn = await getOracleConnection();
        await conn.execute(
            `MERGE INTO CONFIGURACOES c
            USING (SELECT :storeId AS STORE_ID FROM DUAL) src
            ON (c.STORE_ID = src.STORE_ID)
            WHEN MATCHED THEN
                UPDATE SET DOCUMENT_DATA = :documentData
            WHEN NOT MATCHED THEN
                INSERT (STORE_ID, DOCUMENT_DATA) VALUES (:storeId, :documentData)`,
            { storeId: storeId, documentData: JSON.stringify(configData) },
            { autoCommit: true }
        );
        await conn.close();

        io.emit('config-atualizada', storeId);
        res.json({ success: true, message: 'Configurações sincronizadas na Oracle!' });
    } catch (error) {
        console.error("Erro ao sincronizar config:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 🔥 ROTAS DE CÁLCULO FINANCEIRO
// ============================================================================

app.post('/api/calcular-receita-venda', (req, res) => {
    try {
        const { sale, metricasVendedor } = req.body;
        const receitaFinal = aplicarRegrasDeProduto(sale, metricasVendedor || {});
        res.json({ receitaBase: receitaFinal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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