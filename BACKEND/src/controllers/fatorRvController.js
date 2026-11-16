import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { aplicarRegrasDeProduto, calcularFatorRV, normalizeRoleForRV } from '../utils/rules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Whitelist estrita dos PDFs de Regras de Comissionamento (protegidos por JWT em BACKEND/uploads)
const PDF_POR_CARGO_OU_CHAVE = {
    'VENDEDOR': 'REGRAS RV VENDEDOR.pdf',
    'SENIOR': 'REGRAS RV SENIOR.pdf',
    'GERENTE': 'REGRAS RV GERENTE.pdf',
    'GEEK': 'REGRAS RV GEEK.pdf',
    'ADMINISTRAÇÃO': 'REGRAS RV ADM.pdf',
    'ADM': 'REGRAS RV ADM.pdf',
    'ASSISTENTE RELACIONAMENTO': 'REGRAS RV ASSISTENTE RELACIONAMENTO.pdf',
    'CAIXA': 'REGRAS RV CAIXA.pdf',
    'COORDENADOR': 'REGRAS COORDENADOR E OUTROS.pdf',
    'ESPECIALISTA': 'REGRAS COORDENADOR E OUTROS.pdf',
    'GERAIS': 'REGRAS GERAIS COMISSIONAMENTO.pdf',
    'FERIAS': 'REGRAS DE FERIAS E OUTROS.pdf'
};

const ARQUIVOS_PERMITIDOS = new Set(Object.values(PDF_POR_CARGO_OU_CHAVE));

const resolveUploadsDir = () => {
    const cwdPath = path.resolve(process.cwd(), 'uploads');
    if (fs.existsSync(cwdPath)) return cwdPath;
    return path.resolve(__dirname, '../../uploads');
};

export const getResultadosProduto = (req, res) => {
    try {
        const { sellerSales = [], pctAtingimentoMplay = 0 } = req.body;
        let receitaExtraMplay = 0;
        
        const resultados = sellerSales.map(sale => {
            const rCom = aplicarRegrasDeProduto(sale, { pctAtingimentoMplay });
            const rSem = aplicarRegrasDeProduto(sale, { pctAtingimentoMplay: 0 });
            receitaExtraMplay += (rCom - rSem);
            
            return {
                id: sale.id,
                receitaBase: rCom
            };
        });

        res.json({ success: true, resultados, receitaExtraMplay });
    } catch (error) {
        console.error("Erro no getResultadosProduto:", error);
        res.status(500).json({ error: "Erro interno" });
    }
};

export const getFatorRV = (req, res) => {
    try {
        const { pctAtingimento = 0, totalComissao = 0, metricasExtras = {} } = req.body;
        const resultRV = calcularFatorRV(pctAtingimento, totalComissao, metricasExtras);
        res.json({ success: true, resultRV });
    } catch (error) {
        console.error("Erro no getFatorRV:", error);
        res.status(500).json({ error: "Erro interno" });
    }
};

/**
 * Endpoint protegido por JWT para entrega segura dos PDFs de Regras RV (sem exposição pública no deploy)
 * GET /api/calcular/fator-rv/pdf?key=VENDEDOR (ou nome do arquivo na whitelist)
 */
export const getRegraRvPdf = (req, res) => {
    try {
        const rawUserRole = String(req.user?.role || 'VENDEDOR').trim().toUpperCase();
        const normalizedUserRole = normalizeRoleForRV(rawUserRole);
        const canAccessAll = ['GERENTE', 'COORDENADOR', 'ESPECIALISTA', 'SENIOR', 'ADMINISTRAÇÃO', 'ADM', 'GEEK'].includes(rawUserRole) ||
                             ['GERENTE', 'COORDENADOR', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK'].includes(normalizedUserRole);

        const rawKey = String(req.params.key || req.query.key || 'MEU_CARGO').trim();
        const upperKey = rawKey.toUpperCase();

        let targetFileName = null;

        if (!rawKey || upperKey === 'MEU_CARGO' || upperKey === 'AUTO') {
            targetFileName = PDF_POR_CARGO_OU_CHAVE[rawUserRole] || PDF_POR_CARGO_OU_CHAVE[normalizedUserRole] || PDF_POR_CARGO_OU_CHAVE['VENDEDOR'];
        } else if (PDF_POR_CARGO_OU_CHAVE[upperKey]) {
            targetFileName = PDF_POR_CARGO_OU_CHAVE[upperKey];
        } else {
            const normalizedKey = normalizeRoleForRV(upperKey);
            if (ARQUIVOS_PERMITIDOS.has(rawKey)) {
                targetFileName = rawKey;
            } else if (PDF_POR_CARGO_OU_CHAVE[normalizedKey]) {
                targetFileName = PDF_POR_CARGO_OU_CHAVE[normalizedKey];
            }
        }

        if (!targetFileName || !ARQUIVOS_PERMITIDOS.has(targetFileName)) {
            return res.status(404).json({ error: 'Documento de regra não encontrado.' });
        }

        // Controle de acesso por perfil (JWT): colaboradores sem perfil de gestão acessam apenas o PDF do próprio cargo e documentos gerais
        const myOwnPdf = PDF_POR_CARGO_OU_CHAVE[rawUserRole] || PDF_POR_CARGO_OU_CHAVE[normalizedUserRole] || PDF_POR_CARGO_OU_CHAVE['VENDEDOR'];
        const isGeneralDoc = targetFileName === PDF_POR_CARGO_OU_CHAVE['GERAIS'] || targetFileName === PDF_POR_CARGO_OU_CHAVE['FERIAS'];

        if (!canAccessAll && targetFileName !== myOwnPdf && !isGeneralDoc) {
            return res.status(403).json({ error: 'Acesso restrito ao documento de regras do seu próprio cargo.' });
        }

        const uploadsDir = resolveUploadsDir();
        const filePath = path.join(uploadsDir, path.basename(targetFileName));

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Arquivo PDF não localizado no servidor.' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(targetFileName)}"`);
        res.setHeader('Cache-Control', 'private, no-store, max-age=0');

        const stream = fs.createReadStream(filePath);
        stream.on('error', (err) => {
            console.error('Erro ao transmitir PDF de regra RV:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Falha ao ler arquivo PDF.' });
            }
        });
        stream.pipe(res);
    } catch (error) {
        console.error('Erro no getRegraRvPdf:', error);
        res.status(500).json({ error: 'Erro interno ao buscar PDF da regra.' });
    }
};
