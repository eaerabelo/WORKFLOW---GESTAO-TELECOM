import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowLeft, Key, Mail, Calendar, Smartphone, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
import viteLogo from '../assets/LOGO_CLARO.png.webp';
import claroWallpaper from '../assets/CLARO_WALLPAPER.jpg';
import claroWallpaperMobile from '../assets/CLARO_WALLPAPER_MOBILE.jpg';

const getHolidayMessage = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1; // 1-12
    const dayOfWeek = today.getDay(); // 0-6 (Dom-Sab)

    if (day === 1 && month === 1) return { title: "Feliz Ano Novo!", desc: "Que este ano seja repleto de conquistas.", icon: "🌟" };
    if (day === 8 && month === 3) return { title: "Feliz Dia da Mulher!", desc: "Homenagem especial a todas as mulheres.", icon: "🌷" };
    if (month === 5 && dayOfWeek === 0 && day >= 8 && day <= 14) return { title: "Feliz Dia das Mães!", desc: "Um abraço carinhoso a todas as mães guerreiras.", icon: "🤍" };
    if (day === 12 && month === 6) return { title: "Feliz Dia dos Namorados!", desc: "Celebre o amor e espalhe coisas boas.", icon: "🤍" };
    if (month === 8 && dayOfWeek === 0 && day >= 8 && day <= 14) return { title: "Feliz Dia dos Pais!", desc: "Um grande abraço a todos os pais.", icon: "👔" };
    if (day === 15 && month === 9) return { title: "Feliz Dia do Cliente!", desc: "Obrigado por nos inspirar a ser melhores.", icon: "🤝" };
    if (day === 1 && month === 10) return { title: "Feliz Dia do Vendedor!", desc: "Parabéns por moverem nossa loja com dedicação!", icon: "🚀" };
    if (day === 12 && month === 10) return { title: "Feliz Dia das Crianças!", desc: "Nunca perca a alegria de criança.", icon: "🧸" };
    if (day === 25 && month === 12) return { title: "Feliz Natal!", desc: "Que a magia do Natal ilumine sua vida.", icon: "🎄" };
    if (day === 31 && month === 12) return { title: "Feliz Véspera de Ano Novo!", desc: "Prepare-se para um ano incrível.", icon: "🎆" };

    return null;
};

export function Login({ usersDB, setUsersDB, onLogin }) {
    const [view, setView] = useState('LOGIN'); // 'LOGIN', 'REGISTER', 'FORGOT'
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Login State
    const [loginUser, setLoginUser] = useState('');
    const [loginPass, setLoginPass] = useState('');

    // Register State
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
    const [expectedCode, setExpectedCode] = useState('');
    const [newPass, setNewPass] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        const user = loginUser.toUpperCase();
        if (usersDB[user] && usersDB[user].pass === loginPass) {
            const userData = usersDB[user];
            
            if (userData.role === 'SUSPENDER') {
                toast.error('Conta suspensa temporariamente. Procure seu Gestor.');
                return;
            }
            let isBirthday = false;
            
            if (userData.birthDate) {
                const today = new Date();
                const [year, month, day] = userData.birthDate.split('-');
                if (today.getMonth() + 1 === parseInt(month, 10) && today.getDate() === parseInt(day, 10)) {
                    isBirthday = true;
                }
            }

            if (isBirthday) {
                toast.success(`🎉 Feliz Aniversário, ${userData.name}! Que seu dia seja repleto de conquistas! 🎂🎈`, { duration: 6000, icon: '🥳' });
            } else {
                toast.success(`Bem-vindo, ${userData.name}!`);
            }

            if (onLogin) onLogin(userData, user);
        } else {
            toast.error('Usuário ou senha incorretos.');
        }
    };

    const handleRegister = (e) => {
        e.preventDefault();
        
        if (!regName || !regUser || !regEmail || !regPhone || !regPass || !regConfirmPass || !regBirthDate || !regStoreCode) {
            toast.error('Preencha todos os campos.');
            return;
        }

        const expectedStoreCode = import.meta.env.VITE_STORE_CODE || 'AT1M';
        if (regStoreCode.toUpperCase() !== expectedStoreCode.toUpperCase()) {
            toast.error('Código da loja incorreto. Verifique com a liderança.');
            return;
        }
        
        const userUpper = regUser.toUpperCase();
        if (!userUpper.startsWith('9') && !userUpper.startsWith('F')) {
            toast.error('O Login deve iniciar com 9 ou F. (Exemplo: 98765432 ou F123456)');
            return;
        }

        if (regPass !== regConfirmPass) {
            toast.error('As senhas não coincidem.');
            return;
        }

        if (usersDB[userUpper]) {
            toast.error('Este usuário já está cadastrado.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
            toast.error('Informe um e-mail válido.');
            return;
        }

        if (!regEmail.toLowerCase().endsWith('@claro.com.br')) {
            toast.error('O e-mail de cadastro deve ser corporativo (@claro.com.br).');
            return;
        }

        // Validação de Conta Duplicada (Prevenção de múltiplos cadastros)
        const duplicateUser = Object.values(usersDB).find(u => 
            (u.email && u.email.toLowerCase() === regEmail.toLowerCase()) ||
            (u.phone && u.phone === regPhone)
        );
        if (duplicateUser) {
            toast.error('Você já possui um cadastro no sistema com estes dados. Utilize a opção "Esqueci minha senha" para recuperar seu acesso.', { duration: 6000 });
            return;
        }

        // Validação de Maioridade (18 anos)
        const birthDateObj = new Date(regBirthDate + 'T12:00:00');
        const today = new Date();
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const monthDiff = today.getMonth() - birthDateObj.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }
        if (age < 18) {
            toast.error('É necessário ter pelo menos 18 anos para se cadastrar no sistema.');
            return;
        }

        const newUser = {
            name: regName.toUpperCase(),
            email: regEmail,
            pass: regPass,
            phone: regPhone,
            birthDate: regBirthDate,
            role: 'VENDEDOR' // default
        };

        setUsersDB(prev => ({ ...prev, [userUpper]: newUser }));
        toast.success('CADASTRO REALIZADO COM SUCESSO');
        setView('LOGIN');
        setLoginUser(userUpper);
        setLoginPass('');
        
        // Clear reg state
        setRegName('');
        setRegUser('');
        setRegEmail('');
        setRegPhone('');
        setRegPass('');
        setRegBirthDate('');
        setRegConfirmPass('');
        setRegStoreCode('');
    };

    const handleForgotRequest = async (e) => {
        e.preventDefault();
        const userUpper = forgotUser.toUpperCase();
        if (!usersDB[userUpper]) {
            toast.error('Usuário não encontrado.');
            return;
        }
        
        const dbEmail = usersDB[userUpper].email || '';
        
        if (!dbEmail) {
            toast.error('Este usuário não possui um e-mail cadastrado para recuperação.');
            return;
        }

        if (dbEmail.toLowerCase() !== forgotEmail.toLowerCase()) {
            toast.error('E-mail não confere com o cadastro.');
            return;
        }

        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setExpectedCode(code);
        
        toast.loading('Enviando E-mail...', { id: 'emailToast' });
        
        try {
            const templateParams = {
                to_name: usersDB[userUpper].name,
                to_email: dbEmail,
                codigo_recuperacao: code
            };

            // Adicionado para depuração: Verifique o console (F12) para ver estes dados
            console.log('Enviando para o EmailJS com os seguintes parâmetros:', templateParams);

            // Integração Oficial EmailJS
            await emailjs.send('service_kpr1ksb', 'template_6wuyizw', templateParams, 'tRgcNBg8P036AeS_l');
            
            toast.success(`E-mail enviado com sucesso!`, { id: 'emailToast' });
            setForgotStep(2);
        } catch (error) {
            console.error('EMAILJS ERROR:', error);
            toast.error('Falha ao enviar e-mail. Verifique o console para detalhes (F12).', { id: 'emailToast' });
        }
    };

    const handleForgotReset = (e) => {
        e.preventDefault();
        if (resetCode !== expectedCode) {
            toast.error('Código de verificação incorreto.');
            return;
        }
        if (!newPass) {
            toast.error('Informe a nova senha.');
            return;
        }
        
        const userUpper = forgotUser.toUpperCase();
        setUsersDB(prev => ({
            ...prev,
            [userUpper]: {
                ...prev[userUpper],
                pass: newPass
            }
        }));

        toast.success('TROCA REALIZADA COM SUCESSO');
        setView('LOGIN');
        setForgotStep(1);
        setForgotUser('');
        setForgotEmail('');
        setResetCode('');
        setNewPass('');
    };

    const holidayMessage = getHolidayMessage();

    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500 relative"
            style={{ backgroundImage: `url(${isMobile ? claroWallpaperMobile : claroWallpaper})`, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}
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
                <div className="bg-[#E3000F] py-4 px-6 text-center relative overflow-hidden">
                    <div className="w-52 h-24 mx-auto mb-1 flex items-center justify-center">
                        <img src={viteLogo} alt="Logo" className="w-50 h-50 object-contain drop-shadow-lg" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Painel Claro</h2>
                    <p className="text-red-100 text-sm mt-1">Acesso ao Sistema</p>
                </div>

                <div className="p-6">
                    {view === 'LOGIN' && (
                        <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
                            <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100 mb-4 text-center">Faça seu Login</h3>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="Usuário ( Login )" className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] uppercase" />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Senha de Acesso" className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F]" />
                            </div>
                            <button type="submit" className="w-full py-3 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Entrar</button>
                            
                            <div className="flex flex-col gap-2 mt-4 text-center">
                                <button type="button" onClick={() => setView('FORGOT')} className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-[#E3000F] dark:hover:text-[#E3000F] transition-colors">Esqueci minha senha</button>
                                <div className="border-t border-neutral-100 dark:border-neutral-800 my-2"></div>
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">Ainda não tem acesso?</span>
                                <button type="button" onClick={() => setView('REGISTER')} className="text-sm font-bold text-[#E3000F] hover:text-red-700 transition-colors">Cadastre-se agora</button>
                            </div>
                        </form>
                    )}

                    {view === 'REGISTER' && (
                        <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-3 mb-4"><button type="button" onClick={() => setView('LOGIN')} className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"><ArrowLeft size={18} /></button><h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">Criar Nova Conta</h3></div>
                            <div className="space-y-3">
                                <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Nome Completo</label><div className="relative mt-1"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Ex: João da Silva" className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] uppercase text-sm" /></div></div>
                                <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Login (Inicia com 9 ou F)</label><div className="relative mt-1"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="text" value={regUser} onChange={e => setRegUser(e.target.value)} placeholder="Ex: F123456 ou 98765432" className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] uppercase text-sm font-mono" /></div></div>
                                <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">E-mail <span className="text-[#E3000F]">*</span></label><div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Ex: seucorporat@claro.com.br" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" /></div></div>
                                <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Celular <span className="text-[#E3000F]">*</span></label><div className="relative mt-1"><Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="text" maxLength={15} value={regPhone} onChange={e => {
                                    let v = e.target.value.replace(/\D/g, '');
                                    if (v.length > 11) v = v.slice(0, 11);
                                    let masked = v;
                                    if (v.length > 7) masked = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
                                    else if (v.length > 2) masked = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                                    setRegPhone(masked);
                                }} placeholder="Ex: (11) 90000-0000" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm font-mono" /></div></div>
                                <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Data de Nascimento <span className="text-[#E3000F]">*</span></label><div className="relative mt-1"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="date" value={regBirthDate} onChange={e => setRegBirthDate(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" /></div></div>
                                <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Código da Loja <span className="text-[#E3000F]">*</span></label><div className="relative mt-1"><Store className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="text" value={regStoreCode} onChange={e => setRegStoreCode(e.target.value.toUpperCase())} placeholder="Solicite ao Gerente" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm font-mono" /></div></div>
                                <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Senha <span className="text-[#E3000F]">*</span></label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="password" value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="Crie com mínimo de 6 caracteres" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" /></div></div>
                                <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">CONFIRME A SENHA <span className="text-[#E3000F]">*</span></label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="password" value={regConfirmPass} onChange={e => setRegConfirmPass(e.target.value)} placeholder="Crie com mínimo de 6 caracteres" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" /></div></div>
                            </div>
                            <button type="submit" className="w-full py-3 mt-2 bg-neutral-900 dark:bg-neutral-800 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-neutral-700 transition-colors shadow-lg">Realizar Cadastro</button>
                        </form>
                    )}

                    {view === 'FORGOT' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-4"><button type="button" onClick={() => { setView('LOGIN'); setForgotStep(1); }} className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"><ArrowLeft size={18} /></button><h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">Recuperação de Senha</h3></div>
                            {forgotStep === 1 && (
                                <form onSubmit={handleForgotRequest} className="space-y-4">
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Informe seu Login e E-mail cadastrado para enviarmos um código de verificação.</p>
                                    <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Seu Login</label><div className="relative mt-1"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="text" value={forgotUser} onChange={e => setForgotUser(e.target.value)} placeholder="Ex: F123456 ou 98765432" className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] uppercase text-sm font-mono" /></div></div>
                                    <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">E-mail Cadastrado <span className="text-[#E3000F]">*</span></label><div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Ex: emailcorporativo@claro.com.br" required className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" /></div></div>
                                    <button type="submit" className="w-full py-3 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Enviar E-mail de Verificação</button>
                                </form>
                            )}
                            {forgotStep === 2 && (
                                <form onSubmit={handleForgotReset} className="space-y-4">
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg text-sm text-green-700 dark:text-green-400 flex items-start gap-2 mb-2"><Mail size={18} className="shrink-0 mt-0.5" /><p>Um código de 4 dígitos foi enviado para o seu e-mail. Insira-o abaixo para criar uma nova senha.</p></div>
                                    <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Código de Verificação</label><div className="relative mt-1"><Key className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="text" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-center tracking-widest text-lg font-mono" /></div></div>
                                    <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase ml-1">Nova Senha</label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Digite sua nova senha" className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" /></div></div>
                                    <button type="submit" className="w-full py-3 bg-neutral-900 dark:bg-neutral-800 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-neutral-700 transition-colors shadow-lg">Redefinir Senha</button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 