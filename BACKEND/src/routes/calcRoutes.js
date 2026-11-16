import express from 'express';
import { calculateReceitaVenda, calculateLoteReceita, calculateRV } from '../controllers/calcController.js';
import { getResultadosProduto, getFatorRV, getRegraRvPdf } from '../controllers/fatorRvController.js';

const router = express.Router();

router.post('/receita-venda', calculateReceitaVenda);
router.post('/lote-receita', calculateLoteReceita);
router.post('/rv', calculateRV);
router.post('/fator-rv/resultados', getResultadosProduto);
router.post('/fator-rv/calcular', getFatorRV);
router.get('/fator-rv/pdf', getRegraRvPdf);
router.get('/fator-rv/pdf/:key', getRegraRvPdf);

export default router;
