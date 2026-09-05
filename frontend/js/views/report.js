import { state, awardPoints } from '../state.js';
import { icon } from '../icons.js';
import { SECTORS, SECTOR_MAP } from '../config.js';
import { toast, haversine, randomCoordNearIndore, compressImage } from '../utils.js';
import { analyzeOutdoorPhoto, loadShared, saveReports, saveLeaderboard } from '../api.js';

let reportDraft = {
  file: null,
  preview: null,
  base64: null,
  mediaType: null,
  analysis: null,
  coords: null,
  sector: SECTORS[0],
  arArmed: true,
  analyzing: false,
  submitted: false
};

export function renderReport(container) {
  const d = reportDraft;
  const isFailed = d.analysis && !d.analysis.is_real_photo;
  const isVerified = d.analysis && d.analysis.is_real_photo;

  container.innerHTML = `
    <h2 class="section-title">Report a grid fault</h2>
    <p class="section-sub">Capture the hazard from a safe distance. The AR overlay marks a 10-metre keep-back boundary while ElectroGuard AI verifies the photo and works out exactly what a repair crew needs to bring.</p>
    
    <!-- Sector Identification Helper Box -->
    <div style="background:var(--bg-elevated);border:1px solid var(--border-bright);padding:12px 16px;border-radius:6px;margin-bottom:18px;display:flex;align-items:center;gap:12px;font-size:13px">
      <span style="color:var(--amber);font-size:18px">📍</span>
      <div>
        <b style="color:var(--text);display:block;margin-bottom:2px">How to identify your Grid Sector?</b>
        <span style="color:var(--text-muted)">Click <b>"Use GPS"</b> to auto-detect your location, or select your city power zone below (Sector 1 = North, Sector 2 = East, Sector 3 = Central Metro, Sector 4 = Industrial, Sector 5 = South, Sector 6 = West).</span>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div id="capture-zone" class="capture-zone ${d.preview ? 'has-image' : ''}">
          ${d.preview ? `<img src="${d.preview}" alt="Captured hazard">` : `
            <div class="capture-empty">
              ${icon('camera')}
              <b>Tap to capture or upload a photo</b>
              <span>Downed poles, sparking wires, transformers, meters</span>
            </div>`}
          
          ${d.preview && d.arArmed ? `
            <div class="ar-overlay">
              <div class="ar-corner-frame c1" style="${isFailed ? 'border-color:var(--red)' : ''}"></div>
              <div class="ar-corner-frame c2" style="${isFailed ? 'border-color:var(--red)' : ''}"></div>
              <div class="ar-corner-frame c3" style="${isFailed ? 'border-color:var(--red)' : ''}"></div>
              <div class="ar-corner-frame c4" style="${isFailed ? 'border-color:var(--red)' : ''}"></div>
              
              ${isFailed ? `
                <div class="ar-readout" style="color:var(--red);border-color:var(--red);background:rgba(232,73,93,0.15)">
                  AUTHENTICITY CHECK FAILED
                </div>
                <div class="ar-danger-label" style="background:#5d6d78;box-shadow:none">
                  ⛔ UNVERIFIED / FAKE PHOTO REJECTED
                </div>
              ` : `
                <div class="ar-readout">AR SAFETY BUBBLE · ${isVerified ? 'VERIFIED' : 'ARMED'}</div>
                <div class="ar-danger-ring"></div>
                <div class="ar-danger-label">DANGER ZONE — KEEP 10M BACK</div>
              `}
            </div>` : ''}
        </div>
        <input type="file" id="file-input" accept="image/*" capture="environment" style="display:none">
        <div class="capture-actions">
          <button class="btn" id="btn-pick">${icon('upload')} ${d.preview ? 'Replace photo' : 'Choose photo'}</button>
          ${d.preview ? `<label style="display:flex;align-items:center;gap:7px;font-size:13px;color:var(--text-muted)">
            <input type="checkbox" id="ar-toggle" ${d.arArmed ? 'checked' : ''} style="accent-color:var(--teal)"> AR overlay
          </label>` : ''}
        </div>

        <div style="margin-top:16px">
          <label class="field-label">Location Tag</label>
          <div style="display:flex;gap:8px;">
            <input type="text" id="loc-display" readonly value="${d.coords ? d.coords.lat.toFixed(5) + ', ' + d.coords.lng.toFixed(5) : 'Not tagged yet'}" style="flex:1">
            <button class="btn" id="btn-geo">${icon('warn')} Use GPS</button>
          </div>
        </div>

        <div style="margin-top:16px">
          <label class="field-label">Power Distribution Sector</label>
          <select id="sector-select">
            ${SECTORS.map(s => `<option value="${s}" ${d.sector === s ? 'selected' : ''}>${SECTOR_MAP[s] || s}</option>`).join('')}
          </select>
        </div>

        <button class="btn btn-primary" id="btn-analyze" style="margin-top:18px;width:100%" ${!d.preview || d.analyzing ? 'disabled' : ''}>
          ${d.analyzing ? `<span class="spinner"></span> Analyzing with AI vision…` : `${icon('bolt')} Run AI diagnostic`}
        </button>
      </div>

      <div class="card">
        ${d.analysis ? renderAnalysisPanel(d.analysis, d) : `
          <div class="empty-state">
            ${icon('bolt')}
            <p><b style="color:var(--text)">No diagnosis yet.</b></p>
            <p>Capture a photo and run the AI diagnostic to see authenticity checks, severity, and the exact crew &amp; tools needed.</p>
          </div>`}
      </div>
    </div>
  `;

  document.getElementById('capture-zone').addEventListener('click', () => { if (!d.preview) document.getElementById('file-input').click(); });
  document.getElementById('btn-pick').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('file-input').addEventListener('change', (e) => onReportFile(e, container));
  document.getElementById('btn-geo').addEventListener('click', () => onUseGPS(container));
  document.getElementById('sector-select').addEventListener('change', e => { d.sector = e.target.value; });
  
  const arToggle = document.getElementById('ar-toggle');
  if (arToggle) arToggle.addEventListener('change', e => { d.arArmed = e.target.checked; renderReport(container); });
  
  const analyzeBtn = document.getElementById('btn-analyze');
  if (analyzeBtn) analyzeBtn.addEventListener('click', () => runOutdoorAnalysis(container));

  const submitBtn = document.getElementById('btn-submit-report');
  if (submitBtn) submitBtn.addEventListener('click', () => submitReport(container));
}

function renderAnalysisPanel(a, d) {
  if (!a.is_real_photo) {
    return `
      <div class="badge badge-high" style="margin-bottom:12px">${icon('x')} AUTHENTICITY FAILED</div>
      <div style="background:var(--red-soft);border:1px solid var(--red);padding:14px;border-radius:6px;margin-bottom:14px">
        <b style="color:var(--red);display:block;margin-bottom:4px">⛔ Report Submission Blocked</b>
        <p style="font-size:13.5px;color:var(--text);margin:0;line-height:1.5">${a.validation_notes || 'This image could not be verified as a genuine electrical hazard photo.'}</p>
      </div>
      <p style="font-size:13px;color:var(--text-dim);margin-top:14px">Reports must be a real, live photo of actual electrical equipment. Screen captures, illustrations, non-electrical items, or AI-generated images are automatically rejected to prevent false utility crew dispatches.</p>
    `;
  }
  const sevClass = { 'Low': 'badge-low', 'Moderate': 'badge-moderate', 'High': 'badge-high', 'Emergency': 'badge-emergency' }[a.severity] || 'badge-moderate';
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <span class="badge badge-teal">${icon('check')} VERIFIED PHOTO</span>
      <span class="badge ${sevClass}">${a.severity}</span>
    </div>
    <div class="kv-row"><span class="k">Category</span><span class="v">${a.fault_category}</span></div>
    <div class="kv-row"><span class="k">Equipment</span><span class="v">${a.identified_equipment}</span></div>
    <div class="kv-row"><span class="k">Fault type</span><span class="v">${a.fault_type}</span></div>
    <div class="kv-row"><span class="k">Manpower</span><span class="v">${a.manpower}</span></div>
    <div class="kv-row"><span class="k">Heavy equipment</span><span class="v">${a.heavy_equipment}</span></div>
    <div class="kv-row"><span class="k">Tools &amp; parts</span><span class="v">${a.tools_and_parts}</span></div>
    <div class="advisory-box"><b>Safety advisory:</b> ${a.safety_advisory}</div>
    <button class="btn btn-primary" id="btn-submit-report" style="width:100%;margin-top:16px" ${d.submitted ? 'disabled' : ''}>
      ${d.submitted ? `${icon('check')} Submitted` : `${icon('star')} Submit &amp; check for duplicates`}
    </button>
  `;
}

async function onReportFile(e, container) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const { previewUrl, base64, mediaType } = await compressImage(file);
    reportDraft = { ...reportDraft, file, preview: previewUrl, base64, mediaType, analysis: null, submitted: false };
    renderReport(container);
  } catch (err) {
    toast('Could not read that image.', 'warn');
  }
}

function onUseGPS(container) {
  if (!navigator.geolocation) {
    toast('Geolocation unavailable — using approximate location.', 'warn');
    reportDraft.coords = randomCoordNearIndore();
    return renderReport(container);
  }
  toast('Requesting location…');
  navigator.geolocation.getCurrentPosition(
    pos => {
      reportDraft.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      renderReport(container);
      toast('Location tagged.', 'ok');
    },
    err => {
      reportDraft.coords = randomCoordNearIndore();
      renderReport(container);
      toast('Location permission denied — using approximate location.', 'warn');
    },
    { timeout: 6000 }
  );
}

async function runOutdoorAnalysis(container) {
  const d = reportDraft;
  if (!d.base64) return;
  d.analyzing = true;
  renderReport(container);
  try {
    d.analysis = await analyzeOutdoorPhoto(d.base64, d.mediaType);
  } catch (err) {
    toast(err.message || 'AI analysis failed — check connection and try again.', 'warn');
    d.analysis = null;
  }
  d.analyzing = false;
  renderReport(container);
}

async function submitReport(container) {
  const d = reportDraft;
  if (!d.analysis || !d.analysis.is_real_photo) return;
  if (!d.coords) { d.coords = randomCoordNearIndore(); }
  const sector = d.sector || SECTORS[Math.floor(Math.random() * SECTORS.length)];

  if (state.backendUrl) {
    try {
      const res = await fetch(state.backendUrl + '/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'outdoor',
          category: d.analysis.fault_category,
          equipment: d.analysis.identified_equipment,
          fault_type: d.analysis.fault_type,
          severity: d.analysis.severity,
          manpower: d.analysis.manpower,
          heavy_equipment: d.analysis.heavy_equipment,
          tools_and_parts: d.analysis.tools_and_parts,
          advisory: d.analysis.safety_advisory,
          lat: d.coords.lat,
          lng: d.coords.lng,
          sector,
          reporter_id: state.userId,
          reporter_name: state.userName
        })
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.detail || 'Backend rejected the report.');
      if (out.duplicate) {
        toast('A matching report already exists within 50m — merged, no duplicate points awarded.', 'warn');
      } else {
        toast('Report verified — +' + out.pointsAwarded + ' civic points awarded.', 'ok');
      }
      d.submitted = true;
      await loadShared();
      renderReport(container);
    } catch (err) {
      toast(err.message || 'Could not submit to backend.', 'warn');
    }
    return;
  }

  const dup = state.reports.find(r => haversine(r.coords.lat, r.coords.lng, d.coords.lat, d.coords.lng) <= 50 && r.category === d.analysis.fault_category);
  if (dup) {
    toast('A matching report already exists within 50m — merged, no duplicate points awarded.', 'warn');
    d.submitted = true;
    renderReport(container);
    return;
  }

  const report = {
    id: 'r_' + Date.now().toString(36),
    type: 'outdoor',
    category: d.analysis.fault_category,
    equipment: d.analysis.identified_equipment,
    faultType: d.analysis.fault_type,
    severity: d.analysis.severity,
    manpower: d.analysis.manpower,
    heavyEquipment: d.analysis.heavy_equipment,
    toolsAndParts: d.analysis.tools_and_parts,
    advisory: d.analysis.safety_advisory,
    coords: d.coords,
    sector,
    reporterId: state.userId,
    reporterName: state.userName,
    timestamp: Date.now(),
    status: 'Queued'
  };

  state.reports.unshift(report);
  awardPoints(100);
  await Promise.all([saveReports(), saveLeaderboard()]);
  d.submitted = true;
  toast('Report verified — +100 civic points awarded.', 'ok');
  renderReport(container);
}
