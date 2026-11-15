import * as XLSX from 'xlsx';
import { parseCurrencyToFloat, getTodaySP } from './masks';

export const parseExcelSales = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (evt) => {
            try {
                const dataBuffer = evt.target.result;
                const wb = XLSX.read(dataBuffer, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { raw: false });

                if (data.length === 0) {
                    return reject(new Error('O arquivo Excel está vazio ou possui um formato inválido.'));
                }

                const newSales = data.map((row, index) => {
                    // Busca Inteligente de Receita
                    const recKeys = Object.keys(row).filter(k => k.toUpperCase().includes('RECEITA') || k.toUpperCase().includes('VALOR') || k.toUpperCase().includes('R$'));
                    const recRaw = recKeys.length > 0 ? row[recKeys[0]] : 0;
                    const receitaVal = typeof recRaw === 'number' ? recRaw : parseCurrencyToFloat(String(recRaw));
                    
                    // Busca Inteligente de Produto
                    const prodKeys = Object.keys(row).filter(k => k.toUpperCase().includes('PRODUTO') || k.toUpperCase().includes('SERVIÇO') || k.toUpperCase().includes('SERVICO') || k.toUpperCase().includes('PLANO'));
                    const rawProd = (prodKeys.length > 0 ? String(row[prodKeys[0]]) : '').toUpperCase();

                    let mappedProd = rawProd;
                    let mappedSubOption = '';
                    let mappedTipoOp = '';

                    // Inteligência de Conversão e Mapeamento de Planilhas Antigas
                    if (rawProd.includes('VIRTUA') || rawProd.includes('BANDA LARGA') || rawProd.includes('FIBRA') || rawProd.includes('NET')) {
                        mappedProd = 'FIBRA';
                        if (receitaVal <= 95) mappedSubOption = '350 MEGA';
                        else if (receitaVal <= 115) mappedSubOption = '500 MEGA';
                        else if (receitaVal <= 145) mappedSubOption = '750 MEGA';
                        else mappedSubOption = '1 GIGA';
                    } else if (rawProd.includes('POS') || rawProd.includes('PÓS')) {
                        if (rawProd.includes('PME') || rawProd.includes('PJ')) {
                            mappedProd = 'PÓS PME';
                        } else if (rawProd.includes('MULTI')) {
                            mappedProd = 'PÓS MULTI';
                        } else if (rawProd.includes('DEP') || rawProd.includes('DEPENDENTE')) {
                            mappedProd = 'DEPENDENTE';
                            mappedSubOption = receitaVal <= 0.1 ? 'GRATUITO' : 'PAGO';
                        } else {
                            mappedProd = 'PÓS';
                        }
                        mappedTipoOp = '';
                    } else if (rawProd.includes('CONTROLE')) {
                        mappedProd = 'CONTROLE';
                        mappedTipoOp = '';
                    } else if (rawProd.includes('TV')) {
                        mappedProd = 'TV-BOX';
                        if (receitaVal <= 75) mappedSubOption = 'APP';
                        else if (receitaVal <= 105) mappedSubOption = 'TV BOX';
                        else mappedSubOption = 'SOUNDBOX';
                    } else if (rawProd.includes('FIXO') || rawProd.includes('TELEFONE')) {
                        mappedProd = 'FIXO';
                        mappedSubOption = 'FIXO MUNDO';
                    } else if (rawProd.includes('APARELHO') || rawProd.includes('SMARTPHONE') || rawProd.includes('CELULAR')) {
                        mappedProd = 'APARELHO';
                    } else if (rawProd.includes('ACESSORIO') || rawProd.includes('ACESSÓRIO')) {
                        mappedProd = 'ACESSORIO';
                    } else if (rawProd.includes('PELICULA') || rawProd.includes('PELÍCULA')) {
                        mappedProd = 'PELICULA';
                    } else if (rawProd.includes('FLEX')) {
                        mappedProd = 'FLEX';
                    } else if (rawProd.includes('PRE') || rawProd.includes('PRÉ')) {
                        mappedProd = 'PRÉ-PAGO';
                    }

                    // Fallback caso a planilha antiga tivesse os parênteses
                    if (!mappedSubOption && mappedProd.includes('(')) {
                        mappedSubOption = mappedProd.split('(')[1].replace(')', '').trim();
                        mappedProd = mappedProd.split(' (')[0].trim();
                    }

                    const finalProduto = mappedSubOption ? `${mappedProd} (${mappedSubOption})` : mappedProd;

                    // Demais buscas flexíveis
                    const vendKeys = Object.keys(row).filter(k => k.toUpperCase().includes('VEND'));
                    const dataKeys = Object.keys(row).filter(k => k.toUpperCase().includes('DATA'));
                    const tipoKeys = Object.keys(row).filter(k => k.toUpperCase() === 'TIPO' || k.toUpperCase().includes('COMBO'));
                    const qtdaKeys = Object.keys(row).filter(k => k.toUpperCase().includes('QTD') || k.toUpperCase().includes('QUANT'));
                    const cpfKeys = Object.keys(row).filter(k => k.toUpperCase().includes('CPF') || k.toUpperCase().includes('CNPJ') || k.toUpperCase().includes('DOC'));
                    const celKeys = Object.keys(row).filter(k => k.toUpperCase().includes('CELULAR') || k.toUpperCase().includes('FONE') || k.toUpperCase().includes('TEL') || k.toUpperCase().includes('NUMERO'));
                    const contKeys = Object.keys(row).filter(k => k.toUpperCase().includes('CONTRATO') || k.toUpperCase().includes('OS'));
                    const addKeys = Object.keys(row).filter(k => k.toUpperCase().includes('ADICION'));

                    let dataVal = dataKeys.length > 0 ? String(row[dataKeys[0]]).trim() : getTodaySP();
                    // Converte data se for serial do excel
                    if (!isNaN(dataVal) && Number(dataVal) > 20000) {
                        const dateObj = new Date((Number(dataVal) - (25567 + 2)) * 86400 * 1000);
                        dataVal = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                    } else if (dataVal.includes('/')) {
                        const parts = dataVal.split('/');
                        if (parts.length === 3) {
                            let day = parts[0]; let month = parts[1]; let year = parts[2].substring(0, 4);
                            if (year.length === 2) year = '20' + year;
                            dataVal = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                        }
                    } else if (dataVal.includes('-')) {
                        const parts = dataVal.split('-');
                        if (parts[0].length === 4) { dataVal = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].substring(0, 2).padStart(2, '0')}`; } 
                        else if (parts[2] && parts[2].length === 4) { dataVal = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`; }
                    }

                    return {
                        id: Date.now() + index,
                        vendedor: vendKeys.length > 0 ? String(row[vendKeys[0]]).trim() : '',
                        data: dataVal,
                        produto: finalProduto,
                        produtoBase: mappedProd,
                        subOption: mappedSubOption,
                        combo: tipoKeys.length > 0 ? String(row[tipoKeys[0]]).trim().toUpperCase() : 'SINGLE',
                        qtda: qtdaKeys.length > 0 ? (Number(row[qtdaKeys[0]]) || 1) : 1,
                        portabilidade: 'NÃO',
                        receita: receitaVal,
                        cpf: cpfKeys.length > 0 ? String(row[cpfKeys[0]]).trim() : '',
                        celular: celKeys.length > 0 ? String(row[celKeys[0]]).trim() : '',
                        contrato: contKeys.length > 0 ? String(row[contKeys[0]]).trim() : '-',
                        mplay: 'NÃO',
                        adicionais: addKeys.length > 0 && row[addKeys[0]] ? String(row[addKeys[0]]).split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [],
                        tipoOperacao: mappedTipoOp 
                    };
                });

                resolve(newSales);
            } catch (error) {
                console.error("Erro ao importar Excel:", error);
                reject(new Error('Erro ao ler o arquivo Excel. Verifique o formato das colunas.'));
            }
        };
        
        reader.onerror = () => reject(new Error('Falha ao processar o arquivo.'));
        reader.readAsArrayBuffer(file);
    });
};