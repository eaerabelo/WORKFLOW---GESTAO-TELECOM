import { queryTable } from '../services/oracleService.js';
import { getOracleConnection } from '../config/oracle.js';

// Constantes copiadas de onde ficavam no frontend (METAS_PADRAO)
const METAS_PADRAO = {
    posPago: 0,
    controle: 0,
    receita: 0,
    fibra: 0,
    tv: 0,
    aparelho: 0,
    acessorio: 0,
    pelicula: 0,
    seguro: 0,
    mplay: 0,
    trocafy: 0,
    mesh: 0
};

export const getColaboradoresDashboard = async (req, res) => {
    let conn;
    try {
        const { storeId, month } = req.query; // format expected: "MM-YYYY"
        if (!storeId || !month) {
            return res.status(400).json({ error: "Faltam parâmetros: storeId ou month (MM-YYYY)" });
        }

        // Convert MM-YYYY to YYYY-MM for the queries and internal logic
        const [m, y] = month.split('-');
        const isoMonth = `${y}-${m}`;
        const startStr = `${isoMonth}-01`;
        const endStr = `${isoMonth}-31T23:59:59`;

        conn = await getOracleConnection();

        const configResult = await conn.execute(`SELECT DOCUMENT_DATA FROM CONFIGURACOES WHERE STORE_ID = :storeId`, { storeId });
        let configData = {};
        if (configResult.rows.length > 0) {
            configData = JSON.parse(configResult.rows[0].DOCUMENT_DATA);
        }

        const goalsDB = configData.goalsDB || {};

        const usersResult = await conn.execute(`SELECT * FROM USUARIOS WHERE STORE_ID = :storeId OR STORE_ID = 'DEFAULT'`, { storeId });
        let usersDB = {};
        for (let row of usersResult.rows) {
            usersDB[row.USERNAME] = {
                username: row.USERNAME,
                name: row.NAME,
                role: row.ROLE,
                pass: row.PASS,
                phone: row.PHONE,
                email: row.EMAIL,
                birthDate: row.BIRTH_DATE,
                vacationStart: row.VACATION_START,
                vacationEnd: row.VACATION_END
            };
        }
        const activeMetas = goalsDB[isoMonth] || METAS_PADRAO;

        // 2. Fetch Sales
        const sales = await queryTable('VENDAS', storeId, startStr, endStr);

        // 3. Identificar vendedores ativos e históricos
        const activeVendedores = Object.values(usersDB)
            .filter(u => !u?.role || u?.role === 'VENDEDOR')
            .map(u => String(u?.name || ''))
            .filter(Boolean);

        const historicalVendedores = sales
            .filter(s => {
                if (typeof s.data !== 'string') return false;
                if (s.data.includes('/')) {
                    const parts = s.data.split('/');
                    if (parts.length === 3) return `${parts[2]}-${parts[1]}` === isoMonth;
                }
                if (s.data.includes('-')) return s.data.slice(0, 7) === isoMonth;
                return false;
            })
            .map(s => String(s.vendedor || ''))
            .filter(Boolean);

        const safeVendedores = [...new Set([...activeVendedores, ...historicalVendedores])].sort();
        const numSellers = safeVendedores.length || 1;

        // 4. Calcular Metas Individuais
        const individualMetas = {
            receita: (Number(activeMetas.receita) || 0) / numSellers,
            posPago: Math.ceil((Number(activeMetas.posPago) || 0) / numSellers),
            controle: Math.ceil((Number(activeMetas.controle) || 0) / numSellers),
            fibra: Math.ceil((Number(activeMetas.fibra) || 0) / numSellers),
            tv: Math.ceil((Number(activeMetas.tv) || 0) / numSellers),
            aparelho: Math.ceil((Number(activeMetas.aparelho) || 0) / numSellers),
            acessorio: Math.ceil((Number(activeMetas.acessorio) || 0) / numSellers),
            pelicula: Math.ceil((Number(activeMetas.pelicula) || 0) / numSellers),
            seguro: Math.ceil((Number(activeMetas.seguro) || 0) / numSellers),
            mplay: Math.ceil((Number(activeMetas.mplay) || 0) / numSellers),
            trocafy: Math.ceil((Number(activeMetas.trocafy) || 0) / numSellers),
            mesh: Math.ceil((Number(activeMetas.mesh) || 0) / numSellers),
        };
        individualMetas.posTotal = individualMetas.posPago + individualMetas.controle;
        individualMetas.urTotal = individualMetas.fibra + individualMetas.tv;

        // 5. Agregação de Vendas
        const sellerMetricsMap = {};
        const sellerDailyData = {};

        // Inicializar
        safeVendedores.forEach(seller => {
            sellerMetricsMap[seller] = {
                totalReceita: 0, volControle: 0, volPosPago: 0, volPosTotal: 0, 
                volFibra: 0, volTv: 0, volUrTotal: 0, volAparelho: 0, volAcessorio: 0, 
                volPelicula: 0, volSeguro: 0, volMesh: 0, volTrocafy: 0, volMPlay: 0, 
                receitaAparelho: 0, receitaAcessorio: 0
            };
            sellerDailyData[seller] = {
                sales: []
            };
        });

        // Filtrar e organizar vendas
        sales.forEach(sale => {
            if (!sale.data) return;

            // Filtro de mês exato
            let isCurrentMonth = false;
            let dateIso = '';
            let dateBr = '';

            if (sale.data.includes('/')) {
                const parts = sale.data.split('/');
                if (parts.length === 3) {
                    const d = parts[0].padStart(2, '0');
                    const m_part = parts[1].padStart(2, '0');
                    const y_part = parts[2];
                    if (`${y_part}-${m_part}` === isoMonth) {
                        isCurrentMonth = true;
                        dateIso = `${y_part}-${m_part}-${d}`;
                        dateBr = sale.data;
                    }
                }
            } else if (sale.data.includes('-')) {
                if (sale.data.slice(0, 7) === isoMonth) {
                    isCurrentMonth = true;
                    dateIso = sale.data;
                    const parts = sale.data.split('-');
                    dateBr = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }
            if (!isCurrentMonth) return;
            
            // Normalized sale date
            sale.dateIso = dateIso;
            sale.dateBr = dateBr;

            const vNome = String(sale.vendedor || '');
            if (safeVendedores.includes(vNome)) {
                sellerDailyData[vNome].sales.push(sale);
                const metrics = sellerMetricsMap[vNome];

                metrics.totalReceita += Number(sale.comissao !== undefined ? sale.comissao : sale.receita) || 0;
                const p = String(sale.produto || '').toUpperCase();
                const qtda = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);
                const rec = Number(sale.receita) || 0;

                if (p.includes('CONTROLE') || p.includes('FLEX')) metrics.volControle += qtda;
                if (p.includes('POS') || p.includes('DEPENDENTE') || p.includes('BANDA LARGA')) metrics.volPosPago += qtda;
                if (p.includes('POS') || p.includes('CONTROLE') || p.includes('DEPENDENTE') || p.includes('BANDA LARGA') || p.includes('FLEX')) metrics.volPosTotal += qtda;
                if (p.includes('FIBRA')) metrics.volFibra += qtda;
                if (p.includes('TV')) metrics.volTv += qtda;
                if (p.includes('APARELHO')) { metrics.volAparelho += qtda; metrics.receitaAparelho += rec; }
                if (p.includes('ACESSORIO')) { metrics.volAcessorio += qtda; metrics.receitaAcessorio += rec; }
                if (p.includes('PELICULA')) { metrics.volPelicula += qtda; metrics.receitaAcessorio += rec; }
                if (p.includes('MESH')) metrics.volMesh += qtda;
                if (p.includes('SEGURO')) metrics.volSeguro += qtda;
                if (Array.isArray(sale.adicionais) && sale.adicionais.includes('TROCAFY')) metrics.volTrocafy += 1;
                if (sale.mplay === 'SIM') metrics.volMPlay += 1;
            }
        });

        safeVendedores.forEach(seller => {
            sellerMetricsMap[seller].volUrTotal = sellerMetricsMap[seller].volFibra + sellerMetricsMap[seller].volTv;
        });

        // 6. Rankings
        const sortedByReceita = [...safeVendedores].sort((a, b) => sellerMetricsMap[b].totalReceita - sellerMetricsMap[a].totalReceita);
        const rankings = {
            topReceitaName: sortedByReceita.length > 0 && sellerMetricsMap[sortedByReceita[0]].totalReceita > 0 ? sortedByReceita[0] : null,
            topReceitaName2: sortedByReceita.length > 1 && sellerMetricsMap[sortedByReceita[1]].totalReceita > 0 ? sortedByReceita[1] : null,
            topReceitaName3: sortedByReceita.length > 2 && sellerMetricsMap[sortedByReceita[2]].totalReceita > 0 ? sortedByReceita[2] : null,
            
            topPosName: [...safeVendedores].sort((a, b) => sellerMetricsMap[b].volPosTotal - sellerMetricsMap[a].volPosTotal)[0] || null,
            topControleName: [...safeVendedores].sort((a, b) => sellerMetricsMap[b].volControle - sellerMetricsMap[a].volControle)[0] || null,
            topAcessorioName: [...safeVendedores].sort((a, b) => sellerMetricsMap[b].volAcessorio - sellerMetricsMap[a].volAcessorio)[0] || null,
            topAparelhoName: [...safeVendedores].sort((a, b) => sellerMetricsMap[b].volAparelho - sellerMetricsMap[a].volAparelho)[0] || null,
            topResidencialName: [...safeVendedores].sort((a, b) => sellerMetricsMap[b].volUrTotal - sellerMetricsMap[a].volUrTotal)[0] || null,
        };
        // Fix rankings where the value is 0
        if (rankings.topPosName && sellerMetricsMap[rankings.topPosName].volPosTotal === 0) rankings.topPosName = null;
        if (rankings.topControleName && sellerMetricsMap[rankings.topControleName].volControle === 0) rankings.topControleName = null;
        if (rankings.topAcessorioName && sellerMetricsMap[rankings.topAcessorioName].volAcessorio === 0) rankings.topAcessorioName = null;
        if (rankings.topAparelhoName && sellerMetricsMap[rankings.topAparelhoName].volAparelho === 0) rankings.topAparelhoName = null;
        if (rankings.topResidencialName && sellerMetricsMap[rankings.topResidencialName].volUrTotal === 0) rankings.topResidencialName = null;


        // 7. Agregação Diária por Vendedor (O pacote completo)
        const daysInMonth = new Date(Number(y), Number(m), 0).getDate();
        
        safeVendedores.forEach(seller => {
            const sellerSales = sellerDailyData[seller].sales.sort((a, b) => {
                if (a.dateIso !== b.dateIso) return b.dateIso.localeCompare(a.dateIso);
                return (b.id || 0) - (a.id || 0);
            });

            const generatedRows = [];
            const sumTotals = { grossDia: 0, posPagoTotal: 0, controleTotal: 0, urTotal: 0, fibra: 0, tv: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0, receita: 0 };

            for (let d = 1; d <= daysInMonth; d++) {
                const dayStr = String(d).padStart(2, '0');
                const dateIso = `${isoMonth}-${dayStr}`;

                const dailySales = sellerSales.filter(s => s.dateIso === dateIso);

                let posTt = 0, controle = 0, depPg = 0, depBl = 0, depGratis = 0, migracaoPos = 0, migracaoControle = 0, grossPme = 0;
                let bl = 0, flex = 0, receita = 0, fibra = 0, tv = 0, tvBox = 0, fixo = 0, urPme = 0, aparelho = 0;
                let seguro = 0, acessorio = 0, pelicula = 0, mplay = 0;

                dailySales.forEach(sale => {
                    const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
                    const op = String(sale.tipoOperacao || sale.operacao || '').toUpperCase();
                    const sub = String(sale.subOption || sale.subtipo || '').toUpperCase();
                    const rec = Number(sale.comissao !== undefined ? sale.comissao : sale.receita) || 0;
                    const q = sale.qtda === 0 || sale.qtda === '0' ? 0 : (Number(sale.qtda) || 1);

                    receita += rec;

                    if (pBase.includes('PÓS PME') || pBase === 'PME' || pBase.includes('POS PME')) { grossPme += q; }
                    else if (pBase.includes('PÓS') || pBase.includes('POS')) {
                        if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoPos += q;
                        else posTt += q; 
                    }
                    else if (pBase.includes('CONTROLE')) {
                        if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q;
                        else controle += q; 
                    }
                    else if (pBase.includes('FLEX')) {
                        if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q;
                        else flex += q;
                    }
                    else if (pBase.includes('DEPENDENTE') || pBase.includes('DEP')) {
                        if (sub.includes('GRATUITO') || sub.includes('GRÁTIS') || sub.includes('GRATIS') || sub.includes('INCLUSA') || pBase.includes('GRÁTIS') || pBase.includes('INCLUSA')) depGratis += q;
                        else if (sub.includes('BANDA-LARGA') || sub.includes('BANDA LARGA') || sub.includes('BL') || pBase.includes('BL')) depBl += q;
                        else depPg += q;
                    }
                    else if (pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('NET VIRTUA')) bl += q;
                    else if (pBase.includes('FIBRA PME') || pBase.includes('UR PME')) urPme += q;
                    else if (pBase.includes('FIBRA') || pBase.includes('BANDA LARGA RESIDENCIAL')) fibra += q;
                    else if (pBase.includes('TV-BOX')) tvBox += q;
                    else if (pBase.includes('TV+')) tv += q;
                    else if (pBase.includes('FIXO') || pBase.includes('NET FONE')) fixo += q;
                    else if (pBase.includes('APARELHO')) { aparelho += q; }
                    else if (pBase.includes('SEGURO')) seguro += q;
                    else if (pBase.includes('ACESSÓRIO') || pBase.includes('ACESSORIO')) { acessorio += q; }
                    else if (pBase.includes('PELÍCULA') || pBase.includes('PELICULA')) { pelicula += q; }
                    if (sale.mplay === 'SIM') mplay += 1;
                });

                const grossDia = posTt + controle + depPg + depBl + depGratis + migracaoPos + migracaoControle + grossPme + bl + flex;
                const urTotal = fibra + tv + tvBox + fixo + urPme;
                const posPagoTotal = posTt + migracaoPos + depPg + depBl + depGratis + bl;
                const controleTotal = controle + migracaoControle;

                generatedRows.push({
                    data: dayStr, grossDia, posPagoTotal, controleTotal, urTotal, fibra: fibra + bl, tv: tv + tvBox, aparelho, acessorio, pelicula, seguro, mplay, receita
                });

                sumTotals.grossDia += grossDia; sumTotals.posPagoTotal += posPagoTotal; sumTotals.controleTotal += controleTotal;
                sumTotals.urTotal += urTotal; sumTotals.fibra += (fibra + bl); sumTotals.tv += (tv + tvBox);
                sumTotals.aparelho += aparelho; sumTotals.acessorio += acessorio; sumTotals.pelicula += pelicula; sumTotals.seguro += seguro; sumTotals.mplay += mplay; sumTotals.receita += receita;
            }

            sellerDailyData[seller] = {
                dailyRows: generatedRows,
                dailyTotals: sumTotals,
                recentSales: sellerSales.slice(0, 50) // only send a few for specific use cases, though not needed if we render on frontend
            };
        });

        // 8. Resposta Final
        res.json({
            safeVendedores,
            individualMetas,
            sellerMetricsMap,
            rankings,
            sellerDailyData
        });

    } catch (error) {
        console.error("Erro no processamento de Colaboradores:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (e) {
                console.error("Erro ao fechar conexão no Colaboradores:", e);
            }
        }
    }
};
