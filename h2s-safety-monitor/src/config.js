// Centralized safety + Supabase config — single source of truth to remove drift
// between sulfisafe and h2s-safety-monitor.
//
// OSHA H2S reference values (ppm):
//   TWA 10 ppm (8-hr), ACTION 5 ppm, STEL 15 ppm (15-min), IDLH 100 ppm.

export const H2S_THRESHOLDS = Object.freeze({
  TWA: 10,
  ACTION: 5,
  STEL: 15,
  IDLH: 100,
  UNIT: "ppm",
});

export const TABLES = Object.freeze({
  EMPLOYEES: "sulfisafe_employees",
  ALERTS: "sulfisafe_alerts",
  ISSUES: "sulfisafe_issues",
  EMERGENCIES: "sulfisafe_emergencies",
  EXPOSURE_LOGS: "h2s_exposure_logs",
});

export function getExposureLevel(ppmValue) {
  const ppm = Number(ppmValue) || 0;
  if (ppm >= H2S_THRESHOLDS.IDLH) return "IDLH";
  if (ppm >= H2S_THRESHOLDS.STEL) return "STEL_EXCEEDED";
  if (ppm >= H2S_THRESHOLDS.TWA) return "TWA_EXCEEDED";
  if (ppm >= H2S_THRESHOLDS.ACTION) return "ACTION_REQUIRED";
  return "NORMAL";
}
