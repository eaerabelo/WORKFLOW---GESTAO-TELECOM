import express from 'express';
import { getLatestUpdate } from '../controllers/updatesController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/latest', requireAuth, getLatestUpdate);

export default router;
