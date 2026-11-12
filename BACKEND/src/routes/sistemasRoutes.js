import express from 'express';
import { getSistemas, getPricing, calcularProposta, enviarIdeiaScript } from '../controllers/sistemasController.js';

const router = express.Router();

router.get('/', getSistemas);

router.get('/pricing', getPricing);
router.post('/calcular/proposta', calcularProposta);
router.post('/scripts/ideia', enviarIdeiaScript);

export default router;
