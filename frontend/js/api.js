import { state, beReportToLocal } from './state.js';
import { toast } from './utils.js';
import { OUTDOOR_SYSTEM_PROMPT, INDOOR_SYSTEM_PROMPT } from './config.js';

export async function loadBackendUrl() {
  try {
    if (window.storage) {
      const r = await window.storage.get('backend-url', false);
      if (r && r.value) { state.backendUrl = r.value; return; }
    }
  } catch (e) {}

  if (window.location.protocol.startsWith('http')) {
    state.backendUrl = window.location.origin;
  }
}

export async function setBackendUrl(url, renderCallback) {
  state.backendUrl = url ? url.replace(/\/$/, '') : null;
  try {
    if (window.storage) {
      await window.storage.set('backend-url', state.backendUrl || '', false);
    }
  } catch (e) {}
  updateBackendChip();
  state.loaded = false;
  renderCallback();
  await loadShared();
  state.loaded = true;
  renderCallback();
}

export function updateBackendChip() {
  const dot = document.getElementById('backend-dot');
  const label = document.getElementById('backend-label');
  if (!dot) return;
  if (state.backendUrl) {
    dot.style.background = 'var(--teal)';
    dot.style.boxShadow = '0 0 8px var(--teal)';
    label.textContent = 'BACKEND: ' + state.backendUrl.replace(/^https?:\/\//, '');
  } else {
    dot.style.background = 'var(--green)';
    dot.style.boxShadow = '0 0 8px var(--green)';
    label.textContent = 'GRID LINK ACTIVE (local mode)';
  }
}

export async function loadPersonal() {
  try {
    if (window.storage) {
      const r = await window.storage.get('profile', false);
      if (r && r.value) {
        const p = JSON.parse(r.value);
        state.userId = p.userId;
        state.userName = p.userName;
      }
    }
  } catch (e) {}

  if (!state.userId) {
    state.userId = 'u_' + Math.random().toString(36).slice(2, 10);
    state.userName = 'Citizen ' + state.userId.slice(-4).toUpperCase();
    await savePersonal();
  }
}

export async function savePersonal() {
  try {
    if (window.storage) {
      await window.storage.set('profile', JSON.stringify({ userId: state.userId, userName: state.userName }), false);
    }
  } catch (e) {}
}

export async function loadShared() {
  if (state.backendUrl) {
    try {
      const [repRes, lbRes] = await Promise.all([
        fetch(state.backendUrl + '/api/reports'),
        fetch(state.backendUrl + '/api/leaderboard?limit=20'),
      ]);
      const reps = await repRes.json();
      const lb = await lbRes.json();
      state.reports = Array.isArray(reps) ? reps.map(beReportToLocal) : [];
      state.leaderboard = {};
      (Array.isArray(lb) ? lb : []).forEach(u => {
        state.leaderboard[u.id] = { name: u.name, points: u.points };
      });
    } catch (e) {
      toast('Could not reach backend at ' + state.backendUrl + ' — using local mode.', 'warn');
      state.reports = [];
      state.leaderboard = {};
    }
    return;
  }

  try {
    if (window.storage) {
      const r = await window.storage.get('reports-db', true);
      state.reports = r && r.value ? JSON.parse(r.value) : [];
    }
  } catch (e) { state.reports = []; }

  try {
    if (window.storage) {
      const l = await window.storage.get('leaderboard-db', true);
      state.leaderboard = l && l.value ? JSON.parse(l.value) : {};
    }
  } catch (e) { state.leaderboard = {}; }
}

export async function saveReports() {
  try {
    if (window.storage) {
      await window.storage.set('reports-db', JSON.stringify(state.reports), true);
    }
  } catch (e) { toast('Could not sync report to shared storage.', 'warn'); }
}

export async function saveLeaderboard() {
  try {
    if (window.storage) {
      await window.storage.set('leaderboard-db', JSON.stringify(state.leaderboard), true);
    }
  } catch (e) {}
}

/* AI vision endpoints */
async function callClaude({ system, userText, imageBase64, imageMediaType, maxTokens }) {
  const content = [];
  if (imageBase64) {
    content.push({ type: 'image', source: { type: 'base64', media_type: imageMediaType, data: imageBase64 } });
  }
  content.push({ type: 'text', text: userText });
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens || 1500,
    system: system,
    messages: [{ role: 'user', content }]
  };
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await res.json();
  const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text);
  return textBlocks.join('\n');
}

function extractJSON(raw) {
  if (!raw) throw new Error('Empty AI response');
  let cleaned = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first >= 0 && last > first) cleaned = cleaned.slice(first, last + 1);

  // Replace unescaped literal newlines in quotes
  cleaned = cleaned.replace(/"([^"\\]|\\.)*"/g, (match) => {
    return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
  });

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Attempt trailing comma cleanup
    try {
      const sanitized = cleaned.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(sanitized);
    } catch (e2) {
      throw new Error('AI returned invalid JSON: ' + e.message);
    }
  }
}

export async function analyzeOutdoorPhoto(base64, mediaType) {
  if (state.backendUrl) {
    const res = await fetch(state.backendUrl + '/api/analyze/outdoor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: base64, media_type: mediaType })
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.detail || ('Backend error ' + res.status));
    }
    return res.json();
  }

  const raw = await callClaude({
    system: OUTDOOR_SYSTEM_PROMPT,
    userText: 'Analyze this electrical hazard photo and return the JSON described in your instructions.',
    imageBase64: base64, imageMediaType: mediaType, maxTokens: 1500
  });
  return extractJSON(raw);
}

export async function analyzeIndoorPhoto(base64, mediaType) {
  if (state.backendUrl) {
    const res = await fetch(state.backendUrl + '/api/analyze/indoor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: base64, media_type: mediaType })
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.detail || ('Backend error ' + res.status));
    }
    return res.json();
  }

  const raw = await callClaude({
    system: INDOOR_SYSTEM_PROMPT,
    userText: 'Triage this indoor electrical photo and return the JSON described in your instructions.',
    imageBase64: base64, imageMediaType: mediaType, maxTokens: 1500
  });
  return extractJSON(raw);
}
