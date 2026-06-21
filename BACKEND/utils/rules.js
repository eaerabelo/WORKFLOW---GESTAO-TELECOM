/**
 * Arquivo centralizado de Regras de Negócio e Comissionamento da Claro.
 * Protegido no Backend para evitar manipulação de comissões via navegador.
 */

export const TETO_RV_VENDEDOR = 6000.00;
export const TETO_RV_SENIOR = 6000.00;
export const TETO_RV_GERENTE = 7000.00;
export const TETO_RV_GEEK = 6000.00;
export const TETO_RV_ASSISTENTE = 4000.00;
export const TETO_RV_ADMINISTRATIVO = 2000.00;

export const FATORES_CLARO_MULTI = {
    FAIXA_1: 1.2, // 0.00% até 99.99% de Meta Multi
    FAIXA_2: 1.4, // 100.00% até 129.99%
    FAIXA_3: 1.6, // 130.00% até 159.99%
    FAIXA_4: 1.8  // A partir de 160.00%
};

export const aplicarRegrasDeProduto = (sale, metricasVendedor = {}) => {
    let receitaBase = Number(sale.comissao !== undefined ? sale.comissao : sale.receita) || 0;
    let isMovel = false;
    let isResidencial = false;
    
    const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
    const sub = String(sale.subOption || sale.subtipo || '').toUpperCase();
    const combo = String(sale.combo || '').toUpperCase();
    const portabilidade = String(sale.portabilidade || '').toUpperCase();
    
    if (pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('CONTROLE') || 
        pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('FLEX') || 
        pBase.includes('DEPENDENTE') || pBase.includes('DEP')) {
        isMovel = true;
    }
    
    if (pBase.includes('FIBRA') || pBase.includes('TV') || pBase.includes('FIXO') || pBase.includes('MESH') || pBase.includes('RESIDENCIAL')) {
        isResidencial = true;
    }

    if (isMovel) {
        if (pBase.includes('DEP') && (sub.includes('GRÁTIS') || sub.includes('GRATUITO'))) {
            receitaBase = 0;
        }
        if (portabilidade === 'SIM') {
            receitaBase *= 1.30;
        }
        if (combo.includes('MULTI')) {
            const pctMplay = metricasVendedor.pctAtingimentoMplay || metricasVendedor.pctAtingimentoMPlay || 0;
            const temMplay = String(sale.mplay || '').toUpperCase() === 'SIM';
            if (temMplay) {
                let fatorMulti = FATORES_CLARO_MULTI.FAIXA_1;
                if (pctMplay >= 160.00) fatorMulti = FATORES_CLARO_MULTI.FAIXA_4;
                else if (pctMplay >= 130.00) fatorMulti = FATORES_CLARO_MULTI.FAIXA_3;
                else if (pctMplay >= 100.00) fatorMulti = FATORES_CLARO_MULTI.FAIXA_2;
                receitaBase *= fatorMulti;
            } else {
                receitaBase *= 1.0;
            }
        }
    }

    if (isResidencial) {
        if (pBase.replace(/\s/g, '').includes('TV+APP') || sub.replace(/\s/g, '').includes('TV+APP') || sub === 'APP') {
            receitaBase = 0;
        }
        if (combo.includes('MULTI')) {
            const pctMplay = metricasVendedor.pctAtingimentoMplay || metricasVendedor.pctAtingimentoMPlay || 0;
            const temMplay = String(sale.mplay || '').toUpperCase() === 'SIM';
            if (temMplay) {
                let fatorMulti = FATORES_CLARO_MULTI.FAIXA_1;
                if (pctMplay >= 160.00) fatorMulti = FATORES_CLARO_MULTI.FAIXA_4;
                else if (pctMplay >= 130.00) fatorMulti = FATORES_CLARO_MULTI.FAIXA_3;
                else if (pctMplay >= 100.00) fatorMulti = FATORES_CLARO_MULTI.FAIXA_2;
                receitaBase *= fatorMulti;
            } else {
                receitaBase *= 1.0;
            }
        } else {
            receitaBase *= 1.0;
        }
    }

    const tipoOp = String(sale.tipoOperacao || sale.operacao || '').toUpperCase();
    if (tipoOp === 'UPGRADE') {
        receitaBase *= 0.50;
    } else if (tipoOp === 'SIDEGRADE') {
        receitaBase *= 0.25;
    } else if (tipoOp === 'DOWNGRADE') {
        receitaBase = 0;
    }

    return receitaBase;
};

export const calcularFatorRV = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;

    const pctPos = metricasExtras.pctAtingimentoPos || 0;
    const pctUr = metricasExtras.pctAtingimentoUr || 0;

    if (pctAtingimento < 80.00 || pctPos < 80.00 || pctUr < 80.00) {
        elegivel = false;
        fator = 0.00;
    } else if (pctAtingimento >= 80.00 && pctAtingimento < 100.00) {
        fator = 0.045;
    } else if (pctAtingimento >= 100.00 && pctAtingimento < 120.00) {
        fator = 0.07;
    } else if (pctAtingimento >= 120.00 && pctAtingimento < 150.00) {
        fator = 0.09;
    } else {
        fator = 0.11;
    }

    let previaPagamento = totalComissao * fator;

    if (metricasExtras.notaNps && metricasExtras.notaNps >= 8) {
        previaPagamento += (previaPagamento * 0.05);
    }

    let bonusUnitario = 0;
    const calcularBonusProduto = (vol, meta) => {
        if (!meta || meta <= 0) return 0;
        const pct = (vol / meta) * 100;
        if (pct >= 100) {
            const adicionais = vol - meta;
            if (adicionais > 0) {
                if (pct >= 115.00) return adicionais * 15.00;
                else if (pct >= 100.00) return adicionais * 10.00;
            }
        }
        return 0;
    };

    const bonusPos = calcularBonusProduto(metricasExtras.volPosPago || 0, metricasExtras.metaPosPago || 0);
    const bonusFibra = calcularBonusProduto(metricasExtras.volFibra || 0, metricasExtras.metaFibra || 0);
    const bonusTv = calcularBonusProduto(metricasExtras.volTv || 0, metricasExtras.metaTv || 0);

    bonusUnitario = bonusPos + bonusFibra + bonusTv;
    previaPagamento += bonusUnitario;

    if (previaPagamento > TETO_RV_VENDEDOR) {
        previaPagamento = TETO_RV_VENDEDOR;
    }

    return {
        fatorAplicado: fator,
        previaPagamento: previaPagamento,
        elegivel: elegivel,
        bonusUnitario: bonusUnitario
    };
};

export const calcularFatorRVSenior = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;

    const pctPos = metricasExtras.pctAtingimentoPos || 0;
    const pctUr = metricasExtras.pctAtingimentoUr || 0;

    // 1. Elegibilidade Mínima (1ª Etapa)
    if (pctAtingimento < 80.00 || pctPos < 80.00 || pctUr < 80.00) {
        elegivel = false;
        fator = 0.00;
    } // 2. Multiplicadores de Ganho (2ª Etapa)
    else if (pctAtingimento >= 80.00 && pctAtingimento < 100.00) {
        fator = 0.01; // 1,00%
    } else if (pctAtingimento >= 100.00 && pctAtingimento < 115.00) {
        fator = 0.015; // 1,50%
    } else {
        fator = 0.02; // 2,00%
    }

    let previaPagamento = totalComissao * fator;

    // 3. Bônus de Qualidade - NPS (3ª Etapa)
    if (metricasExtras.notaNps && metricasExtras.notaNps >= 8) {
        previaPagamento += (previaPagamento * 0.05);
    }

    // 4. Limitador / Teto (4ª Etapa)
    if (previaPagamento > TETO_RV_SENIOR) {
        previaPagamento = TETO_RV_SENIOR;
    }

    return {
        fatorAplicado: fator,
        previaPagamento: previaPagamento,
        elegivel: elegivel,
        bonusUnitario: 0 // Sênior não possui bônus unitário de excedente neste modelo
    };
};

export const calcularFatorRVGerente = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;

    const pctPos = metricasExtras.pctAtingimentoPos || 0;
    const pctUr = metricasExtras.pctAtingimentoUr || 0;

    // 1. Elegibilidade Mínima (1ª Etapa)
    if (pctAtingimento < 80.00 || pctPos < 80.00 || pctUr < 80.00) {
        elegivel = false;
        fator = 0.00;
    } // 2. Multiplicadores de Ganho (2ª Etapa)
    else if (pctAtingimento >= 80.00 && pctAtingimento < 100.00) {
        fator = 0.01; // 1,00%
    } else if (pctAtingimento >= 100.00 && pctAtingimento < 115.00) {
        fator = 0.02; // 2,00%
    } else {
        fator = 0.03; // 3,00%
    }

    let previaPagamento = totalComissao * fator;

    // 3. Bônus de Qualidade - NPS (3ª Etapa)
    if (metricasExtras.notaNps && metricasExtras.notaNps >= 8) {
        previaPagamento += (previaPagamento * 0.05);
    }

    // Bônus Gestão (3ª Etapa - Adicional)
    let bonusGestao = 0;
    const pctVendedoresElegiveis = metricasExtras.pctVendedoresElegiveis || 0;
    if (pctVendedoresElegiveis >= 100.00) {
        bonusGestao = 500.00;
    } else if (pctVendedoresElegiveis >= 80.00) {
        bonusGestao = 250.00;
    }
    previaPagamento += bonusGestao;

    // 4. Limitador / Teto (4ª Etapa)
    if (previaPagamento > TETO_RV_GERENTE) {
        previaPagamento = TETO_RV_GERENTE;
    }

    return {
        fatorAplicado: fator,
        previaPagamento: previaPagamento,
        elegivel: elegivel,
        bonusUnitario: bonusGestao
    };
};

export const calcularFatorRVGeek = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;

    const pctPos = metricasExtras.pctAtingimentoPos || 0;
    const pctAcessorio = metricasExtras.pctAtingimentoAcessorio || 0;
    const pctAparelho = metricasExtras.pctAtingimentoAparelho || 0;

    // 1. Elegibilidade Mínima (1ª Etapa)
    if (pctPos < 80.00 || pctAcessorio < 80.00 || pctAparelho < 80.00) {
        elegivel = false;
        fator = 0.00;
    } // 2. Multiplicadores de Ganho (2ª Etapa - Baseado na Receita)
    else if (pctAtingimento >= 80.00 && pctAtingimento < 100.00) {
        fator = 0.01; // 1,00%
    } else if (pctAtingimento >= 100.00 && pctAtingimento < 115.00) {
        fator = 0.015; // 1,50%
    } else if (pctAtingimento >= 115.00) {
        fator = 0.02; // 2,00%
    }

    let previaPagamento = totalComissao * fator;
    let bonusFixos = 0;

    // 3. Bônus Adicionais (3ª Etapa)
    if (elegivel) {
        const pctBlPme = metricasExtras.pctAtingimentoBlPme || 0;
        if (pctBlPme >= 130.00) {
            bonusFixos += 300.00;
        } else if (pctBlPme >= 100.00) {
            bonusFixos += 200.00;
        }

        const pctTmAcessorio = metricasExtras.pctAtingimentoTmAcessorio || 0;
        if (pctAcessorio >= 100.00 && pctTmAcessorio >= 100.00) {
            bonusFixos += 235.00;
        }
    }
    
    previaPagamento += bonusFixos;

    // 4. Limitador / Teto (4ª Etapa)
    if (previaPagamento > TETO_RV_GEEK) {
        previaPagamento = TETO_RV_GEEK;
    }

    return {
        fatorAplicado: fator,
        previaPagamento: previaPagamento,
        elegivel: elegivel,
        bonusUnitario: bonusFixos
    };
};

export const calcularFatorRVAssistente = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;

    const pctPos = metricasExtras.pctAtingimentoPos || 0;
    const pctUr = metricasExtras.pctAtingimentoUr || 0;

    // 1. Elegibilidade Mínima (1ª Etapa)
    if (pctAtingimento < 80.00 || pctPos < 80.00 || pctUr < 80.00) {
        elegivel = false;
        fator = 0.00;
    } // 2. Multiplicadores de Ganho (2ª Etapa)
    else if (pctAtingimento >= 80.00 && pctAtingimento < 100.00) {
        fator = 0.0075; // 0,75%
    } else if (pctAtingimento >= 100.00 && pctAtingimento < 115.00) {
        fator = 0.012; // 1,20%
    } else {
        fator = 0.015; // 1,50%
    }

    let previaPagamento = totalComissao * fator;

    // 3. Bônus de Qualidade - NPS (3ª Etapa)
    if (metricasExtras.notaNps && metricasExtras.notaNps >= 8) {
        previaPagamento += (previaPagamento * 0.05);
    }

    // 4. Limitador / Teto (4ª Etapa)
    if (previaPagamento > TETO_RV_ASSISTENTE) {
        previaPagamento = TETO_RV_ASSISTENTE;
    }

    return {
        fatorAplicado: fator,
        previaPagamento: previaPagamento,
        elegivel: elegivel,
        bonusUnitario: 0 // Assistente não possui bônus fixos atrelados nesta regra
    };
};

export const calcularFatorRVAdministrativo = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;

    const pctPos = metricasExtras.pctAtingimentoPos || 0;
    const pctUr = metricasExtras.pctAtingimentoUr || 0;

    // 1. Elegibilidade Mínima (1ª Etapa)
    if (pctAtingimento < 80.00 || pctPos < 80.00 || pctUr < 80.00) {
        elegivel = false;
        fator = 0.00;
    } // 2. Multiplicadores de Ganho (2ª Etapa)
    else if (pctAtingimento >= 80.00 && pctAtingimento < 100.00) {
        fator = 0.005; // 0,50%
    } else if (pctAtingimento >= 100.00 && pctAtingimento < 115.00) {
        fator = 0.01; // 1,00%
    } else {
        fator = 0.015; // 1,50%
    }

    let previaPagamento = totalComissao * fator;

    // 3. Bônus de Qualidade - NPS (3ª Etapa)
    if (metricasExtras.notaNps && metricasExtras.notaNps >= 8) {
        previaPagamento += (previaPagamento * 0.05);
    }

    // 4. Limitador / Teto (4ª Etapa)
    if (previaPagamento > TETO_RV_ADMINISTRATIVO) {
        previaPagamento = TETO_RV_ADMINISTRATIVO;
    }

    return {
        fatorAplicado: fator,
        previaPagamento: previaPagamento,
        elegivel: elegivel,
        bonusUnitario: 0 // Administrativo não possui bônus fixos atrelados nesta regra
    };
};