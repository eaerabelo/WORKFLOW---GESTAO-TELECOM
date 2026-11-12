// FRONTEND/src/utils/stores.js

export const STORES = [
    { id: 'DEFAULT', name: 'Administração Geral', code: 'DEV' },
    { id: 'uniao_osasco', name: 'LP UNIÃO OSASCO', code: 'AT1M' },
    { id: 'shopping_bourbon', name: 'LP BOURBON', code: 'LB46' },
    { id: 'shopping_butanta', name: 'LP BUTANTÃ', code: 'G5Z9' },
    { id: 'calcadao', name: 'LP CALÇADÃO OSASCO', code: 'LB32' },
    { id: 'shopping_higienopolis', name: 'LP HIGIENÓPOLIS', code: 'LB24' },
    { id: 'lapa', name: 'LP LAPA', code: 'FKJ6' },
    { id: 'shopping_villa_lobos', name: 'LP VILLA LOBOS', code: 'LB43' },
    { id: 'shopping_west_plaza', name: 'LP WEST PLAZA', code: 'LB36' },
    { id: 'shopping_raposo', name: 'LP RAPOSO', code: 'K7W8' }
];

export const getCurrentStore = () => {
    const storeId = typeof window !== 'undefined' ? localStorage.getItem('storeId') : null;
    return STORES.find(s => s.id === storeId) || STORES[1]; // default to uniao_osasco se falhar
};

export const getCurrentStoreName = () => {
    return String(getCurrentStore().name || '').replace(/SHOPPING/gi, 'LP');
};

export const getCurrentStoreCode = () => {
    return getCurrentStore().code;
};
