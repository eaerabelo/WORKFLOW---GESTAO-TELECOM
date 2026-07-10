import { queryTable, syncTable } from '../services/oracleService.js';
// O QUE FAZ : Busca os reprovados na tabela REPROVADOS (TABELA NOVA) E ENVIA PARA O FRONTEND ATRAVES DO SOCKET.IO
export const getReprovados = async (req, res) => {
    try {
        const { storeId, start, end } = req.query;
        const reprovados = await queryTable('REPROVADOS', storeId, start, end);
        res.json(reprovados);
    } catch (error) {
        console.error("Erro ao buscar reprovados:", error);
        res.status(500).json({ error: error.message });
    }
};

// O QUE FAZ : Sincroniza os reprovados na tabela REPROVADOS (TABELA NOVA) E ENVIA PARA O FRONTEND ATRAVES DO SOCKET.IO
export const syncReprovados = async (req, res) => {
    try {
        const { storeId, upserts, deletes } = req.body;
        
        await syncTable('REPROVADOS', storeId, upserts, deletes);
        
        const io = req.app.get('io');
        if (io) io.emit('reprovados-atualizados', storeId);
        
        res.json({ success: true, message: 'Reprovados sincronizados!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
