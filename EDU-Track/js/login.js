/* Shared login logic for the student, teacher and staff pages (role comes from <body data-role>).
   Requires config.js, ui.js, api.js, camera.js */
(async function () {
  const role = document.body.dataset.role;

  const CONFIG = {
    student: {
      groupKey: 'courses',
      chip: (c) => ({ value: c.code, title: c.code, sub: c.department }),
      demo: { group: 'BCA', id: 'BCA24001', password: 'student123' },
      demoLines: ['Course <code>BCA</code>, ID <code>BCA24001</code> to <code>BCA24008</code>', 'Other courses: <code>BCOM24001</code>, <code>BBA24001</code>, <code>BSC24001</code>, <code>BA24001</code>', 'Password: <code>student123</code>'],
    },
    teacher: {
      groupKey: 'departments',
      chip: (d) => ({ value: d.code, title: d.name, sub: d.course }),
      demo: { group: 'CA', id: 'TCH101', password: 'teacher123' },
      demoLines: ['Computer Applications: <code>TCH101</code> to <code>TCH103</code>', 'Commerce <code>TCH104</code>, Management <code>TCH107</code>, Science <code>TCH110</code>, Arts <code>TCH113</code>', 'Password: <code>teacher123</code>'],
    },
    staff: {
      groupKey: 'staffSections',
      chip: (s) => ({ value: s, title: s, sub: '' }),
      demo: { group: 'Administration Office', id: 'STF101', password: 'staff123' },
      demoLines: ['Administration Office <code>STF101</code>, Accounts Section <code>STF102</code>, Library <code>STF103</code>', 'Examination Cell <code>STF104</code>, Computer Lab <code>STF105</code>', 'Password: <code>staff123</code>'],
    },
  }[role];

  const card = $('#loginCard');
  const form = $('#loginForm');
  const chipsEl = $('#chips');
  const fields = $('#fields');
  const errorEl = $('#formError');
  const submit = $('#submitBtn');
  const uid = $('#uid');
  const pw = $('#pw');
  let group = null;
  let photo = null;

  const cam = mountCamera($('#camMount'), { onChange: (p) => { photo = p; } });

  // Already signed in? Offer a shortcut.
  const existing = Api.getSession();
  if (existing && existing.role === role) {
    const box = $('#resume');
    box.hidden = false;
    box.innerHTML = `<span>You are already signed in.</span><a class="btn btn-primary btn-sm" href="${role}.html">Open dashboard</a>`;
  }

  function selectGroup(value, { focus = true } = {}) {
    group = value;
    $$('.chip', chipsEl).forEach((c) => c.setAttribute('aria-checked', String(c.dataset.value === value)));
    fields.disabled = false;
    errorEl.hidden = true;
    if (focus) setTimeout(() => uid.focus(), 300);
  }

  // Build the course / department / section chips from the backend
  try {
    const meta = await Api.request('/meta', { auth: false });
    chipsEl.innerHTML = '';
    meta[CONFIG.groupKey].forEach((item) => {
      const c = CONFIG.chip(item);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.value = c.value;
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.innerHTML = `<b>${esc(c.title)}</b>${c.sub ? `<small>${esc(c.sub)}</small>` : ''}`;
      b.addEventListener('click', () => selectGroup(c.value));
      chipsEl.append(b);
    });
  } catch (e) {
    chipsEl.innerHTML = `<p class="form-error">${esc(e.message)}</p>`;
  }

  // Password show / hide
  $('#pwToggle').addEventListener('click', (e) => {
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    e.currentTarget.textContent = show ? 'Hide' : 'Show';
    e.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  // Demo helper
  $('#demoList').innerHTML = CONFIG.demoLines.map((l) => `<li>${l}</li>`).join('');
  $('#fillDemo').addEventListener('click', () => {
    selectGroup(CONFIG.demo.group, { focus: false });
    uid.value = CONFIG.demo.id;
    pw.value = CONFIG.demo.password;
  });

  // Local mode: everything is stored in this browser, so offer a way to start fresh.
  if (Api.isLocal()) {
    const reset = $('#resetData');
    reset.hidden = false;
    reset.addEventListener('click', () => {
      Api.resetDemoData();
      toast('Demo data was reset. Photos and attendance you added are cleared.', 'success');
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const showError = (m) => {
      errorEl.textContent = m; errorEl.hidden = false;
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    };
    errorEl.hidden = true;

    if (!group) return showError('Choose one of the options in step 1 first.');
    if (!uid.value.trim() || !pw.value) return showError('Enter your ID and password.');

    submit.classList.add('loading');
    submit.innerHTML = '<span class="spinner"></span>Logging in';
    try {
      const data = await Api.request(`/auth/${role}/login`, {
        method: 'POST', auth: false,
        body: { id: uid.value.trim(), password: pw.value, group, photo },
      });
      Api.setSession({ token: data.token, role: data.role });
      cam.destroy();
      toast(`Welcome, ${data.user.name}.${data.checkin && !data.checkin.already ? ' Your attendance is marked.' : ''}`, 'success');
      card.classList.add('success');
      setTimeout(() => { location.href = `${role}.html`; }, 600);
    } catch (err) {
      showError(err.message);
      submit.classList.remove('loading');
      submit.textContent = 'Log in';
    }
  });
})();
