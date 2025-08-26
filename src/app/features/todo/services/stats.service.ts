import { Injectable } from '@angular/core';
import type { Task } from '../../../core/models/task.model';
import type { Kpis } from '../../../core/models/kpi.interface';



@Injectable({ providedIn: 'root' })
export class StatsService {
  // --------- utils de fecha (puros) ---------
  private toDate(d?: string | null): Date | null {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  private atStartOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  private cmpDate(a: Date, b: Date): number {
    const aa = this.atStartOfDay(a).getTime();
    const bb = this.atStartOfDay(b).getTime();
    return Math.sign(aa - bb);
  }
  private daysBetween(a: Date, b: Date): number {
    const MS = 1000 * 60 * 60 * 24;
    const aa = this.atStartOfDay(a).getTime();
    const bb = this.atStartOfDay(b).getTime();
    return Math.round((bb - aa) / MS);
  }
  private startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  private addMonths(d: Date, months: number): Date {
    return new Date(d.getFullYear(), d.getMonth() + months, 1);
  }
  private formatMonth(d: Date): string {
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }
  private avg(arr: number[]): number | null {
    return arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
    // redondeo a décima
  }

  // --------- KPIs principales ---------
  computeKpis(tasks: Task[], todayInput?: Date): Kpis {
    const today = this.atStartOfDay(todayInput ?? new Date());

    const isCompleted = (t: Task) => t.statusId === 3;
    const isCanceled = (t: Task) => t.statusId === 4;

    const total = tasks.length;
    const completed = tasks.filter(isCompleted).length;
    const canceled = tasks.filter(isCanceled).length;
    const open = total - completed - canceled;

    let withEstimate = 0;
    let closedWithEstimate = 0;
    let closedOnTime = 0;
    let closedLate = 0;
    let openOverdue = 0;
    let openOnTrack = 0;

    const cycleDays: number[] = [];
    const leadDays: number[] = [];
    const scheduleVarianceDays: number[] = [];

    for (const t of tasks) {
      const created = this.toDate(t.createdAt);
      const start = this.toDate(t.startDate);
      const estimated = this.toDate(t.estimatedEndDate);
      const real = this.toDate(t.realEndDate ?? null);

      const hasEstimate = !!estimated;
      if (hasEstimate) withEstimate++;

      if (isCompleted(t)) {
        if (hasEstimate && real) {
          closedWithEstimate++;
          this.cmpDate(real, estimated!) <= 0 ? closedOnTime++ : closedLate++;
          scheduleVarianceDays.push(this.daysBetween(real, estimated!)); // + si antes
        }
        if (start && real) cycleDays.push(this.daysBetween(start, real));
        if (created && real) leadDays.push(this.daysBetween(created, real));
      } else if (!isCanceled(t)) {
        if (!hasEstimate) {
          openOnTrack++;
        } else {
          this.cmpDate(estimated!, today) < 0 ? openOverdue++ : openOnTrack++;
        }
      }
    }

    const onTimeRatePct = closedWithEstimate > 0
      ? Math.round((closedOnTime / closedWithEstimate) * 100)
      : 0;

    return {
      total,
      completed,
      canceled,
      open,
      openOverdue,
      openOnTrack,
      closedOnTime,
      closedLate,
      withEstimate,
      closedWithEstimate,
      onTimeRatePct,
      avgCycleDays: this.avg(cycleDays),
      avgLeadDays: this.avg(leadDays),
      avgScheduleVarianceDays: this.avg(scheduleVarianceDays),
    };
  }

  // --------- Series para gráficas ---------
  doneByMonth(tasks: Task[], monthsBack = 6): { labels: string[]; counts: number[] } {
    const now = new Date();
    const months: Date[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) months.push(this.startOfMonth(this.addMonths(now, -i)));
    const labels = months.map(m => this.formatMonth(m));
    const counts = labels.map(() => 0);

    for (const t of tasks.filter(x => x.statusId === 3)) {
      const r = this.toDate(t.realEndDate ?? null);
      if (!r) continue;
      const key = this.formatMonth(this.startOfMonth(r));
      const idx = labels.indexOf(key);
      if (idx >= 0) counts[idx]++;
    }
    return { labels, counts };
  }

  cycleByCategory(tasks: Task[]): { labels: string[]; values: number[] } {
    const byCategory: Record<string, number[]> = {};
    for (const t of tasks.filter(x => x.statusId === 3)) {
      const s = this.toDate(t.startDate);
      const r = this.toDate(t.realEndDate ?? null);
      if (!s || !r) continue;
      const cat = t.category || 'Sin categoría';
      byCategory[cat] ??= [];
      byCategory[cat].push(this.daysBetween(s, r));
    }
    const labels = Object.keys(byCategory);
    const values = labels.map(l => this.avg(byCategory[l]) ?? 0);
    return { labels, values };
  }
}
