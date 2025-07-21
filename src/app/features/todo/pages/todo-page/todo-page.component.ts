//src\app\features\todo\pages\todo-page\todo-page.component.ts

import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Status, Subtask, Task } from '../../../../core/models/task.model';
import { TaskCreateModalComponent } from '../../components/task-create-modal/task-create-modal.component';
import { TaskDetailModalComponent } from '../../components/task-detail-modal/task-detail-modal.component';
import { TaskStorageService } from '../../services/task-storage.service';
import Swal from 'sweetalert2';
import { formatDateToLocal } from '../../../../shared/utils/date-utils';

@Component({
  selector: 'app-todo-page',
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    FormsModule,
    CardModule,
    TableModule,
    CalendarModule,
    DropdownModule,
    ButtonModule,
    InputTextModule,
    TaskCreateModalComponent,
    TaskDetailModalComponent,
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

  private taskBackup: { [taskId: string]: Task } = {};

  constructor(private taskService: TaskStorageService) {}

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
    const filterParams = {
      title: this.filters.title || undefined,
      category: this.filters.category || undefined,
      createdAt: this.filters.createdAt
        ? formatDateToLocal(this.filters.createdAt)
        : undefined,
      startDate: this.filters.startDate
        ? formatDateToLocal(this.filters.startDate)
        : undefined,
      statusId: this.filters.statusId !== 0 ? this.filters.statusId : undefined, // ← solo filtra si ≠ 0
    };

    this.taskService.getTasks(filterParams).subscribe((tasks) => {
      this.filteredTasks = tasks;
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
    this.editingField[`${taskId}_${field}`] = field;

    // Solo guardar una vez por campo, si no existe ya
    if (!this.taskBackup[taskId]) {
      const original = this.filteredTasks.find((t) => t.id === taskId);
      if (original) {
        this.taskBackup[taskId] = JSON.parse(JSON.stringify(original));
      }
    }
  }

  saveEdit(task: Task, field: keyof Task): void {
    this.taskService.updateTask(task);
    delete this.editingField[`${task.id}_${field}`];

    // Si ya no se edita ningún otro campo, borra backup
    const stillEditing = Object.keys(this.editingField).some((key) =>
      key.startsWith(task.id)
    );
    if (!stillEditing) {
      delete this.taskBackup[task.id];
    }

    this.applyFilters();
  }

  cancelEdit(taskId: string, field: keyof Task): void {
    const backup = this.taskBackup[taskId];
    const task = this.filteredTasks.find((t) => t.id === taskId);

    if (backup && task) {
      this.restoreField(task, backup, field);
    }

    delete this.editingField[`${taskId}_${field}`];

    // Limpia backup si ya no se está editando ningún campo de esa tarea
    const stillEditing = Object.keys(this.editingField).some((key) =>
      key.startsWith(taskId)
    );
    if (!stillEditing) {
      delete this.taskBackup[taskId];
    }
  }

  restoreField<T, K extends keyof T>(target: T, source: T, key: K): void {
    target[key] = source[key];
  }

  isEditing(taskId: string, field: keyof Task): boolean {
    return this.editingField[`${taskId}_${field}`] === field;
  }

  onStatusChange(task: Task): void {
    if (task.statusId === 0) {
      // Restaurar el valor anterior o simplemente salir sin guardar
      this.applyFilters(); // refresca la lista para evitar inconsistencias
      return;
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
}
