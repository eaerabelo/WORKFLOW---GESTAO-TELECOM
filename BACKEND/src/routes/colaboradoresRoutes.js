import express from 'express';
import { getColaboradoresDashboard } from '../controllers/colaboradoresController.js';

const router = express.Router();

router.get('/dashboard', getColaboradoresDashboard);

export default router;
