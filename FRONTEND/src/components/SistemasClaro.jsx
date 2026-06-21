import React, { useState } from 'react';
import { Globe, ExternalLink, Search } from 'lucide-react';
import { SISTEMAS_LINKS } from '../utils/constants';

export const SistemasClaro = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const baseLinks = Array.isArray(SISTEMAS_LINKS) ? SISTEMAS_LINKS : [];
    
    const extraLinks = [
        { name: 'PORTAL CLARO', url: 'http://portalclarobrasil/' },
        { name: 'CEMI', url: 'https://cemi/mudancastatus/jsp/login.jsp' },
        { name: 'RH SOLUTIONS', url: 'https://portalrh.claro.com.br/ords/rhportal/rhlgweb.show' },
        { name: 'CONEXÃO APRENDER', url: 'https://hdim.fa.us2.oraclecloud.com/fscmUI/redwood/learner/learn/browse-learning-items' },
        { name: 'RCV PRIORIDADES', url: 'https://atendchat.claro.com.br/RCV-prioridades/' },
        { name: 'CADASTRO PRÉ-PAGO', url: 'https://www.claro.com.br/cadastroprepago/login-telefone' },
        { name: 'MINHA CLARO EMPRESA', url: 'https://minhaclaroempresas.claro.com.br/' },
        { name: 'MINHA CLARO', url: 'https://auth.claro.com.br/authorize?client_id=INT_AA_PORTALUNICO&response_type=code&scope=openid+minha_claro_dig+minha_net+net_devices+net_profile&redirect_uri=https%3A%2F%2Fclaro.com.br%2Fminha%2Farea-logada%2Fauth%2Fcallback&grant_type=authorization_code&nonce=abc123' }
    ];

    // Junta os links dinamicamente garantindo que não existam duplicados
    const linksSeguros = [...baseLinks, ...extraLinks.filter(ext => !baseLinks.some(base => base.name === ext.name))]
        .sort((a, b) => a.name.localeCompare(b.name));

    const filteredLinks = linksSeguros.filter(sys => sys.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="h-full flex flex-col animate-fade-in transition-colors">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Portal de Sistemas Claro</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Acesso rápido e direto às plataformas e ferramentas corporativas.</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar sistema..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-xl text-sm outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-y-auto pt-2 pb-4 pr-2">
                {filteredLinks.length > 0 ? filteredLinks.map((sys, idx) => (
                    <a
                        key={idx}
                        href={sys.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:border-[#E3000F] dark:hover:border-[#E3000F] hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden h-36"
                    >
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ExternalLink size={16} className="text-[#E3000F]" />
                        </div>
                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 text-[#E3000F] flex items-center justify-center group-hover:bg-[#E3000F] group-hover:text-white transition-colors duration-300">
                            <Globe size={24} />
                        </div>
                        <span className="font-bold text-neutral-700 dark:text-neutral-300 text-[11px] uppercase tracking-wide group-hover:text-neutral-900 dark:group-hover:text-neutral-100 leading-tight">
                            {sys.name}
                        </span>
                    </a>
                )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-10 text-neutral-400 dark:text-neutral-500">
                        <p>Nenhum sistema encontrado com o termo "<strong className="text-neutral-600 dark:text-neutral-300">{searchTerm}</strong>".</p>
                    </div>
                )}
            </div>
        </div>
    );
};