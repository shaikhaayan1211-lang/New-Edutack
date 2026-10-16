/* =========================================================================
   Upcoming events shown on the front page.

   HOW TO EDIT: change, add or delete items in COLLEGE_EVENTS below.
   Each event needs:
     category : 'nss' | 'sports' | 'cultural' | 'committee'
     title, time, venue, by (who organises it), about (one short sentence)
     date     : a fixed date like '2026-11-14'
        OR
     in       : number of days from today (keeps the event "upcoming" while you test)
   Events whose date has passed are hidden automatically.
   ========================================================================= */
const COLLEGE_EVENTS = [
  { category: 'committee', title: 'Student Council Meeting', in: 3, time: '1:00 PM to 2:00 PM', venue: 'Committee Room', by: 'Student Council',
    about: 'Class representatives discuss this month\'s activities and student suggestions.' },
  { category: 'sports', title: 'Volleyball and Kabaddi Trials', in: 4, time: '3:30 PM to 5:30 PM', venue: 'College Ground', by: 'Sports Department',
    about: 'Selection trials for the college teams. Bring your ID card and sports shoes.' },
  { category: 'committee', title: 'Anti-Ragging Awareness Session', in: 5, time: '11:00 AM to 12:00 PM', venue: 'Seminar Hall', by: 'Anti-Ragging Committee',
    about: 'A short session on student rights, safe reporting and how the committee helps.' },
  { category: 'nss', title: 'NSS Blood Donation Camp', in: 6, time: '10:00 AM to 2:00 PM', venue: 'College Auditorium', by: 'NSS Unit',
    about: 'Volunteers run the camp with a partner blood bank. Donors and helpers are welcome.' },
  { category: 'cultural', title: 'Open Mic and Talent Hunt', in: 8, time: '2:00 PM to 4:30 PM', venue: 'Seminar Hall', by: 'Cultural Committee',
    about: 'Sing, dance, recite or perform. Auditions for the annual cultural fest start here.' },
  { category: 'sports', title: 'Inter-Department Cricket Tournament', in: 9, time: '8:00 AM onwards', venue: 'College Ground', by: 'Sports Department',
    about: 'Every department fields a team. Knockout matches run across two days.' },
  { category: 'nss', title: 'Tree Plantation Drive', in: 11, time: '7:30 AM to 10:00 AM', venue: 'Campus Garden', by: 'NSS Unit',
    about: 'NSS volunteers plant and adopt saplings around the campus.' },
  { category: 'committee', title: 'Placement Cell Resume Workshop', in: 12, time: '10:30 AM to 1:00 PM', venue: 'Computer Lab', by: 'Placement Cell',
    about: 'Final-year students learn to build a clear resume and prepare for interviews.' },
  { category: 'cultural', title: 'Debate and Elocution Competition', in: 14, time: '11:00 AM to 3:00 PM', venue: 'Auditorium', by: 'Cultural Committee',
    about: 'Speak on current topics in English, Hindi or Marathi. Open to all departments.' },
  { category: 'nss', title: 'NSS Special Camp: Village Cleanliness Drive', in: 18, time: '7:00 AM to 4:00 PM', venue: 'Adopted village', by: 'NSS Unit',
    about: 'A one-day camp of cleaning, awareness rallies and a health check-up stall.' },
  { category: 'committee', title: 'Women\'s Development Cell Workshop', in: 20, time: '11:00 AM to 1:00 PM', venue: 'Seminar Hall', by: 'Women\'s Development Cell',
    about: 'A workshop on safety, career growth and leadership for students and staff.' },
  { category: 'cultural', title: 'Annual Cultural Fest', in: 26, time: '5:00 PM onwards', venue: 'College Auditorium', by: 'Cultural Committee',
    about: 'An evening of dance, music, drama and rangoli by students of every department.' },
  { category: 'sports', title: 'Annual Sports Day', in: 30, time: '9:00 AM to 4:00 PM', venue: 'College Ground', by: 'Sports Department',
    about: 'March past, track and field events, relay races and the prize distribution.' },
];

/* ---------------- Rendering (requires ui.js) ---------------- */
const EVENT_CATEGORIES = {
  nss: { label: 'NSS', icon: 'heart' },
  sports: { label: 'Sports', icon: 'trophy' },
  cultural: { label: 'Cultural', icon: 'music' },
  committee: { label: 'Committees', icon: 'users' },
};

function initEvents() {
  const listEl = $('#eventList');
  if (!listEl) return;
  const today = localDate();
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return localDate(d); };
  const dayDiff = (s) => Math.round((new Date(`${s}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000);

  const events = COLLEGE_EVENTS
    .map((e) => ({ ...e, date: e.date || addDays(e.in) }))
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const when = (s) => { const n = dayDiff(s); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`; };
  const LIMIT = 6;
  let filter = 'all';
  let expanded = false;

  // Filter chips with counts
  const filtersEl = $('#eventFilters');
  const count = (c) => (c === 'all' ? events.length : events.filter((e) => e.category === c).length);
  filtersEl.innerHTML = [['all', 'All events'], ...Object.entries(EVENT_CATEGORIES).map(([k, v]) => [k, v.label])]
    .map(([k, label]) => `<button type="button" class="fchip" data-f="${k}" aria-pressed="${k === 'all'}">${esc(label)}<span>${count(k)}</span></button>`).join('');

  // "Next up" strip
  const nextEl = $('#nextUp');
  if (events.length) {
    const n = events[0];
    nextEl.innerHTML = `<div class="next-up glass" data-cat="${n.category}">
      <span class="nu-ic">${icon(EVENT_CATEGORIES[n.category].icon)}</span>
      <div><b>Next up: ${esc(n.title)}</b><small>${esc(when(n.date))}, ${esc(fmtDate(n.date, { weekday: 'long', day: 'numeric', month: 'long' }))}, ${esc(n.venue)}</small></div>
    </div>`;
  }

  function card(e) {
    const d = new Date(`${e.date}T00:00:00`);
    const cat = EVENT_CATEGORIES[e.category];
    return `<article class="event glass" data-cat="${e.category}">
      <div class="date-block" aria-label="${esc(fmtDate(e.date))}"><span>${esc(d.toLocaleDateString('en-IN', { month: 'short' }))}</span><b>${d.getDate()}</b><small>${esc(d.toLocaleDateString('en-IN', { weekday: 'short' }))}</small></div>
      <div class="ev-body">
        <div class="ev-tags"><span class="ev-cat">${icon(cat.icon)}${esc(cat.label)}</span><span class="ev-when">${esc(when(e.date))}</span></div>
        <h4>${esc(e.title)}</h4>
        <p class="ev-about">${esc(e.about)}</p>
        <ul class="ev-meta">
          <li>${icon('clock')}${esc(e.time)}</li>
          <li>${icon('pin')}${esc(e.venue)}</li>
        </ul>
        <small class="ev-by">Organised by ${esc(e.by)}</small>
      </div>
    </article>`;
  }

  const moreBtn = $('#eventMore');
  function draw() {
    const all = events.filter((e) => filter === 'all' || e.category === filter);
    const shown = expanded ? all : all.slice(0, LIMIT);
    if (!all.length) {
      const label = filter === 'all' ? 'events' : `${EVENT_CATEGORIES[filter].label} events`;
      listEl.removeAttribute('data-stagger');
      listEl.innerHTML = `<p class="empty ev-empty">No upcoming ${esc(label)} right now. Check back soon.</p>`;
    } else {
      listEl.innerHTML = shown.map(card).join('');
      stagger(listEl);
    }
    moreBtn.hidden = all.length <= LIMIT;
    moreBtn.textContent = expanded ? 'Show fewer events' : `Show all ${all.length} events`;
  }

  filtersEl.addEventListener('click', (ev) => {
    const b = ev.target.closest('.fchip');
    if (!b) return;
    filter = b.dataset.f; expanded = false;
    $$('.fchip', filtersEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    draw();
  });
  moreBtn.addEventListener('click', () => { expanded = !expanded; draw(); });
  draw();
}
