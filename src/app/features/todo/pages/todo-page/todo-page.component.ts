import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { Status, Subtask, Task } from '../../../../core/models/task.model';
import { TaskCreateModalComponent } from '../../components/task-create-modal/task-create-modal.component';
import { TaskStorageService } from '../../services/task-storage.service';
import { TaskDetailModalComponent } from '../../components/task-detail-modal/task-detail-modal.component';
import { NgClass, NgIf } from '@angular/common';

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
    TaskDetailModalComponent
  ],
  templateUrl: './todo-page.component.html',
  styleUrl: './todo-page.component.css'
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
      statusId: 0
  };

  showCreateModal: boolean = false;
  selectedTask: Task | null = null;
  selectedSubtasks: Subtask[] = [];
  showDetailModal: boolean = false;

  constructor(private taskService: TaskStorageService) { }

  ngOnInit(): void {
    this.loadStatuses();
    this.applyFilters();
  }

  loadStatuses(): void {
    this.taskService.getStatuses().subscribe(statuses => {
      this.statuses = statuses;

      // Opciones para el filtro (sí incluye "Todos")
      this.statusOptions = [
        { label: 'Todos', value: 0 },
        ...statuses.map(s => ({ label: s.nameStatus, value: s.id }))
      ];
    });
  }



  applyFilters(): void {
    const filterParams = {
      title: this.filters.title || undefined,
      category: this.filters.category || undefined,
      createdAt: this.filters.createdAt
        ? this.filters.createdAt.toISOString().split('T')[0]
        : undefined,
      startDate: this.filters.startDate
        ? this.filters.startDate.toISOString().split('T')[0]
        : undefined,
      statusId: this.filters.statusId !== 0 ? this.filters.statusId : undefined // ← solo filtra si ≠ 0
    };

    this.taskService.getTasks(filterParams).subscribe(tasks => {
      this.filteredTasks = tasks;
    });
  }


  getStatusLabel(statusId: number): string {
    const status = this.statuses.find(s => s.id === statusId);
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
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      this.taskService.deleteTask(taskId);
      this.applyFilters();
    }
  }

  watchTask(task: Task): void {
    this.selectedTask = task;
    this.taskService.getSubtasks().subscribe(subtasks => {
      this.selectedSubtasks = subtasks.filter(s => task.subtaskids.includes(s.id));
      this.showDetailModal = true;
    });
  }

  onSubtaskToggled(subtask: Subtask): void {
    this.taskService.updateSubtask(subtask);
  }

  startEditing(taskId: string, field: keyof Task): void {
    this.editingField[`${taskId}_${field}`] = field;
  }

  saveEdit(task: Task, field: keyof Task): void {
    this.taskService.updateTask(task);
    delete this.editingField[`${task.id}_${field}`];
    this.applyFilters();
  }


  cancelEdit(taskId: string, field: keyof Task): void {
    delete this.editingField[`${taskId}_${field}`];
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
    return this.statusOptions.filter(s => s.value !== 0);
  }



}
