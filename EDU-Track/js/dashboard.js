/* Dashboard shell: session check, header, sliding tabs, lazy panels. Requires ui.js, api.js */

async function bootDashboard({ role, roleLabel, tabs }) {
  const session = Api.getSession();
  if (!session || session.role !== role) { location.replace(Api.loginPage(role)); return; }

  const main = $('#main');
  const tabsEl = $('#tabs');
  main.innerHTML = '<div class="loading-block"><span class="spinner"></span>Loading your dashboard</div>';

  let me;
  try {
    me = await Api.get('/me');
  } catch (e) {
    if (e.status !== 401) main.innerHTML = `<div class="notice bad">${icon('info')}<span>${esc(e.message)}</span></div>`;
    return;
  }

  const photoListeners = [];
  const ctx = {
    role, me, profile: me.profile, min: me.minAttendance,
    invalidate(...ids) { ids.forEach((id) => { const p = $(`#panel-${id}`); if (p) delete p.dataset.loaded; }); },
    goTo: (id) => show(id),
    onPhoto: (fn) => photoListeners.push(fn),
    setPhoto(photo) {
      me.profile.photo = photo;
      paintChip();
      photoListeners.forEach((fn) => fn(photo));
    },
  };

  // Header
  function paintChip() {
    $('#chipAvatar').innerHTML = me.profile.photo ? `<img src="${esc(me.profile.photo)}" alt="">` : esc(initials(me.profile.name));
  }
  $('#chipName').textContent = me.profile.name;
  $('#chipRole').textContent = roleLabel;
  paintChip();
  $('#logoutBtn').addEventListener('click', () => Api.logout());

  // Tabs + panels
  tabsEl.innerHTML = '<span class="tab-indicator"></span>' + tabs.map((t) =>
    `<button type="button" class="tab" role="tab" id="tab-${t.id}" data-tab="${t.id}" aria-selected="false" aria-controls="panel-${t.id}">${icon(t.icon)}<span>${esc(t.label)}</span></button>`).join('');
  main.innerHTML = tabs.map((t) => `<section class="panel" id="panel-${t.id}" role="tabpanel" aria-labelledby="tab-${t.id}"></section>`).join('');

  const indicator = $('.tab-indicator', tabsEl);
  let current = null;

  function moveIndicator() {
    const btn = $('.tab[aria-selected="true"]', tabsEl);
    if (!btn) return;
    indicator.style.width = `${btn.offsetWidth}px`;
    indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
  }

  async function show(id) {
    const tab = tabs.find((t) => t.id === id) || tabs[0];
    current = tab.id;
    $$('.tab', tabsEl).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab.id)));
    $$('.panel', main).forEach((p) => p.classList.toggle('active', p.id === `panel-${tab.id}`));
    moveIndicator();
    const btn = $(`#tab-${tab.id}`);
    if (btn && btn.scrollIntoView) btn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    history.replaceState(null, '', `#${tab.id}`);

    const panel = $(`#panel-${tab.id}`);
    if (panel.dataset.loaded) return;
    panel.dataset.loaded = '1';
    panel.innerHTML = '<div class="loading-block"><span class="spinner"></span>Loading</div>';
    try {
      await tab.render(panel, ctx);
    } catch (e) {
      delete panel.dataset.loaded;
      panel.innerHTML = `<div class="notice bad">${icon('info')}<span>${esc(e.message)}</span></div>`;
    }
  }

  tabsEl.addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b) show(b.dataset.tab); });
  window.addEventListener('resize', moveIndicator);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (id && id !== current && tabs.some((t) => t.id === id)) show(id); });

  const start = location.hash.slice(1);
  await show(tabs.some((t) => t.id === start) ? start : tabs[0].id);
  moveIndicator();
}
