import express from 'express';
import { getGeekDocs, syncGeekDocs } from '../controllers/geekDocsController.js';
import { requireStoreId } from '../middlewares/requireStoreId.js';

const router = express.Router();

router.use(requireStoreId);

router.get('/', getGeekDocs);
router.post('/sync', syncGeekDocs);

export default router;
