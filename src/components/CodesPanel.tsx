import { useMemo, useState } from 'react';
import type { CodeEntry } from '../types';

type Props = {
  codes: CodeEntry[];
  onCopy: (text: string) => void;
  onClose: () => void;
};

function kindLabel(kind: string, index?: number): string {
  if (kind === 'missao') return 'Missão';
  return index && index > 1 ? `Cofre · senha ${index}` : 'Cofre';
}

export default function CodesPanel({ codes, onCopy, onClose }: Props) {
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const filtered = codes.filter((c) => {
      if (!q) return true;
      const hay = `${c.title} ${c.code} ${c.note ?? ''}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
    const map = new Map<string, CodeEntry[]>();
    for (const c of filtered) {
      const k = c.kind === 'missao' ? 'missao' : 'cofres';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return [...map.entries()];
  }, [codes, q]);

  return (
    <div className="codes-overlay" role="dialog" aria-label="Guia de códigos">
      <div className="codes-panel">
        <header>
          <div>
            <h2>🔑 Guia de códigos</h2>
            <p>Senhas de cofres e códigos de missão · sempre à mão</p>
          </div>
          <button type="button" className="ghost" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="search">
          <input
            type="search"
            placeholder="Buscar por cofre, senha ou nota…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="codes-body">
          {groups.length === 0 && <p className="empty">Nenhum código encontrado para “{q}”.</p>}
          {groups.map(([kind, list]) => (
            <section key={kind}>
              <h3>{kind === 'missao' ? '🎮 Códigos de missão' : '🏦 Cofres & senhas'}</h3>
              <ul>
                {list.map((c) => (
                  <li key={`${c.kind}-${c.code}-${c.title}`}>
                    <div className="code-info">
                      <strong>{c.title}</strong>
                      <span className="kind-tag">{kindLabel(c.kind, c.index)}</span>
                      {c.note && <em>{c.note}</em>}
                    </div>
                    <div className="code-actions">
                      <code>{c.code}</code>
                      <button type="button" className="ghost" onClick={() => onCopy(c.code)}>
                        Copiar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer>
          Fontes: promptowy.com · gta6route.com · gtabase.com — projeto de fã, sem afiliação com a
          Rockstar / Take-Two.
        </footer>
      </div>
    </div>
  );
}
