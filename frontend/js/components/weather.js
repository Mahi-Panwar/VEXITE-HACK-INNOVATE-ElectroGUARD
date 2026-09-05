import { icon } from '../icons.js';
import { toast } from '../utils.js';

export const weatherState = {
  windSpeed: 42,
  rainfall: 18,
  humidity: 82,
  activeAlert: 'Severe Thunderstorm Warning — Sector 4',
  isStormSimulated: false
};

export function renderWeatherTicker() {
  const container = document.getElementById('live-weather-ticker');
  if (!container) return;

  const w = weatherState;

  container.innerHTML = `
    <div style="background:var(--bg-elevated);border:1px solid ${w.isStormSimulated ? 'var(--red)' : 'var(--border)'};padding:8px 16px;border-radius:6px;margin:10px 0 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;transition:border-color .3s">
      <div style="display:flex;align-items:center;gap:12px;overflow:hidden">
        <span class="badge ${w.isStormSimulated ? 'badge-emergency' : 'badge-teal'}" style="flex-shrink:0">
          ${icon('cloud')} ${w.isStormSimulated ? 'STORM ALERT' : 'WEATHER LIVE'}
        </span>
        <div style="font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--font-mono)">
          Wind: <b>${w.windSpeed} km/h</b> · Rain: <b>${w.rainfall} mm/hr</b> · Humidity: <b>${w.humidity}%</b> · <span style="color:${w.isStormSimulated ? 'var(--red)' : 'var(--amber)'}">${w.activeAlert}</span>
        </div>
      </div>

      <button class="btn ${w.isStormSimulated ? 'btn-danger' : 'btn-ghost'}" id="btn-toggle-storm" style="padding:4px 10px;font-size:12px;border-color:var(--border-bright)">
        ${w.isStormSimulated ? `${icon('bolt')} Normal Weather` : `${icon('cloud')} Simulate Storm`}
      </button>
    </div>
  `;

  document.getElementById('btn-toggle-storm').addEventListener('click', () => {
    w.isStormSimulated = !w.isStormSimulated;
    if (w.isStormSimulated) {
      w.windSpeed = 98;
      w.rainfall = 38;
      w.activeAlert = 'EMERGENCY: High Wind Gale & Heavy Storm in Sector 4 & 1!';
      toast('🌩️ Severe Storm Event Simulated! Outage Risk elevated to 92%.', 'warn');
    } else {
      w.windSpeed = 42;
      w.rainfall = 18;
      w.activeAlert = 'Severe Thunderstorm Warning — Sector 4';
      toast('☀️ Weather returned to baseline parameters.', 'ok');
    }
    renderWeatherTicker();
  });
}
