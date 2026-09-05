import { TABS } from './config.js';
import { icon } from './icons.js';
import { state } from './state.js';
import { toast } from './utils.js';
import { loadPersonal, loadBackendUrl, loadShared, setBackendUrl, updateBackendChip } from './api.js';

import { renderHome } from './views/home.js';
import { renderLogin } from './views/login.js';
import { renderReport } from './views/report.js';
import { renderIndoor } from './views/indoor.js';
import { renderPredict } from './views/predict.js';
import { renderRewards } from './views/rewards.js';
import { renderOps } from './views/ops.js';

export function navigateToTab(tabId) {
  state.tab = tabId;
  render();
}

function renderTabs() {
  const nav = document.getElementById('tabs');
  if (!nav) return;
  nav.innerHTML = TABS.map(t => `
    <button class="tab-btn ${state.tab === t.id ? 'active' : ''}" data-tab="${t.id}">
      ${icon(t.icon)}<span>${t.label}</span>
    </button>`).join('');
  
  nav.querySelectorAll('.tab-btn').forEach(b => {
    b.addEventListener('click', () => {
      state.tab = b.dataset.tab;
      render();
    });
  });
}

function updateUserBadge() {
  const badge = document.getElementById('user-session-chip');
  if (!badge) return;
  if (state.userName) {
    const pts = state.leaderboard[state.userId]?.points || 0;
    badge.innerHTML = `${icon('user', 'style="width:13px;height:13px"')} <span>${state.userName} (${pts} pts)</span>`;
  } else {
    badge.innerHTML = `${icon('user', 'style="width:13px;height:13px"')} <span>Guest Citizen</span>`;
  }
}

export function render() {
  renderTabs();
  updateUserBadge();
  const c = document.getElementById('content');
  if (!c) return;

  if (!state.loaded) {
    c.innerHTML = `<div class="empty-state"><div class="spinner" style="width:22px;height:22px;color:var(--amber)"></div><p style="margin-top:10px">Connecting to grid systems…</p></div>`;
    return;
  }

  if (state.tab === 'home') return renderHome(c, navigateToTab);
  if (state.tab === 'login') return renderLogin(c, navigateToTab);
  if (state.tab === 'report') return renderReport(c);
  if (state.tab === 'indoor') return renderIndoor(c);
  if (state.tab === 'predict') return renderPredict(c);
  if (state.tab === 'rewards') return renderRewards(c);
  if (state.tab === 'ops') return renderOps(c);
}

async function init() {
  render();
  await loadPersonal();
  await loadBackendUrl();
  await loadShared();
  state.loaded = true;
  render();
  updateBackendChip();

  const userChip = document.getElementById('user-session-chip');
  if (userChip) {
    userChip.addEventListener('click', () => navigateToTab('login'));
  }

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
