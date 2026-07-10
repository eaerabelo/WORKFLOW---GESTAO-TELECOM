import { queryTable, syncTable } from '../services/oracleService.js';
// O QUE FAZ : Busca as vendas na tabela VENDAS E ENVIAR PARA O FRONTEND ATRAVES DO SOCKET.IO
export const getSales = async (req, res) => {
    try {
        const { storeId, start, end } = req.query;
        
        const vendas = await queryTable('VENDAS', storeId, start, end);
        res.json(vendas);
    } catch (error) {
        console.error("Erro ao buscar vendas:", error);
        res.status(500).json({ error: error.message });
    }
};

// O QUE FAZ : Sincroniza as vendas na tabela VENDAS E EMITE UM EVENTO PARA O FRONTEND ATRAVES DO SOCKET.IO
export const syncSales = async (req, res) => {
    try {
        const { storeId, upserts, deletes } = req.body;
        
        await syncTable('VENDAS', storeId, upserts, deletes);
        
        const io = req.app.get('io');
        if (io) {
            io.emit('vendas-atualizadas', storeId); 
        }
        
        res.json({ success: true, message: 'Vendas sincronizadas com sucesso na Oracle!' });
    } catch (error) {
        console.error("Erro ao sincronizar vendas:", error);
        res.status(500).json({ error: error.message });
    }
};
