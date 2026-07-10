import express from 'express';
import { getConfig, syncConfig } from '../controllers/configController.js';
import { requireStoreId } from '../middlewares/requireStoreId.js';

const router = express.Router();

router.use(requireStoreId);

router.get('/', getConfig);
router.post('/sync', syncConfig);

export default router;
