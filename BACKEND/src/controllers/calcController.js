import { calcularFatorRV, aplicarRegrasDeProduto, calcularFatorRVSenior, calcularFatorRVGerente, calcularFatorRVGeek, calcularFatorRVAssistente, calcularFatorRVAdministrativo } from '../utils/rules.js';
// FUNÇÃO PARA CALCULAR RV EM LOTE DE VENDAS (RECEITA BASE)
export const calculateReceitaVenda = (req, res) => {
    try {
        const { sale, metricasVendedor } = req.body;
        const receitaFinal = aplicarRegrasDeProduto(sale, metricasVendedor || {});
        res.json({ receitaBase: receitaFinal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// FUNÇÃO PARA CALCULAR RV EM LOTE 
export const calculateLoteReceita = (req, res) => {
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
};
//CALC RV (VENDEDOR) E Outros Cargos da Gestão
export const calculateRV = (req, res) => {
    try {
        const { pctAtingimento, totalComissao, role, metricasExtras } = req.body;
        let resultado;

        // Ajuste para garantir que a variável role venha corretamente do frontend
        const cargo = role?.toUpperCase() || 'VENDEDOR';

        switch (cargo) {
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
};
