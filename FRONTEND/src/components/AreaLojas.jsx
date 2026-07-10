import React, { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  Target,
  Crown,
  Map,
  ChevronLeft,
  Medal,
  Trophy,
} from "lucide-react";
import { applyCurrencyMask } from "../utils/masks";
import { fetchAreaLojas } from "../services/api.js";
import "../styles/AreaLojas/AreaLojasStyle.css";

const INDICATORS = [
  { key: "receita", label: "RECEITA (R$)", isCurrency: true },
  { key: "gross", label: "GROSS TOTAL" },
  { key: "posTotal", label: "PÓS-PAGO" },
  { key: "controleTotal", label: "CONTROLE" },
  { key: "urTotal", label: "UR TOTAL" },
  { key: "fibra", label: "FIBRA" },
  { key: "tv", label: "TV+" },
  { key: "aparelho", label: "APARELHO" },
  { key: "acessorio", label: "ACESSÓRIO" },
  { key: "seguro", label: "SEGURO" },
  { key: "pelicula", label: "PELÍCULA" },
  { key: "mplay", label: "M-PLAY" },
];

const CURRENT_STORE_ID = import.meta.env.VITE_STORE_ID || "uniao_osasco";

export const AreaLojas = ({ globalMonth }) => {
  const [loading, setLoading] = useState(true);
  const [storesData, setStoresData] = useState([]);
  const [globalSellers, setGlobalSellers] = useState([]);
  const [focusedIndicator, setFocusedIndicator] = useState(null);

  useEffect(() => {
    const fetchAllStores = async () => {
      setLoading(true);
      try {
        const data = await fetchAreaLojas(globalMonth);
        setStoresData(data.storesData);
        setGlobalSellers(data.globalSellers);
      } catch (error) {
        console.error("Erro ao buscar dados da área de lojas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (globalMonth) fetchAllStores();
  }, [globalMonth]);

  const getRankedSellers = (key) => {
    return [...globalSellers]
      .filter((v) => v[key] > 0)
      .sort((a, b) => b[key] - a[key]);
  };

  const renderIndicatorRow = (label, real, meta, isCurrency = false) => {
    const rVal = Number(real) || 0;
    const mVal = Number(meta) || 0;
    const pct = mVal > 0 ? (rVal / mVal) * 100 : rVal > 0 ? 100 : 0;

    let pctColor = "text-neutral-500 bg-neutral-100 dark:bg-neutral-800";
    if (pct >= 100)
      pctColor =
        "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    else if (pct >= 80)
      pctColor =
        "text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400";
    else if (mVal > 0)
      pctColor = "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400";

    const format = (v) => (isCurrency ? applyCurrencyMask(v) : v);

    return (
      <div className="area-lojas-indicator-row group">
        <div className="area-lojas-indicator-col">
          <span className="area-lojas-indicator-label">{label}</span>
          <span className="area-lojas-indicator-value">{format(rVal)}</span>
        </div>

        {mVal > 0 ? (
          <div className="area-lojas-indicator-meta-container">
            <div className="area-lojas-indicator-meta-box">
              <span className="area-lojas-indicator-meta-label">Meta</span>
              <span className="area-lojas-indicator-meta-value">
                {format(mVal)}
              </span>
            </div>
            <div className="area-lojas-indicator-pct-box">
              <span className={`area-lojas-indicator-pct-base ${pctColor}`}>
                {pct.toFixed(0)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="area-lojas-indicator-no-meta-container">
            <span className="area-lojas-indicator-no-meta-label">S/ meta</span>
          </div>
        )}
      </div>
    );
  };

  const renderStoreCard = (store, index) => {
    const isCurrentStore = store.id === CURRENT_STORE_ID;

    return (
      <div
        key={store.id}
        className={`area-lojas-store-card ${isCurrentStore ? "area-lojas-store-card-current" : "area-lojas-store-card-normal"}`}
      >
        {isCurrentStore && (
          <div className="area-lojas-store-badge-current">
            <Target size={10} /> SUA LOJA
          </div>
        )}

        <div
          className={`area-lojas-store-header ${isCurrentStore ? "area-lojas-store-header-current" : "area-lojas-store-header-normal"}`}
        >
          <div className="area-lojas-store-header-content">
            <div
              className={`area-lojas-store-rank-badge ${index === 0 ? "bg-yellow-100 text-yellow-600" : index === 1 ? "bg-neutral-200 text-neutral-600" : index === 2 ? "bg-orange-100 text-orange-600" : "bg-white dark:bg-neutral-800 text-neutral-400 border border-neutral-200 dark:border-neutral-700"}`}
            >
              {index + 1}º
            </div>
            <div>
              <h3 className="area-lojas-store-name">{store.name}</h3>
              <p className="area-lojas-store-code">{store.code}</p>
            </div>
          </div>
          {index === 0 && <Crown className="text-yellow-500" size={20} />}
        </div>

        <div className="area-lojas-store-indicators-list custom-scrollbar">
          {renderIndicatorRow(
            "RECEITA (R$)",
            store.receita,
            store.metaReceita,
            true,
          )}
          {renderIndicatorRow("GROSS TOTAL", store.gross, store.metaGross)}
          {renderIndicatorRow("PÓS-PAGO", store.posPago, store.metaPosPago)}
          {renderIndicatorRow("CONTROLE", store.controle, store.metaControle)}
          {renderIndicatorRow("UR TOTAL", store.urTotal, store.metaUrTotal)}
          {renderIndicatorRow("FIBRA", store.fibra, store.metaFibra)}
          {renderIndicatorRow("TV+", store.tv, store.metaTv)}
          {renderIndicatorRow("APARELHO", store.aparelho, store.metaAparelho)}
          {renderIndicatorRow(
            "ACESSÓRIO",
            store.acessorio,
            store.metaAcessorio,
          )}
          {renderIndicatorRow("SEGURO", store.seguro, store.metaSeguro)}
          {renderIndicatorRow("PELÍCULA", store.pelicula, store.metaPelicula)}
          {renderIndicatorRow("M-PLAY", store.mplay, store.metaMplay)}
        </div>
      </div>
    );
  };

  return (
    <div className="area-lojas-container">
      {/* Header Fixo */}
      <div className="area-lojas-header">
        <div className="area-lojas-header-inner">
          <div className="area-lojas-icon-box">
            <Map size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight">
              Área Lojas
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
              Comparativo de performance entre vendedores de todas as lojas.
              (Mês: {globalMonth?.split("-").reverse().join("/")})
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="area-lojas-loading-container">
            <Loader2 size={40} className="area-lojas-loading-spinner" />
            <p className="area-lojas-loading-title">
              Cruzando banco de dados de todas as filiais...
            </p>
            <p className="area-lojas-loading-subtitle">
              Isso pode levar alguns segundos.
            </p>
          </div>
        ) : (
          <div className="area-lojas-content-wrapper">
            {/* Carrossel de Lojas */}
            <div className="area-lojas-carousel-section">
              <div className="area-lojas-carousel-inner">
                <h2 className="area-lojas-carousel-title">
                  <Target className="text-[#E3000F]" size={20} />
                  PLACAR DAS LOJAS
                </h2>
                <div className="area-lojas-carousel-container custom-scrollbar">
                  {storesData.map((store, index) =>
                    renderStoreCard(store, index),
                  )}
                </div>
              </div>
            </div>

            {/* Seção Inferior: Indicadores e Ranking */}
            <div className="area-lojas-bottom-section">
              {!focusedIndicator ? (
                <>
                  <div className="area-lojas-highlights-header">
                    <h2 className="area-lojas-highlights-title">
                      Destaques por Indicador
                    </h2>
                    <p className="area-lojas-highlights-subtitle">
                      Veja o Top 3 de vendedores que mais performam entre todas
                      as lojas da rede. Clique num indicador para ver a lista
                      completa.
                    </p>
                  </div>
                  <div className="area-lojas-highlights-grid">
                    {INDICATORS.map((ind) => {
                      const ranking = getRankedSellers(ind.key).slice(0, 3);
                      return (
                        <div
                          key={ind.key}
                          onClick={() => setFocusedIndicator(ind)}
                          className="area-lojas-ranking-card group"
                        >
                          <div className="area-lojas-highlight-card-header">
                            <h3 className="area-lojas-highlight-card-title">
                              {ind.label}
                            </h3>
                          </div>
                          <div className="area-lojas-highlight-card-body">
                            {ranking.length === 0 ? (
                              <div className="area-lojas-highlight-empty">
                                Sem dados.
                              </div>
                            ) : (
                              ranking.map((seller, idx) => (
                                <div
                                  key={seller.id}
                                  className="area-lojas-highlight-row"
                                >
                                  <div className="area-lojas-highlight-row-left">
                                    <span className="area-lojas-highlight-row-rank">
                                      {idx + 1}º
                                    </span>
                                    <span className="area-lojas-highlight-row-name">
                                      {seller.nomeCompleto.split(" ")[0]}
                                    </span>
                                  </div>
                                  <span className="area-lojas-highlight-row-value">
                                    {ind.isCurrency
                                      ? applyCurrencyMask(seller[ind.key])
                                      : seller[ind.key]}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="area-lojas-detail-container">
                  <button
                    onClick={() => setFocusedIndicator(null)}
                    className="area-lojas-ranking-back-btn"
                  >
                    <ChevronLeft size={18} />
                    <span className="font-bold text-sm">
                      Voltar aos Indicadores
                    </span>
                  </button>

                  <div className="area-lojas-detail-header">
                    <h2 className="area-lojas-detail-title">
                      <Trophy className="text-[#E3000F]" size={32} />
                      DESTAQUES: {focusedIndicator.label}
                    </h2>
                    <p className="area-lojas-detail-subtitle">
                      Comparativo de performance entre os vendedores de todas as
                      lojas
                    </p>
                  </div>

                  <div className="area-lojas-ranking-list-card">
                    {(() => {
                      const ranking = getRankedSellers(focusedIndicator.key);
                      if (ranking.length === 0)
                        return (
                          <div className="area-lojas-detail-empty">
                            Nenhuma venda registrada.
                          </div>
                        );

                      const maxVal = ranking[0][focusedIndicator.key] || 1;

                      return ranking.map((seller, index) => {
                        const isTop1 = index === 0;
                        const isTop2 = index === 1;
                        const isTop3 = index === 2;
                        const percentage = Math.max(
                          5,
                          (seller[focusedIndicator.key] / maxVal) * 100,
                        );

                        return (
                          <div
                            key={seller.id}
                            className="flex items-center gap-4 group"
                          >
                            <div className="area-lojas-detail-rank-box">
                              {isTop1 ? (
                                <Crown
                                  size={24}
                                  className="text-yellow-500 ml-auto"
                                />
                              ) : isTop2 ? (
                                <Medal
                                  size={24}
                                  className="text-gray-400 ml-auto"
                                />
                              ) : isTop3 ? (
                                <Medal
                                  size={24}
                                  className="text-amber-600 ml-auto"
                                />
                              ) : (
                                <span className="area-lojas-detail-rank-text">
                                  {index + 1}º
                                </span>
                              )}
                            </div>
                            <div className="area-lojas-detail-info-box">
                              <div className="area-lojas-detail-info-header">
                                <div className="area-lojas-detail-info-left">
                                  <span
                                    className={`font-bold ${isTop1 ? "area-lojas-detail-seller-name-top1" : "area-lojas-detail-seller-name-normal"}`}
                                  >
                                    {seller.nomeCompleto}
                                  </span>
                                  <span className="area-lojas-detail-store-badge">
                                    {seller.storeName}
                                  </span>
                                </div>
                                <span className="area-lojas-detail-value">
                                  {focusedIndicator.isCurrency
                                    ? applyCurrencyMask(
                                        seller[focusedIndicator.key],
                                      )
                                    : seller[focusedIndicator.key]}
                                </span>
                              </div>
                              <div className="area-lojas-detail-bar-track">
                                <div
                                  className={`area-lojas-detail-bar-fill ${isTop1 ? "area-lojas-detail-bar-fill-top1" : "area-lojas-detail-bar-fill-normal"}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
