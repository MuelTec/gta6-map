export type MasterId =
  | 'carros'
  | 'colecionaveis'
  | 'cofres'
  | 'armas'
  | 'lojas'
  | 'transporte'
  | 'outros';

export interface Marker {
  id: string;
  master: MasterId;
  /** subcategoria original (ex.: guns, modshop, safehouse…) */
  sub: string;
  cat: string;
  name: string;
  district: string;
  real?: string;
  x: number;
  y: number;
  /** senha/código quando o local tem um */
  code?: string;
  note?: string;
  source?: string;
}

export type CodeKind = 'cofre' | 'missao' | string;

export interface CodeEntry {
  id: string;
  title: string;
  where: string;
  code: string;
  kind: CodeKind;
  /** 1 = senha única; 2,3… = cofres com várias senhas */
  index?: number;
  note?: string;
  markerId?: string;
  source?: string;
}

export interface CodesDoc {
  generatedAt?: string;
  entries: CodeEntry[];
}

export interface Settings {
  hideFound: boolean;
  masters: Record<MasterId, boolean>;
  query: string;
}

export interface ProgressExport {
  app: 'gta6-map';
  version: 1;
  exportedAt: string;
  found: string[];
}
