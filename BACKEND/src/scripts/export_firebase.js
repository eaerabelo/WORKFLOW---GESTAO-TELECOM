import { db } from '../config/firebase.js';
import fs from 'fs';
import path from 'path';

async function backupFirebase() {
    console.log("Iniciando Backup do Firebase...");
    const backup = {};
    const stores = ['lapa', 'calcadao', 'uniao_osasco'];
    const collections = ['vendas', 'estoque', 'reprovados', 'geek_docs', 'campanhas'];

    try {
        for (const store of stores) {
            for (const col of collections) {
                const colName = `${col}_${store}`;
                console.log(`Baixando coleção: ${colName}...`);
                const snapshot = await db.collection(colName).get();
                backup[colName] = {};
                snapshot.forEach(doc => {
                    backup[colName][doc.id] = doc.data();
                });
            }
        }

        // Lojas (Configurações)
        console.log("Baixando coleção: lojas...");
        const lojasSnap = await db.collection('lojas').get();
        backup['lojas'] = {};
        lojasSnap.forEach(doc => {
            backup['lojas'][doc.id] = doc.data();
        });

        const outputPath = path.resolve('../BACKUP.JSON');
        fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2));
        console.log(`Backup concluído com sucesso em: ${outputPath}`);
        process.exit(0);
    } catch (e) {
        console.error("Erro no backup:", e);
        process.exit(1);
    }
}

backupFirebase();
