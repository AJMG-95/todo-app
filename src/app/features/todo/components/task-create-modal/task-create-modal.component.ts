import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { Task, Subtask } from '../../../../core/models/task.model';
import { TaskStorageService } from '../../services/task-storage.service';
import { ChipModule } from 'primeng/chip';
import { FloatLabelModule } from 'primeng/floatlabel';
import Swal from 'sweetalert2';

@Component({
  selector: 'task-create-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    CalendarModule,
    ButtonModule,
    ChipModule,
    FloatLabelModule
  ],
  templateUrl: './task-create-modal.component.html',
  styleUrl: './task-create-modal.component.css'
})
export class TaskCreateModalComponent {
  @Input() visible: boolean = false;
  @Input() taskToEdit: Task | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() taskCreated = new EventEmitter<Task>();
  @Output() taskUpdated = new EventEmitter<Task>();

  taskForm: FormGroup;
  showSubtaskSection = false;
  subtasks: Subtask[] = [];
  newSubtaskText: string = '';
  formSubmitted = false;

  private initialSubtasksJson: string = '';

  constructor(
    private fb: FormBuilder,
    private taskService: TaskStorageService
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: [''],
      startDate: [null],
      estimatedEndDate: [null, Validators.required],
      realEndDate: [null],
      tags: [''],
      statusId: [1, Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['taskToEdit']) {
      if (this.taskToEdit) {
        // Modo edición
        this.taskForm.patchValue({
          title: this.taskToEdit.title,
          description: this.taskToEdit.description,
          category: this.taskToEdit.category,
          startDate: this.taskToEdit.startDate ? new Date(this.taskToEdit.startDate) : null,
          estimatedEndDate: new Date(this.taskToEdit.estimatedEndDate),
          realEndDate: this.taskToEdit.realEndDate ? new Date(this.taskToEdit.realEndDate) : null,
          tags: this.taskToEdit.tags?.join(', '),
          statusId: this.taskToEdit.statusId
        });

        this.subtasks = this.taskToEdit.subtaskids
          .map(id => this.taskService.getSubtaskById(id))
          .filter((sub): sub is Subtask => !!sub);

        this.showSubtaskSection = true;
      } else {
        // Modo crear
        this.taskForm.reset({
          title: '',
          description: '',
          category: '',
          startDate: null,
          estimatedEndDate: null,
          realEndDate: null,
          tags: '',
          statusId: 1
        });

        this.subtasks = [];
        this.formSubmitted = false;
        this.showSubtaskSection = false;
        this.newSubtaskText = '';
      }

      this.taskForm.markAsPristine();
      this.initialSubtasksJson = JSON.stringify(this.subtasks);
    }
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.taskForm.invalid) {
      Object.values(this.taskForm.controls).forEach(control => control.markAsTouched());
      return;
    }

    const formValue = this.taskForm.value;
    const taskId = this.taskToEdit?.id ?? uuidv4();

    const task: Task = {
      id: taskId,
      title: formValue.title,
      description: formValue.description,
      category: formValue.category,
      createdAt: this.taskToEdit?.createdAt ?? this.formatDate(new Date()),
      startDate: formValue.startDate ? this.formatDate(formValue.startDate) : '',
      estimatedEndDate: this.formatDate(formValue.estimatedEndDate),
      realEndDate: formValue.realEndDate ? this.formatDate(formValue.realEndDate) : undefined,
      statusId: formValue.statusId,
      tags: formValue.tags ? formValue.tags.split(',').map((t: string) => t.trim()) : [],
      subtaskids: this.subtasks.map(s => s.id)
    };

    // Guardar o actualizar subtareas
    this.subtasks.forEach(sub => {
      const existing = this.taskService.getSubtaskById(sub.id);
      if (existing) {
        this.taskService.updateSubtask(sub);
      } else {
        this.taskService.addSubtask(sub, taskId);
      }
    });

    if (this.taskToEdit) {
      this.taskService.updateTask(task);
      this.taskUpdated.emit(task);
    } else {
      this.taskService.addTask(task);
      this.taskCreated.emit(task);
    }

    this.taskForm.markAsPristine();
    this.initialSubtasksJson = JSON.stringify(this.subtasks);
    this.forceClose();
  }

  addSubtask(text: string): void {
    if (text.trim()) {
      const allExistingSubtasks = this.taskService.getFromStorage<Subtask[]>('subtasks') || [];
      const maxId = allExistingSubtasks.length > 0 ? Math.max(...allExistingSubtasks.map(s => s.id)) : 0;
      const newId = maxId + 1;

      this.subtasks.push({
        id: newId,
        text: text.trim(),
        completed: false
      });

      this.newSubtaskText = '';
    }
  }

  removeSubtask(subtaskId: number): void {
    this.subtasks = this.subtasks.filter(s => s.id !== subtaskId);
  }

  enableSubtasks(): void {
    if (this.taskForm.valid) {
      this.showSubtaskSection = true;
    }
  }

  handleClose(): void {
    const hasUnsavedChanges =
      this.taskForm.dirty || this.subtasksModified();

    if (hasUnsavedChanges) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Has realizado cambios que se perderán si cierras el formulario.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
      }).then((result) => {
        if (result.isConfirmed) {
          this.forceClose();
        } else {
          // Si se canceló desde el cierre automático del modal
          this.visible = true;
        }
      });
    } else {
      this.forceClose();
    }
  }


  private forceClose(): void {
    this.visibleChange.emit(false);
    this.taskForm.reset();
    this.subtasks = [];
    this.formSubmitted = false;
    this.showSubtaskSection = false;
    this.newSubtaskText = '';
    this.taskToEdit = null;
    this.initialSubtasksJson = '';
  }

  private subtasksModified(): boolean {
    return JSON.stringify(this.subtasks) !== this.initialSubtasksJson;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }



}
