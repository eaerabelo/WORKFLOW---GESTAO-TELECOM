import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

let serviceAccount;

// Se estiver no Render (Nuvem), usa a Variável de Ambiente
if (process.env.FIREBASE_CREDENTIALS) {
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} else {
    // Se estiver no PC local, usa o arquivo .json
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
    if (existsSync(serviceAccountPath)) {
        serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    } else {
        throw new Error("Nenhuma chave do Firebase foi encontrada!");
    }
}

// Inicializa o Firebase com privilégios de Administrador
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

export { db, admin };