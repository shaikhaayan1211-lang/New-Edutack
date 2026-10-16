/* =========================================================
   EDU-Track | shared UI helpers (no dependencies)
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const initials = (name = '') =>
  name.replace(/^(dr|prof|mr|ms|mrs)\.?\s+/i, '').split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/* ---------- Icons (24px line icons) ---------- */
const ICON_PATHS = {
  cap: '<path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11.2V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.8"/><path d="M22 9v6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  teacher: '<rect x="3" y="4" width="18" height="11" rx="2"/><path d="M12 15v4M8 21h8"/>',
  staff: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  id: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.5 17c.6-1.8 2-2.6 3.5-2.6s2.9.8 3.5 2.6M15 9.5h3.5M15 13h3.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M9 15l2 2 4-4"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>',
  logout: '<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 8l4 4-4 4M20 12H9"/>',
  flip: '<path d="M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  verified: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9.5"/>',
  chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
  building: '<path d="M4 21V5l8-2 8 2v16M9 21v-4h6v4M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  heart: '<path d="M12 20s-7-4.4-9-9.2C1.6 7.3 3.7 4 7 4c2 0 3.4 1 5 3 1.6-2 3-3 5-3 3.3 0 5.4 3.3 4 6.8C19 15.6 12 20 12 20Z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4"/>',
  music: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
};
const icon = (name, size) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${size ? ` width="${size}" height="${size}"` : ''}>${ICON_PATHS[name] || ''}</svg>`;

// Static HTML uses <span data-icon="cap"></span>; this swaps in the SVG.
function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach((el) => { el.innerHTML = icon(el.dataset.icon); el.removeAttribute('data-icon'); });
}

/* ---------- Dates & numbers ---------- */
const fmtDate = (s, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', opts);
const t12 = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const nowHHMM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const pctText = (p) => (p === null || p === undefined ? '--' : `${p}%`);
const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ---------- Toasts ---------- */
function toast(msg, type = 'info', ms = 3800) {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.append(box); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${esc(msg)}</span>`;
  box.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 380); }, ms);
}

/* ---------- Modal ---------- */
function openModal({ title = '', html = '', wide = false, onClose } = {}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal glass-dark ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h3>${esc(title)}</h3><button type="button" class="modal-close" aria-label="Close">${icon('close', 18)}</button></div>
      <div class="modal-body"></div>
    </div>`;
  const body = $('.modal-body', backdrop);
  if (typeof html === 'string') body.innerHTML = html; else if (html) body.append(html);

  const previous = document.activeElement;
  let closed = false;
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  function close(result) {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    backdrop.classList.add('out');
    setTimeout(() => {
      backdrop.remove();
      if (!$('.modal-backdrop')) document.body.style.overflow = '';
      if (previous && previous.focus) previous.focus();
      if (onClose) onClose(result);
    }, 250);
  }
  backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
  $('.modal-close', backdrop).addEventListener('click', () => close());
  document.addEventListener('keydown', onKey);
  document.body.append(backdrop);
  document.body.style.overflow = 'hidden';
  $('.modal-close', backdrop).focus();
  return { el: backdrop, body, close, setTitle: (t) => { $('.modal-head h3', backdrop).textContent = t; } };
}

/* ---------- Motion helpers ---------- */
function stagger(root) {
  root.setAttribute('data-stagger', '');
  Array.from(root.children).forEach((c, i) => c.style.setProperty('--i', i));
}

function countUp(el, to, { decimals = 0, duration = 900, suffix = '' } = {}) {
  if (to === null || to === undefined || Number.isNaN(Number(to))) { el.textContent = '--'; return; }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = Number(to).toFixed(decimals) + suffix; return; }
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (to * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Data visuals ---------- */
function ringHTML(pct, { size = 170, label, sub, min = 75 } = {}) {
  const p = pct === null || pct === undefined ? 0 : Math.max(0, Math.min(100, pct));
  const low = pct !== null && pct !== undefined && pct < min;
  return `<div class="ring ${low ? 'low' : ''}" style="--size:${size}px;--to:${100 - p}" role="img" aria-label="${esc(sub || 'Progress')} ${pctText(pct)}">
    <svg viewBox="0 0 100 100"><circle class="ring-bg" cx="50" cy="50" r="44"/><circle class="ring-fg" cx="50" cy="50" r="44" pathLength="100"/></svg>
    <div class="ring-label"><b>${label ?? pctText(pct)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`;
}
function barHTML(pct, min = 75) {
  if (pct === null || pct === undefined) return '<div class="bar"><i style="--w:0%"></i></div>';
  const cls = pct < min ? 'low' : pct >= 90 ? 'high' : '';
  return `<div class="bar ${cls}"><i style="--w:${pct}%"></i></div>`;
}
function pctBadge(pct, min = 75) {
  if (pct === null || pct === undefined) return '<span class="badge">No data</span>';
  return pct >= min ? `<span class="badge good">${pct}%</span>` : `<span class="badge bad">${pct}%</span>`;
}
function avatarHTML(person, cls = '') {
  return `<span class="avatar ${cls}">${person.photo ? `<img src="${esc(person.photo)}" alt="">` : esc(initials(person.name))}</span>`;
}

/* ---------- One-time page setup ---------- */
document.addEventListener('DOMContentLoaded', () => {
  hydrateIcons();
  // Shared gradient for progress rings
  if (!$('#ringGrad')) {
    document.body.insertAdjacentHTML('beforeend',
      '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset="1" stop-color="#f5a300"/></linearGradient></defs></svg>');
  }
});

// Smooth fade between pages
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  const url = new URL(a.href, location.href);
  if (!/\.html$/.test(url.pathname) || url.hash && url.pathname === location.pathname) return;
  if (url.origin !== location.origin && location.protocol !== 'file:') return;
  e.preventDefault();
  document.body.classList.add('leaving');
  setTimeout(() => { location.href = a.href; }, 240);
});
window.addEventListener('pageshow', (e) => { if (e.persisted) document.body.classList.remove('leaving'); });
