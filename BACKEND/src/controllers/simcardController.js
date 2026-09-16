import { queryTable, syncTable } from '../services/oracleService.js';

// O QUE FAZ : Busca os simcards na tabela ESTOQUE E ENVIA PARA O FRONTEND ATRAVES DO SOCKET.IO
export const getSimcards = async (req, res) => {
    try {
        const { storeId: reqStoreId } = req.query;
        const userStoreId = req.user?.storeId;
        const userRole = req.user?.role;
        
        // ADMIN can query any store, others are locked to their own store
        const targetStoreId = (userRole === 'ADMIN' && reqStoreId) ? reqStoreId : userStoreId;

        const simcards = await queryTable('SIMCARDS', targetStoreId);
        res.json(simcards);
    } catch (error) {
        console.error("Erro ao buscar simcards:", error);
        res.status(500).json({ error: error.message });
    }
};

// O QUE FAZ : Sincroniza os simcards na tabela SIMCARDS E ENVIA PARA O FRONTEND ATRAVES DO SOCKET.IO
export const syncSimcards = async (req, res) => {
    try {
        const { storeId: reqStoreId, upserts, deletes } = req.body;
        const userStoreId = req.user?.storeId;
        const userRole = req.user?.role;
        
        const targetStoreId = (userRole === 'ADMIN' && reqStoreId) ? reqStoreId : userStoreId;
        
        await syncTable('SIMCARDS', targetStoreId, upserts, deletes);
        
        const io = req.app.get('io');
        if (io) io.emit('simcards-atualizados', targetStoreId);
        
        res.json({ success: true, message: 'Estoque sincronizado com sucesso na Oracle!' });
    } catch (error) {
        console.error("Erro ao sincronizar estoque:", error);
        res.status(500).json({ error: error.message });
    }
};
