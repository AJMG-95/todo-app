// src/app/features/todo/services/task-storage.service.ts
import { Injectable } from '@angular/core';
import { Task, Subtask, Status } from '../../../core/models/task.model';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskStorageService {
  private readonly TASKS_KEY = 'tasks';
  private readonly SUBTASKS_KEY = 'subtasks';

  // Estados predefinidos (no se almacenan en localStorage)
  private readonly STATUSES: Status[] = [
    { id: 1, nameStatus: 'Pendiente' },
    { id: 2, nameStatus: 'En proceso' },
    { id: 3, nameStatus: 'Completada' },
    { id: 4, nameStatus: 'Cancelada' }
  ];

  // --- TASKS ---
  getTasks(filters?: {
    title?: string;
    category?: string;
    createdAt?: string; // formato ISO
    startDate?: string; // formato ISO
    statusId?: number;
  }): Observable<Task[]> {
    let tasks = this.getFromStorage<Task[]>(this.TASKS_KEY) || [];

    if (filters) {
      if (filters.title) {
        tasks = tasks.filter(t =>
          t.title.toLowerCase().includes(filters.title!.toLowerCase())
        );
      }
      if (filters.category) {
        tasks = tasks.filter(t => t.category === filters.category);
      }
      if (filters.createdAt) {
        tasks = tasks.filter(t => t.createdAt.startsWith(filters.createdAt!));
      }
      if (filters.startDate) {
        tasks = tasks.filter(t => t.startDate.startsWith(filters.startDate!));
      }
      if (typeof filters.statusId === 'number') {
        tasks = tasks.filter(t => t.statusId === filters.statusId);
      }
    }

    return of(tasks);
  }


  getTaskById(id: string): Observable<Task | undefined> {
    const tasks = this.getFromStorage<Task[]>(this.TASKS_KEY) || [];
    return of(tasks.find(task => task.id === id));
  }

  addTask(task: Task): void {
    const existingSubtasks = this.getFromStorage<Subtask[]>(this.SUBTASKS_KEY) || [];
    const allSubtasksExist = task.subtaskids.every(id =>
      existingSubtasks.some(subtask => subtask.id === id)
    );
    if (!allSubtasksExist) {
      throw new Error('Algunas subtareas no existen.');
    }

    const tasks = this.getFromStorage<Task[]>(this.TASKS_KEY) || [];
    tasks.push(task);
    this.saveToStorage(this.TASKS_KEY, tasks);
  }

  updateTask(task: Task): void {
    const existingSubtasks = this.getFromStorage<Subtask[]>(this.SUBTASKS_KEY) || [];
    const allSubtasksExist = task.subtaskids.every(id =>
      existingSubtasks.some(subtask => subtask.id === id)
    );
    if (!allSubtasksExist) {
      throw new Error('Algunas subtareas no existen.');
    }

    let tasks = this.getFromStorage<Task[]>(this.TASKS_KEY) || [];
    tasks = tasks.map(t => (t.id === task.id ? task : t));
    this.saveToStorage(this.TASKS_KEY, tasks);
  }

  deleteTask(id: string): void {
    let tasks = this.getFromStorage<Task[]>(this.TASKS_KEY) || [];
    tasks = tasks.filter(t => t.id !== id);
    this.saveToStorage(this.TASKS_KEY, tasks);

    const subtasks = this.getFromStorage<Subtask[]>(this.SUBTASKS_KEY) || [];
    const updatedSubtasks = subtasks.filter(subtask => {
      return !tasks.some(task => task.subtaskids.includes(subtask.id));
    });
    this.saveToStorage(this.SUBTASKS_KEY, updatedSubtasks);
  }

  deleteAllTasks(): void {
    localStorage.removeItem(this.TASKS_KEY);
    localStorage.removeItem(this.SUBTASKS_KEY);
  }

  deleteAllSubtasksForTask(taskId: string): void {
    const subtasks = this.getFromStorage<Subtask[]>(this.SUBTASKS_KEY) || [];
    const tasks = this.getFromStorage<Task[]>(this.TASKS_KEY) || [];

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = subtasks.filter(s => !task.subtaskids.includes(s.id));
    this.saveToStorage(this.SUBTASKS_KEY, updatedSubtasks);

    task.subtaskids = [];
    const updatedTasks = tasks.map(t => (t.id === taskId ? task : t));
    this.saveToStorage(this.TASKS_KEY, updatedTasks);
  }

  // --- SUBTASKS ---
  getSubtasks(): Observable<Subtask[]> {
    const subtasks = this.getFromStorage<Subtask[]>(this.SUBTASKS_KEY) || [];
    return of(subtasks);
  }

  getSubtaskById(id: number): Subtask | undefined {
    const subtasks = this.getFromStorage<Subtask[]>(this.SUBTASKS_KEY) || [];
    return subtasks.find(s => s.id === id);
  }

  addSubtask(subtask: Subtask, taskId: string): void {
    const subtasks = this.getFromStorage<Subtask[]>(this.SUBTASKS_KEY) || [];

    // Añadir solo si no existe ya
    const alreadyExists = subtasks.some(s => s.id === subtask.id);
    if (!alreadyExists) {
      subtasks.push(subtask);
      this.saveToStorage(this.SUBTASKS_KEY, subtasks);
    }

  }

  updateSubtask(subtask: Subtask): void {
    let subtasks = this.getFromStorage<Subtask[]>(this.SUBTASKS_KEY) || [];
    subtasks = subtasks.map(s => (s.id === subtask.id ? subtask : s));
    this.saveToStorage(this.SUBTASKS_KEY, subtasks);
  }

  deleteSubtask(id: number): void {
    let subtasks = this.getFromStorage<Subtask[]>(this.SUBTASKS_KEY) || [];
    subtasks = subtasks.filter(s => s.id !== id);
    this.saveToStorage(this.SUBTASKS_KEY, subtasks);

    const tasks = this.getFromStorage<Task[]>(this.TASKS_KEY) || [];
    tasks.forEach(task => {
      task.subtaskids = task.subtaskids.filter(sid => sid !== id);
    });
    this.saveToStorage(this.TASKS_KEY, tasks);
  }

  // --- STATUS ---
  getStatuses(): Observable<Status[]> {
    return of(this.STATUSES);
  }

  getStatusById(id: number): Observable<Status | undefined> {
    return of(this.STATUSES.find(s => s.id === id));
  }

  // --- Helpers ---
  getFromStorage<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private saveToStorage<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }
}
