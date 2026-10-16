/* Staff dashboard */
(function () {
  const countIn = (root) => $$('[data-count]', root).forEach((el) =>
    countUp(el, Number(el.dataset.count), { decimals: Number(el.dataset.dec || 0), suffix: el.dataset.suffix || '' }));

  async function overview(panel, ctx) {
    const p = ctx.profile;
    const o = await Api.get('/staff/overview');
    panel.innerHTML = `
      <div class="page-head"><div>
        <h2>Hello, ${esc(p.name.split(' ')[0])}</h2>
        <p>${esc(p.designation)}, ${esc(p.section)}</p>
      </div></div>
      <div class="two-col">
        <div id="idHost"></div>
        <div class="stack">
          <div id="ckHost"></div>
          <div class="tiles">
            <div class="tile glass"><div class="tv" data-count="${o.totals.students}">0</div><div class="tl">Students</div></div>
            <div class="tile glass"><div class="tv" data-count="${o.today.students}">0</div><div class="tl">Students checked in today</div></div>
            <div class="tile glass hl"><div class="tv">${o.today.teachers}/${o.totals.teachers}</div><div class="tl">Teachers checked in today</div></div>
            <div class="tile glass ${o.belowMin ? 'alert' : ''}"><div class="tv" data-count="${o.belowMin}">0</div><div class="tl">Students below ${o.min}%</div></div>
          </div>
          <div class="glass card">
            <div class="section-title"><div><h3>Departments</h3><p>Class attendance across the campus. Average: ${o.avgAttendance ?? '--'}%.</p></div></div>
            <div class="table-wrap"><table class="data">
              <thead><tr><th>Department</th><th class="num">Students</th><th style="width:28%">Average attendance</th><th class="num">Below ${o.min}%</th><th class="num">Teachers in today</th></tr></thead>
              <tbody>${o.departments.map((d) => `<tr>
                <td>${esc(d.name)}<br><small class="muted">${esc(d.course)}</small></td>
                <td class="num">${d.students}</td>
                <td><div class="row" style="flex-wrap:nowrap;gap:.7rem"><div style="flex:1">${barHTML(d.avgAttendance, o.min)}</div>${pctBadge(d.avgAttendance, o.min)}</div></td>
                <td class="num">${d.belowMin}</td>
                <td class="num">${d.teachersPresent}/${d.teachers}</td></tr>`).join('')}</tbody></table></div>
          </div>
        </div>
      </div>`;
    const card = renderIdCard($('#idHost'), 'staff', p, { actions: true });
    addFlipButton(card.actionsEl, card);
    addPhotoButton(card.actionsEl, ctx);
    ctx.onPhoto(card.setPhoto);
    renderCheckinCard($('#ckHost'), ctx, { invalidate: ['myatt'] });
    stagger($('.stack', panel));
    countIn(panel);
  }

  async function students(panel, ctx) {
    const meta = await Api.request('/meta', { auth: false });
    let course = '';
    let q = '';
    panel.innerHTML = `
      <div class="page-head"><div><h2>Student records</h2><p>Look up any student. Records are read-only for staff.</p></div></div>
      <div class="glass card">
        <div class="row between" style="margin-bottom:1rem">
          <div class="search" style="flex:1 1 260px;max-width:360px">${icon('search')}<input class="input" id="sfQ" type="search" placeholder="Search by name or ID" aria-label="Search students"></div>
          <div class="seg" role="group" aria-label="Filter by course">
            <button type="button" data-c="" aria-pressed="true">All</button>
            ${meta.courses.map((c) => `<button type="button" data-c="${esc(c.code)}" aria-pressed="false">${esc(c.code)}</button>`).join('')}
          </div>
        </div>
        <div id="sfTable"></div>
      </div>`;

    let seq = 0;
    async function load() {
      const mine = ++seq;
      const d = await Api.get(`/staff/students?course=${encodeURIComponent(course)}&q=${encodeURIComponent(q)}`);
      if (mine !== seq) return;
      $('#sfTable', panel).innerHTML = d.students.length ? `
        <div class="table-wrap"><table class="data">
          <thead><tr><th>Student</th><th>Course</th><th style="width:26%">Attendance</th><th class="num">CGPA</th><th></th></tr></thead>
          <tbody>${d.students.map((r) => `<tr>
            <td><div class="row" style="flex-wrap:nowrap">${avatarHTML(r, 'sm')}<div><b style="font-weight:500">${esc(r.name)}</b><br><small class="muted">${esc(r.id)}</small></div></div></td>
            <td>${esc(r.course)}</td>
            <td><div class="row" style="flex-wrap:nowrap;gap:.7rem"><div style="flex:1">${barHTML(r.pct, d.min)}</div>${pctBadge(r.pct, d.min)}</div></td>
            <td class="num">${r.cgpa ?? '--'}</td>
            <td class="num"><button type="button" class="btn btn-ghost btn-sm" data-view="${esc(r.id)}">${icon('eye')}View record</button></td>
          </tr>`).join('')}</tbody></table></div>` : '<p class="empty">No students match.</p>';
      $$('[data-view]', panel).forEach((b) => b.addEventListener('click', () =>
        openStudentDetail({ path: `/staff/student/${encodeURIComponent(b.dataset.view)}` })));
    }

    $('#sfQ', panel).addEventListener('input', debounce((e) => { q = e.target.value.trim(); load(); }, 250));
    $$('[data-c]', panel).forEach((b) => b.addEventListener('click', () => {
      course = b.dataset.c;
      $$('[data-c]', panel).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      load();
    }));
    await load();
  }

  async function teachers(panel, ctx) {
    const d = await Api.get('/staff/teachers');
    const inCount = d.teachers.filter((t) => t.today).length;
    panel.innerHTML = `
      <div class="page-head"><div><h2>Teacher attendance</h2><p>${inCount} of ${d.teachers.length} teachers have checked in today.</p></div></div>
      <div class="glass card"><div class="table-wrap"><table class="data">
        <thead><tr><th>Teacher</th><th>Department</th><th>Today</th><th style="width:24%">Last 30 days</th></tr></thead>
        <tbody>${d.teachers.map((t) => `<tr>
          <td>${esc(t.name)}<br><small class="muted">${esc(t.designation)}</small></td>
          <td>${esc(t.department)}</td>
          <td>${t.today ? `<span class="badge ${t.today.late ? 'warn' : 'good'}">${t.today.late ? 'Late' : 'Present'}, ${esc(t12(t.today.time))}</span>` : '<span class="badge">Not yet</span>'}</td>
          <td><div class="row" style="flex-wrap:nowrap;gap:.7rem"><div style="flex:1">${barHTML(t.pct, ctx.min)}</div>${pctBadge(t.pct, ctx.min)}</div></td>
        </tr>`).join('')}</tbody></table></div></div>`;
  }

  async function timetable(panel) {
    const meta = await Api.request('/meta', { auth: false });
    panel.innerHTML = `
      <div class="page-head"><div><h2>Timetables</h2><p>Choose a department to see its daily timetable.</p></div>
        <div class="field" style="min-width:240px"><label for="ttDept">Department</label>
          <select class="input" id="ttDept">${meta.departments.map((d) => `<option value="${esc(d.code)}">${esc(d.name)} (${esc(d.course)})</option>`).join('')}</select></div>
      </div>
      <div id="ttHost"></div>`;
    async function load() {
      const tt = await Api.get(`/timetable?department=${encodeURIComponent($('#ttDept', panel).value)}`);
      renderTimetable($('#ttHost', panel), tt);
    }
    $('#ttDept', panel).addEventListener('change', () => load().catch((e) => toast(e.message, 'error')));
    await load();
  }

  async function myAttendance(panel, ctx) {
    panel.innerHTML = `
      <div class="page-head"><div><h2>My attendance</h2><p>Your own daily check-ins. Use the marker on the Overview page each morning.</p></div></div>
      <div id="myAtt"></div>`;
    await renderMyAttendance($('#myAtt', panel), ctx);
  }

  bootDashboard({
    role: 'staff', roleLabel: 'Staff',
    tabs: [
      { id: 'overview', label: 'Overview', icon: 'home', render: overview },
      { id: 'students', label: 'Students', icon: 'users', render: students },
      { id: 'teachers', label: 'Teachers', icon: 'teacher', render: teachers },
      { id: 'timetable', label: 'Timetables', icon: 'clock', render: timetable },
      { id: 'myatt', label: 'My attendance', icon: 'verified', render: myAttendance },
    ],
  });
})();
