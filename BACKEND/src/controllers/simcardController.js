import { queryTable, syncTable } from '../services/oracleService.js';

// O QUE FAZ : Busca os simcards na tabela ESTOQUE E ENVIA PARA O FRONTEND ATRAVES DO SOCKET.IO
export const getSimcards = async (req, res) => {
    try {
        const { storeId } = req.query;
        const simcards = await queryTable('SIMCARDS', storeId);
        res.json(simcards);
    } catch (error) {
        console.error("Erro ao buscar simcards:", error);
        res.status(500).json({ error: error.message });
    }
};

// O QUE FAZ : Sincroniza os simcards na tabela SIMCARDS E ENVIA PARA O FRONTEND ATRAVES DO SOCKET.IO
export const syncSimcards = async (req, res) => {
    try {
        const { storeId, upserts, deletes } = req.body;
        
        await syncTable('SIMCARDS', storeId, upserts, deletes);
        
        const io = req.app.get('io');
        if (io) io.emit('simcards-atualizados', storeId);
        
        res.json({ success: true, message: 'Estoque sincronizado com sucesso na Oracle!' });
    } catch (error) {
        console.error("Erro ao sincronizar estoque:", error);
        res.status(500).json({ error: error.message });
    }
};
