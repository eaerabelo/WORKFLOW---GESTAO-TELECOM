import express from 'express';
import { 
    login, 
    solicitarRecuperacao, 
    resetarSenha, 
    solicitarCadastro, 
    efetivarCadastro 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/esqueci-senha/solicitar', solicitarRecuperacao);
router.post('/esqueci-senha/resetar', resetarSenha);
router.post('/cadastro/solicitar', solicitarCadastro);
router.post('/cadastro/efetivar', efetivarCadastro);

export default router;
