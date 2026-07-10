// backend/src/config/stores.js

export const STORES = [
  { id: "uniao_osasco", name: "UNIÃO OSASCO", code: "AT1M" },
  { id: "calcadao", name: "CALÇADÃO OSASCO", code: "LB32" },
  { id: "lapa", name: "LAPA", code: "FKJ6" },
  { id: "shopping_bourbon", name: "BOURBON", code: "LB46" },
  { id: "shopping_butanta", name: "BUTANTÃ", code: "G5Z9" },
  { id: "shopping_higienopolis", name: "HIGIENÓPOLIS", code: "LB24" },
  { id: "shopping_villa_lobos", name: "VILLA LOBOS", code: "LB43" },
  { id: "shopping_west_plaza", name: "WEST PLAZA", code: "LB36" },
];

export const getStoreById = (id) => STORES.find(store => store.id === id);
