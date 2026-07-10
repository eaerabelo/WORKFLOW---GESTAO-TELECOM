import React, { useState, useEffect } from 'react';
import { Globe, ExternalLink, Search } from 'lucide-react';
import { getSistemasAPI } from '../services/api.js';
import '../styles/Sistemas/Sistemas.css';

export const Sistemas = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sistemasLinks, setSistemasLinks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSistemas = async () => {
            try {
                const data = await getSistemasAPI();
                if (Array.isArray(data)) {
                    setSistemasLinks(data);
                } else {
                    setSistemasLinks([]);
                }
            } catch (error) {
                console.error("Erro ao buscar links de sistemas:", error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSistemas();
    }, []);

    const filteredLinks = sistemasLinks.filter(sys => 
        sys.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="sistemas-container">
            <div className="sistemas-header">
                <div>
                    <h2 className="sistemas-title">Portal de Sistemas</h2>
                    <p className="sistemas-subtitle">Acesso rápido e direto às plataformas e ferramentas corporativas.</p>
                </div>
                <div className="sistemas-search-wrapper">
                    <Search className="sistemas-search-icon" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar sistema..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="sistemas-search-input"
                    />
                </div>
            </div>

            <div className="sistemas-grid">
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E3000F]"></div>
                    </div>
                ) : error ? (
                    <div className="col-span-full flex justify-center py-10 text-red-500">
                        <p>Erro ao carregar os sistemas. O backend foi atualizado?</p>
                    </div>
                ) : filteredLinks.length > 0 ? filteredLinks.map((sys, idx) => (
                    <a
                        key={idx}
                        href={sys.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group sistemas-card"
                    >
                        <div className="sistemas-card-external-icon">
                            <ExternalLink size={16} className="text-[#E3000F]" />
                        </div>
                        <div className="sistemas-card-icon-container">
                            <Globe size={24} />
                        </div>
                        <span className="sistemas-card-name">
                            {sys.name}
                        </span>
                    </a>
                )) : (
                    <div className="sistemas-empty">
                        <p>Nenhum sistema encontrado com o termo "<strong className="text-neutral-600 dark:text-neutral-300">{searchTerm}</strong>".</p>
                    </div>
                )}
            </div>
        </div>
    );
};