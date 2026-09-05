import { state } from '../state.js';
import { icon } from '../icons.js';
import { toast } from '../utils.js';
import { savePersonal, loadShared } from '../api.js';

let modalState = {
  mode: 'login', // 'login' | 'signup'
  phone: '',
  name: '',
  loading: false
};

const DEMO_ACCOUNTS = [
  { name: 'Ananya Sharma', phone: '+91 9876543210' },
  { name: 'Rajesh Kumar', phone: '+91 9812345678' },
  { name: 'Priya Verma', phone: '+91 9765432109' }
];

export function renderModalContent(onSuccessCallback) {
  const container = document.getElementById('modal-content');
  if (!container) return;

  const s = modalState;
  const isLogged = Boolean(state.userId && state.userName);
  const userPoints = state.leaderboard[state.userId]?.points || 0;

  container.innerHTML = `
    ${isLogged ? `
      <div style="text-align:center;padding:10px 0">
        <div style="width:48px;height:48px;border-radius:50%;background:var(--amber-soft);color:var(--amber);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;border:1px solid var(--amber)">
          ${icon('user', 'style="width:24px;height:24px"')}
        </div>
        <h3 style="margin:0 0 4px;font-family:var(--font-display);font-size:22px;color:var(--amber)">👋 Hi, ${state.userName}!</h3>
        <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px">Citizen ID: <code style="color:var(--teal)">${state.userId}</code></p>
        
        <div style="background:var(--bg-elevated);border:1px solid var(--border-bright);padding:14px;border-radius:6px;margin-bottom:20px;text-align:left">
          <div class="kv-row"><span class="k">Civic Points</span><span class="v" style="color:var(--green);font-weight:700">${userPoints} pts</span></div>
          <div class="kv-row"><span class="k">Account Status</span><span class="v" style="color:var(--teal)">Active Citizen</span></div>
        </div>

        <button class="btn btn-danger" id="modal-btn-logout" style="width:100%">${icon('x')} Log Out / Switch Account</button>
      </div>
    ` : `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
        <h3 style="margin:0;font-family:var(--font-display);font-size:20px">
          ${s.mode === 'login' ? 'Citizen Login' : 'Create Citizen Account'}
        </h3>
        <span class="badge badge-teal">${icon('user')} FAST ACCESS</span>
      </div>

      <!-- Tab Switcher -->
      <div style="display:flex;gap:4px;background:var(--bg-elevated);padding:4px;border-radius:6px;margin-bottom:18px">
        <button class="btn ${s.mode === 'login' ? 'btn-primary' : 'btn-ghost'}" id="modal-tab-login" style="flex:1;padding:7px;font-size:13px">Log In</button>
        <button class="btn ${s.mode === 'signup' ? 'btn-primary' : 'btn-ghost'}" id="modal-tab-signup" style="flex:1;padding:7px;font-size:13px">Sign Up</button>
      </div>

      ${s.mode === 'signup' ? `
        <div style="margin-bottom:14px">
          <label class="field-label">Full Name</label>
          <input type="text" id="modal-name" placeholder="e.g. Ananya Sharma" value="${s.name}">
        </div>
      ` : ''}

      <div style="margin-bottom:18px">
        <label class="field-label">Phone Number</label>
        <input type="text" id="modal-phone" placeholder="+91 9876543210" value="${s.phone}">
      </div>

      <button class="btn btn-primary" id="modal-btn-submit" style="width:100%" ${s.loading ? 'disabled' : ''}>
        ${s.loading ? `<span class="spinner"></span> Authenticating…` : `${icon('user')} ${s.mode === 'signup' ? 'Sign Up & Get 100 Pts' : 'Instant Log In'}`}
      </button>

      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
        <span style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:10px;font-weight:600">Quick Demo Accounts:</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${DEMO_ACCOUNTS.map(acc => `
            <button class="btn btn-ghost modal-btn-quick" data-phone="${acc.phone}" data-name="${acc.name}" style="padding:5px 10px;font-size:12px;border-color:var(--border-bright)">
              ${acc.name.split(' ')[0]}
            </button>
          `).join('')}
        </div>
      </div>
    `}
  `;

  if (isLogged) {
    document.getElementById('modal-btn-logout').addEventListener('click', async () => {
      state.userId = null;
      state.userName = null;
      s.phone = '';
      s.name = '';
      await savePersonal();
      toast('Logged out.', 'ok');
      if (onSuccessCallback) onSuccessCallback();
      renderModalContent(onSuccessCallback);
    });
    return;
  }

  const tabLogin = document.getElementById('modal-tab-login');
  if (tabLogin) tabLogin.addEventListener('click', () => { s.mode = 'login'; renderModalContent(onSuccessCallback); });

  const tabSignup = document.getElementById('modal-tab-signup');
  if (tabSignup) tabSignup.addEventListener('click', () => { s.mode = 'signup'; renderModalContent(onSuccessCallback); });

  const nameIn = document.getElementById('modal-name');
  if (nameIn) nameIn.addEventListener('input', e => { s.name = e.target.value; });

  const phoneIn = document.getElementById('modal-phone');
  if (phoneIn) phoneIn.addEventListener('input', e => { s.phone = e.target.value; });

  const submitBtn = document.getElementById('modal-btn-submit');
  if (submitBtn) submitBtn.addEventListener('click', () => handleModalSubmit(onSuccessCallback));

  container.querySelectorAll('.modal-btn-quick').forEach(btn => {
    btn.addEventListener('click', () => {
      s.phone = btn.dataset.phone;
      s.name = btn.dataset.name;
      handleModalSubmit(onSuccessCallback);
    });
  });
}

async function handleModalSubmit(onSuccessCallback) {
  const s = modalState;
  if (!s.phone.trim()) {
    toast('Please enter a phone number.', 'warn');
    return;
  }
  if (s.mode === 'signup' && !s.name.trim()) {
    toast('Please enter your full name.', 'warn');
    return;
  }

  s.loading = true;
  renderModalContent(onSuccessCallback);

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
    toast(`👋 Hi, ${state.userName}! Welcome to ElectroGuard AI.`, 'ok');

    // Close modal
    closeAuthModal();
    if (onSuccessCallback) onSuccessCallback();
  } catch (e) {
    toast(e.message || 'Authentication failed', 'warn');
  }

  s.loading = false;
  renderModalContent(onSuccessCallback);
}

export function openAuthModal(onSuccessCallback) {
  const overlay = document.getElementById('auth-modal-overlay');
  if (overlay) {
    renderModalContent(onSuccessCallback);
    overlay.classList.add('open');
  }
}

export function closeAuthModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
  }
}
