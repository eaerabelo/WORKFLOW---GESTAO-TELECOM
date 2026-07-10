import { queryTable, syncTable } from '../services/oracleService.js';
//O QUE FAZ : Busca as campanhas na tabela CAMPANHAS
export const getCampanhas = async (req, res) => {
    try {
        const { storeId } = req.query;
        let campanhas = await queryTable('CAMPANHAS', storeId);

        // Lógica de encerramento automático das campanhas
        const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-');
        let hasChanges = false;
        let upserts = [];

        campanhas = campanhas.map((camp) => {
            if (camp.status === 'ATIVA' && camp.dataFim && camp.dataFim < today) {
                camp.status = 'ENCERRADA';
                hasChanges = true;
                upserts.push(camp);
            }
            return camp;
        });

        if (hasChanges) {
            await syncTable('CAMPANHAS', storeId, upserts, []);
            const io = req.app.get('io');
            if (io) io.emit('campanhas-atualizadas', storeId);
        }

        res.json(campanhas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// O QUE FAZ : Sincroniza as campanhas na tabela CAMPANHAS
export const syncCampanhas = async (req, res) => {
    try {
        const { storeId, upserts, deletes } = req.body;
        
        await syncTable('CAMPANHAS', storeId, upserts, deletes);
        
        const io = req.app.get('io');
        if (io) io.emit('campanhas-atualizadas', storeId);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
