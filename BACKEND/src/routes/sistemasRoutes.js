import express from 'express';
import { getSistemas, getPricing, calcularProposta } from '../controllers/sistemasController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, getSistemas);

router.get('/pricing', requireAuth, getPricing);
router.post('/calcular/proposta', requireAuth, calcularProposta);

export default router;
