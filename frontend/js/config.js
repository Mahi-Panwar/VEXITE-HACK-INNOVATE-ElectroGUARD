export const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'dashboard', label: 'My Dashboard', icon: 'grid' },
  { id: 'map', label: 'Grid Hazard Map', icon: 'map' },
  { id: 'login', label: 'Login / Account', icon: 'user' },
  { id: 'report', label: 'Report Fault', icon: 'camera' },
  { id: 'indoor', label: 'Indoor Assistant', icon: 'plug' },
  { id: 'predict', label: 'Outage Predictor', icon: 'cloud' },
  { id: 'rewards', label: 'Leaderboard & Rewards', icon: 'star' },
  { id: 'ops', label: 'Utility Console', icon: 'grid' },
];

export const SECTORS = [
  'Sector 1',
  'Sector 2',
  'Sector 3',
  'Sector 4',
  'Sector 5',
  'Sector 6'
];

export const SECTOR_MAP = {
  'Sector 1': 'Sector 1 — North Zone (Substation A)',
  'Sector 2': 'Sector 2 — East Zone (Commercial Grid)',
  'Sector 3': 'Sector 3 — Central Metro (Core Grid)',
  'Sector 4': 'Sector 4 — Industrial Zone (High Voltage)',
  'Sector 5': 'Sector 5 — South Residential (Substation D)',
  'Sector 6': 'Sector 6 — West Suburban (Substation E)'
};

export const CITIES = [
  { name: 'My Live GPS Location', lat: null, lng: null },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai Metro', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru Tech Grid', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad Metro', lat: 17.3850, lng: 78.4867 },
  { name: 'Indore Metro', lat: 22.7196, lng: 75.8577 },
  { name: 'London Grid', lat: 51.5074, lng: -0.1278 },
  { name: 'New York Grid', lat: 40.7128, lng: -74.0060 }
];

export function getSectorCoordsForCenter(centerLat, centerLng) {
  return {
    'Sector 1': { lat: centerLat + 0.035, lng: centerLng + 0.005, label: 'North Substation A' },
    'Sector 2': { lat: centerLat + 0.015, lng: centerLng + 0.035, label: 'East Commercial Grid' },
    'Sector 3': { lat: centerLat, lng: centerLng, label: 'Central Core Grid' },
    'Sector 4': { lat: centerLat - 0.030, lng: centerLng + 0.015, label: 'Industrial High-Voltage Zone' },
    'Sector 5': { lat: centerLat - 0.040, lng: centerLng - 0.025, label: 'South Residential Grid' },
    'Sector 6': { lat: centerLat + 0.005, lng: centerLng - 0.045, label: 'West Suburban Substation' },
  };
}

export const ELECTRICIANS = [
  { name: 'Rekha Patel — Certified Electrician', rating: 4.9, eta: '22 min', price: '₹450 call-out' },
  { name: 'Vikram Singh Electricals', rating: 4.7, eta: '35 min', price: '₹400 call-out' },
  { name: 'SafeCircuit Home Services', rating: 4.6, eta: '40 min', price: '₹500 call-out' },
];

export const OUTDOOR_SYSTEM_PROMPT = `You are the diagnostic AI engine for ElectroGuard AI, a civic electrical-hazard reporting platform.
You will be shown a citizen-submitted photo of a possible electrical/grid fault (poles, transformers, wires, meters, panels).

STRICT AUTHENTICITY EVALUATION RULES:
1. Carefully inspect the photo to verify if it is a genuine, live, real-world photograph of actual electrical infrastructure equipment (utility poles, transformers, power lines, meters, panels, circuit breakers, sub-station hardware).
2. If the image is a photo of a computer/mobile screen, a digital drawing/sketch, an AI-generated image, meme, text, or does NOT contain real electrical grid equipment (e.g. pets, people, furniture, landscapes, cars), YOU MUST SET "is_real_photo": false.
3. If "is_real_photo" is false:
   - Set "validation_notes" to a direct explanation (e.g., "Photo is a screen capture of a computer monitor", "No electrical grid equipment detected in image", "Image is a non-electrical object/drawing").
   - Set "fault_category" to "Not Electrical".
   - Set "severity" to "Low".
   - Set "safety_advisory" to "No electrical hazard detected. Submission failed authenticity check."

Respond with STRICT JSON ONLY, matching exactly this shape:
{
 "is_real_photo": boolean,
 "validation_notes": string,
 "fault_category": "Public Utility Grid" | "Indoor/Residential" | "Not Electrical",
 "identified_equipment": string,
 "fault_type": string,
 "severity": "Low" | "Moderate" | "High" | "Emergency",
 "manpower": string,
 "heavy_equipment": string,
 "tools_and_parts": string,
 "safety_advisory": string
}`;

export const INDOOR_SYSTEM_PROMPT = `You are the indoor triage AI engine for ElectroGuard AI.
You will be shown a photo of a home electrical issue (breaker panel, socket, wiring, appliance).

STRICT AUTHENTICITY RULES:
1. Verify if the photo is a real home electrical issue. If it's a photo of a screen, drawing, non-electrical item, or meme, set "is_real_photo": false and explain in validation_notes.

Respond with STRICT JSON ONLY, matching exactly this shape:
{
 "is_real_photo": boolean,
 "validation_notes": string,
 "identified_issue": string,
 "risk_level": "Low" | "High",
 "reasoning": string,
 "diy_steps": [string, string, string],
 "emergency_message": string
}
Use risk_level "Low" only for clearly safe, reversible issues like a tripped breaker or a loose plug. Use "High" for anything involving scorching, burning smell, sparking, exposed live wire, or visible fire risk.
If risk_level is "Low", diy_steps must contain exactly 3 short, safe, actionable steps and emergency_message should be an empty string.
If risk_level is "High", emergency_message must be a firm one-sentence instruction to cut power at the main breaker immediately, and diy_steps can be an empty array.`;
