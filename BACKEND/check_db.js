import { db } from './firebase.js';

async function checkCollections() {
  try {
    const lapa = await db.collection('vendas_lapa').count().get();
    console.log('vendas_lapa count:', lapa.data().count);
    
    const osasco = await db.collection('vendas_uniao_osasco').count().get();
    console.log('vendas_uniao_osasco count:', osasco.data().count);
    
    const calcadao = await db.collection('vendas_calcadao').count().get();
    console.log('vendas_calcadao count:', calcadao.data().count);

  } catch(e) {
    console.error('Error:', e);
  }
  process.exit();
}

checkCollections();
