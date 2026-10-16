/* Student dashboard */
(function () {
  const firstName = (n) => n.split(' ')[0];
  const countIn = (root) => $$('[data-count]', root).forEach((el) =>
    countUp(el, Number(el.dataset.count), { decimals: Number(el.dataset.dec || 0), suffix: el.dataset.suffix || '' }));

  async function overview(panel, ctx) {
    const p = ctx.profile;
    const [att, ac, tt] = await Promise.all([Api.get('/student/attendance'), Api.get('/student/academics'), Api.get('/timetable')]);
    const today = tt.days.find((d) => d.day === tt.today);
    const classes = today ? today.slots.filter((s) => s.type === 'class') : [];
    const now = nowHHMM();

    panel.innerHTML = `
      <div class="page-head"><div>
        <h2>Hello, ${esc(firstName(p.name))}</h2>
        <p>${esc(p.courseName)}, semester ${p.semester}, session ${esc(p.session)}</p>
      </div></div>
      <div class="two-col">
        <div id="idHost"></div>
        <div class="stack">
          <div id="ckHost"></div>
          <div class="tiles">
            <div class="tile glass ${att.pct !== null && att.pct < att.min ? 'alert' : 'hl'}"><div class="tv" data-count="${att.pct ?? ''}" data-dec="1" data-suffix="%">--</div><div class="tl">Class attendance</div></div>
            <div class="tile glass"><div class="tv" data-count="${ac.cgpa ?? ''}" data-dec="2">--</div><div class="tl">CGPA</div></div>
            <div class="tile glass"><div class="tv" data-count="${classes.length}">0</div><div class="tl">Classes today</div></div>
          </div>
          <div class="glass card">
            <div class="section-title"><div><h3>Today's classes</h3><p>${esc(tt.today)}, ${esc(p.course)}</p></div>
              <button type="button" class="btn btn-ghost btn-sm" id="toTT">${icon('clock')}Full timetable</button></div>
            ${classes.length ? `<div class="recent-list" style="grid-template-columns:1fr">${classes.map((s) => {
              const live = now >= s.start && now < s.end;
              return `<div class="recent-item"><span class="s">${esc(s.subject)}<small>${esc(t12(s.start))} to ${esc(t12(s.end))}, ${esc(s.room)}${s.teacher ? ', ' + esc(s.teacher.name) : ''}</small></span>${live ? '<span class="badge warn"><span class="dot pulse"></span>Now</span>' : ''}</div>`;
            }).join('')}</div>` : '<p class="empty">No classes today. Enjoy your day.</p>'}
          </div>
        </div>
      </div>`;

    const card = renderIdCard($('#idHost'), 'student', p, { actions: true });
    addFlipButton(card.actionsEl, card);
    addPhotoButton(card.actionsEl, ctx);
    ctx.onPhoto(card.setPhoto);
    renderCheckinCard($('#ckHost'), ctx, { invalidate: ['attendance'] });
    $('#toTT').addEventListener('click', () => ctx.goTo('timetable'));
    stagger($('.stack', panel));
    countIn(panel);
  }

  async function attendance(panel, ctx) {
    const att = await Api.get('/student/attendance');
    panel.innerHTML = `
      <div class="page-head"><div><h2>Attendance</h2><p>Marked by your teachers for every class. The minimum required is ${att.min}%.</p></div></div>
      <div class="stack" id="attStack">${attendanceHTML(att)}</div>
      <div id="myAtt" style="margin-top:1.2rem"></div>`;
    stagger($('#attStack', panel));
    await renderMyAttendance($('#myAtt', panel), ctx, { title: 'Your daily check-in log' });
  }

  async function academics(panel) {
    const ac = await Api.get('/student/academics');
    panel.innerHTML = `
      <div class="page-head"><div><h2>Academic records</h2><p>Semester-wise marks, grades and grade point averages.</p></div></div>
      <div id="acHost"></div>`;
    renderAcademics($('#acHost', panel), ac);
  }

  async function timetable(panel) {
    const tt = await Api.get('/timetable');
    panel.innerHTML = `
      <div class="page-head"><div><h2>Timetable</h2><p>${esc(tt.department.courseName)}, ${esc(tt.department.name)} department</p></div></div>
      <div id="ttHost"></div>`;
    renderTimetable($('#ttHost', panel), tt);
  }

  bootDashboard({
    role: 'student', roleLabel: 'Student',
    tabs: [
      { id: 'overview', label: 'Overview', icon: 'home', render: overview },
      { id: 'attendance', label: 'Attendance', icon: 'calendar', render: attendance },
      { id: 'academics', label: 'Academics', icon: 'book', render: academics },
      { id: 'timetable', label: 'Timetable', icon: 'clock', render: timetable },
    ],
  });
})();
