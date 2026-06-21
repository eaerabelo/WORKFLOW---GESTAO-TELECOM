import React, { useState, useEffect } from 'react';
import { X, Printer, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { applyCpfCnpjMask, applyCurrencyMask, parseCurrencyToFloat, applyContratoMask } from './masks';
import ClaroLogoImg from '../assets/CLARO_LOGO.png';

const ClaroLogo = () => (
    <img src={ClaroLogoImg} alt="Logo Claro" className="h-9 w-auto print:h-8" />
);

const SectionHeader = ({ number, title }) => (
    <div className="flex items-center gap-2 mb-3 pb-1 border-b border-neutral-200 dark:border-neutral-800 print:border-neutral-400 print:mb-2 print:pb-0.5">
        <span className="text-lg font-black text-[#E3000F] font-mono print:text-xs">{number}</span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-100 print:text-black print:text-[10px]">{title}</h2>
    </div>
);

const InputField = ({ label, value, onChange, type = "text", readOnly = false, isMono = false }) => (
    <div className="space-y-1 print:space-y-0.5">
        <label className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 print:text-neutral-600 font-bold print:text-[8px]">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={onChange} 
            readOnly={readOnly}
            className={`w-full bg-neutral-50 dark:bg-neutral-800/50 print:bg-white border ${readOnly ? 'border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 cursor-not-allowed' : 'border-neutral-200 dark:border-neutral-700'} rounded-lg px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 print:text-black print:border-neutral-400 print:border-b print:border-t-0 print:border-x-0 print:rounded-none print:px-1 print:py-0.5 print:text-[10px] focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] outline-none transition-colors ${isMono ? 'font-mono' : 'font-medium'}`} 
        />
    </div>
);

const SelectField = ({ label, value, onChange, options, readOnly = false }) => (
    <div className="space-y-1 print:space-y-0.5">
        <label className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 print:text-neutral-600 font-bold print:text-[8px]">{label}</label>
        <select 
            value={value} 
            onChange={onChange} 
            disabled={readOnly}
            className={`w-full bg-neutral-50 dark:bg-neutral-800/50 print:bg-white border ${readOnly ? 'border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 cursor-not-allowed appearance-none' : 'border-neutral-200 dark:border-neutral-700'} rounded-lg px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 print:text-black print:border-neutral-400 print:border-b print:border-t-0 print:border-x-0 print:rounded-none print:px-1 print:py-0.5 print:text-[10px] focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] outline-none transition-colors font-medium print:appearance-none`} 
        >
            <option value=""></option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

export default function ClaroContractForm({ sale, onClose }) {
    // Preenche automaticamente com os dados da venda selecionada
    const [contractData, setContractData] = useState({
        metadados: {
            operacaoComercial: '',
            protocolo: sale?.contrato && sale.contrato !== '-' ? applyContratoMask(String(sale.contrato)) : applyContratoMask(`2026${Math.floor(Math.random() * 1000000000)}`),
            vendedorCodigo: sale?.vendedor || '',
            codigoAprovacao: '',
            codigoLoja: import.meta.env.VITE_STORE_CODE || '',
            lojaNome: import.meta.env.VITE_STORE_NAME || 'LOJA CLARO'
        },
        titular: {
            nome: sale?.nomeCliente || '',
            documento: '',
            nascimento: '',
            cpf: applyCpfCnpjMask(String(sale?.cpf || '')),
            email: '',
            nomeMae: '',
            telefoneFixo: '',
        },
        endereco: {
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            uf: '',
        },
        planoPrincipal: {
            planoServico: sale?.produto || '',
            promocao: '',
            pacotes: '',
            simCard: '',
            celular: '',
            celularProvisorio: '',
            marcaModeloAparelho: '',
            imeiAparelho: '',
            valorInicialAparelho: '',
            descontoComercial: '',
            descontoClaroClube: '',
            valorFinalAparelho: '',
            permanencia: '12 Meses',
            multa: '',
            mensalidade: applyCurrencyMask(Number(sale?.receita || 0).toFixed(2)),
        },
        dependentes: Array.from({ length: 5 }, (_, i) => ({
            incluir: false,
            planoServico: '',
            promocao: '',
            pacotes: '',
            simCard: '',
            celular: '',
            celularProvisorio: '',
            marcaModeloAparelho: '',
            imeiAparelho: '',
            valorInicialAparelho: '',
            valorFinalAparelho: '',
            permanencia: '12 Meses',
            multa: applyCurrencyMask(Number(240).toFixed(2)),
            mensalidade: '',
        })),
        residencial: {
            incluir: false,
            tv: {
                plano: '', tecnologia: '', mensalidade: '', promocional: '', periodoPromocional: '', adesao: '', pontosOpcionais: '', tecnologiaPO: '', valorPO: '', adesaoPO: '', degustacao: '', agregados: ''
            },
            internet: {
                plano: '', ipFixo: '', mensalidade: '', promocional: '', periodoPromocional: '', adesao: '', modem: '', valorModem: '', franquia: '', upload: '', download: '', pontoUltra: '', pontoUltraAdesao: '', pontoUltraQtd: '', sva: '', svaQtd: '', svaValor: ''
            },
            fixo: { plano: '' }
        },
        financeiro: {
            valorTotalServicos: applyCurrencyMask(Number(sale?.receita || 0).toFixed(2)),
            desconto: '',
            valorTotalComDesconto: applyCurrencyMask(Number(sale?.receita || 0).toFixed(2)),
            valorAparelhoChip: '',
            formaPagamentoAparelho: '',
            parcelamentoAparelhoVezes: '',
            parcelamentoAparelhoValor: '',
            formaPagamentoConta: 'BOLETO',
            formaRecebimentoConta: 'E-MAIL',
            vencimento: '10',
            banco: '',
            numBanco: '',
            agencia: '',
            conta: '',
        },
        claroClube: {
            saldoAtual: '',
            pontosUtilizados: '',
            saldoRestante: ''
        },
        declaracao: {
            optInPrivacidade: 'SIM',
            optInPublicidade: 'SIM',
            localEmissao: import.meta.env.VITE_STORE_NAME ? `${import.meta.env.VITE_STORE_NAME} - SP` : 'SÃO PAULO - SP',
            dataEmissao: sale?.data ? (typeof sale.data === 'string' && sale.data.includes('-') ? new Date(sale.data + 'T12:00:00').toLocaleDateString('pt-BR') : sale.data) : new Date().toLocaleDateString('pt-BR'),
            aceite: false
        }
    });

    const [isFetchingCep, setIsFetchingCep] = useState(false);

    // Atualiza o Valor Total sempre que a mensalidade principal ou de dependentes mudar
    useEffect(() => {
        const principal = parseCurrencyToFloat(String(contractData.planoPrincipal.mensalidade || '0'));
        const deps = contractData.dependentes.reduce((acc, curr) => curr.incluir ? acc + parseCurrencyToFloat(String(curr.mensalidade || '0')) : acc, 0);
        
        let res = 0;
        if (contractData.residencial?.incluir) {
            res += parseCurrencyToFloat(String(contractData.residencial.tv.mensalidade || '0'));
            res += parseCurrencyToFloat(String(contractData.residencial.tv.valorPO || '0'));
            res += parseCurrencyToFloat(String(contractData.residencial.internet.mensalidade || '0'));
            res += parseCurrencyToFloat(String(contractData.residencial.internet.svaValor || '0'));
        }

        const totalServicos = principal + deps + res;
        const desc = parseCurrencyToFloat(String(contractData.financeiro.desconto || '0'));
    
        setContractData(prev => ({
            ...prev,
            financeiro: { 
                ...prev.financeiro, 
                valorTotalServicos: applyCurrencyMask(totalServicos.toFixed(2)),
                valorTotalComDesconto: applyCurrencyMask((totalServicos - desc).toFixed(2))
            }
        }));
    }, [contractData.planoPrincipal.mensalidade, contractData.dependentes, contractData.financeiro.desconto, contractData.residencial]);

    const handleInputChange = (section, field, value) => {
        let formattedValue = value;
        
        if (field === 'cpf') formattedValue = applyCpfCnpjMask(String(value));
        else if (field === 'protocolo') formattedValue = applyContratoMask(String(value));
        else if (['mensalidade', 'valorInicialAparelho', 'descontoComercial', 'descontoClaroClube', 'valorFinalAparelho', 'multa', 'desconto', 'valorAparelhoChip', 'parcelamentoAparelhoValor'].includes(field)) {
            formattedValue = applyCurrencyMask(String(value));
        } else if (['celular', 'celularProvisorio', 'telefoneFixo'].includes(field)) {
            let v = String(value).replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            let masked = v;
            if (v.length > 7) masked = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
            else if (v.length > 2) masked = `(${v.slice(0, 2)}) ${v.slice(2)}`;
            formattedValue = masked;
        }
        
        setContractData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: formattedValue
            }
        }));
    };

    const handleDependenteChange = (index, field, value) => {
        let formattedValue = value;
        if (['mensalidade', 'valorInicialAparelho', 'valorFinalAparelho', 'multa'].includes(field)) {
            formattedValue = applyCurrencyMask(String(value));
        } else if (['celular', 'celularProvisorio'].includes(field)) {
            let v = String(value).replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            let masked = v;
            if (v.length > 7) masked = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
            else if (v.length > 2) masked = `(${v.slice(0, 2)}) ${v.slice(2)}`;
            formattedValue = masked;
        }

        setContractData(prev => {
            const newDeps = [...prev.dependentes];
            newDeps[index] = { ...newDeps[index], [field]: formattedValue };
            return { ...prev, dependentes: newDeps };
        });
    };

    const handleResidencialChange = (service, field, value) => {
        let formattedValue = value;
        if (['mensalidade', 'promocional', 'adesao', 'valorPO', 'adesaoPO', 'valorModem', 'pontoUltraAdesao', 'svaValor'].includes(field)) {
            formattedValue = applyCurrencyMask(String(value));
        }
        setContractData(prev => ({
            ...prev,
            residencial: {
                ...prev.residencial,
                [service]: {
                    ...prev.residencial[service],
                    [field]: formattedValue
                }
            }
        }));
    };

    const handleCepChange = async (e) => {
        let cep = e.target.value.replace(/\D/g, '');
        let formattedCep = cep;
        if (cep.length > 5) formattedCep = cep.replace(/^(\d{5})(\d)/, "$1-$2");
        
        setContractData(prev => ({
            ...prev,
            endereco: { ...prev.endereco, cep: formattedCep }
        }));

        if (cep.length === 8) {
            const toastId = toast.loading('Buscando CEP...');
            setIsFetchingCep(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setContractData(prev => ({
                        ...prev,
                        endereco: {
                            ...prev.endereco,
                            logradouro: data.logradouro || '',
                            bairro: data.bairro || '',
                            cidade: data.localidade || '',
                            uf: data.uf || '',
                            cep: formattedCep
                        }
                    }));
                    toast.success('Endereço preenchido automaticamente!', { id: toastId });
                } else {
                    toast.error('CEP não encontrado. Preencha os campos manualmente.', { id: toastId });
                }
            } catch (err) {
                console.error('Falha ao buscar CEP', err);
                toast.error('Erro ao buscar o CEP. Tente preencher manualmente.', { id: toastId });
            } finally {
                setIsFetchingCep(false);
            }
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

    return (
        <div id="print-contract-container" className="fixed inset-0 z-[70] flex justify-center items-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            
            <style>
                {`
                    @media print {
                        /* 1. Remove limites de overflow para evitar tela branca/cortes */
                        * {
                            overflow: visible !important;
                            max-height: none !important;
                        }
                        
                        html, body {
                            height: auto !important;
                            background: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }

                        /* 2. Oculta todo o sistema, exceto o contrato */
                        body * {
                            visibility: hidden;
                        }
                        
                        #print-contract-container, #print-contract-container * {
                            visibility: visible;
                        }

                        /* 3. Posiciona o contrato no topo absoluto da página */
                        #print-contract-container {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            height: auto !important;
                            background: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            display: block !important;
                        }

                        #print-contract-container > div {
                            position: static !important;
                            width: 100% !important;
                            height: auto !important;
                            box-shadow: none !important;
                            border: none !important;
                            border-radius: 0 !important;
                            transform: none !important;
                            animation: none !important;
                            opacity: 1 !important;
                            display: block !important;
                        }

                        #print-contract-content {
                            height: auto !important;
                            display: block !important;
                            padding: 0 !important;
                        }

                        .no-print {
                            display: none !important;
                        }
                    }
                `}
            </style>
            
            <div className="bg-white dark:bg-neutral-950 w-full h-full sm:h-[95vh] sm:max-w-5xl sm:rounded-2xl shadow-2xl flex flex-col relative overflow-hidden animate-fade-in">
        
                {/* HEADER APLICATIVO (NO-PRINT) */}
                <div className="bg-neutral-900 text-white p-4 flex justify-between items-center shrink-0 no-print">
                    <div className="flex items-center gap-2 font-bold"><FileText size={18} className="text-[#E3000F]" /> Gerador de Contrato</div>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"><Printer size={16} /> Imprimir PDF</button>
                        <button onClick={onClose} className="p-2 bg-neutral-800 hover:bg-red-600 rounded-lg transition-colors"><X size={18} /></button>
                    </div>
                </div>

                <div id="print-contract-content" className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-8">
                    <div className="max-w-4xl mx-auto space-y-8 print:space-y-6">
            
                        {/* HEADER CORPORATIVO DO CONTRATO */}
                        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800 print:border-neutral-300">
                            <div className="flex items-center gap-4">
                                <ClaroLogo />
                            </div>
                            <div className="text-right">
                                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white print:text-black tracking-tight uppercase leading-none">Termo de Adesão e Contrato</h1>
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 print:text-neutral-600 font-bold uppercase tracking-wider mt-1">Prestação de Serviços pós pago/residencial — PF/PJ</p>
                            </div>
                        </header>

                        {/* SEÇÃO 01 */}
                        <section className="print:break-inside-avoid">
                            <SectionHeader number="01" title="TERMO DE ADESÃO DA PESSOA FÍSICA PARA PLANOS DE SERVIÇO" />
                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2">
                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Operação Comercial" value={contractData.metadados.operacaoComercial} onChange={(e) => handleInputChange('metadados', 'operacaoComercial', e.target.value)} /></div>
                                <InputField label="Contrato" value={contractData.metadados.protocolo} onChange={(e) => handleInputChange('metadados', 'protocolo', e.target.value)} isMono={true} />
                                <InputField label="Cód. do Vendedor" value={contractData.metadados.vendedorCodigo} onChange={(e) => handleInputChange('metadados', 'vendedorCodigo', e.target.value)} />
                                <InputField label="Cód. da Aprovação" value={contractData.metadados.codigoAprovacao} onChange={(e) => handleInputChange('metadados', 'codigoAprovacao', e.target.value)} />
                                <InputField label="Cód. da Loja" value={contractData.metadados.codigoLoja} onChange={(e) => handleInputChange('metadados', 'codigoLoja', e.target.value)} />
                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Nome da Loja" value={contractData.metadados.lojaNome} onChange={(e) => handleInputChange('metadados', 'lojaNome', e.target.value)} /></div>
                            </div>
                        </section>

                        {/* SEÇÃO 02 */}
                        <section className="print:break-inside-avoid print:mt-2">
                            <SectionHeader number="02" title="Dados Cadastrais e Endereço para Entrega de Fatura" />
                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2 mb-3 print:mb-2">
                                <div className="sm:col-span-2"><InputField label="Nome Completo" value={contractData.titular.nome} onChange={(e) => handleInputChange('titular', 'nome', e.target.value)} /></div>
                                <InputField label="CPF / CNPJ" value={contractData.titular.cpf} onChange={(e) => handleInputChange('titular', 'cpf', e.target.value)} isMono={true} />
                                <InputField label="RG / CNH / Passaporte" value={contractData.titular.documento} onChange={(e) => handleInputChange('titular', 'documento', e.target.value)} />
                                <InputField label="Data de Nascimento" type="date" value={contractData.titular.nascimento} onChange={(e) => handleInputChange('titular', 'nascimento', e.target.value)} />
                                <div className="sm:col-span-2"><InputField label="E-mail" value={contractData.titular.email} onChange={(e) => handleInputChange('titular', 'email', e.target.value)} /></div>
                                <InputField label="Tel. Residencial Fixo" value={contractData.titular.telefoneFixo} onChange={(e) => handleInputChange('titular', 'telefoneFixo', e.target.value)} isMono={true} />
                                <div className="sm:col-span-4 print:col-span-4"><InputField label="Nome da Mãe" value={contractData.titular.nomeMae} onChange={(e) => handleInputChange('titular', 'nomeMae', e.target.value)} /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-6 print:grid-cols-6 gap-3 print:gap-2">
                                <div className="sm:col-span-1 print:col-span-1"><InputField label="CEP" value={contractData.endereco.cep} onChange={handleCepChange} isMono={true} /></div>
                                <div className="sm:col-span-4 print:col-span-4"><InputField label="Logradouro" value={contractData.endereco.logradouro} onChange={(e) => handleInputChange('endereco', 'logradouro', e.target.value)} /></div>
                                <div className="sm:col-span-1 print:col-span-1"><InputField label="Número" value={contractData.endereco.numero} onChange={(e) => handleInputChange('endereco', 'numero', e.target.value)} /></div>
                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Complemento" value={contractData.endereco.complemento} onChange={(e) => handleInputChange('endereco', 'complemento', e.target.value)} /></div>
                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Bairro" value={contractData.endereco.bairro} onChange={(e) => handleInputChange('endereco', 'bairro', e.target.value)} /></div>
                                <div className="sm:col-span-1 print:col-span-1"><InputField label="Cidade" value={contractData.endereco.cidade} onChange={(e) => handleInputChange('endereco', 'cidade', e.target.value)} /></div>
                                <div className="sm:col-span-1 print:col-span-1"><InputField label="UF" value={contractData.endereco.uf} onChange={(e) => handleInputChange('endereco', 'uf', e.target.value)} /></div>
                            </div>
                        </section>

                        {/* SEÇÃO 03 */}
                        <section className="print:break-inside-avoid print:mt-2">
                            <SectionHeader number="03" title="Serviços e produtos escolhidos / Prazo de permanência" />
                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2 bg-neutral-50 dark:bg-neutral-800/20 print:bg-transparent p-4 print:p-0 rounded-xl">
                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Plano de Serviço" value={contractData.planoPrincipal.planoServico} onChange={(e) => handleInputChange('planoPrincipal', 'planoServico', e.target.value)} /></div>
                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Promoção Aplicada" value={contractData.planoPrincipal.promocao} onChange={(e) => handleInputChange('planoPrincipal', 'promocao', e.target.value)} /></div>
                                <div className="sm:col-span-4 print:col-span-4"><InputField label="Pacotes / Serviços (1 a 5)" value={contractData.planoPrincipal.pacotes} onChange={(e) => handleInputChange('planoPrincipal', 'pacotes', e.target.value)} /></div>
                                
                                <div className="sm:col-span-2 print:col-span-2"><InputField label="N° do Claro Chip (SIM CARD)" value={contractData.planoPrincipal.simCard} onChange={(e) => handleInputChange('planoPrincipal', 'simCard', e.target.value)} isMono={true} /></div>
                                <InputField label="N° Celular" value={contractData.planoPrincipal.celular} onChange={(e) => handleInputChange('planoPrincipal', 'celular', e.target.value)} isMono={true} />
                                <InputField label="N° Celular Provisório" value={contractData.planoPrincipal.celularProvisorio} onChange={(e) => handleInputChange('planoPrincipal', 'celularProvisorio', e.target.value)} isMono={true} />
                                
                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Marca / Modelo Aparelho" value={contractData.planoPrincipal.marcaModeloAparelho} onChange={(e) => handleInputChange('planoPrincipal', 'marcaModeloAparelho', e.target.value)} /></div>
                                <div className="sm:col-span-2 print:col-span-2"><InputField label="N° de Série Aparelho (IMEI)" value={contractData.planoPrincipal.imeiAparelho} onChange={(e) => handleInputChange('planoPrincipal', 'imeiAparelho', e.target.value)} isMono={true} /></div>
                                
                                <InputField label="Valor Inicial Aparelho (R$)" value={contractData.planoPrincipal.valorInicialAparelho} onChange={(e) => handleInputChange('planoPrincipal', 'valorInicialAparelho', e.target.value)} />
                                <InputField label="Desc. Benefício Comercial (R$)" value={contractData.planoPrincipal.descontoComercial} onChange={(e) => handleInputChange('planoPrincipal', 'descontoComercial', e.target.value)} />
                                <InputField label="Desc. Claro Clube (R$)" value={contractData.planoPrincipal.descontoClaroClube} onChange={(e) => handleInputChange('planoPrincipal', 'descontoClaroClube', e.target.value)} />
                                <InputField label="Valor Final Aparelho (R$)" value={contractData.planoPrincipal.valorFinalAparelho} onChange={(e) => handleInputChange('planoPrincipal', 'valorFinalAparelho', e.target.value)} />
                                
                                <InputField label="Permanência" value={contractData.planoPrincipal.permanencia} onChange={(e) => handleInputChange('planoPrincipal', 'permanencia', e.target.value)} />
                                <InputField label="Multa de Quebra (R$)" value={contractData.planoPrincipal.multa} onChange={(e) => handleInputChange('planoPrincipal', 'multa', e.target.value)} />
                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Mensalidade do Plano (R$)" value={contractData.planoPrincipal.mensalidade} onChange={(e) => handleInputChange('planoPrincipal', 'mensalidade', e.target.value)} /></div>
                            </div>
                        </section>

                        {/* SEÇÃO 04 */}
                        <section className="print:mt-2">
                            <SectionHeader number="04" title="Linhas Adicionais (Multi-Linhas 1 a 5)" />
                            <div className="space-y-4 print:space-y-2">
                                {contractData.dependentes.map((dep, idx) => (
                                    <div key={idx} className={`border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 print:p-2 bg-white dark:bg-neutral-900 print:bg-transparent transition-opacity ${!dep.incluir ? 'opacity-60 print:hidden' : 'print:break-inside-avoid'}`}>
                                        <div className="flex justify-between items-center mb-3 print:mb-1">
                                            <h3 className="text-sm print:text-[10px] font-black uppercase text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                                <input type="checkbox" checked={dep.incluir} onChange={(e) => handleDependenteChange(idx, 'incluir', e.target.checked)} className="w-4 h-4 rounded text-[#E3000F] print:hidden" /> 
                                                Linha Adicional {idx + 1}
                                            </h3>
                                        </div>
                                        {dep.incluir && (
                                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-1.5">
                                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Plano de Serviço" value={dep.planoServico} onChange={(e) => handleDependenteChange(idx, 'planoServico', e.target.value)} /></div>
                                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Promoção Aplicada" value={dep.promocao} onChange={(e) => handleDependenteChange(idx, 'promocao', e.target.value)} /></div>
                                                <div className="sm:col-span-4 print:col-span-4"><InputField label="Pacotes / Serviços (1 a 5)" value={dep.pacotes} onChange={(e) => handleDependenteChange(idx, 'pacotes', e.target.value)} /></div>
                                                
                                                <div className="sm:col-span-2 print:col-span-2"><InputField label="N° do Claro Chip" value={dep.simCard} onChange={(e) => handleDependenteChange(idx, 'simCard', e.target.value)} isMono={true} /></div>
                                                <InputField label="N° Celular" value={dep.celular} onChange={(e) => handleDependenteChange(idx, 'celular', e.target.value)} isMono={true} />
                                                <InputField label="N° Celular Provisório" value={dep.celularProvisorio} onChange={(e) => handleDependenteChange(idx, 'celularProvisorio', e.target.value)} isMono={true} />
                                                
                                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Marca / Modelo Aparelho" value={dep.marcaModeloAparelho} onChange={(e) => handleDependenteChange(idx, 'marcaModeloAparelho', e.target.value)} /></div>
                                                <div className="sm:col-span-2 print:col-span-2"><InputField label="IMEI Aparelho" value={dep.imeiAparelho} onChange={(e) => handleDependenteChange(idx, 'imeiAparelho', e.target.value)} isMono={true} /></div>
                                                
                                                <InputField label="Valor Inicial Aparelho (R$)" value={dep.valorInicialAparelho} onChange={(e) => handleDependenteChange(idx, 'valorInicialAparelho', e.target.value)} />
                                                <InputField label="Valor Final Aparelho (R$)" value={dep.valorFinalAparelho} onChange={(e) => handleDependenteChange(idx, 'valorFinalAparelho', e.target.value)} />
                                                
                                                <InputField label="Permanência" value={dep.permanencia} onChange={(e) => handleDependenteChange(idx, 'permanencia', e.target.value)} />
                                                <InputField label="Multa (R$)" value={dep.multa} onChange={(e) => handleDependenteChange(idx, 'multa', e.target.value)} />
                                                <div className="sm:col-span-4 print:col-span-4"><InputField label="Mensalidade do Dependente (R$)" value={dep.mensalidade} onChange={(e) => handleDependenteChange(idx, 'mensalidade', e.target.value)} /></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* SEÇÃO 05 */}
                        <section className="print:mt-2 print:break-before-page">
                            <SectionHeader number="05" title="Serviços Residenciais (TV, Internet e Fixo)" />
                            <div className={`border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 print:p-2 bg-white dark:bg-neutral-900 print:bg-transparent transition-opacity ${!contractData.residencial.incluir ? 'opacity-60 print:hidden' : 'print:break-inside-avoid'}`}>
                                <div className="flex justify-between items-center mb-4 print:mb-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                                    <h3 className="text-sm print:text-[10px] font-black uppercase text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                        <input type="checkbox" checked={contractData.residencial.incluir} onChange={(e) => handleInputChange('residencial', 'incluir', e.target.checked)} className="w-4 h-4 rounded text-[#E3000F] print:hidden" /> 
                                        Adicionar Pacote Residencial
                                    </h3>
                                </div>
                                
                                {contractData.residencial.incluir && (
                                    <div className="space-y-6 print:space-y-4">
                                        {/* TV */}
                                        <div>
                                            <h4 className="text-xs font-bold text-[#E3000F] uppercase mb-2">Plano de TV</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-1.5">
                                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Produto Plano de TV" value={contractData.residencial.tv.plano} onChange={(e) => handleResidencialChange('tv', 'plano', e.target.value)} /></div>
                                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Tecnologia" value={contractData.residencial.tv.tecnologia} onChange={(e) => handleResidencialChange('tv', 'tecnologia', e.target.value)} /></div>
                                                
                                                <InputField label="Mensalidade (R$)" value={contractData.residencial.tv.mensalidade} onChange={(e) => handleResidencialChange('tv', 'mensalidade', e.target.value)} />
                                                <InputField label="Valor Promocional (R$)" value={contractData.residencial.tv.promocional} onChange={(e) => handleResidencialChange('tv', 'promocional', e.target.value)} />
                                                <InputField label="Período Promocional" value={contractData.residencial.tv.periodoPromocional} onChange={(e) => handleResidencialChange('tv', 'periodoPromocional', e.target.value)} />
                                                <InputField label="Taxa de Adesão (R$)" value={contractData.residencial.tv.adesao} onChange={(e) => handleResidencialChange('tv', 'adesao', e.target.value)} />
                                                
                                                <InputField label="Quant. Pontos Opcionais" value={contractData.residencial.tv.pontosOpcionais} onChange={(e) => handleResidencialChange('tv', 'pontosOpcionais', e.target.value)} type="number" />
                                                <InputField label="Tecn. do PO (Dig/HD/4K)" value={contractData.residencial.tv.tecnologiaPO} onChange={(e) => handleResidencialChange('tv', 'tecnologiaPO', e.target.value)} />
                                                <InputField label="Valor Total PO (R$)" value={contractData.residencial.tv.valorPO} onChange={(e) => handleResidencialChange('tv', 'valorPO', e.target.value)} />
                                                <InputField label="Adesão PO (R$)" value={contractData.residencial.tv.adesaoPO} onChange={(e) => handleResidencialChange('tv', 'adesaoPO', e.target.value)} />
                                                
                                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Degustação de Produtos" value={contractData.residencial.tv.degustacao} onChange={(e) => handleResidencialChange('tv', 'degustacao', e.target.value)} /></div>
                                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Produtos Agregados" value={contractData.residencial.tv.agregados} onChange={(e) => handleResidencialChange('tv', 'agregados', e.target.value)} placeholder="Ex. A la Carte, Monet" /></div>
                                            </div>
                                        </div>

                                        <div className="border-t border-neutral-100 dark:border-neutral-800"></div>

                                        {/* INTERNET */}
                                        <div>
                                            <h4 className="text-xs font-bold text-[#E3000F] uppercase mb-2">Plano de Internet</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-1.5">
                                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Produto Plano de Internet" value={contractData.residencial.internet.plano} onChange={(e) => handleResidencialChange('internet', 'plano', e.target.value)} /></div>
                                                <SelectField label="IP Fixo" value={contractData.residencial.internet.ipFixo} onChange={(e) => handleResidencialChange('internet', 'ipFixo', e.target.value)} options={['SIM', 'NÃO']} />
                                                <SelectField label="Adquiriu Modem" value={contractData.residencial.internet.modem} onChange={(e) => handleResidencialChange('internet', 'modem', e.target.value)} options={['SIM', 'NÃO']} />
                                                
                                                <InputField label="Mensalidade (R$)" value={contractData.residencial.internet.mensalidade} onChange={(e) => handleResidencialChange('internet', 'mensalidade', e.target.value)} />
                                                <InputField label="Valor Promocional (R$)" value={contractData.residencial.internet.promocional} onChange={(e) => handleResidencialChange('internet', 'promocional', e.target.value)} />
                                                <InputField label="Período Promocional" value={contractData.residencial.internet.periodoPromocional} onChange={(e) => handleResidencialChange('internet', 'periodoPromocional', e.target.value)} />
                                                <InputField label="Taxa de Adesão (R$)" value={contractData.residencial.internet.adesao} onChange={(e) => handleResidencialChange('internet', 'adesao', e.target.value)} />
                                                
                                                <InputField label="Valor Aparelho (R$)" value={contractData.residencial.internet.valorModem} onChange={(e) => handleResidencialChange('internet', 'valorModem', e.target.value)} />
                                                <InputField label="Franquia de Consumo" value={contractData.residencial.internet.franquia} onChange={(e) => handleResidencialChange('internet', 'franquia', e.target.value)} />
                                                <InputField label="Velocidade Download" value={contractData.residencial.internet.download} onChange={(e) => handleResidencialChange('internet', 'download', e.target.value)} />
                                                <InputField label="Velocidade Upload" value={contractData.residencial.internet.upload} onChange={(e) => handleResidencialChange('internet', 'upload', e.target.value)} />
                                                
                                                <InputField label="Ponto ULTRA" value={contractData.residencial.internet.pontoUltra} onChange={(e) => handleResidencialChange('internet', 'pontoUltra', e.target.value)} />
                                                <InputField label="Adesão Ponto ULTRA (R$)" value={contractData.residencial.internet.pontoUltraAdesao} onChange={(e) => handleResidencialChange('internet', 'pontoUltraAdesao', e.target.value)} />
                                                <SelectField label="Quantidade Ponto ULTRA" value={contractData.residencial.internet.pontoUltraQtd} onChange={(e) => handleResidencialChange('internet', 'pontoUltraQtd', e.target.value)} options={['1', '2', '3', '4']} />
                                                <div></div>

                                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Produtos Agregados/SVA" value={contractData.residencial.internet.sva} onChange={(e) => handleResidencialChange('internet', 'sva', e.target.value)} /></div>
                                                <InputField label="Qtd SVA" value={contractData.residencial.internet.svaQtd} onChange={(e) => handleResidencialChange('internet', 'svaQtd', e.target.value)} type="number" />
                                                <InputField label="Valor SVA (R$)" value={contractData.residencial.internet.svaValor} onChange={(e) => handleResidencialChange('internet', 'svaValor', e.target.value)} />
                                            </div>
                                        </div>

                                        <div className="border-t border-neutral-100 dark:border-neutral-800"></div>

                                        {/* TELEFONE FIXO */}
                                        <div>
                                            <h4 className="text-xs font-bold text-[#E3000F] uppercase mb-2">Plano de Telefone Fixo</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-1.5">
                                                <div className="sm:col-span-4 print:col-span-4"><InputField label="Produto Plano de Telefone Fixo" value={contractData.residencial.fixo.plano} onChange={(e) => handleResidencialChange('fixo', 'plano', e.target.value)} /></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* SEÇÃO 06 */}
                        <section className="print:break-inside-avoid print:mt-2">
                            <SectionHeader number="06" title="Informações de Pagamento" />
                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2 bg-neutral-50 dark:bg-neutral-800/20 print:bg-transparent p-4 print:p-0 rounded-xl">
                                <InputField label="Valor Total Serviços (R$)" value={contractData.financeiro.valorTotalServicos} readOnly />
                                <InputField label="Desconto (R$)" value={contractData.financeiro.desconto} onChange={(e) => handleInputChange('financeiro', 'desconto', e.target.value)} />
                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Valor Total c/ Desconto (R$)" value={contractData.financeiro.valorTotalComDesconto} readOnly /></div>
                                
                                <InputField label="Valor Total Aparelho/Chip (R$)" value={contractData.financeiro.valorAparelhoChip} onChange={(e) => handleInputChange('financeiro', 'valorAparelhoChip', e.target.value)} />
                                <SelectField label="Forma Pagamento Aparelho" value={contractData.financeiro.formaPagamentoAparelho} onChange={(e) => handleInputChange('financeiro', 'formaPagamentoAparelho', e.target.value)} options={['CARTÃO DE CRÉDITO', 'CARTÃO DE DÉBITO', 'DINHEIRO', 'PIX']} />
                                <InputField label="Parcelamento (Em X Vezes)" type="number" value={contractData.financeiro.parcelamentoAparelhoVezes} onChange={(e) => handleInputChange('financeiro', 'parcelamentoAparelhoVezes', e.target.value)} />
                                <InputField label="Valor da Parcela (R$)" value={contractData.financeiro.parcelamentoAparelhoValor} onChange={(e) => handleInputChange('financeiro', 'parcelamentoAparelhoValor', e.target.value)} />
                                
                                <SelectField label="Forma Pagamento Conta" value={contractData.financeiro.formaPagamentoConta} onChange={(e) => handleInputChange('financeiro', 'formaPagamentoConta', e.target.value)} options={['BOLETO', 'DÉBITO AUTOMÁTICO', 'CARTÃO DE CRÉDITO']} />
                                <SelectField label="Forma Recebimento Conta" value={contractData.financeiro.formaRecebimentoConta} onChange={(e) => handleInputChange('financeiro', 'formaRecebimentoConta', e.target.value)} options={['E-MAIL', 'CORREIOS', 'SMS']} />
                                <div className="sm:col-span-2 print:col-span-2"><InputField label="Data de Vencimento" type="number" value={contractData.financeiro.vencimento} onChange={(e) => handleInputChange('financeiro', 'vencimento', e.target.value)} /></div>

                                <InputField label="Banco (Débito Aut.)" value={contractData.financeiro.banco} onChange={(e) => handleInputChange('financeiro', 'banco', e.target.value)} />
                                <InputField label="N° Banco" value={contractData.financeiro.numBanco} onChange={(e) => handleInputChange('financeiro', 'numBanco', e.target.value)} isMono={true} />
                                <InputField label="Agência" value={contractData.financeiro.agencia} onChange={(e) => handleInputChange('financeiro', 'agencia', e.target.value)} isMono={true} />
                                <InputField label="Conta" value={contractData.financeiro.conta} onChange={(e) => handleInputChange('financeiro', 'conta', e.target.value)} isMono={true} />
                            </div>
                        </section>

                        {/* SEÇÃO 07 */}
                        <section className="print:break-inside-avoid print:mt-2">
                            <SectionHeader number="07" title="Claro Clube" />
                            <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-3 print:gap-2">
                                <InputField label="Saldo de Pontos" type="number" value={contractData.claroClube.saldoAtual} onChange={(e) => handleInputChange('claroClube', 'saldoAtual', e.target.value)} />
                                <InputField label="Pontos Utilizados nesta Data" type="number" value={contractData.claroClube.pontosUtilizados} onChange={(e) => handleInputChange('claroClube', 'pontosUtilizados', e.target.value)} />
                                <InputField label="Saldo Restante de Pontos" type="number" value={contractData.claroClube.saldoRestante} onChange={(e) => handleInputChange('claroClube', 'saldoRestante', e.target.value)} />
                            </div>
                        </section>

                        {/* SEÇÃO 08 */}
                        <section className="print:break-inside-avoid print:mt-2">
                            <SectionHeader number="08" title="Resumo da Venda" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/20 print:bg-transparent p-4 print:p-0 rounded-xl border border-neutral-200 dark:border-neutral-800 print:border-none">
                                <div className="space-y-2 mb-3">
                                    {contractData.planoPrincipal.planoServico && (
                                        <div className="flex justify-between items-center text-sm print:text-xs">
                                            <span className="font-bold text-neutral-700 dark:text-neutral-300 print:text-black">📱 {contractData.planoPrincipal.planoServico}</span>
                                            <span className="font-black text-neutral-900 dark:text-white print:text-black">{contractData.planoPrincipal.mensalidade || 'R$ 0,00'}</span>
                                        </div>
                                    )}
                                    {contractData.dependentes.map((dep, idx) => dep.incluir && dep.planoServico && (
                                        <div key={idx} className="flex justify-between items-center text-sm print:text-xs">
                                            <span className="font-bold text-neutral-700 dark:text-neutral-300 print:text-black">👥 {dep.planoServico}</span>
                                            <span className="font-black text-neutral-900 dark:text-white print:text-black">{dep.mensalidade || 'R$ 0,00'}</span>
                                        </div>
                                    ))}
                                    {contractData.residencial.incluir && contractData.residencial.internet.plano && (
                                        <div className="flex justify-between items-center text-sm print:text-xs">
                                            <span className="font-bold text-neutral-700 dark:text-neutral-300 print:text-black">🌐 {contractData.residencial.internet.plano}</span>
                                            <span className="font-black text-neutral-900 dark:text-white print:text-black">{contractData.residencial.internet.mensalidade || 'R$ 0,00'}</span>
                                        </div>
                                    )}
                                    {contractData.residencial.incluir && contractData.residencial.tv.plano && (
                                        <div className="flex justify-between items-center text-sm print:text-xs">
                                            <span className="font-bold text-neutral-700 dark:text-neutral-300 print:text-black">📺 {contractData.residencial.tv.plano}</span>
                                            <span className="font-black text-neutral-900 dark:text-white print:text-black">{contractData.residencial.tv.mensalidade || 'R$ 0,00'}</span>
                                        </div>
                                    )}
                                    {contractData.residencial.incluir && parseCurrencyToFloat(String(contractData.residencial.tv.valorPO || '0')) > 0 && (
                                        <div className="flex justify-between items-center text-sm print:text-xs">
                                            <span className="font-bold text-neutral-700 dark:text-neutral-300 print:text-black">📺 Pontos Opcionais TV ({contractData.residencial.tv.pontosOpcionais || 1}x)</span>
                                            <span className="font-black text-neutral-900 dark:text-white print:text-black">{contractData.residencial.tv.valorPO}</span>
                                        </div>
                                    )}
                                    {contractData.residencial.incluir && contractData.residencial.fixo.plano && (
                                        <div className="flex justify-between items-center text-sm print:text-xs">
                                            <span className="font-bold text-neutral-700 dark:text-neutral-300 print:text-black">📞 {contractData.residencial.fixo.plano}</span>
                                            <span className="font-black text-neutral-900 dark:text-white print:text-black">-</span>
                                        </div>
                                    )}
                                    {contractData.residencial.incluir && parseCurrencyToFloat(String(contractData.residencial.internet.svaValor || '0')) > 0 && (
                                        <div className="flex justify-between items-center text-sm print:text-xs">
                                            <span className="font-bold text-neutral-700 dark:text-neutral-300 print:text-black">🌐 {contractData.residencial.internet.sva || 'SVA Internet'} ({contractData.residencial.internet.svaQtd || 1}x)</span>
                                            <span className="font-black text-neutral-900 dark:text-white print:text-black">{contractData.residencial.internet.svaValor}</span>
                                        </div>
                                    )}
                                    {contractData.residencial.incluir && contractData.residencial.internet.pontoUltra && (
                                        <div className="flex justify-between items-center text-sm print:text-xs">
                                            <span className="font-bold text-neutral-700 dark:text-neutral-300 print:text-black">📶 Ponto ULTRA: {contractData.residencial.internet.pontoUltra} ({contractData.residencial.internet.pontoUltraQtd || 1}x)</span>
                                            <span className="font-black text-neutral-500 dark:text-neutral-400 print:text-neutral-600 text-[10px] uppercase font-bold tracking-wider pt-0.5">Adesão: {contractData.residencial.internet.pontoUltraAdesao || 'R$ 0,00'}</span>
                                        </div>
                                    )}
                                    {contractData.financeiro.desconto && parseCurrencyToFloat(String(contractData.financeiro.desconto)) > 0 && (
                                        <div className="flex justify-between items-center text-sm print:text-xs text-green-600 dark:text-green-500">
                                            <span className="font-bold">Descontos Aplicados</span>
                                            <span className="font-black">-{contractData.financeiro.desconto}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center text-base print:text-sm">
                                    <span className="font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-100 print:text-black">Total Mensalidade: (SERVIÇOS & PRODUTOS)</span>
                                    <span className="font-black text-[#E3000F] text-lg print:text-base">{contractData.financeiro.valorTotalComDesconto || 'R$ 0,00'}</span>
                                </div>
                            </div>
                        </section>

                        {/* SEÇÃO 09 */}
                        <section className="print:mt-0 print:pt-6 print:break-before-page print:min-h-[270mm] print:flex print:flex-col">
                            <SectionHeader number="09" title="Declaração, Localidade e Assinatura do Assinante" />
                            
                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2 mb-4 print:mb-2 no-print">
                                <SelectField label="(Compartilhamento de Dados)" value={contractData.declaracao.optInPrivacidade} onChange={(e) => handleInputChange('declaracao', 'optInPrivacidade', e.target.value)} options={['SIM', 'NÃO']} />
                                <SelectField label="(Receber Publicidade)" value={contractData.declaracao.optInPublicidade} onChange={(e) => handleInputChange('declaracao', 'optInPublicidade', e.target.value)} options={['SIM', 'NÃO']} />
                                <InputField label="Loja Propria/Agente Autorizado" value={contractData.declaracao.localEmissao} onChange={(e) => handleInputChange('declaracao', 'localEmissao', e.target.value)} />
                                <InputField label="Data da Venda" value={contractData.declaracao.dataEmissao} onChange={(e) => handleInputChange('declaracao', 'dataEmissao', e.target.value)} />
                            </div>
                            
                            {/* DECLARAÇÃO DO ASSINANTE */}
                            <div className="bg-neutral-50 dark:bg-neutral-900/50 print:bg-transparent border border-neutral-200 dark:border-neutral-800 print:border-none p-5 print:p-0 rounded-xl text-[10px] print:text-[11px] text-neutral-600 dark:text-neutral-400 print:text-black leading-relaxed mb-8 print:mb-6 text-justify print:leading-snug print:flex-1 print:flex print:flex-col print:justify-between h-auto">
                                <div>
                                    <p className="font-bold text-sm print:text-sm text-center mb-3 uppercase text-neutral-900 dark:text-white print:text-black">Declaração do Assinante</p>
                                    <p>Declaro, para os devidos fins e efeitos de direito, que:</p>
                                    <p>Recebi previamente, li e concordei com todas as disposições dos documentos a seguir relacionados, reconhecendo que estes integram o contrato firmado:</p>
                                    <p className="print:ml-4">
                                        (a) Contrato de Prestação do Serviço Móvel Pessoal na modalidade Pós-Pago;<br />
                                        (b) Contrato de Permanência, caso tenha aderido;<br />
                                        (c) Sumário e Termo e Condições de Uso dos Planos de Serviço contratados;<br />
                                        (d) Regulamento de Promoções aplicáveis ao Plano de Serviço na data de contratação;<br />
                                        (e) Termos e Condições de Uso de outros serviços da CLARO ou de terceiros contratados e/ou integrantes das ofertas a que aderi;
                                    </p>
                                    <p className="mt-1.5">Concordei em receber os instrumentos mencionados acima no e-mail supra informado, tendo ciência de que poderei recebê-los impressos no momento da contratação, caso solicite as impressões;<br />
                                        Os dados cadastrais informados são verdadeiros e serão mantidos atualizados junto a CLARO;<br />
                                        Autorizei a consulta a órgãos restritivos de crédito e instituições assemelhadas;<br />
                                        Me foram apresentadas todas as opções de Planos de Serviço disponíveis, incluindo o Plano Básico e a escolha do Plano foi realizada por livre e espontânea vontade.<br />
                                        Antes de aderir a este Plano, Oferta ou Promoção, consultei as tecnologias disponíveis para a localidade que intenciono usufruir dos serviços e o mapa de cobertura dos serviços Claro em https://www.claro.com.br/mapa-de-cobertura.</p>
                                    
                                    <p className="mt-1.5">Tenho conhecimento, entendi e estou de acordo com as seguintes condições detalhadas nos documentos integrantes dos contratos acima mencionados:</p>
                                    <p className="print:ml-4">
                                        (a) Valores Vigentes e Promocionais com e sem permanência mínima de 12 (doze) meses, regras de reajuste, vigência, funcionamento da portabilidade numérica, condições para transferência de titularidade de linha, serviços adicionais integrantes da oferta e contratados a parte, possibilidade ou não de inclusão de dependentes e hipóteses de encerramento/alteração de oferta;<br />
                                        (b) Nenhuma oferta promocional da CLARO, ainda que realizada posteriormente por qualquer canal de venda, terá duração superior a 12 (doze) meses, podendo a CLARO retomar, ao final do prazo promocional, os valores vigentes praticados;<br />
                                        (c) Serviços integrantes das franquias e da oferta e restrições de utilização, regras de mau uso e uso indevido, bem como as hipóteses de cobrança de excedente e/ou bloqueio de serviços após término da franquia;<br />
                                        (d) A escolha do Código de Seleção da Prestadora (CSP) para a realização de ligações longa distância nacional (LDN) ou internacional (LDI) é do Cliente e serão aplicadas as tarifas da Operadora escolhida com faturamento na linha móvel da CLARO. Na franquia do Plano, se houver, as ligações LDN deverão obrigatoriamente ser realizadas com o CSP 21, sob pena de cobrança excedente;<br />
                                        (e) os serviços utilizados em roaming nacional ou internacional serão cobrados separadamente, caso não estejam contemplados no Plano contratado;<br />
                                        (f) Autorizei a cobrança na fatura da CLARO de forma avulsa, conjunta ou na forma de combos de todos os serviços, aplicativos digitais, conteúdos, pacotes, dentre outros contratados junto a CLARO e/ou de terceiros com co-faturamento pela CLARO;<br />
                                        (g) A opção da Fatura Digital Total passará a vigorar após a validação do e-mail informado no ato da ativação;<br />
                                        (h) O Cliente é responsável por adquirir, a seu custo, o equipamento utilizado para acesso aos serviços contratados (tais como aparelho e chip), bem como pela compatibilidade e configurações deste. Declarando, ainda, ter conhecimento de que determinados aparelhos, por opção de seu fabricante, são comercializados sem acessórios, tais como, carregador (fonte e/ou cabo de alimentação) e/ou fones de ouvido.<br />
                                        (i) Na hipótese de cancelamento ou alteração das condições contratadas, o ASSINANTE não poderá se desobrigar do pagamento da multa contratual prevista acima;<br />
                                        (j) A CLARO poderá usar a biometria facial ou impressão digital para garantir a proteção do Assinante, a segurança e controle nos processos de identificação e autenticação de cadastros;<br />
                                        (l) Estou ciente sobre a funcionalidade do MINHA CLARO MÓVEL, onde terei acesso a consumo e detalhes do plano, detalhes de faturas, 2ª via de fatura com código de barras, suporte técnico para meu aparelho, meios de pagamento, renegociação e outros;<br />
                                        (m) Na adesão a Oferta Combo Multi elegível, o ASSINANTE terá direito a dependentes sem custo adicional, conforme a seguir:<br />
                                        &nbsp;&nbsp;&nbsp;&nbsp;(i) Claro pós combo 50GB + 50GB Multi - 01 dependente sem custo adicional;<br />
                                        &nbsp;&nbsp;&nbsp;&nbsp;(ii) Claro pós combo 75GB + 75GB Multi - 02 dependentes sem custo adicional;<br />
                                        &nbsp;&nbsp;&nbsp;&nbsp;(iii) Claro pós combo 150GB + 150GB Multi - 03 dependentes sem custo adicional.
                                    </p>
                                    
                                    <p className="mt-1.5">O valor de cada dependente promocional da oferta acima será mensalmente abatido do valor desse contrato diretamente na fatura do ASSINANTE, enquanto mantida a oferta Combo Multi, conforme disposto no Regulamento da Oferta. Valores correspondentes a contratações de serviços e funcionalidades adicionais para dependentes ou uso de excedente gerados por estes serão cobrados normalmente e não estão inclusos na oferta de isenção de mensalidade acima especificada.</p>
                                </div>

                                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                    <p className="font-bold text-sm print:text-sm text-center mb-2 uppercase text-neutral-900 dark:text-white print:text-black">INFORMAÇÕES IMPORTANTES</p>
                                    <p>O Cliente adere ao Contrato do produto selecionado neste Termo de Adesão, e declara, sob as penas da lei, que:</p>
                                    <p className="print:ml-4">
                                        a) seus dados cadastrais são verdadeiros e que se compromete a atualizá-las periodicamente, autorizando a CLARO a verificá-los junto aos órgãos restritivos de crédito e instituições assemelhadas;<br />
                                        b) conhece as condições do Plano de Serviço, Promoções e/ou Pacotes ora contratados;<br />
                                        c) tem conhecimento que o valor da habilitação poderá ser cobrado conforme as condições promocionais apresentadas neste momento;<br />
                                        c) tem conhecimento que este instrumento integra (i) o Contrato de Prestação de Serviço de Tv Por Assinatura (SeAC), (iv) o Contrato de Permanência, (v) o Regulamento do Plano de Serviço e (iv) o(s) Regulamento(s) da Promoção, se aplicáveis, e concorda em receber estes instrumentos no e-mail acima informado, mas, caso queira recebê-los impressos no momento da contratação, basta solicitar as impressões;<br />
                                        d) tem conhecimento que, na hipótese de cancelamento ou alteração das condições contratadas, o Cliente não poderá se desobrigar do pagamento da multa contratual prevista no Contrato de Permanência;<br />
                                        e) a opção da Fatura Digital Total passará a vigorar após a validação do e-mail informado no ato da ativação;<br />
                                        f) Autorizo a CLARO a lançar no documento de cobrança, de forma avulsa e/ou em combos e/ou ofertas conjuntas de serviços de telecomunicações, quando aplicável, os valores relacionados aos Serviços de Valor Adicionado, Aplicativos / Conteúdos Digitais, serviços suplementares, facilidades adicionais e/ou outros serviços contratados, prestados pela CLARO e/ou por terceiros;<br />
                                        g) Estou ciente sobre a funcionalidade do MINHA CLARO RESIDENCIAL, onde através deste aplicativo poderei gerar a 2ª via de fatura, agendar visita técnica (acompanhando quem será o técnico que irá atender e onde ele está), alteração de rede/senha do Wi-Fi e consultar o Contrato de Permanência dos serviços contratados, entre outros;
                                    </p>
                                </div>

                                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                    <p className="font-bold uppercase text-neutral-900 dark:text-white print:text-black mb-2 text-center text-sm print:text-sm">AUTORIZAÇÕES DE PRIVACIDADE E PUBLICIDADE</p>
                                    
                                    <p className="text-neutral-800 dark:text-neutral-200 print:text-black font-bold mb-1">
                                        ESTOU CIENTE SOBRE O FORNECIMENTO PARA TERCEIROS DOS MEUS DADOS CADASTRAIS E/OU PESSOAIS, INCLUSIVE AS INFORMAÇÕES DE CONSUMO E REGISTRO DE COMPORTAMENTO DE UTILIZAÇÃO/NAVEGAÇÃO, NOS TERMOS DA LEI EM VIGOR E A POLÍTICA DE PRIVACIDADE DA CLARO DISPONÍVEL EM https://www.claro.com.br/privacidade/politica-de-privacidade?
                                    </p>
                                    <div className="flex gap-6 font-bold uppercase mb-2 text-neutral-900 dark:text-white print:text-black print:ml-4">
                                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => handleInputChange('declaracao', 'optInPrivacidade', 'SIM')}>
                                            <div className="w-3.5 h-3.5 border border-neutral-400 dark:border-neutral-500 print:border-black rounded-sm flex items-center justify-center">
                                                {contractData.declaracao.optInPrivacidade === 'SIM' && <div className="w-2 h-2 bg-[#E3000F] print:bg-black rounded-sm"></div>}
                                            </div>
                                            SIM
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => handleInputChange('declaracao', 'optInPrivacidade', 'NÃO')}>
                                            <div className="w-3.5 h-3.5 border border-neutral-400 dark:border-neutral-500 print:border-black rounded-sm flex items-center justify-center">
                                                {contractData.declaracao.optInPrivacidade === 'NÃO' && <div className="w-2 h-2 bg-[#E3000F] print:bg-black rounded-sm"></div>}
                                            </div>
                                            NÃO
                                        </label>
                                    </div>

                                    <p className="text-neutral-800 dark:text-neutral-200 print:text-black font-bold mb-1">
                                        h) Autorizo o fornecimento para terceiros dos meus dados cadastrais e/ou pessoais, inclusive as informações de consumo e registro de comportamento de Utilização/navegação, nos termos da lei em vigor SIM / NÃO;<br />
                                        i) ACEITO receber mensagens de cunho publicitário enviadas pela CLARO e/ou seus parceiros para meu aparelho / NÃO ACEITO receber mensagens de cunho publicitário enviadas pela CLARO e/ou seus parceiros para meu aparelho.
                                    </p>
                                    <div className="flex gap-6 font-bold uppercase mb-2 text-neutral-900 dark:text-white print:text-black print:ml-4">
                                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => handleInputChange('declaracao', 'optInPublicidade', 'SIM')}>
                                            <div className="w-3.5 h-3.5 border border-neutral-400 dark:border-neutral-500 print:border-black rounded-sm flex items-center justify-center">
                                                {contractData.declaracao.optInPublicidade === 'SIM' && <div className="w-2 h-2 bg-[#E3000F] print:bg-black rounded-sm"></div>}
                                            </div>
                                            ACEITO
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => handleInputChange('declaracao', 'optInPublicidade', 'NÃO')}>
                                            <div className="w-3.5 h-3.5 border border-neutral-400 dark:border-neutral-500 print:border-black rounded-sm flex items-center justify-center">
                                                {contractData.declaracao.optInPublicidade === 'NÃO' && <div className="w-2 h-2 bg-[#E3000F] print:bg-black rounded-sm"></div>}
                                            </div>
                                            NÃO ACEITO
                                        </label>
                                    </div>
                                </div>
                                
                                <p className="text-center font-bold text-neutral-900 dark:text-white print:text-black mt-2 text-xs print:text-[10px]">Para mais informações: acesse http://www.claro.com.br ou ligue 1052.</p>
                            </div>
                            
                            <div className="hidden print:block mb-6 text-center text-[10px] font-bold">
                                <p>{contractData.declaracao.localEmissao}, {contractData.declaracao.dataEmissao}</p>
                            </div>
                        
                            <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-6 print:gap-4 mt-8 print:mt-auto text-center print:break-inside-avoid">
                                <div className="flex flex-col items-center justify-end">
                                    <div className="w-full border-b border-black dark:border-white mb-2 h-10"></div>
                                    <p className="text-xs print:text-[9px] font-bold uppercase">{contractData.titular.nome || 'ASSINATURA DO CLIENTE'}</p>
                                    <p className="text-[10px] print:text-[8px] text-neutral-500">Titular da Linha</p>
                                </div>
                                <div className="flex flex-col items-center justify-end">
                                    <div className="w-full border-b border-black dark:border-white mb-2 h-10"></div>
                                    <p className="text-xs print:text-[9px] font-bold uppercase">RUBRICA DO CLIENTE</p>
                                    <p className="text-[10px] print:text-[8px] text-neutral-500">Rubrica</p>
                                </div>
                                <div className="flex flex-col items-center justify-end">
                                    <div className="w-full border-b border-black dark:border-white mb-2 h-10"></div>
                                    <p className="text-xs print:text-[9px] font-bold uppercase">{contractData.metadados.vendedorCodigo || 'ASSINATURA DO VENDEDOR'}</p>
                                    <p className="text-[10px] print:text-[8px] text-neutral-500">Consultor Autorizado</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
} 