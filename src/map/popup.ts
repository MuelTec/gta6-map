import type { Marker } from '../types';
import { MASTER_META, SUB_LABELS, gtaCat, subColor, subIconHtml } from '../data/categories';

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
 * - O código/senha aparece SEMPRE visível, com botão de copiar.
 * - Ao encontrar um local, surge o campo para deixar a senha (adicionar/editar).
 * - Todo local pode ser removido do mapa (os oficiais ficam guardados para restaurar).
 */
export function buildPopupContent(m: Marker, isFound: boolean, userCode?: string): string {
  const meta = MASTER_META[m.master];
  const sub = SUB_LABELS[m.cat] ?? gtaCat(m.cat)?.name ?? meta.label;
  const color = subColor(m.sub, m.master);
  const code = m.code ?? userCode ?? '';
  // opção de deixar a senha: ao encontrar (decisão do usuário) ou para editar/excluir a existente
  const showCodeEditor = isFound || !!userCode;

  return `
    <div class="pop">
      <div class="pop__head">
        <span class="pop__badge" style="--c:${color}">${subIconHtml(m.sub, m.master, 12)} ${escapeHtml(sub)}</span>
        ${isFound ? '<span class="pop__ok">✓ encontrado</span>' : ''}
      </div>
      <h3 class="pop__title">${escapeHtml(m.name)}</h3>
      ${m.district ? `<div class="pop__where">📍 ${escapeHtml(m.district)}</div>` : ''}
      ${m.real ? `<div class="pop__real">🏢 ${escapeHtml(m.real)}</div>` : ''}
      ${
        code
          ? `<div class="pop__code">
              <span class="pop__code-label">Senha</span>
              <code>${escapeHtml(code)}</code>
              <button type="button" class="pop__copy" data-act="copy" data-code="${escapeHtml(code)}">Copiar</button>
            </div>`
          : ''
      }
      ${
        showCodeEditor
          ? `<div class="pop__code-row">
              <input type="text" data-code-input maxlength="40" placeholder="Deixar a senha…" value="${escapeHtml(userCode ?? '')}" />
              <button type="button" class="pop__save" data-act="savecode" data-id="${escapeHtml(m.id)}">Salvar</button>
              ${
                userCode
                  ? `<button type="button" class="pop__clear" data-act="clearcode" data-id="${escapeHtml(m.id)}">Remover</button>`
                  : ''
              }
            </div>`
          : ''
      }
      ${m.note ? `<p class="pop__note">${escapeHtml(m.note)}</p>` : ''}
      <button type="button" class="pop__found ${isFound ? 'is-on' : ''}" data-act="found" data-id="${escapeHtml(m.id)}">
        ${isFound ? '✓ Encontrado — clicar para desmarcar' : 'Marcar como encontrado'}
      </button>
      <button type="button" class="pop__remove" data-act="remove" data-id="${escapeHtml(m.id)}">
        🗑 Remover local${m.custom ? ' (criado por você)' : ''}
      </button>
      <div class="pop__src">Posição aproximada · dados da comunidade</div>
    </div>`;
}
