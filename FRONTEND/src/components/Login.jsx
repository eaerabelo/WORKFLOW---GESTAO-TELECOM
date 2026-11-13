import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, ArrowLeft, Key, Mail, Calendar, Smartphone, Store, Activity, ShieldCheck, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginAPI, solicitarRecuperacaoAPI, resetarSenhaAPI, solicitarCadastroAPI, efetivarCadastroAPI, fetchStatus } from '../services/api.js';
import wfLogo from '../assets/logo_WF.png';
import desktopBg from '../assets/DESKTOP_PAGE.jpeg';
import mobileBg from '../assets/MOBILE_PAGE.jpg';

/**
 * 1. COMPONENTE DA LOGO ANIMADA (Escrita e Desescrita Contínua)
 */
export const AnimatedWFLogo = ({ className = "w-36 h-24", duration = 6.2, delay = 0 }) => {
  const uid = useRef(`wf-${Math.random().toString(36).substring(2, 9)}`).current;

  return (
    <>
      <style>{`
        @keyframes wfWriteErase1 {
          0%, 4% { stroke-dashoffset: 100; opacity: 0; }
          6% { opacity: 1; }
          22%, 72% { stroke-dashoffset: 0; opacity: 1; }
          88%, 100% { stroke-dashoffset: -100; opacity: 0; }
        }
        @keyframes wfWriteErase2 {
          0%, 14% { stroke-dashoffset: 100; opacity: 0; }
          16% { opacity: 1; }
          36%, 74% { stroke-dashoffset: 0; opacity: 1; }
          90%, 100% { stroke-dashoffset: -100; opacity: 0; }
        }
        @keyframes wfWriteErase3 {
          0%, 26% { stroke-dashoffset: 100; opacity: 0; }
          28% { opacity: 1; }
          46%, 76% { stroke-dashoffset: 0; opacity: 1; }
          92%, 100% { stroke-dashoffset: -100; opacity: 0; }
        }
        @keyframes wfWriteErase4 {
          0%, 36% { stroke-dashoffset: 100; opacity: 0; }
          38% { opacity: 1; }
          56%, 78% { stroke-dashoffset: 0; opacity: 1; }
          94%, 100% { stroke-dashoffset: -100; opacity: 0; }
        }
        @keyframes wfArrowPop {
          0%, 50% { opacity: 0; transform: translate(-14px, 10px) scale(0.45); }
          60%, 78% { opacity: 1; transform: translate(0px, 0px) scale(1); }
          92%, 100% { opacity: 0; transform: translate(12px, -8px) scale(0.6); }
        }

        .wf-stroke-1 {
          stroke-dasharray: 100;
          animation: wfWriteErase1 var(--cycle, 6.2s) cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: var(--delay, 0s);
        }
        .wf-stroke-2 {
          stroke-dasharray: 100;
          animation: wfWriteErase2 var(--cycle, 6.2s) cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: var(--delay, 0s);
        }
        .wf-stroke-3 {
          stroke-dasharray: 100;
          animation: wfWriteErase3 var(--cycle, 6.2s) cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: var(--delay, 0s);
        }
        .wf-stroke-4 {
          stroke-dasharray: 100;
          animation: wfWriteErase4 var(--cycle, 6.2s) cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: var(--delay, 0s);
        }
        .wf-arrowhead {
          transform-box: fill-box;
          transform-origin: center;
          animation: wfArrowPop var(--cycle, 6.2s) cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
          animation-delay: var(--delay, 0s);
        }
      `}</style>

      <svg
        viewBox="0 0 520 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ '--cycle': `${duration}s`, '--delay': `${delay}s` }}
      >
        <defs>
          <linearGradient id={`${uid}-leftGrad`} x1="90" y1="60" x2="225" y2="265" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF9E00" />
            <stop offset="55%" stopColor="#FF7700" />
            <stop offset="100%" stopColor="#E04800" />
          </linearGradient>

          <linearGradient id={`${uid}-loopGrad`} x1="165" y1="265" x2="310" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF7B00" />
            <stop offset="50%" stopColor="#FF4D00" />
            <stop offset="100%" stopColor="#E61E14" />
          </linearGradient>

          <linearGradient id={`${uid}-rightUGrad`} x1="275" y1="175" x2="395" y2="265" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D9230F" />
            <stop offset="50%" stopColor="#E61919" />
            <stop offset="100%" stopColor="#DF1522" />
          </linearGradient>

          <linearGradient id={`${uid}-arrowRibbonTop`} x1="272" y1="185" x2="435" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF6D00" />
            <stop offset="45%" stopColor="#F52814" />
            <stop offset="100%" stopColor="#E3121E" />
          </linearGradient>

          <linearGradient id={`${uid}-arrowRibbonFold`} x1="315" y1="185" x2="445" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D8220E" />
            <stop offset="100%" stopColor="#B80818" />
          </linearGradient>

          <mask id={`${uid}-weaveMask`}>
            <rect x="0" y="0" width="520" height="320" fill="white" />
            <path d="M 162 222 L 245 72" stroke="black" strokeWidth="38" strokeLinecap="round" />
            <path d="M 162 200 C 154 228, 158 258, 178 274" stroke="black" strokeWidth="36" strokeLinecap="round" />
          </mask>
        </defs>

        <g mask={`url(#${uid}-weaveMask)`}>
          <path d="M 162 248 L 106 135 C 88 96, 142 66, 164 108 L 222 220" stroke={`url(#${uid}-leftGrad)`} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" pathLength="100" className="wf-stroke-1" />
        </g>

        <path d="M 278 182 L 306 234 C 322 263, 358 263, 374 234 L 402 178" stroke={`url(#${uid}-rightUGrad)`} strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" pathLength="100" className="wf-stroke-3" />

        <path d="M 232 98 C 250 64, 304 92, 286 126 L 228 234 C 210 268, 156 240, 174 206 Z" stroke={`url(#${uid}-loopGrad)`} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" pathLength="100" className="wf-stroke-2" />

        <path d="M 278 168 C 292 198, 326 196, 342 162 C 360 124, 386 102, 418 98" stroke={`url(#${uid}-arrowRibbonFold)`} strokeWidth="22" strokeLinecap="round" pathLength="100" className="wf-stroke-4" />
        <path d="M 275 162 C 290 192, 322 190, 338 154 C 356 114, 382 88, 416 84" stroke={`url(#${uid}-arrowRibbonTop)`} strokeWidth="18" strokeLinecap="round" pathLength="100" className="wf-stroke-4" />

        <g className="wf-arrowhead">
          <path d="M 388 42 L 464 78 L 404 96 L 388 42 Z" fill="#E51520" />
          <path d="M 404 96 L 464 78 L 402 142 L 404 96 Z" fill="#C50B18" />
        </g>
      </svg>
    </>
  );
};

/**
 * 2. COMPONENTE DE BACKGROUND (Fundo Preto Puro + Canvas de Partículas e Ondas Reativas)
 */
export const AnimatedBackground = ({ children }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };
    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.5 + 0.8,
      vx: (Math.random() - 0.3) * 0.35,
      vy: -(Math.random() * 0.45 + 0.15),
      alpha: Math.random() * 0.6 + 0.2,
      hue: Math.random() > 0.4 ? '#FF7A00' : '#E51520',
    }));

    let time = 0;
    const render = () => {
      time += 0.008;
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const spotGrad = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, 480);
      spotGrad.addColorStop(0, 'rgba(255, 110, 0, 0.13)');
      spotGrad.addColorStop(0.5, 'rgba(229, 21, 32, 0.06)');
      spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const yOffset = height * (0.25 + i * 0.25);
        ctx.moveTo(0, yOffset);
        for (let x = 0; x <= width; x += 40) {
          const y =
            yOffset +
            Math.sin(x * 0.0025 + time + i * 1.5) * 50 +
            Math.cos(x * 0.0012 - time * 0.7) * 30;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = i === 1 ? 'rgba(229, 21, 32, 0.14)' : 'rgba(255, 136, 0, 0.12)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) p.y = height + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.x < -10) p.x = width + 10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hue;
        ctx.globalAlpha = p.alpha * (0.6 + Math.sin(time * 2 + p.x) * 0.4);
        ctx.shadowColor = p.hue;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Lista de posições dos logotipos WF espalhados no fundo com tempos assíncronos
  const bgLogos = [
    { top: '8%', left: '6%', scale: 'scale-95', rot: '-rotate-6', dur: 7.4, delay: 0.2, opacity: 'opacity-[0.16]' },
    { top: '65%', left: '5%', scale: 'scale-110', rot: 'rotate-3', dur: 8.2, delay: 1.5, opacity: 'opacity-[0.14]' },
    { top: '12%', right: '7%', scale: 'scale-100', rot: 'rotate-6', dur: 7.8, delay: 0.8, opacity: 'opacity-[0.16]' },
    { top: '70%', right: '6%', scale: 'scale-90', rot: '-rotate-3', dur: 8.6, delay: 2.1, opacity: 'opacity-[0.14]' },
    { top: '38%', left: '15%', scale: 'scale-75', rot: 'rotate-2', dur: 9.0, delay: 1.1, opacity: 'opacity-[0.09]' },
    { top: '42%', right: '16%', scale: 'scale-75', rot: '-rotate-3', dur: 8.4, delay: 2.7, opacity: 'opacity-[0.09]' },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#000000] text-slate-100 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Camada do Canvas (Ondas e Partículas) */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" />

      {/* Camada dos Logos WF Flutuando no Fundo */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {bgLogos.map((item, idx) => (
          <div
            key={idx}
            style={{ top: item.top, left: item.left, right: item.right }}
            className={`absolute ${item.scale} ${item.rot} ${item.opacity}`}
          >
            <AnimatedWFLogo className="w-64 h-44" duration={item.dur} delay={item.delay} />
          </div>
        ))}
      </div>

      {/* Conteúdo Central */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

const formatErrorMsg = (err, fallback) => {
    const msg = String(err?.message || err || '');
    if (
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('networkerror') ||
        msg.toLowerCase().includes('load failed') ||
        msg.toLowerCase().includes('servidor fora')
    ) {
        return 'SERVIDOR FORA MOMENTANEAMENTE, TENTE NOVAMENTE MAIS TARDE...';
    }
    return msg || fallback;
};

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
            toast.error(formatErrorMsg(error, 'Erro ao realizar login.'));
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
            toast.error(formatErrorMsg(error, 'Falha ao solicitar cadastro.'), { id: 'regEmailToast', duration: 8000 });
        }
    };

    const handleRegisterCodeVerify = async (e) => {
        e.preventDefault();
        const { registrationToken, email, setupKey, userUpper } = tempRegData;

        try {
            await efetivarCadastroAPI(email, regCurrentCode, registrationToken);
            toast.success(setupKey === 'lideranca2026' ? 'CONTA DE GERENTE CRIADA COM SUCESSO!' : 'CADASTRO REALIZADO COM SUCESSO. Faça seu login!');
        } catch (error) {
            toast.error(formatErrorMsg(error, 'Código inválido ou incorreto. Verifique seu e-mail novamente.'));
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
            toast.error(formatErrorMsg(error, 'Falha ao solicitar recuperação.'), { id: 'emailToast' });
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
            toast.error(formatErrorMsg(error, 'Código inválido ou expirado.'));
        }
    };

    return (
        <AnimatedBackground>

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

            <div className="w-full max-w-md rounded-3xl bg-[#090b10]/90 backdrop-blur-2xl border border-white/10 ring-1 ring-white/5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_40px_rgba(227,0,15,0.12)] overflow-hidden transition-all duration-500 relative z-10">
                {/* Filete luminoso decorativo superior */}
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#E3000F] to-transparent opacity-90" />

                <div className="pt-6 pb-4 px-6 text-center relative overflow-hidden">
                    {/* Glow sutil por trás do logo */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-28 bg-[#E3000F]/15 blur-3xl pointer-events-none rounded-full" />

                    <div className="w-52 h-20 mx-auto mb-2 flex items-center justify-center relative">
                        <AnimatedWFLogo className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-wider">WorkFlow</h2>
                    <p className="text-neutral-400 text-[11px] font-semibold uppercase tracking-widest mt-0.5">Plataforma Integrada de Gestão Telecom</p>

                    {/* SELO DE SEGURANÇA */}
                    <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/50 rounded-full text-[10.5px] uppercase tracking-wider text-emerald-300 shadow-md shadow-emerald-500/20 backdrop-blur-md">
                        <ShieldCheck size={14} className="text-emerald-400 shrink-0" strokeWidth={2.5} />
                        <span className="font-extrabold tracking-wide text-emerald-300">ACESSO AO SISTEMA SEGURO E AUTENTICADO</span>
                    </div>
                </div>

                <div className="px-7 pb-7 pt-2">
                    {view === 'LOGIN' && (
                        <div className="animate-fade-in">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <h3 className="font-bold text-sm text-neutral-300 mb-3 text-center uppercase tracking-wider">Acesso ao Painel</h3>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="Usuário ( Login )" required className="w-full pl-10 pr-4 py-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-white placeholder-neutral-500 rounded-xl outline-none uppercase text-sm font-medium transition-all" />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Senha de Acesso" required className="w-full pl-10 pr-4 py-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-white placeholder-neutral-500 rounded-xl outline-none text-sm transition-all" />
                                </div>
                                <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-[#E3000F] to-red-700 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-800 transition-all shadow-lg shadow-red-600/30 active:scale-[0.99] text-sm tracking-wide">Entrar no Sistema</button>

                                <div className="flex flex-col gap-2 mt-4 text-center">
                                    <button type="button" onClick={() => setView('FORGOT')} className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors">Esqueci minha senha</button>
                                    <div className="border-t border-white/10 my-2"></div>
                                    <span className="text-xs text-neutral-400">Ainda não tem acesso?</span>
                                    <button type="button" onClick={() => setView('REGISTER')} className="text-xs font-bold text-[#E3000F] hover:text-red-400 transition-colors uppercase tracking-wider">Cadastre-se agora</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {view === 'REGISTER' && (
                        <div className="animate-fade-in">
                            {regStep === 1 && (
                                <form onSubmit={handleRegister} className="space-y-3.5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <button type="button" onClick={() => setView('LOGIN')} className="p-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-neutral-300 transition-colors">
                                            <ArrowLeft size={18} />
                                        </button>
                                        <h3 className="font-bold text-base text-white">Criar Nova Conta</h3>
                                    </div>
                                    <div className="space-y-2.5">
                                        <div>
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 ml-1">Nome Completo <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Ex: João da Silva" required className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 focus:border-[#E3000F] text-white placeholder-neutral-500 rounded-xl outline-none uppercase text-sm transition-all" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 ml-1">Usuário / Login <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="text" value={regUser} onChange={e => setRegUser(e.target.value)} placeholder="Inicia com 9, F, Z ou T" required className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 focus:border-[#E3000F] text-white placeholder-neutral-500 rounded-xl outline-none uppercase text-sm font-mono transition-all" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 ml-1">E-mail <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Ex: seunome@corporativo.com.br" required className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 focus:border-[#E3000F] text-white placeholder-neutral-500 rounded-xl outline-none text-sm transition-all" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 ml-1">Celular <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="text" maxLength={15} value={regPhone} onChange={e => {
                                                    let v = e.target.value.replace(/\D/g, '');
                                                    if (v.length > 11) v = v.slice(0, 11);
                                                    let masked = v;
                                                    if (v.length > 7) masked = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
                                                    else if (v.length > 2) masked = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                                                    setRegPhone(masked);
                                                }} placeholder="Ex: (11) 90000-0000" required className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 focus:border-[#E3000F] text-white placeholder-neutral-500 rounded-xl outline-none text-sm font-mono transition-all" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 ml-1">Data de Nascimento (18+ Anos) <span className="text-[#E3000F]">*</span></label>
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
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 focus:border-[#E3000F] text-white rounded-xl outline-none text-sm transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 ml-1">Código da Loja <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="text" value={regStoreCode} onChange={e => setRegStoreCode(e.target.value.toUpperCase())} placeholder="Solicite ao Gerente (Ex: AT1M)" required className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 focus:border-[#E3000F] text-white placeholder-neutral-500 rounded-xl outline-none text-sm font-mono uppercase transition-all" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 ml-1">Senha <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="password" value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="Mínimo 8 caracteres, letras, números e símbolos" required className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 focus:border-[#E3000F] text-white placeholder-neutral-500 rounded-xl outline-none text-sm transition-all" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 ml-1">Confirme a Senha <span className="text-[#E3000F]">*</span></label>
                                            <div className="relative mt-0.5">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
                                                <input type="password" value={regConfirmPass} onChange={e => setRegConfirmPass(e.target.value)} placeholder="Confirme a mesma senha" required className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 focus:border-[#E3000F] text-white placeholder-neutral-500 rounded-xl outline-none text-sm transition-all" />
                                            </div>
                                        </div>

                                        {/* TERMOS DE USO E PRIVACIDADE */}
                                        <div className="pt-2 pb-1 border-t border-white/10">
                                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={acceptedTerms}
                                                    onChange={e => setAcceptedTerms(e.target.checked)}
                                                    required
                                                    className="mt-0.5 w-4 h-4 rounded text-[#E3000F] focus:ring-[#E3000F] cursor-pointer"
                                                />
                                                <span className="text-xs text-neutral-300 leading-tight">
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
                                    <button type="submit" className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/10 transition-colors shadow-lg">Continuar Cadastro</button>
                                </form>
                            )}
                            {regStep === 2 && (
                                <form onSubmit={handleRegisterCodeVerify} className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <button type="button" onClick={() => { setRegStep(1); setRegCurrentCode(''); setTempRegData(null); }} className="p-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-neutral-300 transition-colors">
                                            <ArrowLeft size={18} />
                                        </button>
                                        <h3 className="font-bold text-base text-white">Confirmar E-mail</h3>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-xs text-red-300 flex items-start gap-2 mb-4">
                                        <Mail size={18} className="shrink-0 mt-0.5 text-red-400" />
                                        <p>Enviamos um código de verificação para <strong>{regEmail}</strong>. Insira-o abaixo para concluirmos a criação da sua conta.</p>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider ml-1">Código de Confirmação</label>
                                        <div className="relative mt-1">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                            <input type="text" value={regCurrentCode} onChange={e => setRegCurrentCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 text-white rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-center tracking-widest text-lg font-mono" />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-3 mt-4 bg-gradient-to-r from-[#E3000F] to-red-700 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-800 transition-all shadow-lg shadow-red-600/30">Confirmar e Cadastrar</button>
                                    <button type="button" disabled={resendTimer > 0} onClick={handleRegister} className="w-full py-2 mt-2 bg-transparent text-neutral-400 font-bold rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50 text-xs">
                                        {resendTimer > 0 ? `Aguarde ${resendTimer}s para reenviar` : 'Reenviar Código'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {view === 'FORGOT' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <button type="button" onClick={() => { setView('LOGIN'); setForgotStep(1); }} className="p-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-neutral-300 transition-colors">
                                    <ArrowLeft size={18} />
                                </button>
                                <h3 className="font-bold text-base text-white">Recuperação de Senha</h3>
                            </div>
                            {forgotStep === 1 && (
                                <form onSubmit={handleForgotRequest} className="space-y-4">
                                    <p className="text-xs text-neutral-400 mb-4">Informe seu Login e E-mail cadastrado para enviarmos um código de verificação.</p>
                                    <div><label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider ml-1">Seu Login</label><div className="relative mt-1"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="text" value={forgotUser} onChange={e => setForgotUser(e.target.value)} placeholder="Ex: F123456 ou 98765432" required className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 text-white rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] uppercase text-sm font-mono" /></div></div>
                                    <div><label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider ml-1">E-mail Cadastrado <span className="text-[#E3000F]">*</span></label><div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Ex: email@corporativo.com.br" required className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 text-white rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" /></div></div>
                                    <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#E3000F] to-red-700 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-800 transition-all shadow-lg shadow-red-600/30">Enviar E-mail de Verificação</button>
                                </form>
                            )}
                            {forgotStep === 2 && (
                                <form onSubmit={handleForgotReset} className="space-y-4">
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-300 flex items-start gap-2 mb-2"><Mail size={18} className="shrink-0 mt-0.5 text-emerald-400" /><p>Um código de 4 dígitos foi enviado para o seu e-mail. Insira-o abaixo para criar uma nova senha.</p></div>
                                    <div><label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider ml-1">Código de Verificação</label><div className="relative mt-1"><Key className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="text" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 text-white rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-center tracking-widest text-lg font-mono" /></div></div>
                                    <div><label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider ml-1">Nova Senha</label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Digite sua nova senha" required className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 text-white rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" /></div></div>
                                    <div><label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider ml-1">Confirme a Nova Senha</label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input type="password" value={confirmNewPass} onChange={e => setConfirmNewPass(e.target.value)} placeholder="Confirme sua nova senha" required className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 text-white rounded-xl outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] text-sm" /></div></div>
                                    <button type="submit" className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/10 transition-colors shadow-lg">Redefinir Senha</button>
                                    <button type="button" disabled={resendTimer > 0} onClick={handleForgotRequest} className="w-full py-2 mt-2 bg-transparent text-neutral-400 font-bold rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50 text-xs">
                                        {resendTimer > 0 ? `Aguarde ${resendTimer}s para reenviar` : 'Reenviar Código'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* RODAPÉ DO CARD COM VERSÃO E TERMOS */}
                    <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
                        <span className="font-mono font-bold tracking-tight text-neutral-400">WorkFlow v2.5.0</span>
                        <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="hover:text-white underline transition-colors cursor-pointer"
                        >
                            Termos de Uso & Privacidade
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL DE TERMOS DE USO E PRIVACIDADE */}
            {showTermsModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#0b0d13] w-full max-w-lg rounded-3xl shadow-2xl border border-white/15 p-6 flex flex-col max-h-[85vh] animate-scale-up text-white">
                        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-[#E3000F] border border-red-500/30 flex items-center justify-center shrink-0">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-base text-white">Termos de Uso e Política de Privacidade</h3>
                                <p className="text-xs text-neutral-400">WorkFlow Gestão Telecom • Versão 2.5.0</p>
                            </div>
                        </div>

                        <div className="overflow-y-auto scrollbar-thin py-4 space-y-3.5 text-xs text-neutral-300 leading-relaxed pr-1">
                            <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/10">
                                <h4 className="font-bold text-white uppercase text-[11px] mb-1">1. Finalidade do Sistema</h4>
                                <p>O WorkFlow é uma ferramenta operacional exclusiva para gestão comercial, acompanhamento de metas, controle de simcards, escala e suporte operacional das equipes autorizadas de telecomunicação.</p>
                            </div>

                            <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/10">
                                <h4 className="font-bold text-white uppercase text-[11px] mb-1">2. Confidencialidade e Dados Pessoais (LGPD)</h4>
                                <p>É estritamente vedado o uso das informações para fins alheios à operação. Dados cadastrais e de vendas são armazenados de forma criptografada em banco de dados seguro Oracle com hash Bcrypt e conformidade com a LGPD.</p>
                            </div>

                            <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/10">
                                <h4 className="font-bold text-white uppercase text-[11px] mb-1">3. Responsabilidade do Usuário</h4>
                                <p>A senha de acesso é individual e intransferível. O compartilhamento de credenciais ou simulação de dados acarretará suspensão imediata da conta e comunicação à liderança.</p>
                            </div>

                            <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/10">
                                <h4 className="font-bold text-white uppercase text-[11px] mb-1">4. Auditoria e Rastreabilidade</h4>
                                <p>Todas as ações (lançamentos de vendas, cópias de ICCID e edições de dados) são registradas com data, hora e matrícula do colaborador para integridade da operação.</p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setAcceptedTerms(true);
                                    setShowTermsModal(false);
                                    toast.success('Você deu o ciente nos Termos de Uso.');
                                }}
                                className="px-4 py-2.5 bg-gradient-to-r from-[#E3000F] to-red-700 text-white font-bold rounded-xl text-xs hover:from-red-600 hover:to-red-800 transition-all flex items-center gap-1.5 shadow-md shadow-red-600/30"
                            >
                                <CheckCircle size={15} />
                                Estou Ciente e Concordo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AnimatedBackground>
    );
} 