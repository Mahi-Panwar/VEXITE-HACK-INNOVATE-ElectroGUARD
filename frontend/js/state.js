export const state = {
  tab: 'home',
  userId: null,
  userName: null,
  reports: [],       // shared, all reports across all citizens
  leaderboard: {},   // shared, {userId: {name, points}}
  loaded: false,
  backendUrl: null,  // when set, the app talks to self-hosted FastAPI backend
};

export function beReportToLocal(r) {
  return {
    id: r.id,
    type: r.kind,
    category: r.category,
    equipment: r.equipment,
    faultType: r.fault_type,
    severity: r.severity,
    manpower: r.manpower,
    heavyEquipment: r.heavy_equipment,
    toolsAndParts: r.tools_and_parts,
    advisory: r.advisory,
    coords: { lat: r.lat, lng: r.lng },
    sector: r.sector,
    reporterId: r.reporter_id,
    reporterName: r.reporter_name,
    timestamp: r.created_at * 1000,
    status: r.status,
  };
}

export function awardPoints(pts) {
  const cur = state.leaderboard[state.userId] || { name: state.userName, points: 0 };
  cur.name = state.userName;
  cur.points = (cur.points || 0) + pts;
  state.leaderboard[state.userId] = cur;
}
