// FRONTEND/src/utils/stores.js

export const STORES = [
    { id: 'DEFAULT', name: 'Administração Geral', code: 'DEV' },
    { id: 'uniao_osasco', name: 'UNIÃO OSASCO', code: 'AT1M' },
    { id: 'shopping_bourbon', name: 'BOURBON', code: 'LB46' },
    { id: 'shopping_butanta', name: 'BUTANTÃ', code: 'G5Z9' },
    { id: 'calcadao', name: 'CALÇADÃO OSASCO', code: 'LB32' },
    { id: 'shopping_higienopolis', name: 'HIGIENÓPOLIS', code: 'LB24' },
    { id: 'lapa', name: 'LAPA', code: 'FKJ6' },
    { id: 'shopping_villa_lobos', name: 'VILLA LOBOS', code: 'LB43' },
    { id: 'shopping_west_plaza', name: 'WEST PLAZA', code: 'LB36' },
    { id: 'shopping_raposo', name: 'SHOPPING RAPOSO', code: 'K7W8' }
];

export const getCurrentStore = () => {
    const storeId = typeof window !== 'undefined' ? localStorage.getItem('storeId') : null;
    return STORES.find(s => s.id === storeId) || STORES[1]; // default to uniao_osasco se falhar
};

export const getCurrentStoreName = () => {
    return getCurrentStore().name;
};

export const getCurrentStoreCode = () => {
    return getCurrentStore().code;
};
