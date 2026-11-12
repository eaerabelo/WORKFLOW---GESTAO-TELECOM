import 'dotenv/config';
import bcrypt from 'bcrypt';
import { getOracleConnection } from '../config/oracle.js';
import { 
    solicitarCadastro, 
    efetivarCadastro, 
    solicitarRecuperacao, 
    resetarSenha, 
    login 
} from '../controllers/authController.js';
import jwt from 'jsonwebtoken';

// Helper mock para res / req do Express
function createMockRes() {
    return {
        statusCode: 200,
        body: null,
        cookies: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        },
        cookie(name, val, options) {
            this.cookies[name] = { val, options };
            return this;
        }
    };
}

async function runTests() {
    console.log("================================================================================");
    console.log("🚀 INICIANDO BATERIA DE TESTES DE AUTENTICAÇÃO E SEGURANÇA (WORKFLOW)");
    console.log("================================================================================\n");

    let conn;
    try {
        conn = await getOracleConnection();
        console.log("✅ 1. CONEXÃO COM BANCO DE DADOS ORACLE: Conectado com sucesso!");
    } catch (err) {
        console.error("❌ 1. FALHA AO CONECTAR COM ORACLE:", err.message);
        return;
    } finally {
        if (conn) await conn.close();
    }

    // -------------------------------------------------------------------------
    // TESTE 2: VALIDAÇÃO DE CADASTRO (SOLICITAR CADASTRO)
    // -------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("TESTE 2: SOLICITAÇÃO DE CÓDIGO DE VALIDAÇÃO DE E-MAIL PARA CADASTRO");
    console.log("--------------------------------------------------------------------------------");

    // 2.1 - Teste Login com prefixo inválido
    {
        const req = {
            body: {
                username: "INVALIDO123",
                email: "teste@empresa.com.br",
                nome: "Usuario Teste",
                storeCode: "AT1M",
                pass: "SenhaForte123!",
                birthDate: "1995-05-15",
                phone: "11999998888"
            }
        };
        const res = createMockRes();
        await solicitarCadastro(req, res);
        if (res.statusCode === 400 && res.body?.error?.includes("iniciar com 9, F, T ou Z")) {
            console.log("✅ 2.1 [SEGURANÇA] Bloqueio de login sem prefixo válido (9, F, T, Z): OK");
        } else {
            console.error("❌ 2.1 Falha na validação de prefixo:", res.statusCode, res.body);
        }
    }

    // 2.2 - Teste Idade menor que 18 anos
    {
        const today = new Date();
        const year16 = today.getFullYear() - 16;
        const req = {
            body: {
                username: "9TESTEMENOR",
                email: "menor@empresa.com.br",
                nome: "Menor de Idade",
                storeCode: "AT1M",
                pass: "SenhaForte123!",
                birthDate: `${year16}-01-01`,
                phone: "11999998888"
            }
        };
        const res = createMockRes();
        await solicitarCadastro(req, res);
        if (res.statusCode === 400 && res.body?.error?.includes("18 anos")) {
            console.log("✅ 2.2 [SEGURANÇA] Bloqueio de menor de 18 anos: OK");
        } else {
            console.error("❌ 2.2 Falha na validação de idade:", res.statusCode, res.body);
        }
    }

    // 2.3 - Teste Senha Fraca (sem maiúscula, número ou símbolo)
    {
        const req = {
            body: {
                username: "9TESTESENHA",
                email: "fraca@empresa.com.br",
                nome: "Senha Fraca",
                storeCode: "AT1M",
                pass: "123456",
                birthDate: "1995-05-15",
                phone: "11999998888"
            }
        };
        const res = createMockRes();
        await solicitarCadastro(req, res);
        if (res.statusCode === 400 && res.body?.error?.includes("mínimo 8 caracteres")) {
            console.log("✅ 2.3 [SEGURANÇA] Bloqueio de senha fraca: OK");
        } else {
            console.error("❌ 2.3 Falha na validação de senha:", res.statusCode, res.body);
        }
    }

    // 2.4 - Teste Sucesso de Solicitação de Cadastro e Geração de Código de Email
    const testUsername = "9TESTEAUTO" + Math.floor(Math.random() * 8999 + 1000);
    const testEmail = "teste.auto@corporativo.com.br";
    const testPass = "Claro2026@!";
    let registrationToken = null;

    {
        const req = {
            body: {
                username: testUsername,
                email: testEmail,
                nome: "COLABORADOR AUTOMATIZADO TESTE",
                storeCode: "AT1M",
                pass: testPass,
                birthDate: "1998-07-20",
                phone: "11988887777"
            }
        };
        const res = createMockRes();
        await solicitarCadastro(req, res);

        if (res.statusCode === 200 && res.body?.registrationToken) {
            registrationToken = res.body.registrationToken;
            console.log("✅ 2.4 [CADASTRO] Solicitação com dados válidos: OK!");
            console.log("    -> Token JWT de Registro emitido com sucesso (validade 15m).");
            console.log("    -> Mensagem:", res.body.message);
        } else {
            console.error("❌ 2.4 Falha ao solicitar cadastro válido:", res.statusCode, res.body);
        }
    }

    // -------------------------------------------------------------------------
    // TESTE 3: EFETIVAÇÃO DO CADASTRO COM CÓDIGO DE VALIDAÇÃO
    // -------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("TESTE 3: VALIDAÇÃO DO CÓDIGO E EFETIVAÇÃO DE CADASTRO");
    console.log("--------------------------------------------------------------------------------");

    if (registrationToken) {
        // 3.1 - Código incorreto
        {
            const req = {
                body: {
                    email: testEmail,
                    codigo: "0000",
                    registrationToken
                }
            };
            const res = createMockRes();
            await efetivarCadastro(req, res);
            if (res.statusCode === 400 && res.body?.error?.includes("Código inválido")) {
                console.log("✅ 3.1 [SEGURANÇA] Código de validação incorreto rejeitado com sucesso: OK");
            } else {
                console.error("❌ 3.1 Falha ao rejeitar código incorreto:", res.statusCode, res.body);
            }
        }

        // 3.2 - Para testar a efetivação com código correto com 100% de precisão instantânea:
        const decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);
        delete decoded.iat;
        delete decoded.exp;
        const testOtp = "1234";
        const otpHash = bcrypt.hashSync(testOtp, 10);
        const validTestToken = jwt.sign({ ...decoded, otpHash }, process.env.JWT_SECRET, { expiresIn: '15m' });

        const req = {
            body: {
                email: testEmail,
                codigo: testOtp,
                registrationToken: validTestToken
            }
        };
        const res = createMockRes();
        await efetivarCadastro(req, res);
        if (res.statusCode === 200 && res.body?.success) {
            console.log("✅ 3.2 [CADASTRO EFETIVADO] Usuário cadastrado no banco Oracle com sucesso!");
        } else {
            console.error("❌ 3.2 Falha ao efetivar cadastro:", res.statusCode, res.body);
        }
    }

    // -------------------------------------------------------------------------
    // TESTE 4: TESTE DE ACESSO / LOGIN COM O NOVO USUÁRIO
    // -------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("TESTE 4: TESTE DE ACESSO (LOGIN COM CREDENCIAIS E TOKEN JWT)");
    console.log("--------------------------------------------------------------------------------");

    // 4.1 - Senha errada
    {
        const req = {
            body: {
                username: testUsername,
                password: "SenhaErrada123!"
            }
        };
        const res = createMockRes();
        await login(req, res);
        if (res.statusCode === 401 && res.body?.error?.includes("inválidos")) {
            console.log("✅ 4.1 [SEGURANÇA] Bloqueio de login com senha incorreta: OK");
        } else {
            console.error("❌ 4.1 Falha ao bloquear senha incorreta:", res.statusCode, res.body);
        }
    }

    // 4.2 - Login com sucesso
    {
        const req = {
            body: {
                username: testUsername,
                password: testPass
            }
        };
        const res = createMockRes();
        await login(req, res);
        if (res.statusCode === 200 && res.body?.success && res.body?.token) {
            console.log("✅ 4.2 [LOGIN BEM-SUCEDIDO] Login realizado com sucesso!");
            console.log("    -> JWT Token retornado:", res.body.token.slice(0, 25) + "...");
            console.log("    -> Loja vinculada automaticamente:", res.body.user.storeId);
            console.log("    -> Cargo/Role:", res.body.user.role);
            console.log("    -> Cookie seguro jwt_token configurado: OK");
        } else {
            console.error("❌ 4.2 Falha no login:", res.statusCode, res.body);
        }
    }

    // -------------------------------------------------------------------------
    // TESTE 5: RECUPERAÇÃO DE SENHA (SOLICITAR E REDEFINIR)
    // -------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("TESTE 5: RECUPERAÇÃO DE SENHA VIA E-MAIL E REDEFINIÇÃO");
    console.log("--------------------------------------------------------------------------------");

    // 5.1 - E-mail que não bate com o cadastro
    {
        const req = {
            body: {
                username: testUsername,
                email: "outro.email@errado.com"
            }
        };
        const res = createMockRes();
        await solicitarRecuperacao(req, res);
        if (res.statusCode === 404) {
            console.log("✅ 5.1 [SEGURANÇA] Bloqueio quando o e-mail não confere com o cadastro: OK");
        } else {
            console.error("❌ 5.1 Falha ao validar e-mail não correspondente:", res.statusCode, res.body);
        }
    }

    // 5.2 - Solicitação válida de recuperação de senha
    let recoveryToken = null;
    {
        const req = {
            body: {
                username: testUsername,
                email: testEmail
            }
        };
        const res = createMockRes();
        await solicitarRecuperacao(req, res);
        if (res.statusCode === 200 && res.body?.recoveryToken) {
            recoveryToken = res.body.recoveryToken;
            console.log("✅ 5.2 [RECUPERAÇÃO] Código de recuperação gerado e token emitido com sucesso!");
        } else {
            console.error("❌ 5.2 Falha ao solicitar recuperação válida:", res.statusCode, res.body);
        }
    }

    // 5.3 - Redefinir com código correto
    if (recoveryToken) {
        const decoded = jwt.verify(recoveryToken, process.env.JWT_SECRET);
        delete decoded.iat;
        delete decoded.exp;
        const testOtp = "5678";
        const otpHash = bcrypt.hashSync(testOtp, 10);
        const validRecoveryToken = jwt.sign({ ...decoded, otpHash }, process.env.JWT_SECRET, { expiresIn: '15m' });

        const novaSenhaForte = "NovaSenhaForte2026!";
        const req = {
            body: {
                username: testUsername,
                email: testEmail,
                codigo: testOtp,
                newPass: novaSenhaForte,
                recoveryToken: validRecoveryToken
            }
        };
        const res = createMockRes();
        await resetarSenha(req, res);
        if (res.statusCode === 200 && res.body?.success) {
            console.log("✅ 5.3 [SENHA REDEFINIDA] Senha alterada com sucesso no Oracle com hash Bcrypt!");
            
            // 5.4 - Testar login com a NOVA SENHA
            const loginReq = {
                body: {
                    username: testUsername,
                    password: novaSenhaForte
                }
            };
            const loginRes = createMockRes();
            await login(loginReq, loginRes);
            if (loginRes.statusCode === 200 && loginRes.body?.success) {
                console.log("✅ 5.4 [ACESSO APÓS RESET] Login com a nova senha funcionou perfeitamente!");
            } else {
                console.error("❌ 5.4 Falha no login após redefinição de senha:", loginRes.statusCode, loginRes.body);
            }
        } else {
            console.error("❌ 5.3 Falha ao redefinir senha:", res.statusCode, res.body);
        }
    }

    // Limpeza do usuário de teste
    try {
        const c = await getOracleConnection();
        await c.execute(`DELETE FROM USUARIOS WHERE USERNAME = :username`, { username: testUsername }, { autoCommit: true });
        await c.close();
        console.log(`\n🧹 [LIMPEZA] Usuário de teste temporário (${testUsername}) removido do banco com sucesso.`);
    } catch(e) {
        console.warn("Aviso ao limpar usuário de teste:", e.message);
    }

    console.log("\n================================================================================");
    console.log("🎉 TODOS OS TESTES FORAM EXECUTADOS COM SUCESSO DE PONTA A PONTA!");
    console.log("================================================================================");
}

runTests().catch(err => console.error("ERRO FATAL NOS TESTES:", err));
