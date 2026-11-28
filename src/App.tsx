import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './map/MapView';
import Sidebar from './components/Sidebar';
import CodesPanel from './components/CodesPanel';
import AddMarkerForm from './components/AddMarkerForm';
import StatsPanel from './components/StatsPanel';
import { ALL_MASTERS, masterForSub } from './data/categories';
import type { CodeEntry, Marker, MasterId, ProgressExport } from './types';

const LS_FOUND = 'gta6:found:v1';
const LS_SETTINGS = 'gta6:settings:v1';
const LS_CUSTOM = 'gta6:custom:v1';
const LS_REMOVED = 'gta6:removed:v1';
const LS_CODES = 'gta6:codes:v1';
const LS_FAVS = 'gta6:favs:v1';
const LS_NOTES = 'gta6:notes:v1';

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

function loadCustom(): Marker[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOM);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Marker[];
    if (!Array.isArray(arr)) return [];
    return arr.filter((m) => m && typeof m.id === 'string' && typeof m.x === 'number' && typeof m.y === 'number');
  } catch {
    return [];
  }
}

function loadRemoved(): string[] {
  try {
    const raw = localStorage.getItem(LS_REMOVED);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown[];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function loadCodes(): Record<string, string> {
  return loadNoteMap(LS_CODES);
}

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_FAVS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function loadNoteMap(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const obj = JSON.parse(raw) as Record<string, unknown>;
    if (!obj || typeof obj !== 'object') return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) if (typeof v === 'string') out[k] = v;
    return out;
  } catch {
    return {};
  }
}

function loadNotes(): Record<string, string> {
  return loadNoteMap(LS_NOTES);
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
  const [baseMarkers, setBaseMarkers] = useState<Marker[]>([]);
  const [codes, setCodes] = useState<CodeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const initial = useMemo(
    () => ({
      found: loadFound(),
      settings: loadSettings(),
      custom: loadCustom(),
      removed: loadRemoved(),
      userCodes: loadCodes(),
      favorites: loadFavorites(),
      notes: loadNotes(),
    }),
    [],
  );
  const [found, setFound] = useState<Set<string>>(initial.found);
  const [custom, setCustom] = useState<Marker[]>(initial.custom);
  const [removed, setRemoved] = useState<string[]>(initial.removed);
  const [customCodes, setCustomCodes] = useState<Record<string, string>>(initial.userCodes);
  const [picking, setPicking] = useState(false);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
  const [hideFound, setHideFound] = useState(initial.settings.hideFound);
  const [showSubs, setShowSubs] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMasters, setActiveMasters] = useState<Set<MasterId>>(initial.settings.masters);
  const [activeSubs, setActiveSubs] = useState<Set<string> | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCodes, setShowCodes] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(initial.favorites);
  const [notes, setNotes] = useState<Record<string, string>>(initial.notes);
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
        setBaseMarkers(Array.isArray(m?.markers) ? m.markers : []);
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
    localStorage.setItem(LS_CUSTOM, JSON.stringify(custom));
  }, [custom]);

  useEffect(() => {
    localStorage.setItem(LS_REMOVED, JSON.stringify(removed));
  }, [removed]);

  useEffect(() => {
    localStorage.setItem(LS_CODES, JSON.stringify(customCodes));
  }, [customCodes]);

  useEffect(() => {
    localStorage.setItem(LS_FAVS, JSON.stringify([...favorites]));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(LS_NOTES, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(
      LS_SETTINGS,
      JSON.stringify({ hideFound, masters: [...activeMasters] }),
    );
  }, [hideFound, activeMasters]);

  // --- locais visíveis: oficiais (menos os removidos) + criados pelo usuário ---
  const removedSet = useMemo(() => new Set(removed), [removed]);
  const markers = useMemo(
    () => [...baseMarkers.filter((m) => !removedSet.has(m.id)), ...custom],
    [baseMarkers, removedSet, custom],
  );

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

  // --- adicionar / remover locais ---
  const startAdd = useCallback(() => {
    setDrawerOpen(false);
    setPendingPos(null);
    setPicking(true);
    setToast('Clique no mapa para escolher a posição');
  }, []);

  // --- atalhos globais: Esc fecha camadas, / foca a busca, A adiciona local ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        !!t &&
        (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

      if (e.key === 'Escape') {
        if (picking) setPicking(false);
        else if (pendingPos) setPendingPos(null);
        else if (selectMode) {
          setSelectMode(false);
          setSelectedIds(new Set());
        } else if (showStats) setShowStats(false);
        else if (showCodes) setShowCodes(false);
        else if (drawerOpen) setDrawerOpen(false);
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        const el = document.getElementById('g6-search');
        if (el instanceof HTMLInputElement) {
          el.focus();
          el.select();
        }
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        startAdd();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picking, pendingPos, showCodes, showStats, drawerOpen, selectMode, startAdd]);

  const cancelPick = useCallback(() => {
    setPicking(false);
    setPendingPos(null);
  }, []);

  const onPick = useCallback((x: number, y: number) => {
    setPicking(false);
    setPendingPos({ x, y });
  }, []);

  const addMarker = useCallback(
    (data: { name: string; sub: string; code: string; note: string }) => {
      if (!pendingPos) return;
      const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const m: Marker = {
        id,
        master: masterForSub(data.sub),
        sub: data.sub,
        cat: data.sub,
        name: data.name,
        district: '',
        x: Math.round(pendingPos.x),
        y: Math.round(pendingPos.y),
        custom: true,
        ...(data.note ? { note: data.note } : {}),
      };
      setCustom((prev) => [...prev, m]);
      if (data.code) setCustomCodes((prev) => ({ ...prev, [id]: data.code }));
      setPendingPos(null);
      setToast(`Local adicionado: ${m.name}`);
    },
    [pendingPos],
  );

  const removeMarker = useCallback(
    (id: string) => {
      const target = markers.find((m) => m.id === id);
      const name = target?.name ?? 'este local';
      const isCustom = custom.some((m) => m.id === id);
      const msg = isCustom
        ? `Remover "${name}" (criado por você)?`
        : `Remover "${name}" do mapa? Dá para restaurar depois.`;
      if (!window.confirm(msg)) return;
      if (isCustom) {
        setCustom((prev) => prev.filter((m) => m.id !== id));
        setCustomCodes((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setNotes((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setFound((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        setRemoved((prev) => (prev.includes(id) ? prev : [...prev, id]));
      }
      setToast('Local removido');
    },
    [markers, custom],
  );

  const saveCode = useCallback((id: string, code: string) => {
    setCustomCodes((prev) => ({ ...prev, [id]: code }));
    setToast('Senha salva');
  }, []);

  const clearCode = useCallback((id: string) => {
    setCustomCodes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setToast('Senha removida');
  }, []);

  // --- favoritos (estrela) e anotações pessoais ---
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const saveNote = useCallback((id: string, text: string) => {
    const v = text.trim();
    setNotes((prev) => {
      const next = { ...prev };
      if (v) next[id] = v;
      else delete next[id];
      return next;
    });
    setToast(v ? 'Nota salva' : 'Nota removida');
  }, []);

  const restoreRemoved = useCallback(() => {
    setRemoved([]);
    setToast('Locais restaurados');
  }, []);

  // --- seleção em lote (modo seleção) ---
  const toggleSelectMode = useCallback(() => {
    setSelectMode((v) => {
      if (v) setSelectedIds(new Set());
      return !v;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectMany = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const markSelected = useCallback(
    (mark: boolean) => {
      const ids = [...selectedIds].filter((id) => markers.some((m) => m.id === id));
      if (!ids.length) {
        setToast('Nenhum local selecionado');
        return;
      }
      setFound((prev) => {
        const next = new Set(prev);
        for (const id of ids) {
          if (mark) next.add(id);
          else next.delete(id);
        }
        return next;
      });
      setToast(mark ? `${ids.length} marcado(s) como achado(s)` : `${ids.length} desmarcado(s)`);
    },
    [selectedIds, markers],
  );

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
      custom,
      removed,
      codes: customCodes,
      favorites: [...favorites],
      notes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gta6-map-progresso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('Progresso exportado');
  }, [found, custom, removed, customCodes, favorites, notes]);

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
          if (Array.isArray(data.custom)) {
            setCustom(
              data.custom.filter(
                (m) => m && typeof m.id === 'string' && typeof m.x === 'number' && typeof m.y === 'number',
              ),
            );
          }
          if (Array.isArray(data.removed)) {
            setRemoved(data.removed.filter((x): x is string => typeof x === 'string'));
          }
          if (data.codes && typeof data.codes === 'object') {
            const out: Record<string, string> = {};
            for (const [k, v] of Object.entries(data.codes)) if (typeof v === 'string') out[k] = v;
            setCustomCodes(out);
          }
          if (Array.isArray(data.favorites)) {
            setFavorites(new Set(data.favorites.filter((x): x is string => typeof x === 'string')));
          }
          if (data.notes && typeof data.notes === 'object') {
            const out: Record<string, string> = {};
            for (const [k, v] of Object.entries(data.notes)) if (typeof v === 'string') out[k] = v;
            setNotes(out);
          }
          const extras =
            (data.custom?.length ?? 0) +
            (data.removed?.length ?? 0) +
            Object.keys(data.codes ?? {}).length +
            (data.favorites?.length ?? 0) +
            Object.keys(data.notes ?? {}).length;
          setToast(`Importado: ${data.found.length} achados${extras ? ` + ${extras} itens seus` : ''}`);
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
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          totalFound={totalFound}
          totalVisible={totalVisible}
          onExport={onExport}
          onImport={onImport}
          onReset={onReset}
          onOpenCodes={() => {
            setShowCodes(true);
            setDrawerOpen(false);
          }}
          onAdd={() => {
            startAdd();
            setDrawerOpen(false);
          }}
          removedCount={removed.length}
          onRestoreRemoved={restoreRemoved}
          selectMode={selectMode}
          onToggleSelectMode={toggleSelectMode}
          onOpenStats={() => {
            setShowStats(true);
            setDrawerOpen(false);
          }}
          onClose={() => setDrawerOpen(false)}
        />
      </div>

      {sidebarCollapsed && (
        <button
          type="button"
          className="fab fab-expand"
          onClick={() => setSidebarCollapsed(false)}
          aria-label="Abrir menu"
          title="Abrir menu"
        >
          ▶ Menu
        </button>
      )}

      <MapView
        markers={markers}
        query={query.trim().toLowerCase()}
        activeMasters={activeMasters}
        activeSubs={activeSubs}
        hiddenFound={hideFound}
        found={found}
        selectedId={selectedId}
        customCodes={customCodes}
        picking={picking}
        selectMode={selectMode}
        selectedIds={selectedIds}
        onAddClick={startAdd}
        onPick={onPick}
        onSelect={setSelectedId}
        onToggleSelect={toggleSelect}
        onSelectMany={selectMany}
        onClearSelection={clearSelection}
        onMarkSelected={markSelected}
        onExitSelect={toggleSelectMode}
        onToggleFound={toggleFound}
        onCopy={copy}
        onRemove={removeMarker}
        onSaveCode={saveCode}
        onClearCode={clearCode}
        favorites={favorites}
        notes={notes}
        onToggleFavorite={toggleFavorite}
        onSaveNote={saveNote}
      />

      {picking && (
        <div className="pick-banner">
          📍 Clique no mapa para posicionar o novo local
          <button type="button" className="ghost" onClick={cancelPick}>
            Cancelar (Esc)
          </button>
        </div>
      )}

      {pendingPos && (
        <AddMarkerForm
          x={pendingPos.x}
          y={pendingPos.y}
          onSave={addMarker}
          onClose={() => setPendingPos(null)}
          onRepick={() => {
            setPendingPos(null);
            setPicking(true);
          }}
        />
      )}

      {showCodes && <CodesPanel codes={codes} onCopy={copy} onClose={() => setShowCodes(false)} />}

      {showStats && (
        <StatsPanel markers={markers} found={found} favorites={favorites} notes={notes} onClose={() => setShowStats(false)} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
