// Estrutura Padrão Inicial da Matriz de Precificação (Nova Regra)
export const DEFAULT_PRICING = {
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

// Mantidos por retrocompatibilidade com componentes não atualizados ainda
export const PRICING_MOVEL = {
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

export const FIBRA_OPTIONS = [
    { label: '250 MEGA', prices: { UNICO: 99.90 } },
    { label: '500 MEGA', prices: { SINGLE: 119.90, MULTI: 99.90 } },
    { label: '1 GIGA', prices: { SINGLE: 199.90, MULTI: 149.90 } },
    { label: '5 GIGA', prices: { SINGLE: 499.90, MULTI: 449.90 } },
    { label: '10 GIGA', prices: { SINGLE: 1999.90, MULTI: 1949.90 } },
];

export const TV_BOX_OPTIONS = [
    { label: 'TV BOX', prices: { SINGLE: 134.90, MULTI: 124.90, 'MULTI 3P': 99.90 } },
    { label: 'TV BOX CABO', prices: { SINGLE: 164.90, MULTI: 154.90 } },
    { label: 'TV SOUNDBOX', prices: { UNICO: 174.90 } },
];

export const FIXO_OPTIONS = [
    { label: 'FIXO MUNDO', prices: { UNICO: 65.00 } },
    { label: 'FIXO BRASIL', prices: { UNICO: 35.00 } },
    { label: 'FIXO MULTI 3P', prices: { UNICO: 5.00 } },
];

export const MESH_OPTIONS = [
    { label: 'MESH 1UN', prices: { UNICO: 15.00 } },
    { label: 'MESH 2UN', prices: { UNICO: 30.00 } },
    { label: 'MESH 3UN', prices: { UNICO: 45.00 } },
    { label: 'MESH 4UN', prices: { UNICO: 60.00 } },
];

export const SEGURO_OPTIONS = [
    { label: 'SEGURO R$ 14,00', prices: { UNICO: 14.00 } },
    { label: 'SEGURO R$ 18,00', prices: { UNICO: 18.00 } },
    { label: 'SEGURO R$ 22,00', prices: { UNICO: 22.00 } },
    { label: 'SEGURO R$ 24,00', prices: { UNICO: 24.00 } },
];

export const DEPENDENTE_OPTIONS = [
    { label: 'GRATUITO', prices: { UNICO: 0.00 } },
    { label: 'PAGO', prices: { UNICO: 55.00 } },
    { label: 'DEP BL', prices: { UNICO: 29.90 } },
];

export const PRODUTOS_CONTRATO_OBRIGATORIO = ['FIBRA', 'TV-BOX', 'MESH', 'FIXO', 'FIBRA PME'];

export const SISTEMAS_LINKS = [
    { name: 'SIMPLIFICA', url: 'https://vendasapp.claro.com.br/SVCv2/posicionamento/resultado-pesquisa' },
    { name: 'IW', url: 'https://iw.claro.com.br/v2/wvd/lojapropria/atendersenhas' },
    { name: 'SOLAR', url: 'https://cec.claro.com.br/' },
    { name: 'MOBILE', url: 'http://mtaweb.claro.com.br:20010/docroot/login/login.jsp' },
    { name: 'ESTOQUE', url: 'http://clarounifica/portal/' },
    { name: 'NET-SALES', url: 'https://netsalesapp.claro.com.br/' },
    { name: 'NET-SMS', url: 'https://netsmsapp.claro.com.br/Citrix/NetsmsEPSWeb/' },
    { name: 'GED 2.0', url: 'https://www.novoged.claro.com.br/login' },
    { name: 'SIMULADOR', url: 'https://produtos.claro.com.br/simular-precos' },
    { name: 'CONEXÃO', url: 'https://app.conexaoclarobrasil.com.br/login?' },
    { name: 'NEGOCIA FACIL', url: 'https://claro.negociafacil.com.br/' },
    { name: 'CLARO FLEX', url: 'https://flex.claro.com.br' },
    { name: 'PS8', url: 'http://ps8web:8080/psp/p01ps1/?cmd=login&languageCd=POR' },
    { name: 'CLARO AUTENTICA', url: 'https://claro-link.brsafe.com.br/#/' },
    { name: 'WPP-PRE-PAGO', url: 'https://wppnacional.claro.com.br/wpp/login.jsp' },
    { name: 'FEV', url: 'http://feu.claro.com.br/portal/site/vendas/Autenticador' },
    { name: 'TROCAFY', url: 'https://sav.wooza.com.br/claro/negotiations-exchanges/negotiations-trade-in' },
    { name: 'SPS WEB', url: 'https://spsweb.claro.com.br/' },
    { name: 'PORTAL RCV', url: 'https://atendchat.claro.com.br/RCV/login/' },
    { name: 'IGA (IBM)', url: 'https://iga-claro.identitynow.com/ui/d/mysailpoint' },
    { name: 'PORTAL CONTROLE', url: 'http://auto-controle/autocontrole/login.jsp' },
    { name: 'CLARO CLUBE', url: 'http://claroclube/home.jsp?mensagem=' },
    { name: 'GED ANTIGO', url: 'https://ged.claro.com.br/autenticar.php' },
];

export const VENDEDORES = ['MATHEUS', 'GISELE', 'BRUNA', 'DANILO', 'DAVID'];

export const PRODUTOS = [
    'POS 60GB', 'POS 50GB GAMING', 'POS 100GB', 'POS 150GB', 'POS 200GB', 'POS 500GB',
    'CONTROLE 41GB', 'CONTROLE 46GB', 'CONTROLE 46GB GAMING', 'FIBRA', 'TV-BOX',
    'FIXO', 'CLARO FLEX', 'MESH', 'POS PME', 'FIBRA PME', 'SEGURO',
    'APARELHO', 'ACESSORIO', 'PELICULA', 'DEPENDENTE', 'BANDA LARGA'
];

export const METAS_PADRAO = {
    receita: 15000.00, posTotal: 50, posPago: 30, controle: 20, urTotal: 15,
    fibra: 10, tv: 5, fixo: 2, aparelho: 5, acessorio: 15, pelicula: 10, seguro: 10,
    mesh: 5, trocafy: 4, mplay: 15
};

export const SIMCARD_TABS = ['GESTAO', 'SOBREPOSIÇÃO', 'FALTA ESTOQUE', ...VENDEDORES, 'APARELHO & ACESSORIO'];

export const APP_USERS = {
    'adm': { pass: 'DEV2026', role: 'ADMINISTRAÇÃO', name: 'Desenvolvedor Master' },
    'gerente': { pass: '00332890', role: 'GERENTE', name: 'Gerente Lider' },
    'senior': { pass: '00332890', role: 'SENIOR', name: 'Senior Vendas' },
    'geek': { pass: '00332890', role: 'GEEK', name: 'Suporte Geek' }
};

export const HORARIOS_PADRAO = [
    '09:00 - 18:00', '10:00 - 19:00', '13:00 - 22:00',
    '14:00 - 22:00', 'FOLGA', 'FERIADO', 'FÉRIAS', 'ATESTADO'
];