import { state } from '../state.js';
import { icon } from '../icons.js';
import { toast } from '../utils.js';
import { savePersonal, loadShared } from '../api.js';

let authState = {
  mode: 'login', // 'login' | 'signup'
  phone: '',
  name: '',
  sector: 'Sector 1',
  loading: false
};

const DEMO_ACCOUNTS = [
  { name: 'Ananya Sharma', phone: '+91 9876543210', role: 'Active Citizen' },
  { name: 'Rajesh Kumar', phone: '+91 9812345678', role: 'Grid Inspector' },
  { name: 'Priya Verma', phone: '+91 9765432109', role: 'Community Guard' }
];

export function renderLogin(container, navigateToTab) {
  const s = authState;
  const isLogged = Boolean(state.userId && state.userName);
  const userPoints = state.leaderboard[state.userId]?.points || 0;
  const userReportsCount = state.reports.filter(r => r.reporterId === state.userId).length;

  container.innerHTML = `
    <h2 class="section-title">Citizen Portal &amp; Authentication</h2>
    <p class="section-sub">Log in or create a new account to report hazards, claim civic rewards, and monitor grid outage predictions.</p>

    <div class="grid-2">
      <div class="card">
        <div class="corner tl"></div><div class="corner br"></div>

        ${isLogged ? `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <span class="badge badge-teal">${icon('check')} LOGGED IN</span>
            <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted)">ID: ${state.userId}</span>
          </div>

          <div style="background:var(--bg-elevated);border:1px solid var(--border-bright);padding:18px;border-radius:6px;margin-bottom:18px">
            <h3 style="margin:0 0 10px;font-family:var(--font-display);font-size:20px;color:var(--amber)">${state.userName}</h3>
            <div class="kv-row"><span class="k">Civic Points Earned</span><span class="v" style="color:var(--green);font-size:16px">${userPoints} pts</span></div>
            <div class="kv-row"><span class="k">Reports Submitted</span><span class="v">${userReportsCount} reports</span></div>
            <div class="kv-row"><span class="k">Account Status</span><span class="v" style="color:var(--teal)">Verified Citizen</span></div>
          </div>

          <div style="display:flex;gap:10px">
            <button class="btn btn-primary" style="flex:1" id="btn-go-report">${icon('camera')} Report Fault</button>
            <button class="btn btn-danger" style="flex:1" id="btn-logout">${icon('x')} Log Out</button>
          </div>
        ` : `
          <!-- Mode Selector Tabs -->
          <div style="display:flex;gap:4px;background:var(--bg-elevated);padding:4px;border-radius:6px;margin-bottom:20px">
            <button class="btn ${s.mode === 'login' ? 'btn-primary' : 'btn-ghost'}" id="tab-mode-login" style="flex:1;padding:8px">Log In</button>
            <button class="btn ${s.mode === 'signup' ? 'btn-primary' : 'btn-ghost'}" id="tab-mode-signup" style="flex:1;padding:8px">Sign Up</button>
          </div>

          ${s.mode === 'login' ? `
            <div style="margin-bottom:14px">
              <label class="field-label">Registered Phone Number</label>
              <input type="text" id="auth-phone" placeholder="+91 9876543210" value="${s.phone}">
            </div>

            <button class="btn btn-primary" id="btn-submit-auth" style="width:100%;margin-top:10px" ${s.loading ? 'disabled' : ''}>
              ${s.loading ? `<span class="spinner"></span> Logging in…` : `${icon('user')} Log In to Account`}
            </button>
          ` : `
            <div style="margin-bottom:14px">
              <label class="field-label">Full Name</label>
              <input type="text" id="auth-name" placeholder="e.g. Ananya Sharma" value="${s.name}">
            </div>

            <div style="margin-bottom:14px">
              <label class="field-label">Phone Number</label>
              <input type="text" id="auth-phone" placeholder="+91 9876543210" value="${s.phone}">
            </div>

            <button class="btn btn-primary" id="btn-submit-auth" style="width:100%;margin-top:10px" ${s.loading ? 'disabled' : ''}>
              ${s.loading ? `<span class="spinner"></span> Creating Account…` : `${icon('check')} Create Citizen Account`}
            </button>
          `}
        `}
      </div>

      <div class="card">
        <h3 style="font-family:var(--font-display);font-size:18px;margin:0 0 12px">⚡ One-Click Demo Accounts</h3>
        <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px">Click any profile below to test ElectroGuard AI instantly without typing:</p>

        <div style="display:flex;flex-direction:column;gap:10px">
          ${DEMO_ACCOUNTS.map(acc => `
            <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg-elevated);border:1px solid var(--border);padding:10px 14px;border-radius:4px">
              <div>
                <b style="font-size:14px;display:block">${acc.name}</b>
                <span style="font-size:11.5px;color:var(--text-muted)">${acc.phone} · ${acc.role}</span>
              </div>
              <button class="btn btn-ghost btn-quick-login" data-phone="${acc.phone}" data-name="${acc.name}" style="padding:6px 12px;font-size:12.5px;color:var(--amber);border-color:var(--amber)">
                Quick Login
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  if (isLogged) {
    document.getElementById('btn-logout').addEventListener('click', async () => {
      state.userId = null;
      state.userName = null;
      s.phone = '';
      s.name = '';
      await savePersonal();
      toast('Logged out.', 'ok');
      renderLogin(container, navigateToTab);
    });
    document.getElementById('btn-go-report').addEventListener('click', () => navigateToTab('report'));
    return;
  }

  // Auth Mode Toggles
  document.getElementById('tab-mode-login').addEventListener('click', () => { s.mode = 'login'; renderLogin(container, navigateToTab); });
  document.getElementById('tab-mode-signup').addEventListener('click', () => { s.mode = 'signup'; renderLogin(container, navigateToTab); });

  const phoneInput = document.getElementById('auth-phone');
  if (phoneInput) phoneInput.addEventListener('input', e => { s.phone = e.target.value; });

  const nameInput = document.getElementById('auth-name');
  if (nameInput) nameInput.addEventListener('input', e => { s.name = e.target.value; });

  const submitBtn = document.getElementById('btn-submit-auth');
  if (submitBtn) submitBtn.addEventListener('click', () => performAuth(container, navigateToTab));

  container.querySelectorAll('.btn-quick-login').forEach(btn => {
    btn.addEventListener('click', () => {
      s.phone = btn.dataset.phone;
      s.name = btn.dataset.name;
      performAuth(container, navigateToTab);
    });
  });
}

async function performAuth(container, navigateToTab) {
  const s = authState;
  if (!s.phone.trim()) {
    toast('Please enter a phone number.', 'warn');
    return;
  }
  if (s.mode === 'signup' && !s.name.trim()) {
    toast('Please enter your full name for sign up.', 'warn');
    return;
  }

  s.loading = true;
  renderLogin(container, navigateToTab);

  try {
    if (state.backendUrl) {
      const res = await fetch(state.backendUrl + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: s.phone.trim(), name: s.name.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authentication failed');
      state.userId = data.userId;
      state.userName = data.name;
      if (!state.leaderboard[state.userId]) {
        state.leaderboard[state.userId] = { name: data.name, points: data.points };
      }
    } else {
      state.userId = 'u_' + Math.random().toString(36).slice(2, 10);
      state.userName = s.name.trim() || ('Citizen ' + state.userId.slice(-4).toUpperCase());
    }

    await savePersonal();
    await loadShared();
    toast(`Welcome ${s.mode === 'signup' ? 'to ElectroGuard AI' : 'back'}, ${state.userName}!`, 'ok');
    navigateToTab('home');
    return;
  } catch (e) {
    toast(e.message || 'Auth failed', 'warn');
  }

  s.loading = false;
  renderLogin(container, navigateToTab);
}
