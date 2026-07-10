import { aplicarRegrasDeProduto, calcularFatorRV } from '../utils/rules.js';

export const getResultadosProduto = (req, res) => {
    try {
        const { sellerSales = [], pctAtingimentoMplay = 0 } = req.body;
        let receitaExtraMplay = 0;
        
        const resultados = sellerSales.map(sale => {
            const rCom = aplicarRegrasDeProduto(sale, { pctAtingimentoMplay });
            const rSem = aplicarRegrasDeProduto(sale, { pctAtingimentoMplay: 0 });
            receitaExtraMplay += (rCom - rSem);
            
            return {
                id: sale.id,
                receitaBase: rCom
            };
        });

        res.json({ success: true, resultados, receitaExtraMplay });
    } catch (error) {
        console.error("Erro no getResultadosProduto:", error);
        res.status(500).json({ error: "Erro interno" });
    }
};

export const getFatorRV = (req, res) => {
    try {
        const { pctAtingimento = 0, totalComissao = 0, metricasExtras = {} } = req.body;
        const resultRV = calcularFatorRV(pctAtingimento, totalComissao, metricasExtras);
        res.json({ success: true, resultRV });
    } catch (error) {
        console.error("Erro no getFatorRV:", error);
        res.status(500).json({ error: "Erro interno" });
    }
};
