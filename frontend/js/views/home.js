import { state } from '../state.js';
import { icon } from '../icons.js';
import { openAuthModal } from '../components/modal.js';

export function renderHome(container, navigateToTab, renderApp) {
  const totalReports = state.reports.length;
  const emergencies = state.reports.filter(r => r.severity === 'Emergency').length;
  const totalPoints = Object.values(state.leaderboard).reduce((s, u) => s + (u.points || 0), 0);
  const isLogged = Boolean(state.userName);

  container.innerHTML = `
    <!-- Live Safety Ticker -->
    <div style="background:var(--bg-elevated);border:1px solid var(--border);padding:8px 16px;border-radius:6px;margin:10px 0 20px;display:flex;align-items:center;gap:12px;overflow:hidden">
      <span class="badge badge-emergency" style="flex-shrink:0">${icon('bolt')} LIVE GRID STATUS</span>
      <div style="font-size:13px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
        Sector 1-6 AI Vision Sensors Active · ${emergencies} Emergency Hazards Queued · 50m Geo-Deduplication Armed
      </div>
    </div>

    <section class="hero">
      <div>
        <h1>Every phone becomes<br>a <span class="hl">guard for the grid.</span></h1>
        <p class="lede">Photograph a hazard and ElectroGuard AI verifies it, sizes the repair crew, and keeps you at a safe distance with a live danger-zone overlay — while predicting the next outage before it happens.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" id="home-btn-report">${icon('camera')} Report a fault</button>
          <button class="btn" id="home-btn-indoor">${icon('plug')} Indoor issue?</button>
          ${!isLogged ? `<button class="btn" id="home-btn-login-popup">${icon('user')} Login / Sign Up</button>` : ''}
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

    <!-- 4-Step How It Works Section -->
    <div style="margin:30px 0 10px">
      <h2 class="section-title">How ElectroGuard AI Works</h2>
      <p class="section-sub">Zero-delay electrical hazard triage from citizen photos to utility line crew dispatch.</p>
      
      <div class="grid-4" style="margin-top:16px">
        <div class="step-card">
          <div class="step-num">1</div>
          <h4>10M AR Safety Bubble</h4>
          <p>Live camera overlay rings keep citizens at a safe distance while documenting high-voltage hazards.</p>
        </div>

        <div class="step-card">
          <div class="step-num">2</div>
          <h4>AI Vision Manifest</h4>
          <p>Gemini multimodal vision checks photo authenticity, identifies damaged parts, and sizes crew &amp; equipment.</p>
        </div>

        <div class="step-card">
          <div class="step-num">3</div>
          <h4>50M Geo-Deduplication</h4>
          <p>Prevents duplicate report dispatches using spatial Haversine checks and awards 100 Civic Points.</p>
        </div>

        <div class="step-card">
          <div class="step-num">4</div>
          <h4>Smart Outage Engine</h4>
          <p>Correlates weather intensity with micro-fault density to predict blackouts before grid failure occurs.</p>
        </div>
      </div>
    </div>

    <!-- Feature Grid Showcase -->
    <div class="grid-3 feature-grid" style="margin-top:24px">
      <div class="card" id="card-feature-ar" style="cursor:pointer">
        <div class="corner tl"></div><div class="corner br"></div>
        <div class="feature-icon" style="background:var(--teal-soft);color:var(--teal)">${icon('ar')}</div>
        <h3>AR safety bubble</h3>
        <p>A live pulsing danger-zone ring overlays your camera so you never get too close while documenting a hazard.</p>
      </div>
      <div class="card" id="card-feature-predict" style="cursor:pointer">
        <div class="corner tl"></div><div class="corner br"></div>
        <div class="feature-icon" style="background:var(--amber-soft);color:var(--amber)">${icon('sun')}</div>
        <h3>Predictive outages</h3>
        <p>Weather and micro-fault density are correlated in real time to flag high-risk sectors before a blackout hits.</p>
      </div>
      <div class="card" id="card-feature-indoor" style="cursor:pointer">
        <div class="corner tl"></div><div class="corner br"></div>
        <div class="feature-icon" style="background:var(--green-soft);color:var(--green)">${icon('plug')}</div>
        <h3>DIY or dispatch</h3>
        <p>Indoor issues are triaged instantly — a safe walkthrough for simple fixes, or an emergency shutoff and electrician match for real danger.</p>
      </div>
    </div>
  `;

  document.getElementById('home-btn-report').addEventListener('click', () => navigateToTab('report'));
  document.getElementById('home-btn-indoor').addEventListener('click', () => navigateToTab('indoor'));

  const loginPopupBtn = document.getElementById('home-btn-login-popup');
  if (loginPopupBtn) loginPopupBtn.addEventListener('click', () => openAuthModal(renderApp));

  document.getElementById('card-feature-ar').addEventListener('click', () => navigateToTab('report'));
  document.getElementById('card-feature-predict').addEventListener('click', () => navigateToTab('predict'));
  document.getElementById('card-feature-indoor').addEventListener('click', () => navigateToTab('indoor'));
}
