import { icon } from '../icons.js';
import { ELECTRICIANS } from '../config.js';
import { toast, compressImage } from '../utils.js';
import { analyzeIndoorPhoto } from '../api.js';

let indoorDraft = {
  preview: null,
  base64: null,
  mediaType: null,
  analysis: null,
  analyzing: false
};

export function renderIndoor(container) {
  const d = indoorDraft;
  container.innerHTML = `
    <h2 class="section-title">Indoor assistant</h2>
    <p class="section-sub">Upload a photo of the issue. Low-risk problems get a safe step-by-step fix; anything dangerous triggers an emergency shutoff and matches you with a verified local electrician.</p>
    <div class="grid-2">
      <div class="card">
        <div id="indoor-zone" class="capture-zone ${d.preview ? 'has-image' : ''}" style="min-height:280px">
          ${d.preview ? `<img src="${d.preview}">` : `
            <div class="capture-empty">
              ${icon('plug')}
              <b>Tap to upload a photo</b>
              <span>Breaker panel, socket, wiring, appliance</span>
            </div>`}
        </div>
        <input type="file" id="indoor-file" accept="image/*" capture="environment" style="display:none">
        <div class="capture-actions">
          <button class="btn" id="indoor-pick">${icon('upload')} ${d.preview ? 'Replace photo' : 'Choose photo'}</button>
        </div>
        <button class="btn btn-primary" id="indoor-analyze" style="margin-top:16px;width:100%" ${!d.preview || d.analyzing ? 'disabled' : ''}>
          ${d.analyzing ? `<span class="spinner"></span> Triaging…` : `${icon('bolt')} Run triage`}
        </button>
      </div>
      <div class="card">
        ${d.analysis ? renderIndoorPanel(d.analysis) : `
          <div class="empty-state">
            ${icon('plug')}
            <p><b style="color:var(--text)">No triage yet.</b></p>
            <p>Upload a photo of the indoor issue to get a DIY guide or an electrician match.</p>
          </div>`}
      </div>
    </div>
  `;

  document.getElementById('indoor-zone').addEventListener('click', () => { if (!d.preview) document.getElementById('indoor-file').click(); });
  document.getElementById('indoor-pick').addEventListener('click', () => document.getElementById('indoor-file').click());
  document.getElementById('indoor-file').addEventListener('change', (e) => onIndoorFile(e, container));
  
  const btn = document.getElementById('indoor-analyze');
  if (btn) btn.addEventListener('click', () => runIndoorAnalysis(container));
}

function renderIndoorPanel(a) {
  if (!a.is_real_photo) {
    return `
      <div class="badge badge-high" style="margin-bottom:12px">${icon('x')} AUTHENTICITY FAILED</div>
      <p style="font-size:14px;color:var(--text-muted);line-height:1.6">${a.validation_notes}</p>
    `;
  }
  if (a.risk_level === 'High') {
    return `
      <div class="emergency-banner">
        ${icon('warn')}
        <div><b>Kill your main switch now</b><p>${a.emergency_message}</p></div>
      </div>
      <p style="font-size:13.5px;color:var(--text-muted);margin-bottom:16px">${a.identified_issue} — ${a.reasoning}</p>
      <h3 style="font-family:var(--font-display);font-size:16px;margin:0 0 4px">Verified electricians nearby</h3>
      ${ELECTRICIANS.map(e => `
        <div class="electrician-card">
          <div>
            <div class="electrician-name">${e.name}</div>
            <div class="electrician-meta">★ ${e.rating} · ETA ${e.eta} · ${e.price}</div>
          </div>
          <button class="btn btn-danger btn-dispatch" data-name="${e.name.split(' —')[0]}">Request</button>
        </div>`).join('')}
    `;
  }

  return `
    <span class="badge badge-low" style="margin-bottom:12px">${icon('check')} SAFE — DIY FIX</span>
    <p style="font-size:13.5px;color:var(--text-muted);margin:10px 0 16px">${a.identified_issue} — ${a.reasoning}</p>
    ${(a.diy_steps || []).map((s, i) => `
      <div class="diy-step"><div class="num">${i + 1}</div><p>${s}</p></div>
    `).join('')}
  `;
}

async function onIndoorFile(e, container) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const { previewUrl, base64, mediaType } = await compressImage(file);
    indoorDraft = { preview: previewUrl, base64, mediaType, analysis: null, analyzing: false };
    renderIndoor(container);
  } catch (err) {
    toast('Could not read that image.', 'warn');
  }
}

async function runIndoorAnalysis(container) {
  const d = indoorDraft;
  if (!d.base64) return;
  d.analyzing = true;
  renderIndoor(container);
  try {
    d.analysis = await analyzeIndoorPhoto(d.base64, d.mediaType);
  } catch (err) {
    toast(err.message || 'Triage failed — check connection and try again.', 'warn');
    d.analysis = null;
  }
  d.analyzing = false;
  renderIndoor(container);

  // Attach dispatch button listeners if high risk panel rendered
  container.querySelectorAll('.btn-dispatch').forEach(btn => {
    btn.addEventListener('click', () => {
      toast(`Request sent to ${btn.dataset.name}.`, 'ok');
    });
  });
}
