import React, { useState } from 'react';
import { Calculator, Smartphone, Wifi, Tv, Phone, User, CheckCircle2, Download, Router, ShieldCheck, Zap, Star, Globe, MonitorPlay, MessageCircle, Camera, Plus, X, Tag, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { PRICING_MOVEL, FIBRA_OPTIONS, TV_BOX_OPTIONS, FIXO_OPTIONS, MESH_OPTIONS } from '../utils/constants';
import { applyCurrencyMask, parseCurrencyToFloat } from '../utils/masks';
import viteLogo from '../assets/vite.svg';

export const StreamingBadges = () => (
    <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1">
        <span className="bg-[#E50914] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shadow-sm">Netflix</span>
        <span className="bg-[#FF0A16] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shadow-sm">Globoplay</span>
        <span className="bg-[#00A8E1] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shadow-sm">Prime</span>
        <span className="bg-[#5822B4] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shadow-sm">Max</span>
        <span className="bg-[#113CCF] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shadow-sm">Disney+</span>
        <span className="bg-black text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shadow-sm">Apple TV</span>
    </div>
);

export function Proposta({ globalUser }) {
    const [activeTab, setActiveTab] = useState('PROPOSTA');
    const [cliente, setCliente] = useState('');
    const [movel, setMovel] = useState('');
    const [linhaInclusa, setLinhaInclusa] = useState('');
    const [qtdLinhaInclusa, setQtdLinhaInclusa] = useState(1);
    const [linhaAdicional, setLinhaAdicional] = useState('');
    const [qtdLinhaAdicional, setQtdLinhaAdicional] = useState(1);
    const [fibra, setFibra] = useState('');
    const [qtdFibra, setQtdFibra] = useState(1);
    const [tv, setTv] = useState('');
    const [pontoAdicional, setPontoAdicional] = useState('');
    const [qtdPontoAdicional, setQtdPontoAdicional] = useState(1);
    const [fixo, setFixo] = useState('');
    const [qtdFixo, setQtdFixo] = useState(1);
    const [mesh, setMesh] = useState('');
    const [aparelhos, setAparelhos] = useState([{ id: Date.now(), nome: '', valor: '', claroTrocaBoost: '' }]);
    const [seguro, setSeguro] = useState('');

    const [compA, setCompA] = useState({ movel: '', linhaInclusa: '', qtdLinhaInclusa: 1, linhaAdicional: '', qtdLinhaAdicional: 1, fibra: '', qtdFibra: 1, tv: '', pontoAdicional: '', qtdPontoAdicional: 1, fixo: '', qtdFixo: 1, mesh: '' });
    const [compB, setCompB] = useState({ movel: '', linhaInclusa: '', qtdLinhaInclusa: 1, linhaAdicional: '', qtdLinhaAdicional: 1, fibra: '', qtdFibra: 1, tv: '', pontoAdicional: '', qtdPontoAdicional: 1, fixo: '', qtdFixo: 1, mesh: '' });

    const [apA, setApA] = useState({ modelo: '', valor: '', claroTroca: '', parcelas: '21' });
    const [apB, setApB] = useState({ modelo: '', valor: '', claroTroca: '', parcelas: '21' });

    // Extraindo as listas das constantes de forma segura
    const mobilePlans = Object.keys(PRICING_MOVEL || {});
    const fixoPlans = FIXO_OPTIONS || [];
    const meshPlans = MESH_OPTIONS || [];
    const seguroPlans = [
        { label: 'SEGURO R$ 35,00', prices: { UNICO: 35.00 } },
        { label: 'SEGURO R$ 45,00', prices: { UNICO: 45.00 } },
        { label: 'SEGURO R$ 55,00', prices: { UNICO: 55.00 } },
        { label: 'SEGURO R$ 60,00', prices: { UNICO: 60.00 } }
    ];

    const dependentePlans = [
        { label: 'LINHA ADICIONAL PAGA', prices: { UNICO: 55.00 } },
        { label: 'LINHA ADICIONAL INCLUSA', prices: { UNICO: 0.00 } },
        { label: 'LINHA BL ADICIONAL', prices: { UNICO: 29.90 } }
    ];

    const linhaInclusaPlans = dependentePlans.filter(p => p.label === 'LINHA ADICIONAL INCLUSA');
    const linhaAdicionalPlans = dependentePlans.filter(p => p.label === 'LINHA ADICIONAL PAGA' || p.label === 'LINHA BL ADICIONAL');

    const pontoAdicionalPlans = [
        { label: 'PONTO TV BOX STREAMING', prices: { UNICO: 69.90 } },
        { label: 'PONTO TV BOX A CABO', prices: { UNICO: 69.90 } },
        { label: 'PONTO TV SOUNDBOX', prices: { UNICO: 99.90 } },
        { label: 'PONTO TV TOP (RENT)', prices: { UNICO: 10.00 } }
    ];

    const fibraPlansOverrides = {
        '350 MEGA': { SINGLE: 99.90, MULTI: 79.90, 'MULTI 3P': 79.90 },
        '600 MEGA': { SINGLE: 119.90, MULTI: 99.90, 'MULTI 3P': 99.90 },
        '750 MEGA': { SINGLE: 149.90, MULTI: 129.90, 'MULTI 3P': 129.90 }
    };

    let extendedFibraPlans = [];
    let found350 = false, found600 = false, found750 = false;
    (FIBRA_OPTIONS || []).forEach(p => {
        if (p.label === '350 MEGA') { extendedFibraPlans.push({ label: '350 MEGA', prices: fibraPlansOverrides['350 MEGA'] }); found350 = true; }
        else if (p.label === '600 MEGA') { extendedFibraPlans.push({ label: '600 MEGA', prices: fibraPlansOverrides['600 MEGA'] }); found600 = true; }
        else if (p.label === '750 MEGA') { extendedFibraPlans.push({ label: '750 MEGA', prices: fibraPlansOverrides['750 MEGA'] }); found750 = true; }
        else { extendedFibraPlans.push(p); }
    });

    if (!found350) extendedFibraPlans.push({ label: '350 MEGA', prices: fibraPlansOverrides['350 MEGA'] });
    if (!found600) extendedFibraPlans.push({ label: '600 MEGA', prices: fibraPlansOverrides['600 MEGA'] });
    if (!found750) extendedFibraPlans.push({ label: '750 MEGA', prices: fibraPlansOverrides['750 MEGA'] });
    extendedFibraPlans.sort((a, b) => (parseInt(a.label) * (a.label.includes('GIGA') || a.label.includes('GB') ? 1000 : 1)) - (parseInt(b.label) * (b.label.includes('GIGA') || b.label.includes('GB') ? 1000 : 1)));

    const extendedTvPlans = [...(TV_BOX_OPTIONS || [])];
    const idxTvTop = extendedTvPlans.findIndex(p => p.label === 'TV TOP (RENT)');
    if (idxTvTop >= 0) extendedTvPlans[idxTvTop] = { label: 'TV TOP (RENT)', prices: { SINGLE: 110.00, MULTI: 110.00, 'MULTI 3P': 110.00 } };
    else extendedTvPlans.push({ label: 'TV TOP (RENT)', prices: { SINGLE: 110.00, MULTI: 110.00, 'MULTI 3P': 110.00 } });

    const getGoogleMapsLink = () => {
        if (import.meta.env.VITE_STORE_MAPS_LINK) return import.meta.env.VITE_STORE_MAPS_LINK;
        const storeName = String(import.meta.env.VITE_STORE_NAME || '').toUpperCase();
        if (storeName.includes('LAPA')) return 'https://maps.app.goo.gl/kEMpuUjUz7ha1Rzs5';
        if (storeName.includes('CALCADAO') || storeName.includes('CALÇADÃO')) return 'https://maps.app.goo.gl/RLcDeCoXyCW2nYVu7';
        return 'https://maps.app.goo.gl/HkndtA47p8XvStCN9'; // Default (União Osasco)
    };
    const mapsLink = getGoogleMapsLink();

    const handleAparelhoChange = (id, field, value) => {
        setAparelhos(prev => prev.map(ap => ap.id === id ? { ...ap, [field]: value } : ap));
    };

    const addAparelho = () => {
        setAparelhos(prev => [...prev, { id: Date.now(), nome: '', valor: '', claroTrocaBoost: '' }]);
    };

    const removeAparelho = (id) => {
        setAparelhos(prev => prev.filter(ap => ap.id !== id));
    };

    // --- LÓGICA DE CÁLCULO E COMBO ---
    let numServices = (movel ? 1 : 0) + (fibra ? 1 : 0) + (tv ? 1 : 0);
    let comboType = 'SINGLE';
    if (movel && (fibra || tv)) {
        comboType = numServices >= 3 ? 'MULTI 3P' : 'MULTI';
    }

    const getPrice = (cat, item, overrideComboType = comboType) => {
        if (!item) return 0;
        if (cat === 'MOVEL') return PRICING_MOVEL[item]?.[overrideComboType] || PRICING_MOVEL[item]?.['MULTI'] || PRICING_MOVEL[item]?.['SINGLE'] || 0;
        if (cat === 'DEPENDENTE') return dependentePlans.find(o => o.label === item)?.prices?.UNICO || 0;
        if (cat === 'FIBRA') return extendedFibraPlans.find(o => o.label === item)?.prices?.[overrideComboType] || extendedFibraPlans.find(o => o.label === item)?.prices?.['MULTI'] || extendedFibraPlans.find(o => o.label === item)?.prices?.['SINGLE'] || extendedFibraPlans.find(o => o.label === item)?.prices?.UNICO || 0;
        if (cat === 'TV') return extendedTvPlans.find(o => o.label === item)?.prices?.[overrideComboType] || extendedTvPlans.find(o => o.label === item)?.prices?.['MULTI'] || extendedTvPlans.find(o => o.label === item)?.prices?.['SINGLE'] || extendedTvPlans.find(o => o.label === item)?.prices?.UNICO || 0;
        if (cat === 'PONTO_ADICIONAL') return pontoAdicionalPlans.find(o => o.label === item)?.prices?.UNICO || 0;
        if (cat === 'FIXO') return fixoPlans.find(o => o.label === item)?.prices?.UNICO || 0;
        if (cat === 'MESH') return meshPlans.find(o => o.label === item)?.prices?.UNICO || 0;
        if (cat === 'SEGURO') return seguroPlans.find(o => o.label === item)?.prices?.UNICO || 0;
        return 0;
    };

    const valMovel = getPrice('MOVEL', movel);
    const valLinhaInclusa = getPrice('DEPENDENTE', linhaInclusa) * (parseInt(qtdLinhaInclusa, 10) || 1);
    const valLinhaAdicional = getPrice('DEPENDENTE', linhaAdicional) * (parseInt(qtdLinhaAdicional, 10) || 1);
    const valFibra = getPrice('FIBRA', fibra) * (parseInt(qtdFibra, 10) || 1);
    const valTv = getPrice('TV', tv);
    const valPontoAdicional = getPrice('PONTO_ADICIONAL', pontoAdicional) * (parseInt(qtdPontoAdicional, 10) || 1);
    const valFixo = getPrice('FIXO', fixo) * (parseInt(qtdFixo, 10) || 1);
    const valMesh = getPrice('MESH', mesh);
    const valSeguro = getPrice('SEGURO', seguro);
    let valorTotal = valMovel + valLinhaInclusa + valLinhaAdicional + valFibra + valTv + valPontoAdicional + valFixo + valMesh + valSeguro;

    const valAparelhoBruto = aparelhos.reduce((acc, curr) => acc + parseCurrencyToFloat(curr.valor), 0);
    const valAparelho = aparelhos.reduce((acc, curr) => acc + Math.max(0, parseCurrencyToFloat(curr.valor) - parseCurrencyToFloat(curr.claroTrocaBoost || '0')), 0);

    // Simulador visual de economia (Gatilho Comercial: Mostra preço sem combo vs com combo)
    const valorSemCombo = comboType !== 'SINGLE' && valorTotal > 0 ? valorTotal * 1.35 : 0;
    const economiaAnual = valorSemCombo > 0 ? (valorSemCombo - valorTotal) * 12 : 0;

    const handleWhatsAppShare = () => {
        let text = `*PROPOSTA COMERCIAL - CLARO* 🔴\n\n`;
        if (cliente) text += `👤 *Cliente:* ${cliente}\n\n`;

        text += `*RESUMO DOS SERVIÇOS:*\n`;

        if (movel) text += `📱 *Móvel:* ${movel} - ${applyCurrencyMask(valMovel)}\n`;
        if (linhaInclusa) text += `👥 *Linha Inclusa:* ${qtdLinhaInclusa > 1 ? `${qtdLinhaInclusa}x ` : ''}${linhaInclusa} - ${applyCurrencyMask(valLinhaInclusa)}\n`;
        if (linhaAdicional) text += `👥 *Linha Adicional:* ${qtdLinhaAdicional > 1 ? `${qtdLinhaAdicional}x ` : ''}${linhaAdicional} - ${applyCurrencyMask(valLinhaAdicional)}\n`;
        if (fibra) text += `🌐 *Fibra:* ${qtdFibra > 1 ? `${qtdFibra}x ` : ''}${fibra} - ${applyCurrencyMask(valFibra)}\n`;
        if (tv) text += `📺 *TV:* ${tv} - ${applyCurrencyMask(valTv)}\n`;
        if (pontoAdicional) text += `📺 *Ponto Adicional:* ${qtdPontoAdicional > 1 ? `${qtdPontoAdicional}x ` : ''}${pontoAdicional} - ${applyCurrencyMask(valPontoAdicional)}\n`;
        if (fixo) text += `📞 *Fixo:* ${qtdFixo > 1 ? `${qtdFixo}x ` : ''}${fixo} - ${applyCurrencyMask(valFixo)}\n`;
        if (mesh) text += `📶 *Mesh:* ${mesh} - ${applyCurrencyMask(valMesh)}\n`;
        if (seguro) text += `🛡️ *Seguro:* ${seguro} - ${applyCurrencyMask(valSeguro)}\n`;

        if (valorTotal > 0) {
            text += `\n💵 *VALOR TOTAL MENSAL:* ${applyCurrencyMask(valorTotal)}\n`;
            if (economiaAnual > 0) {
                text += `✅ *Economia anual de:* ${applyCurrencyMask(economiaAnual)}\n`;
            }
        }

        if (valAparelhoBruto > 0) {
            text += `\n*OFERTA EXCLUSIVA DE APARELHO${aparelhos.length > 1 ? 'S' : ''}:*\n`;
            aparelhos.forEach((ap, idx) => {
                const valApBruto = parseCurrencyToFloat(ap.valor);
                const valDesc = parseCurrencyToFloat(ap.claroTrocaBoost || '0');
                const valAp = Math.max(0, valApBruto - valDesc);
                if (valApBruto > 0) {
                    text += `\n📱 *Modelo:* ${ap.nome || `Aparelho ${idx + 1}`}\n`;
                    if (valDesc > 0) {
                        text += `💰 *Valor original:* ${applyCurrencyMask(valApBruto)}\n`;
                        text += `♻️ *Claro Troca - Boost:* -${applyCurrencyMask(valDesc)}\n`;
                        text += `💰 *Novo Valor:* ${applyCurrencyMask(valAp)}\n`;
                    } else {
                        text += `💰 *À Vista:* ${applyCurrencyMask(valAp)}\n`;
                    }
                    text += `💳 *12x s/ juros:* ${applyCurrencyMask(valAp / 12)}\n`;
                    text += `💳 *21x s/ juros:* ${applyCurrencyMask(valAp / 21)}${comboType === 'SINGLE' ? ' (*Requer Multi)' : ''}\n`;
                }
            });
        }

        text += `\n_Consultor(a): ${globalUser?.name ? globalUser.name.split(' ')[0] : 'Equipe Claro'}_\n`;
        text += `_${import.meta.env.VITE_STORE_NAME || 'Loja Claro'}_`;

        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const handleDownloadImage = async () => {
        const element = document.getElementById('printable-proposal');
        if (!element) return;

        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) document.documentElement.classList.remove('dark');

        const toastId = toast.loading('Gerando imagem da proposta...');

        await new Promise(r => setTimeout(r, 50));

        try {
            const canvas = await html2canvas(element, {
                scale: 2, // Renderiza em alta resolução (Sem serrilhados)
                useCORS: true, // Permite capturar as logos perfeitamente
                backgroundColor: '#ffffff'
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `Proposta_Claro_${cliente ? cliente.replace(/\s+/g, '_') : 'Cliente'}.png`;
            link.click();

            toast.success('Imagem gerada com sucesso! Agora é só enviar no WhatsApp.', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar imagem:', error);
            toast.error('Erro ao gerar a imagem da proposta.', { id: toastId });
        } finally {
            if (isDark) document.documentElement.classList.add('dark');
        }
    };

    const handlePrint = () => {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) document.documentElement.classList.remove('dark');
        
        setTimeout(() => {
            window.print();
            if (isDark) document.documentElement.classList.add('dark');
        }, 100);
    };

    // Extração Inteligente de Benefícios (Baseado no site oficial da Claro)
    const getBeneficiosList = (pMovel, pFibra, pTv, pLinhaInclusa, pLinhaAdicional, pPontoAdicional, pFixo, pMesh, pSeguro) => {
        const bens = [];

        if (pMovel) {
            const p = pMovel.toUpperCase();
            bens.push({ icon: <Phone size={14} />, title: 'Ligações & SMS', desc: 'Ligações ilimitadas para qualquer operadora e SMS ilimitado.' });
            bens.push({ icon: <Smartphone size={14} />, title: 'WhatsApp Ilimitado', desc: 'Sem descontar da franquia.' });

            if (p.includes('500GB')) {
                bens.push({ icon: <User size={14} />, title: 'Dependentes', desc: 'No Multi ou Individual 5 dep inclusos.' });
                bens.push({ icon: <Globe size={14} />, title: 'Roaming Internacional Mundo', desc: 'Navegue em 120 países.' });
                bens.push({ icon: <ShieldCheck size={14} />, title: 'Nuvem 2TB', desc: 'iCloud (2TB) ou Google One + Gemini Pro (2TB).' });
            } else if (p.includes('200GB')) {
                bens.push({ icon: <User size={14} />, title: 'Dependentes', desc: 'No Multi ou Individual 2 dep inclusos.' });
                bens.push({ icon: <Globe size={14} />, title: 'Roaming Internacional Mundo', desc: 'Navegue em 120 países.' });
                bens.push({ icon: <ShieldCheck size={14} />, title: 'Nuvem 2TB', desc: 'iCloud (2TB) ou Google One + Gemini Pro (2TB).' });
            } else if (p.includes('150GB')) {
                bens.push({ icon: <User size={14} />, title: 'Dependentes', desc: 'No Multi ou Individual 1 dep incluso.' });
                bens.push({ icon: <Globe size={14} />, title: 'Roaming Américas e Europa', desc: 'Navegue em 88 países.' });
                bens.push({ icon: <ShieldCheck size={14} />, title: 'Nuvem 2TB', desc: 'iCloud (2TB) ou Google One + Gemini Pro (2TB).' });
            } else if (p.includes('100GB')) {
                bens.push({ icon: <Globe size={14} />, title: 'Roaming Américas', desc: 'Navegue em 44 países.' });
                bens.push({ icon: <ShieldCheck size={14} />, title: 'Nuvem 200GB', desc: 'iCloud (200GB) ou Google One (200GB).' });
            } else if (p.includes('50GB') || p.includes('GAMING')) {
                bens.push({ icon: <Globe size={14} />, title: 'Roaming Américas', desc: 'Navegue em 44 países.' });
                bens.push({ icon: <ShieldCheck size={14} />, title: 'Nuvem', desc: 'iCloud (50GB) ou Google One (100GB).' });
            }
        }

        const deps = [pLinhaInclusa, pLinhaAdicional].filter(Boolean);
        deps.forEach(dep => {
            const d = dep.toUpperCase();
            if (d.includes('BANDA-LARGA') || d.includes('BL')) {
                bens.push({ icon: <Wifi size={14} />, title: 'Linha Adicional Banda-Larga', desc: 'Compartilha a franquia de internet móvel com roteador.' });
            } else {
                bens.push({ icon: <User size={14} />, title: 'Linha Adicional', desc: 'Compartilha a internet do plano titular com ligações ilimitadas.' });
            }
        });

        if (pFibra) {
            const f = pFibra.toUpperCase();
            bens.push({ icon: <MonitorPlay size={14} />, title: 'Globoplay Premium', desc: 'Assinatura inclusa no plano.' });
            if (f.includes('1 GIGA') || f.includes('1GB') || f.includes('1GIGA') || f.includes('5GB') || f.includes('5GIGA') || f.includes('10GB') || f.includes('10GIGA') || f.includes('600 MEGA') || f.includes('750 MEGA')) {
                bens.push({ icon: <Wifi size={14} />, title: 'Wi-Fi 6', desc: 'Tecnologia de última geração com mais velocidade.' });
            } else {
                bens.push({ icon: <Wifi size={14} />, title: 'Wi-Fi 5', desc: 'Modem de alta performance.' });
            }
        }

        if (pTv) {
            const t = pTv.toUpperCase();
            bens.push({
                icon: <Tv size={14} />,
                title: '120 Canais + 6 Streamings',
                desc: '[YouTube Integrado] Netflix, Globoplay, PrimeVideo, Max, Disney e AppleTV.',
                badges: true
            });
            bens.push({ icon: <MonitorPlay size={14} />, title: 'Telas Simultâneas', desc: '2 telas digitais por TV e 5 telas (Celular, Tablet, PC).' });

            if (t.includes('SOUNDBOX')) {
                bens.push({ icon: <Zap size={14} />, title: 'Claro Música', desc: 'Incluso no seu pacote Soundbox.' });
            }
        }

        if (pPontoAdicional) {
            const pa = pPontoAdicional.toUpperCase();
            bens.push({ icon: <Tv size={14} />, title: 'Ponto Adicional', desc: 'Acesso completo a grade de canais na segunda TV.' });
            if (pa.includes('SOUNDBOX')) {
                bens.push({ icon: <Zap size={14} />, title: 'Som Premium', desc: 'Qualidade de áudio Soundbox no ponto adicional.' });
            }
        }

        if (pFixo) {
            const fx = pFixo.toUpperCase();
            if (fx.includes('MUNDO')) {
                bens.push({ icon: <Globe size={14} />, title: 'Fixo Mundo', desc: 'Ligações para o Brasil + 35 países. Chamada móvel ilimitada para o Brasil e EUA.' });
            } else {
                bens.push({ icon: <Phone size={14} />, title: 'Fixo Brasil', desc: 'Chamadas ilimitadas (Locais e DDD) usando o 21.' });
            }
        }

        if (bens.length === 0 && pMesh) {
            bens.push({ icon: <Star size={14} />, title: 'Qualidade Claro', desc: 'Equipamentos modernos e garantia de estabilidade para sua residência.' });
        }

        if (pSeguro) {
            bens.push({ icon: <ShieldCheck size={14} />, title: 'Seguro Proteção Móvel Claro/Yelum', desc: 'Sem carência: proteção ativa imediatamente após a contratação.' });
            bens.push({ icon: <Globe size={14} />, title: 'Cobertura Abrangente e Internacional', desc: 'Protege contra roubo, furto simples e qualificado, mesmo no exterior.' });
            bens.push({ icon: <Smartphone size={14} />, title: 'Danos Acidentais', desc: 'Cobre consertos de danos físicos, incluindo quebra de tela e danos líquidos.' });
            bens.push({ icon: <Calculator size={14} />, title: 'Condições de Franquia', desc: '25% para Roubo/Furto e 20% para Danos Físicos sobre o valor de varejo.' });
        }

        return bens;
    };

    const beneficios = getBeneficiosList(movel, fibra, tv, linhaInclusa, linhaAdicional, pontoAdicional, fixo, mesh, seguro);

    const getCompData = (comp) => {
        let num = (comp.movel ? 1 : 0) + (comp.fibra ? 1 : 0) + (comp.tv ? 1 : 0);
        let type = 'SINGLE';
        if (comp.movel && (comp.fibra || comp.tv)) {
            type = num >= 3 ? 'MULTI 3P' : 'MULTI';
        }
        const valMovel = getPrice('MOVEL', comp.movel, type);
        const valLinhaInclusa = getPrice('DEPENDENTE', comp.linhaInclusa) * (parseInt(comp.qtdLinhaInclusa, 10) || 1);
        const valLinhaAdicional = getPrice('DEPENDENTE', comp.linhaAdicional) * (parseInt(comp.qtdLinhaAdicional, 10) || 1);
        const valFibra = getPrice('FIBRA', comp.fibra, type) * (parseInt(comp.qtdFibra, 10) || 1);
        const valTv = getPrice('TV', comp.tv, type);
        const valPontoAdicional = getPrice('PONTO_ADICIONAL', comp.pontoAdicional) * (parseInt(comp.qtdPontoAdicional, 10) || 1);
        const valFixo = getPrice('FIXO', comp.fixo) * (parseInt(comp.qtdFixo, 10) || 1);
        const valMesh = getPrice('MESH', comp.mesh);
        
        const total = valMovel + valLinhaInclusa + valLinhaAdicional + valFibra + valTv + valPontoAdicional + valFixo + valMesh;
        const semCombo = type !== 'SINGLE' && total > 0 ? total * 1.35 : 0;
        const economia = semCombo > 0 ? (semCombo - total) * 12 : 0;
        const bens = getBeneficiosList(comp.movel, comp.fibra, comp.tv, comp.linhaInclusa, comp.linhaAdicional, comp.pontoAdicional, comp.fixo, comp.mesh, '');
        
        return { type, valMovel, valLinhaInclusa, valLinhaAdicional, valFibra, valTv, valPontoAdicional, valFixo, valMesh, total, semCombo, economia, bens };
    };

    const dataA = getCompData(compA);
    const dataB = getCompData(compB);

    const handleDownloadImageComparador = async () => {
        const element = document.getElementById('printable-comparador');
        if (!element) return;

        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) document.documentElement.classList.remove('dark');

        const toastId = toast.loading('Gerando imagem do comparativo...');

        await new Promise(r => setTimeout(r, 50));

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `Comparativo_Claro.png`;
            link.click();

            toast.success('Imagem gerada com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar imagem:', error);
            toast.error('Erro ao gerar a imagem.', { id: toastId });
        } finally {
            if (isDark) document.documentElement.classList.add('dark');
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in transition-colors">
            
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0 overflow-x-auto scrollbar-hide rounded-t-2xl no-print">
                <button onClick={() => setActiveTab('PROPOSTA')} className={`whitespace-nowrap px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-[3px] ${activeTab === 'PROPOSTA' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>Proposta Comercial</button>
                <button onClick={() => setActiveTab('COMPARADOR')} className={`whitespace-nowrap px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-[3px] ${activeTab === 'COMPARADOR' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>Comparador Planos</button>
                <button onClick={() => setActiveTab('COMPARADOR_APARELHOS')} className={`whitespace-nowrap px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-[3px] ${activeTab === 'COMPARADOR_APARELHOS' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>Comparador Aparelhos</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 print:p-0 print:overflow-visible bg-neutral-50/50 dark:bg-neutral-950/50">
                {activeTab === 'PROPOSTA' && (
                    <div className="flex flex-col lg:flex-row gap-6 min-h-full print:block print:h-auto print:overflow-visible">
                        
                        {/* COLUNA ESQUERDA: FORMULÁRIO DE SIMULAÇÃO (Oculto na impressão) */}
                        <div className="w-full lg:w-[35%] flex flex-col gap-4 no-print pr-2 pb-8">
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-5 shrink-0">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F]">
                                        <Calculator size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100">Simulador de Proposta</h2>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Monte o combo e visualize os descontos.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><User size={14} className="text-[#E3000F]" /> Nome do Cliente / Empresa</label>
                                        <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex: João da Silva" className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Smartphone size={14} className="text-[#E3000F]" /> Aparelho Celular e Valor (R$)</label>
                                        {aparelhos.map((aparelho, idx) => (
                                            <div key={aparelho.id} className="flex flex-col gap-2 mb-3 bg-neutral-50/50 dark:bg-neutral-800/20 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800/50">
                                                <div className="flex gap-2">
                                                    <input type="text" value={aparelho.nome} onChange={(e) => handleAparelhoChange(aparelho.id, 'nome', e.target.value)} placeholder="Modelo do aparelho" className="w-[60%] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium uppercase" />
                                                    <input type="text" value={aparelho.valor} onChange={(e) => handleAparelhoChange(aparelho.id, 'valor', applyCurrencyMask(e.target.value))} placeholder="R$ 0,00" className="w-[30%] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium" />
                                                    {aparelhos.length > 1 ? (
                                                        <button type="button" onClick={() => removeAparelho(aparelho.id)} className="w-[10%] flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                            <X size={18} />
                                                        </button>
                                                    ) : <div className="w-[10%]"></div>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-[60%] text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center justify-end gap-1"><Tag size={12} className="text-[#E3000F]" /> Claro Troca Boost</div>
                                                    <input type="text" value={aparelho.claroTrocaBoost || ''} onChange={(e) => handleAparelhoChange(aparelho.id, 'claroTrocaBoost', applyCurrencyMask(e.target.value))} placeholder="Desconto" className="w-[30%] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-xs font-medium" />
                                                    <div className="w-[10%]"></div>
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addAparelho} className="text-xs text-[#E3000F] font-bold flex items-center gap-1 mt-1 hover:underline">
                                            <Plus size={12} /> Adicionar outro aparelho
                                        </button>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><ShieldCheck size={14} className="text-[#E3000F]" /> Seguro Proteção Móvel</label>
                                        <select value={seguro} onChange={(e) => setSeguro(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                            <option className="bg-white dark:bg-neutral-900" value="">Não ofertar seguro</option>
                                            {seguroPlans.map(p => <option className="bg-white dark:bg-neutral-900" key={p.label} value={p.label}>{p.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Smartphone size={14} className="text-[#E3000F]" /> Plano Móvel (Pós ou Controle)</label>
                                        <select value={movel} onChange={(e) => setMovel(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                            <option className="bg-white dark:bg-neutral-900" value="">Nenhum plano móvel selecionado</option>
                                            {mobilePlans.map(p => <option className="bg-white dark:bg-neutral-900" key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><User size={14} className="text-[#E3000F]" /> Linha Adicional Inclusa</label>
                                        <div className="flex gap-2">
                                            <select value={linhaInclusa} onChange={(e) => setLinhaInclusa(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                                <option className="bg-white dark:bg-neutral-900" value="">Nenhuma linha inclusa selecionada</option>
                                                {linhaInclusaPlans.map(p => <option className="bg-white dark:bg-neutral-900" key={p.label} value={p.label}>{p.label}</option>)}
                                            </select>
                                            {linhaInclusa && (
                                                <input type="number" min="1" value={qtdLinhaInclusa} onChange={(e) => setQtdLinhaInclusa(e.target.value)} className="w-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" title="Quantidade" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><User size={14} className="text-[#E3000F]" /> Linha Adicional Paga / BL</label>
                                        <div className="flex gap-2">
                                            <select value={linhaAdicional} onChange={(e) => setLinhaAdicional(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                                <option className="bg-white dark:bg-neutral-900" value="">Nenhuma linha paga/BL selecionada</option>
                                                {linhaAdicionalPlans.map(p => <option className="bg-white dark:bg-neutral-900" key={p.label} value={p.label}>{p.label}</option>)}
                                            </select>
                                            {linhaAdicional && (
                                                <input type="number" min="1" value={qtdLinhaAdicional} onChange={(e) => setQtdLinhaAdicional(e.target.value)} className="w-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" title="Quantidade" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Wifi size={14} className="text-[#E3000F]" /> Banda Larga (Fibra)</label>
                                        <div className="flex gap-2">
                                            <select value={fibra} onChange={(e) => setFibra(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                                <option className="bg-white dark:bg-neutral-900" value="">Nenhuma internet selecionada</option>
                                                {extendedFibraPlans.map(p => <option className="bg-white dark:bg-neutral-900" key={p.label} value={p.label}>{p.label}</option>)}
                                            </select>
                                            {fibra && (
                                                <input type="number" min="1" value={qtdFibra} onChange={(e) => setQtdFibra(e.target.value)} className="w-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" title="Quantidade" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Tv size={14} className="text-[#E3000F]" /> Claro TV+</label>
                                        <select value={tv} onChange={(e) => setTv(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                            <option className="bg-white dark:bg-neutral-900" value="">Nenhum plano de TV selecionado</option>
                                            {extendedTvPlans.map(p => <option className="bg-white dark:bg-neutral-900" key={p.label} value={p.label}>{p.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Tv size={14} className="text-[#E3000F]" /> Ponto Adicional de TV</label>
                                        <div className="flex gap-2">
                                            <select value={pontoAdicional} onChange={(e) => setPontoAdicional(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                                <option className="bg-white dark:bg-neutral-900" value="">Nenhum ponto adicional selecionado</option>
                                                {pontoAdicionalPlans.map(p => <option className="bg-white dark:bg-neutral-900" key={p.label} value={p.label}>{p.label}</option>)}
                                            </select>
                                            {pontoAdicional && (
                                                <input type="number" min="1" value={qtdPontoAdicional} onChange={(e) => setQtdPontoAdicional(e.target.value)} className="w-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" title="Quantidade" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Phone size={14} className="text-[#E3000F]" /> Fixo / Adicionais</label>
                                        <div className="flex gap-2">
                                            <select value={fixo} onChange={(e) => setFixo(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                                <option className="bg-white dark:bg-neutral-900" value="">Nenhum serviço adicional</option>
                                                {fixoPlans.map(p => <option className="bg-white dark:bg-neutral-900" key={p.label} value={p.label}>{p.label}</option>)}
                                            </select>
                                            {fixo && (
                                                <input type="number" min="1" value={qtdFixo} onChange={(e) => setQtdFixo(e.target.value)} className="w-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" title="Quantidade" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Router size={14} className="text-[#E3000F]" /> Rede Mesh / Wi-Fi</label>
                                        <select value={mesh} onChange={(e) => setMesh(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                            <option className="bg-white dark:bg-neutral-900" value="">Nenhum equipamento extra</option>
                                            {meshPlans.map(p => <option className="bg-white dark:bg-neutral-900" key={p.label} value={p.label}>{p.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botão Flutuante WhatsApp (Canto Inferior Direito) */}
                        <button 
                            onClick={handleWhatsAppShare}
                            disabled={valorTotal === 0 && valAparelhoBruto === 0}
                            className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-[0_10px_25px_rgba(37,211,102,0.4)] hover:bg-[#1EBE57] hover:scale-110 transition-all flex items-center justify-center no-print disabled:opacity-0 disabled:pointer-events-none group"
                            title="Compartilhar via WhatsApp"
                        >
                            <MessageCircle size={28} />
                            <span className="absolute right-full mr-4 bg-neutral-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Enviar via WhatsApp
                            </span>
                        </button>

                        {/* COLUNA DIREITA: VISUALIZAÇÃO DA PROPOSTA (O que será impresso) */}
                        <div className="w-full lg:w-[65%] flex flex-col print:w-full print:block print:h-auto print:overflow-visible">
                            <div className="w-full flex flex-col sm:flex-row gap-3 no-print mb-4 justify-end">
                                <button onClick={handleDownloadImage} disabled={valorTotal === 0 && valAparelhoBruto === 0} className="px-6 py-2.5 bg-neutral-900 dark:bg-neutral-800 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-neutral-700 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                    <Camera size={16} /> Baixar como Imagem
                                </button>
                                <button onClick={handlePrint} disabled={valorTotal === 0 && valAparelhoBruto === 0} className="px-6 py-2.5 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                    <Download size={16} /> Gerar PDF / Imprimir
                                </button>
                            </div>

                            <div id="printable-proposal" className="print-proposta bg-white dark:bg-neutral-900 w-full rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden print:overflow-visible relative print:shadow-none print:border print:border-neutral-300 print:w-full print:block print:max-w-[190mm] print:mx-auto" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                    
                                {/* Cabeçalho da Proposta */}
                                <div className="bg-neutral-900 dark:bg-neutral-950 text-white p-5 md:p-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E3000F] via-red-500 to-[#E3000F]"></div>
                                    <div className="flex items-center gap-4 text-center sm:text-left">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg shrink-0 mx-auto sm:mx-0">
                                            <img src={viteLogo} alt="Logo" className="w-8 h-8 object-contain" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-bold mb-0.5 tracking-tight">Proposta {import.meta.env.VITE_STORE_NAME || 'Loja Claro'}</h2>
                                            <p className="text-neutral-400 text-[11px] md:text-xs font-medium uppercase tracking-wider">Data: {new Date().toLocaleDateString('pt-BR')} &bull; Validade: 24 HORAS</p>
                                        </div>   
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <div className="text-sm font-bold">{globalUser?.name || 'Consultor Claro'}</div>
                                        <div className="text-[10px] text-neutral-400 uppercase tracking-widest">{import.meta.env.VITE_STORE_NAME || 'Loja Claro'} - {import.meta.env.VITE_STORE_CODE || ''}</div>   
                                    </div>
                                </div>   

                                {/* Corpo da Proposta: 2 Colunas Lado a Lado (Serviços | Benefícios) */}   
                                <div className="grid grid-cols-1 md:grid-cols-12 bg-white dark:bg-neutral-900 print:grid-cols-12">
                           
                                    {/* Coluna 1: Cliente e Resumo de Serviços (Lado Esquerdo) */}
                                    <div className="md:col-span-7 lg:col-span-7 print:col-span-7 p-6 print:p-5 flex flex-col border-b md:border-b-0 md:border-r border-neutral-100 dark:border-neutral-800 print:border-r print:border-neutral-200">   
                                        <div className="mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800 border-dashed">
                                            <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-0.5">Proposta para</div>   
                                            <div className="text-lg font-bold text-neutral-800 dark:text-neutral-100 leading-tight">{cliente || 'Cliente Não Informado'}</div>
                                        </div>   

                                        <div className="space-y-2 mb-4">
                                            <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Resumo dos Serviços</div>
                                   
                                            {movel && (
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-700"><Smartphone size={14} /></div><span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-36 sm:w-auto truncate">{movel}</span></div>
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white">{applyCurrencyMask(valMovel)}</span>   
                                                </div>
                                            )}
                                            {linhaInclusa && (
                                                <div className="flex justify-between items-center group">   
                                                    <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-700"><User size={14} /></div><span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-36 sm:w-auto truncate">{qtdLinhaInclusa > 1 ? `${qtdLinhaInclusa}x ` : ''}{linhaInclusa}</span></div>
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white">{applyCurrencyMask(valLinhaInclusa)}</span>   
                                                </div>
                                            )}   
                                            {linhaAdicional && (
                                                <div className="flex justify-between items-center group">   
                                                    <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-700"><User size={14} /></div><span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-36 sm:w-auto truncate">{qtdLinhaAdicional > 1 ? `${qtdLinhaAdicional}x ` : ''}{linhaAdicional}</span></div>
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white">{applyCurrencyMask(valLinhaAdicional)}</span>
                                                </div>
                                            )}   
                                            {fibra && (
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-700"><Wifi size={14} /></div><span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-36 sm:w-auto truncate">{qtdFibra > 1 ? `${qtdFibra}x ` : ''}Fibra {fibra}</span></div>
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white">{applyCurrencyMask(valFibra)}</span>
                                                </div>
                                            )}
                                            {tv && (
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-700"><Tv size={14} /></div><span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-36 sm:w-auto truncate">{tv}</span></div>
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white">{applyCurrencyMask(valTv)}</span>
                                                </div>
                                            )}
                                            {pontoAdicional && (
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-700"><Tv size={14} /></div><span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-36 sm:w-auto truncate">{qtdPontoAdicional > 1 ? `${qtdPontoAdicional}x ` : ''}{pontoAdicional}</span></div>
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white">{applyCurrencyMask(valPontoAdicional)}</span>
                                                </div>
                                            )}
                                            {fixo && (
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-700"><Phone size={14} /></div><span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-36 sm:w-auto truncate">{qtdFixo > 1 ? `${qtdFixo}x ` : ''}{fixo}</span></div>
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white">{applyCurrencyMask(valFixo)}</span>
                                                </div>
                                            )}
                                            {mesh && (
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-700"><Router size={14} /></div><span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-36 sm:w-auto truncate">{mesh}</span></div>
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white">{applyCurrencyMask(valMesh)}</span>
                                                </div>
                                            )}
                                            {seguro && (
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-700"><ShieldCheck size={14} /></div><span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-36 sm:w-auto truncate">{seguro} <span className="text-[9px] font-normal text-neutral-500 dark:text-neutral-400 block">(Boleto no Plano Móvel)</span></span></div>
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white">{applyCurrencyMask(valSeguro)}</span>
                                                </div>
                                            )}
                                            {valorTotal === 0 && (
                                                <div className="text-center py-4 text-neutral-400 dark:text-neutral-500 text-xs font-medium border border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50/50 dark:bg-neutral-800/50">
                                                    Nenhum serviço incluído na proposta.
                                                </div>
                                            )}
                                        </div>
                        
                                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                                            {comboType !== 'SINGLE' && valorTotal > 0 && (
                                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-neutral-200/60 dark:border-neutral-700">
                                                    <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={10} /> Benefício {comboType} Aplicado</span>
                                                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 line-through">De: {applyCurrencyMask(valorSemCombo)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest block mb-0.5">Plano Mensal</span>
                                                    {economiaAnual > 0 && <span className="text-[10px] text-green-600 font-bold block">Economia de {applyCurrencyMask(economiaAnual)} ao ano!</span>}
                                                </div>
                                                <span className="text-2xl md:text-3xl font-black text-[#E3000F] leading-none">{applyCurrencyMask(valorTotal)}</span>
                                            </div>
                                        </div>

                                        {valAparelhoBruto > 0 && (
                                            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 border-dashed">
                                                <div className="mb-3">
                                                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-0.5">Oferta Exclusiva de Aparelho{aparelhos.length > 1 ? 's' : ''}</span>
                                                </div>
                        
                                                <div className="space-y-4">
                                                    {aparelhos.map((ap, idx) => {
                                                        const valApBruto = parseCurrencyToFloat(ap.valor);
                                                        const valDesc = parseCurrencyToFloat(ap.claroTrocaBoost || '0');
                                                        const valAp = Math.max(0, valApBruto - valDesc);
                                                        if (valApBruto > 0) {
                                                            return (
                                                                <div key={ap.id} className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700">
                                                                    <h4 className="text-sm font-black text-neutral-800 dark:text-neutral-100 uppercase flex justify-between items-center mb-2 pb-2 border-b border-neutral-200 dark:border-neutral-700">
                                                                        <span>{ap.nome || `Aparelho ${idx + 1}`}</span> 
                                                                        <span className="text-xs text-[#E3000F] font-bold">{valDesc > 0 ? <span className="text-neutral-400 line-through mr-1 text-[10px]">{ap.valor}</span> : ''}{applyCurrencyMask(valAp)}</span>
                                                                    </h4>
                                                                    {valDesc > 0 && (
                                                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-green-200/50 dark:border-green-900/30">
                                                                            <span className="text-[10px] font-bold text-green-700 dark:text-green-400 flex items-center gap-1">♻️ Claro Troca - Boost</span>
                                                                            <span className="text-[10px] font-black text-green-700 dark:text-green-400">-{applyCurrencyMask(valDesc)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                                                        <div className="bg-white dark:bg-neutral-800 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 flex flex-col items-center text-center justify-center">
                                                                            <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">À Vista</span>
                                                                            <span className="text-sm font-black text-neutral-900 dark:text-white">{applyCurrencyMask(valAp)}</span>
                                                                        </div>
                                                                        <div className="bg-white dark:bg-neutral-800 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 flex flex-col items-center text-center justify-center">
                                                                            <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">12x Sem Juros</span>
                                                                            <span className="text-sm font-black text-neutral-900 dark:text-white">12x de {applyCurrencyMask(valAp / 12)}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                                                        <div className="flex flex-col pr-2">
                                                                            <span className="text-[10px] font-bold text-red-800 dark:text-red-400 uppercase tracking-wide">21x Sem Juros</span>
                                                                            <span className="text-[8px] text-red-600 dark:text-red-500 mt-0.5 leading-tight max-w-[200px] hidden sm:block">Exclusivo para Multi nos cartões selecionados.</span>
                                                                        </div>
                                                                        <div className="text-right whitespace-nowrap flex flex-col items-end">
                                                                            <span className="text-sm font-black text-[#E3000F]">21x de {applyCurrencyMask(valAp / 21)}</span>
                                                                            {comboType === 'SINGLE' && <span className="text-[8px] font-bold text-[#E3000F] uppercase mt-0.5"> *REQUER MULTI</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                        
                                    {/* Coluna 2: Benefícios do Site Claro (Lado Direito) */}
                                    <div className="md:col-span-5 lg:col-span-5 print:col-span-5 bg-green-50/20 dark:bg-green-900/5 print:bg-green-50/40 p-6 print:p-5 flex flex-col">
                                        <h3 className="text-[11px] font-bold text-green-800 dark:text-green-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-green-600" /> Benefícios Inclusos
                                        </h3>
            
                                        <div className="space-y-3 flex-1">
                                            {beneficios.length === 0 ? (
                                                <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center mt-10">Adicione produtos para ver as vantagens.</p>
                                            ) : (
                                                beneficios.map((b, idx) => (
                                                    <div key={idx} className="flex gap-3 items-start">
                                                        <div className="mt-0.5 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg shrink-0">{b.icon}</div>
                                                        <div> 
                                                            <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 leading-tight mb-0.5">{b.title}</h4>
                                                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug">{b.desc}</p>
                                                            {b.badges && <StreamingBadges />}
                                                        </div>
                                                    </div>
                                                ))        
                                            )} 
                                        </div>

                                        {/* QR Code Avaliação Google */}
                                        <div className="mt-4 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col items-center text-center shadow-sm">
                                            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-100 mb-1 flex items-center justify-center gap-1.5">
                                                <Star size={14} className="text-yellow-500 fill-yellow-500" /> Avalie nosso atendimento!
                                            </p>
                                            <p className="text-[9px] text-neutral-500 dark:text-neutral-400 mb-3 leading-tight">
                                                Como foi sua experiência na loja? Escaneie com a câmera do seu celular e deixe sua avaliação no Google.
                                            </p>
                                            <div className="p-1 bg-white rounded-lg border border-neutral-200 shadow-sm shrink-0">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${mapsLink}&margin=0`} alt="QR Code Avaliação Google" className="w-16 h-16 object-contain" crossOrigin="anonymous" />
                                            </div>
                                        </div>

                                        {/* Assinatura do Consultor (Visível apenas na impressão/PDF) */}
                                        <div className="mt-4 text-center pt-3 border-t border-neutral-200 dark:border-neutral-800 hidden print:block">
                                            <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Consultor de Vendas</div>
                                            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{globalUser?.name ? globalUser.name.split(' ')[0] : 'Consultor Claro'}</div>
                                            <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{import.meta.env.VITE_STORE_NAME || 'Loja Claro'}</div>
                                            <div className="text-[09px] text-neutral-500 dark:text-neutral-400">Email: {globalUser?.email || 'consultor@claro.com.br'}</div>
                                            {import.meta.env.VITE_STORE_ADDRESS && <div className="text-[08px] text-neutral-500 dark:text-neutral-400">{import.meta.env.VITE_STORE_ADDRESS}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'COMPARADOR' && (
                    <div className="flex flex-col lg:flex-row gap-6 min-h-full print:block print:h-auto print:overflow-visible">
                        {/* COLUNA ESQUERDA: Form de Seleção */}
                        <div className="w-full lg:w-[35%] flex flex-col gap-4 no-print pr-2 pb-8">
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-5 shrink-0">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-[#E3000F]">
                                        <ArrowRightLeft size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100">Comparador de Planos</h2>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Selecione os pacotes para comparar lado a lado.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* OPÇÃO A */}
                                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
                                        <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider mb-2">Pacote A</h3>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Smartphone size={14} className="text-[#E3000F]" /> Móvel</label>
                                            <select value={compA.movel} onChange={e => setCompA({ ...compA, movel: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                <option value="">Nenhum</option>
                                                {mobilePlans.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><User size={14} className="text-[#E3000F]" /> Linha Inclusa</label>
                                            <div className="flex gap-2">
                                                <select value={compA.linhaInclusa} onChange={e => setCompA({ ...compA, linhaInclusa: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                    <option value="">Nenhuma</option>
                                                    {linhaInclusaPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                                </select>
                                                {compA.linhaInclusa && (
                                                    <input type="number" min="1" value={compA.qtdLinhaInclusa} onChange={e => setCompA({ ...compA, qtdLinhaInclusa: e.target.value })} className="w-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-2 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><User size={14} className="text-[#E3000F]" /> Linha Adicional</label>
                                            <div className="flex gap-2">
                                                <select value={compA.linhaAdicional} onChange={e => setCompA({ ...compA, linhaAdicional: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                    <option value="">Nenhuma</option>
                                                    {linhaAdicionalPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                                </select>
                                                {compA.linhaAdicional && (
                                                    <input type="number" min="1" value={compA.qtdLinhaAdicional} onChange={e => setCompA({ ...compA, qtdLinhaAdicional: e.target.value })} className="w-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-2 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Wifi size={14} className="text-[#E3000F]" /> Fibra</label>
                                            <div className="flex gap-2">
                                                <select value={compA.fibra} onChange={e => setCompA({ ...compA, fibra: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                    <option value="">Nenhum</option>
                                                    {extendedFibraPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                                </select>
                                                {compA.fibra && (
                                                    <input type="number" min="1" value={compA.qtdFibra} onChange={e => setCompA({ ...compA, qtdFibra: e.target.value })} className="w-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-2 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Tv size={14} className="text-[#E3000F]" /> TV</label>
                                            <select value={compA.tv} onChange={e => setCompA({ ...compA, tv: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                <option value="">Nenhum</option>
                                                {extendedTvPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Tv size={14} className="text-[#E3000F]" /> Ponto Adicional</label>
                                            <div className="flex gap-2">
                                                <select value={compA.pontoAdicional} onChange={e => setCompA({ ...compA, pontoAdicional: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                    <option value="">Nenhum</option>
                                                    {pontoAdicionalPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                                </select>
                                                {compA.pontoAdicional && (
                                                    <input type="number" min="1" value={compA.qtdPontoAdicional} onChange={e => setCompA({ ...compA, qtdPontoAdicional: e.target.value })} className="w-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-2 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Phone size={14} className="text-[#E3000F]" /> Fixo</label>
                                            <div className="flex gap-2">
                                                <select value={compA.fixo} onChange={e => setCompA({ ...compA, fixo: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                    <option value="">Nenhum</option>
                                                    {fixoPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                                </select>
                                                {compA.fixo && (
                                                    <input type="number" min="1" value={compA.qtdFixo} onChange={e => setCompA({ ...compA, qtdFixo: e.target.value })} className="w-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-2 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Router size={14} className="text-[#E3000F]" /> Mesh</label>
                                            <select value={compA.mesh} onChange={e => setCompA({ ...compA, mesh: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                <option value="">Nenhum</option>
                                                {meshPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* OPÇÃO B */}
                                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
                                        <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider mb-2">Pacote B</h3>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Smartphone size={14} className="text-[#E3000F]" /> Móvel</label>
                                            <select value={compB.movel} onChange={e => setCompB({ ...compB, movel: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                <option value="">Nenhum</option>
                                                {mobilePlans.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><User size={14} className="text-[#E3000F]" /> Linha Inclusa</label>
                                            <div className="flex gap-2">
                                                <select value={compB.linhaInclusa} onChange={e => setCompB({ ...compB, linhaInclusa: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                    <option value="">Nenhuma</option>
                                                    {linhaInclusaPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                                </select>
                                                {compB.linhaInclusa && (
                                                    <input type="number" min="1" value={compB.qtdLinhaInclusa} onChange={e => setCompB({ ...compB, qtdLinhaInclusa: e.target.value })} className="w-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-2 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><User size={14} className="text-[#E3000F]" /> Linha Adicional</label>
                                            <div className="flex gap-2">
                                                <select value={compB.linhaAdicional} onChange={e => setCompB({ ...compB, linhaAdicional: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                    <option value="">Nenhuma</option>
                                                    {linhaAdicionalPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                                </select>
                                                {compB.linhaAdicional && (
                                                    <input type="number" min="1" value={compB.qtdLinhaAdicional} onChange={e => setCompB({ ...compB, qtdLinhaAdicional: e.target.value })} className="w-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-2 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Wifi size={14} className="text-[#E3000F]" /> Fibra</label>
                                            <div className="flex gap-2">
                                                <select value={compB.fibra} onChange={e => setCompB({ ...compB, fibra: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                    <option value="">Nenhum</option>
                                                    {extendedFibraPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                                </select>
                                                {compB.fibra && (
                                                    <input type="number" min="1" value={compB.qtdFibra} onChange={e => setCompB({ ...compB, qtdFibra: e.target.value })} className="w-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-2 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Tv size={14} className="text-[#E3000F]" /> TV</label>
                                            <select value={compB.tv} onChange={e => setCompB({ ...compB, tv: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                <option value="">Nenhum</option>
                                                {extendedTvPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Tv size={14} className="text-[#E3000F]" /> Ponto Adicional</label>
                                            <div className="flex gap-2">
                                                <select value={compB.pontoAdicional} onChange={e => setCompB({ ...compB, pontoAdicional: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                    <option value="">Nenhum</option>
                                                    {pontoAdicionalPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                                </select>
                                                {compB.pontoAdicional && (
                                                    <input type="number" min="1" value={compB.qtdPontoAdicional} onChange={e => setCompB({ ...compB, qtdPontoAdicional: e.target.value })} className="w-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-2 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Phone size={14} className="text-[#E3000F]" /> Fixo</label>
                                            <div className="flex gap-2">
                                                <select value={compB.fixo} onChange={e => setCompB({ ...compB, fixo: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                    <option value="">Nenhum</option>
                                                    {fixoPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                                </select>
                                                {compB.fixo && (
                                                    <input type="number" min="1" value={compB.qtdFixo} onChange={e => setCompB({ ...compB, qtdFixo: e.target.value })} className="w-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-2 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium text-center" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2"><Router size={14} className="text-[#E3000F]" /> Mesh</label>
                                            <select value={compB.mesh} onChange={e => setCompB({ ...compB, mesh: e.target.value })} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium">
                                                <option value="">Nenhum</option>
                                                {meshPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUNA DIREITA: VISUALIZAÇÃO DO COMPARADOR (O que será impresso) */}
                        <div className="w-full lg:w-[65%] flex flex-col print:w-full print:block print:h-auto print:overflow-visible">
                            <div className="w-full flex flex-col sm:flex-row gap-3 no-print mb-4 justify-end">
                                <button onClick={handleDownloadImageComparador} disabled={!dataA.total && !dataB.total} className="px-6 py-2.5 bg-neutral-900 dark:bg-neutral-800 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-neutral-700 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                    <Camera size={16} /> Baixar Comparativo (Imagem)
                                </button>
                                <button onClick={handlePrint} disabled={!dataA.total && !dataB.total} className="px-6 py-2.5 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                    <Download size={16} /> Gerar PDF / Imprimir
                                </button>
                            </div>

                            <div id="printable-comparador" className="print-proposta bg-white dark:bg-neutral-900 w-full rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden print:overflow-visible relative print:shadow-none print:border print:border-neutral-300 print:w-full print:block print:max-w-[190mm] print:mx-auto" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                {/* Cabeçalho */}
                                <div className="bg-neutral-900 dark:bg-neutral-950 text-white p-5 md:p-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E3000F] via-red-500 to-[#E3000F]"></div>
                                    <div className="flex items-center gap-4 text-center sm:text-left">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg shrink-0 mx-auto sm:mx-0">
                                            <img src={viteLogo} alt="Logo" className="w-8 h-8 object-contain" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-bold mb-0.5 tracking-tight">Comparativo de Planos Claro</h2>
                                            <p className="text-neutral-400 text-[11px] md:text-xs font-medium uppercase tracking-wider">Data: {new Date().toLocaleDateString('pt-BR')} &bull; Validade: 24 HORAS</p>
                                        </div>   
                                    </div>
                                </div>   

                                <div className="flex flex-col sm:flex-row bg-white dark:bg-neutral-900 sm:divide-x divide-y sm:divide-y-0 divide-neutral-100 dark:divide-neutral-800">
                                    {/* Pacote A */}
                                    <div className="flex-1 flex flex-col p-4 sm:p-6">
                                        <div className="text-center mb-6">
                                            <div className="inline-block bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full mb-3">Opção A</div>
                                            <div className="text-2xl md:text-3xl font-black text-[#E3000F]">{applyCurrencyMask(dataA.total)}</div>
                                            <div className="text-[10px] text-neutral-500 uppercase mt-1">{dataA.type}</div>
                                        </div>

                                        <div className="space-y-3 mb-6 flex-1">
                                            {compA.movel && (
                                                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                                    <div className="flex items-center gap-2"><Smartphone size={14} className="text-neutral-500" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compA.movel}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataA.valMovel)}</span>
                                                </div>
                                            )}
                                            {compA.linhaInclusa && (
                                                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                                    <div className="flex items-center gap-2"><User size={14} className="text-neutral-500" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compA.qtdLinhaInclusa > 1 ? `${compA.qtdLinhaInclusa}x ` : ''}{compA.linhaInclusa}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataA.valLinhaInclusa)}</span>
                                                </div>
                                            )}
                                            {compA.linhaAdicional && (
                                                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                                    <div className="flex items-center gap-2"><User size={14} className="text-neutral-500" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compA.qtdLinhaAdicional > 1 ? `${compA.qtdLinhaAdicional}x ` : ''}{compA.linhaAdicional}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataA.valLinhaAdicional)}</span>
                                                </div>
                                            )}
                                            {compA.fibra && (
                                                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                                    <div className="flex items-center gap-2"><Wifi size={14} className="text-neutral-500" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">{compA.qtdFibra > 1 ? `${compA.qtdFibra}x ` : ''}Fibra {compA.fibra}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataA.valFibra)}</span>
                                                </div>
                                            )}
                                            {compA.tv && (
                                                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                                    <div className="flex items-center gap-2"><Tv size={14} className="text-neutral-500" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compA.tv}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataA.valTv)}</span>
                                                </div>
                                            )}
                                            {compA.pontoAdicional && (
                                                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                                    <div className="flex items-center gap-2"><Tv size={14} className="text-neutral-500" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compA.qtdPontoAdicional > 1 ? `${compA.qtdPontoAdicional}x ` : ''}{compA.pontoAdicional}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataA.valPontoAdicional)}</span>
                                                </div>
                                            )}
                                            {compA.fixo && (
                                                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                                    <div className="flex items-center gap-2"><Phone size={14} className="text-neutral-500" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compA.qtdFixo > 1 ? `${compA.qtdFixo}x ` : ''}{compA.fixo}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataA.valFixo)}</span>
                                                </div>
                                            )}
                                            {compA.mesh && (
                                                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                                    <div className="flex items-center gap-2"><Router size={14} className="text-neutral-500" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compA.mesh}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataA.valMesh)}</span>
                                                </div>
                                            )}
                                            {!compA.movel && !compA.linhaInclusa && !compA.linhaAdicional && !compA.fibra && !compA.tv && !compA.pontoAdicional && !compA.fixo && !compA.mesh && (
                                                <div className="text-center text-[10px] text-neutral-400 py-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">Vazio</div>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                            <h4 className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3 text-center">Benefícios Inclusos</h4>
                                            <div className="space-y-2.5">
                                                {dataA.bens.map((b, i) => (
                                                    <div key={i} className="flex gap-2 items-start">
                                                        <div className="text-green-500 shrink-0 mt-0.5">{b.icon}</div>
                                                        <div>
                                                            <div className="text-[10px] font-bold text-neutral-800 dark:text-neutral-200 leading-tight">{b.title}</div>
                                                            <div className="text-[9px] text-neutral-500 leading-tight">{b.desc}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pacote B */}
                                    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-neutral-50/30 dark:bg-neutral-950/20">
                                        <div className="text-center mb-6">
                                            <div className="inline-block bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full mb-3">Opção B</div>
                                            <div className="text-2xl md:text-3xl font-black text-[#E3000F]">{applyCurrencyMask(dataB.total)}</div>
                                            <div className="text-[10px] text-neutral-500 uppercase mt-1">{dataB.type}</div>
                                        </div>

                                        <div className="space-y-3 mb-6 flex-1">
                                            {compB.movel && (
                                                <div className="flex justify-between items-center bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                                    <div className="flex items-center gap-2"><Smartphone size={14} className="text-[#E3000F]" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compB.movel}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataB.valMovel)}</span>
                                                </div>
                                            )}
                                            {compB.linhaInclusa && (
                                                <div className="flex justify-between items-center bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                                    <div className="flex items-center gap-2"><User size={14} className="text-[#E3000F]" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compB.qtdLinhaInclusa > 1 ? `${compB.qtdLinhaInclusa}x ` : ''}{compB.linhaInclusa}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataB.valLinhaInclusa)}</span>
                                                </div>
                                            )}
                                            {compB.linhaAdicional && (
                                                <div className="flex justify-between items-center bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                                    <div className="flex items-center gap-2"><User size={14} className="text-[#E3000F]" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compB.qtdLinhaAdicional > 1 ? `${compB.qtdLinhaAdicional}x ` : ''}{compB.linhaAdicional}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataB.valLinhaAdicional)}</span>
                                                </div>
                                            )}
                                            {compB.fibra && (
                                                <div className="flex justify-between items-center bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                                    <div className="flex items-center gap-2"><Wifi size={14} className="text-[#E3000F]" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">{compB.qtdFibra > 1 ? `${compB.qtdFibra}x ` : ''}Fibra {compB.fibra}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataB.valFibra)}</span>
                                                </div>
                                            )}
                                            {compB.tv && (
                                                <div className="flex justify-between items-center bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                                    <div className="flex items-center gap-2"><Tv size={14} className="text-[#E3000F]" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compB.tv}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataB.valTv)}</span>
                                                </div>
                                            )}
                                            {compB.pontoAdicional && (
                                                <div className="flex justify-between items-center bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                                    <div className="flex items-center gap-2"><Tv size={14} className="text-[#E3000F]" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compB.qtdPontoAdicional > 1 ? `${compB.qtdPontoAdicional}x ` : ''}{compB.pontoAdicional}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataB.valPontoAdicional)}</span>
                                                </div>
                                            )}
                                            {compB.fixo && (
                                                <div className="flex justify-between items-center bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                                    <div className="flex items-center gap-2"><Phone size={14} className="text-[#E3000F]" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compB.qtdFixo > 1 ? `${compB.qtdFixo}x ` : ''}{compB.fixo}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataB.valFixo)}</span>
                                                </div>
                                            )}
                                            {compB.mesh && (
                                                <div className="flex justify-between items-center bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                                    <div className="flex items-center gap-2"><Router size={14} className="text-[#E3000F]" /><span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight w-24 sm:w-auto truncate">{compB.mesh}</span></div>
                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white shrink-0">{applyCurrencyMask(dataB.valMesh)}</span>
                                                </div>
                                            )}
                                            {!compB.movel && !compB.linhaInclusa && !compB.linhaAdicional && !compB.fibra && !compB.tv && !compB.pontoAdicional && !compB.fixo && !compB.mesh && (
                                                <div className="text-center text-[10px] text-neutral-400 py-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">Vazio</div>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                            <h4 className="text-[10px] font-bold text-[#E3000F] uppercase tracking-widest mb-3 text-center">Benefícios Inclusos</h4>
                                            <div className="space-y-2.5">
                                                {dataB.bens.map((b, i) => (
                                                    <div key={i} className="flex gap-2 items-start">
                                                        <div className="text-[#E3000F] shrink-0 mt-0.5">{b.icon}</div>
                                                        <div>
                                                            <div className="text-[10px] font-bold text-neutral-800 dark:text-neutral-200 leading-tight">{b.title}</div>
                                                            <div className="text-[9px] text-neutral-500 leading-tight">{b.desc}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'COMPARADOR_APARELHOS' && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl border-dashed">
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4"><Smartphone size={32} /></div>
                        <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">Em Desenvolvimento</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm mt-1">O comparador de aparelhos está sendo construído e em breve estará disponível.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 