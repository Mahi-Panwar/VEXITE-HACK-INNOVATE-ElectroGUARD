import { state } from '../state.js';
import { icon } from '../icons.js';
import { SECTORS, SECTOR_MAP, CITIES, getSectorCoordsForCenter } from '../config.js';
import { weatherState } from '../components/weather.js';
import { toast } from '../utils.js';

let mapInstance = null;
let currentFilter = 'All';
let mapCenter = { lat: 23.2599, lng: 77.4126, cityName: 'Bhopal Power Distribution Grid' }; // Default to Bhopal Power Distribution Grid
let isGpsActive = false;

export function renderMap(container, navigateToTab) {
  const reportsCount = state.reports.length;
  const emergenciesCount = state.reports.filter(r => r.severity === 'Emergency').length;
  const sectorCoords = getSectorCoordsForCenter(mapCenter.lat, mapCenter.lng);

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px">
      <div>
        <h2 class="section-title" style="margin:0">Global Grid Hazard Map</h2>
        <p class="section-sub" style="margin:0">Real-time geospatial visualization of reported hazards, sub-station sectors, and live risk perimeters worldwide.</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" id="map-btn-gps">${icon('warn')} Detect My GPS Location</button>
        <button class="btn btn-primary" id="map-btn-report">${icon('camera')} Report New Hazard</button>
      </div>
    </div>

    <!-- Filter & City Selector Bar -->
    <div class="card" style="margin-bottom:18px;padding:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span style="font-size:12.5px;color:var(--text-muted);font-weight:600">Select City / Region:</span>
          <select id="map-city-select" style="width:auto;max-width:220px;padding:6px 10px;font-size:13px">
            ${CITIES.map(c => `<option value="${c.name}" ${mapCenter.cityName === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>

          <span style="font-size:12.5px;color:var(--text-muted);font-weight:600;margin-left:10px">Pins Filter:</span>
          <button class="btn ${currentFilter === 'All' ? 'btn-primary' : 'btn-ghost'}" id="map-filter-all" style="padding:5px 12px;font-size:12.5px">All (${reportsCount})</button>
          <button class="btn ${currentFilter === 'Emergency' ? 'btn-danger' : 'btn-ghost'}" id="map-filter-emergency" style="padding:5px 12px;font-size:12.5px">Emergency (${emergenciesCount})</button>
          <button class="btn ${currentFilter === 'High' ? 'btn-primary' : 'btn-ghost'}" id="map-filter-high" style="padding:5px 12px;font-size:12.5px">High Risk</button>
        </div>

        <div style="font-size:12px;color:var(--text-muted);font-family:var(--font-mono)">
          📍 Active Center: <b>${mapCenter.cityName}</b> (${mapCenter.lat.toFixed(4)}° N, ${mapCenter.lng.toFixed(4)}° E)
        </div>
      </div>
    </div>

    <!-- Leaflet Map Canvas -->
    <div class="card" style="padding:8px">
      <div id="leaflet-hazard-map" style="height:520px;width:100%;border-radius:6px;overflow:hidden;z-index:1"></div>
    </div>

    <!-- Sector Risk Summary Grid -->
    <div style="margin-top:22px">
      <h3 style="font-family:var(--font-display);font-size:18px;margin:0 0 12px">Substation Sector Status — ${mapCenter.cityName}</h3>
      <div class="grid-3">
        ${SECTORS.map(s => {
          const coords = sectorCoords[s];
          const sectorReports = state.reports.filter(r => r.sector === s);
          const hasEmergency = sectorReports.some(r => r.severity === 'Emergency');
          const color = hasEmergency || weatherState.isStormSimulated ? 'var(--red)' : sectorReports.length ? 'var(--amber)' : 'var(--green)';
          
          return `
            <div class="card" style="border-left:4px solid ${color}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <b style="font-size:15px;display:block;margin-bottom:4px">${SECTOR_MAP[s] || s}</b>
                <span class="badge" style="background:${color}22;color:${color}">${sectorReports.length} Reports</span>
              </div>
              <p style="font-size:12px;color:var(--text-muted);margin:4px 0 0">Center: ${coords.lat.toFixed(3)}°N, ${coords.lng.toFixed(3)}°E</p>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  document.getElementById('map-btn-report').addEventListener('click', () => navigateToTab('report'));
  document.getElementById('map-btn-gps').addEventListener('click', () => triggerGpsLocation(container, navigateToTab));

  document.getElementById('map-city-select').addEventListener('change', e => {
    const selectedName = e.target.value;
    if (selectedName === 'My Live GPS Location') {
      triggerGpsLocation(container, navigateToTab);
    } else {
      const found = CITIES.find(c => c.name === selectedName);
      if (found && found.lat) {
        mapCenter = { lat: found.lat, lng: found.lng, cityName: found.name };
        renderMap(container, navigateToTab);
      }
    }
  });

  document.getElementById('map-filter-all').addEventListener('click', () => { currentFilter = 'All'; renderMap(container, navigateToTab); });
  document.getElementById('map-filter-emergency').addEventListener('click', () => { currentFilter = 'Emergency'; renderMap(container, navigateToTab); });
  document.getElementById('map-filter-high').addEventListener('click', () => { currentFilter = 'High'; renderMap(container, navigateToTab); });

  // Initialize Leaflet Map
  setTimeout(() => initLeafletMap(sectorCoords), 100);
}

function triggerGpsLocation(container, navigateToTab) {
  if (!navigator.geolocation) {
    toast('GPS Geolocation unavailable on browser.', 'warn');
    return;
  }
  toast('Detecting your live GPS location…');
  navigator.geolocation.getCurrentPosition(
    pos => {
      mapCenter = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        cityName: 'My Live GPS Area'
      };
      isGpsActive = true;
      renderMap(container, navigateToTab);
      toast('Map centered on your live GPS location!', 'ok');
    },
    err => {
      toast('GPS access denied. Showing selected power grid area.', 'warn');
    },
    { timeout: 8000 }
  );
}

function initLeafletMap(sectorCoords) {
  const mapEl = document.getElementById('leaflet-hazard-map');
  if (!mapEl || typeof L === 'undefined') return;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  const center = [mapCenter.lat, mapCenter.lng];
  mapInstance = L.map('leaflet-hazard-map').setView(center, 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors | ElectroGuard AI',
    maxZoom: 18,
  }).addTo(mapInstance);

  // Add Sector Zone Circles
  SECTORS.forEach(s => {
    const coords = sectorCoords[s];
    if (coords) {
      const sectorReports = state.reports.filter(r => r.sector === s);
      const isHighRisk = sectorReports.some(r => r.severity === 'Emergency' || r.severity === 'High') || weatherState.isStormSimulated;
      const color = isHighRisk ? '#e8495d' : '#2dd4bf';

      const circle = L.circle([coords.lat, coords.lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.15,
        radius: 2400
      }).addTo(mapInstance);

      circle.bindPopup(`<b>${SECTOR_MAP[s]}</b><br>${sectorReports.length} Active Hazard Reports logged`);
    }
  });

  // Filter reports
  const filtered = currentFilter === 'All' 
    ? state.reports 
    : state.reports.filter(r => r.severity === currentFilter);

  // Add Pins for Reports
  filtered.forEach(r => {
    if (!r.coords || !r.coords.lat || !r.coords.lng) return;

    const isEmergency = r.severity === 'Emergency';
    const isHigh = r.severity === 'High';
    const pinColor = isEmergency ? '#e8495d' : isHigh ? '#f5a623' : '#4ade80';

    const customIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background:${pinColor};width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 10px ${pinColor}"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const marker = L.marker([r.coords.lat, r.coords.lng], { icon: customIcon }).addTo(mapInstance);

    const popupHtml = `
      <div style="font-family:sans-serif;padding:4px;min-width:180px">
        <b style="font-size:14px;color:#1a1204">${r.equipment || 'Electrical Hazard'}</b>
        <div style="font-size:12px;color:#555;margin:3px 0">${r.category || 'Public Utility Grid'} · ${r.sector}</div>
        <div style="font-size:11px;background:${pinColor};color:#fff;padding:2px 6px;border-radius:3px;display:inline-block;font-weight:bold;margin:4px 0">${r.severity} Severity</div>
        <div style="font-size:11.5px;color:#333;margin-top:6px"><b>Crew:</b> ${r.manpower || 'Assigned'}</div>
        <div style="font-size:11px;color:#777;margin-top:4px">Reporter: ${r.reporterName}</div>
      </div>
    `;

    marker.bindPopup(popupHtml);
  });
}
