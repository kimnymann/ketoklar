// Data til den klikbare "forbudt / lidt forbudt / tilladt" oversigt i begynderguiden.
// Godkendt af Kim 2. september 2026.

export type FoodGroup = { heading: string; items: string[] };
export type FoodCategory = { label: string; color: string; groups: FoodGroup[] };

export const KETO_FOOD_LIST: FoodCategory[] = [
  {
    label: 'Forbudt',
    color: 'var(--rust)',
    groups: [
      { heading: 'Grøntsager under jorden', items: ['Kartofler', 'Gulerødder', 'Rødbeder', 'Majs', 'Søde kartofler', 'Pastinak'] },
      { heading: 'Korn og stivelse', items: ['Hvedemel', 'Ris', 'Pasta', 'Brød', 'Havregryn', 'Quinoa'] },
      { heading: 'Sukker', items: ['Sukker', 'Honning', 'Sirup', 'Slik', 'Is'] },
      { heading: 'Drikkevarer', items: ['Sodavand', 'Saft', 'Øl', 'Søde cocktails'] },
    ],
  },
  {
    label: 'Lidt forbudt',
    color: 'var(--sage)',
    groups: [
      { heading: 'Krydderigrøntsager', items: ['Løg', 'Hvidløg'] },
      { heading: 'Frugt', items: ['Jordbær', 'Hindbær', 'Blåbær', 'Citrusfrugt'] },
      { heading: 'Mejeri', items: ['Mælk', 'Yoghurt naturel', 'Hytteost'] },
      { heading: 'Nødder', items: ['Mandler', 'Valnødder', 'Cashewnødder'] },
      { heading: 'Drikkevarer', items: ['Tør vin', 'Spiritus uden sukker'] },
    ],
  },
  {
    label: 'Tilladt',
    color: 'var(--ink)',
    groups: [
      { heading: 'Grøntsager over jorden', items: ['Broccoli', 'Blomkål', 'Spinat', 'Grønkål', 'Courgette', 'Aubergine', 'Peberfrugt', 'Agurk', 'Tomat', 'Asparges', 'Avocado'] },
      { heading: 'Kød og fisk', items: ['Kød', 'Fisk', 'Skaldyr', 'Æg'] },
      { heading: 'Mejeri', items: ['Fløde', 'Smør', 'Parmesan', 'Cheddar', 'Feta'] },
      { heading: 'Fedtstoffer', items: ['Olivenolie', 'Kokosolie', 'Mayo'] },
      { heading: 'Drikkevarer', items: ['Vand', 'Kaffe', 'Te uden sukker'] },
    ],
  },
];
