import { queryTable, syncTable } from '../services/oracleService.js';
// O QUE FAZ : Busca os documentos na tabela GEEK_DOCS
export const getGeekDocs = async (req, res) => {
    try {
        const { storeId } = req.query;
        const docs = await queryTable('GEEK_DOCS', storeId);
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// O QUE FAZ : Sincroniza os documentos na tabela GEEK_DOCS
export const syncGeekDocs = async (req, res) => {
    try {
        const { storeId, upserts, deletes } = req.body;
        
        await syncTable('GEEK_DOCS', storeId, upserts, deletes);
        
        const io = req.app.get('io');
        if (io) io.emit('geek-docs-atualizados', storeId);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
