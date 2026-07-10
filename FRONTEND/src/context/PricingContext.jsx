import React, { createContext, useContext, useState, useEffect } from 'react';
import { authFetch, API_URL } from '../services/api';

const PricingContext = createContext();

export const usePricing = () => useContext(PricingContext);

export const PricingProvider = ({ children }) => {
    const [pricingData, setPricingData] = useState({
        DEFAULT_PRICING: {},
        PRICING_MOVEL: {},
        FIBRA_OPTIONS: [],
        TV_BOX_OPTIONS: [],
        FIXO_OPTIONS: [],
        MESH_OPTIONS: [],
        SEGURO_OPTIONS: [],
        DEPENDENTE_OPTIONS: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await authFetch(`${API_URL}/api/sistemas/pricing`);
                if (res.ok) {
                    const data = await res.json();
                    setPricingData({
                        DEFAULT_PRICING: data.DEFAULT_PRICING || {},
                        PRICING_MOVEL: data.PRICING_MOVEL || {},
                        FIBRA_OPTIONS: data.FIBRA_OPTIONS || [],
                        TV_BOX_OPTIONS: data.TV_BOX_OPTIONS || [],
                        FIXO_OPTIONS: data.FIXO_OPTIONS || [],
                        MESH_OPTIONS: data.MESH_OPTIONS || [],
                        SEGURO_OPTIONS: data.SEGURO_OPTIONS || [],
                        DEPENDENTE_OPTIONS: data.DEPENDENTE_OPTIONS || []
                    });
                }
            } catch (error) {
                console.error('Erro ao buscar pricing:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPricing();
    }, []);

    return (
        <PricingContext.Provider value={{ pricingData, loading }}>
            {children}
        </PricingContext.Provider>
    );
};
