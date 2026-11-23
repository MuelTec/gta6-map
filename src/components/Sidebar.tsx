import { useMemo, useRef } from 'react';
import { MASTER_META, SUB_LABELS } from '../data/categories';
import type { Marker, MasterId } from '../types';

type Props = {
  markers: Marker[];
  found: Set<string>;
  counts: Record<string, { total: number; found: number }>;
  query: string;
  setQuery: (v: string) => void;
  activeMasters: Set<MasterId>;
  toggleMaster: (id: MasterId) => void;
  setAllMasters: (on: boolean) => void;
  activeSubs: Set<string> | null;
  toggleSub: (id: string) => void;
  clearSubs: () => void;
  hiddenFound: boolean;
  setHiddenFound: (v: boolean) => void;
  showSubs: boolean;
  setShowSubs: (v: boolean) => void;
  totalFound: number;
  totalVisible: number;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onOpenCodes: () => void;
  onClose?: () => void;
};

const MASTER_ORDER: MasterId[] = ['carros', 'cofres', 'armas', 'lojas', 'colecionaveis', 'transporte', 'outros'];

export default function Sidebar(p: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(
    () => MASTER_ORDER.filter((id) => MASTER_META[id]).map((id) => ({
      id,
      meta: MASTER_META[id],
      subs: MASTER_META[id].subs
        .map((subId) => {
          const list = p.markers.filter((m) => m.sub === subId);
          return {
            id: subId,
            label: SUB_LABELS[subId] ?? subId,
            total: list.length,
            found: list.filter((m) => p.found.has(m.id)).length,
          };
        })
        .filter((s) => s.total > 0)
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    })),
    [p.markers, p.found],
  );

  return (
    <aside className="sidebar">
      <header className="side-head">
        <div className="brand">
          <span className="brand-emoji">🌴</span>
          <div>
            <h1>Mapa GTA VI</h1>
            <p>Leonida · guia de locais em PT-BR</p>
          </div>
        </div>
        <div className="head-actions">
          <button
            type="button"
            className="ghost codes-btn"
            onClick={p.onOpenCodes}
            title="Guia de códigos e senhas"
          >
            🔑 Códigos
          </button>
          {p.onClose && (
            <button type="button" className="ghost close-btn" onClick={p.onClose} aria-label="Fechar">
              ✕
            </button>
          )}
        </div>
      </header>

      <div className="side-progress">
        <div className="bar">
          <div
            className="bar-fill"
            style={{ width: `${p.totalVisible ? (p.totalFound / p.totalVisible) * 100 : 0}%` }}
          />
        </div>
        <span>
          <strong>{p.totalFound}</strong> / {p.totalVisible} marcados
        </span>
      </div>

      <div className="search">
        <input
          type="search"
          placeholder="Buscar local, distrito ou senha…"
          value={p.query}
          onChange={(e) => p.setQuery(e.target.value)}
        />
        {p.query && (
          <button type="button" onClick={() => p.setQuery('')} aria-label="Limpar busca">
            ✕
          </button>
        )}
      </div>

      <div className="quick-row">
        <button type="button" className="ghost" onClick={() => p.setAllMasters(true)}>
          Marcar tudo
        </button>
        <button type="button" className="ghost" onClick={() => p.setAllMasters(false)}>
          Nada
        </button>
        <label className="switch">
          <input
            type="checkbox"
            checked={p.hiddenFound}
            onChange={(e) => p.setHiddenFound(e.target.checked)}
          />
          <span>Esconder achados</span>
        </label>
      </div>

      <div className="quick-row quick-row--sub">
        <label className="switch">
          <input
            type="checkbox"
            checked={p.showSubs}
            onChange={(e) => p.setShowSubs(e.target.checked)}
          />
          <span>Detalhar subcategorias</span>
        </label>
        {p.showSubs && (
          <button type="button" className="ghost" onClick={p.clearSubs}>
            Limpar filtros
          </button>
        )}
      </div>

      <nav className="cats">
        {groups.map(({ id, meta, subs }) => {
          const c = p.counts[id] ?? { total: 0, found: 0 };
          const on = p.activeMasters.has(id);
          return (
            <section key={id} className={`cat cat--${id} ${on ? 'is-on' : ''}`}>
              <button
                type="button"
                className="cat-head"
                onClick={() => p.toggleMaster(id)}
                aria-pressed={on}
              >
                <span className="cat-dot" style={{ background: meta.color }} />
                <span className="cat-emoji">{meta.emoji}</span>
                <span className="cat-name">{meta.label}</span>
                <span className="cat-count">
                  {c.found}/{c.total}
                </span>
              </button>

              {on && p.showSubs && subs.length > 0 && (
                <div className="subs">
                  {subs.map((s) => {
                    const subOn = !p.activeSubs || p.activeSubs.has(s.id);
                    return (
                      <label key={s.id} className={`sub ${subOn ? 'is-on' : ''}`}>
                        <input
                          type="checkbox"
                          checked={subOn}
                          onChange={() => p.toggleSub(s.id)}
                        />
                        <span>{s.label}</span>
                        <em>
                          {s.found}/{s.total}
                        </em>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </nav>

      <footer className="side-foot">
        <div className="foot-row">
          <button type="button" className="ghost" onClick={p.onExport}>
            ⬇ Exportar
          </button>
          <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>
            ⬆ Importar
          </button>
          <button type="button" className="ghost danger" onClick={p.onReset}>
            ↺ Zerar
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) p.onImport(f);
            e.target.value = '';
          }}
        />
        <p className="legal">
          Projeto de fã, sem fins lucrativos. Não afiliado à Rockstar Games ou Take-Two.
          <br />
          Dados de locais: <a href="https://gta6route.com">gta6route.com</a> (CC BY 4.0) ·
          Tiles: <a href="https://gta6map.github.io">gta6map</a>
        </p>
      </footer>
    </aside>
  );
}
