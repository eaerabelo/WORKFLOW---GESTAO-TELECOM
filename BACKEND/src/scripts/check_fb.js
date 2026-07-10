import { db } from '../config/firebase.js';

async function test() {
    console.log("Docs in vendas_uniao_osasco:");
    const docs = await db.collection('vendas_uniao_osasco').limit(5).get();
    docs.forEach(d => console.log(d.id, d.data()));
    process.exit(0);
}
test();
