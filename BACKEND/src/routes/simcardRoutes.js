import express from 'express';
import { getSimcards, syncSimcards } from '../controllers/simcardController.js';
import { requireStoreId } from '../middlewares/requireStoreId.js';

const router = express.Router();

router.use(requireStoreId);

router.get('/', getSimcards);
router.post('/sync', syncSimcards);

export default router;
