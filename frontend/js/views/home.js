import { state } from '../state.js';
import { icon } from '../icons.js';

export function renderHome(container, navigateToTab) {
  const totalReports = state.reports.length;
  const emergencies = state.reports.filter(r => r.severity === 'Emergency').length;
  const totalPoints = Object.values(state.leaderboard).reduce((s, u) => s + (u.points || 0), 0);

  container.innerHTML = `
    <section class="hero">
      <div>
        <h1>Every phone becomes<br>a <span class="hl">guard for the grid.</span></h1>
        <p class="lede">Photograph a hazard and ElectroGuard AI verifies it, sizes the repair crew, and keeps you at a safe distance with a live danger-zone overlay — while predicting the next outage before it happens.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" id="home-btn-report">${icon('camera')} Report a fault</button>
          <button class="btn" id="home-btn-indoor">${icon('plug')} Indoor issue?</button>
          <button class="btn" id="home-btn-login">${icon('user')} Citizen Login (OTP)</button>
        </div>
        <div class="stat-row">
          <div class="stat"><b>${totalReports}</b><span>Verified reports</span></div>
          <div class="stat"><b>${emergencies}</b><span>Active emergencies</span></div>
          <div class="stat"><b>${totalPoints.toLocaleString()}</b><span>Civic points awarded</span></div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="pulse-ring"></div><div class="pulse-ring r2"></div><div class="pulse-ring r3"></div>
        <div class="hero-visual-inner">
          ${icon('bolt', 'style="width:56px;height:56px;color:var(--amber)"')}
          <div class="hero-visual-tag">DANGER ZONE · 10M</div>
        </div>
      </div>
    </section>

    <div class="grid-3 feature-grid">
      <div class="card">
        <div class="corner tl"></div><div class="corner br"></div>
        <div class="feature-icon" style="background:var(--teal-soft);color:var(--teal)">${icon('ar')}</div>
        <h3>AR safety bubble</h3>
        <p>A live pulsing danger-zone ring overlays your camera so you never get too close while documenting a hazard.</p>
      </div>
      <div class="card">
        <div class="corner tl"></div><div class="corner br"></div>
        <div class="feature-icon" style="background:var(--amber-soft);color:var(--amber)">${icon('sun')}</div>
        <h3>Predictive outages</h3>
        <p>Weather and micro-fault density are correlated in real time to flag high-risk sectors before a blackout hits.</p>
      </div>
      <div class="card">
        <div class="corner tl"></div><div class="corner br"></div>
        <div class="feature-icon" style="background:var(--green-soft);color:var(--green)">${icon('plug')}</div>
        <h3>DIY or dispatch</h3>
        <p>Indoor issues are triaged instantly — a safe walkthrough for simple fixes, or an emergency shutoff and electrician match for real danger.</p>
      </div>
    </div>
  `;

  document.getElementById('home-btn-report').addEventListener('click', () => navigateToTab('report'));
  document.getElementById('home-btn-indoor').addEventListener('click', () => navigateToTab('indoor'));
  document.getElementById('home-btn-login').addEventListener('click', () => navigateToTab('login'));
}
