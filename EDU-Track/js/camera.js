/* Photo capture (live camera or file upload). Requires ui.js.
   mountCamera(el, {onChange})  -> embeds the widget (used on login pages)
   openCameraModal({...})       -> popup that resolves with {photo} (used on dashboards) */

function toPortraitDataURL(src, sw, sh) {
  const tw = 300; const th = 400; const ratio = tw / th;
  let cw = sw; let ch = sh;
  if (sw / sh > ratio) cw = sh * ratio; else ch = sw / ratio;
  const canvas = document.createElement('canvas');
  canvas.width = tw; canvas.height = th;
  canvas.getContext('2d').drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, tw, th);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function mountCamera(root, { onChange, large = false, hint = '' } = {}) {
  root.innerHTML = `
    <div class="cam ${large ? 'lg' : ''}">
      <div class="cam-stage">
        <video autoplay playsinline muted></video>
        <img alt="Captured photo" hidden>
        <div class="cam-ph">${icon('camera')}<span>No photo yet</span></div>
        <div class="cam-guide"></div>
        <div class="cam-flash"></div>
      </div>
      <div class="cam-side">
        <div class="cam-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-act="open">${icon('camera')}Open camera</button>
          <button type="button" class="btn btn-primary btn-sm" data-act="snap" hidden>${icon('camera')}Take photo</button>
          <button type="button" class="btn btn-ghost btn-sm" data-act="retake" hidden>${icon('flip')}Retake</button>
          <label class="btn btn-ghost btn-sm">${icon('upload')}Upload<input type="file" accept="image/*" capture="user" hidden></label>
        </div>
        <p class="cam-msg">${esc(hint)}</p>
      </div>
    </div>`;

  const cam = $('.cam', root);
  const video = $('video', root);
  const img = $('img', root);
  const ph = $('.cam-ph', root);
  const flash = $('.cam-flash', root);
  const msgEl = $('.cam-msg', root);
  const btn = (a) => $(`[data-act="${a}"]`, root);
  const fileInput = $('input[type=file]', root);
  let stream = null;
  let photo = null;

  const msg = (t, err = false) => { msgEl.textContent = t; msgEl.classList.toggle('err', err); };
  const stopStream = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null; video.srcObject = null;
  };
  const ui = (state) => {
    cam.classList.toggle('live', state === 'live');
    cam.classList.toggle('has-photo', state === 'photo');
    video.hidden = state !== 'live';
    img.hidden = state !== 'photo';
    ph.hidden = state !== 'idle';
    btn('open').hidden = state !== 'idle';
    btn('snap').hidden = state !== 'live';
    btn('retake').hidden = state !== 'photo';
  };
  ui('idle');

  const setPhoto = (dataUrl) => {
    photo = dataUrl;
    img.src = dataUrl;
    stopStream();
    ui('photo');
    flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    msg('Photo ready.');
    if (onChange) onChange(photo);
  };

  async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      msg('The camera is not available here (it needs https or localhost). Use Upload instead.', true);
      return;
    }
    try {
      msg('Starting camera...');
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } }, audio: false });
      video.srcObject = stream;
      await video.play().catch(() => {});
      ui('live');
      msg('Centre your face in the outline, then tap Take photo.');
    } catch (e) {
      stopStream();
      msg(e && e.name === 'NotAllowedError'
        ? 'Camera access was blocked. Allow it in your browser settings, or use Upload.'
        : 'Could not start the camera. Use Upload instead.', true);
    }
  }

  btn('open').addEventListener('click', start);
  btn('retake').addEventListener('click', () => { photo = null; if (onChange) onChange(null); start(); });
  btn('snap').addEventListener('click', () => {
    if (!video.videoWidth) { msg('The camera is still warming up. Try again in a second.', true); return; }
    setPhoto(toPortraitDataURL(video, video.videoWidth, video.videoHeight));
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { msg('Please choose an image file.', true); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const im = new Image();
      im.onload = () => setPhoto(toPortraitDataURL(im, im.naturalWidth, im.naturalHeight));
      im.onerror = () => msg('That image could not be read.', true);
      im.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  return {
    getPhoto: () => photo,
    reset() { photo = null; stopStream(); ui('idle'); msg(hint); if (onChange) onChange(null); },
    destroy: stopStream,
    stop: stopStream,
  };
}

function openCameraModal({ title = 'Take your photo', confirmText = 'Use this photo', allowSkip = false, skipText = 'Skip the photo', note = '' } = {}) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      ${note ? `<p class="muted" style="margin-bottom:1rem;text-align:center">${esc(note)}</p>` : ''}
      <div data-cam></div>
      <div class="cam-confirm">
        <button type="button" class="btn btn-primary" data-act="ok" disabled>${esc(confirmText)}</button>
        ${allowSkip ? `<button type="button" class="btn btn-ghost" data-act="skip">${esc(skipText)}</button>` : ''}
      </div>`;
    let settled = false;
    let cam = null;
    const finish = (value) => { settled = true; if (cam) cam.destroy(); resolve(value); modal.close(); };
    const modal = openModal({
      title, html: wrap,
      onClose: () => { if (cam) cam.destroy(); if (!settled) resolve(null); },
    });
    const ok = $('[data-act="ok"]', wrap);
    cam = mountCamera($('[data-cam]', wrap), { large: true, onChange: (p) => { ok.disabled = !p; } });
    ok.addEventListener('click', () => finish({ photo: cam.getPhoto() }));
    const skip = $('[data-act="skip"]', wrap);
    if (skip) skip.addEventListener('click', () => finish({ photo: null }));
  });
}
