import express from 'express';
import { getReprovados, syncReprovados } from '../controllers/reprovadosController.js';
import { requireStoreId } from '../middlewares/requireStoreId.js';

const router = express.Router();

router.use(requireStoreId);

router.get('/', getReprovados);
router.post('/sync', syncReprovados);

export default router;
