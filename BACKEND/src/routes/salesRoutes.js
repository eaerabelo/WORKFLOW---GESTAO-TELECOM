import express from 'express';
import { getSales, syncSales } from '../controllers/salesController.js';
import { requireStoreId } from '../middlewares/requireStoreId.js';

const router = express.Router();

// Aplica o middleware em todas as rotas deste arquivo!
router.use(requireStoreId);

router.get('/', getSales);
router.post('/sync', syncSales);

export default router;
