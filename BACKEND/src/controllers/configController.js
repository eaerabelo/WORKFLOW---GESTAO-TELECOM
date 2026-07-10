import { getOracleConnection } from '../config/oracle.js';
// O QUE FAZ : Busca as configuracoes na tabela CONFIGURACOES e os usuarios na tabela USUARIOS
export const getConfig = async (req, res) => {
    let conn;
    try {
        const { storeId } = req.query;
        
        conn = await getOracleConnection();
        const result = await conn.execute(`SELECT DOCUMENT_DATA FROM CONFIGURACOES WHERE STORE_ID = :storeId`, { storeId });
        
        let configData = {};
        if (result.rows.length > 0) {
            configData = JSON.parse(result.rows[0].DOCUMENT_DATA);
        }

        // Buscar usuários reais da tabela SQL USUARIOS
        const usersResult = await conn.execute(`SELECT * FROM USUARIOS WHERE STORE_ID = :storeId OR STORE_ID = 'DEFAULT'`, { storeId });
        
        let usersDB = {};
        const today = new Date();

        for (let row of usersResult.rows) {
            let user = {
                username: row.USERNAME,
                name: row.NAME,
                role: row.ROLE,
                phone: row.PHONE,
                email: row.EMAIL,
                birthDate: row.BIRTH_DATE,
                vacationStart: row.VACATION_START,
                vacationEnd: row.VACATION_END
            };

            // Lógica de Férias (Bloqueio Dinâmico)
            if (user.vacationStart && user.vacationEnd) {
                const start = new Date(user.vacationStart + 'T00:00:00');
                const end = new Date(user.vacationEnd + 'T23:59:59');
                user.onVacation = (today >= start && today <= end);
            } else {
                user.onVacation = false;
            }

            // Mesclar preferências do usuário, se existirem no configData
            if (configData && configData.userPreferences && configData.userPreferences[row.USERNAME]) {
                const prefs = configData.userPreferences[row.USERNAME];
                if (prefs.viewedCampanhas) user.viewedCampanhas = prefs.viewedCampanhas;
                if (prefs.viewedGeekDocs) user.viewedGeekDocs = prefs.viewedGeekDocs;
                if (prefs.lastSeenUpdateVersion) user.lastSeenUpdateVersion = prefs.lastSeenUpdateVersion;
            }

            usersDB[row.USERNAME] = user;
        }

        configData.usersDB = usersDB;
        res.json(configData);
    } catch (error) {
        console.error("Erro ao buscar configuracoes:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) await conn.close();
    }
};

// O QUE FAZ : Sincroniza as configuracoes na tabela CONFIGURACOES (Ignorando usersDB)
export const syncConfig = async (req, res) => {
    let conn;
    try {
        const { storeId, configData } = req.body;

        if (!storeId || !configData) {
            return res.status(400).json({ error: 'Faltam dados: storeId ou configData' });
        }

        // Extrai preferências dos usuários antes de deletar usersDB
        if (configData.usersDB) {
            configData.userPreferences = configData.userPreferences || {};
            for (const [username, userData] of Object.entries(configData.usersDB)) {
                configData.userPreferences[username] = {
                    ...configData.userPreferences[username],
                    viewedCampanhas: userData.viewedCampanhas,
                    viewedGeekDocs: userData.viewedGeekDocs,
                    lastSeenUpdateVersion: userData.lastSeenUpdateVersion
                };
                // Limpa campos nulos/undefined
                Object.keys(configData.userPreferences[username]).forEach(key => {
                    if (configData.userPreferences[username][key] === undefined) {
                        delete configData.userPreferences[username][key];
                    }
                });
            }
            delete configData.usersDB;
        }

        conn = await getOracleConnection();

        await conn.execute(
            `MERGE INTO CONFIGURACOES c
            USING (SELECT :storeId AS STORE_ID FROM DUAL) src
            ON (c.STORE_ID = src.STORE_ID)
            WHEN MATCHED THEN
                UPDATE SET DOCUMENT_DATA = :documentData
            WHEN NOT MATCHED THEN
                INSERT (ID, STORE_ID, DOCUMENT_DATA) VALUES ('config', :storeId, :documentData)`,
            { storeId: storeId, documentData: JSON.stringify(configData) },
            { autoCommit: true }
        );

        // O QUE FAZ : Emite um evento para atualizar as configuracoes
        const io = req.app.get('io');
        if (io) io.emit('config-atualizada', storeId);
       
        res.json({ success: true, message: 'Configuracoes sincronizadas na Oracle!' });
    } catch (error) {
        console.error("Erro ao sincronizar config:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) await conn.close();
    }
};
