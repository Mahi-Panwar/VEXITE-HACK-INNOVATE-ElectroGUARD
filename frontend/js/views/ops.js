import { state } from '../state.js';
import { icon } from '../icons.js';
import { SECTORS } from '../config.js';

let opsFilter = 'All';

export function renderOps(container) {
  const filtered = opsFilter === 'All' ? state.reports : state.reports.filter(r => r.severity === opsFilter);
  
  container.innerHTML = `
    <h2 class="section-title">Utility operations dashboard</h2>
    <p class="section-sub">Live view of every AI-verified report across all sectors, with resource lists ready for dispatch.</p>
    <div class="sector-grid" style="margin-bottom:18px">
      ${SECTORS.map(s => {
        const rs = state.reports.filter(r => r.sector === s);
        const hasEmergency = rs.some(r => r.severity === 'Emergency');
        const hasHigh = rs.some(r => r.severity === 'High');
        const color = hasEmergency ? 'var(--red)' : hasHigh ? 'var(--amber)' : rs.length ? 'var(--teal)' : 'var(--border-bright)';
        return `<div class="sector-tile" style="border-color:${color}"><b style="color:${color}">${rs.length}</b><span>${s}</span></div>`;
      }).join('')}
    </div>
    <div class="card">
      <div class="filter-row">
        <label class="field-label" style="margin:0">Filter severity</label>
        <select id="ops-filter">
          ${['All', 'Low', 'Moderate', 'High', 'Emergency'].map(s => `<option ${opsFilter === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <span style="margin-left:auto;font-size:12.5px;color:var(--text-muted)">${filtered.length} report${filtered.length === 1 ? '' : 's'}</span>
      </div>
      ${filtered.length ? `
      <div class="table-scroll">
        <table class="ops-table">
          <thead><tr><th>Sector</th><th>Category</th><th>Equipment</th><th>Severity</th><th>Crew</th><th>Tools / parts</th><th>Reporter</th><th>Filed</th></tr></thead>
          <tbody>
            ${filtered.map(r => `
              <tr>
                <td>${r.sector}</td>
                <td>${r.category}</td>
                <td>${r.equipment}</td>
                <td><span class="badge ${ { 'Low': 'badge-low', 'Moderate': 'badge-moderate', 'High': 'badge-high', 'Emergency': 'badge-emergency' }[r.severity] || 'badge-moderate'}">${r.severity}</span></td>
                <td>${r.manpower}</td>
                <td>${r.toolsAndParts}</td>
                <td>${r.reporterName}</td>
                <td>${new Date(r.timestamp).toLocaleDateString()}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : `<div class="empty-state">${icon('grid')}<p><b style="color:var(--text)">No reports match this filter.</b></p><p>Reports submitted from the Report Fault tab will appear here instantly.</p></div>`}
    </div>
  `;

  document.getElementById('ops-filter').addEventListener('change', e => {
    opsFilter = e.target.value;
    renderOps(container);
  });
}
