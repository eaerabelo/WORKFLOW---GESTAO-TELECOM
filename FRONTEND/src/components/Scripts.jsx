import React from 'react';
import { getFirstName, getFirstAndLastName } from '../utils/nameFormatter.js';
import { Copy } from 'lucide-react';
import { getCurrentStoreName } from '../utils/stores.js';
import toast from 'react-hot-toast';

export const Scripts = ({ globalUser, usersDB = {} }) => {
    // Pega o nome do usuário logado e converte para maiúsculas (Fallback para VENDEDOR se não encontrado)
    const userName = globalUser?.name?.toUpperCase() || 'VENDEDOR';
    
    // Busca o Gerente ou Liderança atual no banco de dados da loja
    const gerenteObj = Object.values(usersDB || {}).find(u => u?.role === 'GERENTE') || 
        Object.values(usersDB || {}).find(u => u?.role === 'SENIOR') ||
        Object.values(usersDB || {}).find(u => u?.role === 'ADMINISTRAÇÃO');
                       
    // Formata o nome do Gerente (Pega o 1º e o Último nome para não ficar gigante)
    let gerenteName = 'NÃO INFORMADO';
    if (gerenteObj?.name) {
        const parts = gerenteObj.name.toUpperCase().split(' ');
        gerenteName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
    }

    // Busca o nome da Loja pela variável de ambiente do Render/Vite
    const storeName = getCurrentStoreName();

    // Assinatura padrão configurada de forma dinâmica
    const signature = `${userName} / GERENTE - ${gerenteName} / ${storeName}`;

    const scriptsList = [
        {
            title: 'Migração para Pré-Pago',
            text: `CLIENTE SOLICITA MIGRAÇÃO DESTA LINHA PÓS-PAGO/CONTROLE PARA PRE-PAGA ,\nCLIENTE NÃO CONTEM FIDELIDADE COM ESTA LINHA,\n\n(PRAZO DE 5 DIAS PASSADO AO CLIENTE )\n\n${signature}`
        },
        {
            title: 'Restituição de Linha',
            text: `<<<<<< RESTITUIÇÃO DE LINHA >>>>>>>>\n\nCLIENTE EM LOJA SOLICITA RESTITUIÇÃO DESTA LINHA\n(CLIENTE CIENTE DO PRAZO DE 5 DIAS UTEIS PARA REATIVAÇÃO)\n\n${signature}`
        },
        {
            title: 'Troca de Chip Claro Empresas',
            text: `<<<<<< SOLICITAÇÃO DE TROCA DE CHIP CLARO EMPRESAS >>>>>>>>\n\nCLIENTE SOLICITA TROCA DE CHIP PJ\nICCID :\nESTA LEVANDO , E ENTRARA EM CONTATO COM A CLARO\n\n${signature}`
        },
        {
            title: 'Troca de Controle',
            text: `TROCA DE CONTROLE \n\nCLIENTE SOLICITA TROCA DE CONTROLE REMOTO VIA LOJA PRESENCIAL\n,ESTA LEVANDO OUTRO SEM CUSTO ADICIONAL\n\n${signature}`
        },
        {
            title: 'Devolução de Equipamento',
            text: `DEVOLUÇÃO DE EQUIPAMENTO \n\nCLIENTE EM LOJA PEDE DEVOLUÇÃO DE EQUIPAMENTO\n\nSOL: \nEMTA: \nOS: \n\n${signature}`
        },
        {
            title: 'Cancelamento Proteção Móvel',
            text: `CANCELAMENTO DE PROTEÇÃO MOVEL \n\nCLIENTE EM LOJA ,SOLICITOU CANCELAMENTO POR MOTIVOS DE\nCONTRATAR SERVIÇOS COM OUTRA EMPRESA DE SEGUROS\nCANCELAMENTO REALIZADO COM SUCESSO\n\n${signature}`
        },
        {
            title: 'Devolução c/ Sucesso via APP',
            text: `DEVOLUÇÃO C/SUCESSO VIA APP \n\nCLIENTE EM LOJA REALIZA DEVOLUÇÃO DE EQUIPAMENTO\nDEVOLUÇÃO DE EQUIPAMENTO FEITA COM SUCESSO\n\n${signature}`
        },
        {
            title: 'Leed Retenção',
            text: `<<<<<<<<<<< LEED RETENÇÃO >>>>>>>>>>>>\n\nCLIENTE ENTRA EM CONTATO COM A LOJA E SOLICITA CANCELAMENTO POR MOTIVO DE DIFICULDADE TEMPORARIA\nRETIDO = OFERTADO E ACEITO  MOVEL RENT CONF FID +350MB +  PLANO MOVEL -\nAPLICADO COM SUCESSO.\nCIENTE DE PRO RATA\nOFERTADO DCC\nORIENTADO SOBRE ACESSO E FACILIDADES MINHA NET/MINHACLARO\n\n${signature}`
        },
        {
            title: 'Cancelamento Residencial NET',
            text: `////////////////// CANCELAMENTO RESIDENCIAL NET //////////////////\n\nNAO RETIDO\nNOME DO CLIENTE: \nGRAU DE PARENTESCO (SE TERCEIRO): TITULAR\nMOTIVO DE CANCELAMENTO (DESCREVER MOTIVO E PRODUTO): POUCA UTILIZAÇÃO\nOFERTA INSERIDA (PRAZO, VALORES): CLIENTE SOLICITA FAZER O CANCELAMENTO DE SEU CONTRATO\nPROTOCOLO:  (X )ACEITA  ( )NÃO ACEITA\nOBS: PROTOCOLO ENVIADO POR EMAIL PRAZO DE RECEBIMENTO DE ATÉ 24 HORAS\nINFORMAR VALOR DA PRO RATA: (R$  )\nRENOVAÇÃO DE MULTA: ( ) INFORMADO  (X) NÃO SE APLICA\nENCERRAMENTO DE COBRANÇA: (X ) INFORMADO  ( ) NÃO SE APLICA EM ATÉ 90 DIAS DO NETFONE\nMULTA FIDELIDADE: ( ) INFORMADO  ( X) NÃO SE APLICA:\nDADOS P/ CONTATO A CONFIRMAR: (MELHOR HORÁRIO/ DATA DA OS/\nPROCEDIMENTO DE AGENDAMENTO O.S: (  ) CONFIRMADO  (X) NÃO SE APLICA\n\n${signature}`
        },
        {
            title: 'Cancelamento por Óbito',
            text: `Boa tarde! Caros\n\nPor favor efetuar o cancelamento do contrato abaixo:\n\nContrato: \nCliente: \nCPF: \n\nResponsável pela notificação do óbito:\nNome: \nGRAU PARENTESCO: \nCPF: \n\n${signature}`
        }
    ];

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Script copiado com sucesso!');
    };

    return (
        <div className="h-full flex flex-col animate-fade-in transition-colors">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Scripts e Textos Padrões</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Copie rapidamente os textos pré-montados de observação para colar nos sistemas da Claro.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-4 pr-2">
                {scriptsList.map((script, idx) => (
                    <div key={idx} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:border-[#E3000F]/30 dark:hover:border-[#E3000F]/50 transition-all duration-300 flex flex-col h-full relative group">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide pr-10">{script.title}</h3>
                            <button 
                                onClick={() => handleCopy(script.text)}
                                className="absolute top-4 right-4 p-2 bg-red-50 dark:bg-red-900/20 text-[#E3000F] rounded-lg hover:bg-[#E3000F] hover:text-white transition-colors"
                                title="Copiar texto"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                        <textarea 
                            readOnly 
                            value={script.text} 
                            className="w-full flex-1 min-h-[160px] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-600 dark:text-neutral-400 outline-none resize-none"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};