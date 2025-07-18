import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { Status, Task } from '../../../../core/models/task.model';
import { TaskCreateModalComponent } from '../../components/task-create-modal/task-create-modal.component';
import { TaskStorageService } from '../../services/task-storage.service';

@Component({
  selector: 'app-todo-page',
  standalone: true,
  imports: [
    FormsModule,
    CardModule,
    TableModule,
    CalendarModule,
    DropdownModule,
    ButtonModule,
    TaskCreateModalComponent
  ],
  templateUrl: './todo-page.component.html',
  styleUrl: './todo-page.component.css'
})
export class TodoPageComponent implements OnInit {

  tasks: Task[] = [];
  statuses: Status[] = [];
  filteredTasks: Task[] = [];

  // Opciones para el dropdown
  statusOptions: { label: string; value: number }[] = [];

  // Filtros
  filters: {
    title?: string;
    category?: string;
    createdAt?: Date | null;
    startDate?: Date | null;
    statusId?: number;
  } = {};


  showCreateModal: boolean = false;
  taskToEdit: Task | null = null;

  constructor(private taskService: TaskStorageService) { }

  ngOnInit(): void {
    this.loadStatuses();
    this.applyFilters();
  }

  loadStatuses(): void {
    this.taskService.getStatuses().subscribe(statuses => {
      this.statuses = statuses;
      this.statusOptions = statuses.map(s => ({ label: s.nameStatus, value: s.id }));
    });
  }

  applyFilters(): void {
    const filterParams = {
      title: this.filters.title || undefined,
      category: this.filters.category || undefined,
      createdAt: this.filters.createdAt ? this.filters.createdAt.toISOString().split('T')[0] : undefined,
      startDate: this.filters.startDate ? this.filters.startDate.toISOString().split('T')[0] : undefined,
      statusId: this.filters.statusId !== undefined ? this.filters.statusId : undefined
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
    this.taskToEdit = null;
    this.applyFilters();
  }

  editTask(task: Task): void {
    this.taskToEdit = { ...task };
    this.showCreateModal = true;
  }

  onTaskUpdated(): void {
    this.showCreateModal = false;
    this.taskToEdit = null;
    this.applyFilters();
  }

  deleteTask(taskId: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      this.taskService.deleteTask(taskId);
      this.applyFilters(); // refrescar la lista
    }
  }
}
