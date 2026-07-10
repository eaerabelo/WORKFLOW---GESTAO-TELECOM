import express from 'express';
import { saveUser, deleteUser, unlockCofre } from '../controllers/acessosController.js';
import { requireStoreId } from '../middlewares/requireStoreId.js';

const router = express.Router();

router.use(requireStoreId);

router.post('/', saveUser);
router.delete('/:username', deleteUser);
router.post('/unlock', unlockCofre);

export default router;
