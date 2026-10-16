/* Renders the flip-able virtual ID card for any role. Requires ui.js */

const ROLE_LABEL = { student: 'Student', teacher: 'Faculty', staff: 'Staff' };

function barcodeSVG(text) {
  const seed = (`EDU${text}`).split('').map((c) => c.charCodeAt(0));
  const bars = [];
  let x = 0;
  const add = (w, gap) => { bars.push(`<rect x="${x}" y="0" width="${w}" height="48" fill="#0a1f5c"/>`); x += w + gap; };
  add(2, 1); add(1, 2);
  for (let i = 0; i < seed.length * 3; i++) {
    const v = seed[i % seed.length] + i * 7;
    add(1 + (v % 3), 1 + ((v >> 2) % 2));
  }
  add(1, 2); add(2, 0);
  return `<svg viewBox="0 0 ${x} 48" preserveAspectRatio="none" aria-hidden="true">${bars.join('')}</svg>`;
}

function paintPhoto(slot, photo, name) {
  if (!slot) return;
  slot.innerHTML = photo
    ? `<img src="${esc(photo)}" alt="Photo of ${esc(name)}">`
    : `<span class="initials">${esc(initials(name))}</span>`;
}

function idFields(role, p) {
  const d = (s) => (s ? fmtDate(s) : '--');
  if (role === 'student') {
    return {
      front: [
        ['Course', p.course], ['Semester', `Semester ${p.semester}`], ['Roll number', p.rollNo],
        ['Date of birth', d(p.dob)], ['Blood group', p.bloodGroup], ['Phone', p.phone],
      ],
      back: [
        ['Address', p.address], ['Email', p.email],
        [`Guardian (${(p.guardian && p.guardian.relation) || 'Parent'})`, p.guardian ? `${p.guardian.name}, ${p.guardian.phone}` : '--'],
      ],
    };
  }
  if (role === 'teacher') {
    return {
      front: [
        ['Department', p.department], ['Designation', p.designation], ['Qualification', p.qualification],
        ['Joined', d(p.joined)], ['Blood group', p.bloodGroup], ['Phone', p.phone],
      ],
      back: [
        ['Address', p.address], ['Email', p.email],
        ['Subjects taught', (p.subjects || []).join(', ') || '--'],
        ['Emergency contact', p.emergency ? `${p.emergency.name}, ${p.emergency.phone}` : '--'],
      ],
    };
  }
  return {
    front: [
      ['Section', p.section], ['Designation', p.designation], ['Joined', d(p.joined)],
      ['Blood group', p.bloodGroup], ['Phone', p.phone], ['Employment', 'Non-teaching staff'],
    ],
    back: [
      ['Address', p.address], ['Email', p.email],
      ['Emergency contact', p.emergency ? `${p.emergency.name}, ${p.emergency.phone}` : '--'],
    ],
  };
}

function renderIdCard(container, role, p, { hint = true, actions = false } = {}) {
  const f = idFields(role, p);
  const valid = p.validUpto ? fmtDate(p.validUpto, { month: 'short', year: 'numeric' }) : '--';
  container.innerHTML = `
    <div class="idcard-scene">
      <div class="idcard" tabindex="0" role="button" aria-label="${esc(ROLE_LABEL[role])} ID card for ${esc(p.name)}. Press to flip.">
        <section class="idface front">
          <span class="id-slot"></span>
          <div class="id-band">
            <span class="id-logo">${icon('cap')}</span>
            <div class="id-college"><b>MPSPS College</b><small>Identity card, session 2026-27</small></div>
          </div>
          <div class="id-photo-wrap"><div class="idphoto" data-photo-slot></div></div>
          <div class="id-body">
            <div class="id-name">${esc(p.name)}</div>
            <div><span class="id-role">${esc(ROLE_LABEL[role])}</span></div>
            <div class="id-number">${esc(p.id)}</div>
            <dl class="id-grid">${f.front.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          </div>
          <div class="id-foot"><span>Valid up to <b>${esc(valid)}</b></span><span>edutrack</span></div>
          <div class="id-stripe"></div>
        </section>
        <section class="idface back">
          <span class="id-slot"></span>
          <div class="id-back-band"><b>MPSPS College</b><small>EDU-Track virtual identity card</small></div>
          <dl class="id-back-body">${f.back.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          <div class="id-barcode">${barcodeSVG(p.id)}<small>${esc(p.id)}</small></div>
          <p class="id-terms">This card belongs to MPSPS College and must be shown on request. If found, please return it to the administration office.</p>
          <div class="id-stripe"></div>
        </section>
      </div>
    </div>
    ${actions ? '<div class="id-actions"></div>' : ''}
    ${hint ? '<p class="id-hint">Tap the card to flip it.</p>' : ''}`;

  const card = $('.idcard', container);
  paintPhoto($('[data-photo-slot]', container), p.photo, p.name);
  const flip = () => card.classList.toggle('flipped');
  card.addEventListener('click', flip);
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });

  return {
    el: card, flip,
    actionsEl: $('.id-actions', container),
    setPhoto: (photo) => paintPhoto($('[data-photo-slot]', container), photo, p.name),
  };
}
