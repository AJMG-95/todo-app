// src/app/features/todo/pages/todo-page/todo-page.component.ts

import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Status, Subtask, Task } from '../../../../core/models/task.model';
import { TaskCreateModalComponent } from '../../components/todo/task-create-modal/task-create-modal.component';

import { TaskStorageService } from '../../services/task-storage.service';
import Swal from 'sweetalert2';
import { formatDateToLocal } from '../../../../shared/utils/date-utils';
import { TaskDetailModalComponent } from '../../components/todo/task-detail-modal/task-detail-modal.component';
import { TaskFiltersComponent } from '../../components/todo/task-filters/task-filters.component';

@Component({
  selector: 'app-todo-page',
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    FormsModule,
    CardModule,
    TableModule,
    DropdownModule,
    ButtonModule,
    InputTextModule,
    TaskCreateModalComponent,
    TaskDetailModalComponent,
    TaskFiltersComponent,
  ],
  templateUrl: './todo-page.component.html',
  styleUrl: './todo-page.component.css',
})
export class TodoPageComponent implements OnInit {
  tasks: Task[] = [];
  statuses: Status[] = [];
  filteredTasks: Task[] = [];
  editingField: { [key: string]: string | null } = {};
  statusOptions: { label: string; value: number }[] = [];

  filters: {
    title?: string;
    category?: string;
    createdAt?: Date | null;
    startDate?: Date | null;
    statusId?: number;
  } = {
      title: undefined,
      category: undefined,
      createdAt: null,
      startDate: null,
      statusId: 0,
    };

  showCreateModal: boolean = false;
  selectedTask: Task | null = null;
  selectedSubtasks: Subtask[] = [];
  showDetailModal: boolean = false;

  // Buffers para edición inline de fechas (strings "YYYY-MM-DD")
  dateEditBufferStr: {
    [taskId: string]: {
      startDate?: string | null;
      estimatedEndDate?: string | null;
    };
  } = {};

  private taskBackup: { [taskId: string]: Task } = {};

  constructor(private taskService: TaskStorageService) { }

  ngOnInit(): void {
    this.loadStatuses();
    this.applyFilters();
  }

  loadStatuses(): void {
    this.taskService.getStatuses().subscribe((statuses) => {
      this.statuses = statuses;

      // Opciones para el filtro (sí incluye "Todos")
      this.statusOptions = [
        { label: 'Todos', value: 0 },
        ...statuses.map((s) => ({ label: s.nameStatus, value: s.id })),
      ];
    });
  }

  applyFilters(): void {
    this.taskService.getTasks().subscribe((tasks) => {
      this.filteredTasks = tasks.filter((task) => {
        const {
          title,
          category,
          createdAtStart,
          createdAtEnd,
          startDateStart,
          startDateEnd,
          estimatedEndDateStart,
          estimatedEndDateEnd,
          realEndDateStart,
          realEndDateEnd,
          statusId,
        } = this.filters as any;

        const matchesTitle =
          !title || task.title.toLowerCase().includes(title.toLowerCase());

        const matchesCategory =
          !category ||
          task.category.toLowerCase().includes(category.toLowerCase());

        const matchesCreatedAt =
          (!createdAtStart && !createdAtEnd) ||
          (createdAtStart &&
            createdAtEnd &&
            task.createdAt >= formatDateToLocal(createdAtStart) &&
            task.createdAt <= formatDateToLocal(createdAtEnd)) ||
          (createdAtStart &&
            task.createdAt === formatDateToLocal(createdAtStart)) ||
          (createdAtEnd && task.createdAt === formatDateToLocal(createdAtEnd));

        const matchesStartDate =
          (!startDateStart && !startDateEnd) ||
          (startDateStart &&
            startDateEnd &&
            task.startDate >= formatDateToLocal(startDateStart) &&
            task.startDate <= formatDateToLocal(startDateEnd)) ||
          (startDateStart &&
            task.startDate === formatDateToLocal(startDateStart)) ||
          (startDateEnd && task.startDate === formatDateToLocal(startDateEnd));

        const matchesEstimatedEndDate =
          (!estimatedEndDateStart && !estimatedEndDateEnd) ||
          (estimatedEndDateStart &&
            estimatedEndDateEnd &&
            task.estimatedEndDate >= formatDateToLocal(estimatedEndDateStart) &&
            task.estimatedEndDate <= formatDateToLocal(estimatedEndDateEnd)) ||
          (estimatedEndDateStart &&
            task.estimatedEndDate ===
            formatDateToLocal(estimatedEndDateStart)) ||
          (estimatedEndDateEnd &&
            task.estimatedEndDate === formatDateToLocal(estimatedEndDateEnd));

        const matchesRealEndDate =
          (!realEndDateStart && !realEndDateEnd) ||
          (realEndDateStart &&
            realEndDateEnd &&
            task.realEndDate! >= formatDateToLocal(realEndDateStart) &&
            task.realEndDate! <= formatDateToLocal(realEndDateEnd)) ||
          (realEndDateStart &&
            task.realEndDate === formatDateToLocal(realEndDateStart)) ||
          (realEndDateEnd &&
            task.realEndDate === formatDateToLocal(realEndDateEnd));

        const matchesStatus =
          !statusId || statusId === 0 || task.statusId === statusId;

        return (
          matchesTitle &&
          matchesCategory &&
          matchesCreatedAt &&
          matchesStartDate &&
          matchesEstimatedEndDate &&
          matchesRealEndDate &&
          matchesStatus
        );
      });
    });
  }

  getStatusLabel(statusId: number): string {
    const status = this.statuses.find((s) => s.id === statusId);
    return status ? status.nameStatus : 'Desconocido';
  }

  onTaskCreated(): void {
    this.showCreateModal = false;
    this.selectedTask = null;
    this.applyFilters();
  }

  onTaskUpdated(): void {
    this.showCreateModal = false;
    this.selectedTask = null;
    this.applyFilters();
  }

  deleteTask(taskId: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡Esta acción eliminará la tarea!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.taskService.deleteTask(taskId);
        this.applyFilters();
        Swal.fire('¡Eliminada!', 'La tarea ha sido eliminada.', 'success');
      }
    });
  }

  watchTask(task: Task): void {
    this.selectedTask = task;
    this.taskService.getSubtasks().subscribe((subtasks) => {
      this.selectedSubtasks = subtasks.filter((s) =>
        task.subtaskids.includes(s.id)
      );
      this.showDetailModal = true;
    });
  }

  onSubtaskToggled(subtask: Subtask): void {
    this.taskService.updateSubtask(subtask);
  }

  startEditing(taskId: string, field: keyof Task): void {
    const task = this.filteredTasks.find((t) => t.id === taskId);
    if (!task) return;

    // 🚫 Si está completada, no permitimos editar nada
    if (this.isCompleted(task)) return;

    this.editingField[`${taskId}_${field}`] = field;

    if (!this.taskBackup[taskId]) {
      this.taskBackup[taskId] = JSON.parse(JSON.stringify(task));
    }

    if (!this.dateEditBufferStr[taskId]) this.dateEditBufferStr[taskId] = {};
    if (field === 'startDate') {
      this.dateEditBufferStr[taskId].startDate = task.startDate || '';
    }
    if (field === 'estimatedEndDate') {
      this.dateEditBufferStr[taskId].estimatedEndDate = task.estimatedEndDate || '';
    }
  }

  // Handler genérico para cambios de los <input type="date">
  onDateBufferStrChange(
    taskId: string,
    field: 'startDate' | 'estimatedEndDate',
    value: string | null
  ) {
    if (!this.dateEditBufferStr[taskId]) this.dateEditBufferStr[taskId] = {};
    this.dateEditBufferStr[taskId][field] = value ?? '';
  }

  // Guarda cambios: copia desde buffer string -> modelo (string "YYYY-MM-DD")
  saveEdit(task: Task, field: keyof Task): void {
    // Aplicar buffers si edito fechas
    if (field === 'startDate') {
      task.startDate = this.dateEditBufferStr[task.id]?.startDate || '';
    }
    if (field === 'estimatedEndDate') {
      task.estimatedEndDate = this.dateEditBufferStr[task.id]?.estimatedEndDate || '';
    }

    // ✅ Validación: si ambas existen, startDate ≤ estimatedEndDate
    const start = (task.startDate || '').trim();
    const end = (task.estimatedEndDate || '').trim();
    if (start && end && end < start) {
      // Revertimos el campo editado a su backup y mostramos alerta
      const backup = this.taskBackup[task.id];
      if (backup) {
        this.restoreField(task, backup, field);
      }
      Swal.fire({
        icon: 'error',
        title: 'Fechas inválidas',
        text: 'La fecha de inicio no puede ser posterior a la fecha fin estimada.',
        confirmButtonText: 'Entendido',
      });
      return; // No guardamos ni salimos del modo edición; el usuario corrige
    }

    this.taskService.updateTask(task);
    delete this.editingField[`${task.id}_${field}`];

    const stillEditing = Object.keys(this.editingField).some((key) => key.startsWith(task.id));
    if (!stillEditing) {
      delete this.taskBackup[task.id];
      delete this.dateEditBufferStr[task.id];
    }

    this.applyFilters();
  }


  cancelEdit(taskId: string, field: keyof Task): void {
    const backup = this.taskBackup[taskId];
    const task = this.filteredTasks.find((t) => t.id === taskId);
    if (backup && task) this.restoreField(task, backup, field);

    delete this.editingField[`${taskId}_${field}`];

    const stillEditing = Object.keys(this.editingField).some((key) =>
      key.startsWith(taskId)
    );
    if (!stillEditing) {
      delete this.taskBackup[taskId];
      delete this.dateEditBufferStr[taskId];
    }
  }

  restoreField<T, K extends keyof T>(target: T, source: T, key: K): void {
    target[key] = source[key];
  }

  isEditing(taskId: string, field: keyof Task): boolean {
    return this.editingField[`${taskId}_${field}`] === field;
  }

  onStatusChange(task: Task): void {
    // 3 = Completada
    if (task.statusId === 3) {
      // si no tiene fecha real, la ponemos a hoy
      if (!task.realEndDate) {
        task.realEndDate = formatDateToLocal(new Date()); // "YYYY-MM-DD"
      }
    } else {
      // si se desmarca como completada, limpiamos la fecha real
      task.realEndDate = undefined as any;
    }

    this.taskService.updateTask(task);
    this.applyFilters();
  }

  get editableStatusOptions() {
    return this.statusOptions.filter((s) => s.value !== 0);
  }

  editTask(task: Task): void {
    this.selectedTask = { ...task };
    this.showCreateModal = true;
  }

  onCreateModalClosed(): void {
    this.showCreateModal = false;
    this.selectedTask = null;
  }

  onDetailModalClosed(): void {
    this.showDetailModal = false;
    this.selectedTask = null;
  }

  confirmDeleteAll(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡Esta acción eliminará todas las tareas y subtareas!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.taskService.deleteAllTasks();
        this.applyFilters(); // Refrescar lista
        Swal.fire(
          '¡Eliminado!',
          'Todas las tareas han sido eliminadas.',
          'success'
        );
      }
    });
  }

  getStartDateBuffer(taskId: string): string {
    const b = this.dateEditBufferStr[taskId];
    return (b && b.startDate) ? b.startDate : '';
  }

  getEstimatedEndDateBuffer(taskId: string): string {
    const b = this.dateEditBufferStr[taskId];
    return (b && b.estimatedEndDate) ? b.estimatedEndDate : '';
  }

  isCompleted(task: Task): boolean {
    return task.statusId === 3;
  }

}
