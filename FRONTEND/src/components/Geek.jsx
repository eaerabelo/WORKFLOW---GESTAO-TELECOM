import React, { useState, useEffect, useRef } from 'react';
import {
    Cpu, Plus, FileText, Trash2, ExternalLink, X, BookOpen, Layers,
    Tag, Archive, FolderPlus, Edit3, ChevronLeft, ChevronRight,
    Image as ImageIcon, Sparkles, Maximize2, Upload, Megaphone,
    Search, Copy, Check, ChevronDown, ChevronUp, Smartphone, Watch, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const getStoredViewedGeekDocs = (globalUser) => {
    const userKey = String(globalUser?.username || 'default').toUpperCase();
    let localViewed = {};
    try {
        const raw = localStorage.getItem(`CLARO_VIEWED_GEEK_${userKey}`);
        if (raw) localViewed = JSON.parse(raw) || {};
    } catch {}
    return { ...(globalUser?.viewedGeekDocs || {}), ...localViewed };
};

export const checkHasNewGeek = (docs, globalUser) => {
    try {
        const viewed = getStoredViewedGeekDocs(globalUser);
        return (docs || []).some(doc => {
            if (!doc || doc.id === 'CONFIG_FLYERS_34' || doc.categoria === '__FLYERS_CARROSSEL__') {
                return false;
            }
            const docKey = String(doc.id);
            const lastUpdated = String(doc.updatedAt || doc.id);
            const ts = Number(doc.updatedAt || doc.id);
            const isRecent = Number.isFinite(ts) ? (Date.now() - ts) < 15 * 24 * 60 * 60 * 1000 : false;
            if (!isRecent) return false;
            return String(viewed[docKey] ?? viewed[doc.id] ?? '') !== lastUpdated;
        });
    } catch {
        return false;
    }
};

const DEFAULT_FLYERS = [
    {
        id: 1,
        titulo: 'CLARO FIBRA 500 MEGA',
        subtitulo: 'Ultravelocidade com Wi-Fi Plus e Globoplay Incluso na Oferta',
        tag: 'CAMPANHA OFICIAL',
        imagemUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop',
        link: 'https://produtos.claro.com.br/simular-precos',
        data: 'Maio/2026'
    },
    {
        id: 2,
        titulo: 'CLARO PÓS PLAY 5G',
        subtitulo: 'Até 500GB com Dobro de Internet e Passaporte Américas sem custo',
        tag: 'DESTAQUE MENSAL',
        imagemUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
        link: 'https://vendasapp.claro.com.br/SVCv2/posicionamento/resultado-pesquisa',
        tagColor: 'bg-[#E3000F]',
        data: 'Maio/2026'
    },
    {
        id: 3,
        titulo: 'MIGRAÇÃO PRÉ -> CONTROLE',
        subtitulo: 'Desconto Exclusivo na Fatura e R$ 10 de Bônus Recarga Claro Pay',
        tag: 'FOCO OPERAÇÃO',
        imagemUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?q=80&w=800&auto=format&fit=crop',
        link: 'https://produtos.claro.com.br/simular-precos',
        tagColor: 'bg-emerald-600',
        data: 'Maio/2026'
    }
];

export function Geek({ geekDocs = [], setGeekDocs, isGerente, globalUser, updateUserProfile }) {
    // --- ESTADOS DE DOCUMENTOS ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ titulo: '', categoria: 'BOOK DE OFERTAS', link: '' });
    const [isNovaCategoria, setIsNovaCategoria] = useState(false);
    const [novaCategoriaNome, setNovaCategoriaNome] = useState('');

    // --- COMPRESSÃO INTELIGENTE DE IMAGEM PARA FLYERS (ALTA DEFINIÇÃO E PESO LEVE) ---
    const compressImageFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const maxDim = 1400;
                    let w = img.width;
                    let h = img.height;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) {
                            h = Math.round((h * maxDim) / w);
                            w = maxDim;
                        } else {
                            w = Math.round((w * maxDim) / h);
                            h = maxDim;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, w, h);
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.90);
                        resolve(compressedBase64);
                    } else {
                        resolve(e.target.result);
                    }
                };
                img.onerror = () => resolve(e.target.result);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
        });
    };

    // --- ESTADOS DO CARROSSEL DE FLYERS (3:4) ---
    const [flyers, setFlyers] = useState(() => {
        try {
            const saved = localStorage.getItem('CLARO_GEEK_FLYERS_34');
            if (saved !== null) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch {}
        return DEFAULT_FLYERS;
    });

    const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);
    const [editingFlyerId, setEditingFlyerId] = useState(null);
    const [flyerFormData, setFlyerFormData] = useState({
        titulo: '',
        subtitulo: '',
        tag: 'CAMPANHA OFICIAL',
        imagemUrl: '',
        link: ''
    });
    const [previewFlyer, setPreviewFlyer] = useState(null);
    const [selectedBundleBrand, setSelectedBundleBrand] = useState('SAMSUNG');
    const [bundleSearch, setBundleSearch] = useState('');
    const [bundleSubFilter, setBundleSubFilter] = useState('TODOS');
    const [expandedBundleIds, setExpandedBundleIds] = useState({});
    const [copiedCode, setCopiedCode] = useState('');
    const carouselRef = useRef(null);

    const handleCopySap = (codeStr) => {
        if (!codeStr || codeStr === '-') return;
        try {
            navigator.clipboard.writeText(String(codeStr));
            setCopiedCode(String(codeStr));
            toast.success(`Código(s) copiado(s): ${codeStr}`);
            setTimeout(() => setCopiedCode(''), 2000);
        } catch {
            toast.error('Não foi possível copiar o código.');
        }
    };

    const toggleExpandBundle = (id) => {
        setExpandedBundleIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Estrutura Oficial de BUNDLES (Planilha Bundles 12.11.2026_8806.xlsx + Lâmina Multi Friday 2026)
    const BUNDLES_POR_MARCA = {
        SAMSUNG: [
            {
                id: 'ssg-buds-core',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'SSG GAL BUDS CORE',
                leveCodigos: '62831;62832',
                porPreco: 'R$ 119,00',
                multiFridayAvulso: 'De R$ 349 por R$ 289 (21x R$ 14)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '12.11.2026 a 06.12.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Galaxy A17, A26, A27, A36, A37, A56, A57 5G e Tab S10 Lite',
                compreLista: [
                    { modelo: 'SSG GAL A17 5G 128GB', codigos: '19280;19281;19282;19283;19386;19387' },
                    { modelo: 'SSG GAL A26 5G 256GB', codigos: '19189;19190;19191;19192;19197;19193' },
                    { modelo: 'SSG GAL A27 5G 256GB', codigos: '19600;19610;19619;19632;19631;19630' },
                    { modelo: 'SSG GAL A36 5G 256GB', codigos: '19177;19178;19179;19182;19183;19184;19185;19186' },
                    { modelo: 'SSG GAL A37 5G 256GB', codigos: '19480;19483;19485;19482;19491;19484;19486;19481' },
                    { modelo: 'SSG GAL A56 5G 256GB', codigos: '19169;19170;19171;19172;19173;19174;19175;19176' },
                    { modelo: 'SSG GAL A57 5G 256GB', codigos: '19498;19499;19500;19501;19502;19503;19504;19505' },
                    { modelo: 'SSG GALAXY TAB S10 LITE 128GB (WIFI)', codigos: '90020' }
                ]
            },
            {
                id: 'ssg-fit3',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'GALAXY FIT3 SAMSUNG',
                leveCodigos: '62529;62856',
                porPreco: 'R$ 129,00',
                multiFridayAvulso: 'De R$ 429 por R$ 349 (21x R$ 17)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '12.11.2026 a 06.12.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Galaxy A26, A27, A36, A37, A56, A57 5G e Tab S10 Lite',
                compreLista: [
                    { modelo: 'SSG GAL A26 5G 256GB', codigos: '19189;19190;19191;19192;19197;19193' },
                    { modelo: 'SSG GAL A27 5G 256GB', codigos: '19600;19610;19619;19632;19631;19630' },
                    { modelo: 'SSG GAL A36 5G 256GB', codigos: '19177;19178;19179;19182;19183;19184;19185;19186' },
                    { modelo: 'SSG GAL A37 5G 256GB', codigos: '19480;19483;19485;19482;19491;19484;19486;19481' },
                    { modelo: 'SSG GAL A56 5G 256GB', codigos: '19169;19170;19171;19172;19173;19174;19175;19176' },
                    { modelo: 'SSG GAL A57 5G 256GB', codigos: '19498;19499;19500;19501;19502;19503;19504;19505' },
                    { modelo: 'SSG GALAXY TAB S10 LITE 128GB (WIFI)', codigos: '90020' }
                ]
            },
            {
                id: 'ssg-buds3-fe',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'SSG GAL BUDS 3 FE',
                leveCodigos: '62833;62834',
                porPreco: 'R$ 399,00',
                multiFridayAvulso: 'De R$ 999 por R$ 799 (21x R$ 39)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '12.11.2026 a 06.12.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Galaxy A37, A56, A57, S25 FE, S26 FE e Z Flip7 FE',
                compreLista: [
                    { modelo: 'SSG GAL A37 5G 256GB', codigos: '19480;19483;19485;19482;19491;19484;19486;19481' },
                    { modelo: 'SSG GAL A56 5G 256GB', codigos: '19169;19170;19171;19172;19173;19174;19175;19176' },
                    { modelo: 'SSG GAL A57 5G 256GB', codigos: '19498;19499;19500;19501;19502;19503;19504;19505' },
                    { modelo: 'SSG GAL S25 FE 5G 256GB', codigos: '19288;19275;19276;19277;19278;19279' },
                    { modelo: 'SSG GAL S26 FE 5G 256GB', codigos: '19715;19706;19730;19718;19707;19719' },
                    { modelo: 'SSG GAL Z FLIP7 FE 256GB', codigos: '19260;19259' }
                ]
            },
            {
                id: 'ssg-buds4',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'SSG GAL BUDS4',
                leveCodigos: '62929;62930',
                porPreco: 'R$ 599,00',
                multiFridayAvulso: 'De R$ 1.499 por R$ 1.299 (21x R$ 62)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '12.11.2026 a 06.12.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Família S25 (FE/S25/+/Edge/Ultra), Família S26 (FE/S26/+/Ultra) e Linha Z Flip7/8 & Fold7/8',
                compreLista: [
                    { modelo: 'SSG GAL S26 FE 5G 256GB', codigos: '19715;19706;19730;19718;19707;19719' },
                    { modelo: 'SSG GAL S26 5G 256GB', codigos: '19435;19404;19405;19406;19407;19408;19409;19410' },
                    { modelo: 'SSG GAL S26 5G 512GB', codigos: '19411;19412;19413;19414;19415;19416;19417;19418' },
                    { modelo: 'SSG GAL S26 PLUS 5G 256GB', codigos: '19419;19420;19421;19422;19423;19424;19425;19426' },
                    { modelo: 'SSG GAL S26 PLUS 5G 512GB', codigos: '19427;19428;19429;19430;19431;19432;19433;19434' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 256GB', codigos: '19315;19318;19320;19322;19323;19325;19326;19328' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 512GB', codigos: '19329;19331;19333;19357;19358;19359;19360;19361' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 1TB', codigos: '19362;19363;19368;19369;19370;19371;19372;19373' },
                    { modelo: 'SSG GAL S25 FE 5G 256GB', codigos: '19288;19275;19276;19277;19278;19279' },
                    { modelo: 'SSG GAL S25 5G 256GB', codigos: '19098;19096;19097;19099;19100;19101;19102;19103' },
                    { modelo: 'SSG GAL S25 PLUS 5G 256GB', codigos: '19117;19118;19119;19120;19121;19122;19123;19124' },
                    { modelo: 'SSG GAL S25 PLUS 5G 512GB', codigos: '19125;19126;19127;19128;19129;19130;19156;19131' },
                    { modelo: 'SSG GAL S25 EDGE 5G 512GB', codigos: '19211;19210;19209' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 256GB', codigos: '19138;19139;19137;19136;19135;19134;19133;19155' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 512GB', codigos: '19141;19142;19143;19144;19145;19146;19147;19148' },
                    { modelo: 'SSG GAL Z FLIP7 FE 256GB', codigos: '19260;19259' },
                    { modelo: 'SSG GAL Z FLIP7 256GB', codigos: '19258;19257' },
                    { modelo: 'SSG GAL Z FLIP7 512GB', codigos: '19256;19255' },
                    { modelo: 'SSG GAL Z FLIP 8 256GB', codigos: '19592;19561;19582' },
                    { modelo: 'SSG GAL Z FLIP 8 512GB', codigos: '19593;19583;19562' },
                    { modelo: 'SSG GAL Z FOLD7 1TB', codigos: '19251;19250' },
                    { modelo: 'SSG GAL Z FOLD 8 256GB', codigos: '19572;19584;19563' },
                    { modelo: 'SSG GAL Z FOLD 8 512GB', codigos: '19573;19585;19594' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 256GB', codigos: '19564;19565;19595' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 512GB', codigos: '19566;19586;19567' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 1TB', codigos: '19629;19601;19628' }
                ]
            },
            {
                id: 'ssg-buds4-pro',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'SSG GAL BUDS 4 PRO',
                leveCodigos: '62931;62932',
                porPreco: 'R$ 799,00',
                multiFridayAvulso: 'De R$ 1.799 por R$ 1.499 (21x R$ 72)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '12.11.2026 a 06.12.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Família S25 (FE/S25/+/Ultra), Família S26 (FE/S26/+/Ultra) e Linha Z Flip7/8 & Fold7/8',
                compreLista: [
                    { modelo: 'SSG GAL S26 FE 5G 256GB', codigos: '19715;19706;19730;19718;19707;19719' },
                    { modelo: 'SSG GAL S26 5G 256GB', codigos: '19435;19404;19405;19406;19407;19408;19409;19410' },
                    { modelo: 'SSG GAL S26 5G 512GB', codigos: '19411;19412;19413;19414;19415;19416;19417;19418' },
                    { modelo: 'SSG GAL S26 PLUS 5G 256GB', codigos: '19419;19420;19421;19422;19423;19424;19425;19426' },
                    { modelo: 'SSG GAL S26 PLUS 5G 512GB', codigos: '19427;19428;19429;19430;19431;19432;19433;19434' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 256GB', codigos: '19315;19318;19320;19322;19323;19325;19326;19328' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 512GB', codigos: '19329;19331;19333;19357;19358;19359;19360;19361' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 1TB', codigos: '19362;19363;19368;19369;19370;19371;19372;19373' },
                    { modelo: 'SSG GAL S25 FE 5G 256GB', codigos: '19288;19275;19276;19277;19278;19279' },
                    { modelo: 'SSG GAL S25 5G 256GB', codigos: '19098;19096;19097;19099;19100;19101;19102;19103' },
                    { modelo: 'SSG GAL S25 PLUS 5G 256GB', codigos: '19117;19118;19119;19120;19121;19122;19123;19124' },
                    { modelo: 'SSG GAL S25 PLUS 5G 512GB', codigos: '19125;19126;19127;19128;19129;19130;19156;19131' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 256GB', codigos: '19138;19139;19137;19136;19135;19134;19133;19155' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 512GB', codigos: '19141;19142;19143;19144;19145;19146;19147;19148' },
                    { modelo: 'SSG GAL Z FLIP7 FE 256GB', codigos: '19260;19259' },
                    { modelo: 'SSG GAL Z FLIP7 256GB', codigos: '19258;19257' },
                    { modelo: 'SSG GAL Z FLIP7 512GB', codigos: '19256;19255' },
                    { modelo: 'SSG GAL Z FLIP 8 256GB', codigos: '19592;19561;19582' },
                    { modelo: 'SSG GAL Z FLIP 8 512GB', codigos: '19593;19583;19562' },
                    { modelo: 'SSG GAL Z FOLD7 512GB', codigos: '19254;19253;19252' },
                    { modelo: 'SSG GAL Z FOLD7 1TB', codigos: '19251;19250' },
                    { modelo: 'SSG GAL Z FOLD 8 256GB', codigos: '19572;19584;19563' },
                    { modelo: 'SSG GAL Z FOLD 8 512GB', codigos: '19573;19585;19594' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 256GB', codigos: '19564;19565;19595' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 512GB', codigos: '19566;19586;19567' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 1TB', codigos: '19629;19601;19628' }
                ]
            },
            {
                id: 'ssg-watch8-40',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'SSG GAL WATCH 8 40MM LTE',
                leveCodigos: '19267;19274',
                porPreco: 'R$ 899,00',
                multiFridayAvulso: 'De R$ 1.799 por R$ 1.599 (21x R$ 77)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '12.11.2026 a 06.12.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Galaxy A37, A57, Família S25, Família S26 e Linha Z Flip7/8 & Fold7/8',
                compreLista: [
                    { modelo: 'SSG GAL A37 5G 256GB', codigos: '19480;19483;19485;19482;19491;19484;19486;19481' },
                    { modelo: 'SSG GAL A57 5G 256GB', codigos: '19498;19499;19500;19501;19502;19503;19504;19505' },
                    { modelo: 'SSG GAL S26 FE 5G 256GB', codigos: '19715;19706;19730;19718;19707;19719' },
                    { modelo: 'SSG GAL S26 5G 256GB', codigos: '19435;19404;19405;19406;19407;19408;19409;19410' },
                    { modelo: 'SSG GAL S26 5G 512GB', codigos: '19411;19412;19413;19414;19415;19416;19417;19418' },
                    { modelo: 'SSG GAL S26 PLUS 5G 256GB', codigos: '19419;19420;19421;19422;19423;19424;19425;19426' },
                    { modelo: 'SSG GAL S26 PLUS 5G 512GB', codigos: '19427;19428;19429;19430;19431;19432;19433;19434' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 256GB', codigos: '19315;19318;19320;19322;19323;19325;19326;19328' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 512GB', codigos: '19329;19331;19333;19357;19358;19359;19360;19361' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 1TB', codigos: '19362;19363;19368;19369;19370;19371;19372;19373' },
                    { modelo: 'SSG GAL S25 FE 5G 256GB', codigos: '19288;19275;19276;19277;19278;19279' },
                    { modelo: 'SSG GAL S25 5G 256GB', codigos: '19098;19096;19097;19099;19100;19101;19102;19103' },
                    { modelo: 'SSG GAL S25 PLUS 5G 256GB', codigos: '19117;19118;19119;19120;19121;19122;19123;19124' },
                    { modelo: 'SSG GAL S25 PLUS 5G 512GB', codigos: '19125;19126;19127;19128;19129;19130;19156;19131' },
                    { modelo: 'SSG GAL S25 EDGE 5G 512GB', codigos: '19211;19210;19209' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 256GB', codigos: '19138;19139;19137;19136;19135;19134;19133;19155' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 512GB', codigos: '19141;19142;19143;19144;19145;19146;19147;19148' },
                    { modelo: 'SSG GAL Z FLIP7 FE 256GB', codigos: '19260;19259' },
                    { modelo: 'SSG GAL Z FLIP7 256GB', codigos: '19258;19257' },
                    { modelo: 'SSG GAL Z FLIP7 512GB', codigos: '19256;19255' },
                    { modelo: 'SSG GAL Z FLIP 8 256GB', codigos: '19592;19561;19582' },
                    { modelo: 'SSG GAL Z FLIP 8 512GB', codigos: '19593;19583;19562' },
                    { modelo: 'SSG GAL Z FOLD7 1TB', codigos: '19251;19250' },
                    { modelo: 'SSG GAL Z FOLD 8 256GB', codigos: '19572;19584;19563' },
                    { modelo: 'SSG GAL Z FOLD 8 512GB', codigos: '19573;19585;19594' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 256GB', codigos: '19564;19565;19595' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 512GB', codigos: '19566;19586;19567' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 1TB', codigos: '19629;19601;19628' }
                ]
            },
            {
                id: 'ssg-watch8-44',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'SSG GAL WATCH 8 44MM LTE',
                leveCodigos: '19266;19273',
                porPreco: 'R$ 899,00',
                multiFridayAvulso: 'De R$ 1.999 por R$ 1.699 (21x R$ 81)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '12.11.2026 a 06.12.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Galaxy A37, A57, Família S25, Família S26 e Linha Z Flip7/8 & Fold7/8',
                compreLista: [
                    { modelo: 'SSG GAL A37 5G 256GB', codigos: '19480;19483;19485;19482;19491;19484;19486;19481' },
                    { modelo: 'SSG GAL A57 5G 256GB', codigos: '19498;19499;19500;19501;19502;19503;19504;19505' },
                    { modelo: 'SSG GAL S26 FE 5G 256GB', codigos: '19715;19706;19730;19718;19707;19719' },
                    { modelo: 'SSG GAL S26 5G 256GB', codigos: '19435;19404;19405;19406;19407;19408;19409;19410' },
                    { modelo: 'SSG GAL S26 5G 512GB', codigos: '19411;19412;19413;19414;19415;19416;19417;19418' },
                    { modelo: 'SSG GAL S26 PLUS 5G 256GB', codigos: '19419;19420;19421;19422;19423;19424;19425;19426' },
                    { modelo: 'SSG GAL S26 PLUS 5G 512GB', codigos: '19427;19428;19429;19430;19431;19432;19433;19434' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 256GB', codigos: '19315;19318;19320;19322;19323;19325;19326;19328' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 512GB', codigos: '19329;19331;19333;19357;19358;19359;19360;19361' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 1TB', codigos: '19362;19363;19368;19369;19370;19371;19372;19373' },
                    { modelo: 'SSG GAL S25 FE 5G 256GB', codigos: '19288;19275;19276;19277;19278;19279' },
                    { modelo: 'SSG GAL S25 5G 256GB', codigos: '19098;19096;19097;19099;19100;19101;19102;19103' },
                    { modelo: 'SSG GAL S25 PLUS 5G 256GB', codigos: '19117;19118;19119;19120;19121;19122;19123;19124' },
                    { modelo: 'SSG GAL S25 PLUS 5G 512GB', codigos: '19125;19126;19127;19128;19129;19130;19156;19131' },
                    { modelo: 'SSG GAL S25 EDGE 5G 512GB', codigos: '19211;19210;19209' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 256GB', codigos: '19138;19139;19137;19136;19135;19134;19133;19155' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 512GB', codigos: '19141;19142;19143;19144;19145;19146;19147;19148' },
                    { modelo: 'SSG GAL Z FLIP7 FE 256GB', codigos: '19260;19259' },
                    { modelo: 'SSG GAL Z FLIP7 256GB', codigos: '19258;19257' },
                    { modelo: 'SSG GAL Z FLIP7 512GB', codigos: '19256;19255' },
                    { modelo: 'SSG GAL Z FLIP 8 256GB', codigos: '19592;19561;19582' },
                    { modelo: 'SSG GAL Z FLIP 8 512GB', codigos: '19593;19583;19562' },
                    { modelo: 'SSG GAL Z FOLD7 1TB', codigos: '19251;19250' },
                    { modelo: 'SSG GAL Z FOLD 8 256GB', codigos: '19572;19584;19563' },
                    { modelo: 'SSG GAL Z FOLD 8 512GB', codigos: '19573;19585;19594' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 256GB', codigos: '19564;19565;19595' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 512GB', codigos: '19566;19586;19567' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 1TB', codigos: '19629;19601;19628' }
                ]
            },
            {
                id: 'ssg-watch9-40',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'SSG GAL WATCH 9 40MM LTE',
                leveCodigos: '19608;19609',
                porPreco: 'R$ 1.099,00',
                multiFridayAvulso: 'De R$ 2.499 por R$ 2.299 (21x R$ 110)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '12.11.2026 a 06.12.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Galaxy A37, A57, Família S25, Família S26 e Linha Z Flip7/8 & Fold7/8 Ultra',
                compreLista: [
                    { modelo: 'SSG GAL A37 5G 256GB', codigos: '19480;19483;19485;19482;19491;19484;19486;19481' },
                    { modelo: 'SSG GAL A57 5G 256GB', codigos: '19498;19499;19500;19501;19502;19503;19504;19505' },
                    { modelo: 'SSG GAL S26 FE 5G 256GB', codigos: '19715;19706;19730;19718;19707;19719' },
                    { modelo: 'SSG GAL S26 5G 256GB', codigos: '19435;19404;19405;19406;19407;19408;19409;19410' },
                    { modelo: 'SSG GAL S26 5G 512GB', codigos: '19411;19412;19413;19414;19415;19416;19417;19418' },
                    { modelo: 'SSG GAL S26 PLUS 5G 256GB', codigos: '19419;19420;19421;19422;19423;19424;19425;19426' },
                    { modelo: 'SSG GAL S26 PLUS 5G 512GB', codigos: '19427;19428;19429;19430;19431;19432;19433;19434' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 256GB', codigos: '19315;19318;19320;19322;19323;19325;19326;19328' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 512GB', codigos: '19329;19331;19333;19357;19358;19359;19360;19361' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 1TB', codigos: '19362;19363;19368;19369;19370;19371;19372;19373' },
                    { modelo: 'SSG GAL S25 FE 5G 256GB', codigos: '19288;19275;19276;19277;19278;19279' },
                    { modelo: 'SSG GAL S25 5G 256GB', codigos: '19098;19096;19097;19099;19100;19101;19102;19103' },
                    { modelo: 'SSG GAL S25 PLUS 5G 256GB', codigos: '19117;19118;19119;19120;19121;19122;19123;19124' },
                    { modelo: 'SSG GAL S25 PLUS 5G 512GB', codigos: '19125;19126;19127;19128;19129;19130;19156;19131' },
                    { modelo: 'SSG GAL S25 EDGE 5G 512GB', codigos: '19211;19210;19209' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 256GB', codigos: '19138;19139;19137;19136;19135;19134;19133;19155' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 512GB', codigos: '19141;19142;19143;19144;19145;19146;19147;19148' },
                    { modelo: 'SSG GAL Z FLIP7 FE 256GB', codigos: '19260;19259' },
                    { modelo: 'SSG GAL Z FLIP7 256GB', codigos: '19258;19257' },
                    { modelo: 'SSG GAL Z FLIP7 512GB', codigos: '19256;19255' },
                    { modelo: 'SSG GAL Z FLIP 8 256GB', codigos: '19592;19561;19582' },
                    { modelo: 'SSG GAL Z FLIP 8 512GB', codigos: '19593;19583;19562' },
                    { modelo: 'SSG GAL Z FOLD7 1TB', codigos: '19251;19250' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 256GB', codigos: '19564;19565;19595' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 512GB', codigos: '19566;19586;19567' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 1TB', codigos: '19629;19601;19628' }
                ]
            },
            {
                id: 'ssg-watch9-44',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'SSG GAL WATCH 9 44MM LTE',
                leveCodigos: '19620;19598',
                porPreco: 'R$ 1.099,00',
                multiFridayAvulso: 'De R$ 2.699 por R$ 2.499 (21x R$ 119)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '12.11.2026 a 06.12.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Galaxy A37, A57, Família S25, Família S26 e Linha Z Flip7/8 & Fold7/8 Ultra',
                compreLista: [
                    { modelo: 'SSG GAL A37 5G 256GB', codigos: '19480;19483;19485;19482;19491;19484;19486;19481' },
                    { modelo: 'SSG GAL A57 5G 256GB', codigos: '19498;19499;19500;19501;19502;19503;19504;19505' },
                    { modelo: 'SSG GAL S26 FE 5G 256GB', codigos: '19715;19706;19730;19718;19707;19719' },
                    { modelo: 'SSG GAL S26 5G 256GB', codigos: '19435;19404;19405;19406;19407;19408;19409;19410' },
                    { modelo: 'SSG GAL S26 5G 512GB', codigos: '19411;19412;19413;19414;19415;19416;19417;19418' },
                    { modelo: 'SSG GAL S26 PLUS 5G 256GB', codigos: '19419;19420;19421;19422;19423;19424;19425;19426' },
                    { modelo: 'SSG GAL S26 PLUS 5G 512GB', codigos: '19427;19428;19429;19430;19431;19432;19433;19434' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 256GB', codigos: '19315;19318;19320;19322;19323;19325;19326;19328' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 512GB', codigos: '19329;19331;19333;19357;19358;19359;19360;19361' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 1TB', codigos: '19362;19363;19368;19369;19370;19371;19372;19373' },
                    { modelo: 'SSG GAL S25 FE 5G 256GB', codigos: '19288;19275;19276;19277;19278;19279' },
                    { modelo: 'SSG GAL S25 5G 256GB', codigos: '19098;19096;19097;19099;19100;19101;19102;19103' },
                    { modelo: 'SSG GAL S25 PLUS 5G 256GB', codigos: '19117;19118;19119;19120;19121;19122;19123;19124' },
                    { modelo: 'SSG GAL S25 PLUS 5G 512GB', codigos: '19125;19126;19127;19128;19129;19130;19156;19131' },
                    { modelo: 'SSG GAL S25 EDGE 5G 512GB', codigos: '19211;19210;19209' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 256GB', codigos: '19138;19139;19137;19136;19135;19134;19133;19155' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 512GB', codigos: '19141;19142;19143;19144;19145;19146;19147;19148' },
                    { modelo: 'SSG GAL Z FLIP7 FE 256GB', codigos: '19260;19259' },
                    { modelo: 'SSG GAL Z FLIP7 256GB', codigos: '19258;19257' },
                    { modelo: 'SSG GAL Z FLIP7 512GB', codigos: '19256;19255' },
                    { modelo: 'SSG GAL Z FLIP 8 256GB', codigos: '19592;19561;19582' },
                    { modelo: 'SSG GAL Z FLIP 8 512GB', codigos: '19593;19583;19562' },
                    { modelo: 'SSG GAL Z FOLD7 1TB', codigos: '19251;19250' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 256GB', codigos: '19564;19565;19595' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 512GB', codigos: '19566;19586;19567' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 1TB', codigos: '19629;19601;19628' }
                ]
            },
            {
                id: 'ssg-watch8-classic',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'SSG GAL WATCH 8 CLASSIC 46MM LTE',
                leveCodigos: '19268',
                porPreco: 'R$ 1.199,00',
                multiFridayAvulso: 'De R$ 3.699 por R$ 1.999 (21x R$ 96)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '12.11.2026 a 06.12.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'S25 Ultra, Família S26 (S26/+/Ultra) e Linha Z Fold7 & Z Fold 8 / Ultra',
                compreLista: [
                    { modelo: 'SSG GAL S26 5G 256GB', codigos: '19435;19404;19405;19406;19407;19408;19409;19410' },
                    { modelo: 'SSG GAL S26 5G 512GB', codigos: '19411;19412;19413;19414;19415;19416;19417;19418' },
                    { modelo: 'SSG GAL S26 PLUS 5G 256GB', codigos: '19419;19420;19421;19422;19423;19424;19425;19426' },
                    { modelo: 'SSG GAL S26 PLUS 5G 512GB', codigos: '19427;19428;19429;19430;19431;19432;19433;19434' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 256GB', codigos: '19315;19318;19320;19322;19323;19325;19326;19328' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 512GB', codigos: '19329;19331;19333;19357;19358;19359;19360;19361' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 1TB', codigos: '19362;19363;19368;19369;19370;19371;19372;19373' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 256GB', codigos: '19138;19139;19137;19136;19135;19134;19133;19155' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 512GB', codigos: '19141;19142;19143;19144;19145;19146;19147;19148' },
                    { modelo: 'SSG GAL Z FOLD7 512GB', codigos: '19254;19253;19252' },
                    { modelo: 'SSG GAL Z FOLD7 1TB', codigos: '19251;19250' },
                    { modelo: 'SSG GAL Z FOLD 8 256GB', codigos: '19572;19584;19563' },
                    { modelo: 'SSG GAL Z FOLD 8 512GB', codigos: '19573;19585;19594' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 256GB', codigos: '19564;19565;19595' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 512GB', codigos: '19566;19586;19567' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 1TB', codigos: '19629;19601;19628' }
                ]
            },
            {
                id: 'ssg-watch-ultra-47',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'SSG GAL WATCH ULTRA 47MM LTE (2025)',
                leveCodigos: '18959;18960;18961;19270;19269',
                porPreco: 'R$ 1.599,00',
                multiFridayAvulso: 'De R$ 2.999 por R$ 1.999 (21x R$ 96)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '12.11.2026 a 06.12.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'S25 Ultra, S26, S26+, S26 Ultra (512GB/1TB) e Linha Z Fold7 & Z Fold 8 / Ultra',
                compreLista: [
                    { modelo: 'SSG GAL S26 5G 256GB', codigos: '19435;19404;19405;19406;19407;19408;19409;19410' },
                    { modelo: 'SSG GAL S26 5G 512GB', codigos: '19411;19412;19413;19414;19415;19416;19417;19418' },
                    { modelo: 'SSG GAL S26 PLUS 5G 256GB', codigos: '19419;19420;19421;19422;19423;19424;19425;19426' },
                    { modelo: 'SSG GAL S26 PLUS 5G 512GB', codigos: '19427;19428;19429;19430;19431;19432;19433;19434' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 512GB', codigos: '19329;19331;19333;19357;19358;19359;19360;19361' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 1TB', codigos: '19362;19363;19368;19369;19370;19371;19372;19373' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 256GB', codigos: '19138;19139;19137;19136;19135;19134;19133;19155' },
                    { modelo: 'SSG GAL S25 ULTRA 5G 512GB', codigos: '19141;19142;19143;19144;19145;19146;19147;19148' },
                    { modelo: 'SSG GAL Z FOLD7 512GB', codigos: '19254;19253;19252' },
                    { modelo: 'SSG GAL Z FOLD7 1TB', codigos: '19251;19250' },
                    { modelo: 'SSG GAL Z FOLD 8 256GB', codigos: '19572;19584;19563' },
                    { modelo: 'SSG GAL Z FOLD 8 512GB', codigos: '19573;19585;19594' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 256GB', codigos: '19564;19565;19595' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 512GB', codigos: '19566;19586;19567' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 1TB', codigos: '19629;19601;19628' }
                ]
            },
            {
                id: 'ssg-watch-ultra2-47',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'SSG GAL WATCH ULTRA2 47MM LTE',
                leveCodigos: '19599;19618',
                porPreco: 'R$ 1.699,00',
                multiFridayAvulso: 'De R$ 3.999 por R$ 2.999 (21x R$ 143)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '12.11.2026 a 06.12.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'S26, S26+, S26 Ultra (256GB/1TB) e Linha Z Fold7 & Z Fold 8 / Ultra (512GB/1TB)',
                compreLista: [
                    { modelo: 'SSG GAL S26 5G 256GB', codigos: '19435;19404;19405;19406;19407;19408;19409;19410' },
                    { modelo: 'SSG GAL S26 5G 512GB', codigos: '19411;19412;19413;19414;19415;19416;19417;19418' },
                    { modelo: 'SSG GAL S26 PLUS 5G 256GB', codigos: '19419;19420;19421;19422;19423;19424;19425;19426' },
                    { modelo: 'SSG GAL S26 PLUS 5G 512GB', codigos: '19427;19428;19429;19430;19431;19432;19433;19434' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 256GB', codigos: '19315;19318;19320;19322;19323;19325;19326;19328' },
                    { modelo: 'SSG GAL S26 ULTRA 5G 1TB', codigos: '19362;19363;19368;19369;19370;19371;19372;19373' },
                    { modelo: 'SSG GAL Z FOLD7 512GB', codigos: '19254;19253;19252' },
                    { modelo: 'SSG GAL Z FOLD7 1TB', codigos: '19251;19250' },
                    { modelo: 'SSG GAL Z FOLD 8 256GB', codigos: '19572;19584;19563' },
                    { modelo: 'SSG GAL Z FOLD 8 512GB', codigos: '19573;19585;19594' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 512GB', codigos: '19566;19586;19567' },
                    { modelo: 'SSG GAL Z FOLD 8 ULTRA 1TB', codigos: '19629;19601;19628' }
                ]
            },
            {
                id: 'ssg-capas-s26',
                tipo: 'CAPAS CUSTOMIC & LAUT',
                leveModelo: 'CAPAS MAGSAFE — FAMÍLIA GALAXY S26',
                leveCodigos: '62954;62955;62956;62980;62981',
                porPreco: 'A partir de R$ 132,30',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '04.11.2026 a 30.11.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre FAMÍLIA GALAXY S26 e leve Capa MagSafe Customic ou Laut',
                compreLista: [
                    { modelo: 'COMPRE: FAMÍLIA GALAXY S26 -> LEVE: CAPA CUSTOMIC SSG GAL S26 LIQUID SILICONE MAGSAFE (R$ 132,30)', codigos: '62954;62955;62956' },
                    { modelo: 'COMPRE: FAMÍLIA GALAXY S26 -> LEVE: CAPA LAUT SSG GAL S26 SHIELD MAGSAFE (R$ 139,30)', codigos: '62981' },
                    { modelo: 'COMPRE: FAMÍLIA GALAXY S26 -> LEVE: CAPA LAUT SSG GAL S26 HOLOGRAFICA MAGSAFE (R$ 160,30)', codigos: '62980' }
                ]
            },
            {
                id: 'ssg-capas-s26-plus',
                tipo: 'CAPAS CUSTOMIC & LAUT',
                leveModelo: 'CAPAS MAGSAFE — FAMÍLIA GALAXY S26 PLUS',
                leveCodigos: '62957;62958;62959;62979',
                porPreco: 'A partir de R$ 132,30',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '04.11.2026 a 30.11.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre FAMÍLIA GALAXY S26 PLUS e leve Capa MagSafe Customic ou Laut',
                compreLista: [
                    { modelo: 'COMPRE: FAMÍLIA GALAXY S26 PLUS -> LEVE: CAPA CUSTOMIC SSG GAL S26 PLUS LIQUID SILICONE MAGSAFE (R$ 132,30)', codigos: '62957;62958;62959' },
                    { modelo: 'COMPRE: FAMÍLIA GALAXY S26 PLUS -> LEVE: CAPA LAUT SSG GAL S26 PLUS HOLOGRAFICA MAGSAFE (R$ 160,30)', codigos: '62979' }
                ]
            },
            {
                id: 'ssg-capas-s26-ultra',
                tipo: 'CAPAS CUSTOMIC & LAUT',
                leveModelo: 'CAPA CUSTOMIC SSG GAL S26 ULTRA LIQUID SILICONE MAGSAFE',
                leveCodigos: '62960;62961;62962',
                porPreco: 'R$ 132,30',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '04.11.2026 a 30.11.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre FAMÍLIA GALAXY S26 ULTRA e leve Capa Customic Liquid Silicone MagSafe',
                compreLista: [
                    { modelo: 'COMPRE: FAMÍLIA GALAXY S26 ULTRA -> LEVE: CAPA CUSTOMIC SSG GAL S26 ULTRA LIQUID SILICONE MAGSAFE (R$ 132,30)', codigos: '62960;62961;62962' }
                ]
            }
        ],
        MOTOROLA: [
            {
                id: 'moto-buds-swarovski',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'MOTO BUDS LOOP CRYSTALS BY SWAROVSKI',
                leveCodigos: '62828',
                porPreco: 'R$ 99,00',
                multiFridayAvulso: 'De R$ 1.299 por R$ 499 (21x R$ 24)',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '10.09.2026 até o final dos estoques',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre MOTO RAZR 60 CRYSTALS BY SWAROVSKI (Cód. 19271)',
                compreLista: [
                    { modelo: 'MOTO RAZR 60 CRYSTALS BY SWAROVSKI', codigos: '19271' }
                ]
            },
            {
                id: 'moto-buds-bass',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'MOTO BUDS BASS',
                leveCodigos: '62891;62889;62890',
                porPreco: 'R$ 199,00',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '04.11.2026 a 30.11.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre Moto G37 5G, Moto G47 5G, Moto G67 5G ou Moto G77 5G',
                compreLista: [
                    { modelo: 'MOTO G37 5G 128GB', codigos: '19741;19721;19731;19722' },
                    { modelo: 'MOTO G47 5G 128GB', codigos: '19508;19518;19519;19528' },
                    { modelo: 'MOTO G67 5G 256GB', codigos: '19392;19393' },
                    { modelo: 'MOTO G77 5G 256GB', codigos: '19394;19395' }
                ]
            },
            {
                id: 'moto-buds-2-plus',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'MOTO BUDS 2+',
                leveCodigos: '63007;62995',
                porPreco: 'R$ 499,00',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '04.11.2026 a 30.11.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre Família Edge, Família Razr ou Moto Signature 5G 512GB',
                compreLista: [
                    { modelo: 'FAMILIA EDGE', codigos: '-' },
                    { modelo: 'FAMILIA RAZR', codigos: '-' },
                    { modelo: 'MOTO SIGNATURE 5G 512GB', codigos: '19397;19398' }
                ]
            }
        ],
        APPLE: [
            {
                id: 'apple-airpods-4-anc',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'AIRPODS 4 ANC',
                leveCodigos: '62704',
                porPreco: 'R$ 1.599,00',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '24.09.2026 a 30.11.2026 (iPhone Duo: início 24.10.2026)',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre Família iPhone 17, Família iPhone 18 ou Família iPhone Duo',
                compreLista: [
                    { modelo: 'FAMILIA IPHONE 17 (Vigência 24.09.2026 a 30.11.2026)', codigos: '-' },
                    { modelo: 'FAMILIA IPHONE 18 (Vigência 24.09.2026 a 30.11.2026)', codigos: '-' },
                    { modelo: 'FAMÍLIA IPHONE DUO (Vigência 24.10.2026 a 30.11.2026)', codigos: '-' }
                ]
            },
            {
                id: 'apple-airpods-pro-2',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'AIRPODS PRO 2ª GERAÇÃO',
                leveCodigos: '62484',
                porPreco: 'R$ 1.999,00',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '24.09.2026 a 30.11.2026 (iPhone Duo: início 24.10.2026)',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre Família iPhone 17, Família iPhone 18 ou Família iPhone Duo',
                compreLista: [
                    { modelo: 'FAMILIA IPHONE 17 (Vigência 24.09.2026 a 30.11.2026)', codigos: '-' },
                    { modelo: 'FAMILIA IPHONE 18 (Vigência 24.09.2026 a 30.11.2026)', codigos: '-' },
                    { modelo: 'FAMÍLIA IPHONE DUO (Vigência 24.10.2026 a 30.11.2026)', codigos: '-' }
                ]
            },
            {
                id: 'apple-airpods-pro-3',
                tipo: 'RELOGIOS & FONES',
                leveModelo: 'AIRPODS PRO 3',
                leveCodigos: '62861',
                porPreco: 'R$ 2.199,00',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '24.09.2026 a 30.11.2026 (iPhone Duo: início 24.10.2026)',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre Família iPhone 17, Família iPhone 18 ou Família iPhone Duo',
                compreLista: [
                    { modelo: 'FAMILIA IPHONE 17 (Vigência 24.09.2026 a 30.11.2026)', codigos: '-' },
                    { modelo: 'FAMILIA IPHONE 18 (Vigência 24.09.2026 a 30.11.2026)', codigos: '-' },
                    { modelo: 'FAMÍLIA IPHONE DUO (Vigência 24.10.2026 a 30.11.2026)', codigos: '-' }
                ]
            },
            {
                id: 'apple-capas-17e',
                tipo: 'CAPAS CUSTOMIC & LAUT',
                leveModelo: 'CAPAS MAGSAFE — FAMILIA IPHONE 17E + PELÍCULA',
                leveCodigos: '62990;62992;62991;62983',
                porPreco: 'R$ 132,30 a R$ 160,30',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '04.11.2026 a 30.11.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre FAMILIA IPHONE 17E + PELÍCULA',
                compreLista: [
                    { modelo: 'LEVE: CAPA CUSTOMIC APPLE IPHONE 17E LIQUID SILICONE MAGSAFE — POR R$ 132,30', codigos: '62990;62992;62991' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE 17E HOLOGRAFICA MAGSAFE — POR R$ 160,30', codigos: '62983' }
                ]
            },
            {
                id: 'apple-capas-17',
                tipo: 'CAPAS CUSTOMIC & LAUT',
                leveModelo: 'CAPAS MAGSAFE — FAMILIA IPHONE 17 + PELÍCULA',
                leveCodigos: '62937;62938;62939;62940;62984',
                porPreco: 'R$ 132,30 a R$ 160,30',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '04.11.2026 a 30.11.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre FAMILIA IPHONE 17 + PELÍCULA',
                compreLista: [
                    { modelo: 'LEVE: CAPA CUSTOMIC IPHONE 17 LIQUID SILICONE MAGSAFE — POR R$ 132,30', codigos: '62937;62938;62939;62940' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE 17 HOLOGRAFICA MAGSAFE — POR R$ 160,30', codigos: '62984' }
                ]
            },
            {
                id: 'apple-capas-17-pro',
                tipo: 'CAPAS CUSTOMIC & LAUT',
                leveModelo: 'CAPAS MAGSAFE — FAMILIA IPHONE 17 PRO + PELÍCULA',
                leveCodigos: '62941;62942;62945;62947;62948;62874;62985;62973;62975',
                porPreco: 'R$ 132,30 a R$ 188,30',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '04.11.2026 a 30.11.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre FAMILIA IPHONE 17 PRO + PELÍCULA',
                compreLista: [
                    { modelo: 'LEVE: CAPA CUSTOMIC IPHONE 17 PRO LIQUID SILICONE MAGSAFE — POR R$ 132,30', codigos: '62941;62942;62945;62947;62948;62874' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE 17 PRO HOLOGRAFICA MAGSAFE — POR R$ 160,30', codigos: '62985' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE 17 PRO CRISTAL FLURO MAGSAFE — POR R$ 188,30', codigos: '62973;62975' }
                ]
            },
            {
                id: 'apple-capas-17-promax',
                tipo: 'CAPAS CUSTOMIC & LAUT',
                leveModelo: 'CAPAS MAGSAFE — FAMILIA IPHONE 17 PRO MAX + PELÍCULA',
                leveCodigos: '62949;62950;62951;62952;62953;62875;62986;62972;62974',
                porPreco: 'R$ 132,30 a R$ 188,30',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '04.11.2026 a 30.11.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre FAMILIA IPHONE 17 PRO MAX + PELÍCULA',
                compreLista: [
                    { modelo: 'LEVE: CAPA CUSTOMIC APPLE IPHONE 17 PRO MAX LIQUID SILICONE MAGSAFE — POR R$ 132,30', codigos: '62949;62950;62951;62952;62953;62875' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE 17 PRO MAX HOLOGRAFICA MAGSAFE — POR R$ 160,30', codigos: '62986' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE 17 PRO MAX CRISTAL FLURO MAGSAFE — POR R$ 188,30', codigos: '62972;62974' }
                ]
            },
            {
                id: 'apple-capas-18-pro',
                tipo: 'CAPAS CUSTOMIC & LAUT',
                leveModelo: 'CAPAS MAGSAFE — FAMILIA IPHONE 18 PRO + PELÍCULA',
                leveCodigos: '63074;63127;63126;63103;63115;63097;63045;63092;63077',
                porPreco: 'R$ 132,30 a R$ 188,30',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '04.11.2026 a 30.11.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre FAMILIA IPHONE 18 PRO + PELÍCULA',
                compreLista: [
                    { modelo: 'LEVE: CAPA CUSTOMIC APPLE IPHONE 18 PRO LIQUID SILICONE MAGSAFE — POR R$ 132,30', codigos: '63074;63127;63126;63103' },
                    { modelo: 'LEVE: CAPA CUSTOMIC APPLE IPHONE 18 PRO IMPACTOR ORBIT MAGSAFE — POR R$ 139,30', codigos: '63115' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE 18 PRO HOLOGRAFICA MAGSAFE — POR R$ 160,30', codigos: '63097' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE 18 PRO CRISTAL FLURO MAGSAFE — POR R$ 188,30', codigos: '63045;63092;63077' }
                ]
            },
            {
                id: 'apple-capas-18-promax',
                tipo: 'CAPAS CUSTOMIC & LAUT',
                leveModelo: 'CAPAS MAGSAFE — FAMILIA IPHONE 18 PRO MAX + PELÍCULA',
                leveCodigos: '63082;63094;63125;63102;63114;63090;63093;63118;63098',
                porPreco: 'R$ 132,30 a R$ 188,30',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '04.11.2026 a 30.11.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre FAMILIA IPHONE 18 PRO MAX + PELÍCULA',
                compreLista: [
                    { modelo: 'LEVE: CAPA CUSTOMIC APPLE IPHONE 18 PRO MAX LIQUID SILICONE MAGSAFE — POR R$ 132,30', codigos: '63082;63094;63125;63102' },
                    { modelo: 'LEVE: CAPA CUSTOMIC APPLE IPHONE 18 PRO MAX IMPACTOR ORBIT MAGSAFE — POR R$ 139,30', codigos: '63114' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE 18 PRO MAX HOLOGRAFICA MAGSAFE — POR R$ 160,30', codigos: '63090' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE 18 PRO MAX CRISTAL FLURO MAGSAFE — POR R$ 188,30', codigos: '63093;63118;63098' }
                ]
            },
            {
                id: 'apple-capas-duo',
                tipo: 'CAPAS CUSTOMIC & LAUT',
                leveModelo: 'CAPAS MAGSAFE — FAMILIA IPHONE DUO + PELÍCULA',
                leveCodigos: '63117;63081;63080;63079;63128;63091;63129;63096;63104',
                porPreco: 'R$ 132,30 a R$ 279,30',
                campanha: 'BUD',
                canais: 'LOJA PRÓPRIA',
                vigencia: '04.11.2026 a 30.11.2026',
                observacoes: 'VÁLIDO PARA VENDAS NO SINGLE E COMBO MULTI',
                resumoCompre: 'Compre FAMILIA IPHONE DUO + PELÍCULA',
                compreLista: [
                    { modelo: 'LEVE: CAPA CUSTOMIC APPLE IPHONE DUO LIQUID SILICONE MAGSAFE — POR R$ 132,30', codigos: '63117;63081;63080;63079' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE DUO CRISTAL FLURO MAGSAFE — POR R$ 188,30', codigos: '63128;63091;63129' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE DUO LUXEDGE MAGSAFE — POR R$ 279,30', codigos: '63096' },
                    { modelo: 'LEVE: CAPA LAUT APPLE IPHONE DUO KEV PROTECT MAGSAFE — POR R$ 279,30', codigos: '63104' }
                ]
            }
        ]
    };

    // Destaques Avulsos da Lâmina MULTI FRIDAY (12/11 a 30/11) e Produtos Amazon (19/11 a 30/11)
    const MULTI_FRIDAY_POR_MARCA = {
        SAMSUNG: [
            { item: 'GALAXY FIT3', de: 'R$ 429', por: 'R$ 349', parcelas: '21x R$ 17 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL BUDS CORE', de: 'R$ 349', por: 'R$ 289', parcelas: '21x R$ 14 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL BUDS FE', de: 'R$ 499', por: 'R$ 399', parcelas: '21x R$ 19 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL BUDS 3 FE', de: 'R$ 999', por: 'R$ 799', parcelas: '21x R$ 39 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'FONE TWS GAL BUDS4', de: 'R$ 1.499', por: 'R$ 1.299', parcelas: '21x R$ 62 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL BUDS3', de: 'R$ 1.699', por: 'R$ 1.399', parcelas: '21x R$ 67 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'FONE TWS GAL BUDS4 PRO', de: 'R$ 1.799', por: 'R$ 1.499', parcelas: '21x R$ 72 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL BUDS3 PRO', de: 'R$ 2.199', por: 'R$ 1.899', parcelas: '21x R$ 91 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL TAB A11 PLUS 128GB (WIFI)', de: 'R$ 2.149', por: 'R$ 1.399', parcelas: '21x R$ 67 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL WATCH 8 40MM LTE', de: 'R$ 1.799', por: 'R$ 1.599', parcelas: '21x R$ 77 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL WATCH 8 44MM LTE', de: 'R$ 1.999', por: 'R$ 1.699', parcelas: '21x R$ 81 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL WATCH 7 40MM LTE', de: 'R$ 2.799', por: 'R$ 1.899', parcelas: '21x R$ 91 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL WATCH 8 CLASSIC 46MM LTE', de: 'R$ 3.699', por: 'R$ 1.999', parcelas: '21x R$ 96 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL WATCH ULTRA 2025 47MM LTE', de: 'R$ 2.999', por: 'R$ 1.999', parcelas: '21x R$ 96 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL WATCH 7 44MM LTE', de: 'R$ 2.999', por: 'R$ 2.099', parcelas: '21x R$ 100 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL WATCH 9 40MM LTE', de: 'R$ 2.499', por: 'R$ 2.299', parcelas: '21x R$ 110 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL WATCH 9 44MM LTE', de: 'R$ 2.699', por: 'R$ 2.499', parcelas: '21x R$ 119 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'GAL WATCH ULTRA2 47MM LTE', de: 'R$ 3.999', por: 'R$ 2.999', parcelas: '21x R$ 143 s/ juros', vigencia: '12/11 até 30/11' }
        ],
        MOTOROLA: [
            { item: 'MOTO WATCH FIT', de: 'R$ 999', por: 'R$ 399', parcelas: '21x R$ 19 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'MOTO BUDS LOOP', de: 'R$ 999', por: 'R$ 499', parcelas: '21x R$ 24 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'MOTO BUDS LOOP SWAROVSKI', de: 'R$ 1.299', por: 'R$ 499', parcelas: '21x R$ 24 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'MOTO WATCH BY POLAR', de: 'R$ 1.499', por: 'R$ 699', parcelas: '21x R$ 34 s/ juros', vigencia: '12/11 até 30/11' }
        ],
        APPLE: [
            { item: 'CARTEIRA SUPORTE MAGSAFE CUSTOMIC', de: 'R$ 149', por: 'R$ 99', parcelas: '12x R$ 9 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'BATERIA EXTERNA SLIM MAGSAFE GEONAV USBC 5000MAH', de: 'R$ 199', por: 'R$ 149', parcelas: '12x R$ 13 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'ALÇA CABO USBC USBC 60W CUSTOMIC', de: 'R$ 149', por: 'R$ 99', parcelas: '12x R$ 9 s/ juros', vigencia: '12/11 até 30/11' },
            { item: 'ALÇA CUSTOMIC CROSSBODY CORRENTE / 6MM', de: 'R$ 149', por: 'R$ 99', parcelas: '12x R$ 9 s/ juros', vigencia: '12/11 até 30/11' }
        ]
    };

    // Sincronizar com documento de flyers na nuvem (Oracle / GEEK_DOCS)
    useEffect(() => {
        try {
            const cloudDoc = (geekDocs || []).find(d => d.id === 'CONFIG_FLYERS_34' || d.categoria === '__FLYERS_CARROSSEL__');
            if (cloudDoc && Array.isArray(cloudDoc.flyersList)) {
                setFlyers(cloudDoc.flyersList);
                try {
                    localStorage.setItem('CLARO_GEEK_FLYERS_34', JSON.stringify(cloudDoc.flyersList));
                } catch {}
            }
        } catch {}
    }, [geekDocs]);

    // Função central para salvar flyers com persistência local e nuvem
    const saveFlyersList = (newList) => {
        setFlyers(newList);
        try {
            localStorage.setItem('CLARO_GEEK_FLYERS_34', JSON.stringify(newList));
        } catch (err) {
            console.warn('Erro ao salvar flyers no localStorage:', err);
        }
        if (typeof setGeekDocs === 'function') {
            setGeekDocs(prev => {
                const filtered = (prev || []).filter(d => d.id !== 'CONFIG_FLYERS_34' && d.categoria !== '__FLYERS_CARROSSEL__');
                const cloudDoc = {
                    id: 'CONFIG_FLYERS_34',
                    titulo: 'Flyers de Campanha 3:4',
                    categoria: '__FLYERS_CARROSSEL__',
                    flyersList: newList,
                    data: new Date().toLocaleDateString('pt-BR'),
                    updatedAt: Date.now()
                };
                return [cloudDoc, ...filtered];
            });
        }
    };

    const viewedDocs = getStoredViewedGeekDocs(globalUser);

    const categoriasPadrao = [
        { id: 'BOOK DE OFERTAS', icon: <BookOpen size={20} className="text-blue-500" /> },
        { id: 'MÓDULOS BUNDLE', icon: <Layers size={20} className="text-purple-500" /> },
        { id: 'PROMOMEMO DE ACESSÓRIOS', icon: <Tag size={20} className="text-green-500" /> },
        { id: 'CARTILHA DE COMISSIONAMENTO', icon: <FileText size={20} className="text-emerald-500" /> },
        { id: 'MAPA DE PREÇOS', icon: <Tag size={20} className="text-rose-500" /> },
        { id: 'MATERIAL DE TREINAMENTO', icon: <BookOpen size={20} className="text-yellow-500" /> },
        { id: 'OUTROS', icon: <Archive size={20} className="text-orange-500" /> }
    ];

    const categoriasUnicas = Array.from(new Set((geekDocs || []).filter(d => d.categoria !== '__FLYERS_CARROSSEL__').map(d => d.categoria)));
    const allCategorias = [...categoriasPadrao];
    categoriasUnicas.forEach(catId => {
        if (!allCategorias.some(c => c.id === catId)) {
            allCategorias.push({ id: catId, icon: <FolderPlus size={20} className="text-indigo-500" /> });
        }
    });

    const userRole = String(globalUser?.role || '').trim().toUpperCase();
    const canEdit = isGerente || ['GEEK', 'ADMINISTRAÇÃO', 'GERENTE', 'SENIOR', 'ASSISTENTE RELACIONAMENTO', 'JOVEM APRENDIZ'].includes(userRole);

    // --- FUNÇÕES DE NAVEGAÇÃO DO CARROSSEL ---
    const scrollCarousel = (direction) => {
        if (!carouselRef.current) return;
        const scrollAmount = 300;
        carouselRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    const handleOpenFlyerModal = () => {
        setEditingFlyerId(null);
        setFlyerFormData({
            titulo: '',
            subtitulo: '',
            tag: 'CAMPANHA OFICIAL',
            imagemUrl: '',
            link: ''
        });
        setIsFlyerModalOpen(true);
    };

    const handleEditFlyer = (flyer) => {
        setEditingFlyerId(flyer.id);
        setFlyerFormData({
            titulo: flyer.titulo || '',
            subtitulo: flyer.subtitulo || '',
            tag: flyer.tag || 'CAMPANHA OFICIAL',
            imagemUrl: flyer.imagemUrl || '',
            link: flyer.link || ''
        });
        setIsFlyerModalOpen(true);
    };

    const handleDeleteFlyer = (id) => {
        if (!canEdit) {
            toast.error('Acesso negado. Apenas perfis autorizados podem excluir flyers.');
            return;
        }
        if (window.confirm('Deseja excluir este flyer de campanha definitivamente?')) {
            const updated = flyers.filter(f => f.id !== id);
            saveFlyersList(updated);
            if (previewFlyer?.id === id) {
                setPreviewFlyer(null);
            }
            toast.success('Flyer excluído com sucesso!');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressed = await compressImageFile(file);
            if (compressed) {
                setFlyerFormData(prev => ({ ...prev, imagemUrl: compressed }));
                toast.success('Imagem otimizada em alta definição!');
            }
        } catch {
            toast.error('Erro ao processar imagem.');
        }
    };

    const handleFlyerSubmit = (e) => {
        e.preventDefault();
        if (!flyerFormData.titulo.trim()) {
            toast.error('Informe o título do flyer.');
            return;
        }
        if (!flyerFormData.imagemUrl.trim()) {
            toast.error('Informe a URL da imagem ou faça o upload de um arquivo.');
            return;
        }

        let finalLink = flyerFormData.link.trim();
        if (finalLink && !finalLink.startsWith('http://') && !finalLink.startsWith('https://')) {
            finalLink = 'https://' + finalLink;
        }

        let updatedList = [];
        if (editingFlyerId) {
            updatedList = flyers.map(f => f.id === editingFlyerId ? {
                ...f,
                titulo: flyerFormData.titulo.trim(),
                subtitulo: flyerFormData.subtitulo.trim(),
                tag: flyerFormData.tag.trim().toUpperCase(),
                imagemUrl: flyerFormData.imagemUrl.trim(),
                link: finalLink,
                updatedAt: Date.now()
            } : f);
            toast.success('Flyer atualizado com sucesso!');
        } else {
            const novoFlyer = {
                id: Date.now(),
                titulo: flyerFormData.titulo.trim(),
                subtitulo: flyerFormData.subtitulo.trim(),
                tag: flyerFormData.tag.trim().toUpperCase(),
                imagemUrl: flyerFormData.imagemUrl.trim(),
                link: finalLink,
                data: new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
                updatedAt: Date.now()
            };
            updatedList = [novoFlyer, ...flyers];
            toast.success('Novo flyer publicado no carrossel!');
        }

        saveFlyersList(updatedList);
        setIsFlyerModalOpen(false);
        setEditingFlyerId(null);
    };

    // --- FUNÇÕES DE DOCUMENTOS ---
    const handleOpenModal = () => {
        setEditingId(null);
        setFormData({ titulo: '', categoria: 'BOOK DE OFERTAS', link: '' });
        setIsNovaCategoria(false);
        setNovaCategoriaNome('');
        setIsModalOpen(true);
    };

    const handleEdit = (doc) => {
        setEditingId(doc.id);
        setFormData({ titulo: doc.titulo, categoria: doc.categoria, link: doc.link });
        setIsNovaCategoria(false);
        setNovaCategoriaNome('');
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalCategoria = isNovaCategoria ? novaCategoriaNome.trim().toUpperCase() : formData.categoria;

        if (!formData.titulo || !formData.link || !finalCategoria) {
            toast.error('Preencha o título, a categoria e o link do documento.');
            return;
        }

        let finalLink = formData.link;
        if (!finalLink.startsWith('http://') && !finalLink.startsWith('https://')) {
            finalLink = 'https://' + finalLink;
        }

        if (editingId) {
            setGeekDocs(prev => prev.map(doc => doc.id === editingId ? {
                ...doc,
                titulo: formData.titulo,
                categoria: finalCategoria,
                link: finalLink,
                updatedAt: Date.now()
            } : doc));
            toast.success('Documento atualizado com sucesso!');
        } else {
            const newDoc = {
                id: Date.now(),
                titulo: formData.titulo,
                categoria: finalCategoria,
                link: finalLink,
                data: new Date().toLocaleDateString('pt-BR'),
                updatedAt: Date.now()
            };

            setGeekDocs(prev => [newDoc, ...prev]);
            toast.success('Documento adicionado com sucesso!');
        }
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleDelete = (id) => {
        if (!canEdit) {
            toast.error('Acesso negado. Apenas os perfis GEEK, ADMINISTRAÇÃO ou GERENTE podem excluir documentos.');
            return;
        }
        if (window.confirm('Deseja excluir este documento?')) {
            setGeekDocs(prev => prev.filter(doc => doc.id !== id));
            toast.success('Documento excluído.');
        }
    };

    const persistViewedGeekDocs = (nextViewed) => {
        const userKey = String(globalUser?.username || 'default').toUpperCase();
        try {
            localStorage.setItem(`CLARO_VIEWED_GEEK_${userKey}`, JSON.stringify(nextViewed));
        } catch {}
        if (typeof updateUserProfile === 'function') {
            updateUserProfile({ viewedGeekDocs: nextViewed });
        }
    };

    const markAsViewed = (doc) => {
        if (!doc) return;
        const docKey = String(doc.id);
        const lastUpdated = doc.updatedAt || doc.id;
        if (String(viewedDocs[docKey] ?? viewedDocs[doc.id] ?? '') !== String(lastUpdated)) {
            const newViewed = { ...viewedDocs, [docKey]: lastUpdated, [doc.id]: lastUpdated };
            persistViewedGeekDocs(newViewed);
        }
    };

    const isDocNew = (doc) => {
        if (!doc || doc.id === 'CONFIG_FLYERS_34' || doc.categoria === '__FLYERS_CARROSSEL__') {
            return false;
        }
        const docKey = String(doc.id);
        const lastUpdated = String(doc.updatedAt || doc.id);
        const ts = Number(doc.updatedAt || doc.id);
        const isRecent = Number.isFinite(ts) ? (Date.now() - ts) < 15 * 24 * 60 * 60 * 1000 : false;
        if (!isRecent) return false;
        return String(viewedDocs[docKey] ?? viewedDocs[doc.id] ?? '') !== lastUpdated;
    };

    // Ao entrar na seção GEEK, marca automaticamente os itens atuais como visualizados para liberar a bolinha de notificação do menu
    useEffect(() => {
        if (!Array.isArray(geekDocs) || geekDocs.length === 0) return;
        const currentViewed = getStoredViewedGeekDocs(globalUser);
        let hasUnseen = false;
        const updatedViewed = { ...currentViewed };

        geekDocs.forEach(doc => {
            if (!doc || doc.id === undefined) return;
            const docKey = String(doc.id);
            const lastUpdated = doc.updatedAt || doc.id;
            if (String(updatedViewed[docKey] ?? updatedViewed[doc.id] ?? '') !== String(lastUpdated)) {
                updatedViewed[docKey] = lastUpdated;
                updatedViewed[doc.id] = lastUpdated;
                hasUnseen = true;
            }
        });

        if (hasUnseen) {
            persistViewedGeekDocs(updatedViewed);
        }
    }, [geekDocs, globalUser?.username]);

    const hasNews = (geekDocs || []).some(isDocNew);

    return (
        <div className="h-full flex flex-col bg-neutral-50/50 dark:bg-neutral-950/50 rounded-2xl overflow-y-auto animate-fade-in transition-colors">
            {/* Cabeçalho Principal */}
            <div className="p-6 pb-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Cpu size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Espaço GEEK & Mural Telecom</h2>
                            {hasNews ? (
                                <span className="bg-red-100 text-[#E3000F] dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#E3000F] mr-1.5"></span>
                                    Novidades
                                </span>
                            ) : (
                                <span className="bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                    Tudo Visto
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">
                            Campanhas em formato flyer 3:4, central de documentos oficiais, books de ofertas e comunicados.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {canEdit && (
                        <>
                            <button
                                type="button"
                                onClick={handleOpenFlyerModal}
                                className="px-4 py-2.5 bg-gradient-to-r from-[#E3000F] to-red-700 text-white text-xs sm:text-sm font-bold rounded-xl hover:from-red-600 hover:to-red-800 transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                title="Cadastrar novo flyer de campanha na proporção 3:4"
                            >
                                <Sparkles size={16} /> + Novo Flyer (3:4)
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenModal}
                                className="px-4 py-2.5 bg-indigo-600 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                            >
                                <Plus size={16} /> Novo Documento
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="px-6 pb-8 space-y-8 max-w-7xl mx-auto w-full">
                {/* SEÇÃO CARROSSEL DE FLYERS 3:4 */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F]">
                                <Megaphone size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                                    Campanhas & Divulgações da Empresa (Flyers 3:4)
                                    <span className="bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] px-2 py-0.5 rounded-full text-[10px] font-bold">
                                        {flyers.length} {flyers.length === 1 ? 'flyer' : 'flyers'}
                                    </span>
                                </h3>
                                <p className="text-[11px] text-neutral-400 font-medium">
                                    Visualização em formato vertical de cartaz/flyer telecom (proporção 3:4). Clique para ampliar.
                                </p>
                            </div>
                        </div>

                        {/* Botões de Navegação do Carrossel */}
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => scrollCarousel('left')}
                                className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all shadow-sm"
                                title="Voltar Flyer"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollCarousel('right')}
                                className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all shadow-sm"
                                title="Próximo Flyer"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Trilho de Flyers com Proporção Exata 3:4 */}
                    <div
                        ref={carouselRef}
                        className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-hide snap-x snap-mandatory"
                        style={{ scrollSnapType: 'x mandatory' }}
                    >
                        {flyers.map((flyer) => (
                            <div
                                key={flyer.id}
                                className="group relative shrink-0 w-[240px] sm:w-[270px] aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-900 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 snap-start flex flex-col justify-end cursor-pointer"
                                onClick={() => setPreviewFlyer(flyer)}
                            >
                                {/* Imagem de Fundo com proporção 3:4 */}
                                <img
                                    src={flyer.imagemUrl}
                                    alt={flyer.titulo}
                                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop';
                                    }}
                                />

                                {/* Gradiente Escuro de Sobreposição para Leitura Perfeita */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                                {/* Badge Superior de Tag */}
                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                                    <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#E3000F] text-white shadow-md">
                                        {flyer.tag || 'CAMPANHA'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white/90 bg-black/50 backdrop-blur-sm">
                                        {flyer.data}
                                    </span>
                                </div>

                                {/* Ações do Flyer (Editar / Excluir para perfis autorizados) */}
                                {canEdit && (
                                    <div
                                        className="absolute top-3 right-3 flex items-center gap-1 z-20 transition-all bg-black/80 backdrop-blur-sm p-1 rounded-lg border border-white/20 shadow-md"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleEditFlyer(flyer)}
                                            className="p-1.5 text-white hover:text-blue-400 hover:bg-white/10 rounded transition-colors"
                                            title="Editar Flyer"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteFlyer(flyer.id)}
                                            className="p-1.5 text-white hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                                            title="Excluir Flyer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}

                                {/* Informações Inferiores do Flyer */}
                                <div className="relative z-10 p-4 flex flex-col gap-1 text-white">
                                    <h4 className="font-black text-sm uppercase tracking-wide leading-snug line-clamp-2 drop-shadow">
                                        {flyer.titulo}
                                    </h4>
                                    {flyer.subtitulo && (
                                        <p className="text-[11px] text-neutral-300 font-medium line-clamp-2 leading-relaxed">
                                            {flyer.subtitulo}
                                        </p>
                                    )}

                                    <div className="pt-2 flex items-center justify-between gap-2 mt-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                                            <Maximize2 size={11} /> Clique p/ ver
                                        </span>
                                        {flyer.link && (
                                            <a
                                                href={flyer.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-2 py-1 rounded bg-white/20 hover:bg-white text-white hover:text-neutral-900 text-[10px] font-bold flex items-center gap-1 transition-all"
                                                title="Acessar link externo da campanha"
                                            >
                                                Link <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Botão Card para Adicionar Novo Flyer (Proporção 3:4) */}
                        {canEdit && (
                            <button
                                type="button"
                                onClick={handleOpenFlyerModal}
                                className="shrink-0 w-[240px] sm:w-[270px] aspect-[3/4] rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#E3000F] dark:hover:border-[#E3000F] bg-neutral-50/50 dark:bg-neutral-800/20 hover:bg-red-50/20 dark:hover:bg-red-950/10 flex flex-col items-center justify-center gap-3 p-6 text-neutral-400 hover:text-[#E3000F] transition-all group snap-start"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800 group-hover:bg-red-100 dark:group-hover:bg-[#E3000F]/20 flex items-center justify-center text-neutral-500 group-hover:text-[#E3000F] transition-all">
                                    <Plus size={24} />
                                </div>
                                <div className="text-center">
                                    <span className="block text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-200 group-hover:text-[#E3000F]">
                                        + Novo Flyer (3:4)
                                    </span>
                                    <span className="block text-[10px] text-neutral-400 mt-1">
                                        Adicionar cartaz ou comunicado oficial
                                    </span>
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                {/* SEÇÃO BUNDLES — OFERTAS CONJUNTAS (SAMSUNG, MOTOROLA, APPLE) */}
                <div
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm space-y-5 antialiased w-full max-w-full min-w-0 overflow-hidden box-border"
                    style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F] shrink-0">
                                <Layers size={22} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h3 className="text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-100 break-words">
                                        Bundles — Ofertas Conjuntas de Aparelhos
                                    </h3>
                                    <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                        Single & Combo Multi • Loja Própria
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5 break-words">
                                    Consulte aparelhos elegíveis (COMPRE), acessórios do bundle (LEVE), códigos SAP e preços promocionais.
                                </p>
                            </div>
                        </div>

                        {/* SELETOR DE MARCAS (SAMSUNG | MOTOROLA | APPLE) */}
                        <div className="flex items-center flex-wrap sm:flex-nowrap bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700 w-full sm:w-auto self-start lg:self-auto min-w-0">
                            {['SAMSUNG', 'MOTOROLA', 'APPLE'].map((marca) => {
                                const isActive = selectedBundleBrand === marca;
                                const count = (BUNDLES_POR_MARCA[marca] || []).length;
                                return (
                                    <button
                                        key={marca}
                                        type="button"
                                        onClick={() => setSelectedBundleBrand(marca)}
                                        className={`flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 min-w-0 ${
                                            isActive
                                                ? 'bg-[#E3000F] text-white shadow-sm'
                                                : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <span className="truncate">{marca}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                                            isActive ? 'bg-black/25 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* BARRA DE BUSCA POR MODELO / CÓDIGO SAP + FILTRO DE CATEGORIA */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 min-w-0 max-w-full">
                        <div className="relative flex-1 min-w-0">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
                            <input
                                type="text"
                                value={bundleSearch}
                                onChange={(e) => setBundleSearch(e.target.value)}
                                placeholder="Buscar por modelo de aparelho (ex: S26 Ultra, A57, iPhone 18, Razr) ou Código SAP (ex: 19329, 62861)..."
                                className="w-full max-w-full pl-10 pr-9 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] transition-all"
                            />
                            {bundleSearch && (
                                <button
                                    type="button"
                                    onClick={() => setBundleSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                    title="Limpar busca"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 min-w-0 max-w-full">
                            {[
                                { id: 'TODOS', label: 'Todos os Bundles' },
                                { id: 'RELOGIOS & FONES', label: 'RELOGIOS & FONES' },
                                { id: 'CAPAS CUSTOMIC & LAUT', label: 'Capas MagSafe' },
                                { id: 'MULTI_FRIDAY', label: 'Lâmina Multi Friday (Avulso)' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setBundleSubFilter(tab.id)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                                        bundleSubFilter === tab.id
                                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm'
                                            : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CARDS RESUMO DAS 3 MARCAS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full max-w-full min-w-0">
                        {[
                            { marca: 'SAMSUNG', desc: 'Buds Core, Fit3, Buds 3 FE, Buds4/4 Pro, Watch 8/Classic, Watch 9, Watch Ultra/Ultra2 + Capas S26' },
                            { marca: 'MOTOROLA', desc: 'Moto Buds Loop Swarovski (R$ 99), Moto Buds Bass (R$ 199) e Moto Buds 2+ (R$ 499)' },
                            { marca: 'APPLE', desc: 'AirPods 4 ANC, AirPods Pro 2ª Ger, AirPods Pro 3 + Capas Customic & Laut MagSafe (iPhone 17/18/Duo)' }
                        ].map(({ marca, desc }) => {
                            const listaModelos = BUNDLES_POR_MARCA[marca] || [];
                            const isSelected = selectedBundleBrand === marca;
                            return (
                                <div
                                    key={marca}
                                    onClick={() => setSelectedBundleBrand(marca)}
                                    className={`rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between gap-2 min-w-0 max-w-full overflow-hidden ${
                                        isSelected
                                            ? 'border-[#E3000F] bg-red-50/20 dark:bg-[#E3000F]/10 shadow-sm'
                                            : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 hover:border-neutral-300 dark:hover:border-neutral-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-[#E3000F]' : 'bg-neutral-400'}`} />
                                            <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate">
                                                Bundles {marca}
                                            </h4>
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                                            isSelected ? 'bg-[#E3000F] text-white' : 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                                        }`}>
                                            {listaModelos.length} {listaModelos.length === 1 ? 'oferta' : 'ofertas'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-400 font-normal leading-relaxed break-words">
                                        {desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* LISTAGEM DETALHADA DOS BUNDLES DA MARCA SELECIONADA */}
                    {bundleSubFilter === 'MULTI_FRIDAY' ? (
                        <div className="space-y-3.5 pt-1 min-w-0 max-w-full">
                            <div className="flex items-center justify-between flex-wrap gap-2 min-w-0">
                                <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 break-words">
                                    <Tag size={16} className="text-[#E3000F] shrink-0" />
                                    <span>Ofertas Avulsas Multi Friday — {selectedBundleBrand} (Válido 12/11 até 30/11)</span>
                                </h4>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                    Parcelamento em até 21x sem juros
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full max-w-full min-w-0">
                                {(MULTI_FRIDAY_POR_MARCA[selectedBundleBrand] || [])
                                    .filter(item => !bundleSearch.trim() || item.item.toLowerCase().includes(bundleSearch.trim().toLowerCase()))
                                    .map((mf, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between gap-2.5 min-w-0 max-w-full overflow-hidden">
                                            <div className="min-w-0">
                                                <span className="text-xs font-semibold text-[#E3000F] bg-red-50 dark:bg-[#E3000F]/10 px-2.5 py-0.5 rounded-md inline-block">
                                                    Multi Friday • {mf.vigencia}
                                                </span>
                                                <h5 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 mt-2 break-words">
                                                    {mf.item}
                                                </h5>
                                            </div>
                                            <div className="flex items-end justify-between flex-wrap gap-2 pt-2.5 border-t border-neutral-200/70 dark:border-neutral-800">
                                                <div>
                                                    <span className="block text-xs text-neutral-400 line-through font-medium">
                                                        De: {mf.de}
                                                    </span>
                                                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                                        Por: {mf.por}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-200/60 dark:bg-neutral-800 px-2.5 py-1 rounded-lg">
                                                    {mf.parcelas}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ) : (
                        (() => {
                            const query = bundleSearch.trim().toLowerCase();
                            const sourceList = BUNDLES_POR_MARCA[selectedBundleBrand] || [];
                            const filteredBundles = sourceList.filter((b) => {
                                if (bundleSubFilter !== 'TODOS' && b.tipo !== bundleSubFilter) return false;
                                if (!query) return true;
                                const inHeader =
                                    b.leveModelo.toLowerCase().includes(query) ||
                                    b.leveCodigos.toLowerCase().includes(query) ||
                                    b.porPreco.toLowerCase().includes(query) ||
                                    b.resumoCompre.toLowerCase().includes(query);
                                const inCompre = (b.compreLista || []).some(
                                    (c) =>
                                        c.modelo.toLowerCase().includes(query) ||
                                        String(c.codigos).toLowerCase().includes(query)
                                );
                                return inHeader || inCompre;
                            });

                            if (filteredBundles.length === 0) {
                                return (
                                    <div className="py-10 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
                                        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                            Nenhuma oferta encontrada em {selectedBundleBrand} para "{bundleSearch}"
                                        </p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                            Tente buscar outro modelo, código SAP ou troque a aba da fabricante acima.
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-full min-w-0">
                                    {filteredBundles.map((bundle) => {
                                        const isExpanded = !!expandedBundleIds[bundle.id] || query.length > 0;
                                        const compreToShow = isExpanded ? bundle.compreLista : bundle.compreLista.slice(0, 4);
                                        const hiddenCount = Math.max(0, bundle.compreLista.length - 4);
                                        const formattedLeveCodigos = String(bundle.leveCodigos || '').replace(/;/g, '; ');

                                        return (
                                            <div
                                                key={bundle.id}
                                                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 md:p-5 flex flex-col justify-between gap-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-sm w-full max-w-full min-w-0 overflow-hidden box-border"
                                            >
                                                {/* Topo do Card: Tipo + Vigência + Preço do Bundle */}
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5 border-b border-neutral-100 dark:border-neutral-800 min-w-0">
                                                    <div className="space-y-2 min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 max-w-full ${
                                                                bundle.tipo.includes('CAPAS')
                                                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/30'
                                                                    : 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border border-purple-200/60 dark:border-purple-500/30'
                                                            }`}>
                                                                {bundle.tipo.includes('CAPAS') ? <Shield size={13} className="shrink-0" /> : <Watch size={13} className="shrink-0" />}
                                                                <span className="truncate">{bundle.tipo}</span>
                                                            </span>
                                                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                                                                Vigência: {bundle.vigencia}
                                                            </span>
                                                        </div>

                                                        <div className="min-w-0">
                                                            <span className="text-xs font-semibold text-[#E3000F] block">
                                                                Leve no Bundle:
                                                            </span>
                                                            <h5 className="text-base font-bold text-neutral-800 dark:text-neutral-100 leading-snug mt-0.5 break-words">
                                                                {bundle.leveModelo}
                                                            </h5>
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-wrap pt-0.5 min-w-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopySap(bundle.leveCodigos)}
                                                                className="max-w-full px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-[#E3000F] flex items-center gap-1.5 cursor-pointer transition-colors text-left min-w-0"
                                                                title="Clique para copiar o(s) código(s) SAP do acessório"
                                                            >
                                                                <span className="break-words min-w-0">Cód. SAP: {formattedLeveCodigos}</span>
                                                                {copiedCode === String(bundle.leveCodigos) ? (
                                                                    <Check size={13} className="text-emerald-500 shrink-0" />
                                                                ) : (
                                                                    <Copy size={13} className="text-neutral-400 shrink-0" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Bloco de Preço POR */}
                                                    <div className="sm:text-right shrink-0 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-4 py-2.5">
                                                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                                                            Preço Bundle (Por)
                                                        </span>
                                                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                                            {bundle.porPreco}
                                                        </span>
                                                        {bundle.multiFridayAvulso && (
                                                            <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                                Avulso: {bundle.multiFridayAvulso}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Lista de Aparelhos Elegíveis (COMPRE) */}
                                                <div className="space-y-2.5 min-w-0 max-w-full">
                                                    <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                                                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 min-w-0">
                                                            <Smartphone size={14} className="text-[#E3000F] shrink-0" />
                                                            <span className="break-words">Compre ({bundle.compreLista.length} {bundle.compreLista.length === 1 ? 'família/modelo elegível' : 'modelos elegíveis'}):</span>
                                                        </span>
                                                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                                            Single e Combo Multi
                                                        </span>
                                                    </div>

                                                    <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/70 px-3 py-2 rounded-lg border border-neutral-200/80 dark:border-neutral-800 leading-relaxed break-words">
                                                        {bundle.resumoCompre}
                                                    </p>

                                                    <div className="space-y-1.5 max-h-64 overflow-y-auto overflow-x-hidden pr-1 min-w-0 max-w-full">
                                                        {compreToShow.map((c, idx) => {
                                                            const isMatch =
                                                                query &&
                                                                (c.modelo.toLowerCase().includes(query) ||
                                                                    String(c.codigos).toLowerCase().includes(query));
                                                            const formattedSapList = String(c.codigos || '').replace(/;/g, '; ');
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={`px-3 py-2 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors min-w-0 max-w-full overflow-hidden ${
                                                                        isMatch
                                                                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                                                                            : 'bg-neutral-50/60 dark:bg-neutral-800/40 border-neutral-200/80 dark:border-neutral-800'
                                                                    }`}
                                                                >
                                                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 leading-snug break-words min-w-0 flex-1">
                                                                        {c.modelo}
                                                                    </span>
                                                                    {c.codigos && c.codigos !== '-' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleCopySap(c.codigos)}
                                                                            className="self-start sm:self-auto max-w-full sm:max-w-[52%] px-2.5 py-1 rounded-md bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 cursor-pointer min-w-0 text-left"
                                                                            title={`Copiar códigos SAP: ${formattedSapList}`}
                                                                        >
                                                                            <span className="break-words line-clamp-2 min-w-0">SAP: {formattedSapList}</span>
                                                                            {copiedCode === String(c.codigos) ? (
                                                                                <Check size={12} className="text-emerald-500 shrink-0" />
                                                                            ) : (
                                                                                <Copy size={12} className="text-neutral-400 shrink-0" />
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {bundle.compreLista.length > 4 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpandBundle(bundle.id)}
                                                            className="w-full py-2 px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                                                        >
                                                            {isExpanded ? (
                                                                <>
                                                                    <ChevronUp size={15} className="shrink-0" /> <span>Recolher lista de modelos</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown size={15} className="shrink-0" /> <span className="truncate">Ver todos os {bundle.compreLista.length} modelos e códigos SAP (+{hiddenCount})</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()
                    )}
                </div>

                {/* SEÇÃO DE DOCUMENTOS GEEK PADRÃO */}
                {allCategorias.map(cat => {
                    const docs = (geekDocs || []).filter(d => d.categoria === cat.id);
                    if (docs.length === 0) return null;

                    return (
                        <div key={cat.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2 mb-4">
                                {cat.icon} {cat.id} <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full text-[10px]">{docs.length}</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {docs.map(doc => (
                                    <div key={doc.id} className="group relative bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col">
                                        {isDocNew(doc) && (
                                            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 z-10">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E3000F] border-2 border-white dark:border-neutral-900" title="Novo arquivo ou alterado recentemente"></span>
                                            </span>
                                        )}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center text-indigo-500 shrink-0"><FileText size={18} /></div>
                                            {canEdit && (
                                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                                                    <button onClick={() => handleEdit(doc)} className="p-1.5 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Editar"><Edit3 size={16} /></button>
                                                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Excluir"><Trash2 size={16} /></button>
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm mb-1 line-clamp-2 flex-1" title={doc.titulo}>{doc.titulo}</h4>
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-4 mt-auto pt-2">Add: {doc.data}</p>
                                        <a href={doc.link} target="_blank" rel="noopener noreferrer" onClick={() => markAsViewed(doc)} className="w-full py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex items-center justify-center gap-1.5">Acessar <ExternalLink size={14} /></a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {geekDocs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl border-dashed">
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4"><FileText size={32} /></div>
                        <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">Nenhum material disponível</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm mt-1">Ainda não há materiais adicionados na seção GEEK. Solicite à gestão que adicione novos links de documentos.</p>
                    </div>
                )}
            </div>

            {/* MODAL DE CRIAÇÃO / EDIÇÃO DE FLYER 3:4 */}
            {isFlyerModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center no-print">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in flex flex-col transition-colors border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                            <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                <Sparkles size={18} className="text-[#E3000F]" />
                                {editingFlyerId ? 'Editar Flyer (Proporção 3:4)' : 'Novo Flyer de Campanha (Proporção 3:4)'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => { setIsFlyerModalOpen(false); setEditingFlyerId(null); }}
                                className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleFlyerSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Título da Campanha / Flyer <span className="text-[#E3000F]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={flyerFormData.titulo}
                                    onChange={e => setFlyerFormData({ ...flyerFormData, titulo: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3.5 py-2.5 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-bold uppercase"
                                    placeholder="Ex: CLARO FIBRA 500 MEGA - BLACK FRIDAY"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        Etiqueta / Tag
                                    </label>
                                    <select
                                        value={flyerFormData.tag}
                                        onChange={e => setFlyerFormData({ ...flyerFormData, tag: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3.5 py-2.5 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-bold uppercase cursor-pointer"
                                    >
                                        <option value="CAMPANHA OFICIAL">CAMPANHA OFICIAL</option>
                                        <option value="DESTAQUE MENSAL">DESTAQUE MENSAL</option>
                                        <option value="FOCO OPERAÇÃO">FOCO OPERAÇÃO</option>
                                        <option value="COMUNICADO">COMUNICADO</option>
                                        <option value="DIVULGAÇÃO">DIVULGAÇÃO</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        Link de Regulamento / Acesso
                                    </label>
                                    <input
                                        type="text"
                                        value={flyerFormData.link}
                                        onChange={e => setFlyerFormData({ ...flyerFormData, link: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3.5 py-2.5 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Subtítulo / Descrição da Campanha
                                </label>
                                <textarea
                                    value={flyerFormData.subtitulo}
                                    onChange={e => setFlyerFormData({ ...flyerFormData, subtitulo: e.target.value })}
                                    rows={2}
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3.5 py-2 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-xs"
                                    placeholder="Ex: Dobro de gigas no Combo Multi com desconto de R$ 30 por 12 meses..."
                                />
                            </div>

                            {/* UPLOAD OU URL DA IMAGEM 3:4 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>Imagem do Flyer (Proporção 3:4) <span className="text-[#E3000F]">*</span></span>
                                    <span className="text-[10px] text-neutral-400 font-normal">Recomendado: 600x800 ou 900x1200</span>
                                </label>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={flyerFormData.imagemUrl}
                                        onChange={e => setFlyerFormData({ ...flyerFormData, imagemUrl: e.target.value })}
                                        className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3.5 py-2.5 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-xs"
                                        placeholder="Cole a URL da imagem ou envie abaixo..."
                                        required
                                    />
                                    <label className="px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                                        <Upload size={14} /> Upload
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {/* Mini Preview no Modal com proporção 3:4 */}
                                {flyerFormData.imagemUrl && (
                                    <div className="pt-2 flex items-center gap-3">
                                        <div className="w-16 aspect-[3/4] rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-700 shrink-0 bg-neutral-900">
                                            <img
                                                src={flyerFormData.imagemUrl}
                                                alt="Prévia Flyer"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                            ✓ Imagem pronta no formato flyer 3:4!
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => { setIsFlyerModalOpen(false); setEditingFlyerId(null); }}
                                    className="px-5 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-500/20 text-xs"
                                >
                                    {editingFlyerId ? 'Salvar Edição' : 'Publicar Flyer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE VISUALIZAÇÃO AMPLIADA DO FLYER - CAMPO 16:9 NÍTIDO SEM DESFOCAR */}
            {previewFlyer && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-2 sm:p-6 flex items-center justify-center no-print"
                    onClick={() => setPreviewFlyer(null)}
                >
                    <div
                        className="relative w-full max-w-5xl aspect-[16/9] max-h-[90vh] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-neutral-950 flex flex-col justify-between animate-fade-in select-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Imagem de Fundo com desfoque suave para preenchimento de cinema nas abas laterais */}
                        <img
                            src={previewFlyer.imagemUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover filter blur-3xl opacity-25 scale-110 pointer-events-none"
                        />

                        {/* Imagem Principal Central NÍTIDA em Alta Resolução SEM DESFOCAR */}
                        <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-6 z-10 pointer-events-none">
                            <img
                                src={previewFlyer.imagemUrl}
                                alt={previewFlyer.titulo}
                                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl pointer-events-auto"
                                style={{ imageRendering: '-webkit-optimize-contrast' }}
                            />
                        </div>

                        {/* Barra Superior com Tags e Botões de Ação */}
                        <div className="relative z-20 p-4 sm:p-6 flex items-center justify-between gap-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#E3000F] text-white shadow-lg">
                                    {previewFlyer.tag || 'CAMPANHA'}
                                </span>
                                <span className="px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold text-white/90 bg-black/60 backdrop-blur-sm border border-white/10">
                                    {previewFlyer.data}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {canEdit && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const toEdit = previewFlyer;
                                                setPreviewFlyer(null);
                                                handleEditFlyer(toEdit);
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-neutral-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                                            title="Editar dados e imagem deste flyer"
                                        >
                                            <Edit3 size={14} /> Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteFlyer(previewFlyer.id)}
                                            className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                                            title="Excluir este flyer"
                                        >
                                            <Trash2 size={14} /> Excluir
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setPreviewFlyer(null)}
                                    className="w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all border border-white/20 hover:border-white shadow-lg"
                                    title="Fechar Visualização"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Barra Inferior com Título, Subtítulo e Link Externo */}
                        <div className="relative z-20 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
                            <div className="max-w-2xl">
                                <h3 className="text-base sm:text-xl font-black uppercase tracking-wide leading-tight drop-shadow-md">
                                    {previewFlyer.titulo}
                                </h3>
                                {previewFlyer.subtitulo && (
                                    <p className="text-xs sm:text-sm text-neutral-200 font-medium leading-relaxed drop-shadow mt-1">
                                        {previewFlyer.subtitulo}
                                    </p>
                                )}
                            </div>

                            {previewFlyer.link && (
                                <a
                                    href={previewFlyer.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="py-2.5 px-4 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shrink-0"
                                >
                                    Acessar Link Oficial <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CRIAÇÃO / EDIÇÃO DE DOCUMENTOS GEEK */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center no-print">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in flex flex-col transition-colors">
                        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                <Cpu size={18} className="text-indigo-500" />
                                {editingId ? 'Editar Material' : 'Adicionar Material'}
                            </h2>
                            <button
                                onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                                className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Título do Documento <span className="text-[#E3000F]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.titulo}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                                    placeholder="Ex: Book de Aparelhos - Maio"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Categoria <span className="text-[#E3000F]">*</span>
                                </label>
                                <select
                                    value={isNovaCategoria ? 'NOVA_CATEGORIA' : formData.categoria}
                                    onChange={e => {
                                        if (e.target.value === 'NOVA_CATEGORIA') {
                                            setIsNovaCategoria(true);
                                        } else {
                                            setIsNovaCategoria(false);
                                            setFormData({ ...formData, categoria: e.target.value });
                                        }
                                    }}
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-bold"
                                >
                                    {allCategorias.map(c => (
                                        <option className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100" key={c.id} value={c.id}>
                                            {c.id}
                                        </option>
                                    ))}
                                    <option className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-black" value="NOVA_CATEGORIA">
                                        + CRIAR NOVA CATEGORIA
                                    </option>
                                </select>
                            </div>
                            {isNovaCategoria && (
                                <div className="space-y-1.5 animate-fade-in">
                                    <label className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                                        Nome da Nova Categoria <span className="text-[#E3000F]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={novaCategoriaNome}
                                        onChange={e => setNovaCategoriaNome(e.target.value)}
                                        className="w-full bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm uppercase font-bold"
                                        placeholder="Ex: MANUAIS DE PROCEDIMENTO"
                                        required={isNovaCategoria}
                                    />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Link do PDF (Drive / Web) <span className="text-[#E3000F]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                                    placeholder="https://..."
                                    required
                                />
                                <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                                    Dica: Faça o upload do PDF no Google Drive da loja, clique em "Compartilhar", copie o link e cole aqui!
                                </p>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                                    className="px-6 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 text-sm"
                                >
                                    {editingId ? 'Salvar Edição' : 'Salvar Documento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
