import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  ExternalLink,
  Search,
  Copy,
  Check,
  ShieldCheck,
  ShoppingCart,
  Headphones,
  Package,
  FileCheck2,
  Building2,
  Lock,
  Sparkles,
  Smartphone,
  Layers,
  Award,
  DollarSign,
  X,
  Radio,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSistemasAPI } from '../services/api.js';
import '../styles/Sistemas/Sistemas.css';

// ----------------------------------------------------------------------------
// LISTA OFICIAL E VALIDADA DE SISTEMAS CLARO TELECOM (2026)
// ----------------------------------------------------------------------------
const SISTEMAS_OFICIAIS = [
  {
    name: 'SIMPLIFICA',
    url: 'https://vendasapp.claro.com.br/SVCv2/posicionamento/resultado-pesquisa',
    category: 'Vendas',
    desc: 'Consulta de cobertura, viabilidade e posicionamento de vendas Claro.',
    icon: 'ShoppingCart',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
  },
  {
    name: 'IW',
    url: 'https://iw.claro.com.br/',
    category: 'Atendimento',
    desc: 'Atendimento e gerenciamento de senhas de loja própria.',
    icon: 'Headphones',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  {
    name: 'SOLAR',
    url: 'https://cec.claro.com.br/',
    category: 'Atendimento',
    desc: 'Portal de relacionamento e atendimento CEC ao cliente Claro.',
    icon: 'Headphones',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  {
    name: 'MOBILE',
    url: 'http://mtaweb.claro.com.br:20010/docroot/login/login.jsp',
    category: 'Estoque',
    desc: 'Sistema de gestão MTAWeb de aparelhos e movimentação móvel.',
    icon: 'Smartphone',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  },
  {
    name: 'ESTOQUE',
    url: 'http://clarounifica/portal/',
    category: 'Estoque',
    desc: 'Portal Claro Unifica de inventário, SIMCards e aparelhos.',
    icon: 'Package',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  },
  {
    name: 'NET-SALES',
    url: 'https://netsalesapp.claro.com.br/',
    category: 'Vendas',
    desc: 'Plataforma oficial de emissão e ativação de vendas Claro Residencial.',
    icon: 'ShoppingCart',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
  },
  {
    name: 'NET-SMS',
    url: 'https://netsmsapp.claro.com.br/Citrix/NetsmsEPSWeb/',
    category: 'Atendimento',
    desc: 'Acesso via Citrix para suporte e atendimento técnico EPS Net-SMS.',
    icon: 'Headphones',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  {
    name: 'GED 2.0',
    url: 'https://www.novoged.claro.com.br/login',
    category: 'Auditoria',
    desc: 'Novo portal de gestão eletrônica de documentos e auditoria de contratos.',
    icon: 'FileCheck2',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
  },
  {
    name: 'SIMULADOR',
    url: 'https://produtos.claro.com.br/simular-precos',
    category: 'Vendas',
    desc: 'Simulador online de preços, planos móveis, combos e ofertas Claro.',
    icon: 'DollarSign',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
  },
  {
    name: 'CONEXÃO',
    url: 'https://app.conexaoclarobrasil.com.br/login?',
    category: 'Corporativo',
    desc: 'Comunicação interna, notícias e comunicados da Claro Brasil.',
    icon: 'Building2',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
  },
  {
    name: 'NEGOCIA FACIL',
    url: 'https://claro.negociafacil.com.br/',
    category: 'Atendimento',
    desc: 'Portal de renegociação de faturas, acordos e débitos de clientes.',
    icon: 'Headphones',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  {
    name: 'CLARO FLEX',
    url: 'https://flex.claro.com.br',
    category: 'Vendas',
    desc: 'Plataforma oficial do plano 100% digital Claro Flex.',
    icon: 'ShoppingCart',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
  },
  {
    name: 'PS8',
    url: 'http://ps8web:8080/psp/p01ps1/?cmd=login&languageCd=POR',
    category: 'Auditoria',
    desc: 'Sistema legado PeopleSoft para consultas operacionais de contratos.',
    icon: 'FileText',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
  },
  {
    name: 'CLARO AUTENTICA',
    url: 'https://claro-link.brsafe.com.br/#/',
    category: 'Auditoria',
    desc: 'Biometria facial, validação documental e esteira anti-fraude BRSafe.',
    icon: 'ShieldCheck',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
  },
  {
    name: 'WPP-PRE-PAGO',
    url: 'https://wppnacional.claro.com.br/wpp/login.jsp',
    category: 'Vendas',
    desc: 'Ativação nacional e cadastro de linhas pré-pagas Claro.',
    icon: 'ShoppingCart',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
  },
  {
    name: 'FEV',
    url: 'http://feu.claro.com.br/portal/site/vendas/Autenticador',
    category: 'Vendas',
    desc: 'Ferramenta de esteira de vendas e autenticação de balcão FEU.',
    icon: 'ShoppingCart',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
  },
  {
    name: 'TROCAFY',
    url: 'https://sav.wooza.com.br/claro/negotiations-exchanges/negotiations-trade-in',
    category: 'Estoque',
    desc: 'Avaliação técnica e negociação de aparelhos usados (Trade-In).',
    icon: 'Smartphone',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  },
  {
    name: 'SPS WEB',
    url: 'https://spsweb.claro.com.br/',
    category: 'Estoque',
    desc: 'Gerenciamento logístico e movimentações de estoque SPS.',
    icon: 'Package',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  },
  {
    name: 'PORTAL RCV',
    url: 'https://atendchat.claro.com.br/RCV/login/',
    category: 'Atendimento',
    desc: 'Atendimento via chat e suporte a chamados da operação RCV.',
    icon: 'Headphones',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  {
    name: 'IGA (IBM)',
    url: 'https://iga-claro.identitynow.com/ui/d/mysailpoint',
    category: 'Corporativo',
    desc: 'Gerenciamento de identidades, acessos e perfis SailPoint.',
    icon: 'Lock',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
  },
  {
    name: 'PORTAL CONTROLE',
    url: 'http://auto-controle/autocontrole/login.jsp',
    category: 'Auditoria',
    desc: 'Autocontrole interno e checagem de regras de negócios.',
    icon: 'ShieldCheck',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
  },
  {
    name: 'CLARO CLUBE',
    url: 'http://claroclube/home.jsp?mensagem=',
    category: 'Atendimento',
    desc: 'Programa de pontos, benefícios e vantagens para clientes Claro.',
    icon: 'Award',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  {
    name: 'GED ANTIGO',
    url: 'https://ged.claro.com.br/autenticar.php',
    category: 'Auditoria',
    desc: 'Consulta histórica de contratos e assinaturas legadas.',
    icon: 'FileText',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
  },
  {
    name: 'PORTAL CLARO',
    url: 'http://portalclarobrasil/',
    category: 'Corporativo',
    desc: 'Intranet corporativa Claro Brasil para procedimentos e circulares.',
    icon: 'Building2',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
  },
  {
    name: 'CEMI',
    url: 'https://cemi/mudancastatus/jsp/login.jsp',
    category: 'Atendimento',
    desc: 'Controle de mudanças de status de clientes e esteiras técnicas.',
    icon: 'Headphones',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  {
    name: 'RH SOLUTIONS',
    url: 'https://portalrh.claro.com.br/ords/rhportal/rhlgweb.show',
    category: 'Corporativo',
    desc: 'Portal de Recursos Humanos, holerites, espelho de ponto e benefícios.',
    icon: 'Building2',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
  },
  {
    name: 'CONEXÃO APRENDER',
    url: 'https://hdim.fa.us2.oraclecloud.com/fscmUI/redwood/learner/learn/browse-learning-items',
    category: 'Corporativo',
    desc: 'Universidade corporativa Claro para cursos, treinamentos e certificações.',
    icon: 'Sparkles',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
  },
  {
    name: 'RCV PRIORIDADES',
    url: 'https://atendchat.claro.com.br/RCV-prioridades/',
    category: 'Atendimento',
    desc: 'Canal direto para tratativas prioritárias e contingências RCV.',
    icon: 'Headphones',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  {
    name: 'CADASTRO PRÉ-PAGO',
    url: 'https://www.claro.com.br/cadastroprepago/login-telefone',
    category: 'Vendas',
    desc: 'Validação e regularização cadastral de números pré-pagos.',
    icon: 'ShoppingCart',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
  },
  {
    name: 'MINHA EMPRESA',
    url: 'https://minhaempresas.claro.com.br/',
    category: 'Corporativo',
    desc: 'Autoatendimento e gestão corporativa para clientes PME e Empresas.',
    icon: 'Building2',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
  },
  {
    name: 'MINHA CLARO',
    url: 'https://auth.claro.com.br/authorize?client_id=INT_AA_PORTALUNICO&response_type=code&scope=openid+minha_claro_dig+minha_net+net_devices+net_profile&redirect_uri=https%3A%2F%2Fclaro.com.br%2Fminha%2Farea-logada%2Fauth%2Fcallback&grant_type=authorization_code&nonce=abc123',
    category: 'Atendimento',
    desc: 'Portal de autoatendimento Minha Claro para pessoa física.',
    icon: 'Headphones',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
  }
];

const CATEGORIAS = [
  { id: 'TODOS', label: 'Todos os Sistemas', icon: Layers },
  { id: 'Vendas', label: 'Vendas & Ativação', icon: ShoppingCart },
  { id: 'Estoque', label: 'Aparelhos & Estoque', icon: Package },
  { id: 'Atendimento', label: 'Atendimento & Suporte', icon: Headphones },
  { id: 'Auditoria', label: 'Auditoria & Contratos', icon: ShieldCheck },
  { id: 'Corporativo', label: 'Corporativo & Gestão', icon: Building2 }
];

export const Sistemas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [sistemasLinks, setSistemasLinks] = useState(SISTEMAS_OFICIAIS);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSistemas = async () => {
      try {
        const data = await getSistemasAPI();
        if (Array.isArray(data) && data.length > 0) {
          // Mescla com a base rica de metadados
          const merged = data.map((remote) => {
            const local = SISTEMAS_OFICIAIS.find(
              (l) => l.name.toUpperCase() === remote.name.toUpperCase()
            );
            return {
              ...remote,
              category: remote.category || local?.category || 'Corporativo',
              desc: local?.desc || 'Plataforma oficial Claro Telecom.',
              icon: local?.icon || 'Globe',
              badgeColor: local?.badgeColor || 'bg-neutral-500/10 text-neutral-600 border-neutral-500/30'
            };
          });
          setSistemasLinks(merged);
        }
      } catch (err) {
        // Fallback silencioso já ativo com SISTEMAS_OFICIAIS
      }
    };

    fetchSistemas();
  }, []);

  // Helper para copiar link
  const handleCopyLink = (e, sys) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(sys.url);
      setCopiedUrl(sys.url);
      toast.success(`Link de "${sys.name}" copiado com sucesso!`, {
        icon: '📋',
        duration: 3000
      });
      setTimeout(() => {
        setCopiedUrl(null);
      }, 2500);
    } else {
      toast.error('Não foi possível acessar a área de transferência.');
    }
  };

  // Helper para renderizar ícone dinâmico
  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'ShoppingCart':
        return <ShoppingCart size={22} />;
      case 'Headphones':
        return <Headphones size={22} />;
      case 'Smartphone':
        return <Smartphone size={22} />;
      case 'Package':
        return <Package size={22} />;
      case 'FileCheck2':
        return <FileCheck2 size={22} />;
      case 'DollarSign':
        return <DollarSign size={22} />;
      case 'Building2':
        return <Building2 size={22} />;
      case 'ShieldCheck':
        return <ShieldCheck size={22} />;
      case 'Award':
        return <Award size={22} />;
      case 'Lock':
        return <Lock size={22} />;
      case 'Sparkles':
        return <Sparkles size={22} />;
      case 'FileText':
        return <FileText size={22} />;
      default:
        return <Globe size={22} />;
    }
  };

  // Helper para formatar domínio limpo
  const cleanDomain = (url) => {
    try {
      const u = new URL(url);
      return u.hostname;
    } catch {
      return url.replace(/^https?:\/\//i, '').split('/')[0] || url;
    }
  };

  // Filtros combinados (busca + categoria)
  const filteredLinks = useMemo(() => {
    return sistemasLinks.filter((sys) => {
      const matchesSearch =
        sys.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sys.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sys.desc && sys.desc.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat =
        selectedCategory === 'TODOS' || sys.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [sistemasLinks, searchTerm, selectedCategory]);

  return (
    <div className="sistemas-container p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* BANNER INSTITUCIONAL E CABEÇALHO LÚDICO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-red-950 border border-red-900/40 p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-8 -top-8 w-52 h-52 bg-[#E3000F]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-[11px] font-black uppercase tracking-widest">
              <Sparkles size={13} className="text-red-400 animate-pulse" />
              PORTAL DE SISTEMAS TELECOM
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Hub Central de Ferramentas
              <span className="text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono font-bold">
                {sistemasLinks.length} Plataformas
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Acesso rápido com um clique e links oficiais para vendas, estoque, esteiras de proposta, atendimento ao cliente e suporte operacional Claro.
            </p>
          </div>

          {/* BARRA DE PESQUISA ELEGANTE */}
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Pesquisar sistema ou URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-neutral-900/90 text-white placeholder-neutral-500 border border-neutral-700 rounded-2xl text-xs sm:text-sm outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* FILTROS POR CATEGORIAS (PILLS LÚDICAS) */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIAS.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === 'TODOS'
                ? sistemasLinks.length
                : sistemasLinks.filter((s) => s.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-[#E3000F] text-white shadow-lg shadow-red-600/30 scale-102 font-black'
                    : 'bg-neutral-900/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <IconComp size={14} className={isSelected ? 'text-white' : 'text-neutral-400'} />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GRID DE CARDS COM DESIGN LÚDICO & ELEGANTE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {filteredLinks.length === 0 ? (
          <div className="col-span-full py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
              <Search size={28} />
            </div>
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100">
              Nenhum sistema encontrado
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm">
              Não encontramos resultados para "<strong>{searchTerm}</strong>". Tente buscar por outro termo ou mude a categoria selecionada.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('TODOS');
              }}
              className="px-4 py-2 bg-neutral-900 dark:bg-neutral-800 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          filteredLinks.map((sys) => {
            const isHttps = sys.url.startsWith('https://');
            const isCopied = copiedUrl === sys.url;

            return (
              <div
                key={sys.name}
                className="group relative bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800/80 p-5 shadow-sm hover:shadow-xl hover:border-red-500/50 dark:hover:border-red-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1"
              >
                {/* Efeito Glow no Hover */}
                <div className="absolute -right-12 -top-12 w-28 h-28 bg-[#E3000F]/10 rounded-full blur-2xl group-hover:bg-[#E3000F]/20 transition-all pointer-events-none" />

                <div className="space-y-4">
                  {/* TOPO DO CARD: CATEGORIA & INDICADOR DE REDE */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        sys.badgeColor || 'bg-neutral-100 text-neutral-600 border-neutral-200'
                      }`}
                    >
                      {sys.category}
                    </span>

                    {isHttps ? (
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20"
                        title="Conexão HTTPS Criptografada"
                      >
                        <ShieldCheck size={11} /> HTTPS
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/20"
                        title="Acesso via Rede Interna / Intranet Claro"
                      >
                        <Radio size={11} /> Intranet
                      </span>
                    )}
                  </div>

                  {/* IDENTIDADE DO SISTEMA */}
                  <div className="flex items-start gap-3.5 pt-1">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-center text-[#E3000F] group-hover:bg-[#E3000F] group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                      {renderIcon(sys.icon)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-100 tracking-tight uppercase truncate group-hover:text-[#E3000F] transition-colors">
                        {sys.name}
                      </h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate mt-0.5" title={sys.url}>
                        {cleanDomain(sys.url)}
                      </p>
                    </div>
                  </div>

                  {/* DESCRIÇÃO FUNCIONAL */}
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2 min-h-[32px]">
                    {sys.desc}
                  </p>
                </div>

                {/* BOTÕES DE AÇÃO: COPIAR LINK & ACESSAR */}
                <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                  {/* BOTÃO COPIAR LINK */}
                  <button
                    onClick={(e) => handleCopyLink(e, sys)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      isCopied
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                        : 'bg-neutral-50 dark:bg-neutral-800/70 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                    }`}
                    title="Copiar URL para a Área de Transferência"
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} className="text-white" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {/* BOTÃO ACESSAR SISTEMA */}
                  <a
                    href={sys.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-black bg-[#E3000F] hover:bg-red-700 text-white shadow-md shadow-red-500/20 hover:shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 shrink-0"
                    title={`Abrir ${sys.name} em nova aba`}
                  >
                    <span>Acessar</span>
                    <ExternalLink size={13} className="shrink-0" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default Sistemas;
