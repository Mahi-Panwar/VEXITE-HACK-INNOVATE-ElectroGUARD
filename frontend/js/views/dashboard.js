import { state } from '../state.js';
import { icon } from '../icons.js';
import { toast } from '../utils.js';
import { openAuthModal } from '../components/modal.js';

export function renderDashboard(container, navigateToTab, renderApp) {
  const isLogged = Boolean(state.userId && state.userName);
  const me = state.leaderboard[state.userId] || { name: state.userName || 'Guest Citizen', points: 0 };
  const userPoints = me.points || 0;
  const myReports = state.reports.filter(r => r.reporterId === state.userId);
  const verifiedCount = myReports.filter(r => r.status !== 'Merged').length;
  const mergedCount = myReports.filter(r => r.status === 'Merged').length;
  const householdsSaved = verifiedCount * 35 + 15;
  const rebateUnlocked = Math.floor(userPoints / 100) * 100;

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
      <div>
        <h2 class="section-title" style="margin:0">Citizen Overview Dashboard</h2>
        <p class="section-sub" style="margin:0">Track your personal reporting statistics, earned civic rebates, and active grid dispatches.</p>
      </div>
      ${!isLogged ? `
        <button class="btn btn-primary" id="dash-btn-login">${icon('user')} Login to Save Progress</button>
      ` : ''}
    </div>

    ${!isLogged ? `
      <div style="background:var(--amber-soft);border:1px solid var(--amber);padding:14px 18px;border-radius:6px;margin-bottom:22px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <b style="color:var(--amber);font-size:15px;display:block;margin-bottom:2px">👋 You are currently using Guest Mode</b>
          <span style="font-size:13px;color:var(--text-muted)">Log in or sign up to save your civic points and claim electricity bill discounts.</span>
        </div>
        <button class="btn btn-primary" id="dash-banner-login" style="padding:7px 14px;font-size:13px">${icon('user')} Sign Up / Login</button>
      </div>
    ` : ''}

    <!-- User Header Profile Card -->
    <div class="card" style="margin-bottom:20px">
      <div class="corner tl"></div><div class="corner br"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:18px">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:54px;height:54px;border-radius:12px;background:linear-gradient(135deg, var(--amber), #c9791a);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;color:#1a1204;box-shadow:0 0 0 1px rgba(245,166,35,0.4)">
            ${(state.userName || 'G')[0].toUpperCase()}
          </div>
          <div>
            <h3 style="margin:0 0 4px;font-family:var(--font-display);font-size:22px;display:flex;align-items:center;gap:10px">
              ${state.userName || 'Guest Citizen'}
              <span class="badge badge-teal" style="font-size:11px">🏆 VERIFIED GUARD</span>
            </h3>
            <div style="font-size:12.5px;color:var(--text-muted);display:flex;gap:14px;flex-wrap:wrap">
              <span>Citizen ID: <code style="color:var(--teal)">${state.userId || 'Guest'}</code></span>
              <span>Primary Sector: <b>Sector 1 (North Zone)</b></span>
            </div>
          </div>
        </div>

        <div style="text-align:right">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:2px">Electricity Rebate Eligible</div>
          <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:var(--green)">₹${rebateUnlocked} Coupon</div>
        </div>
      </div>
    </div>

    <!-- Analytics Stat Cards -->
    <div class="grid-4" style="margin-bottom:24px">
      <div class="card">
        <div class="corner tl"></div>
        <span style="font-size:12px;color:var(--text-muted);font-weight:600">Civic Points</span>
        <div style="font-family:var(--font-display);font-size:36px;font-weight:700;color:var(--amber);margin:6px 0 2px">${userPoints} <span style="font-size:14px;color:var(--text-muted)">pts</span></div>
        <div style="font-size:11.5px;color:var(--text-dim)">+100 pts per verified report</div>
      </div>

      <div class="card">
        <div class="corner tl"></div>
        <span style="font-size:12px;color:var(--text-muted);font-weight:600">Verified Reports</span>
        <div style="font-family:var(--font-display);font-size:36px;font-weight:700;color:var(--teal);margin:6px 0 2px">${verifiedCount}</div>
        <div style="font-size:11.5px;color:var(--text-dim)">${mergedCount} duplicate merged</div>
      </div>

      <div class="card">
        <div class="corner tl"></div>
        <span style="font-size:12px;color:var(--text-muted);font-weight:600">Households Protected</span>
        <div style="font-family:var(--font-display);font-size:36px;font-weight:700;color:var(--green);margin:6px 0 2px">${householdsSaved}</div>
        <div style="font-size:11.5px;color:var(--text-dim)">Estimated outage prevention</div>
      </div>

      <div class="card">
        <div class="corner tl"></div>
        <span style="font-size:12px;color:var(--text-muted);font-weight:600">Community Rank</span>
        <div style="font-family:var(--font-display);font-size:36px;font-weight:700;color:var(--text);margin:6px 0 2px">Top 5%</div>
        <div style="font-size:11.5px;color:var(--text-dim)">Active Grid Contributor</div>
      </div>
    </div>

    <!-- Quick Action Shortcuts Panel -->
    <div style="margin-bottom:24px">
      <h3 style="font-family:var(--font-display);font-size:18px;margin:0 0 12px">Quick Actions</h3>
      <div class="grid-4">
        <button class="btn btn-primary" id="act-btn-report" style="padding:14px;justify-content:flex-start">
          ${icon('camera')} <span>Report New Hazard</span>
        </button>
        
        <button class="btn" id="act-btn-indoor" style="padding:14px;justify-content:flex-start">
          ${icon('plug')} <span>Indoor Triage</span>
        </button>

        <button class="btn" id="act-btn-predict" style="padding:14px;justify-content:flex-start">
          ${icon('cloud')} <span>Outage Predictor</span>
        </button>

        <button class="btn" id="act-btn-rebate" style="padding:14px;justify-content:flex-start;border-color:var(--green);color:var(--green)">
          ${icon('star')} <span>Claim Rebate Coupon</span>
        </button>
      </div>
    </div>

    <!-- My Personal Reports History -->
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <h3 style="font-family:var(--font-display);font-size:18px;margin:0">My Submitted Reports (${myReports.length})</h3>
        <button class="btn btn-ghost" id="dash-btn-rewards-page" style="font-size:12.5px">View Full Leaderboard →</button>
      </div>

      ${myReports.length ? `
        <div class="table-scroll">
          <table class="ops-table">
            <thead><tr><th>Equipment</th><th>Sector</th><th>Severity</th><th>Status</th><th>Crew Allocated</th><th>Date Filed</th></tr></thead>
            <tbody>
              ${myReports.map(r => `
                <tr>
                  <td><b>${r.equipment}</b><br><span style="font-size:11px;color:var(--text-muted)">${r.category}</span></td>
                  <td>${r.sector}</td>
                  <td><span class="badge ${ { 'Low': 'badge-low', 'Moderate': 'badge-moderate', 'High': 'badge-high', 'Emergency': 'badge-emergency' }[r.severity] || 'badge-moderate'}">${r.severity}</span></td>
                  <td><span class="badge ${r.status === 'Merged' ? 'badge-high' : 'badge-teal'}">${r.status}</span></td>
                  <td>${r.manpower || 'Queued for dispatch'}</td>
                  <td>${new Date(r.timestamp).toLocaleDateString()}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state">
          ${icon('camera')}
          <p><b style="color:var(--text)">No reports filed yet.</b></p>
          <p>Photograph a downed line, sparking transformer, or meter hazard to earn your first 100 Civic Points!</p>
          <button class="btn btn-primary" id="dash-btn-first-report" style="margin-top:12px">${icon('camera')} Report First Hazard</button>
        </div>
      `}
    </div>
  `;

  // Attach Event Listeners
  const loginBtn1 = document.getElementById('dash-btn-login');
  if (loginBtn1) loginBtn1.addEventListener('click', () => openAuthModal(renderApp));

  const loginBtn2 = document.getElementById('dash-banner-login');
  if (loginBtn2) loginBtn2.addEventListener('click', () => openAuthModal(renderApp));

  document.getElementById('act-btn-report').addEventListener('click', () => navigateToTab('report'));
  document.getElementById('act-btn-indoor').addEventListener('click', () => navigateToTab('indoor'));
  document.getElementById('act-btn-predict').addEventListener('click', () => navigateToTab('predict'));

  document.getElementById('act-btn-rebate').addEventListener('click', () => {
    if (userPoints < 100) {
      toast('Earn at least 100 Civic Points to claim your first Electricity Bill Rebate Coupon!', 'warn');
    } else {
      const code = 'ELEC-REBATE-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      toast(`🎉 Rebate Coupon Unlocked: ${code} (₹${rebateUnlocked} Value)`, 'ok');
    }
  });

  const firstReportBtn = document.getElementById('dash-btn-first-report');
  if (firstReportBtn) firstReportBtn.addEventListener('click', () => navigateToTab('report'));

  document.getElementById('dash-btn-rewards-page').addEventListener('click', () => navigateToTab('rewards'));
}
