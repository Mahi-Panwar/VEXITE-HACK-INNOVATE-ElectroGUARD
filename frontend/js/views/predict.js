import { state } from '../state.js';
import { icon } from '../icons.js';
import { SECTORS, SECTOR_MAP } from '../config.js';
import { toast } from '../utils.js';

let predictState = {
  wind: 35,
  rain: 12,
  sector: SECTORS[0],
  briefing: null,
  generating: false
};

function computeRisk() {
  const p = predictState;
  const faultCount = state.reports.filter(r => r.sector === p.sector).length;
  const windScore = Math.min(p.wind / 90, 1) * 40;
  const rainScore = Math.min(p.rain / 40, 1) * 30;
  const faultScore = Math.min(faultCount / 6, 1) * 30;
  const total = Math.round(windScore + rainScore + faultScore);
  return { total: Math.min(total, 99), faultCount };
}

export function renderPredict(container) {
  const p = predictState;
  const { total, faultCount } = computeRisk();
  const level = total >= 70 ? 'Emergency' : total >= 45 ? 'High' : total >= 22 ? 'Moderate' : 'Low';
  const color = { 'Emergency': 'var(--red)', 'High': 'var(--red)', 'Moderate': 'var(--amber)', 'Low': 'var(--green)' }[level];

  container.innerHTML = `
    <h2 class="section-title">Predictive outage engine</h2>
    <p class="section-sub">Correlates live weather with micro-fault density per sector to forecast blackout risk before the grid fails.</p>

    <!-- Sector Guide Banner -->
    <div style="background:var(--bg-elevated);border:1px solid var(--border-bright);padding:12px 16px;border-radius:6px;margin-bottom:18px;font-size:13px;color:var(--text-muted)">
      <b style="color:var(--amber);display:block;margin-bottom:2px">🧭 City Power Grid Sectors Guide:</b>
      <span>Sectors 1-6 subdivide the city electrical grid into regional substations (Sector 1: North, Sector 2: East, Sector 3: Central, Sector 4: Industrial, Sector 5: South, Sector 6: West). Select a zone to evaluate its live outage vulnerability score.</span>
    </div>

    <div class="grid-2">
      <div class="card">
        <label class="field-label">Wind speed — ${p.wind} km/h</label>
        <input type="range" id="wind-range" min="0" max="120" value="${p.wind}">
        <label class="field-label" style="margin-top:16px">Rainfall — ${p.rain} mm/hr</label>
        <input type="range" id="rain-range" min="0" max="40" value="${p.rain}">
        <label class="field-label" style="margin-top:16px">Power Distribution Sector</label>
        <select id="predict-sector">
          ${SECTORS.map(s => `<option value="${s}" ${p.sector === s ? 'selected' : ''}>${SECTOR_MAP[s] || s}</option>`).join('')}
        </select>

        <div class="sector-grid">
          ${SECTORS.map(s => {
            const cnt = state.reports.filter(r => r.sector === s).length;
            const label = s.replace('Sector ', 'S');
            return `<div class="sector-tile ${s === p.sector ? 'selected' : ''}" data-sector="${s}"><b>${cnt}</b><span>${label}</span></div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <span class="badge badge-teal" style="margin-bottom:10px">${icon('sun')} LIVE MODEL</span>
        <h3 style="font-family:var(--font-display);font-size:19px;margin:6px 0 2px">${SECTOR_MAP[p.sector] || p.sector}</h3>
        <p style="color:var(--text-muted);font-size:13px;margin:0 0 4px">${faultCount} micro-fault report${faultCount === 1 ? '' : 's'} on file for this sector</p>
        <div class="risk-meter"><div class="risk-meter-fill" style="width:${total}%;background:${color}"></div></div>
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span style="font-family:var(--font-mono);font-size:28px;font-weight:700;color:${color}">${total}%</span>
          <span class="badge" style="background:${color}22;color:${color}">${level.toUpperCase()} RISK</span>
        </div>
        <button class="btn" style="width:100%;margin-top:16px" id="briefing-btn" ${p.generating ? 'disabled' : ''}>
          ${p.generating ? `<span class="spinner"></span> Drafting briefing…` : `${icon('bolt')} Generate AI briefing`}
        </button>
        ${p.briefing ? `<div class="briefing-box"><span class="tag">GRID OPERATIONS BRIEFING</span>${p.briefing}</div>` : ''}
      </div>
    </div>
  `;

  document.getElementById('wind-range').addEventListener('input', e => { p.wind = +e.target.value; renderPredict(container); });
  document.getElementById('rain-range').addEventListener('input', e => { p.rain = +e.target.value; renderPredict(container); });
  document.getElementById('predict-sector').addEventListener('change', e => { p.sector = e.target.value; p.briefing = null; renderPredict(container); });
  
  container.querySelectorAll('.sector-tile').forEach(t => t.addEventListener('click', () => {
    p.sector = t.dataset.sector;
    p.briefing = null;
    renderPredict(container);
  }));

  document.getElementById('briefing-btn').addEventListener('click', () => generateBriefing(container));
}

async function generateBriefing(container) {
  const p = predictState;
  const { total, faultCount } = computeRisk();
  p.generating = true;
  renderPredict(container);

  try {
    if (state.backendUrl) {
      const res = await fetch(state.backendUrl + '/api/predict/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: p.sector, wind: p.wind, rain: p.rain })
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.detail || 'Backend error');
      p.briefing = out.briefing;
    } else {
      p.briefing = `Recommend pre-dispatching crew to ${SECTOR_MAP[p.sector] || p.sector}. ${faultCount} micro-faults coupled with ${p.wind} km/h winds elevate blackout probability to ${total}%. Secure loose feeders and position boom crane at primary substation.`;
    }
  } catch (err) {
    toast(err.message || 'Could not generate briefing.', 'warn');
  }

  p.generating = false;
  renderPredict(container);
}
