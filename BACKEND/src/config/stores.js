// backend/src/config/stores.js

export const STORES = [
  { id: "uniao_osasco", name: "LP UNIÃO OSASCO", code: "AT1M" },
  { id: "calcadao", name: "LP CALÇADÃO OSASCO", code: "LB32" },
  { id: "lapa", name: "LP LAPA", code: "FKJ6" },
  { id: "shopping_bourbon", name: "LP BOURBON", code: "LB46" },
  { id: "shopping_butanta", name: "LP BUTANTÃ", code: "G5Z9" },
  { id: "shopping_higienopolis", name: "LP HIGIENÓPOLIS", code: "LB24" },
  { id: "shopping_villa_lobos", name: "LP VILLA LOBOS", code: "LB43" },
  { id: "shopping_west_plaza", name: "LP WEST PLAZA", code: "LB36" },
  { id: "shopping_raposo", name: "LP RAPOSO", code: "K7W8" },
];

export const getStoreById = (id) => STORES.find(store => store.id === id);
