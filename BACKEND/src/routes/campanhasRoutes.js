import express from 'express';
import { getCampanhas, syncCampanhas } from '../controllers/campanhasController.js';
import { requireStoreId } from '../middlewares/requireStoreId.js';

const router = express.Router();

router.use(requireStoreId);

router.get('/', getCampanhas);
router.post('/sync', syncCampanhas);

export default router;
