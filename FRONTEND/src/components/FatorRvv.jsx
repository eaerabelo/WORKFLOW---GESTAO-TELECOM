import React, { useState, useEffect, useMemo } from 'react';
import { 
    Calculator, User, DollarSign, Target, TrendingUp, AlertCircle, 
    Award, Lock, CheckCircle2, AlertTriangle, ShieldCheck, 
    ChevronDown, Zap, BarChart2, FileText, Printer, ExternalLink, X, BookOpen, Sparkles
} from 'lucide-react';
import { applyCurrencyMask } from '../utils/masks';
import { METAS_PADRAO } from '../utils/constants';
import { authFetch, API_URL } from '../services/api.js';
import { WFLogoLoader } from './WFLogoLoader.jsx';

// Fatores de Aceleração Combo Multi (Norma PL-DRH-042 Anexo I)
const FATORES_ACELERADOR_MULTI = {
    FAIXA_1: 1.2, // 0,00% a 99,99%
    FAIXA_2: 1.4, // 100,00% a 129,99%
    FAIXA_3: 1.6, // 130,00% a 159,99%
    FAIXA_4: 1.8  // >= 160,00%
};

/**
 * Normaliza qualquer variação de cargo para um dos 6 cargos oficiais da Norma PL-DRH-042
 */
const normalizeRoleForRV = (rawRole) => {
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
 * Catálogo Oficial Simétrico dos 6 Cargos — Norma PL-DRH-042 (Anexo I - G, Revisão 08 — 23/02/2026)
 */
const REGRAS_CARGOS_NORMA = {
    'ASSISTENTE RELACIONAMENTO': {
        codigo: 'ASSISTENTE RELACIONAMENTO',
        titulo: 'Assistente de Relacionamentos (Loja)',
        grupoAnexo: 'Grupo VII • Anexo VIII (Rev. 04)',
        baseApuracao: 'Loja Alocada (Somatória da Loja Própria/Quiosque)',
        gatilhosLabel: 'Gross Pós (≥ 80%), Receita (≥ 80%), Residencial [Fibra + TV] (≥ 80%)',
        isGeekEligibility: false,
        faixas: [
            { label: 'Faixa 0 (< 80,00%)', min: 0, max: 79.99, pct: 0, texto: '0,00%' },
            { label: 'Faixa 1 (80,00% a 99,99%)', min: 80, max: 99.99, pct: 0.0075, texto: '0,75%' },
            { label: 'Faixa 2 (100,00% a 114,99%)', min: 100, max: 114.99, pct: 0.012, texto: '1,20%' },
            { label: 'Faixa 3 (≥ 115,00%)', min: 115, max: 9999, pct: 0.015, texto: '1,50%' }
        ],
        temBonusSms: true,
        bonusResumo: 'Pesquisa de Satisfação (SMS ≥ 8): +5,00% sobre o valor de RV da Etapa 2.',
        teto: 4000.00,
        etapasDetalhadas: [
            '1ª Etapa — Elegibilidade: Obrigatório atingir ≥ 80,00% em TODOS os 3 indicadores da loja (Gross Pós-Pago Consumo, Receita Consumo e PME, e Produtos Residenciais Consumo e PME [Fibra + TV Principal]). Falhar em 1 zera a RV.',
            '2ª Etapa — Cálculo da RV (% sobre Receita Gerada da loja): < 80%: 0,00% | 80% a < 100%: 0,75% | 100% a < 115%: 1,20% | ≥ 115%: 1,50%.',
            '3ª Etapa — Bônus: Pesquisa de Satisfação (SMS) +5,00% sobre o valor da Etapa 2 se a média das notas válidas dos vendedores da loja for ≥ 8.',
            '4ª Etapa — Teto Monetário: R$ 4.000,00.'
        ]
    },
    'GERENTE': {
        codigo: 'GERENTE',
        titulo: 'Gerente de Loja',
        grupoAnexo: 'Grupo II • Anexo III (Rev. 04)',
        baseApuracao: 'Lojas sob Gestão (Somatória das Lojas Próprias sob responsabilidade)',
        gatilhosLabel: 'Gross Pós (≥ 80%), Receita (≥ 80%), Residencial [Fibra + TV] (≥ 80%)',
        isGeekEligibility: false,
        faixas: [
            { label: 'Faixa 0 (< 80,00%)', min: 0, max: 79.99, pct: 0, texto: '0,00%' },
            { label: 'Faixa 1 (80,00% a 99,99%)', min: 80, max: 99.99, pct: 0.01, texto: '1,00%' },
            { label: 'Faixa 2 (100,00% a 114,99%)', min: 100, max: 114.99, pct: 0.02, texto: '2,00%' },
            { label: 'Faixa 3 (≥ 115,00%)', min: 115, max: 9999, pct: 0.03, texto: '3,00%' }
        ],
        temBonusSms: true,
        bonusResumo: 'SMS ≥ 8 (+5% sobre Etapa 2) + Bônus Gestão (+R$ 250 se ≥ 80% vendedores elegíveis | +R$ 500 se 100% elegíveis).',
        teto: 7000.00,
        etapasDetalhadas: [
            '1ª Etapa — Elegibilidade: Obrigatório atingir ≥ 80,00% em TODOS os 3 indicadores das lojas sob gestão (Gross Pós-Pago Consumo, Receita Consumo e PME, e Produtos Residenciais Consumo e PME [Fibra + TV Principal]).',
            '2ª Etapa — Cálculo da RV (% sobre Receita Gerada das lojas): < 80%: 0,00% | 80% a < 100%: 1,00% | 100% a < 115%: 2,00% | ≥ 115%: 3,00%.',
            '3ª Etapa — Bônus: (a) Pesquisa de Satisfação (SMS) +5,00% sobre a Etapa 2 se média ≥ 8; (b) Bônus Gestão (fixo, não acumulativo): +R$ 250,00 se ≥ 80% dos vendedores elegíveis à RV, ou +R$ 500,00 se 100% dos vendedores elegíveis à RV.',
            '4ª Etapa — Teto Monetário: R$ 7.000,00.'
        ]
    },
    'SENIOR': {
        codigo: 'SENIOR',
        titulo: 'Vendedor Sênior',
        grupoAnexo: 'Grupo III • Anexo IV (Rev. 04)',
        baseApuracao: 'Loja Alocada (Somatória da Loja Própria/Quiosque)',
        gatilhosLabel: 'Gross Pós (≥ 80%), Receita (≥ 80%), Residencial [Fibra + TV] (≥ 80%)',
        isGeekEligibility: false,
        faixas: [
            { label: 'Faixa 0 (< 80,00%)', min: 0, max: 79.99, pct: 0, texto: '0,00%' },
            { label: 'Faixa 1 (80,00% a 99,99%)', min: 80, max: 99.99, pct: 0.01, texto: '1,00%' },
            { label: 'Faixa 2 (100,00% a 114,99%)', min: 100, max: 114.99, pct: 0.015, texto: '1,50%' },
            { label: 'Faixa 3 (≥ 115,00%)', min: 115, max: 9999, pct: 0.02, texto: '2,00%' }
        ],
        temBonusSms: true,
        bonusResumo: 'Pesquisa de Satisfação (SMS ≥ 8): +5,00% sobre o valor de RV da Etapa 2.',
        teto: 6000.00,
        etapasDetalhadas: [
            '1ª Etapa — Elegibilidade: Obrigatório atingir ≥ 80,00% em TODOS os 3 indicadores da loja (Gross Pós-Pago Consumo, Receita Consumo e PME, e Produtos Residenciais Consumo e PME [Fibra + TV Principal]).',
            '2ª Etapa — Cálculo da RV (% sobre Receita Gerada da loja): < 80%: 0,00% | 80% a < 100%: 1,00% | 100% a < 115%: 1,50% | ≥ 115%: 2,00%.',
            '3ª Etapa — Bônus: Pesquisa de Satisfação (SMS) +5,00% sobre o valor da Etapa 2 se a média das notas válidas dos vendedores da loja for ≥ 8.',
            '4ª Etapa — Teto Monetário: R$ 6.000,00.'
        ]
    },
    'VENDEDOR': {
        codigo: 'VENDEDOR',
        titulo: 'Vendedor (Lojas Próprias)',
        grupoAnexo: 'Grupo VIII • Anexo IX (Rev. 03)',
        baseApuracao: 'Individual (Meta e Realizado individuais do colaborador)',
        gatilhosLabel: 'Gross Pós (≥ 80%), Receita (≥ 80%), Residencial [Fibra + TV] (≥ 80%)',
        isGeekEligibility: false,
        faixas: [
            { label: 'Faixa 0 (< 80,00%)', min: 0, max: 79.99, pct: 0, texto: '0,00%' },
            { label: 'Faixa 1 (80,00% a 99,99%)', min: 80, max: 99.99, pct: 0.045, texto: '4,50%' },
            { label: 'Faixa 2 (100,00% a 119,99%)', min: 100, max: 119.99, pct: 0.07, texto: '7,00%' },
            { label: 'Faixa 3 (120,00% a 149,99%)', min: 120, max: 149.99, pct: 0.09, texto: '9,00%' },
            { label: 'Faixa 4 (≥ 150,00%)', min: 150, max: 9999, pct: 0.11, texto: '11,00%' }
        ],
        temBonusSms: true,
        bonusResumo: 'SMS ≥ 8 (+5% sobre Etapa 2) + Bônus Unitário por Venda Acima da Meta (Pós Titular/Controle, Fibra e TV: R$ 10 [100-114,99%] ou R$ 15 [≥ 115%]).',
        teto: 6000.00,
        etapasDetalhadas: [
            '1ª Etapa — Elegibilidade: Obrigatório atingir ≥ 80,00% em TODOS os 3 indicadores individuais (Gross Pós-Pago Consumo, Receita Consumo e PME, e Produtos Residenciais Consumo e PME [Fibra + TV Principal]).',
            '2ª Etapa — Cálculo da RV (% sobre Receita Gerada individual): < 80%: 0,00% | 80% a < 100%: 4,50% | 100% a < 120%: 7,00% | 120% a < 150%: 9,00% | ≥ 150%: 11,00%.',
            '3ª Etapa — Bônus: (a) Pesquisa de Satisfação (SMS) +5,00% sobre a Etapa 2 se média individual ≥ 8; (b) Bônus Unitário Excedente por produto (Pós Titular Conta/Controle, Fibra/Virtua e TV): R$ 10,00 por venda acima da meta (100% a 114,99%) ou R$ 15,00 por venda acima da meta (≥ 115%).',
            '4ª Etapa — Teto Monetário: R$ 6.000,00.'
        ]
    },
    'GEEK': {
        codigo: 'GEEK',
        titulo: 'Assistente Tecnológico (Geek)',
        grupoAnexo: 'Grupo IV • Anexo V (Rev. 04)',
        baseApuracao: 'Loja Alocada (Somatória da Loja Própria/Quiosque)',
        gatilhosLabel: 'Gross Pós (≥ 80%), Acessório Qtde (≥ 80%), Aparelho Qtde (≥ 80%)',
        isGeekEligibility: true,
        faixas: [
            { label: 'Faixa 0 (< 80,00% Receita)', min: 0, max: 79.99, pct: 0, texto: '0,00%' },
            { label: 'Faixa 1 (80,00% a 99,99%)', min: 80, max: 99.99, pct: 0.01, texto: '1,00%' },
            { label: 'Faixa 2 (100,00% a 114,99%)', min: 100, max: 114.99, pct: 0.015, texto: '1,50%' },
            { label: 'Faixa 3 (≥ 115,00%)', min: 115, max: 9999, pct: 0.02, texto: '2,00%' }
        ],
        temBonusSms: false,
        bonusResumo: 'Sem Bônus SMS. Exclusivos: Fibra PME (+R$ 200 [100-129,99%] ou +R$ 300 [≥ 130%]) + Ticket Médio Acessórios (+R$ 235 fixo se Qtde ≥ 100% e TM ≥ 100%).',
        teto: 6000.00,
        etapasDetalhadas: [
            '1ª Etapa — Elegibilidade: Exige ≥ 80,00% nos 3 indicadores quantitativos da loja: Gross Pós-Pago Consumo, Acessório (Qtde) e Aparelho (Qtde). Não exige Receita nem Residencial para destravar elegibilidade.',
            '2ª Etapa — Cálculo da RV (% sobre Receita Gerada da loja): < 80%: 0,00% | 80% a < 100%: 1,00% | 100% a < 115%: 1,50% | ≥ 115%: 2,00%.',
            '3ª Etapa — Bônus Exclusivos (não possui Bônus SMS): (a) Banda Larga Fixa (Fibra/Virtua) PME: +R$ 200,00 (100% a 129,99%) ou +R$ 300,00 (≥ 130%); (b) Ticket Médio Acessórios: +R$ 235,00 fixo se atingir simultaneamente ≥ 100% da Meta Qtde Acessórios e ≥ 100% da Meta Ticket Médio de Acessórios.',
            '4ª Etapa — Teto Monetário: R$ 6.000,00.'
        ]
    },
    'ADMINISTRAÇÃO': {
        codigo: 'ADMINISTRAÇÃO',
        titulo: 'ADM (Assistente Administrativo Loja)',
        grupoAnexo: 'Grupo V • Anexo VI (Rev. 03)',
        baseApuracao: 'Loja Alocada (Somatória da Loja Própria/Quiosque)',
        gatilhosLabel: 'Gross Pós (≥ 80%), Receita (≥ 80%), Residencial [Fibra + TV] (≥ 80%)',
        isGeekEligibility: false,
        faixas: [
            { label: 'Faixa 0 (< 80,00%)', min: 0, max: 79.99, pct: 0, texto: '0,00%' },
            { label: 'Faixa 1 (80,00% a 99,99%)', min: 80, max: 99.99, pct: 0.005, texto: '0,50%' },
            { label: 'Faixa 2 (100,00% a 114,99%)', min: 100, max: 114.99, pct: 0.01, texto: '1,00%' },
            { label: 'Faixa 3 (≥ 115,00%)', min: 115, max: 9999, pct: 0.015, texto: '1,50%' }
        ],
        temBonusSms: true,
        bonusResumo: 'Pesquisa de Satisfação (SMS ≥ 8): +5,00% sobre o valor de RV da Etapa 2.',
        teto: 2000.00,
        etapasDetalhadas: [
            '1ª Etapa — Elegibilidade: Obrigatório atingir ≥ 80,00% em TODOS os 3 indicadores da loja (Gross Pós-Pago Consumo, Receita Consumo e PME, e Produtos Residenciais Consumo e PME [Fibra + TV Principal]).',
            '2ª Etapa — Cálculo da RV (% sobre Receita Gerada da loja): < 80%: 0,00% | 80% a < 100%: 0,50% | 100% a < 115%: 1,00% | ≥ 115%: 1,50%.',
            '3ª Etapa — Bônus: Pesquisa de Satisfação (SMS) +5,00% sobre o valor da Etapa 2 se a média das notas válidas dos vendedores da loja for ≥ 8.',
            '4ª Etapa — Teto Monetário: R$ 2.000,00.'
        ]
    }
};

// Cálculo local de receita por serviço/produto conforme Anexo I da PL-DRH-042
const calcularReceitaProdutoLocal = (sale, pctAtingimentoMplay = 0) => {
    const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase().trim();
    const sub = String(sale.subOption || sale.subtipo || '').toUpperCase().trim();
    const combo = String(sale.combo || '').toUpperCase().trim();
    const portabilidade = String(sale.portabilidade || '').toUpperCase().trim();
    const tipoOp = String(sale.tipoOperacao || sale.operacao || '').toUpperCase().trim();
    const adicionais = Array.isArray(sale.adicionais) ? sale.adicionais.map(a => String(a).toUpperCase()) : [];

    if (tipoOp === 'DOWNGRADE') return 0;

    const valorBruto = Number(sale.valorBruto !== undefined ? sale.valorBruto : sale.receita) || 0;
    let receitaBase = Number(sale.comissao !== undefined ? sale.comissao : sale.receita) || 0;

    if (pBase.includes('APARELHO')) {
        if (valorBruto <= 0 && receitaBase <= 0) return 0;
        const temSeguro = adicionais.includes('SEGURO') || Boolean(sale.seguroOption);
        if (valorBruto > 0 && Math.abs(receitaBase - valorBruto) < 0.01) {
            receitaBase = valorBruto * (temSeguro ? 0.06 : 0.05);
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
        if (valorBruto > 0 && Math.abs(receitaBase - valorBruto) < 0.01) {
            receitaBase = valorBruto * 0.40;
        }
        return Math.max(0, receitaBase);
    }

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
        if (
            (pBase.includes('DEP') || sub.includes('DEP') || sub.includes('LINHA ADICIONAL')) &&
            (sub.includes('GRÁTIS') || sub.includes('GRATIS') || sub.includes('GRATUITO') || sub.includes('INCLUSA'))
        ) {
            return 0;
        }
        if (pBase.includes('FLEX') && sub.includes('RECARGA')) {
            receitaBase *= 0.40;
        }
        if (portabilidade === 'SIM' && !tipoOp.includes('MIGRA') && !isUpgradeOrSidegrade) {
            receitaBase *= 1.30;
        }
        if (combo.includes('MULTI') && !isUpgradeOrSidegrade) {
            const temMplay = String(sale.mplay || '').toUpperCase() === 'SIM';
            if (temMplay) {
                let fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_1;
                if (pctAtingimentoMplay >= 160.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_4;
                else if (pctAtingimentoMplay >= 130.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_3;
                else if (pctAtingimentoMplay >= 100.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_2;
                receitaBase *= fatorMulti;
            }
        }
    }

    if (isResidencial) {
        const normP = pBase.replace(/\s/g, '');
        const normSub = sub.replace(/\s/g, '');
        if (normP.includes('TV+APP') || normSub.includes('TV+APP') || normSub === 'APP' || normP.includes('ALACARTE')) {
            return 0;
        }
        if (combo.includes('MULTI') && !isUpgradeOrSidegrade) {
            const temMplay = String(sale.mplay || '').toUpperCase() === 'SIM';
            if (temMplay) {
                let fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_1;
                if (pctAtingimentoMplay >= 160.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_4;
                else if (pctAtingimentoMplay >= 130.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_3;
                else if (pctAtingimentoMplay >= 100.00) fatorMulti = FATORES_ACELERADOR_MULTI.FAIXA_2;
                receitaBase *= fatorMulti;
            }
        }
    }

    if (tipoOp === 'UPGRADE') receitaBase *= 0.50;
    else if (tipoOp === 'SIDEGRADE') receitaBase *= 0.25;

    return Math.max(0, receitaBase);
};

// Cálculo local simétrico por cargo conforme Norma PL-DRH-042
const calcularFatorRVLocal = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    const role = normalizeRoleForRV(metricasExtras.role);
    const pctPos = Number(metricasExtras.pctAtingimentoPos) || 0;
    const pctUr = Number(metricasExtras.pctAtingimentoUr) || 0;
    const pctRec = Number(pctAtingimento) || 0;
    const notaNps = Number(metricasExtras.notaNps) || 0;

    let fator = 0;
    let elegivel = true;
    let bonusSms = 0;
    let bonusGestao = 0;
    let bonusUnitario = 0;
    let bonusPos = 0;
    let bonusFibra = 0;
    let bonusTv = 0;
    let bonusBlPme = 0;
    let bonusTmAcessorio = 0;
    let tetoCargo = 6000.00;

    if (role === 'GERENTE') {
        tetoCargo = 7000.00;
        if (pctRec < 80 || pctPos < 80 || pctUr < 80) elegivel = false;
        else if (pctRec >= 115) fator = 0.03;
        else if (pctRec >= 100) fator = 0.02;
        else fator = 0.01;

        const rvEtapa2 = elegivel ? totalComissao * fator : 0;
        if (elegivel) {
            if (notaNps >= 8) bonusSms = rvEtapa2 * 0.05;
            const pctEleg = Number(metricasExtras.pctVendedoresElegiveis) || 0;
            if (pctEleg >= 100) bonusGestao = 500;
            else if (pctEleg >= 80) bonusGestao = 250;
        }
        const totalBonus = bonusSms + bonusGestao;
        const previaBruta = rvEtapa2 + totalBonus;
        return {
            fatorAplicado: fator,
            rvEtapa2,
            bonusSms,
            bonusGestao,
            bonusUnitario: bonusGestao,
            totalBonus,
            tetoCargo,
            atingiuTeto: previaBruta > tetoCargo,
            elegivel,
            previaPagamento: Math.min(Math.max(0, previaBruta), tetoCargo)
        };
    }

    if (role === 'SENIOR') {
        tetoCargo = 6000.00;
        if (pctRec < 80 || pctPos < 80 || pctUr < 80) elegivel = false;
        else if (pctRec >= 115) fator = 0.02;
        else if (pctRec >= 100) fator = 0.015;
        else fator = 0.01;

        const rvEtapa2 = elegivel ? totalComissao * fator : 0;
        if (elegivel && notaNps >= 8) bonusSms = rvEtapa2 * 0.05;
        const previaBruta = rvEtapa2 + bonusSms;
        return {
            fatorAplicado: fator,
            rvEtapa2,
            bonusSms,
            bonusGestao: 0,
            bonusUnitario: 0,
            totalBonus: bonusSms,
            tetoCargo,
            atingiuTeto: previaBruta > tetoCargo,
            elegivel,
            previaPagamento: Math.min(Math.max(0, previaBruta), tetoCargo)
        };
    }

    if (role === 'ASSISTENTE RELACIONAMENTO') {
        tetoCargo = 4000.00;
        if (pctRec < 80 || pctPos < 80 || pctUr < 80) elegivel = false;
        else if (pctRec >= 115) fator = 0.015;
        else if (pctRec >= 100) fator = 0.012;
        else fator = 0.0075;

        const rvEtapa2 = elegivel ? totalComissao * fator : 0;
        if (elegivel && notaNps >= 8) bonusSms = rvEtapa2 * 0.05;
        const previaBruta = rvEtapa2 + bonusSms;
        return {
            fatorAplicado: fator,
            rvEtapa2,
            bonusSms,
            bonusGestao: 0,
            bonusUnitario: 0,
            totalBonus: bonusSms,
            tetoCargo,
            atingiuTeto: previaBruta > tetoCargo,
            elegivel,
            previaPagamento: Math.min(Math.max(0, previaBruta), tetoCargo)
        };
    }

    if (role === 'ADMINISTRAÇÃO') {
        tetoCargo = 2000.00;
        if (pctRec < 80 || pctPos < 80 || pctUr < 80) elegivel = false;
        else if (pctRec >= 115) fator = 0.015;
        else if (pctRec >= 100) fator = 0.01;
        else fator = 0.005;

        const rvEtapa2 = elegivel ? totalComissao * fator : 0;
        if (elegivel && notaNps >= 8) bonusSms = rvEtapa2 * 0.05;
        const previaBruta = rvEtapa2 + bonusSms;
        return {
            fatorAplicado: fator,
            rvEtapa2,
            bonusSms,
            bonusGestao: 0,
            bonusUnitario: 0,
            totalBonus: bonusSms,
            tetoCargo,
            atingiuTeto: previaBruta > tetoCargo,
            elegivel,
            previaPagamento: Math.min(Math.max(0, previaBruta), tetoCargo)
        };
    }

    if (role === 'GEEK') {
        tetoCargo = 6000.00;
        const pctAces = Number(metricasExtras.pctAtingimentoAcessorio) || 0;
        const pctApa = Number(metricasExtras.pctAtingimentoAparelho) || 0;
        if (pctPos < 80 || pctAces < 80 || pctApa < 80) {
            elegivel = false;
            fator = 0;
        } else {
            if (pctRec >= 115) fator = 0.02;
            else if (pctRec >= 100) fator = 0.015;
            else if (pctRec >= 80) fator = 0.01;
            else fator = 0;
        }

        const rvEtapa2 = elegivel ? totalComissao * fator : 0;
        if (elegivel) {
            const pctBlPme = Number(metricasExtras.pctAtingimentoBlPme) || 0;
            if (pctBlPme >= 130) bonusBlPme = 300;
            else if (pctBlPme >= 100) bonusBlPme = 200;

            const pctTmAces = Number(metricasExtras.pctAtingimentoTmAcessorio) || 0;
            if (pctAces >= 100 && pctTmAces >= 100) bonusTmAcessorio = 235;
        }
        const totalBonus = bonusBlPme + bonusTmAcessorio;
        const previaBruta = rvEtapa2 + totalBonus;
        return {
            fatorAplicado: fator,
            rvEtapa2,
            bonusSms: 0,
            bonusGestao: 0,
            bonusBlPme,
            bonusTmAcessorio,
            bonusUnitario: totalBonus,
            totalBonus,
            tetoCargo,
            atingiuTeto: previaBruta > tetoCargo,
            elegivel,
            previaPagamento: Math.min(Math.max(0, previaBruta), tetoCargo)
        };
    }

    // VENDEDOR (Grupo VIII • Anexo IX)
    tetoCargo = 6000.00;
    if (pctRec < 80 || pctPos < 80 || pctUr < 80) elegivel = false;
    else if (pctRec >= 150) fator = 0.11;
    else if (pctRec >= 120) fator = 0.09;
    else if (pctRec >= 100) fator = 0.07;
    else fator = 0.045;

    const rvEtapa2 = elegivel ? totalComissao * fator : 0;
    const calcExcedente = (vol, meta) => {
        const v = Number(vol) || 0;
        const m = Number(meta) || 0;
        if (m <= 0 || v <= m) return 0;
        const pct = (v / m) * 100;
        const exc = v - m;
        if (pct >= 115) return exc * 15;
        if (pct >= 100) return exc * 10;
        return 0;
    };

    if (elegivel) {
        if (notaNps >= 8) bonusSms = rvEtapa2 * 0.05;
        bonusPos = calcExcedente(metricasExtras.volPosPago, metricasExtras.metaPosPago);
        bonusFibra = calcExcedente(metricasExtras.volFibra, metricasExtras.metaFibra);
        bonusTv = calcExcedente(metricasExtras.volTv, metricasExtras.metaTv);
        bonusUnitario = bonusPos + bonusFibra + bonusTv;
    }

    const totalBonus = bonusSms + bonusUnitario;
    const previaBruta = rvEtapa2 + totalBonus;
    return {
        fatorAplicado: fator,
        rvEtapa2,
        bonusSms,
        bonusGestao: 0,
        bonusUnitario,
        bonusPos,
        bonusFibra,
        bonusTv,
        totalBonus,
        tetoCargo,
        atingiuTeto: previaBruta > tetoCargo,
        elegivel,
        previaPagamento: Math.min(Math.max(0, previaBruta), tetoCargo)
    };
};

/**
 * Abre e dimensiona em nova guia um documento PDF oficial A4 pronto para impressão/salvamento
 */
const abrirDocumentoPDFNorma = (roleKey, sellerName) => {
    const regra = REGRAS_CARGOS_NORMA[roleKey] || REGRAS_CARGOS_NORMA['VENDEDOR'];
    const win = window.open('', '_blank');
    if (!win) return;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Norma PL-DRH-042 - Regras de Remuneração Variável (${regra.titulo})</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
  body { margin: 0; padding: 24px; color: #171717; background: #f5f5f5; }
  .sheet { max-width: 900px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border-top: 6px solid #E3000F; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e5e5; padding-bottom: 16px; margin-bottom: 20px; }
  .badge { display: inline-block; background: #fee2e2; color: #E3000F; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  h1 { margin: 6px 0 4px 0; font-size: 20px; color: #111; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.6px; color: #E3000F; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-top: 22px; }
  .meta-info { font-size: 12px; color: #555; }
  .highlight-box { background: #fff8f8; border: 1px solid #fecaca; border-left: 4px solid #E3000F; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px; }
  .highlight-box h3 { margin: 0 0 8px 0; font-size: 15px; color: #b91c1c; }
  .highlight-box ul { margin: 6px 0 0 0; padding-left: 18px; font-size: 12.5px; line-height: 1.55; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11.5px; }
  th, td { border: 1px solid #e5e5e5; padding: 8px 10px; text-align: left; }
  th { background: #171717; color: #fff; font-weight: 700; text-transform: uppercase; font-size: 10.5px; }
  tr.active-row { background: #fef2f2; font-weight: 700; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
  .card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 10px 12px; font-size: 11.5px; line-height: 1.45; }
  .card strong { color: #111; display: block; margin-bottom: 3px; }
  .print-bar { display: flex; justify-content: flex-end; gap: 10px; max-width: 900px; margin: 0 auto 14px auto; }
  .btn { background: #E3000F; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 12px; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; padding: 0; max-width: 100%; }
    .print-bar { display: none; }
  }
</style>
</head>
<body>
  <div class="print-bar">
    <button class="btn" onclick="window.print()">🖨️ Imprimir / Salvar como PDF</button>
  </div>
  <div class="sheet">
    <div class="header">
      <div>
        <span class="badge">FONTE OFICIAL • NORMA PL-DRH-042 (ANEXO I - G, REV. 08 — 23/02/2026)</span>
        <h1>Política de Remuneração Variável (Fator RV)</h1>
        <div class="meta-info">Colaborador(a): <strong>${sellerName || 'Simulação'}</strong> • Enquadramento Ativo: <strong>${regra.titulo} (${regra.grupoAnexo})</strong></div>
      </div>
      <div style="text-align:right; font-size:11px; color:#666;">
        <strong>WorkFlow Gestão Telecom</strong><br/>
        Documento Dimensionado por Cargo
      </div>
    </div>

    <div class="highlight-box">
      <h3>📌 Regra Específica do Seu Cargo: ${regra.titulo} — ${regra.grupoAnexo}</h3>
      <div style="font-size:12px; margin-bottom:6px;"><strong>Base de Apuração:</strong> ${regra.baseApuracao} | <strong>Teto Monetário:</strong> R$ ${regra.teto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
      <ul>
        ${regra.etapasDetalhadas.map(e => `<li>${e}</li>`).join('')}
      </ul>
    </div>

    <h2>Visão Geral Comparativa por Cargo (PL-DRH-042)</h2>
    <table>
      <thead>
        <tr>
          <th>Cargo</th>
          <th>Grupo / Anexo</th>
          <th>Base</th>
          <th>Gatilhos (Mín. 80%)</th>
          <th>Faixas % Receita</th>
          <th>Bônus</th>
          <th>Teto RV</th>
        </tr>
      </thead>
      <tbody>
        <tr class="${roleKey === 'ASSISTENTE RELACIONAMENTO' ? 'active-row' : ''}">
          <td>Assistente de Relacionamentos</td>
          <td>Grupo VII (Anexo VIII)</td>
          <td>Loja alocada</td>
          <td>Gross Pós, Receita, Residencial</td>
          <td>0,75% / 1,20% / 1,50%</td>
          <td>SMS ≥ 8 (+5%)</td>
          <td>R$ 4.000,00</td>
        </tr>
        <tr class="${roleKey === 'GERENTE' ? 'active-row' : ''}">
          <td>Gerente de Loja</td>
          <td>Grupo II (Anexo III)</td>
          <td>Lojas sob gestão</td>
          <td>Gross Pós, Receita, Residencial</td>
          <td>1,00% / 2,00% / 3,00%</td>
          <td>SMS ≥ 8 (+5%) + Gestão (R$ 250 / R$ 500)</td>
          <td>R$ 7.000,00</td>
        </tr>
        <tr class="${roleKey === 'SENIOR' ? 'active-row' : ''}">
          <td>Vendedor Sênior</td>
          <td>Grupo III (Anexo IV)</td>
          <td>Loja alocada</td>
          <td>Gross Pós, Receita, Residencial</td>
          <td>1,00% / 1,50% / 2,00%</td>
          <td>SMS ≥ 8 (+5%)</td>
          <td>R$ 6.000,00</td>
        </tr>
        <tr class="${roleKey === 'VENDEDOR' ? 'active-row' : ''}">
          <td>Vendedor</td>
          <td>Grupo VIII (Anexo IX)</td>
          <td>Individual</td>
          <td>Gross Pós, Receita, Residencial</td>
          <td>4,50% / 7,00% / 9,00% / 11,00%</td>
          <td>SMS ≥ 8 (+5%) + Unitário (R$ 10 / R$ 15)</td>
          <td>R$ 6.000,00</td>
        </tr>
        <tr class="${roleKey === 'GEEK' ? 'active-row' : ''}">
          <td>Assistente Tecnológico (Geek)</td>
          <td>Grupo IV (Anexo V)</td>
          <td>Loja alocada</td>
          <td>Gross Pós, Acessório, Aparelho</td>
          <td>1,00% / 1,50% / 2,00%</td>
          <td>Virtua PME (R$ 200 / R$ 300) + TM Acess. (R$ 235)</td>
          <td>R$ 6.000,00</td>
        </tr>
        <tr class="${roleKey === 'ADMINISTRAÇÃO' ? 'active-row' : ''}">
          <td>ADM (Assistente Administrativo)</td>
          <td>Grupo V (Anexo VI)</td>
          <td>Loja alocada</td>
          <td>Gross Pós, Receita, Residencial</td>
          <td>0,50% / 1,00% / 1,50%</td>
          <td>SMS ≥ 8 (+5%)</td>
          <td>R$ 2.000,00</td>
        </tr>
      </tbody>
    </table>

    <h2>Regras de Apuração por Serviço e Equivalência na Base (Anexo I)</h2>
    <div class="grid-2">
      <div class="card">
        <strong>📱 Móvel (Pós, Controle, Flex, Dependente) & Portabilidade</strong>
        Portabilidade recebe <b>+30%</b> sobre a Tabela de Referência. Dependente gratuito conta 1 no Gross quantitativo, mas R$ 0,00 na receita. Claro Flex Cartão conta 1 Gross e 100% da tabela; Recarga Flex compõe 40% na receita. PME Móvel (POS PME) soma na Receita Consumo e PME.
      </div>
      <div class="card">
        <strong>⚡ Fator Claro Multi (Móvel + Residencial / M-Play)</strong>
        Multiplicador sobre vendas novas no contrato Multi: <b>1,2x</b> (0%–99,99%), <b>1,4x</b> (100%–129,99%), <b>1,6x</b> (130%–159,99%) e <b>1,8x</b> (≥ 160%). No Single ou sem M-Play, o fator é 1,0x.
      </div>
      <div class="card">
        <strong>🏠 Residencial (Banda Larga Fixa = FIBRA | TV | Fixo)</strong>
        Banda Larga Fixa ("Virtua") corresponde a <b>FIBRA / FIBRA PME</b> na base. TV Ponto Principal corresponde a <b>TVBOX / TV CABO / SOUNDBOX</b>. Telefone Fixo (<b>FIXO</b>) e Smarthome (<b>MESH</b>) compõem a Receita monetária.
      </div>
      <div class="card">
        <strong>📲 Aparelhos, Acessórios, Películas & Seguro</strong>
        Venda/Troca de Aparelho: <b>5,00%</b> do valor (<b>6,00%</b> quando com Seguro Proteção Móvel). Seguro avulso: <b>40,00%</b> da 1ª parcela. Acessórios e Películas: <b>15,00%</b> do valor da NF. Movimentações: Upgrade = <b>50%</b>, Sidegrade = <b>25%</b>, Downgrade = <b>0%</b>.
      </div>
    </div>
  </div>
</body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
};

export const FatorRvv = ({ globalUser, salesData = [], goalsDB = {}, usersDB = {}, globalMonth }) => {
    const userRole = String(globalUser?.role || 'VENDEDOR').toUpperCase();
    const normalizedLoggedRole = normalizeRoleForRV(userRole);
    const canChangeSeller = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'ADM', 'COORDENADOR', 'ESPECIALISTA', 'GEEK'].includes(userRole);
    const loggedName = String(globalUser?.name || '');

    // Estados de simulação complementar e modal FONTE (PDF de Regras)
    const [simularSms8, setSimularSms8] = useState(false);
    const [showFonteModal, setShowFonteModal] = useState(false);
    const [fonteTab, setFonteTab] = useState('MEU_CARGO'); // 'MEU_CARGO' | 'COMPARATIVO' | 'SERVICOS'

    // Listagem de vendedores ativos para rateio de metas individuais
    const safeVendedores = useMemo(() => {
        return Object.values(usersDB || {})
            .filter(u => !u?.role || normalizeRoleForRV(u.role) === 'VENDEDOR')
            .map(u => String(u?.name || ''))
            .filter(Boolean);
    }, [usersDB]);

    const allUsers = useMemo(() => {
        return Object.values(usersDB || {})
            .filter(u => u?.role !== 'SUSPENDER')
            .map(u => String(u?.name || ''))
            .filter(Boolean);
    }, [usersDB]);
        
    const historicalUsers = useMemo(() => {
        return (salesData || []).map(s => String(s.vendedor || '')).filter(Boolean);
    }, [salesData]);

    const uniqueSelectableUsers = useMemo(() => {
        const base = [...new Set([...allUsers, ...historicalUsers, loggedName])].filter(Boolean);
        return base.sort();
    }, [allUsers, historicalUsers, loggedName]);

    const [selectedSeller, setSelectedSeller] = useState(loggedName);
    const [metrics, setMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!canChangeSeller && loggedName) {
            setSelectedSeller(loggedName);
        } else if (!selectedSeller && loggedName) {
            setSelectedSeller(loggedName);
        }
    }, [canChangeSeller, loggedName, selectedSeller]);

    useEffect(() => {
        const targetSeller = canChangeSeller ? (selectedSeller || loggedName) : loggedName;
        if (!targetSeller) {
            setMetrics(null);
            return;
        }

        let isMounted = true;

        const fetchData = async () => {
            setIsLoading(true);
            
            const selectedUserObj = Object.values(usersDB || {}).find(
                u => String(u?.name || '').trim().toUpperCase() === String(targetSeller).trim().toUpperCase()
            );
            const rawSelectedRole = selectedUserObj?.role || (targetSeller === loggedName ? userRole : 'VENDEDOR');
            const selectedUserRole = normalizeRoleForRV(rawSelectedRole);
            const isStoreLevelRole = ['GERENTE', 'SENIOR', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO', 'GEEK'].includes(selectedUserRole);

            const activeMetas = (goalsDB || {})[globalMonth] || METAS_PADRAO || {};
            const numSellers = Math.max(1, safeVendedores.length || 1);
            const divisor = isStoreLevelRole ? 1 : numSellers;

            // 1. Filtra vendas do mês
            const monthSales = (salesData || []).filter(s => {
                if (typeof s.data !== 'string') return false;
                if (s.data.includes('/')) {
                    const parts = s.data.split('/');
                    if (parts.length === 3) return `${parts[2]}-${parts[1]}` === globalMonth;
                }
                if (s.data.includes('-')) return s.data.slice(0, 7) === globalMonth;
                return false;
            });

            // 2. Filtra vendas conforme a base do cargo (Loja vs Individual)
            const sellerSales = isStoreLevelRole 
                ? monthSales 
                : monthSales.filter(s => String(s.vendedor || '').trim().toUpperCase() === String(targetSeller).trim().toUpperCase());

            let volMplay = 0;
            sellerSales.forEach(s => {
                if (String(s.mplay || '').toUpperCase() === 'SIM') volMplay += 1;
            });

            const metaReceita = (Number(activeMetas.receita) || 0) / divisor;
            const metaMplay = Math.ceil((Number(activeMetas.mplay) || 0) / divisor);

            // 3. Fator Claro Multi (M-Play)
            const pctAtingimentoMplay = metaMplay > 0 ? (volMplay / metaMplay) * 100 : (volMplay > 0 ? 100 : 0);

            let fatorMultiplicador = 1.2;
            if (pctAtingimentoMplay >= 160.00) fatorMultiplicador = 1.8;
            else if (pctAtingimentoMplay >= 130.00) fatorMultiplicador = 1.6;
            else if (pctAtingimentoMplay >= 100.00) fatorMultiplicador = 1.4;

            let totalReceita = 0;
            let totalVendas = sellerSales.length;
            let totalPos = 0;
            let totalUr = 0;
            let volPosPago = 0;
            let volFibra = 0;
            let volTv = 0;
            let volPortabilidade = 0;
            let volMulti = 0;
            let volPme = 0;
            let volAparelho = 0;
            let volSeguro = 0;
            let volAcessorio = 0;
            let receitaAcessorio = 0;
            let volBlPme = 0;

            let resultados = [];
            let receitaExtraMplay = 0;

            try {
                const resProdRaw = await authFetch(`${API_URL}/api/calcular/fator-rv/resultados`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sellerSales, pctAtingimentoMplay })
                });

                if (resProdRaw.ok) {
                    const resProd = await resProdRaw.json();
                    resultados = resProd.resultados || [];
                    receitaExtraMplay = resProd.receitaExtraMplay || 0;
                } else {
                    throw new Error("Fallback local");
                }
            } catch (err) {
                resultados = sellerSales.map(sale => {
                    const rCom = calcularReceitaProdutoLocal(sale, pctAtingimentoMplay);
                    const rSem = calcularReceitaProdutoLocal(sale, 0);
                    receitaExtraMplay += (rCom - rSem);
                    return { id: sale.id, receitaBase: rCom };
                });
            }

            let totalComissao = 0;
            let comissaoAparelho = 0;
            let comissaoSeguro = 0;
            let comissaoAcessorio = 0;

            sellerSales.forEach((sale) => {
                const resApi = (resultados || []).find(r => r.id === sale.id);
                const receitaBase = resApi ? resApi.receitaBase : calcularReceitaProdutoLocal(sale, pctAtingimentoMplay);

                const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase().trim();
                const sub = String(sale.subOption || sale.subtipo || '').toUpperCase().trim();
                const tipoOp = String(sale.tipoOperacao || sale.operacao || '').toUpperCase().trim();
                const q = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);
                const combo = String(sale.combo || '').toUpperCase();
                const port = String(sale.portabilidade || '').toUpperCase();

                if (tipoOp === 'DOWNGRADE') return;
                const isUpgradeOrSidegrade = (tipoOp === 'UPGRADE' || tipoOp === 'SIDEGRADE');

                if (port === 'SIM' && !isUpgradeOrSidegrade) volPortabilidade += q;
                if (combo.includes('MULTI')) volMulti += q;
                if (pBase.includes('PME')) volPme += q;

                if (pBase.includes('APARELHO')) {
                    volAparelho += q;
                    comissaoAparelho += receitaBase;
                }
                if (pBase.includes('SEGURO')) {
                    volSeguro += q;
                    comissaoSeguro += receitaBase;
                }

                // Acessórios (inclui Películas na base)
                if (pBase.includes('ACESSORIO') || pBase.includes('ACESSÓRIO') || pBase.includes('PELICULA') || pBase.includes('PELÍCULA')) {
                    volAcessorio += q;
                    receitaAcessorio += Number(sale.valorBruto !== undefined ? sale.valorBruto : sale.receita) || 0;
                    comissaoAcessorio += receitaBase;
                }

                // Banda Larga Fixa (Virtua) PME = FIBRA PME na nossa base
                if (pBase.includes('FIBRA PME') || pBase.includes('UR PME') || pBase.includes('BL PME') || pBase.includes('VIRTUA PME')) {
                    volBlPme += q;
                }

                // Gross Pós-Pago Consumo (Quantitativo): Conta Titular/Dep, Controle, Flex PF, BL Móvel (exclui PME e upgrades/sidegrades)
                const isGrossPosConsumo = (
                    (pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('CONTROLE') || pBase.includes('FLEX') || pBase.includes('DEPENDENTE') || pBase.includes('DEP') || ((pBase.includes('BANDA LARGA') || pBase === 'BL') && !pBase.includes('RESIDENCIAL') && !pBase.includes('FIXA'))) &&
                    !pBase.includes('PME') &&
                    !isUpgradeOrSidegrade &&
                    !(pBase.includes('FLEX') && sub.includes('RECARGA'))
                );
                if (isGrossPosConsumo) {
                    totalPos += q;
                }

                // Pós-Pago Titular (Conta ou Controle) para Bônus Unitário de Vendedor
                const isPosTitularOuControle = (
                    (pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('CONTROLE')) &&
                    !pBase.includes('PME') &&
                    !pBase.includes('DEP') &&
                    !isUpgradeOrSidegrade
                );
                if (isPosTitularOuControle) {
                    volPosPago += q;
                }

                // Banda Larga Fixa ("Virtua") = FIBRA e FIBRA PME na nossa base
                const isBandaLargaFixa = (
                    (pBase.includes('FIBRA') || pBase.includes('VIRTUA') || pBase.includes('BANDA LARGA FIXA') || pBase.includes('BANDA LARGA RESIDENCIAL')) &&
                    !isUpgradeOrSidegrade
                );
                if (isBandaLargaFixa) {
                    volFibra += q;
                }

                // TV Ponto Principal = TVBOX, TV-BOX, TV CABO, SOUNDBOX (exclui Ponto Adicional e TV+APP)
                const isTvPrincipal = (
                    (pBase.includes('TV') || pBase.includes('SOUNDBOX')) &&
                    !pBase.includes('PONTO ADICIONAL') &&
                    !pBase.replace(/\s/g, '').includes('TV+APP') &&
                    sub !== 'APP' &&
                    !isUpgradeOrSidegrade
                );
                if (isTvPrincipal) {
                    volTv += q;
                }

                // Produtos Residenciais Consumo e PME (Quantitativo): Banda Larga Fixa (Fibra) + TV Ponto Principal
                if (isBandaLargaFixa || isTvPrincipal) {
                    totalUr += q;
                }

                totalReceita += Number(sale.valorBruto !== undefined ? sale.valorBruto : sale.receita) || 0;
                totalComissao += receitaBase;
            });

            const metaPos = (Number(activeMetas.posTotal) || 0) / divisor;
            const metaUr = (Number(activeMetas.urTotal) || (Number(activeMetas.fibra || 0) + Number(activeMetas.tv || 0))) / divisor;
            
            // Para Bônus Unitário de Vendedor (Pós Titular Conta/Controle, Fibra, TV)
            const rawMetaPosTitular = Number(activeMetas.posPago || 0) + Number(activeMetas.controle || 0);
            const metaPosPago = Math.ceil((rawMetaPosTitular > 0 ? rawMetaPosTitular : Number(activeMetas.posTotal || 0)) / divisor);
            const metaFibra = Math.ceil((Number(activeMetas.fibra) || 0) / divisor);
            const metaTv = Math.ceil((Number(activeMetas.tv) || 0) / divisor);

            const metaAparelho = Math.ceil((Number(activeMetas.aparelho) || 0) / divisor);
            const metaAcessorio = Math.ceil(((Number(activeMetas.acessorio) || 0) + (Number(activeMetas.pelicula) || 0)) / divisor);
            const metaTmAcessorio = Number(activeMetas.tmAcessorio) || 120;
            const metaBlPme = Math.ceil((Number(activeMetas.blPme) || 1) / divisor);

            const pctAtingimento = metaReceita > 0 ? (totalComissao / metaReceita) * 100 : 0;
            const pctAtingimentoPos = metaPos > 0 ? (totalPos / metaPos) * 100 : 0;
            const pctAtingimentoUr = metaUr > 0 ? (totalUr / metaUr) * 100 : 0;

            const pctAtingimentoAparelho = metaAparelho > 0 ? (volAparelho / metaAparelho) * 100 : (volAparelho > 0 ? 100 : 0);
            const pctAtingimentoAcessorio = metaAcessorio > 0 ? (volAcessorio / metaAcessorio) * 100 : (volAcessorio > 0 ? 100 : 0);
            const tmAcessorio = volAcessorio > 0 ? (receitaAcessorio / volAcessorio) : 0;
            const pctAtingimentoTmAcessorio = metaTmAcessorio > 0 ? (tmAcessorio / metaTmAcessorio) * 100 : (tmAcessorio > 0 ? 100 : 0);
            const pctAtingimentoBlPme = metaBlPme > 0 ? (volBlPme / metaBlPme) * 100 : (volBlPme > 0 ? 100 : 0);

            // Cálculo automático do % de vendedores elegíveis na loja (para Bônus Gestão do Gerente)
            let vendedoresElegiveisCount = 0;
            if (safeVendedores.length > 0) {
                const mRecInd = (Number(activeMetas.receita) || 0) / numSellers;
                const mPosInd = (Number(activeMetas.posTotal) || 0) / numSellers;
                const mUrInd = (Number(activeMetas.urTotal) || (Number(activeMetas.fibra || 0) + Number(activeMetas.tv || 0))) / numSellers;

                safeVendedores.forEach(vName => {
                    const vSales = monthSales.filter(s => String(s.vendedor || '').trim().toUpperCase() === vName.trim().toUpperCase());
                    let vRec = 0, vPos = 0, vUr = 0;
                    vSales.forEach(s => {
                        const p = String(s.produtoBase || s.produto || '').toUpperCase();
                        const op = String(s.tipoOperacao || s.operacao || '').toUpperCase();
                        const q = Number(s.qtda) || 1;
                        if (op === 'DOWNGRADE') return;
                        const isUpSide = op === 'UPGRADE' || op === 'SIDEGRADE';
                        vRec += calcularReceitaProdutoLocal(s, pctAtingimentoMplay);
                        if ((p.includes('POS') || p.includes('PÓS') || p.includes('CONTROLE') || p.includes('FLEX') || p.includes('DEP') || p === 'BL') && !p.includes('PME') && !isUpSide) {
                            vPos += q;
                        }
                        if ((p.includes('FIBRA') || p.includes('VIRTUA') || ((p.includes('TV') || p.includes('SOUNDBOX')) && !p.includes('PONTO ADICIONAL'))) && !isUpSide) {
                            vUr += q;
                        }
                    });
                    const okRec = mRecInd > 0 ? (vRec / mRecInd) * 100 >= 80 : false;
                    const okPos = mPosInd > 0 ? (vPos / mPosInd) * 100 >= 80 : false;
                    const okUr = mUrInd > 0 ? (vUr / mUrInd) * 100 >= 80 : false;
                    if (okRec && okPos && okUr) vendedoresElegiveisCount++;
                });
            }
            const pctVendedoresElegiveis = safeVendedores.length > 0 ? (vendedoresElegiveisCount / safeVendedores.length) * 100 : 0;

            const metricasExtras = {
                totalVendas,
                pctAtingimentoPos,
                pctAtingimentoUr,
                notaNps: simularSms8 ? 8.5 : 0,
                pctVendedoresElegiveis,
                volPosPago,
                metaPosPago,
                volFibra,
                metaFibra,
                volTv,
                metaTv,
                pctAtingimentoAparelho,
                pctAtingimentoAcessorio,
                pctAtingimentoTmAcessorio,
                pctAtingimentoBlPme,
                role: selectedUserRole,
                totalReceita,
                comissaoAparelho,
                comissaoSeguro,
                receitaAcessorio,
                metaReceita
            };

            let resultRV = {};
            try {
                const resRVRaw = await authFetch(`${API_URL}/api/calcular/fator-rv/calcular`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pctAtingimento, totalComissao, metricasExtras })
                });
                if (resRVRaw.ok) {
                    const resRV = await resRVRaw.json();
                    resultRV = resRV.resultRV || {};
                } else {
                    throw new Error("Fallback local");
                }
            } catch (err) {
                resultRV = calcularFatorRVLocal(pctAtingimento, totalComissao, metricasExtras);
            }

            if (isMounted) {
                const regraCargo = REGRAS_CARGOS_NORMA[selectedUserRole] || REGRAS_CARGOS_NORMA['VENDEDOR'];
                setMetrics({
                    totalReceita, totalComissao, totalVendas, totalPos, totalUr,
                    metaReceita, metaPos, metaUr, pctAtingimento, pctAtingimentoPos, pctAtingimentoUr,
                    pctAtingimentoMplay, volMplay, metaMplay, receitaExtraMplay,
                    previaPagamento: resultRV.previaPagamento ?? 0,
                    rvEtapa2: resultRV.rvEtapa2 ?? ((totalComissao || 0) * (resultRV.fatorAplicado || 0)),
                    fatorSimulado: resultRV.fatorAplicado ?? 0,
                    elegivel: resultRV.elegivel ?? false,
                    bonusUnitario: resultRV.bonusUnitario ?? 0,
                    bonusSms: resultRV.bonusSms ?? 0,
                    bonusGestao: resultRV.bonusGestao ?? 0,
                    bonusBlPme: resultRV.bonusBlPme ?? 0,
                    bonusTmAcessorio: resultRV.bonusTmAcessorio ?? 0,
                    totalBonus: resultRV.totalBonus ?? ((resultRV.bonusSms || 0) + (resultRV.bonusUnitario || 0)),
                    tetoCargo: resultRV.tetoCargo ?? regraCargo.teto,
                    atingiuTeto: resultRV.atingiuTeto ?? false,
                    fatorMultiplicador, volPortabilidade, volMulti, volPme,
                    volPosPago, metaPosPago, volFibra, metaFibra, volTv, metaTv,
                    volAparelho, metaAparelho, comissaoAparelho, volSeguro, comissaoSeguro,
                    pctAtingimentoAparelho, pctAtingimentoAcessorio, pctAtingimentoTmAcessorio, pctAtingimentoBlPme,
                    volAcessorio, metaAcessorio, receitaAcessorio, comissaoAcessorio, tmAcessorio, metaTmAcessorio,
                    volBlPme, metaBlPme,
                    vendedoresElegiveisCount, totalVendedoresLoja: safeVendedores.length, pctVendedoresElegiveis,
                    isStoreLevelRole, selectedUserRole, regraCargo,
                    targetSeller
                });
                setIsLoading(false);
            }
        };

        fetchData();
        
        return () => {
            isMounted = false;
        };
    }, [salesData, selectedSeller, globalMonth, goalsDB, safeVendedores, canChangeSeller, loggedName, userRole, simularSms8, usersDB]);

    if (userRole === 'JOVEM APRENDIZ') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm animate-fade-in text-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 mb-4 border border-neutral-200 dark:border-neutral-700">
                    <Lock size={28} className="text-[#E3000F]" />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">Módulo Restrito</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                    O perfil de Jovem Aprendiz não possui apuração de Remuneração Variável (Fator RV) parametrizada no sistema.
                </p>
            </div>
        );
    }

    const activeRoleKey = metrics?.selectedUserRole || normalizedLoggedRole;
    const activeRegra = REGRAS_CARGOS_NORMA[activeRoleKey] || REGRAS_CARGOS_NORMA['VENDEDOR'];

    return (
        <div className="h-full flex flex-col animate-fade-in transition-colors space-y-4">
            {/* CABEÇALHO PRINCIPAL */}
            <div className="p-5 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#E3000F]/10 dark:bg-[#E3000F]/20 flex items-center justify-center text-[#E3000F] border border-[#E3000F]/20 shrink-0">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                                Painel Fator RV
                            </h2>
                            <span className="text-[11px] font-bold bg-[#E3000F]/10 text-[#E3000F] dark:bg-[#E3000F]/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider border border-[#E3000F]/20">
                                PRÉVIA
                            </span>
                            <span className="text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2.5 py-0.5 rounded-md uppercase tracking-wider border border-neutral-200 dark:border-neutral-700">
                                {activeRegra.titulo} • {activeRegra.grupoAnexo}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-semibold uppercase tracking-wide">
                            SIMULADOR DE COMISSIONAMENTO , NÃO VALIDO PARA RECEBIMENTO , SOMENTE PARA ESTIMATIVA
                        </p>
                    </div>
                </div>
                
                {/* BARRA DE AÇÕES: CAMPO "FONTE" (PDF DE REGRAS) + SELETOR DE COLABORADOR */}
                <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* CAMPO "FONTE" -> DIMENSIONA PARA O PDF DE REGRAS DA REMUNERAÇÃO */}
                    <button
                        type="button"
                        onClick={() => {
                            setFonteTab('MEU_CARGO');
                            setShowFonteModal(true);
                        }}
                        className="flex items-center justify-between sm:justify-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#E3000F]/10 via-red-500/5 to-[#E3000F]/10 hover:from-[#E3000F] hover:to-red-700 text-[#E3000F] hover:text-white border border-[#E3000F]/30 transition-all shadow-sm cursor-pointer group"
                        title="Abrir Fonte Oficial e PDF de Regras da sua Remuneração (Norma PL-DRH-042)"
                    >
                        <div className="flex items-center gap-2">
                            <FileText size={17} className="shrink-0" />
                            <div className="text-left">
                                <span className="text-[9.5px] font-black uppercase tracking-widest block opacity-80">
                                    FONTE OFICIAL (PDF)
                                </span>
                                <span className="text-xs font-extrabold whitespace-nowrap">
                                    Norma PL-DRH-042 • {activeRoleKey}
                                </span>
                            </div>
                        </div>
                        <ExternalLink size={14} className="opacity-75 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>

                    {canChangeSeller ? (
                        <div className="flex items-center gap-2.5 bg-neutral-50 dark:bg-neutral-800/60 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700/80 shadow-inner">
                            <User size={16} className="text-[#E3000F] shrink-0" />
                            <div className="flex flex-col flex-1">
                                <span className="text-[10px] font-bold uppercase text-neutral-400 dark:text-neutral-400 tracking-wider">
                                    Colaborador / Cargo
                                </span>
                                <select 
                                    value={selectedSeller} 
                                    onChange={(e) => setSelectedSeller(e.target.value)}
                                    className="bg-transparent text-sm font-semibold text-neutral-800 dark:text-neutral-100 outline-none pr-3 cursor-pointer w-full md:min-w-[200px]"
                                >
                                    {uniqueSelectableUsers.map(v => {
                                        const usrObj = Object.values(usersDB || {}).find(u => String(u?.name || '') === v);
                                        const roleLabel = usrObj?.role ? ` (${usrObj.role})` : ' (VENDEDOR)';
                                        return (
                                            <option key={v} value={v} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">
                                                {v}{roleLabel}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <ChevronDown size={14} className="text-neutral-400 shrink-0 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2.5 bg-neutral-50 dark:bg-neutral-800/60 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <ShieldCheck size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase text-neutral-400 dark:text-neutral-400 tracking-wider flex items-center gap-1">
                                    <Lock size={10} className="text-[#E3000F]" /> {activeRoleKey}
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100">
                                    {loggedName || 'Colaborador'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CORPO DO DASHBOARD */}
            <div className="flex-1 overflow-auto">
                {isLoading || !metrics ? (
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 min-h-[400px] flex items-center justify-center">
                        <WFLogoLoader
                            size="md"
                            text="Calculando Fator RV..."
                            subtext="Processando pontuação de metas, aceleradores e comissão por cargo..."
                        />
                    </div>
                ) : (
                    <div className="space-y-5 pb-6">
                        {/* BARRA DE INFORMAÇÃO DE NORMA + SIMULADOR DE PESQUISA SMS >= 8 */}
                        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/90 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <AlertTriangle size={18} />
                                </div>
                                <div className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                                    <strong className="text-neutral-900 dark:text-neutral-100 font-bold block mb-0.5">
                                        Enquadramento Ativo: {activeRegra.titulo} — {activeRegra.grupoAnexo}
                                    </strong>
                                    Base de Apuração: <strong>{activeRegra.baseApuracao}</strong> • Teto Monetário do Cargo: <strong>{applyCurrencyMask(activeRegra.teto)}</strong>.
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                                {activeRegra.temBonusSms && (
                                    <button
                                        type="button"
                                        onClick={() => setSimularSms8(prev => !prev)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                            simularSms8
                                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-sm'
                                                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-emerald-500/40'
                                        }`}
                                        title="Simular atingimento da Pesquisa de Satisfação SMS ≥ 8 (+5,00% sobre a RV da Etapa 2)"
                                    >
                                        <Sparkles size={13} className={simularSms8 ? 'text-emerald-500' : 'text-neutral-400'} />
                                        <span>Bônus SMS ≥ 8 (+5%): {simularSms8 ? 'SIMULADO' : 'OFF'}</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => abrirDocumentoPDFNorma(activeRoleKey, metrics.targetSeller)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white/10 dark:hover:bg-white/15 border border-neutral-800 dark:border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <Printer size={13} />
                                    <span>PDF da Regra</span>
                                </button>
                            </div>
                        </div>

                        {/* CARDS PRINCIPAIS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            
                            {/* CARD DESTAQUE: PRÉVIA DE REMUNERAÇÃO VARIÁVEL */}
                            <div className="md:col-span-3 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 rounded-2xl p-6 sm:p-8 border border-neutral-800 shadow-xl relative overflow-hidden text-white">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none pr-8">
                                    <DollarSign size={240} />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-widest flex-wrap">
                                            <Award className="text-amber-400" size={16} /> 
                                            <span>Prévia de Remuneração Variável (RV)</span>
                                            <span className="text-neutral-500">•</span>
                                            <span className="text-neutral-200">{metrics.targetSeller}</span>
                                            <span className="px-2 py-0.5 rounded bg-white/10 text-amber-300 text-[10px] font-black">
                                                {activeRoleKey}
                                            </span>
                                        </div>
                                        <div className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 mb-2 font-sans">
                                            {applyCurrencyMask(metrics.previaPagamento)}
                                        </div>
                                        <p className="text-xs sm:text-sm text-neutral-400 font-normal max-w-2xl">
                                            Atingimento de <strong className="text-neutral-100 font-semibold">{metrics.pctAtingimento.toFixed(1)}%</strong> da meta de receita {metrics.isStoreLevelRole ? 'da LOJA' : 'individual'} • Faixa Aplicada (Etapa 2): <strong className="text-amber-400 font-sans font-black">{(metrics.fatorSimulado * 100).toFixed(2)}%</strong> ({applyCurrencyMask(metrics.rvEtapa2)})
                                            {metrics.totalBonus > 0 && (
                                                <> • Bônus (Etapa 3): <strong className="text-emerald-400 font-sans font-black">+{applyCurrencyMask(metrics.totalBonus)}</strong></>
                                            )}
                                            {metrics.atingiuTeto && (
                                                <> • <span className="text-amber-300 font-bold">(Limitado ao Teto de {applyCurrencyMask(metrics.tetoCargo)})</span></>
                                            )}
                                        </p>
                                    </div>

                                    {/* STATUS BADGE GRANDE */}
                                    <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-8">
                                        <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">1ª Etapa • Elegibilidade</span>
                                        <div className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                                            metrics.elegivel 
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                                : 'bg-[#E3000F]/20 text-red-400 border border-[#E3000F]/30'
                                        }`}>
                                            {metrics.elegivel ? (
                                                <>
                                                    <CheckCircle2 size={14} /> Elegível ao Pagamento
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle size={14} /> Abaixo do Piso (80%)
                                                </>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-neutral-400 mt-1.5 hidden md:block">
                                            Teto do Cargo: <strong className="text-neutral-200">{applyCurrencyMask(metrics.tetoCargo)}</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* CARD 1: 1ª ETAPA — METAS DE ELEGIBILIDADE (ADAPTADO AO CARGO!) */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <Target size={15} className="text-[#E3000F]" /> 1ª Etapa: Elegibilidade
                                        </h3>
                                        <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                                            Mín. 80% nos 3
                                        </span>
                                    </div>
                                    
                                    {activeRegra.isGeekEligibility ? (
                                        /* ELEGIBILIDADE ESPECÍFICA DO GEEK (Anexo V: Gross Pós, Acessório Qtde, Aparelho Qtde) */
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 text-xs">
                                                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                        1. Gross Pós Loja ({metrics.totalPos}/{Math.ceil(metrics.metaPos)} un)
                                                    </span>
                                                    <span className={`font-sans font-extrabold ${metrics.pctAtingimentoPos >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoPos.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            metrics.pctAtingimentoPos >= 100 ? 'bg-emerald-500' : metrics.pctAtingimentoPos >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                        }`} 
                                                        style={{ width: `${Math.min(metrics.pctAtingimentoPos, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 text-xs">
                                                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                        2. Acessórios Loja ({metrics.volAcessorio}/{metrics.metaAcessorio} un)
                                                    </span>
                                                    <span className={`font-sans font-extrabold ${metrics.pctAtingimentoAcessorio >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoAcessorio.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            metrics.pctAtingimentoAcessorio >= 100 ? 'bg-emerald-500' : metrics.pctAtingimentoAcessorio >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                        }`} 
                                                        style={{ width: `${Math.min(metrics.pctAtingimentoAcessorio, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 text-xs">
                                                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                        3. Aparelhos Loja ({metrics.volAparelho}/{metrics.metaAparelho} un)
                                                    </span>
                                                    <span className={`font-sans font-extrabold ${metrics.pctAtingimentoAparelho >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoAparelho.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            metrics.pctAtingimentoAparelho >= 100 ? 'bg-emerald-500' : metrics.pctAtingimentoAparelho >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                        }`} 
                                                        style={{ width: `${Math.min(metrics.pctAtingimentoAparelho, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-[11px] text-neutral-500">
                                                <span>Receita Loja (Base da Faixa %):</span>
                                                <strong className="text-neutral-800 dark:text-neutral-200">{metrics.pctAtingimento.toFixed(1)}% ({applyCurrencyMask(metrics.totalComissao)})</strong>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ELEGIBILIDADE PADRÃO (Gross Pós, Receita, Residencial [Fibra + TV]) */
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 text-xs">
                                                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                        1. Gross Pós-Pago ({metrics.totalPos}/{Math.ceil(metrics.metaPos)} un)
                                                    </span>
                                                    <span className={`font-sans font-extrabold ${metrics.pctAtingimentoPos >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoPos.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            metrics.pctAtingimentoPos >= 100 ? 'bg-emerald-500' : metrics.pctAtingimentoPos >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                        }`} 
                                                        style={{ width: `${Math.min(metrics.pctAtingimentoPos, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 text-xs">
                                                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                        2. Receita ({applyCurrencyMask(metrics.totalComissao)})
                                                    </span>
                                                    <span className={`font-sans font-extrabold ${metrics.pctAtingimento >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimento.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            metrics.pctAtingimento >= 100 ? 'bg-emerald-500' : metrics.pctAtingimento >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                        }`} 
                                                        style={{ width: `${Math.min(metrics.pctAtingimento, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 text-xs">
                                                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                        3. Residencial [Fibra + TV] ({metrics.totalUr}/{Math.ceil(metrics.metaUr)} un)
                                                    </span>
                                                    <span className={`font-sans font-extrabold ${metrics.pctAtingimentoUr >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoUr.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            metrics.pctAtingimentoUr >= 100 ? 'bg-emerald-500' : metrics.pctAtingimentoUr >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                        }`} 
                                                        style={{ width: `${Math.min(metrics.pctAtingimentoUr, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-neutral-800 text-center">
                                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider block ${
                                        metrics.elegivel 
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                            : 'bg-red-50 text-[#E3000F] dark:bg-red-950/40 dark:text-red-400'
                                    }`}>
                                        {metrics.elegivel ? '✓ Destravou Comissões (≥ 80%)' : '✗ Falhou em ≥ 1 Gatilho Mínimo (80%)'}
                                    </span>
                                </div>
                            </div>

                            {/* CARD 2: ACELERADOR MULTI & 3ª ETAPA (BÔNUS ESPECÍFICOS DO CARGO) */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={15} className="text-[#E3000F]" /> 3ª Etapa: Bônus & Multi
                                        </h3>
                                        <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                                            {activeRoleKey}
                                        </span>
                                    </div>

                                    <div className="space-y-3.5">
                                        {/* FATOR CLARO MULTI */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1 text-xs">
                                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                    Fator Multi / M-Play ({metrics.volMplay}/{metrics.metaMplay})
                                                </span>
                                                <span className="font-sans font-extrabold text-blue-600 dark:text-blue-400">
                                                    {metrics.fatorMultiplicador}x ({metrics.pctAtingimentoMplay.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full bg-blue-500 transition-all duration-700" 
                                                    style={{ width: `${Math.min(metrics.pctAtingimentoMplay, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 mt-1">
                                                Receita extra Multi injetada: <strong className="text-neutral-800 dark:text-neutral-200">+{applyCurrencyMask(metrics.receitaExtraMplay || 0)}</strong>
                                            </p>
                                        </div>

                                        {/* DETALHAMENTO DOS BÔNUS POR CARGO */}
                                        {activeRoleKey === 'VENDEDOR' && (
                                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 space-y-1.5 text-xs">
                                                <div className="font-bold text-neutral-800 dark:text-neutral-200 text-[11px] uppercase">
                                                    Bônus Unitário Acima da Meta (R$ 10 / R$ 15):
                                                </div>
                                                <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                                                    <span>• Pós Titular/Ctrl ({metrics.volPosPago}/{metrics.metaPosPago}):</span>
                                                    <strong className="text-neutral-900 dark:text-neutral-100">{applyCurrencyMask(resultBonusItem(metrics.volPosPago, metrics.metaPosPago))}</strong>
                                                </div>
                                                <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                                                    <span>• Banda Larga Fixa / Fibra ({metrics.volFibra}/{metrics.metaFibra}):</span>
                                                    <strong className="text-neutral-900 dark:text-neutral-100">{applyCurrencyMask(resultBonusItem(metrics.volFibra, metrics.metaFibra))}</strong>
                                                </div>
                                                <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                                                    <span>• TV Principal ({metrics.volTv}/{metrics.metaTv}):</span>
                                                    <strong className="text-neutral-900 dark:text-neutral-100">{applyCurrencyMask(resultBonusItem(metrics.volTv, metrics.metaTv))}</strong>
                                                </div>
                                            </div>
                                        )}

                                        {activeRoleKey === 'GERENTE' && (
                                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 space-y-1.5 text-xs">
                                                <div className="font-bold text-neutral-800 dark:text-neutral-200 text-[11px] uppercase">
                                                    Bônus Gestão de Equipe (Anexo III):
                                                </div>
                                                <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                                                    <span>Vendedores Elegíveis ({metrics.vendedoresElegiveisCount}/{metrics.totalVendedoresLoja}):</span>
                                                    <strong className="text-neutral-900 dark:text-neutral-100">{metrics.pctVendedoresElegiveis.toFixed(0)}%</strong>
                                                </div>
                                                <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                                                    <span>Prêmio Gestão (≥80%: R$250 | 100%: R$500):</span>
                                                    <strong className="text-emerald-600 dark:text-emerald-400">+{applyCurrencyMask(metrics.bonusGestao)}</strong>
                                                </div>
                                            </div>
                                        )}

                                        {activeRoleKey === 'GEEK' && (
                                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 space-y-1.5 text-xs">
                                                <div className="font-bold text-neutral-800 dark:text-neutral-200 text-[11px] uppercase">
                                                    Bônus Exclusivos Geek (Anexo V):
                                                </div>
                                                <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                                                    <span>• Fibra/Virtua PME ({metrics.pctAtingimentoBlPme.toFixed(0)}%):</span>
                                                    <strong className="text-neutral-900 dark:text-neutral-100">+{applyCurrencyMask(metrics.bonusBlPme)}</strong>
                                                </div>
                                                <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                                                    <span>• TM Acessórios ({applyCurrencyMask(metrics.tmAcessorio)}):</span>
                                                    <strong className="text-neutral-900 dark:text-neutral-100">+{applyCurrencyMask(metrics.bonusTmAcessorio)}</strong>
                                                </div>
                                            </div>
                                        )}

                                        {['SENIOR', 'ADMINISTRAÇÃO', 'ASSISTENTE RELACIONAMENTO'].includes(activeRoleKey) && (
                                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 space-y-1 text-xs">
                                                <div className="font-bold text-neutral-800 dark:text-neutral-200 text-[11px] uppercase">
                                                    Bônus Pesquisa de Satisfação (SMS ≥ 8):
                                                </div>
                                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                    Adiciona <strong>+5,00%</strong> sobre o valor apurado na Etapa 2 quando a média de notas válidas da loja é ≥ 8.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                                    <span className="text-neutral-500 dark:text-neutral-400">Total Bônus (Etapa 3):</span>
                                    <span className={`font-sans font-extrabold ${metrics.totalBonus > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`}>
                                        {metrics.totalBonus > 0 ? `+${applyCurrencyMask(metrics.totalBonus)}` : 'R$ 0,00'}
                                    </span>
                                </div>
                            </div>

                            {/* CARD 3: 2ª ETAPA — FAIXAS % SOBRE RECEITA DO CARGO ATUAL */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <TrendingUp size={15} className="text-[#E3000F]" /> 2ª Etapa: Faixas do Cargo
                                        </h3>
                                        <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                                            % s/ Receita
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {activeRegra.faixas.map((fx, idx) => {
                                            const isCurrentFaixa = metrics.elegivel
                                                ? (metrics.pctAtingimento >= fx.min && metrics.pctAtingimento <= fx.max)
                                                : (idx === 0);
                                            return (
                                                <div
                                                    key={fx.label}
                                                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                                        isCurrentFaixa
                                                            ? 'bg-[#E3000F]/10 border-[#E3000F]/40 text-neutral-900 dark:text-white font-bold shadow-sm'
                                                            : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/60 dark:border-neutral-700/60 text-neutral-600 dark:text-neutral-400'
                                                    }`}
                                                >
                                                    <span>{fx.label}</span>
                                                    <span className={`font-sans font-black ${isCurrentFaixa ? 'text-[#E3000F] dark:text-amber-400 text-sm' : ''}`}>
                                                        {fx.texto}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                                    <span>Volume Apurado:</span>
                                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{metrics.totalVendas} vendas • Teto {applyCurrencyMask(activeRegra.teto)}</span>
                                </div>
                            </div>

                            {/* SEÇÃO: DETALHAMENTO DE COMPOSIÇÃO DE RECEITA E PRODUTOS DA BASE */}
                            <div className="md:col-span-3 bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <BarChart2 size={16} className="text-[#E3000F]" /> Composição da Receita Apurada por Serviço (Anexo I)
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Portabilidades (+30%)</span>
                                        <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1 font-sans">
                                            {metrics.volPortabilidade} <span className="text-xs font-normal text-neutral-400">linhas</span>
                                        </div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            +30% sobre a Tabela de Referência nas novas ativações portadas.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Aparelhos (5%/6%) & Seguros (40%)</span>
                                        <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1 font-sans">
                                            {metrics.volAparelho + metrics.volSeguro} <span className="text-xs font-normal text-neutral-400">itens</span>
                                        </div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            Receita elegível: {applyCurrencyMask(metrics.comissaoAparelho + metrics.comissaoSeguro)}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Acessórios & Películas (15% NF)</span>
                                        <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1 font-sans">
                                            {metrics.volAcessorio} <span className="text-xs font-normal text-neutral-400">itens</span>
                                        </div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            Receita elegível (15%): {applyCurrencyMask(metrics.comissaoAcessorio || 0)}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Banda Larga Fixa (Fibra) & TV</span>
                                        <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1 font-sans">
                                            {metrics.volFibra} Fibra • {metrics.volTv} TV
                                        </div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            Upgrades (50%), Sidegrades (25%) e PME ({metrics.volPme}) integrados.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* SEÇÃO: QUADRO RESUMO DO CARGO + CAMPO "FONTE" */}
                            <div className="md:col-span-3 bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-neutral-100 dark:border-neutral-800">
                                    <div>
                                        <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <BookOpen size={16} className="text-[#E3000F]" /> Diretrizes Oficiais de Comissionamento — {activeRegra.titulo}
                                        </h3>
                                        <p className="text-[11px] text-neutral-400 mt-0.5">
                                            {activeRegra.grupoAnexo} • Norma PL-DRH-042 (Anexo I - G, Revisão 08 — 23/02/2026)
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFonteTab('MEU_CARGO');
                                                setShowFonteModal(true);
                                            }}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E3000F]/10 text-[#E3000F] hover:bg-[#E3000F] hover:text-white border border-[#E3000F]/30 transition-all cursor-pointer flex items-center gap-1.5"
                                        >
                                            <FileText size={14} />
                                            <span>FONTE: Ver Regras Completas</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => abrirDocumentoPDFNorma(activeRoleKey, metrics.targetSeller)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer flex items-center gap-1.5"
                                        >
                                            <Printer size={14} />
                                            <span>Abrir PDF</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                    {activeRegra.etapasDetalhadas.map((etapa, i) => (
                                        <div key={i} className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200/60 dark:border-neutral-700/50 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                            {etapa}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>

            {/* MODAL LEITOR DO PDF DE REGRAS ("FONTE") */}
            {showFonteModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-4xl rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        {/* Cabeçalho do Modal PDF */}
                        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-800/60">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#E3000F]/10 text-[#E3000F] border border-[#E3000F]/20 flex items-center justify-center shrink-0">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#E3000F] text-white">
                                            FONTE OFICIAL
                                        </span>
                                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                            Norma PL-DRH-042 (Anexo I - G, Rev. 08 — 23/02/2026)
                                        </span>
                                    </div>
                                    <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white mt-0.5">
                                        Caderno de Regras de Remuneração Variável — {activeRegra.titulo}
                                    </h3>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => abrirDocumentoPDFNorma(activeRoleKey, metrics?.targetSeller || loggedName)}
                                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#E3000F] hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <Printer size={14} />
                                    <span className="hidden sm:inline">Abrir / Baixar PDF (A4)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowFonteModal(false)}
                                    className="p-2 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Abas Internas do Documento */}
                        <div className="px-5 pt-3 border-b border-neutral-200 dark:border-neutral-800 flex gap-2 overflow-x-auto bg-white dark:bg-neutral-900">
                            <button
                                type="button"
                                onClick={() => setFonteTab('MEU_CARGO')}
                                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                                    fonteTab === 'MEU_CARGO'
                                        ? 'border-[#E3000F] text-[#E3000F] bg-red-50/50 dark:bg-[#E3000F]/10'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                                }`}
                            >
                                1. Regra do Cargo ({activeRoleKey})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFonteTab('COMPARATIVO')}
                                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                                    fonteTab === 'COMPARATIVO'
                                        ? 'border-[#E3000F] text-[#E3000F] bg-red-50/50 dark:bg-[#E3000F]/10'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                                }`}
                            >
                                2. Tabela Comparativa (6 Cargos)
                            </button>
                            <button
                                type="button"
                                onClick={() => setFonteTab('SERVICOS')}
                                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                                    fonteTab === 'SERVICOS'
                                        ? 'border-[#E3000F] text-[#E3000F] bg-red-50/50 dark:bg-[#E3000F]/10'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                                }`}
                            >
                                3. Regras por Serviço & Equivalência na Base
                            </button>
                        </div>

                        {/* Conteúdo do Modal */}
                        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {fonteTab === 'MEU_CARGO' && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-[#E3000F]/10 border border-red-200 dark:border-[#E3000F]/30">
                                        <div className="text-[11px] font-black uppercase text-[#E3000F] tracking-wider">
                                            {activeRegra.grupoAnexo}
                                        </div>
                                        <h4 className="text-base font-black text-neutral-900 dark:text-white mt-0.5">
                                            {activeRegra.titulo}
                                        </h4>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                                            <strong>Base de Apuração:</strong> {activeRegra.baseApuracao} • <strong>Teto Monetário:</strong> {applyCurrencyMask(activeRegra.teto)}
                                        </p>
                                    </div>

                                    <div className="space-y-2.5">
                                        {activeRegra.etapasDetalhadas.map((etapa, idx) => (
                                            <div key={idx} className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                                                {etapa}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {fonteTab === 'COMPARATIVO' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-neutral-900 text-white text-[10.5px] uppercase">
                                                <th className="p-2.5 rounded-tl-xl">Cargo</th>
                                                <th className="p-2.5">Grupo / Anexo</th>
                                                <th className="p-2.5">Base</th>
                                                <th className="p-2.5">Gatilhos (Mín. 80%)</th>
                                                <th className="p-2.5">Faixas % Receita</th>
                                                <th className="p-2.5">Bônus</th>
                                                <th className="p-2.5 rounded-tr-xl">Teto RV</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                            {Object.values(REGRAS_CARGOS_NORMA).map(r => (
                                                <tr
                                                    key={r.codigo}
                                                    className={r.codigo === activeRoleKey ? 'bg-red-50/80 dark:bg-[#E3000F]/15 font-bold' : 'bg-white dark:bg-neutral-900'}
                                                >
                                                    <td className="p-2.5 text-neutral-900 dark:text-white">{r.titulo}</td>
                                                    <td className="p-2.5">{r.grupoAnexo}</td>
                                                    <td className="p-2.5">{r.baseApuracao.split(' (')[0]}</td>
                                                    <td className="p-2.5">{r.gatilhosLabel}</td>
                                                    <td className="p-2.5">{r.faixas.filter(f => f.pct > 0).map(f => f.texto).join(' / ')}</td>
                                                    <td className="p-2.5">{r.bonusResumo}</td>
                                                    <td className="p-2.5 font-mono font-bold text-[#E3000F]">{applyCurrencyMask(r.teto)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {fonteTab === 'SERVICOS' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                                        <h4 className="font-bold text-neutral-900 dark:text-white uppercase text-[11px] mb-1 text-[#E3000F]">
                                            1. Móvel, Portabilidade (+30%) & Dependente
                                        </h4>
                                        <p>
                                            <strong>Pós-Pago Titular / Controle / BL Móvel / Claro Flex PF:</strong> Contam 1 Gross e 100% da Tabela de Referência.
                                            <br/><strong>Portabilidade:</strong> Recebe <strong>+30%</strong> sobre o valor da Tabela de Referência.
                                            <br/><strong>Dependente Gratuito:</strong> Entra no Gross quantitativo, mas não compõe receita monetária (R$ 0,00).
                                            <br/><strong>Móvel PME (POS PME):</strong> Compõe 100% da Receita Consumo e PME.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                                        <h4 className="font-bold text-neutral-900 dark:text-white uppercase text-[11px] mb-1 text-[#E3000F]">
                                            2. Fator Claro Multi (Móvel + Residencial / M-Play)
                                        </h4>
                                        <p>
                                            Vendas novas dentro de contrato Claro Multi recebem multiplicador conforme atingimento da meta Multi:
                                            <br/>• 0,00% a 99,99%: <strong>1,2x</strong>
                                            <br/>• 100,00% a 129,99%: <strong>1,4x</strong>
                                            <br/>• 130,00% a 159,99%: <strong>1,6x</strong>
                                            <br/>• ≥ 160,00%: <strong>1,8x</strong>
                                            <br/>No Single ou sem M-Play marcado, o fator é <strong>1,0x</strong>.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                                        <h4 className="font-bold text-neutral-900 dark:text-white uppercase text-[11px] mb-1 text-[#E3000F]">
                                            3. Equivalência de Nomes Compostos (Residencial)
                                        </h4>
                                        <p>
                                            • <strong>Banda Larga Fixa ("Virtua")</strong> = <strong>FIBRA / FIBRA PME</strong> na nossa base.
                                            <br/>• <strong>TV Ponto Principal</strong> = <strong>TVBOX / TV-BOX / TV CABO / SOUNDBOX</strong>.
                                            <br/>• <strong>Telefone Fixo</strong> = <strong>FIXO</strong> (entra na Receita monetária).
                                            <br/>• <strong>Smarthome</strong> = <strong>MESH</strong> (entra na Receita monetária).
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                                        <h4 className="font-bold text-neutral-900 dark:text-white uppercase text-[11px] mb-1 text-[#E3000F]">
                                            4. Aparelhos, Acessórios, Seguro & Movimentações
                                        </h4>
                                        <p>
                                            • <strong>Venda/Troca de Aparelho:</strong> <strong>5,00%</strong> do preço do aparelho (<strong>6,00%</strong> quando vendido com Seguro Proteção Móvel).
                                            <br/>• <strong>Seguro Proteção Móvel Avulso:</strong> <strong>40,00%</strong> da 1ª parcela.
                                            <br/>• <strong>Acessórios e Películas:</strong> <strong>15,00%</strong> do valor emitido na NF.
                                            <br/>• <strong>Movimentações:</strong> Upgrade = <strong>50%</strong> | Sidegrade = <strong>25%</strong> | Downgrade = <strong>0%</strong>.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper auxiliar para exibir bônus individual por item no card de Vendedor
function resultBonusItem(vol, meta) {
    const v = Number(vol) || 0;
    const m = Number(meta) || 0;
    if (m <= 0 || v <= m) return 0;
    const pct = (v / m) * 100;
    const exc = v - m;
    if (pct >= 115) return exc * 15;
    if (pct >= 100) return exc * 10;
    return 0;
}
