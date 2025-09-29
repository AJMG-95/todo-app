import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

import { TaskStorageService } from '../../services/task-storage.service';
import { StatsService } from '../../services/stats.service';
import type { Task, Status } from '../../../../core/models/task.model';
import type { Kpis } from '../../../../core/models/kpi.interface';

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [CommonModule, ChartModule, CardModule, DividerModule],
  templateUrl: './stats-page.component.html',
  styleUrls: ['./stats-page.component.css'],
})
export class StatsPageComponent implements OnInit {
  tasks: Task[] = [];
  statuses: Status[] = [];
  statusMap: Record<number, Status['nameStatus']> = {};

  kpis: Kpis = {
    total: 0, completed: 0, canceled: 0, open: 0,
    openOverdue: 0, openOnTrack: 0, closedOnTime: 0, closedLate: 0,
    withEstimate: 0, closedWithEstimate: 0, onTimeRatePct: 0,
    avgCycleDays: null, avgLeadDays: null, avgScheduleVarianceDays: null,
  };

  // chart data/options
  pieData: any; pieOptions: any;
  doneByMonthData: any; doneByMonthOptions: any;
  cycleByCategoryData: any; cycleByCategoryOptions: any;

  constructor(
    private taskService: TaskStorageService,
    private statsService: StatsService
  ) { }

  ngOnInit(): void {
    this.loadStatuses();
    this.loadTasks();
  }

  private loadStatuses(): void {
    this.taskService.getStatuses().subscribe((statuses) => {
      this.statuses = statuses ?? [];
      this.statusMap = (this.statuses).reduce((acc, s) => {
        acc[s.id] = s.nameStatus;
        return acc;
      }, {} as Record<number, Status['nameStatus']>);
    });
  }

  private loadTasks(): void {
    this.taskService.getTasks().subscribe((tasks) => {
      this.tasks = tasks ?? [];
      // calcular KPIs y gráficas en el mismo tick de la carga
      this.kpis = this.statsService.computeKpis(this.tasks);
      this.buildCharts(this.tasks, this.kpis);
    });
  }

  // --------- construir gráficas (vista) ---------
  private buildCharts(tasks: Task[], k: Kpis) {
    const css = getComputedStyle(document.documentElement);
    const textColor = css.getPropertyValue('--p-text-color') || '#495057';
    const gridColor = css.getPropertyValue('--p-content-border-color') || '#e5e7eb';
    const cGreen = css.getPropertyValue('--p-green-500') || '#22c55e';
    const cRed = css.getPropertyValue('--p-red-500') || '#ef4444';
    const cYellow = css.getPropertyValue('--p-yellow-500') || '#eab308';
    const cBlue = css.getPropertyValue('--p-blue-500') || '#3b82f6';
    const cGray = css.getPropertyValue('--p-surface-500') || '#9ca3af';

    // Pie puntualidad/estado
    this.pieData = {
      labels: ['Completadas a tiempo', 'Completadas con retraso', 'Abiertas en plazo', 'Abiertas vencidas', 'Canceladas'],
      datasets: [{
        data: [k.closedOnTime, k.closedLate, k.openOnTrack, k.openOverdue, k.canceled],
        backgroundColor: [cGreen, cRed, cBlue, cYellow, cGray],
      }],
    };
    this.pieOptions = {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: textColor } } },
    };

    // Barras: completadas por mes (últimos 6)
    const { labels, counts } = this.statsService.doneByMonth(tasks, 6);
    this.doneByMonthData = { labels, datasets: [{ label: 'Completadas', data: counts }] };
    this.doneByMonthOptions = {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, precision: 0, stepSize: 1 }, grid: { color: gridColor }, beginAtZero: true },
      },
      plugins: { legend: { labels: { color: textColor } } },
    };

    // Barras: ciclo medio por categoría
    const cyc = this.statsService.cycleByCategory(tasks);
    this.cycleByCategoryData = { labels: cyc.labels, datasets: [{ label: 'Ciclo medio (días)', data: cyc.values }] };
    this.cycleByCategoryOptions = {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: textColor, autoSkip: false }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true },
      },
      plugins: { legend: { labels: { color: textColor } } },
    };
  }
}
