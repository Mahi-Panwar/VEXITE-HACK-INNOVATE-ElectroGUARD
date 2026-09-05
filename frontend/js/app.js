import { TABS } from './config.js';
import { icon } from './icons.js';
import { state } from './state.js';
import { toast } from './utils.js';
import { loadPersonal, loadBackendUrl, loadShared, setBackendUrl, updateBackendChip } from './api.js';
import { openAuthModal, closeAuthModal } from './components/modal.js';

import { renderHome } from './views/home.js';
import { renderLogin } from './views/login.js';
import { renderReport } from './views/report.js';
import { renderIndoor } from './views/indoor.js';
import { renderPredict } from './views/predict.js';
import { renderRewards } from './views/rewards.js';
import { renderOps } from './views/ops.js';

export function navigateToTab(tabId) {
  state.tab = tabId;
  closeSidebar();
  render();
}

function renderSidebar() {
  const sidebarNav = document.getElementById('sidebar-nav');
  if (!sidebarNav) return;

  sidebarNav.innerHTML = TABS.map(t => `
    <button class="sidebar-item ${state.tab === t.id ? 'active' : ''}" data-tab="${t.id}">
      ${icon(t.icon)}<span>${t.label}</span>
    </button>
  `).join('');

  sidebarNav.querySelectorAll('.sidebar-item').forEach(b => {
    b.addEventListener('click', () => {
      navigateToTab(b.dataset.tab);
    });
  });
}

function updateUserBadge() {
  const badge = document.getElementById('user-session-chip');
  if (!badge) return;
  if (state.userName) {
    const pts = state.leaderboard[state.userId]?.points || 0;
    badge.className = 'user-greeting-chip';
    badge.innerHTML = `👋 Hi, ${state.userName.split(' ')[0]}! (${pts} pts)`;
  } else {
    badge.className = 'status-chip';
    badge.style.cursor = 'pointer';
    badge.innerHTML = `${icon('user', 'style="width:13px;height:13px"')} <span>Login / Sign Up</span>`;
  }
}

export function render() {
  renderSidebar();
  updateUserBadge();
  const c = document.getElementById('content');
  if (!c) return;

  if (!state.loaded) {
    c.innerHTML = `<div class="empty-state"><div class="spinner" style="width:22px;height:22px;color:var(--amber)"></div><p style="margin-top:10px">Connecting to grid systems…</p></div>`;
    return;
  }

  if (state.tab === 'home') return renderHome(c, navigateToTab, render);
  if (state.tab === 'login') return renderLogin(c, navigateToTab);
  if (state.tab === 'report') return renderReport(c);
  if (state.tab === 'indoor') return renderIndoor(c);
  if (state.tab === 'predict') return renderPredict(c);
  if (state.tab === 'rewards') return renderRewards(c);
  if (state.tab === 'ops') return renderOps(c);
}

function openSidebar() {
  document.getElementById('sidebar-drawer')?.classList.add('open');
  document.getElementById('sidebar-overlay')?.classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar-drawer')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
}

async function init() {
  render();
  await loadPersonal();
  await loadBackendUrl();
  await loadShared();
  state.loaded = true;
  render();
  updateBackendChip();

  // User Badge click -> opens Login Popup Modal
  const userChip = document.getElementById('user-session-chip');
  if (userChip) {
    userChip.addEventListener('click', () => openAuthModal(render));
  }

  // Hamburger Sidebar Drawer handlers
  const hamburgerBtn = document.getElementById('hamburger-btn');
  if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);

  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);

  const sidebarOverlay = document.getElementById('sidebar-overlay');
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  // Modal Overlay handlers
  const modalCloseBtn = document.getElementById('modal-close-btn');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeAuthModal);

  const modalOverlay = document.getElementById('auth-modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeAuthModal();
    });
  }

  // Backend link chip
  const chip = document.getElementById('backend-chip');
  if (chip) {
    chip.addEventListener('click', async () => {
      const cur = state.backendUrl || '';
      const val = window.prompt('Backend URL (e.g. http://127.0.0.1:8000). Leave blank to use local built-in storage instead.', cur);
      if (val === null) return;
      await setBackendUrl(val.trim(), render);
      toast(state.backendUrl ? 'Connected to backend at ' + state.backendUrl : 'Switched to local mode.', 'ok');
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
