import express from 'express';
import { calculateReceitaVenda, calculateLoteReceita, calculateRV } from '../controllers/calcController.js';
import { getResultadosProduto, getFatorRV } from '../controllers/fatorRvController.js';

const router = express.Router();

router.post('/receita-venda', calculateReceitaVenda);
router.post('/lote-receita', calculateLoteReceita);
router.post('/rv', calculateRV);
router.post('/fator-rv/resultados', getResultadosProduto);
router.post('/fator-rv/calcular', getFatorRV);

export default router;
