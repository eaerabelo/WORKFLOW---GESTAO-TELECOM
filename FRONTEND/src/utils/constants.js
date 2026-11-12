// Constantes puramente visuais (Não contêm regras de negócio)

export const PRODUTOS_CONTRATO_OBRIGATORIO = ['FIBRA', 'TV-BOX', 'MESH', 'FIXO', 'FIBRA PME'];

export const VENDEDORES = ['MATHEUS', 'GISELE', 'BRUNA', 'DANILO', 'DAVID'];

export const PRODUTOS = [
    'POS 60GB', 'POS 50GB GAMING', 'POS 100GB', 'POS 150GB', 'POS 200GB', 'POS 500GB',
    'CONTROLE 41GB', 'CONTROLE 46GB', 'CONTROLE 46GB GAMING', 'FIBRA', 'TV-BOX',
    'FIXO', 'FLEX', 'MESH', 'POS PME', 'FIBRA PME', 'SEGURO',
    'APARELHO', 'ACESSORIO', 'PELICULA', 'DEPENDENTE', 'BANDA LARGA'
];

export const METAS_PADRAO = {
    receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0,
    fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0,
    mesh: 0, trocafy: 0, mplay: 0
};

export const SIMCARD_TABS = ['GESTAO', 'SOBREPOSIÇÃO', 'FALTA ESTOQUE', ...VENDEDORES, 'APARELHO & ACESSORIO'];

export const HORARIOS_PADRAO = [
    '09:00 - 18:00', '10:00 - 19:00', '13:00 - 22:00',
    '14:00 - 22:00', 'FOLGA', 'FERIADO', 'FÉRIAS', 'ATESTADO'
];

export const DEFAULT_SEGURO_OPTIONS = [
    { label: 'SEGURO R$ 14,00', prices: { UNICO: 14.00 } },
    { label: 'SEGURO R$ 18,00', prices: { UNICO: 18.00 } },
    { label: 'SEGURO R$ 22,00', prices: { UNICO: 22.00 } },
    { label: 'SEGURO R$ 24,00', prices: { UNICO: 24.00 } },
    { label: 'SEGURO R$ 29,00', prices: { UNICO: 29.00 } },
    { label: 'SEGURO R$ 35,00', prices: { UNICO: 35.00 } },
    { label: 'SEGURO R$ 45,00', prices: { UNICO: 45.00 } },
    { label: 'SEGURO R$ 55,00', prices: { UNICO: 55.00 } },
    { label: 'SEGURO R$ 60,00', prices: { UNICO: 60.00 } },
    { label: 'SEGURO R$ 75,00', prices: { UNICO: 75.00 } },
];

export const DEFAULT_DEPENDENTE_OPTIONS = [
    { label: 'LINHA ADICIONAL INCLUSA', prices: { UNICO: 0.00 } },
    { label: 'LINHA ADICIONAL PAGA', prices: { UNICO: 55.00 } },
    { label: 'LINHA BL ADICIONAL', prices: { UNICO: 29.90 } },
    { label: 'GRATUITO', prices: { UNICO: 0.00 } },
    { label: 'DEPENDENTE ANTIGO', prices: { UNICO: 50.00 } }
];
