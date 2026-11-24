/* AUTOGERADO por scripts/fetch-gta6route.mjs — não edite à mão.
 * Fonte: gta6route.com (map-config.cats): nome PT-BR, cor e ícone SVG por categoria. */
export interface GtaCat {
  id: string;
  name: string;
  one: string;
  color: string;
  icon: string;
}

export const GTA_CATS: Record<string, GtaCat> = {
 "egg": {
  "id": "egg",
  "name": "Easter eggs",
  "one": "Easter egg",
  "color": "#ff2d8a",
  "icon": "<path d=\"M12 2C8 2 4 8 4 14a8 8 0 0 0 16 0c0-6-4-12-8-12\"/>"
 },
 "car": {
  "id": "car",
  "name": "Carros raros",
  "one": "Carro raro",
  "color": "#e08a00",
  "icon": "<path d=\"m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8\"/><path d=\"M7 14h.01\"/><path d=\"M17 14h.01\"/><rect width=\"18\" height=\"8\" x=\"3\" y=\"10\" rx=\"2\"/><path d=\"M5 18v2\"/><path d=\"M19 18v2\"/>"
 },
 "guns": {
  "id": "guns",
  "name": "Lojas de armas",
  "one": "Loja de armas",
  "color": "#dc2626",
  "icon": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"22\" x2=\"18\" y1=\"12\" y2=\"12\"/><line x1=\"6\" x2=\"2\" y1=\"12\" y2=\"12\"/><line x1=\"12\" x2=\"12\" y1=\"6\" y2=\"2\"/><line x1=\"12\" x2=\"12\" y1=\"22\" y2=\"18\"/>"
 },
 "fence": {
  "id": "fence",
  "name": "Casas de penhores",
  "one": "Casa de penhores",
  "color": "#9333ea",
  "icon": "<path d=\"M10.5 3 8 9l4 13 4-13-2.5-6\"/><path d=\"M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z\"/><path d=\"M2 9h20\"/>"
 },
 "clothes": {
  "id": "clothes",
  "name": "Roupas",
  "one": "Loja de roupas",
  "color": "#db2777",
  "icon": "<path d=\"M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z\"/>"
 },
 "shoes": {
  "id": "shoes",
  "name": "Calçados",
  "one": "Loja de calçados",
  "color": "#be185d",
  "icon": "<path d=\"M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z\"/><path d=\"M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z\"/><path d=\"M16 17h4\"/><path d=\"M4 13h4\"/>"
 },
 "hair": {
  "id": "hair",
  "name": "Cabelo e barba",
  "one": "Salão / barbearia",
  "color": "#c026d3",
  "icon": "<circle cx=\"6\" cy=\"6\" r=\"3\"/><path d=\"M8.12 8.12 12 12\"/><path d=\"M20 4 8.12 15.88\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><path d=\"M14.8 14.8 20 20\"/>"
 },
 "tattoos": {
  "id": "tattoos",
  "name": "Tatuagens",
  "one": "Estúdio de tatuagem",
  "color": "#7c3aed",
  "icon": "<path d=\"m18 13-.654-4.736a4 4 0 00-2.756-3.266l-9.163-2.9a2 2 0 00-2.017.493l-.82.819a2 2 0 00-.492 2.017l2.9 9.163a4 4 0 003.266 2.756L13 18\"/><path d=\"M18.648 12.352a1.205 1.205 0 011.704 0l1.296 1.296a1.205 1.205 0 010 1.704l-6.296 6.296a1.205 1.205 0 01-1.704 0l-1.296-1.296a1.205 1.205 0 010-1.704z\"/><path d=\"m3 3 6.586 6.586\"/><circle cx=\"11\" cy=\"11\" r=\"2\"/>"
 },
 "electronics": {
  "id": "electronics",
  "name": "Eletrônicos",
  "one": "Loja de eletrônicos",
  "color": "#4f46e5",
  "icon": "<rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"2\" ry=\"2\"/><path d=\"M12 18h.01\"/>"
 },
 "store": {
  "id": "store",
  "name": "Mercados e conveniência",
  "one": "Mercado / conveniência",
  "color": "#16a34a",
  "icon": "<path d=\"m15 11-1 9\"/><path d=\"m19 11-4-7\"/><path d=\"M2 11h20\"/><path d=\"m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4\"/><path d=\"M4.5 15.5h15\"/><path d=\"m5 11 4-7\"/><path d=\"m9 11 1 9\"/>"
 },
 "shop": {
  "id": "shop",
  "name": "Outras lojas",
  "one": "Loja",
  "color": "#0d9488",
  "icon": "<path d=\"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5\"/><path d=\"M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244\"/><path d=\"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05\"/>"
 },
 "food": {
  "id": "food",
  "name": "Restaurantes e lanches",
  "one": "Restaurante / lanche",
  "color": "#ea580c",
  "icon": "<path d=\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\"/><path d=\"M7 2v20\"/><path d=\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\"/>"
 },
 "bar": {
  "id": "bar",
  "name": "Bares",
  "one": "Bar",
  "color": "#b45309",
  "icon": "<path d=\"M12 12 4.207 4.207A.707.707 0 0 1 4.707 3h14.586a.707.707 0 0 1 .5 1.207z\"/><path d=\"M12 12v10\"/><path d=\"M7 22h10\"/>"
 },
 "club": {
  "id": "club",
  "name": "Casas noturnas",
  "one": "Casa noturna",
  "color": "#be123c",
  "icon": "<path d=\"M21 16V3a1 1 0 0 0-1.28-.96l-10 2.917a1 1 0 0 0-.72.96V19\"/><circle cx=\"18\" cy=\"16\" r=\"3\"/><circle cx=\"6\" cy=\"19\" r=\"3\"/>"
 },
 "gas": {
  "id": "gas",
  "name": "Postos de gasolina",
  "one": "Posto de gasolina",
  "color": "#ca8a04",
  "icon": "<path d=\"M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5\"/><path d=\"M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16\"/><path d=\"M2 21h13\"/><path d=\"M3 9h11\"/>"
 },
 "modshop": {
  "id": "modshop",
  "name": "Oficinas de tuning",
  "one": "Oficina de tuning",
  "color": "#2563eb",
  "icon": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z\"/>"
 },
 "spray": {
  "id": "spray",
  "name": "Pay 'n' Spray",
  "one": "Pay 'n' Spray",
  "color": "#0891b2",
  "icon": "<path d=\"m12 19 8-3\"/><path d=\"M14 6h-2\"/><path d=\"M18 8.172V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v3.172\"/><path d=\"m20 11-8 3\"/><path d=\"M20 20a2 2 0 01-2 2h-4a2 2 0 01-2-2v-9a3 3 0 013-3h2a3 3 0 013 3z\"/><path d=\"M4 10h.01\"/><path d=\"M4 2h.01\"/><path d=\"M4 6h.01\"/><path d=\"M8 4h.01\"/><path d=\"M8 8h.01\"/>"
 },
 "carwash": {
  "id": "carwash",
  "name": "Lava-rápidos",
  "one": "Lava-rápido",
  "color": "#0284c7",
  "icon": "<path d=\"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z\"/><path d=\"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97\"/>"
 },
 "airport": {
  "id": "airport",
  "name": "Aeroportos e pistas",
  "one": "Pista de pouso",
  "color": "#475569",
  "icon": "<path d=\"M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z\"/>"
 },
 "train": {
  "id": "train",
  "name": "Estações de trem",
  "one": "Estação de trem",
  "color": "#78716c",
  "icon": "<path d=\"M8 3.1V7a4 4 0 0 0 8 0V3.1\"/><path d=\"m9 15-1-1\"/><path d=\"m15 15 1-1\"/><path d=\"M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z\"/><path d=\"m8 19-2 3\"/><path d=\"m16 19 2 3\"/>"
 },
 "metro": {
  "id": "metro",
  "name": "Estações de metrô",
  "one": "Estação de metrô",
  "color": "#0f766e",
  "icon": "<rect width=\"16\" height=\"16\" x=\"4\" y=\"3\" rx=\"2\"/><path d=\"M4 11h16\"/><path d=\"M12 3v8\"/><path d=\"m8 19-2 3\"/><path d=\"m18 22-2-3\"/><path d=\"M8 15h.01\"/><path d=\"M16 15h.01\"/>"
 },
 "bus": {
  "id": "bus",
  "name": "Pontos de ônibus",
  "one": "Ponto de ônibus",
  "color": "#4d7c0f",
  "icon": "<path d=\"M4 6 2 7\"/><path d=\"M10 6h4\"/><path d=\"m22 7-2-1\"/><rect width=\"16\" height=\"16\" x=\"4\" y=\"3\" rx=\"2\"/><path d=\"M4 11h16\"/><path d=\"M8 15h.01\"/><path d=\"M16 15h.01\"/><path d=\"M6 19v2\"/><path d=\"M18 21v-2\"/>"
 },
 "marina": {
  "id": "marina",
  "name": "Marinas",
  "one": "Marina",
  "color": "#1d4ed8",
  "icon": "<path d=\"M12 6v16\"/><path d=\"m19 13 2-1a9 9 0 0 1-18 0l2 1\"/><path d=\"M9 11h6\"/><circle cx=\"12\" cy=\"4\" r=\"2\"/>"
 },
 "sport": {
  "id": "sport",
  "name": "Esportes",
  "one": "Quadra / academia",
  "color": "#65a30d",
  "icon": "<path d=\"M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2\"/><path d=\"M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2\"/><path d=\"M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3\"/><path d=\"M4 22h16\"/><path d=\"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z\"/><path d=\"M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3\"/>"
 },
 "race": {
  "id": "race",
  "name": "Pistas de corrida",
  "one": "Pista de corrida",
  "color": "#b91c1c",
  "icon": "<path d=\"M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528\"/>"
 },
 "fun": {
  "id": "fun",
  "name": "Diversão e eventos",
  "one": "Lazer",
  "color": "#a21caf",
  "icon": "<circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M12 2v4\"/><path d=\"m6.8 15-3.5 2\"/><path d=\"m20.7 7-3.5 2\"/><path d=\"M6.8 9 3.3 7\"/><path d=\"m20.7 17-3.5-2\"/><path d=\"m9 22 3-8 3 8\"/><path d=\"M8 22h8\"/><path d=\"M18 18.7a9 9 0 1 0-12 0\"/>"
 },
 "safehouse": {
  "id": "safehouse",
  "name": "Esconderijos",
  "one": "Esconderijo",
  "color": "#059669",
  "icon": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\"/><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/>"
 },
 "military": {
  "id": "military",
  "name": "Militar e Forças Armadas",
  "one": "Área militar",
  "color": "#6b7f2a",
  "icon": "<path d=\"m13 19 6-6\"/><path d=\"M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5\"/><path d=\"m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586\"/><path d=\"m16 16 4 4\"/><path d=\"m19 21 2-2\"/><path d=\"m5 14 4 4\"/><path d=\"m5 21-2-2\"/><path d=\"M7.5 16.5 4 20\"/>"
 },
 "police": {
  "id": "police",
  "name": "Polícia e prisões",
  "one": "Delegacia",
  "color": "#1e40af",
  "icon": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/>"
 },
 "hospital": {
  "id": "hospital",
  "name": "Hospitais",
  "one": "Hospital",
  "color": "#e11d48",
  "icon": "<path d=\"M4 9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a1 1 0 0 1 1 1v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a1 1 0 0 1 1-1h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4a1 1 0 0 1-1-1V4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4a1 1 0 0 1-1 1z\"/>"
 },
 "hotel": {
  "id": "hotel",
  "name": "Hotéis",
  "one": "Hotel",
  "color": "#7e22ce",
  "icon": "<path d=\"M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8\"/><path d=\"M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4\"/><path d=\"M12 4v6\"/><path d=\"M2 18h20\"/>"
 },
 "landmark": {
  "id": "landmark",
  "name": "Pontos turísticos",
  "one": "Ponto turístico",
  "color": "#c2410c",
  "icon": "<path d=\"M10 18v-7\"/><path d=\"M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z\"/><path d=\"M14 18v-7\"/><path d=\"M18 18v-7\"/><path d=\"M3 22h18\"/><path d=\"M6 18v-7\"/>"
 },
 "curio": {
  "id": "curio",
  "name": "Curiosidades",
  "one": "Curiosidade",
  "color": "#6d28d9",
  "icon": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>"
 },
 "nature": {
  "id": "nature",
  "name": "Natureza",
  "one": "Natureza",
  "color": "#15803d",
  "icon": "<path d=\"M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z\"/><path d=\"M7 16v6\"/><path d=\"M13 19v3\"/><path d=\"M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5\"/>"
 },
 "gov": {
  "id": "gov",
  "name": "Prédios públicos",
  "one": "Prédio público",
  "color": "#334155",
  "icon": "<path d=\"M10 12h4\"/><path d=\"M10 8h4\"/><path d=\"M14 21v-3a2 2 0 0 0-4 0v3\"/><path d=\"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2\"/><path d=\"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16\"/>"
 },
 "industry": {
  "id": "industry",
  "name": "Indústria e torres",
  "one": "Indústria",
  "color": "#57534e",
  "icon": "<path d=\"M12 16h.01\"/><path d=\"M16 16h.01\"/><path d=\"M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z\"/><path d=\"M8 16h.01\"/>"
 },
 "infra": {
  "id": "infra",
  "name": "Pontes e estações",
  "one": "Infraestrutura",
  "color": "#52525b",
  "icon": "<path d=\"M9 5h8.5a1 1 0 010 7h-11a1 1 0 000 7H15\"/><circle cx=\"18\" cy=\"19\" r=\"3\"/><circle cx=\"6\" cy=\"5\" r=\"3\"/>"
 },
 "home": {
  "id": "home",
  "name": "Residências e escritórios",
  "one": "Prédio",
  "color": "#64748b",
  "icon": "<path d=\"M12 10h.01\"/><path d=\"M12 14h.01\"/><path d=\"M12 6h.01\"/><path d=\"M16 10h.01\"/><path d=\"M16 14h.01\"/><path d=\"M16 6h.01\"/><path d=\"M8 10h.01\"/><path d=\"M8 14h.01\"/><path d=\"M8 6h.01\"/><path d=\"M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3\"/><rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"2\"/>"
 },
 "other": {
  "id": "other",
  "name": "Outros locais",
  "one": "Local",
  "color": "#71717a",
  "icon": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/>"
 }
};
