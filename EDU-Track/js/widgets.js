/* Reusable dashboard widgets. Requires ui.js, api.js, camera.js */

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* ------------------------------------------------------------------
   Self attendance marker (students, teachers and staff)
------------------------------------------------------------------ */
function renderCheckinCard(container, ctx, { invalidate = [] } = {}) {
  container.innerHTML = `
    <div class="checkin glass">
      <div><div class="clock" data-clock></div><div class="clock-date" data-date></div></div>
      <div class="checkin-state" data-state></div>
    </div>`;
  const clockEl = $('[data-clock]', container);
  const dateEl = $('[data-date]', container);
  const stateEl = $('[data-state]', container);
  const cutoff = t12(ctx.me.checkinCutoff);

  const tick = () => {
    if (!document.body.contains(clockEl)) { clearInterval(timer); return; }
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    dateEl.textContent = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  const timer = setInterval(tick, 1000);
  tick();

  function paint() {
    const t = ctx.me.today;
    if (t) {
      stateEl.innerHTML = `
        <div class="state-line">
          <svg class="check-anim" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13"/><path d="M9 15.5l4 4 8-9"/></svg>
          <span>Attendance marked at ${esc(t12(t.time))}</span>
          <span class="badge ${t.late ? 'warn' : 'good'}">${t.late ? 'Late' : 'On time'}</span>
        </div>
        <p class="muted">Your attendance for today is recorded. See you tomorrow.</p>`;
      return;
    }
    stateEl.innerHTML = `
      <div class="state-line"><span class="dot pulse"></span><span>Not marked yet</span></div>
      <p class="muted">Take a photo to mark today's attendance. Check-ins after ${esc(cutoff)} count as late.</p>
      <button type="button" class="btn btn-primary" data-mark>${icon('camera')}Mark my attendance</button>`;
    $('[data-mark]', stateEl).addEventListener('click', mark);
  }

  async function mark() {
    const res = await openCameraModal({
      title: 'Mark your attendance', confirmText: 'Mark attendance', allowSkip: true, skipText: 'Mark without photo',
      note: 'Your photo is also used on your ID card.',
    });
    if (!res) return;
    const btn = $('[data-mark]', stateEl);
    if (btn) { btn.classList.add('loading'); btn.innerHTML = '<span class="spinner"></span>Saving'; }
    try {
      const data = await Api.post('/attendance/checkin', { photo: res.photo });
      ctx.me.today = data.checkin;
      if (res.photo) ctx.setPhoto(data.photo);
      ctx.invalidate(...invalidate);
      paint();
      toast(data.checkin.already ? 'Your attendance was already marked today.' : 'Attendance marked. Have a good day.', 'success');
    } catch (e) {
      toast(e.message, 'error');
      paint();
    }
  }
  paint();
}

/* ------------------------------------------------------------------
   Daily check-in history (last 30 days) for the signed-in person
------------------------------------------------------------------ */
async function renderMyAttendance(container, ctx, { title = 'Daily check-in log' } = {}) {
  const d = await Api.get('/attendance/my');
  const s = d.summary;
  container.innerHTML = `
    <div class="glass card">
      <div class="section-title"><div><h3>${esc(title)}</h3><p>The last 30 days. Check-ins after ${esc(t12(d.cutoff))} are marked late.</p></div></div>
      <div class="att-hero" style="padding:0">
        ${ringHTML(s.pct, { size: 150, sub: 'present', min: ctx.min })}
        <div>
          <div class="att-facts" style="margin-top:0">
            <div><b>${s.present + s.late}</b><span>days present</span></div>
            <div><b>${s.late}</b><span>days late</span></div>
            <div><b>${s.absent}</b><span>days absent</span></div>
            <div><b>${s.workingDays}</b><span>working days</span></div>
          </div>
        </div>
      </div>
      <div class="daystrip" style="margin-top:1.4rem">
        ${d.days.map((x, i) => `<span class="daycell ${x.status}" style="--i:${i}" title="${esc(fmtDate(x.date, { weekday: 'short', day: 'numeric', month: 'short' }))}: ${esc(x.status === 'pending' ? 'not marked yet' : x.status)}${x.time ? ' at ' + esc(t12(x.time)) : ''}"></span>`).join('')}
      </div>
      <div class="legend">
        <span><i style="background:var(--ok)"></i>On time</span><span><i style="background:var(--yellow)"></i>Late</span>
        <span><i style="background:var(--bad)"></i>Absent</span><span><i style="border:1px dashed rgba(255,255,255,.4)"></i>Sunday</span>
      </div>
    </div>`;
}

/* ------------------------------------------------------------------
   Class attendance (marked by teachers): ring + subject-wise + recent
------------------------------------------------------------------ */
function attendanceHTML(att, { cardClass = 'glass card', you = true } = {}) {
  const min = att.min;
  let advice;
  if (!att.held) advice = { tone: '', text: 'No classes have been marked yet.' };
  else if (att.pct >= min) {
    advice = {
      tone: 'good',
      text: att.canSkip > 0
        ? `${you ? 'You are' : 'Attendance is'} above the ${min}% minimum. ${you ? 'You' : 'They'} can miss about ${att.canSkip} more ${att.canSkip === 1 ? 'class' : 'classes'} and stay on track.`
        : `${you ? 'You are' : 'Attendance is'} just above the ${min}% minimum, so avoid missing any class.`,
    };
  } else {
    advice = {
      tone: 'bad',
      text: `${you ? 'Your attendance is' : 'Attendance is'} below the ${min}% minimum. Attending the next ${att.needToAttend} ${att.needToAttend === 1 ? 'class' : 'classes'} in a row brings it back to ${min}%.`,
    };
  }
  return `
    <div class="${cardClass} att-hero">
      ${ringHTML(att.pct, { size: 170, sub: 'attendance', min })}
      <div>
        <h3>${att.held ? `${att.attended} of ${att.held} classes attended` : 'Class attendance'}</h3>
        <div class="notice ${advice.tone}" style="margin-top:.6rem">${icon(advice.tone === 'bad' ? 'info' : 'verified')}<span>${esc(advice.text)}</span></div>
        <div class="att-facts">
          <div><b>${att.attended}</b><span>present</span></div>
          <div><b>${att.absent}</b><span>absent</span></div>
          <div><b>${att.held}</b><span>classes held</span></div>
        </div>
      </div>
    </div>
    <div class="${cardClass}">
      <div class="section-title"><div><h3>Subject-wise attendance</h3></div></div>
      <div class="subject-list">
        ${att.subjects.map((s) => `
          <div class="subject-row">
            <div class="sn"><b title="${esc(s.subject)}">${esc(s.subject)}</b><small>${esc(s.teacher || '')}</small></div>
            <div class="bar-cell">${barHTML(s.pct, min)}<div class="cnt">${s.attended} of ${s.held} classes</div></div>
            <div class="sp">${pctText(s.pct)}</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="${cardClass}">
      <div class="section-title"><div><h3>Recent classes</h3><p>Latest 40 marked classes.</p></div></div>
      ${att.recent.length ? `<div class="recent-list">${att.recent.map((r) => `
        <div class="recent-item"><span class="s">${esc(r.subject)}<small>${esc(fmtDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' }))}</small></span>
        <span class="badge ${r.status === 'P' ? 'good' : 'bad'}">${r.status === 'P' ? 'Present' : 'Absent'}</span></div>`).join('')}</div>`
        : '<p class="empty">No classes marked yet.</p>'}
    </div>`;
}

/* ------------------------------------------------------------------
   Academic records. onSave({semester, subject, internal, external}) => updated academics
------------------------------------------------------------------ */
function renderAcademics(container, ac, { onSave, cardClass = 'glass card' } = {}) {
  let selected = ac.currentSemester;
  container.innerHTML = `<div data-sem></div><div data-glance style="margin-top:1.2rem"></div>`;
  const semArea = $('[data-sem]', container);
  const glance = $('[data-glance]', container);

  const gradeChip = (g) => `<span class="grade ${g === 'F' ? 'F' : g ? '' : 'none'}">${g || '--'}</span>`;

  function drawGlance() {
    glance.innerHTML = `
      <div class="${cardClass}">
        <div class="section-title"><div><h3>Results at a glance</h3><p>${ac.cgpa !== null ? `Cumulative grade point average (CGPA): <b>${ac.cgpa}</b> out of 10` : 'CGPA appears once a semester is complete.'}</p></div></div>
        <div class="sgpa-bars">
          ${ac.semesters.map((s) => `
            <div class="col ${s.sgpa === null ? 'pending' : ''}">
              ${s.sgpa !== null ? `<b>${s.sgpa}</b>` : '<small>Pending</small>'}
              <i style="--h:${s.sgpa !== null ? Math.max(8, s.sgpa * 10) : 14}px"></i>
              <small>Semester ${s.semester}</small>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function drawSem() {
    const sem = ac.semesters.find((s) => s.semester === selected);
    const canEdit = !!onSave && sem.subjects.some((x) => x.editable);
    semArea.innerHTML = `
      <div class="${cardClass}">
        <div class="section-title">
          <div><h3>Academic record</h3><p>Internal marks out of ${ac.maxInternal}, external out of ${ac.maxExternal}.</p></div>
          <div class="seg" role="group" aria-label="Choose semester">
            ${ac.semesters.map((s) => `<button type="button" data-sem="${s.semester}" aria-pressed="${s.semester === selected}">Semester ${s.semester}</button>`).join('')}
          </div>
        </div>
        <div class="sem-summary">
          ${sem.complete
            ? `<div><b>${sem.sgpa}</b><span>SGPA</span></div><div><b>${sem.total}/${sem.max}</b><span>total marks</span></div><div><b>${sem.percentage}%</b><span>percentage</span></div>`
            : `<div><b>Pending</b><span>${sem.current ? 'External exams are not yet held' : 'Result not available'}</span></div>`}
        </div>
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>Subject</th><th class="num">Internal</th><th class="num">External</th><th class="num">Total</th><th>Grade</th>${canEdit ? '<th></th>' : ''}</tr></thead>
            <tbody>
              ${sem.subjects.map((x) => {
                const edit = onSave && x.editable;
                return `<tr data-subject="${esc(x.name)}">
                  <td>${esc(x.name)}</td>
                  <td class="num">${edit ? `<input class="input input-sm mark-input" type="number" min="0" max="${ac.maxInternal}" data-f="internal" value="${x.internal ?? ''}" aria-label="Internal marks for ${esc(x.name)}">` : (x.internal ?? '--')}</td>
                  <td class="num">${edit ? `<input class="input input-sm mark-input" type="number" min="0" max="${ac.maxExternal}" data-f="external" value="${x.external ?? ''}" aria-label="External marks for ${esc(x.name)}">` : (x.external ?? '--')}</td>
                  <td class="num"><b>${x.total ?? '--'}</b></td>
                  <td>${gradeChip(x.grade)}</td>
                  ${canEdit ? `<td>${edit ? `<button type="button" class="btn btn-ghost btn-sm" data-save>${icon('save')}Save</button>` : ''}</td>` : ''}
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        ${canEdit ? '<p class="hint" style="margin-top:.6rem">You can edit marks only for the subjects you teach.</p>' : ''}
      </div>`;

    $$('[data-sem]', semArea).forEach((b) => b.addEventListener('click', () => {
      if (b.tagName !== 'BUTTON') return;
      selected = Number(b.dataset.sem); drawSem();
    }));
    $$('[data-save]', semArea).forEach((b) => b.addEventListener('click', async () => {
      const tr = b.closest('tr');
      b.classList.add('loading');
      try {
        ac = await onSave({
          semester: selected, subject: tr.dataset.subject,
          internal: $('[data-f=internal]', tr).value, external: $('[data-f=external]', tr).value,
        });
        toast('Marks saved.', 'success');
        drawSem(); drawGlance();
      } catch (e) {
        toast(e.message, 'error');
        b.classList.remove('loading');
      }
    }));
  }
  drawSem();
  drawGlance();
}

/* ------------------------------------------------------------------
   Timetable (day view + week view)
------------------------------------------------------------------ */
function renderTimetable(container, data, { showTeacher = true } = {}) {
  const todayName = data.today;
  let day = DAY_ORDER.includes(todayName) ? todayName : 'Monday';
  let view = 'day';
  const dayData = (n) => data.days.find((d) => d.day === n);
  const inSlot = (s) => todayName === day && nowHHMM() >= s.start && nowHHMM() < s.end;

  function slotHTML(s, i) {
    const now = s.type !== 'break' && inSlot(s);
    const cls = ['slot', s.type, now ? 'now' : '', s.mine ? 'mine' : ''].join(' ');
    const sub = s.type === 'class' && showTeacher && s.teacher ? esc(s.teacher.name) : (s.type === 'break' ? 'Time to recharge' : '');
    return `<div class="${cls}" style="--i:${i}">
      <div class="tm"><b>${esc(t12(s.start))}</b><small>to ${esc(t12(s.end))}</small></div>
      <div class="sj"><b>${esc(s.subject)}</b>${sub ? `<small>${sub}</small>` : ''}</div>
      <div class="meta">${now ? '<span class="badge warn"><span class="dot pulse"></span>Happening now</span>' : ''}${s.mine ? '<span class="badge info">Your class</span>' : ''}${s.type !== 'break' ? `<span class="badge">${esc(s.room)}</span>` : ''}</div>
    </div>`;
  }

  function weekHTML() {
    const starts = [...new Set(data.days.flatMap((d) => d.slots.map((s) => s.start)))].sort();
    const endOf = (start) => { for (const d of data.days) { const s = d.slots.find((x) => x.start === start); if (s) return s.end; } return ''; };
    return `<div class="table-wrap"><table class="week">
      <thead><tr><th class="tm">Time</th>${DAY_ORDER.map((d) => `<th class="${d === todayName ? 'today-col' : ''}">${d}</th>`).join('')}</tr></thead>
      <tbody>${starts.map((st) => `<tr><th class="tm">${esc(t12(st))}<br><small>to ${esc(t12(endOf(st)))}</small></th>
        ${DAY_ORDER.map((d) => {
          const s = dayData(d).slots.find((x) => x.start === st);
          const tc = d === todayName ? 'today-col' : '';
          if (!s) return `<td class="${tc}"></td>`;
          if (s.type === 'break') return `<td class="brk ${tc}">Break</td>`;
          return `<td class="${s.mine ? 'mine' : ''} ${tc}"><b>${esc(s.subject)}</b><small>${esc(s.room)}${showTeacher && s.teacher ? ', ' + esc(s.teacher.name) : ''}</small></td>`;
        }).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function draw() {
    container.innerHTML = `
      <div class="tt-controls">
        <div class="seg" role="group" aria-label="Choose day">
          ${DAY_ORDER.map((d) => `<button type="button" data-day="${d}" aria-pressed="${view === 'day' && d === day}" class="${d === todayName ? 'today' : ''}">${d.slice(0, 3)}</button>`).join('')}
        </div>
        <div class="seg" role="group" aria-label="Choose view">
          <button type="button" data-view="day" aria-pressed="${view === 'day'}">Day</button>
          <button type="button" data-view="week" aria-pressed="${view === 'week'}">Whole week</button>
        </div>
      </div>
      <div class="glass card">
        ${view === 'day'
          ? `<div class="section-title"><div><h3>${day}${day === todayName ? ' (today)' : ''}</h3><p>${data.department.name}, ${data.department.course}</p></div></div>
             <div class="slots">${dayData(day).slots.map(slotHTML).join('')}</div>
             ${todayName === 'Sunday' ? '<p class="hint" style="margin-top:1rem">Today is Sunday, so there are no classes. Showing Monday.</p>' : ''}`
          : `<div class="section-title"><div><h3>Weekly timetable</h3><p>${data.department.name}, ${data.department.course}. Dots mark today.</p></div></div>${weekHTML()}`}
      </div>`;
    $$('[data-day]', container).forEach((b) => b.addEventListener('click', () => { day = b.dataset.day; view = 'day'; draw(); }));
    $$('[data-view]', container).forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; draw(); }));
  }
  draw();
}

/* ------------------------------------------------------------------
   Student record modal (teachers: editable marks, staff: read-only)
   path: API path for the detail; saveMarks: optional (payload) => academics
------------------------------------------------------------------ */
async function openStudentDetail({ path, saveMarks, onChange }) {
  const modal = openModal({ title: 'Student record', wide: true, html: '<div class="loading-block"><span class="spinner"></span>Loading record</div>' });
  try {
    const d = await Api.get(path);
    const p = d.profile;
    modal.setTitle(p.name);
    modal.body.innerHTML = `
      <div class="detail-head">
        ${avatarHTML(p)}
        <div><b>${esc(p.name)}</b><p>${esc(p.id)}, ${esc(p.course)} Semester ${p.semester}</p><p>${esc(p.phone)}, ${esc(p.email)}</p></div>
      </div>
      <div class="detail-grid">
        <div class="stack" data-att></div>
        <div data-ac></div>
      </div>`;
    $('[data-att]', modal.body).innerHTML = attendanceHTML(d.attendance, { cardClass: 'mini-card', you: false });
    renderAcademics($('[data-ac]', modal.body), d.academics, {
      cardClass: 'mini-card',
      onSave: saveMarks ? async (payload) => { const ac = await saveMarks({ ...payload, studentId: p.id }); if (onChange) onChange(); return ac; } : undefined,
    });
  } catch (e) {
    modal.body.innerHTML = `<div class="notice bad">${icon('info')}<span>${esc(e.message)}</span></div>`;
  }
}

/* Small helper: a card that lets someone update their ID photo */
function addPhotoButton(actionsEl, ctx) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'btn btn-ghost btn-sm';
  b.innerHTML = `${icon('camera')}Update photo`;
  b.addEventListener('click', async () => {
    const res = await openCameraModal({ title: 'Update your ID photo', confirmText: 'Save photo', note: 'This photo appears on your virtual ID card.' });
    if (!res || !res.photo) return;
    try {
      const data = await Api.post('/me/photo', { photo: res.photo });
      ctx.setPhoto(data.photo);
      toast('Your ID photo has been updated.', 'success');
    } catch (e) { toast(e.message, 'error'); }
  });
  actionsEl.append(b);
}

function addFlipButton(actionsEl, card) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'btn btn-ghost btn-sm';
  b.innerHTML = `${icon('flip')}Flip card`;
  b.addEventListener('click', card.flip);
  actionsEl.prepend(b);
}
