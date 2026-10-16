/* Teacher dashboard */
(function () {
  const firstName = (n) => n.replace(/^(dr|prof|mr|ms|mrs)\.?\s+/i, '').split(' ')[0];
  const titleOf = (n) => (n.match(/^(dr|prof|mr|ms|mrs)\.?/i) || [''])[0].replace(/\.?$/, '.');
  const countIn = (root) => $$('[data-count]', root).forEach((el) =>
    countUp(el, Number(el.dataset.count), { decimals: Number(el.dataset.dec || 0), suffix: el.dataset.suffix || '' }));

  async function overview(panel, ctx) {
    const p = ctx.profile;
    const s = await Api.get('/teacher/summary');
    const now = nowHHMM();
    const greeting = /^(dr|prof|mr|ms|mrs)/i.test(p.name) ? `${titleOf(p.name)} ${firstName(p.name)}` : firstName(p.name);

    panel.innerHTML = `
      <div class="page-head"><div>
        <h2>Hello, ${esc(greeting)}</h2>
        <p>${esc(p.designation)}, ${esc(s.department.name)} department</p>
      </div></div>
      <div class="two-col">
        <div id="idHost"></div>
        <div class="stack">
          <div id="ckHost"></div>
          <div class="tiles">
            <div class="tile glass"><div class="tv" data-count="${s.students}">0</div><div class="tl">Students in ${esc(s.department.course)}</div></div>
            <div class="tile glass hl"><div class="tv" data-count="${s.avgAttendance ?? ''}" data-dec="1" data-suffix="%">--</div><div class="tl">Average attendance</div></div>
            <div class="tile glass ${s.belowMin ? 'alert' : ''}"><div class="tv" data-count="${s.belowMin}">0</div><div class="tl">Below ${s.min}%</div></div>
            <div class="tile glass"><div class="tv" data-count="${s.classesTaken}">0</div><div class="tl">Classes you marked</div></div>
          </div>
          <div class="glass card">
            <div class="section-title"><div><h3>Your classes today</h3><p>${esc(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }))}</p></div></div>
            ${s.classesToday.length ? `<div class="recent-list" style="grid-template-columns:1fr">${s.classesToday.map((c) => {
              const live = now >= c.start && now < c.end;
              const done = s.markedToday.includes(c.subject);
              return `<div class="recent-item"><span class="s">${esc(c.subject)}<small>${esc(t12(c.start))} to ${esc(t12(c.end))}, ${esc(c.room)}</small></span>
                <span class="row" style="gap:.5rem">${live ? '<span class="badge warn"><span class="dot pulse"></span>Now</span>' : ''}
                ${done ? '<span class="badge good">Marked</span>' : `<button type="button" class="btn btn-primary btn-sm" data-mark="${esc(c.subject)}">Mark attendance</button>`}</span></div>`;
            }).join('')}</div>` : '<p class="empty">You have no classes scheduled today.</p>'}
          </div>
        </div>
      </div>`;

    const card = renderIdCard($('#idHost'), 'teacher', p, { actions: true });
    addFlipButton(card.actionsEl, card);
    addPhotoButton(card.actionsEl, ctx);
    ctx.onPhoto(card.setPhoto);
    renderCheckinCard($('#ckHost'), ctx, { invalidate: ['myatt'] });
    $$('[data-mark]', panel).forEach((b) => b.addEventListener('click', () => {
      ctx.trackerPreset = { subject: b.dataset.mark };
      ctx.invalidate('tracker');
      ctx.goTo('tracker');
    }));
    stagger($('.stack', panel));
    countIn(panel);
  }

  /* ---------------- Attendance tracker: mark students present / absent ---------------- */
  async function tracker(panel, ctx) {
    const subjects = ctx.profile.subjects;
    const today = localDate();
    const back = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return localDate(d); };
    let date = new Date().getDay() === 0 ? back(1) : today;   // Sundays default to Saturday
    let subject = (ctx.trackerPreset && ctx.trackerPreset.subject) || subjects[0];
    ctx.trackerPreset = null;
    let rows = [];
    let saving = false;

    panel.innerHTML = `
      <div class="page-head"><div><h2>Attendance tracker</h2><p>Mark each student present or absent for a class you teach. Everyone starts as present.</p></div></div>
      <div class="glass tracker-controls">
        <div class="field"><label for="trDate">Date</label><input class="input" type="date" id="trDate" value="${date}" max="${today}" min="${back(90)}"></div>
        <div class="field"><label for="trSub">Subject</label>
          <select class="input" id="trSub">${subjects.map((s) => `<option ${s === subject ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
      </div>
      <div id="sheet" style="margin-top:1.2rem"></div>`;

    const sheet = $('#sheet', panel);

    async function load() {
      sheet.innerHTML = '<div class="loading-block"><span class="spinner"></span>Loading class list</div>';
      try {
        const d = await Api.get(`/teacher/sheet?date=${encodeURIComponent(date)}&subject=${encodeURIComponent(subject)}`);
        rows = d.students.map((s) => ({ ...s }));
        draw(d);
      } catch (e) {
        sheet.innerHTML = `<div class="notice bad">${icon('info')}<span>${esc(e.message)}</span></div>`;
      }
    }

    function counts() {
      const p = rows.filter((r) => r.status === 'P').length;
      return { p, a: rows.length - p };
    }
    function paintCounts() {
      const c = counts();
      $$('[data-cp]', sheet).forEach((e) => { e.textContent = c.p; });
      $$('[data-ca]', sheet).forEach((e) => { e.textContent = c.a; });
    }

    function draw(d) {
      const c = counts();
      sheet.innerHTML = `
        ${d.alreadyMarked ? `<div class="notice good" style="margin-bottom:1rem">${icon('verified')}<span>Attendance for this class is already saved. Saving again will update it.</span></div>` : ''}
        ${!d.scheduled ? `<div class="notice" style="margin-bottom:1rem">${icon('info')}<span>${esc(subject)} is not on the ${esc(d.day)} timetable. You can still mark an extra class.</span></div>` : ''}
        <div class="row between" style="margin-bottom:.9rem">
          <div class="count-chips">
            <span class="badge good">Present <b data-cp>${c.p}</b></span>
            <span class="badge bad">Absent <b data-ca>${c.a}</b></span>
            <span class="badge">${rows.length} students</span>
          </div>
          <div class="row" style="gap:.5rem">
            <button type="button" class="btn btn-ghost btn-sm" data-all="P">All present</button>
            <button type="button" class="btn btn-ghost btn-sm" data-all="A">All absent</button>
          </div>
        </div>
        <div class="student-list" id="stList">
          ${rows.map((r, i) => `
            <div class="srow is-${r.status.toLowerCase()}" data-id="${esc(r.id)}" style="animation:rise .5s var(--ease) both;animation-delay:${i * 40}ms">
              ${avatarHTML(r, 'sm')}
              <div class="nm"><b>${esc(r.name)}</b><small>${esc(r.rollNo)}</small></div>
              <div class="ov ${r.pct !== null && r.pct < ctx.min ? 'low' : ''}"><b>${pctText(r.pct)}</b>overall</div>
              <div class="pa" data-state="${r.status}" role="group" aria-label="Attendance for ${esc(r.name)}">
                <i class="pa-thumb"></i>
                <button type="button" data-v="P" aria-pressed="${r.status === 'P'}">Present</button>
                <button type="button" data-v="A" aria-pressed="${r.status === 'A'}">Absent</button>
              </div>
            </div>`).join('')}
        </div>
        <div class="savebar glass-dark">
          <span class="muted"><b data-cp>${c.p}</b> present, <b data-ca>${c.a}</b> absent for ${esc(subject)} on ${esc(fmtDate(date, { weekday: 'short', day: 'numeric', month: 'short' }))}</span>
          <button type="button" class="btn btn-primary" id="saveAtt">${icon('save')}${d.alreadyMarked ? 'Update attendance' : 'Save attendance'}</button>
        </div>`;

      const setStatus = (id, v) => {
        const r = rows.find((x) => x.id === id);
        r.status = v;
        const row = $(`.srow[data-id="${CSS.escape(id)}"]`, sheet);
        row.className = `srow is-${v.toLowerCase()}`;
        const pa = $('.pa', row);
        pa.dataset.state = v;
        $$('button', pa).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      };
      $('#stList', sheet).addEventListener('click', (e) => {
        const b = e.target.closest('.pa button');
        if (!b) return;
        setStatus(b.closest('.srow').dataset.id, b.dataset.v);
        paintCounts();
      });
      $$('[data-all]', sheet).forEach((b) => b.addEventListener('click', () => { rows.forEach((r) => setStatus(r.id, b.dataset.all)); paintCounts(); }));

      $('#saveAtt', sheet).addEventListener('click', async (e) => {
        if (saving) return;
        saving = true;
        const btn = e.currentTarget;
        btn.classList.add('loading');
        btn.innerHTML = '<span class="spinner"></span>Saving';
        try {
          const records = {};
          rows.forEach((r) => { records[r.id] = r.status; });
          const res = await Api.post('/teacher/attendance', { date, subject, records });
          toast(`Saved: ${res.present} present, ${res.absent} absent.`, 'success');
          ctx.invalidate('students', 'overview');
          saving = false;
          await load();
        } catch (err) {
          saving = false;
          toast(err.message, 'error');
          btn.classList.remove('loading');
          btn.innerHTML = `${icon('save')}Save attendance`;
        }
      });
    }

    $('#trDate', panel).addEventListener('change', (e) => { if (e.target.value) { date = e.target.value; load(); } });
    $('#trSub', panel).addEventListener('change', (e) => { subject = e.target.value; load(); });
    await load();
  }

  /* ---------------- Students: attendance percentage + academic records ---------------- */
  async function students(panel, ctx) {
    let all = [];
    let min = ctx.min;
    let q = '';
    let onlyLow = false;

    panel.innerHTML = `
      <div class="page-head"><div><h2>Students</h2><p>Attendance percentage and academic records for your department. Open a record to see subject-wise attendance and marks.</p></div></div>
      <div class="glass card">
        <div class="row between" style="margin-bottom:1rem">
          <div class="search" style="flex:1 1 260px;max-width:360px">${icon('search')}<input class="input" id="stQ" type="search" placeholder="Search by name or roll number" aria-label="Search students"></div>
          <div class="seg" role="group" aria-label="Filter"><button type="button" data-f="all" aria-pressed="true">All students</button><button type="button" data-f="low" aria-pressed="false">Below minimum</button></div>
        </div>
        <div id="stTable"></div>
      </div>`;

    function draw() {
      const list = all.filter((r) => (!onlyLow || (r.pct !== null && r.pct < min)) &&
        (!q || r.name.toLowerCase().includes(q) || r.rollNo.toLowerCase().includes(q)));
      $('#stTable', panel).innerHTML = list.length ? `
        <div class="table-wrap"><table class="data">
          <thead><tr><th>Student</th><th style="width:26%">Attendance</th><th class="num">Classes</th><th class="num">CGPA</th><th></th></tr></thead>
          <tbody>${list.map((r) => `<tr>
            <td><div class="row" style="flex-wrap:nowrap">${avatarHTML(r, 'sm')}<div><b style="font-weight:500">${esc(r.name)}</b><br><small class="muted">${esc(r.rollNo)}</small></div></div></td>
            <td><div class="row" style="flex-wrap:nowrap;gap:.7rem"><div style="flex:1">${barHTML(r.pct, min)}</div>${pctBadge(r.pct, min)}</div></td>
            <td class="num">${r.attended}/${r.held}</td>
            <td class="num">${r.cgpa ?? '--'}</td>
            <td class="num"><button type="button" class="btn btn-ghost btn-sm" data-view="${esc(r.id)}">${icon('eye')}View record</button></td>
          </tr>`).join('')}</tbody></table></div>` : '<p class="empty">No students match.</p>';
      $$('[data-view]', panel).forEach((b) => b.addEventListener('click', () => openStudentDetail({
        path: `/teacher/student/${encodeURIComponent(b.dataset.view)}`,
        saveMarks: async (payload) => (await Api.put('/teacher/marks', payload)).academics,
        onChange: load,
      })));
    }

    async function load() {
      const d = await Api.get('/teacher/students');
      all = d.students; min = d.min;
      draw();
    }

    $('#stQ', panel).addEventListener('input', debounce((e) => { q = e.target.value.trim().toLowerCase(); draw(); }, 150));
    $$('[data-f]', panel).forEach((b) => b.addEventListener('click', () => {
      onlyLow = b.dataset.f === 'low';
      $$('[data-f]', panel).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw();
    }));
    await load();
  }

  async function timetable(panel) {
    const tt = await Api.get('/timetable');
    panel.innerHTML = `
      <div class="page-head"><div><h2>Timetable</h2><p>${esc(tt.department.name)} department. Your own classes are highlighted.</p></div></div>
      <div id="ttHost"></div>`;
    renderTimetable($('#ttHost', panel), tt);
  }

  async function myAttendance(panel, ctx) {
    panel.innerHTML = `
      <div class="page-head"><div><h2>My attendance</h2><p>Your own daily check-ins. Use the marker on the Overview page each morning.</p></div></div>
      <div id="myAtt"></div>`;
    await renderMyAttendance($('#myAtt', panel), ctx);
  }

  bootDashboard({
    role: 'teacher', roleLabel: 'Faculty',
    tabs: [
      { id: 'overview', label: 'Overview', icon: 'home', render: overview },
      { id: 'tracker', label: 'Attendance tracker', icon: 'calendar', render: tracker },
      { id: 'students', label: 'Students', icon: 'users', render: students },
      { id: 'timetable', label: 'Timetable', icon: 'clock', render: timetable },
      { id: 'myatt', label: 'My attendance', icon: 'verified', render: myAttendance },
    ],
  });
})();
