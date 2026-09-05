export const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'login', label: 'Login / OTP', icon: 'user' },
  { id: 'report', label: 'Report Fault', icon: 'camera' },
  { id: 'indoor', label: 'Indoor Assistant', icon: 'plug' },
  { id: 'predict', label: 'Outage Predictor', icon: 'cloud' },
  { id: 'rewards', label: 'Reports & Rewards', icon: 'star' },
  { id: 'ops', label: 'Utility Dashboard', icon: 'grid' },
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

export const ELECTRICIANS = [
  { name: 'Rekha Patel — Certified Electrician', rating: 4.9, eta: '22 min', price: '₹450 call-out' },
  { name: 'Vikram Singh Electricals', rating: 4.7, eta: '35 min', price: '₹400 call-out' },
  { name: 'SafeCircuit Home Services', rating: 4.6, eta: '40 min', price: '₹500 call-out' },
];

export const OUTDOOR_SYSTEM_PROMPT = `You are the diagnostic AI engine for ElectroGuard AI, a civic electrical-hazard reporting platform.
You will be shown a citizen-submitted photo of a possible electrical/grid fault (poles, transformers, wires, meters, panels).
Respond with STRICT JSON ONLY, no markdown fences, no prose outside the JSON, matching exactly this shape:
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
}
Be technical, concise, and safety-first. If the image is not a genuine photo of real electrical equipment, set is_real_photo to false, explain briefly in validation_notes, and still fill the other fields with your best-effort assessment or "N/A".`;

export const INDOOR_SYSTEM_PROMPT = `You are the indoor triage AI engine for ElectroGuard AI.
You will be shown a photo of a home electrical issue (breaker panel, socket, wiring, appliance).
Respond with STRICT JSON ONLY, no markdown fences, matching exactly this shape:
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
