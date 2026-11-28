import { useMemo } from 'react';
import { MASTER_META } from '../data/categories';
import type { Marker } from '../types';

type Props = {
  markers: Marker[];
  found: Set<string>;
  favorites: Set<string>;
  notes: Record<string, string>;
  onClose: () => void;
};

interface Bucket {
  total: number;
  done: number;
}

function bump(map: Map<string, Bucket>, key: string, ok: boolean) {
  const b = map.get(key) ?? { total: 0, done: 0 };
  b.total += 1;
  if (ok) b.done += 1;
  map.set(key, b);
}

/** 0% quando vazio; "<1%" quando há progresso mas arredonda para zero. */
function fmtPct(done: number, total: number): string {
  if (!total || !done) return '0%';
  const p = (done / total) * 100;
  return p < 1 ? '<1%' : `${Math.round(p)}%`;
}

function Row({ label, b, color }: { label: string; b: Bucket; color?: string }) {
  const pct = b.total ? (b.done / b.total) * 100 : 0;
  return (
    <li>
      <span className="stat-label" title={label}>
        {label}
      </span>
      <span className="stat-track">
        <span className="stat-fill" style={{ width: `${pct}%`, background: color ?? 'var(--accent)' }} />
      </span>
      <span className="stat-num">
        {b.done}/{b.total} · <strong>{fmtPct(b.done, b.total)}</strong>
      </span>
    </li>
  );
}

/** Painel de estatísticas: conclusão geral, por categoria e por distrito. */
export default function StatsPanel({ markers, found, favorites, notes, onClose }: Props) {
  const s = useMemo(() => {
    const total = markers.length;
    let done = 0;
    let favs = 0;
    let noted = 0;
    const byMaster = new Map<string, Bucket>();
    const byDistrict = new Map<string, Bucket>();
    for (const m of markers) {
      const ok = found.has(m.id);
      if (ok) done += 1;
      if (favorites.has(m.id)) favs += 1;
      if (notes[m.id]) noted += 1;
      const meta = MASTER_META[m.master];
      bump(byMaster, meta?.label ?? m.master, ok);
      if (m.district) bump(byDistrict, m.district, ok);
    }
    const districts = [...byDistrict.entries()].sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]));
    return { total, done, favs, noted, byMaster: [...byMaster.entries()], districts };
  }, [markers, found, favorites, notes]);

  return (
    <div className="codes-overlay" role="dialog" aria-label="Estatísticas">
      <div className="codes-panel">
        <header>
          <div>
            <h2>📊 Estatísticas</h2>
            <p>Progresso por categoria e distrito · favoritos e anotações</p>
          </div>
          <button type="button" className="ghost" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="codes-body">
          <section className="stat-summary">
            <div className="stat-big">
              <strong>{fmtPct(s.done, s.total)}</strong>
              <span>
                {s.done} de {s.total} locais
              </span>
            </div>
            <div className="stat-extras">
              <span title="Locais com estrela de favorito">★ {s.favs} favoritos</span>
              <span title="Locais com anotação pessoal">📝 {s.noted} anotações</span>
            </div>
          </section>

          <section>
            <h3>🏷️ Por categoria</h3>
            <ul className="stat-list">
              {s.byMaster.map(([label, b]) => (
                <Row key={label} label={label} b={b} color={Object.values(MASTER_META).find((m) => m.label === label)?.color} />
              ))}
            </ul>
          </section>

          <section>
            <h3>🗺️ Por distrito</h3>
            {s.districts.length === 0 && <p className="empty">Sem distritos para mostrar.</p>}
            <ul className="stat-list">
              {s.districts.map(([label, b]) => (
                <Row key={label} label={label} b={b} color="#22d3ee" />
              ))}
            </ul>
          </section>
        </div>

        <footer>Conta apenas os locais presentes no mapa (removidos não entram na conta).</footer>
      </div>
    </div>
  );
}
