import type { Marker } from '../types';
import { MASTER_META, SUB_LABELS } from '../data/categories';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Conteúdo do popup de cada marcador.
 * O código/senha aparece SEMPRE visível, com botão de copiar (decisão do usuário).
 */
export function buildPopupContent(m: Marker, isFound: boolean): string {
  const meta = MASTER_META[m.master];
  const sub = SUB_LABELS[m.cat] ?? meta.label;

  return `
    <div class="pop">
      <div class="pop__head">
        <span class="pop__badge" style="--c:${meta.color}">${meta.emoji} ${escapeHtml(sub)}</span>
        ${isFound ? '<span class="pop__ok">✓ encontrado</span>' : ''}
      </div>
      <h3 class="pop__title">${escapeHtml(m.name)}</h3>
      ${m.district ? `<div class="pop__where">📍 ${escapeHtml(m.district)}</div>` : ''}
      ${m.real ? `<div class="pop__real">🏢 ${escapeHtml(m.real)}</div>` : ''}
      ${
        m.code
          ? `<div class="pop__code">
              <span class="pop__code-label">Senha</span>
              <code>${escapeHtml(m.code)}</code>
              <button type="button" class="pop__copy" data-act="copy" data-code="${escapeHtml(m.code)}">Copiar</button>
            </div>`
          : ''
      }
      ${m.note ? `<p class="pop__note">${escapeHtml(m.note)}</p>` : ''}
      <button type="button" class="pop__found ${isFound ? 'is-on' : ''}" data-act="found" data-id="${escapeHtml(m.id)}">
        ${isFound ? '✓ Encontrado — clicar para desmarcar' : 'Marcar como encontrado'}
      </button>
      <div class="pop__src">Posição aproximada · dados da comunidade</div>
    </div>`;
}
