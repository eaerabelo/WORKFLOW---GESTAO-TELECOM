import express from 'express';
import oracledb from 'oracledb';
import { getOracleConnection } from '../config/oracle.js';
import { STORES } from '../config/stores.js';

const router = express.Router();

// ============================================================================
// VALIDAÇÕES E COMANDOS DE DADOS DA PÁGINA DE PERFIL (BACKEND)
// ============================================================================
const calculateAgeFromDate = (birthDateStr) => {
    if (!birthDateStr) return '';
    let year, month, day;
    if (birthDateStr.includes('-')) {
        [year, month, day] = birthDateStr.split('-').map(Number);
    } else if (birthDateStr.includes('/')) {
        [day, month, year] = birthDateStr.split('/').map(Number);
    }
    if (!year || !month || !day || year < 1920) return '';
    const today = new Date();
    let age = today.getFullYear() - year;
    const m = (today.getMonth() + 1) - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
        age--;
    }
    return age >= 0 && age <= 120 ? String(age) : '';
};

const validateProfilePayload = (payload = {}) => {
    const errors = [];
    const clean = {
        name: String(payload.name || '').trim().toUpperCase(),
        birthDate: String(payload.birthDate || '').trim(),
        age: String(payload.age || '').trim(),
        phone: String(payload.phone || '').trim(),
        email: String(payload.email || '').trim().toLowerCase(),
        address: String(payload.address || '').trim(),
        addressNumber: String(payload.addressNumber || '').trim(),
        neighborhood: String(payload.neighborhood || '').trim(),
        city: String(payload.city || '').trim(),
        state: String(payload.state || '').trim().toUpperCase().slice(0, 2),
        cep: String(payload.cep || '').trim(),
        uniformShirt: String(payload.uniformShirt || '').trim().toUpperCase(),
        uniformPants: String(payload.uniformPants || '').trim().toUpperCase(),
        uniformJacket: String(payload.uniformJacket || '').trim().toUpperCase(),
        bio: String(payload.bio || '').trim().slice(0, 300),
        admissionDate: String(payload.admissionDate || '').trim(),
        specialty: String(payload.specialty || '').trim(),
        featuredIndicator: String(payload.featuredIndicator || '').trim(),
        featuredPeriod: String(payload.featuredPeriod || '').trim(),
        featuredNote: String(payload.featuredNote || '').trim().slice(0, 240),
        photoUrl: String(payload.photoUrl || '').trim()
    };

    if (!clean.name || clean.name.length < 2) {
        errors.push('O nome completo deve possuir pelo menos 2 caracteres.');
    }

    if (clean.birthDate) {
        const computedAge = calculateAgeFromDate(clean.birthDate);
        if (computedAge) {
            clean.age = computedAge;
        }
    }

    if (clean.age && (isNaN(Number(clean.age)) || Number(clean.age) < 14 || Number(clean.age) > 100)) {
        errors.push('A idade informada deve ser um número válido entre 14 e 100.');
    }

    if (clean.photoUrl && clean.photoUrl.length > 1500000) {
        errors.push('A foto selecionada é muito grande. Utilize uma imagem de até 1 MB.');
    }

    return { isValid: errors.length === 0, errors, data: clean };
};

// ============================================================================
// MOTOR DE DESTAQUES DO VENDEDOR AO LONGO DO ANO / MÊS
// ============================================================================
const MONTH_NAMES = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
};

const formatPeriodLabel = (yyyyMm) => {
    if (!yyyyMm || !yyyyMm.includes('-')) return yyyyMm || ' Ciclo Anual';
    const [yyyy, mm] = yyyyMm.split('-');
    return `${MONTH_NAMES[mm] || mm}/${yyyy}`;
};

const buildSellerHighlights = (salesRows = [], sellerName = '', savedProfile = {}) => {
    const normalizedSeller = String(sellerName || '').trim().toUpperCase();
    const firstSellerName = normalizedSeller.split(' ')[0];

    const byMonth = {};
    const totals = {
        receita: 0,
        posPago: 0,
        controle: 0,
        fibra: 0,
        tv: 0,
        devices: 0,
        adicionais: 0,
        portabilidade: 0,
        ativacoes: 0,
        migracoes: 0,
        totalVendas: 0
    };

    salesRows.forEach((raw) => {
        let sale = raw;
        if (typeof raw === 'string') {
            try { sale = JSON.parse(raw); } catch (e) { return; }
        }
        const vName = String(sale?.vendedor || '').trim().toUpperCase();
        if (!vName) return;
        if (vName !== normalizedSeller && vName.split(' ')[0] !== firstSellerName) return;

        // Extrai YYYY-MM
        let yyyyMm = 'Geral';
        const d = String(sale.data || '');
        if (d.includes('/')) {
            const parts = d.split('/');
            if (parts.length === 3) {
                const yr = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                yyyyMm = `${yr}-${parts[1].padStart(2, '0')}`;
            }
        } else if (d.includes('-')) {
            yyyyMm = d.slice(0, 7);
        }

        if (!byMonth[yyyyMm]) {
            byMonth[yyyyMm] = {
                receita: 0, posPago: 0, controle: 0, fibra: 0, tv: 0,
                devices: 0, adicionais: 0, portabilidade: 0
            };
        }

        const q = Number(sale.qtda) || 1;
        const rec = Number(sale.receita) || 0;
        const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
        const op = String(sale.tipoOperacao || '').toUpperCase();
        const port = String(sale.portabilidade || '').toUpperCase() === 'SIM';
        const adds = Array.isArray(sale.adicionais) ? sale.adicionais : [];

        totals.totalVendas += q;
        totals.receita += rec;
        byMonth[yyyyMm].receita += rec;

        if (pBase.includes('CONTROLE')) {
            totals.controle += q;
            byMonth[yyyyMm].controle += q;
        } else if (pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('DEPENDENTE') || pBase.includes('FLEX')) {
            totals.posPago += q;
            byMonth[yyyyMm].posPago += q;
        } else if (pBase.includes('FIBRA')) {
            totals.fibra += q;
            byMonth[yyyyMm].fibra += q;
        } else if (pBase.includes('TV')) {
            totals.tv += q;
            byMonth[yyyyMm].tv += q;
        } else if (pBase.includes('APARELHO') || pBase.includes('ACESS') || pBase.includes('PELICULA')) {
            totals.devices += q;
            byMonth[yyyyMm].devices += q;
        }

        if (pBase.includes('SEGURO') || pBase.includes('MESH') || adds.length > 0 || sale.mplay === 'SIM') {
            totals.adicionais += 1;
            byMonth[yyyyMm].adicionais += 1;
        }

        if (port) {
            totals.portabilidade += q;
            byMonth[yyyyMm].portabilidade += q;
        }
        if (op === 'ATIVAÇÃO' || op === 'ATIVACAO') totals.ativacoes += q;
        if (op === 'MIGRAÇÃO' || op === 'MIGRACAO') totals.migracoes += q;
    });

    // Encontra o melhor mês de cada indicador
    const findBestMonth = (key) => {
        let bestMonth = '';
        let bestVal = 0;
        Object.entries(byMonth).forEach(([m, vals]) => {
            if ((vals[key] || 0) > bestVal) {
                bestVal = vals[key];
                bestMonth = m;
            }
        });
        return { month: formatPeriodLabel(bestMonth), value: bestVal };
    };

    const bestReceita = findBestMonth('receita');
    const bestPos = findBestMonth('posPago');
    const bestFibra = findBestMonth('fibra');
    const bestDevices = findBestMonth('devices');
    const bestPort = findBestMonth('portabilidade');
    const bestAdicionais = findBestMonth('adicionais');

    const currentYear = new Date().getFullYear();

    // Calcula também o total da loja por indicador para medir onde o vendedor tem maior domínio / destaque
    const storeTotals = {
        receita: 0,
        posTotal: 0,
        urTotal: 0,
        portabilidade: 0,
        devicesAdicionais: 0
    };

    salesRows.forEach((raw) => {
        let sale = raw;
        if (typeof raw === 'string') {
            try { sale = JSON.parse(raw); } catch (e) { return; }
        }
        if (!sale || !sale.vendedor) return;
        const q = Number(sale.qtda) || 1;
        const rec = Number(sale.receita) || 0;
        const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
        const port = String(sale.portabilidade || '').toUpperCase() === 'SIM';
        const adds = Array.isArray(sale.adicionais) ? sale.adicionais : [];

        storeTotals.receita += rec;
        if (pBase.includes('CONTROLE') || pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('DEPENDENTE') || pBase.includes('FLEX')) {
            storeTotals.posTotal += q;
        } else if (pBase.includes('FIBRA') || pBase.includes('TV')) {
            storeTotals.urTotal += q;
        } else if (pBase.includes('APARELHO') || pBase.includes('ACESS') || pBase.includes('PELICULA')) {
            storeTotals.devicesAdicionais += q;
        }
        if (pBase.includes('SEGURO') || pBase.includes('MESH') || adds.length > 0 || sale.mplay === 'SIM') {
            storeTotals.devicesAdicionais += 1;
        }
        if (port) storeTotals.portabilidade += q;
    });

    const sellerPosTotal = totals.posPago + totals.controle;
    const sellerUrTotal = totals.fibra + totals.tv;
    const sellerDevicesTotal = totals.devices + totals.adicionais;

    // Pontuação relativa de cada categoria para eleger automaticamente onde o colaborador é melhor
    const candidates = [
        {
            id: 'pos_total',
            score: storeTotals.posTotal > 0 ? (sellerPosTotal / storeTotals.posTotal) * 100 + (sellerPosTotal * 2) : sellerPosTotal * 10,
            hasData: sellerPosTotal > 0,
            indicator: 'CAMPEÃO EM GROSS MÓVEL (PÓS & CONTROLE)',
            specialty: 'Especialista em Planos Pós-Pago, Controle & Blindagem Móvel',
            period: bestPos.value > 0 ? bestPos.month : `Temporada ${currentYear}`,
            note: `Preenchido automaticamente: Melhor desempenho registrado em Gross Móvel com ${sellerPosTotal} linhas ativadas/migradas (${totals.posPago} Pós e ${totals.controle} Controle) e pico no período de ${bestPos.month || currentYear}.`
        },
        {
            id: 'ur_fibra',
            score: storeTotals.urTotal > 0 ? (sellerUrTotal / storeTotals.urTotal) * 100 + (sellerUrTotal * 2.5) : sellerUrTotal * 12,
            hasData: sellerUrTotal > 0,
            indicator: 'REFERÊNCIA EM UR RESIDENCIAL (FIBRA & TV)',
            specialty: 'Especialista em Conectividade Fixa, Fibra & TV Box',
            period: bestFibra.value > 0 ? bestFibra.month : `Temporada ${currentYear}`,
            note: `Preenchido automaticamente: Destaque na comercialização de produtos residenciais com ${sellerUrTotal} instalações (Fibra e TV) e melhor marca em ${bestFibra.month || currentYear}.`
        },
        {
            id: 'portabilidade',
            score: storeTotals.portabilidade > 0 ? (totals.portabilidade / storeTotals.portabilidade) * 105 + (totals.portabilidade * 3) : totals.portabilidade * 14,
            hasData: totals.portabilidade > 0,
            indicator: 'LÍDER EM PORTABILIDADE & ATIVAÇÕES',
            specialty: 'Especialista em Portabilidade Numérica & Conquista de Clientes',
            period: bestPort.value > 0 ? bestPort.month : `Temporada ${currentYear}`,
            note: `Preenchido automaticamente: Alta conversão trazendo ${totals.portabilidade} linhas da concorrência via Portabilidade e ${totals.ativacoes} ativações diretas.`
        },
        {
            id: 'devices_adicionais',
            score: storeTotals.devicesAdicionais > 0 ? (sellerDevicesTotal / storeTotals.devicesAdicionais) * 100 + (sellerDevicesTotal * 2.2) : sellerDevicesTotal * 11,
            hasData: sellerDevicesTotal > 0,
            indicator: 'TOP PERFORMER EM DEVICES, SEGURO & CLARO UP',
            specialty: 'Especialista em Aparelhos, Acessórios, Seguro & Claro Up',
            period: (bestDevices.value > 0 ? bestDevices.month : (bestAdicionais.value > 0 ? bestAdicionais.month : `Temporada ${currentYear}`)),
            note: `Preenchido automaticamente: Excelência em venda consultiva com ${totals.devices} devices comercializados e ${totals.adicionais} serviços adicionais (Seguro, Trocafy, Claro Up e M-Play).`
        },
        {
            id: 'receita',
            score: storeTotals.receita > 0 ? (totals.receita / storeTotals.receita) * 98 : (totals.receita > 0 ? 50 : 0),
            hasData: totals.receita > 0,
            indicator: 'DESTAQUE EM RECEITA & TICKET MÉDIO',
            specialty: 'Consultoria de Alto Valor & Rentabilidade de Carteira',
            period: bestReceita.value > 0 ? bestReceita.month : `Temporada ${currentYear}`,
            note: `Preenchido automaticamente: Geração acumulada de R$ ${totals.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} em receita, com recorde mensal de R$ ${bestReceita.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} em ${bestReceita.month || currentYear}.`
        }
    ];

    const activeCandidates = candidates.filter(c => c.hasData).sort((a, b) => b.score - a.score);
    const winner = activeCandidates[0] || null;

    const topSpotlight = winner
        ? {
            id: winner.id,
            indicator: winner.indicator,
            specialty: winner.specialty,
            period: winner.period,
            note: winner.note
        }
        : {
            id: 'global',
            indicator: 'PERFORMANCE GLOBAL & ATENDIMENTO CONSULTIVO',
            specialty: 'Consultoria Completa (Móvel, Fibra & Devices)',
            period: `Temporada ${currentYear}`,
            note: 'Categoria calculada automaticamente conforme os indicadores de vendas são preenchidos no sistema.'
        };

    const badges = [
        {
            id: 'receita',
            title: 'Destaque em Receita & Rentabilidade',
            indicator: 'RECEITA MENSAL',
            period: bestReceita.value > 0 ? bestReceita.month : `Ciclo ${currentYear}`,
            metricLabel: bestReceita.value > 0
                ? `R$ ${bestReceita.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} no melhor mês`
                : 'Aguardando lançamentos de receita no período',
            tier: topSpotlight.id === 'receita' ? '★ MELHOR INDICADOR' : 'DIAMANTE',
            active: bestReceita.value > 0,
            isTop: topSpotlight.id === 'receita'
        },
        {
            id: 'pos_total',
            title: 'Especialista em Planos Pós & Controle',
            indicator: 'GROSS MÓVEL (PÓS & CONTROLE)',
            period: bestPos.value > 0 ? bestPos.month : `Ciclo ${currentYear}`,
            metricLabel: sellerPosTotal > 0
                ? `${sellerPosTotal} linhas ativadas/migradas no acumulado`
                : 'Aguardando lançamentos de Pós e Controle',
            tier: topSpotlight.id === 'pos_total' ? '★ MELHOR INDICADOR' : 'OURO',
            active: sellerPosTotal > 0,
            isTop: topSpotlight.id === 'pos_total'
        },
        {
            id: 'ur_fibra',
            title: 'Referência em Conectividade & UR Residencial',
            indicator: 'FIBRA & TV BOX (UR)',
            period: bestFibra.value > 0 ? bestFibra.month : `Ciclo ${currentYear}`,
            metricLabel: sellerUrTotal > 0
                ? `${sellerUrTotal} instalações residenciais comercializadas`
                : 'Aguardando lançamentos de Fibra e TV',
            tier: topSpotlight.id === 'ur_fibra' ? '★ MELHOR INDICADOR' : 'ELITE',
            active: sellerUrTotal > 0,
            isTop: topSpotlight.id === 'ur_fibra'
        },
        {
            id: 'portabilidade',
            title: 'Embaixador de Portabilidade & Conquista',
            indicator: 'PORTABILIDADE NUMÉRICA',
            period: bestPort.value > 0 ? bestPort.month : `Ciclo ${currentYear}`,
            metricLabel: totals.portabilidade > 0
                ? `${totals.portabilidade} clientes trazidos da concorrência`
                : 'Aguardando lançamentos de Portabilidade',
            tier: topSpotlight.id === 'portabilidade' ? '★ MELHOR INDICADOR' : 'PLATINA',
            active: totals.portabilidade > 0,
            isTop: topSpotlight.id === 'portabilidade'
        },
        {
            id: 'devices_adicionais',
            title: 'Consultor Completo em Devices & Serviços',
            indicator: 'DEVICES, SEGURO & CLARO UP',
            period: (bestDevices.value > 0 ? bestDevices.month : (bestAdicionais.value > 0 ? bestAdicionais.month : `Ciclo ${currentYear}`)),
            metricLabel: sellerDevicesTotal > 0
                ? `${totals.devices} devices e ${totals.adicionais} serviços agregados`
                : 'Aguardando lançamentos de Aparelhos e Adicionais',
            tier: topSpotlight.id === 'devices_adicionais' ? '★ MELHOR INDICADOR' : 'DESTAQUE',
            active: sellerDevicesTotal > 0,
            isTop: topSpotlight.id === 'devices_adicionais'
        }
    ];

    return {
        totals,
        topSpotlight,
        badges
    };
};

// ============================================================================
// ROTAS DA PÁGINA DE PERFIL
// ============================================================================
router.get('/', async (req, res) => {
    const username = String(req.query.username || req.user?.username || '').trim().toUpperCase();
    const storeId = String(req.query.storeId || req.headers['x-store-id'] || req.user?.storeId || 'shopping_raposo').trim();

    let conn;
    try {
        conn = await getOracleConnection();

        // 1. Busca dados básicos na tabela USUARIOS
        const userResult = await conn.execute(
            `SELECT USERNAME, NAME, ROLE, EMAIL, BIRTH_DATE, PHONE, STORE_ID FROM USUARIOS WHERE UPPER(USERNAME) = :u`,
            { u: username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const dbUser = (userResult.rows && userResult.rows[0]) ? userResult.rows[0] : {};

        // 2. Busca dados enriquecidos do perfil em CONFIGURACOES
        const cfgResult = await conn.execute(
            `SELECT DOCUMENT_DATA FROM CONFIGURACOES WHERE STORE_ID = :s`,
            { s: storeId },
            { fetchInfo: { DOCUMENT_DATA: { type: oracledb.STRING } } }
        );

        let configObj = {};
        if (cfgResult.rows && cfgResult.rows.length > 0 && cfgResult.rows[0].DOCUMENT_DATA) {
            try { configObj = JSON.parse(cfgResult.rows[0].DOCUMENT_DATA); } catch (e) {}
        }

        const savedProfiles = configObj.profilesDB || {};
        const savedProfile = savedProfiles[username] || {};

        // 3. Busca vendas da loja para calcular os Destaques Reais do colaborador ao longo do ano/mês
        const salesResult = await conn.execute(
            `SELECT DOCUMENT_DATA FROM VENDAS WHERE STORE_ID = :s`,
            { s: storeId },
            { fetchInfo: { DOCUMENT_DATA: { type: oracledb.STRING } } }
        );
        const salesDocs = (salesResult.rows || []).map(r => r.DOCUMENT_DATA);

        const resolvedName = savedProfile.name || dbUser.NAME || req.user?.name || username;
        const resolvedBirthDate = savedProfile.birthDate || dbUser.BIRTH_DATE || '';
        const resolvedAge = savedProfile.age || calculateAgeFromDate(resolvedBirthDate) || '';
        const resolvedStoreId = storeId;
        const matchedStore = STORES.find(s => s.id === resolvedStoreId) || { name: 'LP RAPOSO', code: 'K7W8' };

        const highlights = buildSellerHighlights(salesDocs, resolvedName, savedProfile);

        const profileData = {
            username,
            name: resolvedName,
            role: dbUser.ROLE || req.user?.role || 'COLABORADOR',
            storeId: resolvedStoreId,
            storeName: String(matchedStore.name || '').replace(/SHOPPING/gi, 'LP'),
            storeCode: matchedStore.code || '',
            birthDate: resolvedBirthDate,
            age: resolvedAge,
            phone: savedProfile.phone || dbUser.PHONE || '',
            email: savedProfile.email || dbUser.EMAIL || '',
            address: savedProfile.address || '',
            addressNumber: savedProfile.addressNumber || '',
            neighborhood: savedProfile.neighborhood || '',
            city: savedProfile.city || 'São Paulo',
            state: savedProfile.state || 'SP',
            cep: savedProfile.cep || '',
            uniformShirt: savedProfile.uniformShirt || '',
            uniformPants: savedProfile.uniformPants || '',
            uniformJacket: savedProfile.uniformJacket || '',
            bio: savedProfile.bio || 'Focado em excelência no atendimento, metas superadas e encantamento do cliente.',
            admissionDate: savedProfile.admissionDate || '',
            specialty: highlights.topSpotlight?.specialty || savedProfile.specialty || 'Consultoria Completa (Móvel, Fibra & Devices)',
            featuredIndicator: highlights.topSpotlight?.indicator || '',
            featuredPeriod: highlights.topSpotlight?.period || '',
            featuredNote: highlights.topSpotlight?.note || '',
            photoUrl: savedProfile.photoUrl || ''
        };

        res.json({
            success: true,
            profile: profileData,
            highlights
        });
    } catch (err) {
        console.error('Erro ao carregar perfil (profile.js):', err);
        res.status(500).json({ error: 'Erro ao carregar informações do perfil.' });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (e) {}
        }
    }
});

router.post('/save', async (req, res) => {
    const username = String(req.body.username || req.user?.username || '').trim().toUpperCase();
    const storeId = String(req.body.storeId || req.headers['x-store-id'] || req.user?.storeId || 'shopping_raposo').trim();

    if (!username) {
        return res.status(400).json({ error: 'Identificador de usuário ausente.' });
    }

    const validation = validateProfilePayload(req.body.profile || req.body);
    if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }

    let conn;
    try {
        conn = await getOracleConnection();

        // 0. Busca o nome anterior na tabela USUARIOS para migrar histórico caso o nome seja alterado
        const prevUserRes = await conn.execute(
            `SELECT NAME FROM USUARIOS WHERE UPPER(USERNAME) = :u`,
            { u: username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const oldDbName = (prevUserRes.rows && prevUserRes.rows[0] && prevUserRes.rows[0].NAME)
            ? String(prevUserRes.rows[0].NAME).trim()
            : '';

        // 1. Atualiza campos básicos na tabela USUARIOS se o registro existir (tolerante a colunas)
        try {
            await conn.execute(
                `UPDATE USUARIOS
                 SET NAME = :name,
                     EMAIL = COALESCE(NULLIF(:email, ''), EMAIL),
                     BIRTH_DATE = COALESCE(NULLIF(:birthDate, ''), BIRTH_DATE),
                     PHONE = COALESCE(NULLIF(:phone, ''), PHONE)
                 WHERE UPPER(USERNAME) = :u`,
                {
                    name: validation.data.name || null,
                    email: validation.data.email || null,
                    birthDate: validation.data.birthDate || null,
                    phone: validation.data.phone || null,
                    u: username
                },
                { autoCommit: true }
            );
        } catch (userUpErr) {
            console.warn('Aviso: Não foi possível atualizar tabela USUARIOS (tentando update simples):', userUpErr.message);
            try {
                await conn.execute(
                    `UPDATE USUARIOS SET NAME = :name WHERE UPPER(USERNAME) = :u`,
                    { name: validation.data.name || null, u: username },
                    { autoCommit: true }
                );
            } catch (ignoreErr) {}
        }

        // 2. Salva os dados completos de perfil em CONFIGURACOES (profilesDB)
        const cfgResult = await conn.execute(
            `SELECT DOCUMENT_DATA FROM CONFIGURACOES WHERE STORE_ID = :s`,
            { s: storeId },
            { fetchInfo: { DOCUMENT_DATA: { type: oracledb.STRING } } }
        );

        let configObj = {};
        if (cfgResult.rows && cfgResult.rows.length > 0 && cfgResult.rows[0].DOCUMENT_DATA) {
            try { configObj = JSON.parse(cfgResult.rows[0].DOCUMENT_DATA); } catch (e) {}
        }

        if (!configObj.profilesDB) configObj.profilesDB = {};
        const prevSavedProfile = configObj.profilesDB[username] || {};
        const oldSavedName = prevSavedProfile.name ? String(prevSavedProfile.name).trim() : '';
        const newName = String(validation.data.name || '').trim();

        const previousNamesSet = new Set(Array.isArray(prevSavedProfile.previousNames) ? prevSavedProfile.previousNames : []);
        if (oldDbName && oldDbName.toUpperCase() !== newName.toUpperCase()) {
            previousNamesSet.add(oldDbName);
        }
        if (oldSavedName && oldSavedName.toUpperCase() !== newName.toUpperCase()) {
            previousNamesSet.add(oldSavedName);
        }
        const previousNames = [...previousNamesSet];

        // Se houve troca de nome, atualiza Vendas, Reprovados e Escalas no banco para não duplicar card na Visão 360
        let migratedSales = false;
        let migratedReprovados = false;
        if (previousNames.length > 0 && newName) {
            const oldNamesUpper = new Set(previousNames.map(n => String(n).trim().toUpperCase()));

            // Migra VENDAS da loja
            const salesRowsRes = await conn.execute(
                `SELECT ID, DOCUMENT_DATA FROM VENDAS WHERE STORE_ID = :s`,
                { s: storeId },
                { fetchInfo: { DOCUMENT_DATA: { type: oracledb.STRING } } }
            );
            for (const row of (salesRowsRes.rows || [])) {
                try {
                    const doc = typeof row.DOCUMENT_DATA === 'string' ? JSON.parse(row.DOCUMENT_DATA) : row.DOCUMENT_DATA;
                    if (doc && doc.vendedor && oldNamesUpper.has(String(doc.vendedor).trim().toUpperCase())) {
                        doc.vendedor = newName;
                        await conn.execute(
                            `UPDATE VENDAS SET DOCUMENT_DATA = :doc WHERE ID = :id AND STORE_ID = :s`,
                            { 
                                doc: { type: oracledb.CLOB, dir: oracledb.BIND_IN, val: JSON.stringify(doc) }, 
                                id: row.ID, 
                                s: storeId 
                            },
                            { autoCommit: true }
                        );
                        migratedSales = true;
                    }
                } catch (e) {}
            }

            // Migra REPROVADOS da loja
            const repRowsRes = await conn.execute(
                `SELECT ID, DOCUMENT_DATA FROM REPROVADOS WHERE STORE_ID = :s`,
                { s: storeId },
                { fetchInfo: { DOCUMENT_DATA: { type: oracledb.STRING } } }
            );
            for (const row of (repRowsRes.rows || [])) {
                try {
                    const doc = typeof row.DOCUMENT_DATA === 'string' ? JSON.parse(row.DOCUMENT_DATA) : row.DOCUMENT_DATA;
                    if (doc && doc.vendedor && oldNamesUpper.has(String(doc.vendedor).trim().toUpperCase())) {
                        doc.vendedor = newName;
                        await conn.execute(
                            `UPDATE REPROVADOS SET DOCUMENT_DATA = :doc WHERE ID = :id AND STORE_ID = :s`,
                            { 
                                doc: { type: oracledb.CLOB, dir: oracledb.BIND_IN, val: JSON.stringify(doc) }, 
                                id: row.ID, 
                                s: storeId 
                            },
                            { autoCommit: true }
                        );
                        migratedReprovados = true;
                    }
                } catch (e) {}
            }
        }

        configObj.profilesDB[username] = {
            ...prevSavedProfile,
            ...validation.data,
            previousNames,
            updatedAt: new Date().toISOString()
        };

        const jsonStr = JSON.stringify(configObj);
        await conn.execute(
            `MERGE INTO CONFIGURACOES c
             USING (SELECT :s AS STORE_ID FROM dual) src
             ON (c.STORE_ID = src.STORE_ID)
             WHEN MATCHED THEN
               UPDATE SET c.DOCUMENT_DATA = :doc
             WHEN NOT MATCHED THEN
               INSERT (ID, STORE_ID, DOCUMENT_DATA) VALUES ('config', :s, :doc)`,
            { 
                s: storeId, 
                doc: { type: oracledb.CLOB, dir: oracledb.BIND_IN, val: jsonStr } 
            },
            { autoCommit: true }
        );

        const io = req.app.get('io');
        if (io) {
            io.emit('config-atualizada', storeId);
            if (migratedSales) io.emit('vendas-atualizadas', storeId);
            if (migratedReprovados) io.emit('reprovados-atualizados', storeId);
        }

        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso!',
            profile: configObj.profilesDB[username]
        });
    } catch (err) {
        console.error('Erro ao salvar perfil (profile.js):', err);
        res.status(500).json({ 
            error: err.message ? `Erro ao salvar perfil: ${err.message}` : 'Erro interno ao salvar os dados do perfil.' 
        });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (e) {}
        }
    }
});

export default router;
