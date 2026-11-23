import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './map/MapView';
import Sidebar from './components/Sidebar';
import CodesPanel from './components/CodesPanel';
import { ALL_MASTERS } from './data/categories';
import type { CodeEntry, Marker, MasterId, ProgressExport } from './types';

const LS_FOUND = 'gta6:found:v1';
const LS_SETTINGS = 'gta6:settings:v1';

function loadFound(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_FOUND);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function loadSettings(): { hideFound: boolean; masters: Set<MasterId> } {
  const fallback = { hideFound: false, masters: new Set(ALL_MASTERS) };
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return fallback;
    const s = JSON.parse(raw) as { hideFound?: boolean; masters?: MasterId[] };
    const masters = Array.isArray(s.masters) ? s.masters : ALL_MASTERS;
    return {
      hideFound: !!s.hideFound,
      masters: new Set(masters.filter((m) => ALL_MASTERS.includes(m))),
    };
  } catch {
    return fallback;
  }
}

export default function App() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [codes, setCodes] = useState<CodeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const initial = useMemo(() => ({ found: loadFound(), settings: loadSettings() }), []);
  const [found, setFound] = useState<Set<string>>(initial.found);
  const [hideFound, setHideFound] = useState(initial.settings.hideFound);
  const [showSubs, setShowSubs] = useState(false);
  const [activeMasters, setActiveMasters] = useState<Set<MasterId>>(initial.settings.masters);
  const [activeSubs, setActiveSubs] = useState<Set<string> | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCodes, setShowCodes] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // --- load data ---
  useEffect(() => {
    let alive = true;
    const base = import.meta.env.BASE_URL || './';
    Promise.all([
      fetch(`${base}data/markers.json`).then((r) => {
        if (!r.ok) throw new Error(`markers.json: HTTP ${r.status}`);
        return r.json();
      }),
      fetch(`${base}data/codes.json`).then((r) => {
        if (!r.ok) throw new Error(`codes.json: HTTP ${r.status}`);
        return r.json();
      }),
    ])
      .then(([m, c]: [{ markers?: Marker[] }, { entries: CodeEntry[] }]) => {
        if (!alive) return;
        setMarkers(Array.isArray(m?.markers) ? m.markers : []);
        setCodes(Array.isArray(c?.entries) ? c.entries : []);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      alive = false;
    };
  }, []);

  // --- persist ---
  useEffect(() => {
    localStorage.setItem(LS_FOUND, JSON.stringify([...found]));
  }, [found]);

  useEffect(() => {
    localStorage.setItem(
      LS_SETTINGS,
      JSON.stringify({ hideFound, masters: [...activeMasters] }),
    );
  }, [hideFound, activeMasters]);

  // --- toast ---
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const copy = useCallback((text: string) => {
    const done = () => setToast(`Copiado: ${text}`);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => setToast('Não foi possível copiar'));
    } else {
      setToast('Código: ' + text);
    }
  }, []);

  const toggleFound = useCallback((id: string) => {
    setFound((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleMaster = useCallback((id: MasterId) => {
    setActiveMasters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setActiveSubs(null);
  }, []);

  const setAllMasters = useCallback((on: boolean) => {
    setActiveMasters(on ? new Set(ALL_MASTERS) : new Set());
    setActiveSubs(null);
  }, []);

  const toggleSub = useCallback((id: string) => {
    setActiveSubs((prev) => {
      // first interaction: start from "all on" for the visible masters
      const base = prev ?? new Set<string>();
      const next = new Set(base);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // counts per master
  const counts = useMemo(() => {
    const out: Record<string, { total: number; found: number }> = {};
    for (const m of ALL_MASTERS) out[m] = { total: 0, found: 0 };
    for (const m of markers) {
      const c = out[m.master];
      if (!c) continue;
      c.total++;
      if (found.has(m.id)) c.found++;
    }
    return out;
  }, [markers, found]);

  // locais que passam nos filtros atuais (base da barra de progresso)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return markers.filter((m) => {
      if (!activeMasters.has(m.master)) return false;
      if (activeSubs && !activeSubs.has(m.sub)) return false;
      if (q) {
        const hay = `${m.name} ${m.district} ${m.sub} ${m.master} ${m.code ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [markers, query, activeMasters, activeSubs]);

  // o denominador não desconta os achados, mesmo com "esconder achados" ligado
  const totalVisible = filtered.length;
  const totalFound = useMemo(
    () => filtered.reduce((n, m) => (found.has(m.id) ? n + 1 : n), 0),
    [filtered, found],
  );

  const onExport = useCallback(() => {
    const data: ProgressExport = {
      app: 'gta6-map',
      version: 1,
      exportedAt: new Date().toISOString(),
      found: [...found],
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gta6-map-progresso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('Progresso exportado');
  }, [found]);

  const onImport = useCallback(
    (file: File) => {
      file
        .text()
        .then((txt) => {
          const data = JSON.parse(txt) as ProgressExport;
          if (data?.app !== 'gta6-map' || !Array.isArray(data.found)) {
            throw new Error('Arquivo inválido');
          }
          setFound(new Set(data.found));
          setToast(`Importado: ${data.found.length} locais`);
        })
        .catch((e: unknown) => setToast(e instanceof Error ? e.message : 'Falha ao importar'));
    },
    [],
  );

  const onReset = useCallback(() => {
    if (window.confirm('Zerar todo o progresso marcado?')) {
      setFound(new Set());
      setToast('Progresso zerado');
    }
  }, []);

  if (error) {
    return (
      <div className="fatal">
        <h2>Não foi possível carregar os dados</h2>
        <p>{error}</p>
        <p>Se você clonou o repositório, rode <code>npm run data</code> antes de iniciar.</p>
      </div>
    );
  }

  return (
    <div className="app">
      <button
        type="button"
        className="fab fab-menu"
        onClick={() => setDrawerOpen((v) => !v)}
        aria-label="Abrir filtros"
      >
        ☰
      </button>
      <button type="button" className="fab fab-codes" onClick={() => setShowCodes(true)}>
        🔑 Códigos
      </button>

      <div className={`drawer ${drawerOpen ? 'is-open' : ''}`}>
        <Sidebar
          markers={markers}
          found={found}
          counts={counts}
          query={query}
          setQuery={setQuery}
          activeMasters={activeMasters}
          toggleMaster={toggleMaster}
          setAllMasters={setAllMasters}
          activeSubs={activeSubs}
          toggleSub={toggleSub}
          clearSubs={() => setActiveSubs(null)}
          hiddenFound={hideFound}
          setHiddenFound={setHideFound}
          showSubs={showSubs}
          setShowSubs={setShowSubs}
          totalFound={totalFound}
          totalVisible={totalVisible}
          onExport={onExport}
          onImport={onImport}
          onReset={onReset}
          onOpenCodes={() => {
            setShowCodes(true);
            setDrawerOpen(false);
          }}
          onClose={() => setDrawerOpen(false)}
        />
      </div>

      <MapView
        markers={markers}
        query={query.trim().toLowerCase()}
        activeMasters={activeMasters}
        activeSubs={activeSubs}
        hiddenFound={hideFound}
        found={found}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onToggleFound={toggleFound}
        onCopy={copy}
      />

      {showCodes && <CodesPanel codes={codes} onCopy={copy} onClose={() => setShowCodes(false)} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
