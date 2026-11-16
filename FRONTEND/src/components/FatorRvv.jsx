import React, { useState, useEffect, useMemo } from 'react';
import { 
    Calculator, User, DollarSign, Target, TrendingUp, AlertCircle, 
    Award, Lock, CheckCircle2, AlertTriangle, ShieldCheck, 
    ChevronDown, Zap, BarChart2, FileText, ExternalLink, BookOpen, Download
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
 * Normaliza o cargo do usuário para uma das categorias oficiais da Norma PL-DRH-042
 */
const normalizeRoleForRV = (rawRole) => {
    const r = String(rawRole || 'VENDEDOR').trim().toUpperCase();
    if (r === 'COORDENADOR' || r === 'ESPECIALISTA' || r.includes('COORDENADOR') || r.includes('ESPECIALISTA')) {
        return 'COORDENADOR';
    }
    if (r === 'GERENTE' || r.includes('GERENTE') || r.includes('SUPERVISOR')) {
        return 'GERENTE';
    }
    if (r === 'SENIOR' || r === 'SÊNIOR' || r.includes('SENIOR') || r.includes('SÊNIOR')) {
        return 'SENIOR';
    }
    if (r === 'GEEK' || r.includes('GEEK') || r.includes('TECNOLOGICO') || r.includes('TECNOLÓGICO')) {
        return 'GEEK';
    }
    if (r === 'CAIXA' || r.includes('CAIXA')) {
        return 'CAIXA';
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
 * Mapeamento de cada cargo para o seu respectivo PDF na pasta /uploads e regras resumidas na aba FONTE
 */
const REGRAS_CARGOS_NORMA = {
    'VENDEDOR': {
        codigo: 'VENDEDOR',
        titulo: 'Vendedor',
        grupoAnexo: 'Grupo VIII • Anexo IX (Rev. 03)',
        baseApuracao: 'Individual',
        pdfFile: 'REGRAS RV VENDEDOR.pdf',
        pdfKey: 'VENDEDOR',
        gatilhosLabel: 'Gross Pós (≥ 80%), Receita (≥ 80%), Residencial [Fibra + TV] (≥ 80%)',
        isGeekEligibility: false,
        faixas: [
            { label: '80,00% a 99,99%', min: 80, max: 99.99, pct: 0.045, texto: '4,50%' },
            { label: '100,00% a 119,99%', min: 100, max: 119.99, pct: 0.07, texto: '7,00%' },
            { label: '120,00% a 149,99%', min: 120, max: 149.99, pct: 0.09, texto: '9,00%' },
            { label: '≥ 150,00%', min: 150, max: 9999, pct: 0.11, texto: '11,00%' }
        ],
        bonusResumo: 'SMS ≥ 8 (+5%) + Bônus Unitário Acima da Meta (Pós, Fibra e TV: R$ 10 [100–114,99%] | R$ 15 [≥ 115%])',
        teto: 6000.00
    },
    'SENIOR': {
        codigo: 'SENIOR',
        titulo: 'Vendedor Sênior',
        grupoAnexo: 'Grupo III • Anexo IV (Rev. 04)',
        baseApuracao: 'Loja Alocada',
        pdfFile: 'REGRAS RV SENIOR.pdf',
        pdfKey: 'SENIOR',
        gatilhosLabel: 'Gross Pós (≥ 80%), Receita (≥ 80%), Residencial [Fibra + TV] (≥ 80%)',
        isGeekEligibility: false,
        faixas: [
            { label: '80,00% a 99,99%', min: 80, max: 99.99, pct: 0.01, texto: '1,00%' },
            { label: '100,00% a 114,99%', min: 100, max: 114.99, pct: 0.015, texto: '1,50%' },
            { label: '≥ 115,00%', min: 115, max: 9999, pct: 0.02, texto: '2,00%' }
        ],
        bonusResumo: 'Pesquisa de Satisfação (SMS ≥ 8): +5,00% sobre o valor da Etapa 2',
        teto: 6000.00
    },
    'GERENTE': {
        codigo: 'GERENTE',
        titulo: 'Gerente de Loja',
        grupoAnexo: 'Grupo II • Anexo III (Rev. 04)',
        baseApuracao: 'Lojas sob Gestão',
        pdfFile: 'REGRAS RV GERENTE.pdf',
        pdfKey: 'GERENTE',
        gatilhosLabel: 'Gross Pós (≥ 80%), Receita (≥ 80%), Residencial [Fibra + TV] (≥ 80%)',
        isGeekEligibility: false,
        faixas: [
            { label: '80,00% a 99,99%', min: 80, max: 99.99, pct: 0.01, texto: '1,00%' },
            { label: '100,00% a 114,99%', min: 100, max: 114.99, pct: 0.02, texto: '2,00%' },
            { label: '≥ 115,00%', min: 115, max: 9999, pct: 0.03, texto: '3,00%' }
        ],
        bonusResumo: 'SMS ≥ 8 (+5%) + Bônus Gestão (R$ 250 se ≥ 80% vendedores elegíveis | R$ 500 se 100% elegíveis)',
        teto: 7000.00
    },
    'GEEK': {
        codigo: 'GEEK',
        titulo: 'Assistente Tecnológico (Geek)',
        grupoAnexo: 'Grupo IV • Anexo V (Rev. 04)',
        baseApuracao: 'Loja Alocada',
        pdfFile: 'REGRAS RV GEEK.pdf',
        pdfKey: 'GEEK',
        gatilhosLabel: 'Gross Pós (≥ 80%), Acessório Qtde (≥ 80%), Aparelho Qtde (≥ 80%)',
        isGeekEligibility: true,
        faixas: [
            { label: '80,00% a 99,99%', min: 80, max: 99.99, pct: 0.01, texto: '1,00%' },
            { label: '100,00% a 114,99%', min: 100, max: 114.99, pct: 0.015, texto: '1,50%' },
            { label: '≥ 115,00%', min: 115, max: 9999, pct: 0.02, texto: '2,00%' }
        ],
        bonusResumo: 'Fibra/Virtua PME (+R$ 200 [100–129,99%] | +R$ 300 [≥ 130%]) + Ticket Médio Acessórios (+R$ 235 fixo)',
        teto: 6000.00
    },
    'ADMINISTRAÇÃO': {
        codigo: 'ADMINISTRAÇÃO',
        titulo: 'ADM (Assistente Administrativo)',
        grupoAnexo: 'Grupo V • Anexo VI (Rev. 03)',
        baseApuracao: 'Loja Alocada',
        pdfFile: 'REGRAS RV ADM.pdf',
        pdfKey: 'ADMINISTRAÇÃO',
        gatilhosLabel: 'Gross Pós (≥ 80%), Receita (≥ 80%), Residencial [Fibra + TV] (≥ 80%)',
        isGeekEligibility: false,
        faixas: [
            { label: '80,00% a 99,99%', min: 80, max: 99.99, pct: 0.005, texto: '0,50%' },
            { label: '100,00% a 114,99%', min: 100, max: 114.99, pct: 0.01, texto: '1,00%' },
            { label: '≥ 115,00%', min: 115, max: 9999, pct: 0.015, texto: '1,50%' }
        ],
        bonusResumo: 'Pesquisa de Satisfação (SMS ≥ 8): +5,00% sobre o valor da Etapa 2',
        teto: 2000.00
    },
    'ASSISTENTE RELACIONAMENTO': {
        codigo: 'ASSISTENTE RELACIONAMENTO',
        titulo: 'Assistente de Relacionamentos',
        grupoAnexo: 'Grupo VII • Anexo VIII (Rev. 04)',
        baseApuracao: 'Loja Alocada',
        pdfFile: 'REGRAS RV ASSISTENTE RELACIONAMENTO.pdf',
        pdfKey: 'ASSISTENTE RELACIONAMENTO',
        gatilhosLabel: 'Gross Pós (≥ 80%), Receita (≥ 80%), Residencial [Fibra + TV] (≥ 80%)',
        isGeekEligibility: false,
        faixas: [
            { label: '80,00% a 99,99%', min: 80, max: 99.99, pct: 0.0075, texto: '0,75%' },
            { label: '100,00% a 114,99%', min: 100, max: 114.99, pct: 0.012, texto: '1,20%' },
            { label: '≥ 115,00%', min: 115, max: 9999, pct: 0.015, texto: '1,50%' }
        ],
        bonusResumo: 'Pesquisa de Satisfação (SMS ≥ 8): +5,00% sobre o valor da Etapa 2',
        teto: 4000.00
    },
    'CAIXA': {
        codigo: 'CAIXA',
        titulo: 'Operador de Caixa',
        grupoAnexo: 'Grupo V • Anexo VI (Caixa)',
        baseApuracao: 'Loja Alocada',
        pdfFile: 'REGRAS RV CAIXA.pdf',
        pdfKey: 'CAIXA',
        gatilhosLabel: 'Gross Pós (≥ 80%), Receita (≥ 80%), Residencial [Fibra + TV] (≥ 80%)',
        isGeekEligibility: false,
        faixas: [
            { label: '80,00% a 99,99%', min: 80, max: 99.99, pct: 0.005, texto: '0,50%' },
            { label: '100,00% a 114,99%', min: 100, max: 114.99, pct: 0.01, texto: '1,00%' },
            { label: '≥ 115,00%', min: 115, max: 9999, pct: 0.015, texto: '1,50%' }
        ],
        bonusResumo: 'Pesquisa de Satisfação (SMS ≥ 8): +5,00% sobre o valor da Etapa 2',
        teto: 2000.00
    },
    'COORDENADOR': {
        codigo: 'COORDENADOR',
        titulo: 'Coordenador & Equipe Regional',
        grupoAnexo: 'Grupo I/II • Coordenador e Outros',
        baseApuracao: 'Regional / Lojas sob Gestão',
        pdfFile: 'REGRAS COORDENADOR E OUTROS.pdf',
        pdfKey: 'COORDENADOR',
        gatilhosLabel: 'Gross Pós (≥ 80%), Receita (≥ 80%), Residencial [Fibra + TV] (≥ 80%)',
        isGeekEligibility: false,
        faixas: [
            { label: '80,00% a 99,99%', min: 80, max: 99.99, pct: 0.01, texto: '1,00%' },
            { label: '100,00% a 114,99%', min: 100, max: 114.99, pct: 0.02, texto: '2,00%' },
            { label: '≥ 115,00%', min: 115, max: 9999, pct: 0.03, texto: '3,00%' }
        ],
        bonusResumo: 'SMS ≥ 8 (+5%) + Bônus Gestão Regional (R$ 250 / R$ 500)',
        teto: 7000.00
    }
};

const DOCUMENTOS_EXTRAS_UPLOADS = [
    {
        titulo: 'Regras Gerais de Comissionamento (Anexo I)',
        subtitulo: 'Apuração por Serviço, Portabilidade, Multi, Aparelhos e Residencial',
        pdfFile: 'REGRAS GERAIS COMISSIONAMENTO.pdf',
        pdfKey: 'GERAIS'
    },
    {
        titulo: 'Regras de Férias, Elegibilidade e Outros',
        subtitulo: 'Política de Férias, Fechamento de Loja, Redutores e Contestações',
        pdfFile: 'REGRAS DE FERIAS E OUTROS.pdf',
        pdfKey: 'FERIAS'
    }
];

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

    let fator = 0;
    let elegivel = true;
    let bonusUnitario = 0;
    let tetoCargo = 6000.00;

    if (role === 'GERENTE' || role === 'COORDENADOR') {
        tetoCargo = 7000.00;
        if (pctRec < 80 || pctPos < 80 || pctUr < 80) elegivel = false;
        else if (pctRec >= 115) fator = 0.03;
        else if (pctRec >= 100) fator = 0.02;
        else fator = 0.01;

        const rvEtapa2 = elegivel ? totalComissao * fator : 0;
        if (elegivel) {
            const pctEleg = Number(metricasExtras.pctVendedoresElegiveis) || 0;
            if (pctEleg >= 100) bonusUnitario = 500;
            else if (pctEleg >= 80) bonusUnitario = 250;
        }
        return {
            fatorAplicado: fator,
            elegivel,
            bonusUnitario,
            previaPagamento: Math.min(Math.max(0, rvEtapa2 + bonusUnitario), tetoCargo)
        };
    }

    if (role === 'SENIOR') {
        tetoCargo = 6000.00;
        if (pctRec < 80 || pctPos < 80 || pctUr < 80) elegivel = false;
        else if (pctRec >= 115) fator = 0.02;
        else if (pctRec >= 100) fator = 0.015;
        else fator = 0.01;

        const rvEtapa2 = elegivel ? totalComissao * fator : 0;
        return {
            fatorAplicado: fator,
            elegivel,
            bonusUnitario: 0,
            previaPagamento: Math.min(Math.max(0, rvEtapa2), tetoCargo)
        };
    }

    if (role === 'ASSISTENTE RELACIONAMENTO') {
        tetoCargo = 4000.00;
        if (pctRec < 80 || pctPos < 80 || pctUr < 80) elegivel = false;
        else if (pctRec >= 115) fator = 0.015;
        else if (pctRec >= 100) fator = 0.012;
        else fator = 0.0075;

        const rvEtapa2 = elegivel ? totalComissao * fator : 0;
        return {
            fatorAplicado: fator,
            elegivel,
            bonusUnitario: 0,
            previaPagamento: Math.min(Math.max(0, rvEtapa2), tetoCargo)
        };
    }

    if (role === 'ADMINISTRAÇÃO' || role === 'CAIXA') {
        tetoCargo = 2000.00;
        if (pctRec < 80 || pctPos < 80 || pctUr < 80) elegivel = false;
        else if (pctRec >= 115) fator = 0.015;
        else if (pctRec >= 100) fator = 0.01;
        else fator = 0.005;

        const rvEtapa2 = elegivel ? totalComissao * fator : 0;
        return {
            fatorAplicado: fator,
            elegivel,
            bonusUnitario: 0,
            previaPagamento: Math.min(Math.max(0, rvEtapa2), tetoCargo)
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
            if (pctBlPme >= 130) bonusUnitario += 300;
            else if (pctBlPme >= 100) bonusUnitario += 200;

            const pctTmAces = Number(metricasExtras.pctAtingimentoTmAcessorio) || 0;
            if (pctAces >= 100 && pctTmAces >= 100) bonusUnitario += 235;
        }
        return {
            fatorAplicado: fator,
            elegivel,
            bonusUnitario,
            previaPagamento: Math.min(Math.max(0, rvEtapa2 + bonusUnitario), tetoCargo)
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
        bonusUnitario =
            calcExcedente(metricasExtras.volPosPago, metricasExtras.metaPosPago) +
            calcExcedente(metricasExtras.volFibra, metricasExtras.metaFibra) +
            calcExcedente(metricasExtras.volTv, metricasExtras.metaTv);
    }

    return {
        fatorAplicado: fator,
        elegivel,
        bonusUnitario,
        previaPagamento: Math.min(Math.max(0, rvEtapa2 + bonusUnitario), tetoCargo)
    };
};

export const FatorRvv = ({ globalUser, salesData = [], goalsDB = {}, usersDB = {}, globalMonth }) => {
    const userRole = String(globalUser?.role || 'VENDEDOR').toUpperCase();
    const normalizedLoggedRole = normalizeRoleForRV(userRole);
    const canChangeSeller = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'ADM', 'COORDENADOR', 'ESPECIALISTA', 'GEEK'].includes(userRole);
    const loggedName = String(globalUser?.name || '');

    // Abas da Seção: 'SIMULADOR' (Painel Principal Limpo) | 'FONTE' (Regras por Usuário & PDFs da pasta uploads)
    const [activeSectionTab, setActiveSectionTab] = useState('SIMULADOR');

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
            const isStoreLevelRole = ['GERENTE', 'COORDENADOR', 'SENIOR', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO', 'CAIXA', 'GEEK'].includes(selectedUserRole);

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

                if (pBase.includes('ACESSORIO') || pBase.includes('ACESSÓRIO') || pBase.includes('PELICULA') || pBase.includes('PELÍCULA')) {
                    volAcessorio += q;
                    receitaAcessorio += Number(sale.valorBruto !== undefined ? sale.valorBruto : sale.receita) || 0;
                }

                if (pBase.includes('FIBRA PME') || pBase.includes('UR PME') || pBase.includes('BL PME') || pBase.includes('VIRTUA PME')) {
                    volBlPme += q;
                }

                // Gross Pós-Pago Consumo (Conta, Controle, Flex PF, Dependente, BL Móvel — sem PME)
                const isGrossPosConsumo = (
                    (pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('CONTROLE') || pBase.includes('FLEX') || pBase.includes('DEPENDENTE') || pBase.includes('DEP') || ((pBase.includes('BANDA LARGA') || pBase === 'BL') && !pBase.includes('RESIDENCIAL') && !pBase.includes('FIXA'))) &&
                    !pBase.includes('PME') &&
                    !isUpgradeOrSidegrade &&
                    !(pBase.includes('FLEX') && sub.includes('RECARGA'))
                );
                if (isGrossPosConsumo) {
                    totalPos += q;
                }

                // Pós Titular (Conta ou Controle) para Bônus Unitário de Vendedor
                if ((pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('CONTROLE')) && !pBase.includes('PME') && !pBase.includes('DEP') && !isUpgradeOrSidegrade) {
                    volPosPago += q;
                }

                // Banda Larga Fixa ("Virtua") = FIBRA / FIBRA PME
                const isBandaLargaFixa = (
                    (pBase.includes('FIBRA') || pBase.includes('VIRTUA') || pBase.includes('BANDA LARGA FIXA') || pBase.includes('BANDA LARGA RESIDENCIAL')) &&
                    !isUpgradeOrSidegrade
                );
                if (isBandaLargaFixa) {
                    volFibra += q;
                }

                // TV Ponto Principal = TVBOX, TV-BOX, TV CABO, SOUNDBOX
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

                if (isBandaLargaFixa || isTvPrincipal) {
                    totalUr += q;
                }

                totalReceita += Number(sale.valorBruto !== undefined ? sale.valorBruto : sale.receita) || 0;
                totalComissao += receitaBase;
            });

            const metaPos = (Number(activeMetas.posTotal) || 0) / divisor;
            const metaUr = (Number(activeMetas.urTotal) || (Number(activeMetas.fibra || 0) + Number(activeMetas.tv || 0))) / divisor;
            
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
                notaNps: 0,
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
                setMetrics({
                    totalReceita, totalComissao, totalVendas, totalPos, totalUr,
                    metaReceita, metaPos, metaUr, pctAtingimento, pctAtingimentoPos, pctAtingimentoUr,
                    pctAtingimentoMplay, volMplay, metaMplay, receitaExtraMplay,
                    previaPagamento: resultRV.previaPagamento ?? 0,
                    fatorSimulado: resultRV.fatorAplicado ?? 0,
                    elegivel: resultRV.elegivel ?? false,
                    bonusUnitario: resultRV.bonusUnitario ?? 0,
                    fatorMultiplicador, volPortabilidade, volMulti, volPme,
                    volAparelho, comissaoAparelho, volSeguro, comissaoSeguro,
                    pctAtingimentoAparelho, pctAtingimentoAcessorio, pctAtingimentoTmAcessorio, pctAtingimentoBlPme,
                    volAcessorio, receitaAcessorio,
                    isStoreLevelRole, selectedUserRole,
                    targetSeller
                });
                setIsLoading(false);
            }
        };

        fetchData();
        
        return () => {
            isMounted = false;
        };
    }, [salesData, selectedSeller, globalMonth, goalsDB, safeVendedores, canChangeSeller, loggedName, userRole, usersDB]);

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

    // Identifica a regra e o PDF oficial do usuário logado / selecionado
    const activeRoleKey = metrics?.selectedUserRole || normalizedLoggedRole;
    const activeRegra = REGRAS_CARGOS_NORMA[activeRoleKey] || REGRAS_CARGOS_NORMA['VENDEDOR'];

    // Estados para carregamento seguro dos PDFs via JWT no Backend (sem exposição pública)
    const [pdfBlobCache, setPdfBlobCache] = useState({});
    const [activePdfPreviewUrl, setActivePdfPreviewUrl] = useState('');
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [pdfError, setPdfError] = useState('');

    const fetchProtectedPdfBlobUrl = async (pdfKey = activeRegra.pdfKey) => {
        const key = String(pdfKey || activeRegra.pdfKey || 'VENDEDOR').trim();
        if (pdfBlobCache[key]) {
            return pdfBlobCache[key];
        }
        const res = await authFetch(`${API_URL}/api/calcular/fator-rv/pdf/${encodeURIComponent(key)}`);
        if (!res.ok) {
            throw new Error(`Falha ao carregar documento protegido (${res.status})`);
        }
        const blob = await res.blob();
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(pdfBlob);
        setPdfBlobCache(prev => ({ ...prev, [key]: objectUrl }));
        return objectUrl;
    };

    // Carrega automaticamente o PDF do cargo no visualizador interno ao abrir a aba FONTE
    useEffect(() => {
        if (activeSectionTab !== 'FONTE') return;
        let active = true;
        setIsLoadingPdf(true);
        setPdfError('');

        fetchProtectedPdfBlobUrl(activeRegra.pdfKey)
            .then(url => {
                if (active) {
                    setActivePdfPreviewUrl(url);
                    setIsLoadingPdf(false);
                }
            })
            .catch(() => {
                if (active) {
                    setPdfError('Não foi possível carregar a pré-visualização do documento protegido.');
                    setIsLoadingPdf(false);
                }
            });

        return () => {
            active = false;
        };
    }, [activeSectionTab, activeRegra.pdfKey]);

    // Abre o PDF autenticado via JWT em nova aba (Blob temporário na memória do navegador)
    const handleOpenCargoPDF = async (pdfKey = activeRegra.pdfKey) => {
        try {
            setIsLoadingPdf(true);
            const blobUrl = await fetchProtectedPdfBlobUrl(pdfKey);
            window.open(blobUrl, '_blank', 'noopener,noreferrer');
        } catch (err) {
            console.error('Erro ao abrir PDF protegido via JWT:', err);
            alert('Não foi possível abrir o PDF. Verifique sua sessão e tente novamente.');
        } finally {
            setIsLoadingPdf(false);
        }
    };

    // Baixa o PDF autenticado via JWT
    const handleDownloadCargoPDF = async (pdfKey = activeRegra.pdfKey, fileName = activeRegra.pdfFile) => {
        try {
            setIsLoadingPdf(true);
            const blobUrl = await fetchProtectedPdfBlobUrl(pdfKey);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || 'REGRA_RV.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Erro ao baixar PDF protegido via JWT:', err);
            alert('Não foi possível baixar o PDF. Verifique sua sessão e tente novamente.');
        } finally {
            setIsLoadingPdf(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in transition-colors space-y-4 font-sans">
            {/* CABEÇALHO PRINCIPAL */}
            <div className="p-5 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#E3000F]/10 dark:bg-[#E3000F]/20 flex items-center justify-center text-[#E3000F] border border-[#E3000F]/20 shrink-0">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                                Painel Fator RV
                            </h2>
                            <span className="text-xs font-extrabold bg-[#E3000F]/10 text-[#E3000F] dark:bg-[#E3000F]/20 px-2.5 py-0.5 rounded-lg uppercase tracking-wider border border-[#E3000F]/20">
                                PRÉVIA
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1 font-bold uppercase tracking-wide">
                            SIMULADOR DE COMISSIONAMENTO , NÃO VALIDO PARA RECEBIMENTO , SOMENTE PARA ESTIMATIVA
                        </p>
                    </div>
                </div>
                
                {/* CONTROLES DO TOPO: ABAS (SIMULADOR / FONTE) + SELETOR DE COLABORADOR */}
                <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* SELETOR DE ABAS: SIMULADOR vs FONTE */}
                    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <button
                            type="button"
                            onClick={() => setActiveSectionTab('SIMULADOR')}
                            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeSectionTab === 'SIMULADOR'
                                    ? 'bg-white dark:bg-neutral-900 text-[#E3000F] shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            <Calculator size={15} />
                            <span>Simulador</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSectionTab('FONTE')}
                            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeSectionTab === 'FONTE'
                                    ? 'bg-[#E3000F] text-white shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-300 hover:text-[#E3000F]'
                            }`}
                            title={`Ver Fonte e PDF da Regra (${activeRegra.pdfFile})`}
                        >
                            <FileText size={15} />
                            <span>FONTE</span>
                        </button>
                    </div>

                    {canChangeSeller ? (
                        <div className="flex items-center gap-2.5 bg-neutral-50 dark:bg-neutral-800/60 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700/80 shadow-inner">
                            <User size={17} className="text-[#E3000F] shrink-0" />
                            <div className="flex flex-col flex-1">
                                <span className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
                                    Consultor Selecionado
                                </span>
                                <select 
                                    value={selectedSeller} 
                                    onChange={(e) => setSelectedSeller(e.target.value)}
                                    className="bg-transparent text-sm font-bold text-neutral-900 dark:text-neutral-100 outline-none pr-3 cursor-pointer w-full md:min-w-[200px]"
                                >
                                    {uniqueSelectableUsers.map(v => {
                                        const usrObj = Object.values(usersDB || {}).find(u => String(u?.name || '') === v);
                                        const roleLabel = usrObj?.role && usrObj.role !== 'VENDEDOR' ? ` (${usrObj.role})` : '';
                                        return (
                                            <option key={v} value={v} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">
                                                {v}{roleLabel}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <ChevronDown size={15} className="text-neutral-400 shrink-0 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2.5 bg-neutral-50 dark:bg-neutral-800/60 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <ShieldCheck size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-400 tracking-wider flex items-center gap-1">
                                    <Lock size={11} className="text-[#E3000F]" /> Painel Individual
                                </span>
                                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                    {loggedName || 'Colaborador'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CORPO DA SEÇÃO */}
            <div className="flex-1 overflow-auto">
                {isLoading || !metrics ? (
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 min-h-[400px] flex items-center justify-center">
                        <WFLogoLoader
                            size="md"
                            text="Calculando Fator RV..."
                            subtext="Processando pontuação de metas, aceleradores e comissão..."
                        />
                    </div>
                ) : activeSectionTab === 'FONTE' ? (
                    /* ============================================================================
                       ABA "FONTE": DIRECIONAMENTO AO PDF DA PASTA UPLOADS + REGRAS POR CARGO
                       ============================================================================ */
                    <div className="space-y-5 pb-6 animate-fade-in">
                        {/* CARD PRINCIPAL DA REGRA ATRIBUÍDA AO USUÁRIO IDENTIFICADO */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-[#E3000F]/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#E3000F]/10 text-[#E3000F] text-xs font-extrabold uppercase tracking-wider">
                                    <FileText size={15} />
                                    <span>Regra Atribuída ao Seu Perfil ({activeRoleKey})</span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white">
                                    {activeRegra.titulo} — {activeRegra.grupoAnexo}
                                </h3>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                    Colaborador identificado: <strong className="text-neutral-900 dark:text-white">{metrics.targetSeller}</strong> • Documento Oficial: <strong className="text-[#E3000F]">{activeRegra.pdfFile}</strong>
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
                                <button
                                    type="button"
                                    disabled={isLoadingPdf}
                                    onClick={() => handleOpenCargoPDF(activeRegra.pdfKey)}
                                    className="flex-1 md:flex-initial px-5 py-3 rounded-xl bg-gradient-to-r from-[#E3000F] to-red-700 hover:from-red-600 hover:to-red-800 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                                >
                                    <ExternalLink size={17} />
                                    <span>{isLoadingPdf ? 'Autenticando PDF...' : `Abrir PDF (${activeRegra.pdfFile})`}</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={isLoadingPdf}
                                    onClick={() => handleDownloadCargoPDF(activeRegra.pdfKey, activeRegra.pdfFile)}
                                    className="px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-60 text-neutral-800 dark:text-neutral-100 font-bold text-sm flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer"
                                >
                                    <Download size={17} />
                                    <span>Baixar PDF</span>
                                </button>
                            </div>
                        </div>

                        {/* RESUMO SIMPLES E LEGÍVEL DA REGRA DO USUÁRIO */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <span className="text-xs font-extrabold text-[#E3000F] uppercase tracking-wider block mb-1.5">
                                    1. Base & Gatilhos (Mín. 80%)
                                </span>
                                <div className="text-base font-extrabold text-neutral-900 dark:text-white mb-1">
                                    Base: {activeRegra.baseApuracao}
                                </div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                    {activeRegra.gatilhosLabel}
                                </p>
                            </div>

                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <span className="text-xs font-extrabold text-[#E3000F] uppercase tracking-wider block mb-1.5">
                                    2. Faixas % sobre Receita
                                </span>
                                <div className="space-y-1.5 mt-2">
                                    {activeRegra.faixas.map(f => (
                                        <div key={f.label} className="flex items-center justify-between text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                                            <span>{f.label}:</span>
                                            <strong className="text-neutral-900 dark:text-white font-extrabold tabular-nums">{f.texto}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <span className="text-xs font-extrabold text-[#E3000F] uppercase tracking-wider block mb-1.5">
                                    3. Bônus & Teto do Cargo
                                </span>
                                <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mb-1 tabular-nums">
                                    Teto RV: {applyCurrencyMask(activeRegra.teto)}
                                </div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                    {activeRegra.bonusResumo}
                                </p>
                            </div>
                        </div>

                        {/* VISUALIZADOR EMBUTIDO DO PDF DO CARGO LOGADO (AUTENTICADO VIA JWT) */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                    <BookOpen size={17} className="text-[#E3000F]" />
                                    Visualização Segura (JWT) — {activeRegra.pdfFile}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleOpenCargoPDF(activeRegra.pdfKey)}
                                    className="text-xs font-bold text-[#E3000F] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Abrir em Nova Guia</span>
                                    <ExternalLink size={13} />
                                </button>
                            </div>
                            <div className="w-full h-[540px] bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
                                {isLoadingPdf && !activePdfPreviewUrl ? (
                                    <div className="text-sm font-bold text-neutral-600 dark:text-neutral-300 flex items-center gap-2">
                                        <span>Autenticando e carregando documento PDF...</span>
                                    </div>
                                ) : pdfError ? (
                                    <div className="text-center p-6 space-y-3">
                                        <p className="text-sm font-bold text-neutral-600 dark:text-neutral-300">{pdfError}</p>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenCargoPDF(activeRegra.pdfKey)}
                                            className="px-4 py-2 rounded-xl bg-[#E3000F] text-white text-xs font-bold cursor-pointer"
                                        >
                                            Tentar Abrir Novamente
                                        </button>
                                    </div>
                                ) : activePdfPreviewUrl ? (
                                    <iframe
                                        src={activePdfPreviewUrl}
                                        title={activeRegra.pdfFile}
                                        className="w-full h-full border-0"
                                    />
                                ) : null}
                            </div>
                        </div>

                        {/* BIBLIOTECA DE PDFs PROTEGIDA POR JWT */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            <h3 className="text-sm font-extrabold text-neutral-800 dark:text-neutral-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FileText size={17} className="text-[#E3000F]" />
                                {canChangeSeller
                                    ? 'Todos os Cadernos de Regras por Cargo (Acesso Protegido JWT)'
                                    : 'Cadernos Oficiais Disponíveis para o Seu Perfil'}
                            </h3>

                            {canChangeSeller && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                                    {Object.values(REGRAS_CARGOS_NORMA).map((item) => {
                                        const isUserRole = item.codigo === activeRoleKey;
                                        return (
                                            <button
                                                key={item.codigo}
                                                type="button"
                                                onClick={() => handleOpenCargoPDF(item.pdfKey)}
                                                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 group ${
                                                    isUserRole
                                                        ? 'bg-red-50/70 dark:bg-[#E3000F]/15 border-[#E3000F] shadow-sm'
                                                        : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/70 hover:border-[#E3000F]/50'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-extrabold uppercase text-[#E3000F]">
                                                            {item.codigo}
                                                        </span>
                                                        {isUserRole && (
                                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#E3000F] text-white">
                                                                ATIVO
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-bold text-neutral-900 dark:text-white mt-1">
                                                        {item.titulo}
                                                    </div>
                                                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                        {item.pdfFile}
                                                    </div>
                                                </div>
                                                <div className="pt-2 border-t border-neutral-200/70 dark:border-neutral-700/60 flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-200 group-hover:text-[#E3000F]">
                                                    <span>Abrir PDF</span>
                                                    <ExternalLink size={14} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* DOCUMENTOS GERAIS E DE FÉRIAS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {DOCUMENTOS_EXTRAS_UPLOADS.map((doc) => (
                                    <button
                                        key={doc.pdfFile}
                                        type="button"
                                        onClick={() => handleOpenCargoPDF(doc.pdfKey)}
                                        className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/70 hover:border-[#E3000F] text-left transition-all cursor-pointer flex items-center justify-between gap-3 group"
                                    >
                                        <div>
                                            <div className="text-sm font-extrabold text-neutral-900 dark:text-white group-hover:text-[#E3000F]">
                                                {doc.titulo}
                                            </div>
                                            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                {doc.subtitulo} ({doc.pdfFile})
                                            </div>
                                        </div>
                                        <ExternalLink size={18} className="text-neutral-400 group-hover:text-[#E3000F] shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ============================================================================
                       ABA "SIMULADOR": LAYOUT LÚDICO, SIMPLES, LIMPO E COM FONTES BEM LEGÍVEIS
                       ============================================================================ */
                    <div className="space-y-5 pb-6">
                        {/* AVISO DO SIMULADOR + BOTÃO DIRETO PARA O PDF DA REGRA DO USUÁRIO ("FONTE") */}
                        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                            <div className="flex items-center gap-3.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="text-sm leading-snug text-neutral-700 dark:text-neutral-200">
                                    <strong className="text-neutral-900 dark:text-white font-bold block">
                                        Simulador de Remuneração Variável — {activeRegra.titulo}
                                    </strong>
                                    <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                                        Os cálculos exibidos são estimativas baseadas na tabela oficial do seu cargo.
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleOpenCargoPDF(activeRegra.pdfKey)}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#E3000F]/10 hover:bg-[#E3000F] text-[#E3000F] hover:text-white border border-[#E3000F]/30 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
                                title={`Abrir PDF Oficial: ${activeRegra.pdfFile}`}
                            >
                                <FileText size={16} />
                                <span>FONTE: Abrir PDF ({activeRoleKey})</span>
                                <ExternalLink size={14} />
                            </button>
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
                                        <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm font-bold text-neutral-300 uppercase tracking-wider flex-wrap">
                                            <Award className="text-amber-400" size={18} /> 
                                            <span>Prévia de Remuneração Variável (RV)</span>
                                            <span className="text-neutral-500">•</span>
                                            <span className="text-white">{metrics.targetSeller}</span>
                                        </div>
                                        <div className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 mb-2 font-sans tabular-nums">
                                            {applyCurrencyMask(metrics.previaPagamento)}
                                        </div>
                                        <p className="text-sm sm:text-base text-neutral-300 font-medium max-w-xl">
                                            Atingimento de <strong className="text-white font-extrabold tabular-nums">{metrics.pctAtingimento.toFixed(1)}%</strong> da meta {metrics.isStoreLevelRole ? 'geral da LOJA' : 'individual'} • Fator Simulado: <strong className="text-amber-400 font-black tabular-nums">{(metrics.fatorSimulado * 100).toFixed(2)}%</strong>.
                                        </p>
                                    </div>

                                    {/* STATUS BADGE GRANDE */}
                                    <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-8">
                                        <span className="text-xs sm:text-sm text-neutral-300 uppercase tracking-wider font-bold">Status de Elegibilidade</span>
                                        <div className={`mt-1.5 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider ${
                                            metrics.elegivel 
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                                : 'bg-[#E3000F]/20 text-red-300 border border-[#E3000F]/40'
                                        }`}>
                                            {metrics.elegivel ? (
                                                <>
                                                    <CheckCircle2 size={16} /> Elegível ao Pagamento
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle size={16} /> Abaixo do Piso Mínimo
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CARD 1: ELEGIBILIDADE DAS METAS */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-extrabold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                                            <Target size={17} className="text-[#E3000F]" /> Metas de Elegibilidade
                                        </h3>
                                        <span className="text-xs font-extrabold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
                                            Piso: 80%
                                        </span>
                                    </div>
                                    
                                    {activeRegra.isGeekEligibility ? (
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 text-sm">
                                                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                                        Gross Móvel ({metrics.totalPos} un)
                                                    </span>
                                                    <span className={`font-extrabold tabular-nums ${metrics.pctAtingimentoPos >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoPos.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            metrics.pctAtingimentoPos >= 100 ? 'bg-emerald-500' : metrics.pctAtingimentoPos >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                        }`} 
                                                        style={{ width: `${Math.min(metrics.pctAtingimentoPos, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 text-sm">
                                                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                                        Acessórios ({metrics.volAcessorio} un)
                                                    </span>
                                                    <span className={`font-extrabold tabular-nums ${metrics.pctAtingimentoAcessorio >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoAcessorio.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            metrics.pctAtingimentoAcessorio >= 100 ? 'bg-emerald-500' : metrics.pctAtingimentoAcessorio >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                        }`} 
                                                        style={{ width: `${Math.min(metrics.pctAtingimentoAcessorio, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 text-sm">
                                                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                                        Aparelhos ({metrics.volAparelho} un)
                                                    </span>
                                                    <span className={`font-extrabold tabular-nums ${metrics.pctAtingimentoAparelho >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoAparelho.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            metrics.pctAtingimentoAparelho >= 100 ? 'bg-emerald-500' : metrics.pctAtingimentoAparelho >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                        }`} 
                                                        style={{ width: `${Math.min(metrics.pctAtingimentoAparelho, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* META 1: RECEITA */}
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 text-sm">
                                                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                                        Receita ({applyCurrencyMask(metrics.totalComissao)})
                                                    </span>
                                                    <span className={`font-extrabold tabular-nums ${metrics.pctAtingimento >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimento.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            metrics.pctAtingimento >= 100 ? 'bg-emerald-500' : metrics.pctAtingimento >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                        }`} 
                                                        style={{ width: `${Math.min(metrics.pctAtingimento, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* META 2: GROSS TOTAL */}
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 text-sm">
                                                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                                        Gross Móvel ({metrics.totalPos} un)
                                                    </span>
                                                    <span className={`font-extrabold tabular-nums ${metrics.pctAtingimentoPos >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoPos.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            metrics.pctAtingimentoPos >= 100 ? 'bg-emerald-500' : metrics.pctAtingimentoPos >= 80 ? 'bg-amber-500' : 'bg-[#E3000F]'
                                                        }`} 
                                                        style={{ width: `${Math.min(metrics.pctAtingimentoPos, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* META 3: RESIDENCIAL */}
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 text-sm">
                                                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                                        Residencial ({metrics.totalUr} un)
                                                    </span>
                                                    <span className={`font-extrabold tabular-nums ${metrics.pctAtingimentoUr >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#E3000F]'}`}>
                                                        {metrics.pctAtingimentoUr.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
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
                                    <span className={`text-xs sm:text-sm font-extrabold px-3 py-2 rounded-xl uppercase tracking-wider block ${
                                        metrics.elegivel 
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                            : 'bg-red-50 text-[#E3000F] dark:bg-red-950/40 dark:text-red-400'
                                    }`}>
                                        {metrics.elegivel ? '✓ Destravou Comissões' : '✗ Abaixo do Gatilho Mínimo'}
                                    </span>
                                </div>
                            </div>

                            {/* CARD 2: ACELERADORES E BÔNUS M-PLAY */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-extrabold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                                            <Zap size={17} className="text-[#E3000F]" /> Aceleradores M-Play
                                        </h3>
                                        <span className="text-xs font-extrabold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
                                            Multiplicador
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5 text-sm">
                                                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                                    Meta M-Play ({metrics.volMplay}/{metrics.metaMplay})
                                                </span>
                                                <span className={`font-extrabold tabular-nums ${metrics.pctAtingimentoMplay >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                    {metrics.pctAtingimentoMplay.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden mb-2">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-700 ${
                                                        metrics.pctAtingimentoMplay >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`} 
                                                    style={{ width: `${Math.min(metrics.pctAtingimentoMplay, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-snug font-medium">
                                                Fator aplicado: <strong className="text-neutral-900 dark:text-white font-extrabold">{metrics.fatorMultiplicador}x</strong> nas vendas combo com M-Play.
                                            </p>
                                        </div>

                                        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                                            <span className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400 block mb-0.5">
                                                Aporte no Run Rate
                                            </span>
                                            <div className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums">
                                                +{applyCurrencyMask(metrics.receitaExtraMplay || 0)}
                                            </div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                                                Receita adicional injetada pelo acelerador nas vendas elegíveis.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm">
                                    <span className="font-semibold text-neutral-600 dark:text-neutral-300">Bônus Excedente / Cargo:</span>
                                    <span className={`font-extrabold tabular-nums ${metrics.bonusUnitario > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`}>
                                        {metrics.bonusUnitario > 0 ? `+${applyCurrencyMask(metrics.bonusUnitario)}` : 'R$ 0,00'}
                                    </span>
                                </div>
                            </div>

                            {/* CARD 3: DICAS DE FOCO & RUN RATE */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-extrabold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                                            <TrendingUp size={17} className="text-[#E3000F]" /> Dicas de Alavancagem
                                        </h3>
                                        <span className="text-xs font-extrabold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
                                            Operação
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {metrics.pctAtingimento < 100 ? (
                                            <div className="p-3.5 bg-red-50/70 dark:bg-red-950/20 rounded-xl border border-red-200/50 dark:border-red-900/30">
                                                <h4 className="text-xs font-extrabold text-[#E3000F] uppercase tracking-wider mb-1">
                                                    Alavancagem de Receita
                                                </h4>
                                                <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed font-medium">
                                                    Priorize planos Pós com maior conectividade, combos Multi e venda agregada de Seguros e Acessórios para acelerar o run rate.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30">
                                                <h4 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                                                    Meta de Receita Superada!
                                                </h4>
                                                <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed font-medium">
                                                    Excelente ritmo. Mantenha as vendas ativas para maximizar o multiplicador nas faixas mais altas de comissão.
                                                </p>
                                            </div>
                                        )}

                                        {metrics.pctAtingimentoPos < 100 && (
                                            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                                                <h4 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-100 uppercase tracking-wider mb-1">
                                                    Portabilidade (+30%)
                                                </h4>
                                                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                                                    Traga clientes de outras operadoras: linhas portadas geram bônus direto de 30% sobre o plano ativado.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
                                    <span className="font-semibold">Volume Total:</span>
                                    <span className="font-extrabold text-neutral-900 dark:text-neutral-100">{metrics.totalVendas} vendas computadas</span>
                                </div>
                            </div>

                            {/* SEÇÃO: DETALHAMENTO DE COMPOSIÇÃO DE RECEITA */}
                            <div className="md:col-span-3 bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <h3 className="text-sm font-extrabold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <BarChart2 size={18} className="text-[#E3000F]" /> Composição da Receita Apurada
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                                        <span className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Portabilidades (+30%)</span>
                                        <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-100 mt-1 tabular-nums">
                                            {metrics.volPortabilidade} <span className="text-sm font-semibold text-neutral-500">linhas</span>
                                        </div>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 font-medium">
                                            Bônus de 30% aplicado sobre o valor do plano.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                                        <span className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Aparelhos & Seguros</span>
                                        <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-100 mt-1 tabular-nums">
                                            {metrics.volAparelho + metrics.volSeguro} <span className="text-sm font-semibold text-neutral-500">itens</span>
                                        </div>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 font-medium">
                                            Comissão: {applyCurrencyMask(metrics.comissaoAparelho + metrics.comissaoSeguro)}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                                        <span className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Planos PME / PJ</span>
                                        <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-100 mt-1 tabular-nums">
                                            {metrics.volPme} <span className="text-sm font-semibold text-neutral-500">planos</span>
                                        </div>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 font-medium">
                                            100% da receita soma na base de comissão.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                                        <span className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Ajustes de Operação</span>
                                        <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-100 mt-1 flex items-center gap-1.5">
                                            Ativo <CheckCircle2 size={20} className="text-emerald-500" />
                                        </div>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 font-medium">
                                            Upgrades (50%) e Sidegrades (25%) ajustados.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* SEÇÃO SIMPLES E ENXUTA: REGRAS DE ENQUADRAMENTO + LINK DIRETO PARA "FONTE" */}
                            <div className="md:col-span-3 bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-neutral-100 dark:border-neutral-800">
                                    <h3 className="text-sm font-extrabold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                                        <AlertCircle size={18} className="text-[#E3000F]" /> Regras de Enquadramento ({activeRegra.titulo})
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveSectionTab('FONTE')}
                                            className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
                                        >
                                            <BookOpen size={14} className="text-[#E3000F]" />
                                            <span>Ir para Aba FONTE</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenCargoPDF(activeRegra.pdfKey)}
                                            className="px-3.5 py-1.5 rounded-xl bg-[#E3000F] hover:bg-red-700 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                                        >
                                            <FileText size={14} />
                                            <span>PDF: {activeRegra.pdfFile}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200/60 dark:border-neutral-700/50">
                                        <span className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                            Piso Mínimo
                                        </span>
                                        <div className="text-base font-extrabold text-neutral-900 dark:text-white">
                                            80% de Atingimento
                                        </div>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-snug font-medium">
                                            Destrava o pagamento da comissão sobre a receita apurada ({activeRegra.baseApuracao}).
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200/60 dark:border-neutral-700/50">
                                        <span className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                            Faixas Base ({activeRegra.titulo})
                                        </span>
                                        <div className="text-xs sm:text-sm space-y-1 text-neutral-700 dark:text-neutral-200 font-semibold tabular-nums">
                                            {activeRegra.faixas.map((f) => (
                                                <div key={f.label} className="flex justify-between">
                                                    <span>{f.label}:</span>
                                                    <strong className="text-neutral-900 dark:text-white font-extrabold">{f.texto}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200/60 dark:border-neutral-700/50">
                                        <span className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                            Aceleração & Teto
                                        </span>
                                        <div className="text-base font-extrabold text-neutral-900 dark:text-white tabular-nums">
                                            Até 1.8x Multi • Teto {applyCurrencyMask(activeRegra.teto)}
                                        </div>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-snug font-medium">
                                            Multiplicador progressivo aplicado sobre planos combo e +30% em portabilidades.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
