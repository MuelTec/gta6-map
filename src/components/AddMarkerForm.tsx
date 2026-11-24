import { useState } from 'react';
import {
  ALL_MASTERS,
  MASTER_META,
  SUB_LABELS,
  masterForSub,
  subColor,
  subIconHtml,
} from '../data/categories';

type Props = {
  x: number;
  y: number;
  onSave: (data: { name: string; sub: string; code: string; note: string }) => void;
  onClose: () => void;
  onRepick: () => void;
};

/** Modal para adicionar um local no mapa (posição já escolhida clicando). */
export default function AddMarkerForm({ x, y, onSave, onClose, onRepick }: Props) {
  const [name, setName] = useState('');
  const [sub, setSub] = useState('');
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');

  const master = sub ? masterForSub(sub) : 'outros';
  const color = sub ? subColor(sub, master) : '#94a3b8';

  const save = () => {
    const n = name.trim();
    if (!n || !sub) return;
    onSave({ name: n, sub, code: code.trim(), note: note.trim() });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Adicionar local"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>➕ Adicionar local</h2>

        <label className="field">
          <span>Nome *</span>
          <input
            type="text"
            value={name}
            autoFocus
            maxLength={80}
            placeholder="Ex.: Borracharia do João"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
        </label>

        <label className="field">
          <span>Categoria e ícone *</span>
          <span className="field-row">
            <span
              className="cat-preview"
              style={{ ['--c' as string]: color }}
              aria-hidden="true"
              // subIconHtml devolve markup SVG/emoji (mesma fonte dos marcadores)
              dangerouslySetInnerHTML={{ __html: sub ? subIconHtml(sub, master, 18) : '📍' }}
            />
            <select value={sub} onChange={(e) => setSub(e.target.value)}>
              <option value="">Escolha…</option>
              {ALL_MASTERS.map((id) => (
                <optgroup key={id} label={MASTER_META[id].label}>
                  {MASTER_META[id].subs.map((s) => (
                    <option key={s} value={s}>
                      {SUB_LABELS[s] ?? s}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </span>
        </label>

        <label className="field">
          <span>Senha / código (opcional)</span>
          <input
            type="text"
            value={code}
            maxLength={40}
            placeholder="Ex.: 4821"
            onChange={(e) => setCode(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Nota (opcional)</span>
          <textarea
            value={note}
            rows={2}
            maxLength={300}
            placeholder="Ex.: só abre após a missão X"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <div className="modal-pos">
          📍 Posição: <code>{Math.round(x)}, {Math.round(y)}</code>
          <button type="button" className="ghost" onClick={onRepick}>
            🔄 Recolocar no mapa
          </button>
        </div>

        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="primary"
            disabled={!name.trim() || !sub}
            onClick={save}
          >
            Salvar local
          </button>
        </div>
      </div>
    </div>
  );
}
