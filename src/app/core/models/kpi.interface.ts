export interface Kpis {
  total: number;
  completed: number;
  canceled: number;
  open: number;
  openOverdue: number;
  openOnTrack: number;
  closedOnTime: number;          // solo entre las que tienen estimatedEndDate
  closedLate: number;            // solo entre las que tienen estimatedEndDate
  withEstimate: number;          // tareas con estimatedEndDate válida
  closedWithEstimate: number;    // completadas con estimatedEndDate válida
  onTimeRatePct: number;         // % closedOnTime / closedWithEstimate
  avgCycleDays: number | null;   // startDate → realEndDate
  avgLeadDays: number | null;    // createdAt → realEndDate
  avgScheduleVarianceDays: number | null; // (estimated - real): positivo = antes
}
