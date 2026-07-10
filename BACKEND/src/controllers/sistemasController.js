export const getSistemas = async (req, res) => {
    try {
        const ALL_LINKS = [
            { name: 'SIMPLIFICA', url: 'https://vendasapp.operadora.com.br/SVCv2/posicionamento/resultado-pesquisa' },
            { name: 'IW', url: 'https://iw.operadora.com.br/v2/wvd/lojapropria/atendersenhas' },
            { name: 'SOLAR', url: 'https://cec.operadora.com.br/' },
            { name: 'MOBILE', url: 'http://mtaweb.operadora.com.br:20010/docroot/login/login.jsp' },
            { name: 'ESTOQUE', url: 'http://operadoraunifica/portal/' },
            { name: 'NET-SALES', url: 'https://netsalesapp.operadora.com.br/' },
            { name: 'NET-SMS', url: 'https://netsmsapp.operadora.com.br/Citrix/NetsmsEPSWeb/' },
            { name: 'GED 2.0', url: 'https://www.novoged.operadora.com.br/login' },
            { name: 'SIMULADOR', url: 'https://produtos.operadora.com.br/simular-precos' },
            { name: 'CONEXÃO', url: 'https://app.conexaooperadorabrasil.com.br/login?' },
            { name: 'NEGOCIA FACIL', url: 'https://operadora.negociafacil.com.br/' },
            { name: 'FLEX', url: 'https://flex.operadora.com.br' },
            { name: 'PS8', url: 'http://ps8web:8080/psp/p01ps1/?cmd=login&languageCd=POR' },
            { name: 'AUTENTICA', url: 'https://link.brsafe.com.br/#/' },
            { name: 'WPP-PRE-PAGO', url: 'https://wppnacional.operadora.com.br/wpp/login.jsp' },
            { name: 'FEV', url: 'http://feu.operadora.com.br/portal/site/vendas/Autenticador' },
            { name: 'TROCAFY', url: 'https://sav.wooza.com.br/operadora/negotiations-exchanges/negotiations-trade-in' },
            { name: 'SPS WEB', url: 'https://spsweb.operadora.com.br/' },
            { name: 'PORTAL RCV', url: 'https://atendchat.operadora.com.br/RCV/login/' },
            { name: 'IGA (IBM)', url: 'https://iga-operadora.identitynow.com/ui/d/mysailpoint' },
            { name: 'PORTAL CONTROLE', url: 'http://auto-controle/autocontrole/login.jsp' },
            { name: 'CLUBE DE VANTAGENS', url: 'http://clube/home.jsp?mensagem=' },
            { name: 'GED ANTIGO', url: 'https://ged.operadora.com.br/autenticar.php' },
            { name: 'PORTAL OPERADORA', url: 'http://portaloperadorabrasil/' },
            { name: 'CEMI', url: 'https://cemi/mudancastatus/jsp/login.jsp' },
            { name: 'RH SOLUTIONS', url: 'https://portalrh.operadora.com.br/ords/rhportal/rhlgweb.show' },
            { name: 'CONEXÃO APRENDER', url: 'https://hdim.fa.us2.oraclecloud.com/fscmUI/redwood/learner/learn/browse-learning-items' },
            { name: 'RCV PRIORIDADES', url: 'https://atendchat.operadora.com.br/RCV-prioridades/' },
            { name: 'CADASTRO PRÉ-PAGO', url: 'https://www.operadora.com.br/cadastroprepago/login-telefone' },
            { name: 'MINHA EMPRESA', url: 'https://minhaempresas.operadora.com.br/' },
            { name: 'MINHA OPERADORA', url: 'https://auth.operadora.com.br/authorize?client_id=INT_AA_PORTALUNICO&response_type=code&scope=openid+minha_operadora_dig+minha_net+net_devices+net_profile&redirect_uri=https%3A%2F%2Foperadora.com.br%2Fminha%2Farea-logada%2Fauth%2Fcallback&grant_type=authorization_code&nonce=abc123' }
        ];

        // Ensure unique and sort alphabetically 
        const uniqueLinks = Array.from(new Map(ALL_LINKS.map(item => [item.name, item])).values());
        uniqueLinks.sort((a, b) => a.name.localeCompare(b.name));

        res.status(200).json(uniqueLinks);
    } catch (error) {
        console.error('Erro ao buscar links de sistemas:', error);
        res.status(500).json({ error: 'Erro interno ao buscar sistemas.' });
    }
};


export const getPricing = async (req, res) => {
    try {
        const DEFAULT_PRICING = {
            lastUpdated: Date.now(),
            movel: [
                { id: 'm1', nome: 'Controle 41GB', valor: 59.90, valorMulti: 49.90, valorMulti3p: 49.90 },
                { id: 'm2', nome: 'Controle 46GB', valor: 69.90, valorMulti: 69.90, valorMulti3p: 69.90 },
                { id: 'm3', nome: 'Controle 46GB Gaming', valor: 99.90, valorMulti: 99.90, valorMulti3p: 99.90 },
                { id: 'm4', nome: 'Pós 60GB', valor: 124.90, valorMulti: 59.90, valorMulti3p: 59.90 },
                { id: 'm5', nome: 'Pós 50GB Gaming', valor: 164.90, valorMulti: 120.00, valorMulti3p: 120.00 },
                { id: 'm6', nome: 'Pós 100GB', valor: 179.90, valorMulti: 125.00, valorMulti3p: 125.00 },
                { id: 'm7', nome: 'Pós 150GB', valor: 239.90, valorMulti: 180.00, valorMulti3p: 180.00 },
                { id: 'm8', nome: 'Pós 200GB', valor: 339.90, valorMulti: 240.00, valorMulti3p: 240.00 },
                { id: 'm9', nome: 'Pós 500GB', valor: 849.90, valorMulti: 800.00, valorMulti3p: 800.00 },
                { id: 'm10', nome: 'Dependente Gratuito', valor: 0.00, valorMulti: 0.00, valorMulti3p: 0.00 },
                { id: 'm11', nome: 'Dependente Pago', valor: 55.00, valorMulti: 55.00, valorMulti3p: 55.00 },
                { id: 'm12', nome: 'Dependente BL', valor: 29.90, valorMulti: 29.90, valorMulti3p: 29.90 },
                { id: 'm13', nome: 'Seguro R$ 14,00', valor: 14.00, valorMulti: 14.00, valorMulti3p: 14.00 },
                { id: 'm14', nome: 'Seguro R$ 18,00', valor: 18.00, valorMulti: 18.00, valorMulti3p: 18.00 },
                { id: 'm15', nome: 'Seguro R$ 22,00', valor: 22.00, valorMulti: 22.00, valorMulti3p: 22.00 },
                { id: 'm16', nome: 'Seguro R$ 24,00', valor: 24.00, valorMulti: 24.00, valorMulti3p: 24.00 }
            ],
            residencial: [
                { id: 'r1', nome: 'Banda Larga 250 Mega', valor: 99.90, valorMulti: 99.90, valorMulti3p: 99.90 },
                { id: 'r2', nome: 'Banda Larga 500 Mega', valor: 119.90, valorMulti: 99.90, valorMulti3p: 99.90 },
                { id: 'r3', nome: 'Banda Larga 1 Giga', valor: 199.90, valorMulti: 149.90, valorMulti3p: 149.90 },
                { id: 'r4', nome: 'Banda Larga 5 Giga', valor: 499.90, valorMulti: 449.90, valorMulti3p: 449.90 },
                { id: 'r5', nome: 'Banda Larga 10 Giga', valor: 1999.90, valorMulti: 1949.90, valorMulti3p: 1949.90 },
                { id: 'r6', nome: 'TV Box', valor: 134.90, valorMulti: 124.90, valorMulti3p: 99.90 },
                { id: 'r7', nome: 'TV Box Cabo', valor: 164.90, valorMulti: 154.90, valorMulti3p: 154.90 },
                { id: 'r8', nome: 'TV Soundbox', valor: 174.90, valorMulti: 174.90, valorMulti3p: 174.90 },
                { id: 'r9', nome: 'Fixo Mundo', valor: 65.00, valorMulti: 65.00, valorMulti3p: 65.00 },
                { id: 'r10', nome: 'Fixo Brasil', valor: 35.00, valorMulti: 35.00, valorMulti3p: 35.00 },
                { id: 'r11', nome: 'Fixo Multi 3P', valor: 5.00, valorMulti: 5.00, valorMulti3p: 5.00 },
                { id: 'r12', nome: 'Mesh 1UN', valor: 15.00, valorMulti: 15.00, valorMulti3p: 15.00 },
                { id: 'r13', nome: 'Mesh 2UN', valor: 30.00, valorMulti: 30.00, valorMulti3p: 30.00 },
                { id: 'r14', nome: 'Mesh 3UN', valor: 45.00, valorMulti: 45.00, valorMulti3p: 45.00 },
                { id: 'r15', nome: 'Mesh 4UN', valor: 60.00, valorMulti: 60.00, valorMulti3p: 60.00 }
            ]
        };

        const METAS_PADRAO = {
            receita: 15000.00, posTotal: 50, posPago: 30, controle: 20, urTotal: 15,
            fibra: 10, tv: 5, fixo: 2, aparelho: 5, acessorio: 15, pelicula: 10, seguro: 10,
            mesh: 5, trocafy: 4, mplay: 15
        };

        const PRICING_MOVEL = {
            'POS 60GB': { SINGLE: 124.90, MULTI: 59.90 },
            'POS 50GB GAMING': { SINGLE: 164.90, MULTI: 120.00 },
            'POS 100GB': { SINGLE: 179.90, MULTI: 125.00 },
            'POS 150GB': { SINGLE: 239.90, MULTI: 180.00 },
            'POS 200GB': { SINGLE: 339.90, MULTI: 240.00 },
            'POS 500GB': { SINGLE: 849.90, MULTI: 800.00 },
            'CONTROLE 41GB': { SINGLE: 59.90, MULTI: 49.90 },
            'CONTROLE 46GB': { SINGLE: 69.90, MULTI: 69.90 },
            'CONTROLE 46GB GAMING': { SINGLE: 99.90, MULTI: 99.90 },
        };

        const FIBRA_OPTIONS = [
            { label: '250 MEGA', prices: { UNICO: 99.90 } },
            { label: '500 MEGA', prices: { SINGLE: 119.90, MULTI: 99.90 } },
            { label: '1 GIGA', prices: { SINGLE: 199.90, MULTI: 149.90 } },
            { label: '5 GIGA', prices: { SINGLE: 499.90, MULTI: 449.90 } },
            { label: '10 GIGA', prices: { SINGLE: 1999.90, MULTI: 1949.90 } },
        ];

        const TV_BOX_OPTIONS = [
            { label: 'TV BOX', prices: { SINGLE: 134.90, MULTI: 124.90, 'MULTI 3P': 99.90 } },
            { label: 'TV BOX CABO', prices: { SINGLE: 164.90, MULTI: 154.90 } },
            { label: 'TV SOUNDBOX', prices: { UNICO: 174.90 } },
        ];

        const FIXO_OPTIONS = [
            { label: 'FIXO MUNDO', prices: { UNICO: 65.00 } },
            { label: 'FIXO BRASIL', prices: { UNICO: 35.00 } },
            { label: 'FIXO MULTI 3P', prices: { UNICO: 5.00 } },
        ];

        const MESH_OPTIONS = [
            { label: 'MESH 1UN', prices: { UNICO: 15.00 } },
            { label: 'MESH 2UN', prices: { UNICO: 30.00 } },
            { label: 'MESH 3UN', prices: { UNICO: 45.00 } },
            { label: 'MESH 4UN', prices: { UNICO: 60.00 } },
        ];

        res.status(200).json({
            DEFAULT_PRICING,
            METAS_PADRAO,
            PRICING_MOVEL,
            FIBRA_OPTIONS,
            TV_BOX_OPTIONS,
            FIXO_OPTIONS,
            MESH_OPTIONS
        });
    } catch (error) {
        console.error('Erro ao buscar pricing:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
};

export const calcularProposta = async (req, res) => {
    try {
        const { comp } = req.body;
        // Basic calculation logic mirrored from frontend
        
        const dependentePlans = [
            { label: 'LINHA ADICIONAL PAGA', prices: { UNICO: 55.00 } },
            { label: 'LINHA ADICIONAL INCLUSA', prices: { UNICO: 0.00 } },
            { label: 'LINHA BL ADICIONAL', prices: { UNICO: 29.90 } }
        ];

        const pontoAdicionalPlans = [
            { label: 'PONTO TV BOX STREAMING', prices: { UNICO: 69.90 } },
            { label: 'PONTO TV BOX A CABO', prices: { UNICO: 69.90 } },
            { label: 'PONTO TV SOUNDBOX', prices: { UNICO: 99.90 } },
            { label: 'PONTO TV TOP (RENT)', prices: { UNICO: 10.00 } }
        ];

        const seguroPlans = [
            { label: 'SEGURO R$ 35,00', prices: { UNICO: 35.00 } },
            { label: 'SEGURO R$ 45,00', prices: { UNICO: 45.00 } },
            { label: 'SEGURO R$ 55,00', prices: { UNICO: 55.00 } },
            { label: 'SEGURO R$ 60,00', prices: { UNICO: 60.00 } }
        ];

        const PRICING_MOVEL = {
            'POS 60GB': { SINGLE: 124.90, MULTI: 59.90 },
            'POS 50GB GAMING': { SINGLE: 164.90, MULTI: 120.00 },
            'POS 100GB': { SINGLE: 179.90, MULTI: 125.00 },
            'POS 150GB': { SINGLE: 239.90, MULTI: 180.00 },
            'POS 200GB': { SINGLE: 339.90, MULTI: 240.00 },
            'POS 500GB': { SINGLE: 849.90, MULTI: 800.00 },
            'CONTROLE 41GB': { SINGLE: 59.90, MULTI: 49.90 },
            'CONTROLE 46GB': { SINGLE: 69.90, MULTI: 69.90 },
            'CONTROLE 46GB GAMING': { SINGLE: 99.90, MULTI: 99.90 },
        };
        const FIBRA_OPTIONS = [
            { label: '250 MEGA', prices: { UNICO: 99.90 } },
            { label: '500 MEGA', prices: { SINGLE: 119.90, MULTI: 99.90 } },
            { label: '1 GIGA', prices: { SINGLE: 199.90, MULTI: 149.90 } },
            { label: '5 GIGA', prices: { SINGLE: 499.90, MULTI: 449.90 } },
            { label: '10 GIGA', prices: { SINGLE: 1999.90, MULTI: 1949.90 } },
        ];
        const TV_BOX_OPTIONS = [
            { label: 'TV BOX', prices: { SINGLE: 134.90, MULTI: 124.90, 'MULTI 3P': 99.90 } },
            { label: 'TV BOX CABO', prices: { SINGLE: 164.90, MULTI: 154.90 } },
            { label: 'TV SOUNDBOX', prices: { UNICO: 174.90 } },
            { label: 'TV TOP (RENT)', prices: { SINGLE: 110.00, MULTI: 110.00, 'MULTI 3P': 110.00 } }
        ];
        const FIXO_OPTIONS = [
            { label: 'FIXO MUNDO', prices: { UNICO: 65.00 } },
            { label: 'FIXO BRASIL', prices: { UNICO: 35.00 } },
            { label: 'FIXO MULTI 3P', prices: { UNICO: 5.00 } },
        ];
        const MESH_OPTIONS = [
            { label: 'MESH 1UN', prices: { UNICO: 15.00 } },
            { label: 'MESH 2UN', prices: { UNICO: 30.00 } },
            { label: 'MESH 3UN', prices: { UNICO: 45.00 } },
            { label: 'MESH 4UN', prices: { UNICO: 60.00 } },
        ];

        const fibraPlansOverrides = {
            '350 MEGA': { SINGLE: 99.90, MULTI: 79.90, 'MULTI 3P': 79.90 },
            '600 MEGA': { SINGLE: 119.90, MULTI: 99.90, 'MULTI 3P': 99.90 },
            '750 MEGA': { SINGLE: 149.90, MULTI: 129.90, 'MULTI 3P': 129.90 }
        };
        let extendedFibraPlans = [];
        let found350 = false, found600 = false, found750 = false;
        FIBRA_OPTIONS.forEach(p => {
            if (p.label === '350 MEGA') { extendedFibraPlans.push({ label: '350 MEGA', prices: fibraPlansOverrides['350 MEGA'] }); found350 = true; }
            else if (p.label === '600 MEGA') { extendedFibraPlans.push({ label: '600 MEGA', prices: fibraPlansOverrides['600 MEGA'] }); found600 = true; }
            else if (p.label === '750 MEGA') { extendedFibraPlans.push({ label: '750 MEGA', prices: fibraPlansOverrides['750 MEGA'] }); found750 = true; }
            else { extendedFibraPlans.push(p); }
        });
        if (!found350) extendedFibraPlans.push({ label: '350 MEGA', prices: fibraPlansOverrides['350 MEGA'] });
        if (!found600) extendedFibraPlans.push({ label: '600 MEGA', prices: fibraPlansOverrides['600 MEGA'] });
        if (!found750) extendedFibraPlans.push({ label: '750 MEGA', prices: fibraPlansOverrides['750 MEGA'] });

        let numServices = (comp.movel ? 1 : 0) + (comp.fibra ? 1 : 0) + (comp.tv ? 1 : 0);
        let type = 'SINGLE';
        if (comp.movel && (comp.fibra || comp.tv)) {
            type = numServices >= 3 ? 'MULTI 3P' : 'MULTI';
        }

        const getPrice = (cat, item, overrideComboType = type) => {
            if (!item) return 0;
            if (cat === 'MOVEL') return PRICING_MOVEL[item]?.[overrideComboType] || PRICING_MOVEL[item]?.['MULTI'] || PRICING_MOVEL[item]?.['SINGLE'] || 0;
            if (cat === 'DEPENDENTE') return dependentePlans.find(o => o.label === item)?.prices?.UNICO || 0;
            if (cat === 'FIBRA') return extendedFibraPlans.find(o => o.label === item)?.prices?.[overrideComboType] || extendedFibraPlans.find(o => o.label === item)?.prices?.['MULTI'] || extendedFibraPlans.find(o => o.label === item)?.prices?.['SINGLE'] || extendedFibraPlans.find(o => o.label === item)?.prices?.UNICO || 0;
            if (cat === 'TV') return TV_BOX_OPTIONS.find(o => o.label === item)?.prices?.[overrideComboType] || TV_BOX_OPTIONS.find(o => o.label === item)?.prices?.['MULTI'] || TV_BOX_OPTIONS.find(o => o.label === item)?.prices?.['SINGLE'] || TV_BOX_OPTIONS.find(o => o.label === item)?.prices?.UNICO || 0;
            if (cat === 'PONTO_ADICIONAL') return pontoAdicionalPlans.find(o => o.label === item)?.prices?.UNICO || 0;
            if (cat === 'FIXO') return FIXO_OPTIONS.find(o => o.label === item)?.prices?.UNICO || 0;
            if (cat === 'MESH') return MESH_OPTIONS.find(o => o.label === item)?.prices?.UNICO || 0;
            if (cat === 'SEGURO') return seguroPlans.find(o => o.label === item)?.prices?.UNICO || 0;
            return 0;
        };

        const valMovel = getPrice('MOVEL', comp.movel, type);
        const valLinhaInclusa = getPrice('DEPENDENTE', comp.linhaInclusa) * (parseInt(comp.qtdLinhaInclusa, 10) || 1);
        const valLinhaAdicional = getPrice('DEPENDENTE', comp.linhaAdicional) * (parseInt(comp.qtdLinhaAdicional, 10) || 1);
        const valFibra = getPrice('FIBRA', comp.fibra, type) * (parseInt(comp.qtdFibra, 10) || 1);
        const valTv = getPrice('TV', comp.tv, type);
        const valPontoAdicional = getPrice('PONTO_ADICIONAL', comp.pontoAdicional) * (parseInt(comp.qtdPontoAdicional, 10) || 1);
        const valFixo = getPrice('FIXO', comp.fixo) * (parseInt(comp.qtdFixo, 10) || 1);
        const valMesh = getPrice('MESH', comp.mesh);
        const valSeguro = getPrice('SEGURO', comp.seguro);

        const total = valMovel + valLinhaInclusa + valLinhaAdicional + valFibra + valTv + valPontoAdicional + valFixo + valMesh + valSeguro;
        const semCombo = type !== 'SINGLE' && total > 0 ? total * 1.35 : 0;
        const economia = semCombo > 0 ? (semCombo - total) * 12 : 0;

        res.status(200).json({
            type,
            valMovel,
            valLinhaInclusa,
            valLinhaAdicional,
            valFibra,
            valTv,
            valPontoAdicional,
            valFixo,
            valMesh,
            valSeguro,
            total,
            semCombo,
            economia
        });
    } catch (error) {
        console.error('Erro ao calcular proposta:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
};
