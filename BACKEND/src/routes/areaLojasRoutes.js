import express from 'express';
import { getAreaLojas } from '../controllers/areaLojasController.js';

const router = express.Router();

// GET /api/area-lojas?month=YYYY-MM
router.get('/', getAreaLojas);

export default router;
