import { state } from '../state.js';
import { icon } from '../icons.js';
import { SECTORS, SECTOR_MAP, CITIES, getSectorCoordsForCenter } from '../config.js';
import { weatherState } from '../components/weather.js';
import { toast, haversine } from '../utils.js';

let mapInstance = null;
let currentFilter = 'All';
let mapCenter = { lat: 23.2599, lng: 77.4126, cityName: 'Bhopal Power Distribution Grid' }; // Default to Bhopal Power Distribution Grid
let isGpsActive = false;

export function renderMap(container, navigateToTab) {
  const reportsCount = state.reports.length;
  const emergenciesCount = state.reports.filter(r => r.severity === 'Emergency').length;
  const sectorCoords = getSectorCoordsForCenter(mapCenter.lat, mapCenter.lng);

  // Compute 50m proximity hazards relative to mapCenter
  const reportsWithDist = state.reports.map(r => {
    const dist = (r.coords && r.coords.lat && r.coords.lng)
      ? haversine(mapCenter.lat, mapCenter.lng, r.coords.lat, r.coords.lng)
      : Infinity;
    return { ...r, dist };
  });

  const reportsWithin50m = reportsWithDist
    .filter(r => r.dist <= 50)
    .sort((a, b) => a.dist - b.dist);

  const nearestHazard = reportsWithin50m.length > 0 ? reportsWithin50m[0] : null;

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px">
      <div>
        <h2 class="section-title" style="margin:0">Global Grid Hazard Map</h2>
        <p class="section-sub" style="margin:0">Real-time geospatial visualization of reported hazards, 50m proximity alerts, and sub-station sectors.</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" id="map-btn-gps">${icon('warn')} Detect My GPS Location</button>
        <button class="btn btn-primary" id="map-btn-report">${icon('camera')} Report New Hazard</button>
      </div>
    </div>

    <!-- 50-Meter Proximity Alert Banner -->
    ${nearestHazard ? `
      <div class="card" style="margin-bottom:18px;padding:16px;border:2px solid var(--red);background:rgba(232,73,93,0.12);box-shadow:0 0 20px rgba(232,73,93,0.25);border-radius:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="font-size:28px">🚨</div>
            <div>
              <b style="color:var(--red);font-size:16px;display:block">50-METER HAZARD PROXIMITY ALERT!</b>
              <div style="font-size:13.5px;color:var(--text);margin-top:2px">
                Warning: You are <b>${Math.round(nearestHazard.dist)} meters</b> away from a reported electrical fault (<b>${nearestHazard.equipment || 'Electrical Defect'}</b>)!
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px">
                Fault Type: <b>${nearestHazard.faultType || 'Electrical Hazard'}</b> · Severity: <span class="badge" style="background:var(--red);color:#fff">${nearestHazard.severity}</span> · Sector: ${nearestHazard.sector}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-danger" id="btn-zoom-proximity-hazard" style="font-size:13px;padding:8px 14px">
              🎯 View Hazard Pin (${Math.round(nearestHazard.dist)}m)
            </button>
          </div>
        </div>
      </div>
    ` : `
      <div class="card" style="margin-bottom:18px;padding:14px;border:1px solid var(--green);background:rgba(45,212,191,0.08);border-radius:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:24px">🛡️</span>
            <div>
              <b style="color:var(--green);font-size:14.5px;display:block">50-Meter Safety Perimeter: CLEAR</b>
              <p style="font-size:12px;color:var(--text-muted);margin:2px 0 0">No active electrical hazards detected within a 50-meter radius of your position (${mapCenter.cityName}).</p>
            </div>
          </div>
          <button class="btn btn-ghost" id="btn-simulate-50m-fault" style="font-size:12px;padding:6px 12px;color:var(--amber);border:1px dashed var(--amber)">
            ⚡ Drop Test 30m Hazard Pin
          </button>
        </div>
      </div>
    `}

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

  document.getElementById('map-btn-report')?.addEventListener('click', () => navigateToTab('report'));
  document.getElementById('map-btn-gps')?.addEventListener('click', () => triggerGpsLocation(container, navigateToTab));

  document.getElementById('btn-zoom-proximity-hazard')?.addEventListener('click', () => {
    if (nearestHazard && mapInstance) {
      mapInstance.setView([nearestHazard.coords.lat, nearestHazard.coords.lng], 18);
      toast(`Focused on 50m Proximity Hazard (${Math.round(nearestHazard.dist)}m away)!`, 'warn');
    }
  });

  document.getElementById('btn-simulate-50m-fault')?.addEventListener('click', () => {
    const simLat = mapCenter.lat + 0.00027; // ~30 meters away
    const simLng = mapCenter.lng + 0.00015;
    state.reports.unshift({
      id: 'r_sim_' + Date.now(),
      type: 'outdoor',
      category: 'Public Utility Grid',
      equipment: 'Sparking Distribution Transformer',
      faultType: 'Arc Flash & Overheat Hazard',
      severity: 'Emergency',
      manpower: '2 Linemen Dispatched',
      heavyEquipment: 'Bucket Truck',
      toolsAndParts: 'Insulated Safety Shield',
      advisory: 'DANGER: Maintain 50m minimum clearance!',
      coords: { lat: simLat, lng: simLng },
      sector: 'Sector 3',
      reporterId: state.userId || 'u_sim',
      reporterName: state.userName || 'Grid Sentinel',
      timestamp: Date.now(),
      status: 'Queued'
    });
    toast('⚡ Test electrical hazard simulated 30m from your position!', 'warn');
    renderMap(container, navigateToTab);
  });

  document.getElementById('map-city-select')?.addEventListener('change', e => {
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

  document.getElementById('map-filter-all')?.addEventListener('click', () => { currentFilter = 'All'; renderMap(container, navigateToTab); });
  document.getElementById('map-filter-emergency')?.addEventListener('click', () => { currentFilter = 'Emergency'; renderMap(container, navigateToTab); });
  document.getElementById('map-filter-high')?.addEventListener('click', () => { currentFilter = 'High'; renderMap(container, navigateToTab); });

  // Initialize Leaflet Map
  setTimeout(() => initLeafletMap(sectorCoords, reportsWithin50m), 100);
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

      // Check proximity to any report
      const nearestDist = Math.min(...state.reports.map(r => {
        return (r.coords && r.coords.lat && r.coords.lng)
          ? haversine(mapCenter.lat, mapCenter.lng, r.coords.lat, r.coords.lng)
          : Infinity;
      }));

      renderMap(container, navigateToTab);

      if (nearestDist <= 50) {
        toast(`🚨 WARNING: Electrical hazard detected within ${Math.round(nearestDist)}m of your GPS position!`, 'warn');
      } else {
        toast('Map centered on your live GPS location! 50m perimeter clear.', 'ok');
      }
    },
    err => {
      toast('GPS access denied. Showing selected power grid area.', 'warn');
    },
    { timeout: 8000 }
  );
}

function initLeafletMap(sectorCoords, reportsWithin50m) {
  const mapEl = document.getElementById('leaflet-hazard-map');
  if (!mapEl || typeof L === 'undefined') return;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  const center = [mapCenter.lat, mapCenter.lng];
  mapInstance = L.map('leaflet-hazard-map').setView(center, 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors | ElectroGuard AI',
    maxZoom: 18,
  }).addTo(mapInstance);

  // Add 50-Meter Safety Perimeter Circle around active position
  const is50mHazardPresent = reportsWithin50m && reportsWithin50m.length > 0;
  const userRingColor = is50mHazardPresent ? '#e8495d' : '#2dd4bf';

  L.circle(center, {
    color: userRingColor,
    fillColor: userRingColor,
    fillOpacity: 0.22,
    weight: 2,
    dashArray: '6, 6',
    radius: 50 // Exactly 50 meters
  }).addTo(mapInstance).bindPopup(`<b>📍 Active Center (${mapCenter.cityName})</b><br>50-Meter Hazard Safety Zone Radius`);

  // User Marker Icon
  const userMarkerIcon = L.divIcon({
    className: 'custom-leaflet-marker-user',
    html: `<div style="background:${userRingColor};width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 16px ${userRingColor}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
  L.marker(center, { icon: userMarkerIcon }).addTo(mapInstance);

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
        fillOpacity: 0.12,
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

    const dist = haversine(mapCenter.lat, mapCenter.lng, r.coords.lat, r.coords.lng);
    const isWithin50m = dist <= 50;

    const isEmergency = r.severity === 'Emergency';
    const isHigh = r.severity === 'High';
    const pinColor = isWithin50m ? '#e8495d' : isEmergency ? '#e8495d' : isHigh ? '#f5a623' : '#4ade80';

    // If within 50m, add a 50m danger circle around the hazard pin itself
    if (isWithin50m) {
      L.circle([r.coords.lat, r.coords.lng], {
        color: '#e8495d',
        fillColor: '#e8495d',
        fillOpacity: 0.35,
        weight: 2,
        radius: 50
      }).addTo(mapInstance).bindPopup(`<b>🚨 DANGER: HAZARD WITHIN 50M</b><br>${r.equipment} (${Math.round(dist)}m away)`);
    }

    const customIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background:${pinColor};width:${isWithin50m ? '22px' : '16px'};height:${isWithin50m ? '22px' : '16px'};border-radius:50%;border:2px solid #fff;box-shadow:0 0 14px ${pinColor};${isWithin50m ? 'animation:pulse 1s infinite' : ''}"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    const marker = L.marker([r.coords.lat, r.coords.lng], { icon: customIcon }).addTo(mapInstance);

    const popupHtml = `
      <div style="font-family:sans-serif;padding:4px;min-width:190px">
        <b style="font-size:14px;color:#1a1204">${r.equipment || 'Electrical Hazard'}</b>
        <div style="font-size:12px;color:#555;margin:3px 0">${r.category || 'Public Utility Grid'} · ${r.sector}</div>
        <div style="font-size:11.5px;color:#e8495d;margin:3px 0"><b>Distance:</b> ${Math.round(dist)}m from center ${isWithin50m ? '(🚨 WITHIN 50M RADIUS)' : ''}</div>
        <div style="font-size:11px;background:${pinColor};color:#fff;padding:2px 6px;border-radius:3px;display:inline-block;font-weight:bold;margin:4px 0">${r.severity} Severity</div>
        <div style="font-size:11.5px;color:#333;margin-top:6px"><b>Crew:</b> ${r.manpower || 'Assigned'}</div>
        <div style="font-size:11px;color:#777;margin-top:4px">Reporter: ${r.reporterName}</div>
      </div>
    `;

    marker.bindPopup(popupHtml);
  });
}
