/* API client. In "local" mode requests are answered by js/localserver.js inside the browser,
   otherwise they are sent to a real backend at API_BASE. */
const Api = (() => {
  const CFG = window.EDUTRACK_CONFIG || {};
  const KEY = 'edutrack_session';
  const useLocal = () => !!window.LocalServer && CFG.MODE !== 'remote';

  const getSession = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const setSession = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  const clear = () => localStorage.removeItem(KEY);
  const loginPage = (role) => (['student', 'teacher', 'staff'].includes(role) ? `login-${role}.html` : 'index.html');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function request(path, { method = 'GET', body, auth = true } = {}) {
    const session = getSession();
    const bearer = auth && session ? `Bearer ${session.token}` : '';
    let status; let data = {};

    if (useLocal()) {
      await sleep(60 + Math.random() * 90);   // tiny delay so loading states feel natural
      const out = await window.LocalServer.handle(method, `/api${path}`, body, bearer);
      status = out.status; data = out.data;
    } else {
      const headers = { 'Content-Type': 'application/json' };
      if (bearer) headers.Authorization = bearer;
      let res;
      try {
        res = await fetch(`${CFG.API_BASE || ''}/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
      } catch {
        throw new Error('Cannot reach the EDU-Track server. Start the backend and try again.');
      }
      status = res.status;
      try { data = await res.json(); } catch { /* empty body */ }
    }

    if (status >= 400) {
      if (status === 401 && auth && session) { clear(); location.href = loginPage(session.role); }
      const err = new Error(data.error || 'Something went wrong. Please try again.');
      err.status = status;
      throw err;
    }
    return data;
  }

  return {
    request, getSession, setSession, clear, loginPage,
    get: (p) => request(p),
    post: (p, body) => request(p, { method: 'POST', body }),
    put: (p, body) => request(p, { method: 'PUT', body }),
    isLocal: useLocal,
    resetDemoData() { if (window.LocalServer) window.LocalServer.reset(); clear(); },
    logout() {
      const s = getSession();
      clear();
      location.href = s ? loginPage(s.role) : 'index.html';
    },
  };
})();
