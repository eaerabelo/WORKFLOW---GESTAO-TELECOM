import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowLeft, Key, Mail, Calendar, Smartphone, Store, Activity, ShieldCheck, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginAPI, solicitarRecuperacaoAPI, resetarSenhaAPI, solicitarCadastroAPI, efetivarCadastroAPI, fetchStatus } from '../services/api.js';
import wfLogo from '../assets/logo_WF.png';
import desktopBg from '../assets/DESKTOP_PAGE.jpeg';
import mobileBg from '../assets/MOBILE_PAGE.jpg';

export function Login({ usersDB, setUsersDB, onLogin }) {
    const [view, setView] = useState('LOGIN'); // 'LOGIN', 'REGISTER', 'FORGOT'

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [holidayMessage, setHolidayMessage] = useState(null);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        
        // Busca a mensagem de feriado do servidor
        fetchStatus().then(data => {
            if (data && data.holidayMessage) {
                setHolidayMessage(data.holidayMessage);
            }
        }).catch(err => console.error("Erro ao carregar mensagem de feriado:", err));

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Login State
    const [loginUser, setLoginUser] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [selectedStore, setSelectedStore] = useState(localStorage.getItem('storeId') || 'uniao_osasco');

    // Registration States
    const [regStep, setRegStep] = useState(1);
    const [regCurrentCode, setRegCurrentCode] = useState('');
    const [tempRegData, setTempRegData] = useState(null);
    const [regName, setRegName] = useState('');
    const [regUser, setRegUser] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regPass, setRegPass] = useState('');
    const [regBirthDate, setRegBirthDate] = useState('');
    const [regConfirmPass, setRegConfirmPass] = useState('');
    const [regStoreCode, setRegStoreCode] = useState('');

    // Forgot Password State
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotUser, setForgotUser] = useState('');
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmNewPass, setConfirmNewPass] = useState('');

    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleLogin = async (e) => {
        e.preventDefault();
        const user = loginUser.trim().toUpperCase();
        const pass = loginPass.trim();

        try {
            const toastId = toast.loading('Autenticando...');
            const result = await loginAPI(user, pass);

            const realStoreId = result.user.storeId || 'DEFAULT';

            if (result.token) {
                localStorage.setItem('jwt_token', result.token);
            }
            localStorage.setItem('storeId', realStoreId);
            
            const userDataToSave = { ...result.user, loginTime: Date.now() };
            localStorage.setItem('sessionUser', JSON.stringify(userDataToSave));
            
            toast.dismiss(toastId);

            const userData = result.user;

            if (userData.role === 'SUSPENDER') {
                toast.error('Conta suspensa temporariamente. Procure seu Gestor.');
                return;
            }

            if (userData.isBirthday) {
                toast.success(`🎉 Feliz Aniversário, ${userData.name}! Que seu dia seja repleto de conquistas! 🎂🎈`, { duration: 6000, icon: '🥳' });
            } else {
                toast.success(`Bem-vindo, ${userData.name}!`);
            }

            window.location.href = '/';

        } catch (error) {
            toast.dismiss();
            toast.error(error.message || 'Erro ao realizar login.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (regPass !== regConfirmPass) {
            toast.error('As senhas não coincidem.');
            return;
        }

        if (!acceptedTerms) {
            toast.error('É obrigatório dar o ciente nos Termos de Uso e Privacidade.');
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const setupKey = urlParams.get('setup');
        
        const userUpper = regUser.toUpperCase();
        const emailClean = regEmail.trim().replace(/\.$/, '');
        const nameUpper = regName.toUpperCase();

        toast.loading('Validando no banco de dados e enviando e-mail...', { id: 'regEmailToast' });

        try {
            const res = await solicitarCadastroAPI(userUpper, emailClean, nameUpper, regStoreCode, setupKey, regPass, regBirthDate, regPhone);
            setTempRegData({ registrationToken: res.registrationToken, email: emailClean, setupKey, userUpper });
            toast.success('Código de confirmação enviado para seu e-mail!', { id: 'regEmailToast' });
            setRegStep(2);
            setResendTimer(60);
        } catch (error) {
            console.error("ERRO COMPLETO CATCH:", error);
            toast.error(error.message || 'Falha ao solicitar cadastro.', { id: 'regEmailToast', duration: 8000 });
        }
    };

    const handleRegisterCodeVerify = async (e) => {
        e.preventDefault();
        const { registrationToken, email, setupKey, userUpper } = tempRegData;

        try {
            await efetivarCadastroAPI(email, regCurrentCode, registrationToken);
            toast.success(setupKey === 'lideranca2026' ? 'CONTA DE GERENTE CRIADA COM SUCESSO!' : 'CADASTRO REALIZADO COM SUCESSO. Faça seu login!');
        } catch (error) {
            toast.error(error.message || 'Código inválido ou incorreto. Verifique seu e-mail novamente.');
            return;
        }

        setView('LOGIN');
        setLoginUser(userUpper);
        setLoginPass('');

        setRegStep(1);
        setRegCurrentCode('');
        setTempRegData(null);
        setRegName('');
        setRegUser('');
        setRegEmail('');
        setRegPhone('');
        setRegPass('');
        setRegBirthDate('');
        setRegConfirmPass('');
        setRegStoreCode('');
        setAcceptedTerms(false);
    };

    const [recoveryToken, setRecoveryToken] = useState(null);

    const handleForgotRequest = async (e) => {
        e.preventDefault();
        const userUpper = forgotUser.toUpperCase();
        const emailClean = forgotEmail.trim().replace(/\.$/, '');
        toast.loading('Buscando usuário no banco de dados e enviando E-mail...', { id: 'emailToast' });

        try {
            const res = await solicitarRecuperacaoAPI(userUpper, emailClean);
            setRecoveryToken(res.recoveryToken);
            toast.success('Código de recuperação enviado para seu e-mail!', { id: 'emailToast' });
            setForgotStep(2);
            setResendTimer(60);
        } catch (error) {
            toast.error(error.message || 'Falha ao solicitar recuperação.', { id: 'emailToast' });
        }
    };

    const handleForgotReset = async (e) => {
        e.preventDefault();
        if (!newPass) {
            toast.error('Informe a nova senha.');
            return;
        }
        if (newPass !== confirmNewPass) {
            toast.error('As senhas não coincidem.');
            return;
        }

        const userUpper = forgotUser.toUpperCase();
        const emailClean = forgotEmail.trim().replace(/\.$/, '');

        try {
            await resetarSenhaAPI(userUpper, emailClean, resetCode, newPass, recoveryToken);
            toast.success('Senha alterada com sucesso! Faça seu login.');
            setForgotStep(1);
            setView('LOGIN');
            setForgotUser('');
            setForgotEmail('');
            setResetCode('');
            setNewPass('');
            setConfirmNewPass('');
            setRecoveryToken(null);
        } catch (error) {
            toast.error(error.message || 'Código inválido ou expirado.');
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-500 relative bg-no-repeat bg-center"
            style={{
                backgroundImage: `url(${isMobile ? mobileBg : desktopBg})`,
                backgroundSize: '100% 100%',
                backgroundColor: '#111'
            }}
        >

            {holidayMessage && (
                <div className="w-full max-w-md mb-6 bg-gradient-to-br from-[#E3000F] to-red-800 text-white p-6 rounded-2xl shadow-xl border border-red-500/50 animate-fade-in text-center relative overflow-hidden z-10">
                    <div className="absolute -right-6 -top-6 opacity-10 text-8xl transform rotate-12 pointer-events-none">
                        {holidayMessage.icon}
                    </div>
                    <div className="absolute -left-6 -bottom-6 opacity-10 text-8xl transform -rotate-12 pointer-events-none">
                        {holidayMessage.icon}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black mb-2 flex items-center justify-center gap-2 relative z-10">
                        {holidayMessage.icon} {holidayMessage.title}
                    </h2>
                    <p className="text-sm font-medium opacity-90 relative z-10">{holidayMessage.desc}</p>
                </div>
            )}

            <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-colors duration-500 relative z-10">
                <div className="bg-black py-4 px-6 text-center relative overflow-hidden">
                    <div className="w-52 h-20 mx-auto mb-1 flex items-center justify-center">
                        <img src={wfLogo} alt="WorkFlow Logo" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white tracking-wide">WorkFlow</h2>
                    <p className="text-neutral-400 text-xs mt-0.5 font-medium">Plataforma Integrada de Gestão Telecom</p>

                    {/* SELO DE SEGURANÇA */}
                    <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-[#E3000F]/15 border border-[#E3000F]/40 rounded-full text-[10px] font-black uppercase tracking-wider text-red-400 shadow-sm">
                        <ShieldCheck size={13} className="text-[#E3000F]" />
                        <span>ACESSO AO SISTEMA SEGURO E AUTENTICADO</span>
                    </div>
                </div>

                <div className="p-6">
                    {view === 'LOGIN' && (
                        <div className="animate-fade-in">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100 mb-4 text-center">Faça seu Login</h3>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="Usuário ( Login )" required className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] uppercase text-sm font-medium" />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Senha de Acesso" required className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" />
                                </div>
                                <button type="submit" className="w-full py-3 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Entrar</button>

                                <div className="flex flex-col gap-2 mt-4 text-center">
                                    <button type="button" onClick={() => setView('FORGOT')} className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-[#E3000F] dark:hover:text-[#E3000F] transition-colors">Esqueci minha senha</button>
                                    <div className="border-t border-neutral-100 dark:border-neutral-800 my-2"></div>
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Ainda não tem acesso?</span>
                                    <button type="button" onClick={() => setView('REGISTER')} className="text-sm font-bold text-[#E3000F] hover:text-red-700 transition-colors">Cadastre-se agora</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {view === 'REGISTER' && (
                        <div className="animate-fade-in">
                            {regStep === 1 && (
                                <form onSubmit={handleRegister} className="space-y-3.5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <button type="button" onClick={() => setView('LOGIN')} className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors">
                                            <ArrowLeft size={18} />
                                        </button>
                                        <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">Criar Nova Conta</h3>
                                    </div>
                                    <div className="space-y-2.5">
                                        <div>
                                            <label className="text-[11px] font-black uppercase text-neutral-500 dark:text-neutral-400 ml-1">Nome Completo <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Ex: João da Silva" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] uppercase text-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black uppercase text-neutral-500 dark:text-neutral-400 ml-1">Usuário / Login <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="text" value={regUser} onChange={e => setRegUser(e.target.value)} placeholder="Inicia com 9, F, Z ou T" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] uppercase text-sm font-mono" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black uppercase text-neutral-500 dark:text-neutral-400 ml-1">E-mail <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Ex: seunome@corporativo.com.br" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] text-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black uppercase text-neutral-500 dark:text-neutral-400 ml-1">Celular <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="text" maxLength={15} value={regPhone} onChange={e => {
                                                    let v = e.target.value.replace(/\D/g, '');
                                                    if (v.length > 11) v = v.slice(0, 11);
                                                    let masked = v;
                                                    if (v.length > 7) masked = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
                                                    else if (v.length > 2) masked = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                                                    setRegPhone(masked);
                                                }} placeholder="Ex: (11) 90000-0000" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] text-sm font-mono" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black uppercase text-neutral-500 dark:text-neutral-400 ml-1">Data de Nascimento (18+ Anos) <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input
                                                    type="date"
                                                    value={regBirthDate}
                                                    min="1920-01-01"
                                                    max="2026-12-31"
                                                    onChange={e => {
                                                        let val = e.target.value;
                                                        if (val) {
                                                            const parts = val.split('-');
                                                            if (parts[0] && parts[0].length > 4) {
                                                                parts[0] = parts[0].slice(0, 4);
                                                                val = parts.join('-');
                                                            }
                                                        }
                                                        setRegBirthDate(val);
                                                    }}
                                                    required
                                                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl outline-none focus:border-[#E3000F] text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black uppercase text-neutral-500 dark:text-neutral-400 ml-1">Código da Loja <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="text" value={regStoreCode} onChange={e => setRegStoreCode(e.target.value.toUpperCase())} placeholder="Solicite ao Gerente (Ex: AT1M)" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] text-sm font-mono uppercase" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black uppercase text-neutral-500 dark:text-neutral-400 ml-1">Senha <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="password" value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="Mínimo 8 caracteres, letras, números e símbolos" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] text-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black uppercase text-neutral-500 dark:text-neutral-400 ml-1">Confirme a Senha <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="password" value={regConfirmPass} onChange={e => setRegConfirmPass(e.target.value)} placeholder="Confirme a mesma senha" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] text-sm" />
                                            </div>
                                        </div>

                                        {/* TERMOS DE USO E PRIVACIDADE */}
                                        <div className="pt-2 pb-1 border-t border-neutral-100 dark:border-neutral-800">
                                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={acceptedTerms}
                                                    onChange={e => setAcceptedTerms(e.target.checked)}
                                                    required
                                                    className="mt-0.5 w-4 h-4 rounded text-[#E3000F] focus:ring-[#E3000F] cursor-pointer"
                                                />
                                                <span className="text-xs text-neutral-600 dark:text-neutral-300 leading-tight">
                                                    Li e declaro estar ciente dos{' '}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                                                        className="font-bold text-[#E3000F] hover:underline inline"
                                                    >
                                                        Termos de Uso e Privacidade
                                                    </button>{' '}
                                                    do sistema.
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-3 bg-neutral-900 dark:bg-neutral-800 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-neutral-700 transition-colors shadow-lg">Continuar Cadastro</button>
                                </form>
                            )}
                            {regStep === 2 && (
                                <form onSubmit={handleRegisterCodeVerify} className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <button type="button" onClick={() => { setRegStep(1); setRegCurrentCode(''); setTempRegData(null); }} className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors">
                                            <ArrowLeft size={18} />
                                        </button>
                                        <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">Confirmar E-mail</h3>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg text-sm text-red-700 dark:text-red-400 flex items-start gap-2 mb-4">
                                        <Mail size={18} className="shrink-0 mt-0.5" />
                                        <p>Enviamos um código de verificação para <strong>{regEmail}</strong>. Insira-o abaixo para concluirmos a criação da sua conta.</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Código de Confirmação</label>
                                        <div className="relative mt-1">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                            <input type="text" value={regCurrentCode} onChange={e => setRegCurrentCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-center tracking-widest text-lg font-mono" />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-3 mt-4 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Confirmar e Cadastrar</button>
                                    <button type="button" disabled={resendTimer > 0} onClick={handleRegister} className="w-full py-2 mt-2 bg-transparent text-neutral-500 dark:text-neutral-400 font-bold rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50">
                                        {resendTimer > 0 ? `Aguarde ${resendTimer}s para reenviar` : 'Reenviar Código'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {view === 'FORGOT' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <button type="button" onClick={() => { setView('LOGIN'); setForgotStep(1); }} className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors">
                                    <ArrowLeft size={18} />
                                </button>
                                <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">Recuperação de Senha</h3>
                            </div>
                            {forgotStep === 1 && (
                                <form onSubmit={handleForgotRequest} className="space-y-4">
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Informe seu Login e E-mail cadastrado para enviarmos um código de verificação.</p>
                                    <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Seu Login</label><div className="relative mt-1"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="text" value={forgotUser} onChange={e => setForgotUser(e.target.value)} placeholder="Ex: F123456 ou 98765432" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] uppercase text-sm font-mono" /></div></div>
                                    <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">E-mail Cadastrado <span className="text-[#E3000F]">*</span></label><div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Ex: email@corporativo.com.br" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" /></div></div>
                                    <button type="submit" className="w-full py-3 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Enviar E-mail de Verificação</button>
                                </form>
                            )}
                            {forgotStep === 2 && (
                                <form onSubmit={handleForgotReset} className="space-y-4">
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg text-sm text-green-700 dark:text-green-400 flex items-start gap-2 mb-2"><Mail size={18} className="shrink-0 mt-0.5" /><p>Um código de 4 dígitos foi enviado para o seu e-mail. Insira-o abaixo para criar uma nova senha.</p></div>
                                    <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Código de Verificação</label><div className="relative mt-1"><Key className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="text" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-center tracking-widest text-lg font-mono" /></div></div>
                                    <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Nova Senha</label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Digite sua nova senha" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" /></div></div>
                                    <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Confirme a Nova Senha</label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="password" value={confirmNewPass} onChange={e => setConfirmNewPass(e.target.value)} placeholder="Confirme sua nova senha" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" /></div></div>
                                    <button type="submit" className="w-full py-3 bg-neutral-900 dark:bg-neutral-800 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-neutral-700 transition-colors shadow-lg">Redefinir Senha</button>
                                    <button type="button" disabled={resendTimer > 0} onClick={handleForgotRequest} className="w-full py-2 mt-2 bg-transparent text-neutral-500 dark:text-neutral-400 font-bold rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50">
                                        {resendTimer > 0 ? `Aguarde ${resendTimer}s para reenviar` : 'Reenviar Código'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* RODAPÉ DO CARD COM VERSÃO E TERMOS */}
                    <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                        <span className="font-mono font-bold tracking-tight">WorkFlow v2.5.0</span>
                        <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="hover:text-[#E3000F] underline transition-colors cursor-pointer"
                        >
                            Termos de Uso & Privacidade
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL DE TERMOS DE USO E PRIVACIDADE */}
            {showTermsModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col max-h-[85vh] animate-scale-up">
                        <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-[#E3000F] flex items-center justify-center shrink-0">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-base text-neutral-800 dark:text-neutral-100">Termos de Uso e Política de Privacidade</h3>
                                <p className="text-xs text-neutral-400">WorkFlow Gestão Telecom • Versão 2.5.0</p>
                            </div>
                        </div>

                        <div className="overflow-y-auto scrollbar-thin py-4 space-y-3.5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed pr-1">
                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                                <h4 className="font-bold text-neutral-800 dark:text-neutral-100 uppercase text-[11px] mb-1">1. Finalidade do Sistema</h4>
                                <p>O WorkFlow é uma ferramenta operacional exclusiva para gestão comercial, acompanhamento de metas, controle de simcards, escala e suporte operacional das equipes autorizadas de telecomunicação.</p>
                            </div>

                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                                <h4 className="font-bold text-neutral-800 dark:text-neutral-100 uppercase text-[11px] mb-1">2. Confidencialidade e Dados Pessoais (LGPD)</h4>
                                <p>É estritamente vedado o uso das informações para fins alheios à operação. Dados cadastrais e de vendas são armazenados de forma criptografada em banco de dados seguro Oracle com hash Bcrypt e conformidade com a LGPD.</p>
                            </div>

                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                                <h4 className="font-bold text-neutral-800 dark:text-neutral-100 uppercase text-[11px] mb-1">3. Responsabilidade do Usuário</h4>
                                <p>A senha de acesso é individual e intransferível. O compartilhamento de credenciais ou simulação de dados acarretará suspensão imediata da conta e comunicação à liderança.</p>
                            </div>

                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                                <h4 className="font-bold text-neutral-800 dark:text-neutral-100 uppercase text-[11px] mb-1">4. Auditoria e Rastreabilidade</h4>
                                <p>Todas as ações (lançamentos de vendas, cópias de ICCID e edições de dados) são registradas com data, hora e matrícula do colaborador para integridade da operação.</p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setAcceptedTerms(true);
                                    setShowTermsModal(false);
                                    toast.success('Você deu o ciente nos Termos de Uso.');
                                }}
                                className="px-4 py-2.5 bg-[#E3000F] text-white font-bold rounded-xl text-xs hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/20"
                            >
                                <CheckCircle size={15} />
                                Estou Ciente e Concordo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 