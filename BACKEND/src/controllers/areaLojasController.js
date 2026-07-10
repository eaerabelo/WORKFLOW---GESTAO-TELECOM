import { queryTable } from '../services/oracleService.js';
import { getOracleConnection } from '../config/oracle.js';

import { STORES } from '../config/stores.js';

export const getAreaLojas = async (req, res) => {
  try {
    const { month } = req.query; // format: "YYYY-MM"
    if (!month) {
      return res.status(400).json({ error: "O parâmetro 'month' é obrigatório (ex: 2023-10)." });
    }

    const startStr = `${month}-01`;
    const endStr = `${month}-31T23:59:59`;

    const newStoresData = [];
    const sellerMap = {};

    // Função para pegar a config de uma loja usando conexão direta
    const getConfig = async (storeId) => {
        let conn;
        try {
            conn = await getOracleConnection();
            const result = await conn.execute(`SELECT DOCUMENT_DATA FROM CONFIGURACOES WHERE STORE_ID = :storeId`, { storeId });
            if (result.rows.length > 0) {
                return JSON.parse(result.rows[0].DOCUMENT_DATA);
            }
            return {};
        } catch(e) {
            console.error(`Erro ao buscar config da loja ${storeId}:`, e);
            return {};
        } finally {
            if (conn) {
                try {
                    await conn.close();
                } catch(e) {}
            }
        }
    };

    for (const store of STORES) {
      try {
        const [sales, configData] = await Promise.all([
          queryTable('VENDAS', store.id, startStr, endStr).catch((e) => {
             console.error(`Erro buscando vendas da loja ${store.id}:`, e);
             return [];
          }),
          getConfig(store.id)
        ]);

        const metasDoc = configData.goalsDB || {};
        const storeMeta = metasDoc[month] || {};

        let receita = 0, gross = 0, posPago = 0, controle = 0, urTotal = 0;
        let fibraTotal = 0, tvTotal = 0, aparelho = 0, acessorio = 0, pelicula = 0, seguro = 0, mplay = 0;

        sales.forEach((sale) => {
          if (!sale.data || typeof sale.data !== "string") return;

          let isCurrentMonth = false;
          if (sale.data.includes("/")) {
            const parts = sale.data.split("/");
            if (parts.length === 3) {
              const m = parts[1].padStart(2, "0");
              if (`${parts[2]}-${m}` === month) isCurrentMonth = true;
            }
          } else if (sale.data.includes("-")) {
            if (sale.data.slice(0, 7) === month) isCurrentMonth = true;
          }
          if (!isCurrentMonth) return;

          let valString = sale.receita !== undefined ? sale.receita : sale.valor_total;
          if (typeof valString === "string") {
            if (valString.includes(",")) {
              valString = valString.replace(/R\$\s?/, "").replace(/\./g, "").replace(",", ".");
            } else {
              valString = valString.replace(/R\$\s?/, "");
            }
          }
          let receitaNum = Number(valString || 0);
          if (isNaN(receitaNum)) receitaNum = 0;
          receita += receitaNum;

          let posTt = 0, controleLc = 0, depPg = 0, depBl = 0, depGratis = 0, bl = 0, flex = 0;
          let migracaoPos = 0, migracaoControle = 0, grossPme = 0, urPme = 0;
          let fibra = 0, tv = 0, tvBox = 0, fixo = 0, qAparelho = 0, qAcessorio = 0, qPelicula = 0, qSeguro = 0, qMplay = 0;

          const pBase = String(sale.produto || "").toUpperCase();
          const q = sale.qtda === 0 || sale.qtda === "0" ? 0 : Number(sale.qtda) || 1;
          const op = String(sale.operacao || "").toUpperCase();
          const sub = String(sale.subProduto || "").toUpperCase();

          if (pBase.includes("PME") && !pBase.includes("FIBRA")) {
            grossPme += q;
          } else if (pBase.includes("PÓS") || pBase.includes("POS")) {
            if (op.includes("MIGRA") || pBase.includes("MIGRA") || sub.includes("MIGRA")) migracaoPos += q;
            else posTt += q;
          } else if (pBase.includes("CONTROLE")) {
            if (op.includes("MIGRA") || pBase.includes("MIGRA") || sub.includes("MIGRA")) migracaoControle += q;
            else controleLc += q;
          } else if (pBase.includes("FLEX")) {
            if (op.includes("MIGRA") || pBase.includes("MIGRA") || sub.includes("MIGRA")) migracaoControle += q;
            else flex += q;
          } else if (pBase.includes("DEPENDENTE") || pBase.includes("DEP")) {
            if (sub.includes("GRATUITO") || sub.includes("GRÁTIS") || sub.includes("GRATIS") || pBase.includes("GRÁTIS")) depGratis += q;
            else if (sub.includes("BANDA-LARGA") || sub.includes("BANDA LARGA")) depBl += q;
            else depPg += q;
          } else if (pBase.includes("BANDA LARGA") || pBase === "BL" || pBase.includes("CLARO NET VIRTUA")) {
            bl += q;
          } else if (pBase.includes("FIBRA PME") || pBase.includes("UR PME")) {
            urPme += q;
          } else if (pBase.includes("FIBRA") || pBase.includes("BANDA LARGA RESIDENCIAL")) {
            fibra += q;
          } else if (pBase.includes("TV-BOX")) {
            tvBox += q;
          } else if (pBase.includes("CLARO TV+") || pBase.includes("TV")) {
            tv += q;
          } else if (pBase.includes("FIXO") || pBase.includes("NET FONE")) {
            fixo += q;
          } else if (pBase.includes("APARELHO")) {
            qAparelho += q;
          } else if (pBase.includes("ACESSÓRIO") || pBase.includes("ACESSORIO")) {
            qAcessorio += q;
          } else if (pBase.includes("PELÍCULA") || pBase.includes("PELICULA")) {
            qPelicula += q;
          } else if (pBase.includes("SEGURO")) {
            qSeguro += q;
          }

          if (sale.mplay === "SIM") qMplay += 1;

          const saleGross = posTt + controleLc + depPg + depBl + depGratis + migracaoPos + migracaoControle + grossPme + bl + flex;
          const salePosTotal = posTt + migracaoPos;
          const saleControle = controleLc + migracaoControle;
          const saleUrTotal = fibra + tv + tvBox + fixo + urPme;
          const saleFibra = fibra + bl;
          const saleTv = tv + tvBox;

          gross += saleGross;
          posPago += salePosTotal;
          controle += saleControle;
          urTotal += saleUrTotal;
          fibraTotal += saleFibra;
          tvTotal += saleTv;
          aparelho += qAparelho;
          acessorio += qAcessorio;
          pelicula += qPelicula;
          seguro += qSeguro;
          mplay += qMplay;

          if (!sale.vendedor) return;

          // Add to seller map
          const v = sale.vendedor;
          const sellerKey = store.id + "_" + v;
          if (!sellerMap[sellerKey]) {
            sellerMap[sellerKey] = {
              id: sellerKey,
              nomeCompleto: v,
              storeName: store.name,
              receita: 0, gross: 0, posTotal: 0, controleTotal: 0, urTotal: 0,
              fibra: 0, tv: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0,
            };
          }

          sellerMap[sellerKey].receita += receitaNum;
          sellerMap[sellerKey].gross += saleGross;
          sellerMap[sellerKey].posTotal += salePosTotal;
          sellerMap[sellerKey].controleTotal += saleControle;
          sellerMap[sellerKey].urTotal += saleUrTotal;
          sellerMap[sellerKey].fibra += saleFibra;
          sellerMap[sellerKey].tv += saleTv;
          sellerMap[sellerKey].aparelho += qAparelho;
          sellerMap[sellerKey].acessorio += qAcessorio;
          sellerMap[sellerKey].pelicula += qPelicula;
          sellerMap[sellerKey].seguro += qSeguro;
          sellerMap[sellerKey].mplay += qMplay;
        });

        const metaReceita = Number(storeMeta.receita) || 0;
        const metaGross = Number(storeMeta.posTotal) || 0;
        const rPct = metaReceita > 0 ? (receita / metaReceita) * 100 : 0;
        const gPct = metaGross > 0 ? (gross / metaGross) * 100 : 0;

        newStoresData.push({
          ...store,
          receita, gross, posPago, controle, urTotal, fibra: fibraTotal, tv: tvTotal,
          aparelho, acessorio, pelicula, seguro, mplay, metaReceita, metaGross,
          metaPosPago: Number(storeMeta.posPago) || 0,
          metaControle: Number(storeMeta.controle) || 0,
          metaUrTotal: Number(storeMeta.urTotal) || 0,
          metaFibra: Number(storeMeta.fibra) || 0,
          metaTv: Number(storeMeta.tv) || 0,
          metaAparelho: Number(storeMeta.aparelho) || 0,
          metaAcessorio: Number(storeMeta.acessorio) || 0,
          metaPelicula: Number(storeMeta.pelicula) || 0,
          metaSeguro: Number(storeMeta.seguro) || 0,
          metaMplay: Number(storeMeta.mplay) || 0,
          rPct, gPct, totalScore: rPct + gPct,
        });
      } catch (error) {
        console.error(`Erro ao buscar dados da loja ${store.id}:`, error);
      }
    }

    newStoresData.sort((a, b) => b.totalScore - a.totalScore);
    const globalSellers = Object.values(sellerMap);

    res.json({
      storesData: newStoresData,
      globalSellers
    });

  } catch (error) {
    console.error("Erro no processamento da Área Lojas:", error);
    res.status(500).json({ error: error.message });
  }
};
