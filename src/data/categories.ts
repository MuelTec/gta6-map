import type { MasterId } from '../types';

export interface MasterMeta {
  label: string;
  emoji: string;
  color: string;
  subs: string[];
}

/** Categorias principais (o que o usuário liga/desliga no painel). */
export const MASTER_META: Record<MasterId, MasterMeta> = {
  carros: {
    label: 'Carros raros',
    emoji: '🚗',
    color: '#38bdf8',
    subs: ['car'],
  },
  colecionaveis: {
    label: 'Easter eggs',
    emoji: '💎',
    color: '#c084fc',
    subs: ['egg'],
  },
  cofres: {
    label: 'Cofres e bancos',
    emoji: '🔐',
    color: '#fbbf24',
    subs: ['cofre'],
  },
  armas: {
    label: 'Armas',
    emoji: '🔫',
    color: '#f87171',
    subs: ['guns'],
  },
  lojas: {
    label: 'Lojas e serviços',
    emoji: '🏪',
    color: '#4ade80',
    subs: [
      'store', 'shop', 'food', 'bar', 'club', 'fence', 'clothes', 'shoes',
      'hair', 'tattoos', 'electronics', 'gas', 'modshop', 'spray', 'carwash',
    ],
  },
  transporte: {
    label: 'Transporte',
    emoji: '🚌',
    color: '#22d3ee',
    subs: ['airport', 'train', 'metro', 'bus', 'marina'],
  },
  outros: {
    label: 'Outros locais',
    emoji: '📍',
    color: '#94a3b8',
    subs: [
      'safehouse', 'military', 'police', 'hospital', 'sport', 'race', 'fun',
      'landmark', 'hotel', 'curio', 'nature', 'gov', 'industry', 'infra',
      'home', 'other',
    ],
  },
};

export const ALL_MASTERS: MasterId[] = [
  'carros', 'colecionaveis', 'cofres', 'armas', 'lojas', 'transporte', 'outros',
];

/** Rótulos PT-BR das subcategorias (origem: gta6route.com). */
export const SUB_LABELS: Record<string, string> = {
  car: 'Carros raros',
  egg: 'Easter eggs',
  cofre: 'Cofres e bancos',
  guns: 'Lojas de armas',
  safehouse: 'Esconderijos',
  gas: 'Postos de gasolina',
  modshop: 'Oficinas de tuning',
  spray: "Pay 'n' Spray",
  carwash: 'Lava-rápidos',
  airport: 'Aeroportos e pistas',
  military: 'Militar e Forças Armadas',
  train: 'Estações de trem',
  metro: 'Estações de metrô',
  bus: 'Pontos de ônibus',
  marina: 'Marinas',
  fence: 'Casas de penhores',
  clothes: 'Roupas',
  shoes: 'Calçados',
  hair: 'Cabelo e barba',
  tattoos: 'Tatuagens',
  electronics: 'Eletrônicos',
  store: 'Mercados e conveniência',
  food: 'Restaurantes e lanches',
  bar: 'Bares',
  club: 'Casas noturnas',
  sport: 'Esportes',
  race: 'Pistas de corrida',
  fun: 'Diversão e eventos',
  police: 'Polícia e prisões',
  hospital: 'Hospitais',
  landmark: 'Pontos turísticos',
  hotel: 'Hotéis',
  curio: 'Curiosidades',
  nature: 'Natureza',
  shop: 'Outras lojas',
  gov: 'Prédios públicos',
  industry: 'Indústria e torres',
  infra: 'Pontes e estações',
  home: 'Residências e escritórios',
  other: 'Outros locais',
};

/** Busca sem acento/caixa-alta. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
