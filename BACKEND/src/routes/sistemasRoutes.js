import express from 'express';
import { getSistemas, getPricing, calcularProposta } from '../controllers/sistemasController.js';

const router = express.Router();

router.get('/', getSistemas);

router.get('/pricing', getPricing);
router.post('/calcular/proposta', calcularProposta);

export default router;
