import { state } from '../state.js';
import { toast } from '../utils.js';
import { savePersonal, saveLeaderboard } from '../api.js';

export function renderRewards(container) {
  const me = state.leaderboard[state.userId] || { name: state.userName, points: 0 };
  const myReports = state.reports.filter(r => r.reporterId === state.userId);
  const board = Object.entries(state.leaderboard)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 8);

  container.innerHTML = `
    <h2 class="section-title">My reports &amp; rewards</h2>
    <p class="section-sub">Points are awarded for verified reports — submit verified hazards to climb the community leaderboard.</p>
    <div class="card">
      <div class="points-hero">
        <div>
          <label class="field-label">Display name</label>
          <input type="text" id="name-input" value="${state.userName}" style="max-width:240px">
        </div>
        <div class="points-value">${me.points || 0}<span> civic points</span></div>
      </div>
    </div>
    <div class="grid-2" style="margin-top:14px">
      <div class="card">
        <h3 style="font-family:var(--font-display);font-size:17px;margin:0 0 10px">Leaderboard</h3>
        ${board.length ? board.map((u, i) => `
          <div class="leaderboard-row">
            <span class="lb-rank">#${i + 1}</span>
            <span class="lb-name">${u.name}${u.id === state.userId ? ' (you)' : ''}</span>
            <span class="lb-points">${u.points}</span>
          </div>`).join('') : `<div class="empty-state"><p>No civic points awarded yet. Submit the first report.</p></div>`}
      </div>
      <div class="card">
        <h3 style="font-family:var(--font-display);font-size:17px;margin:0 0 10px">My reports</h3>
        ${myReports.length ? myReports.map(r => `
          <div class="report-row">
            <div class="report-row-top">
              <b>${r.equipment}</b>
              <span class="badge ${ { 'Low': 'badge-low', 'Moderate': 'badge-moderate', 'High': 'badge-high', 'Emergency': 'badge-emergency' }[r.severity] || 'badge-moderate'}">${r.severity}</span>
            </div>
            <div class="meta">${r.sector} · ${new Date(r.timestamp).toLocaleString()} · ${r.status}</div>
          </div>`).join('') : `<div class="empty-state"><p>You haven't submitted a report yet.</p></div>`}
      </div>
    </div>
  `;

  document.getElementById('name-input').addEventListener('change', async e => {
    state.userName = e.target.value.trim() || state.userName;
    await savePersonal();
    if (state.leaderboard[state.userId]) {
      state.leaderboard[state.userId].name = state.userName;
      await saveLeaderboard();
    }
    toast('Name updated.', 'ok');
  });
}
