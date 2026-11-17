/**
 * Arquivo centralizado de Regras de Negócio e Comissionamento da Operadora.
 * Norma Oficial: PL-DRH-042 (Anexo I - G, Revisão 08 — 23/02/2026)
 * Protegido no Backend para evitar manipulação de comissões via navegador.
 */

export const TETO_RV_VENDEDOR = 6000.00;
export const TETO_RV_SENIOR = 6000.00;
export const TETO_RV_GERENTE = 7000.00;
export const TETO_RV_GEEK = 6000.00;
export const TETO_RV_ASSISTENTE = 4000.00;
export const TETO_RV_ADMINISTRATIVO = 2000.00;

export const FATORES_ACELERADOR_MULTI = {
    FAIXA_1: 1.2, // 0.00% até 99.99% de Meta Multi
    FAIXA_2: 1.4, // 100.00% até 129.99%
    FAIXA_3: 1.6, // 130.00% até 159.99%
    FAIXA_4: 1.8  // A partir de 160.00%
};

/**
 * Normaliza o nome do cargo para uma das 6 categorias oficiais da PL-DRH-042
 */
export const normalizeRoleForRV = (rawRole) => {
    const r = String(rawRole || 'VENDEDOR').trim().toUpperCase();
    if (r === 'GERENTE' || r === 'COORDENADOR' || r === 'ESPECIALISTA' || r.includes('GERENTE') || r.includes('SUPERVISOR')) {
        return 'GERENTE';
    }
    if (r === 'SENIOR' || r === 'SÊNIOR' || r.includes('SENIOR') || r.includes('SÊNIOR')) {
        return 'SENIOR';
    }
    if (r === 'GEEK' || r.includes('GEEK') || r.includes('TECNOLOGICO') || r.includes('TECNOLÓGICO')) {
        return 'GEEK';
    }
    if (r === 'ADMINISTRAÇÃO' || r === 'ADMINISTRACAO' || r === 'ADM' || r.includes('ADMIN')) {
        return 'ADMINISTRAÇÃO';
    }
    if (r.includes('ASSISTENTE') || r.includes('RELACIONAMENTO')) {
        return 'ASSISTENTE RELACIONAMENTO';
    }
    return 'VENDEDOR';
};

/**
 * Aplica as regras de apuração de receita por serviço/produto (Anexo I da PL-DRH-042)
 * Mapeando todos os nomes compostos para os produtos da base:
 * - Banda Larga Fixa / Virtua -> FIBRA / FIBRA PME
 * - TV Ponto Principal -> TVBOX, TV-BOX, TV CABO, SOUNDBOX
 * - Telefone Fixo -> FIXO
 * - Smarthome -> MESH
 * - Móvel Conta/Controle/BL Móvel/Flex -> POS *, CONTROLE *, DEPENDENTE, FLEX, BANDA LARGA
 * - Aparelho (5% ou 6% c/ seguro), Acessórios/Película (15%), Seguro avulso (40% da 1ª parcela)
 */
export const aplicarRegrasDeProduto = (sale, metricasVendedor = {}) => {
    const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase().trim();
    const sub = String(sale.subOption || sale.subtipo || '').toUpperCase().trim();
    const combo = String(sale.combo || '').toUpperCase().trim();
    const portabilidade = String(sale.portabilidade || '').toUpperCase().trim();
    const tipoOp = String(sale.tipoOperacao || sale.operacao || '').toUpperCase().trim();
    const adicionais = Array.isArray(sale.adicionais) ? sale.adicionais.map(a => String(a).toUpperCase()) : [];

    // Downgrade não remunera em nenhuma hipótese
    if (tipoOp === 'DOWNGRADE') {
        return 0;
    }

    const valorBruto = Number(sale.valorBruto !== undefined ? sale.valorBruto : sale.receita) || 0;
    let receitaBase = Number(sale.comissao !== undefined ? sale.comissao : sale.receita) || 0;

    // 1. APARELHOS, ACESSÓRIOS/PELÍCULAS E SEGURO PROTEÇÃO MÓVEL
    if (pBase.includes('APARELHO')) {
        // Resgate a preço zero (R$ 0,00) conta apenas no quantitativo, não na receita
        if (valorBruto <= 0 && receitaBase <= 0) return 0;
        // Aparelhos permanecem em 5% fixo (com ou sem seguro)
        if (valorBruto > 0 && Math.abs(receitaBase - valorBruto) < 0.01) {
            receitaBase = valorBruto * 0.05;
        } else if (valorBruto > 0 && Math.abs(receitaBase - (valorBruto * 0.06)) < 0.05) {
            receitaBase = valorBruto * 0.05;
        }
        return Math.max(0, receitaBase);
    }

    if (pBase.includes('ACESSORIO') || pBase.includes('ACESSÓRIO') || pBase.includes('PELICULA') || pBase.includes('PELÍCULA')) {
        if (valorBruto > 0 && Math.abs(receitaBase - valorBruto) < 0.01) {
            receitaBase = valorBruto * 0.15;
        }
        return Math.max(0, receitaBase);
    }

    if (pBase === 'SEGURO' || pBase.startsWith('SEGURO ')) {
        // Pacote Seguro avulso: 40% da 1ª parcela
        if (valorBruto > 0 && Math.abs(receitaBase - valorBruto) < 0.01) {
            receitaBase = valorBruto * 0.40;
        }
        return Math.max(0, receitaBase);
    }

    // 2. CLASSIFICAÇÃO MÓVEL vs RESIDENCIAL
    const isMovel = (
        pBase.includes('POS') ||
        pBase.includes('PÓS') ||
        pBase.includes('CONTROLE') ||
        pBase.includes('FLEX') ||
        pBase.includes('DEPENDENTE') ||
        pBase.includes('DEP') ||
        ((pBase.includes('BANDA LARGA') || pBase === 'BL') && !pBase.includes('RESIDENCIAL') && !pBase.includes('FIXA'))
    );

    const isResidencial = (
        pBase.includes('FIBRA') ||
        pBase.includes('VIRTUA') ||
        pBase.includes('BANDA LARGA FIXA') ||
        pBase.includes('BANDA LARGA RESIDENCIAL') ||
        pBase.includes('TV') ||
        pBase.includes('SOUNDBOX') ||
        pBase.includes('PONTO ADICIONAL') ||
        pBase.includes('FIXO') ||
        pBase.includes('FONE') ||
        pBase.includes('MESH') ||
        pBase.includes('SMARTHOME') ||
        pBase.includes('RESIDENCIAL')
    );

    const isUpgradeOrSidegrade = (tipoOp === 'UPGRADE' || tipoOp === 'SIDEGRADE');

    if (isMovel) {
        // Dependente gratuito: entra nos indicadores quantitativos (Gross), mas não compõe receita monetária
        if (
            (pBase.includes('DEP') || sub.includes('DEP') || sub.includes('LINHA ADICIONAL')) &&
            (sub.includes('GRÁTIS') || sub.includes('GRATIS') || sub.includes('GRATUITO') || sub.includes('INCLUSA'))
        ) {
            return 0;
        }

        // Claro Flex Recarga: 40% da Tabela de Referência (se especificado como recarga)
        if (pBase.includes('FLEX') && sub.includes('RECARGA')) {
            receitaBase *= 0.40;
        }

        // Portabilidade: recebe +30% sobre o valor da Tabela de Referência (não entra como migração)
        if (portabilidade === 'SIM' && !tipoOp.includes('MIGRA') && !isUpgradeOrSidegrade) {
            receitaBase *= 1.30;
        }

        // Fator Claro Multi (somente vendas novas em contrato Multi com M-Play marcado; upgrade/sidegrade não gera fator)
        if (combo.includes('MULTI') && !isUpgradeOrSidegrade) {
            const pctMplay = Number(metricasVendedor.pctAtingimentoMplay ?? metricasVendedor.pctAtingimentoMPlay ?? 0);
            const temMplay = String(sale.mplay || '').toUpperCase() === 'SIM';
            if (temMplay) {
                let fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_1; // 1.2x (0% a 99,99%)
                if (pctMplay >= 160.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_4; // 1.8x
                else if (pctMplay >= 130.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_3; // 1.6x
                else if (pctMplay >= 100.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_2; // 1.4x
                receitaBase *= fatorMulti;
            }
        }
    }

    if (isResidencial) {
        // Claro TV+APP e A La Carte avulso não contabilizam
        const normP = pBase.replace(/\s/g, '');
        const normSub = sub.replace(/\s/g, '');
        if (normP.includes('TV+APP') || normSub.includes('TV+APP') || normSub === 'APP' || normP.includes('ALACARTE')) {
            return 0;
        }

        // Fator Claro Multi (somente vendas novas em contrato Multi com M-Play marcado)
        if (combo.includes('MULTI') && !isUpgradeOrSidegrade) {
            const pctMplay = Number(metricasVendedor.pctAtingimentoMplay ?? metricasVendedor.pctAtingimentoMPlay ?? 0);
            const temMplay = String(sale.mplay || '').toUpperCase() === 'SIM';
            if (temMplay) {
                let fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_1; // 1.2x
                if (pctMplay >= 160.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_4; // 1.8x
                else if (pctMplay >= 130.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_3; // 1.6x
                else if (pctMplay >= 100.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_2; // 1.4x
                receitaBase *= fatorMulti;
            }
        }
    }

    // 3. MOVIMENTAÇÃO DE PLANOS MÓVEIS E RESIDENCIAIS (Upgrade = 50%, Sidegrade = 25%, Downgrade = 0%)
    if (tipoOp === 'UPGRADE') {
        receitaBase *= 0.50;
    } else if (tipoOp === 'SIDEGRADE') {
        receitaBase *= 0.25;
    }

    return Math.max(0, receitaBase);
};

/**
 * 1. Assistente de Relacionamentos — Grupo VII (Anexo VIII, Rev. 04)
 * Base: Loja alocada | Gatilhos (≥ 80%): Gross Pós, Receita, Residencial
 * Faixas: 0,75% (80-99,99%) | 1,20% (100-114,99%) | 1,50% (≥ 115%)
 * Bônus: SMS ≥ 8 (+5% sobre RV Etapa 2) | Teto: R$ 4.000,00
 */
export const calcularFatorRVAssistente = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;

    const pctPos = Number(metricasExtras.pctAtingimentoPos) || 0;
    const pctUr = Number(metricasExtras.pctAtingimentoUr) || 0;
    const pctRec = Number(pctAtingimento) || 0;

    if (pctRec < 80.00 || pctPos < 80.00 || pctUr < 80.00) {
        elegivel = false;
        fator = 0.00;
    } else if (pctRec >= 80.00 && pctRec < 100.00) {
        fator = 0.0075; // 0,75%
    } else if (pctRec >= 100.00 && pctRec < 115.00) {
        fator = 0.012; // 1,20%
    } else {
        fator = 0.015; // 1,50%
    }

    const rvEtapa2 = elegivel ? (totalComissao * fator) : 0;
    let bonusSms = 0;

    if (elegivel && Number(metricasExtras.notaNps) >= 8) {
        bonusSms = rvEtapa2 * 0.05;
    }

    const previaBruta = rvEtapa2 + bonusSms;
    const previaPagamento = Math.min(previaBruta, TETO_RV_ASSISTENTE);

    return {
        cargoNorma: 'Assistente de Relacionamentos',
        grupoAnexo: 'Grupo VII (Anexo VIII, Rev. 04)',
        baseApuracao: 'Loja Alocada',
        fatorAplicado: fator,
        rvEtapa2,
        bonusSms,
        bonusGestao: 0,
        bonusUnitario: 0,
        bonusBlPme: 0,
        bonusTmAcessorio: 0,
        totalBonus: bonusSms,
        tetoCargo: TETO_RV_ASSISTENTE,
        atingiuTeto: previaBruta > TETO_RV_ASSISTENTE,
        previaPagamento: Math.max(0, previaPagamento),
        elegivel
    };
};

/**
 * 2. Gerente de Loja — Grupo II (Anexo III, Rev. 04)
 * Base: Lojas sob gestão | Gatilhos (≥ 80%): Gross Pós, Receita, Residencial
 * Faixas: 1,00% (80-99,99%) | 2,00% (100-114,99%) | 3,00% (≥ 115%)
 * Bônus: SMS ≥ 8 (+5% sobre Etapa 2) + Bônus Gestão (R$ 250 se ≥ 80% elegíveis | R$ 500 se 100% elegíveis)
 * Teto: R$ 7.000,00
 */
export const calcularFatorRVGerente = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;

    const pctPos = Number(metricasExtras.pctAtingimentoPos) || 0;
    const pctUr = Number(metricasExtras.pctAtingimentoUr) || 0;
    const pctRec = Number(pctAtingimento) || 0;

    if (pctRec < 80.00 || pctPos < 80.00 || pctUr < 80.00) {
        elegivel = false;
        fator = 0.00;
    } else if (pctRec >= 80.00 && pctRec < 100.00) {
        fator = 0.01; // 1,00%
    } else if (pctRec >= 100.00 && pctRec < 115.00) {
        fator = 0.02; // 2,00%
    } else {
        fator = 0.03; // 3,00%
    }

    const rvEtapa2 = elegivel ? (totalComissao * fator) : 0;
    let bonusSms = 0;
    let bonusGestao = 0;

    if (elegivel) {
        if (Number(metricasExtras.notaNps) >= 8) {
            bonusSms = rvEtapa2 * 0.05;
        }
        const pctVendedoresElegiveis = Number(metricasExtras.pctVendedoresElegiveis) || 0;
        if (pctVendedoresElegiveis >= 100.00) {
            bonusGestao = 500.00;
        } else if (pctVendedoresElegiveis >= 80.00) {
            bonusGestao = 250.00;
        }
    }

    const totalBonus = bonusSms + bonusGestao;
    const previaBruta = rvEtapa2 + totalBonus;
    const previaPagamento = Math.min(previaBruta, TETO_RV_GERENTE);

    return {
        cargoNorma: 'Gerente de Loja',
        grupoAnexo: 'Grupo II (Anexo III, Rev. 04)',
        baseApuracao: 'Lojas sob Gestão',
        fatorAplicado: fator,
        rvEtapa2,
        bonusSms,
        bonusGestao,
        bonusUnitario: bonusGestao,
        bonusBlPme: 0,
        bonusTmAcessorio: 0,
        totalBonus,
        tetoCargo: TETO_RV_GERENTE,
        atingiuTeto: previaBruta > TETO_RV_GERENTE,
        previaPagamento: Math.max(0, previaPagamento),
        elegivel
    };
};

/**
 * 3. Vendedor Sênior — Grupo III (Anexo IV, Rev. 04)
 * Base: Loja alocada | Gatilhos (≥ 80%): Gross Pós, Receita, Residencial
 * Faixas: 1,00% (80-99,99%) | 1,50% (100-114,99%) | 2,00% (≥ 115%)
 * Bônus: SMS ≥ 8 (+5% sobre Etapa 2) | Teto: R$ 6.000,00
 */
export const calcularFatorRVSenior = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;

    const pctPos = Number(metricasExtras.pctAtingimentoPos) || 0;
    const pctUr = Number(metricasExtras.pctAtingimentoUr) || 0;
    const pctRec = Number(pctAtingimento) || 0;

    if (pctRec < 80.00 || pctPos < 80.00 || pctUr < 80.00) {
        elegivel = false;
        fator = 0.00;
    } else if (pctRec >= 80.00 && pctRec < 100.00) {
        fator = 0.01; // 1,00%
    } else if (pctRec >= 100.00 && pctRec < 115.00) {
        fator = 0.015; // 1,50%
    } else {
        fator = 0.02; // 2,00%
    }

    const rvEtapa2 = elegivel ? (totalComissao * fator) : 0;
    let bonusSms = 0;

    if (elegivel && Number(metricasExtras.notaNps) >= 8) {
        bonusSms = rvEtapa2 * 0.05;
    }

    const previaBruta = rvEtapa2 + bonusSms;
    const previaPagamento = Math.min(previaBruta, TETO_RV_SENIOR);

    return {
        cargoNorma: 'Vendedor Sênior',
        grupoAnexo: 'Grupo III (Anexo IV, Rev. 04)',
        baseApuracao: 'Loja Alocada',
        fatorAplicado: fator,
        rvEtapa2,
        bonusSms,
        bonusGestao: 0,
        bonusUnitario: 0,
        bonusBlPme: 0,
        bonusTmAcessorio: 0,
        totalBonus: bonusSms,
        tetoCargo: TETO_RV_SENIOR,
        atingiuTeto: previaBruta > TETO_RV_SENIOR,
        previaPagamento: Math.max(0, previaPagamento),
        elegivel
    };
};

/**
 * 4. Vendedor — Grupo VIII (Anexo IX, Rev. 03)
 * Base: Individual | Gatilhos (≥ 80%): Gross Pós, Receita, Residencial
 * Faixas: 4,50% (80-99,99%) | 7,00% (100-119,99%) | 9,00% (120-149,99%) | 11,00% (≥ 150%)
 * Bônus: SMS ≥ 8 (+5% sobre Etapa 2) + Bônus Unitário por Venda Acima da Meta (Pós Titular Conta/Controle, Fibra/Virtua, TV: R$ 10 [100-114,99%] | R$ 15 [≥ 115%])
 * Teto: R$ 6.000,00
 */
export const calcularFatorRVVendedor = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;

    const pctPos = Number(metricasExtras.pctAtingimentoPos) || 0;
    const pctUr = Number(metricasExtras.pctAtingimentoUr) || 0;
    const pctRec = Number(pctAtingimento) || 0;

    if (pctRec < 80.00 || pctPos < 80.00 || pctUr < 80.00) {
        elegivel = false;
        fator = 0.00;
    } else if (pctRec >= 80.00 && pctRec < 100.00) {
        fator = 0.045; // 4,50%
    } else if (pctRec >= 100.00 && pctRec < 120.00) {
        fator = 0.07; // 7,00%
    } else if (pctRec >= 120.00 && pctRec < 150.00) {
        fator = 0.09; // 9,00%
    } else {
        fator = 0.11; // 11,00%
    }

    const rvEtapa2 = elegivel ? (totalComissao * fator) : 0;
    let bonusSms = 0;
    let bonusUnitario = 0;
    let bonusPos = 0;
    let bonusFibra = 0;
    let bonusTv = 0;

    const calcularBonusProdutoExcedente = (vol, meta) => {
        const v = Number(vol) || 0;
        const m = Number(meta) || 0;
        if (m <= 0 || v <= m) return 0;
        const pct = (v / m) * 100;
        const excedentes = v - m;
        if (pct >= 115.00) return excedentes * 15.00;
        if (pct >= 100.00) return excedentes * 10.00;
        return 0;
    };

    if (elegivel) {
        if (Number(metricasExtras.notaNps) >= 8) {
            bonusSms = rvEtapa2 * 0.05;
        }
        bonusPos = calcularBonusProdutoExcedente(metricasExtras.volPosPago, metricasExtras.metaPosPago);
        bonusFibra = calcularBonusProdutoExcedente(metricasExtras.volFibra, metricasExtras.metaFibra);
        bonusTv = calcularBonusProdutoExcedente(metricasExtras.volTv, metricasExtras.metaTv);
        bonusUnitario = bonusPos + bonusFibra + bonusTv;
    }

    const totalBonus = bonusSms + bonusUnitario;
    const previaBruta = rvEtapa2 + totalBonus;
    const previaPagamento = Math.min(previaBruta, TETO_RV_VENDEDOR);

    return {
        cargoNorma: 'Vendedor',
        grupoAnexo: 'Grupo VIII (Anexo IX, Rev. 03)',
        baseApuracao: 'Individual',
        fatorAplicado: fator,
        rvEtapa2,
        bonusSms,
        bonusGestao: 0,
        bonusUnitario,
        bonusPos,
        bonusFibra,
        bonusTv,
        bonusBlPme: 0,
        bonusTmAcessorio: 0,
        totalBonus,
        tetoCargo: TETO_RV_VENDEDOR,
        atingiuTeto: previaBruta > TETO_RV_VENDEDOR,
        previaPagamento: Math.max(0, previaPagamento),
        elegivel
    };
};

/**
 * 5. Assistente Tecnológico (Geek) — Grupo IV (Anexo V, Rev. 04)
 * Base: Loja alocada
 * Gatilhos de Elegibilidade (≥ 80%): Gross Pós (Qtde), Acessório (Qtde), Aparelho (Qtde) — sem exigir Receita ou Residencial na elegibilidade
 * Faixas sobre Receita Gerada da loja: 0,00% (< 80%) | 1,00% (80-99,99%) | 1,50% (100-114,99%) | 2,00% (≥ 115%)
 * Bônus Exclusivos (sem SMS):
 * - Banda Larga Fixa (Virtua/Fibra) PME: +R$ 200 (100% a 129,99%) | +R$ 300 (≥ 130%)
 * - Ticket Médio Acessórios: +R$ 235 fixo (exige simultaneamente ≥ 100% Meta Qtde Acessórios E ≥ 100% Meta TM Acessórios)
 * Teto: R$ 6.000,00
 */
export const calcularFatorRVGeek = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;

    const pctPos = Number(metricasExtras.pctAtingimentoPos) || 0;
    const pctAcessorio = Number(metricasExtras.pctAtingimentoAcessorio) || 0;
    const pctAparelho = Number(metricasExtras.pctAtingimentoAparelho) || 0;
    const pctRec = Number(pctAtingimento) || 0;

    // 1ª Etapa: 3 indicadores quantitativos (Gross Pós, Acessório Qtde, Aparelho Qtde) ≥ 80%
    if (pctPos < 80.00 || pctAcessorio < 80.00 || pctAparelho < 80.00) {
        elegivel = false;
        fator = 0.00;
    } else {
        // 2ª Etapa: Faixas % sobre Receita Gerada da loja
        if (pctRec >= 115.00) {
            fator = 0.02; // 2,00%
        } else if (pctRec >= 100.00) {
            fator = 0.015; // 1,50%
        } else if (pctRec >= 80.00) {
            fator = 0.01; // 1,00%
        } else {
            fator = 0.00; // Faixa 0 (< 80% de receita)
        }
    }

    const rvEtapa2 = elegivel ? (totalComissao * fator) : 0;
    let bonusBlPme = 0;
    let bonusTmAcessorio = 0;

    // 3ª Etapa: Bônus exclusivos do Geek
    if (elegivel) {
        const pctBlPme = Number(metricasExtras.pctAtingimentoBlPme) || 0;
        if (pctBlPme >= 130.00) {
            bonusBlPme = 300.00;
        } else if (pctBlPme >= 100.00) {
            bonusBlPme = 200.00;
        }

        const pctTmAcessorio = Number(metricasExtras.pctAtingimentoTmAcessorio) || 0;
        if (pctAcessorio >= 100.00 && pctTmAcessorio >= 100.00) {
            bonusTmAcessorio = 235.00;
        }
    }

    const bonusFixos = bonusBlPme + bonusTmAcessorio;
    const previaBruta = rvEtapa2 + bonusFixos;
    const previaPagamento = Math.min(previaBruta, TETO_RV_GEEK);

    return {
        cargoNorma: 'Assistente Tecnológico (Geek)',
        grupoAnexo: 'Grupo IV (Anexo V, Rev. 04)',
        baseApuracao: 'Loja Alocada',
        fatorAplicado: fator,
        rvEtapa2,
        bonusSms: 0,
        bonusGestao: 0,
        bonusUnitario: bonusFixos,
        bonusBlPme,
        bonusTmAcessorio,
        totalBonus: bonusFixos,
        tetoCargo: TETO_RV_GEEK,
        atingiuTeto: previaBruta > TETO_RV_GEEK,
        previaPagamento: Math.max(0, previaPagamento),
        elegivel
    };
};

/**
 * 6. ADM (Assistente Administrativo Loja) — Grupo V (Anexo VI, Rev. 03)
 * Base: Loja alocada | Gatilhos (≥ 80%): Gross Pós, Receita, Residencial
 * Faixas: 0,50% (80-99,99%) | 1,00% (100-114,99%) | 1,50% (≥ 115%)
 * Bônus: SMS ≥ 8 (+5% sobre Etapa 2) | Teto: R$ 2.000,00
 */
export const calcularFatorRVAdministrativo = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    let fator = 0;
    let elegivel = true;

    const pctPos = Number(metricasExtras.pctAtingimentoPos) || 0;
    const pctUr = Number(metricasExtras.pctAtingimentoUr) || 0;
    const pctRec = Number(pctAtingimento) || 0;

    if (pctRec < 80.00 || pctPos < 80.00 || pctUr < 80.00) {
        elegivel = false;
        fator = 0.00;
    } else if (pctRec >= 80.00 && pctRec < 100.00) {
        fator = 0.005; // 0,50%
    } else if (pctRec >= 100.00 && pctRec < 115.00) {
        fator = 0.01; // 1,00%
    } else {
        fator = 0.015; // 1,50%
    }

    const rvEtapa2 = elegivel ? (totalComissao * fator) : 0;
    let bonusSms = 0;

    if (elegivel && Number(metricasExtras.notaNps) >= 8) {
        bonusSms = rvEtapa2 * 0.05;
    }

    const previaBruta = rvEtapa2 + bonusSms;
    const previaPagamento = Math.min(previaBruta, TETO_RV_ADMINISTRATIVO);

    return {
        cargoNorma: 'ADM (Assistente Administrativo)',
        grupoAnexo: 'Grupo V (Anexo VI, Rev. 03)',
        baseApuracao: 'Loja Alocada',
        fatorAplicado: fator,
        rvEtapa2,
        bonusSms,
        bonusGestao: 0,
        bonusUnitario: 0,
        bonusBlPme: 0,
        bonusTmAcessorio: 0,
        totalBonus: bonusSms,
        tetoCargo: TETO_RV_ADMINISTRATIVO,
        atingiuTeto: previaBruta > TETO_RV_ADMINISTRATIVO,
        previaPagamento: Math.max(0, previaPagamento),
        elegivel
    };
};

/**
 * Roteador central de cálculo de RV que delega para a regra simétrica oficial do cargo
 */
export const calcularFatorRV = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    const normalizedRole = normalizeRoleForRV(metricasExtras.role);
    switch (normalizedRole) {
        case 'GERENTE':
            return calcularFatorRVGerente(pctAtingimento, totalComissao, metricasExtras);
        case 'SENIOR':
            return calcularFatorRVSenior(pctAtingimento, totalComissao, metricasExtras);
        case 'GEEK':
            return calcularFatorRVGeek(pctAtingimento, totalComissao, metricasExtras);
        case 'ADMINISTRAÇÃO':
            return calcularFatorRVAdministrativo(pctAtingimento, totalComissao, metricasExtras);
        case 'ASSISTENTE RELACIONAMENTO':
            return calcularFatorRVAssistente(pctAtingimento, totalComissao, metricasExtras);
        case 'VENDEDOR':
        default:
            return calcularFatorRVVendedor(pctAtingimento, totalComissao, metricasExtras);
    }
};
