// src/app/features/todo/components/todo/task-create-modal/task-create-modal.component.ts

import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Task, Subtask } from '../../../../../core/models/task.model';
import { TaskStorageService } from '../../../services/task-storage.service';
import { ChipModule } from 'primeng/chip';
import { FloatLabelModule } from 'primeng/floatlabel';
import Swal from 'sweetalert2';
import { formatDateToLocal } from '../../../../../shared/utils/date-utils';

@Component({
  selector: 'task-create-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
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

  subtasksToDelete: number[] = [];
  deletedSubtasksBackup: Subtask[] = [];

  private initialSubtasksJson: string = '';

  constructor(
    private fb: FormBuilder,
    private taskService: TaskStorageService
  ) {
    // Construcción del FormGroup. Los campos de fecha se manejan como string | null
    // porque los <input type="date"> trabajan con cadenas "YYYY-MM-DD".
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: [''],
      startDate: [null],                              // string | null
      estimatedEndDate: [null, Validators.required],  // string
      realEndDate: [null],                            // string | null
      tags: [''],
      statusId: [1, Validators.required]
    });

    // Validador SINCRONO a nivel de formulario:
    // exige que estimatedEndDate >= startDate cuando startDate exista.
    this.taskForm.setValidators(this.#dateOrderValidator());

    // recalcula el estado de validación inicial
    this.taskForm.updateValueAndValidity({ emitEvent: false });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // 1) Cuando cambia la TAREA OBJETIVO (crear vs editar)
    if (changes['taskToEdit']) {
      if (this.taskToEdit) {
        // --- MODO EDICIÓN ---
        // Parcheamos el formulario con los valores existentes de la tarea.
        // Ojo: los campos de fecha se manejan como string | null porque usamos <input type="date">.
        this.taskForm.patchValue({
          title: this.taskToEdit.title,
          description: this.taskToEdit.description,
          category: this.taskToEdit.category,
          startDate: this.taskToEdit.startDate || null,          // string | null
          estimatedEndDate: this.taskToEdit.estimatedEndDate,    // string
          realEndDate: this.taskToEdit.realEndDate || null,      // string | null
          tags: this.taskToEdit.tags?.join(', '),
          statusId: this.taskToEdit.statusId
        });

        // Cargamos las subtareas en memoria a partir de los ids guardados en la tarea.
        this.subtasks = this.taskToEdit.subtaskids
          .map(id => this.taskService.getSubtaskById(id))
          .filter((sub): sub is Subtask => !!sub);

        // En edición mostramos la sección de subtareas.
        this.showSubtaskSection = true;
      } else {
        // --- MODO CREACIÓN ---
        // Si venimos de editar o abrimos directamente para crear, dejamos el form en estado limpio.
        this.resetCreateForm();
      }

      // 2) Siempre que cambia la tarea objetivo, reiniciamos buffers auxiliares
      this.subtasksToDelete = [];
      this.deletedSubtasksBackup = [];

      // Marcamos el formulario como "pristine" (sin cambios) y guardamos un snapshot de subtareas
      this.taskForm.markAsPristine();
      this.initialSubtasksJson = JSON.stringify(this.subtasks);

      // Recalcular validaciones del formulario (incluye el validador cruzado de fechas)
      // emitEvent:false evita disparar valueChanges innecesarios durante el ciclo de OnChanges.
      this.taskForm.updateValueAndValidity({ emitEvent: false });
    }

    // 3) Cuando se abre el modal en modo CREAR (visible=true y no hay taskToEdit),
    // forzamos un reset para evitar que se queden restos del último uso.
    if (changes['visible']?.currentValue === true && !this.taskToEdit) {
      this.resetCreateForm();
      this.taskForm.updateValueAndValidity({ emitEvent: false });
    }
  }

  // --- Validators helpers ---
  #dateOrderValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const start = group.get('startDate')?.value as string | null;
      const end = group.get('estimatedEndDate')?.value as string | null;
      const endCtrl = group.get('estimatedEndDate');

      // Si no hay start o no hay end, no validamos el orden aquí
      if (!start || !end) {
        // Limpia solo el error 'dateOrder' si estaba presente
        if (endCtrl?.errors?.['dateOrder']) {
          const { dateOrder, ...rest } = endCtrl.errors!;
          endCtrl.setErrors(Object.keys(rest).length ? rest : null);
        }
        return null;
      }

      // Compara; como son "YYYY-MM-DD", comparar fechas es seguro
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();

      if (isNaN(startTime) || isNaN(endTime)) {
        // Si algún valor no parsea, no bloqueamos por este validador
        if (endCtrl?.errors?.['dateOrder']) {
          const { dateOrder, ...rest } = endCtrl.errors!;
          endCtrl.setErrors(Object.keys(rest).length ? rest : null);
        }
        return null;
      }

      if (endTime < startTime) {
        // Marca el control de end con el error específico
        const current = endCtrl?.errors || {};
        endCtrl?.setErrors({ ...current, dateOrder: true });
        return { dateOrder: true };
      } else {
        // Limpia solo el error 'dateOrder' y preserva otros
        if (endCtrl?.errors?.['dateOrder']) {
          const { dateOrder, ...rest } = endCtrl.errors!;
          endCtrl.setErrors(Object.keys(rest).length ? rest : null);
        }
        return null;
      }
    };
  }


  onSubmit(): void {
    this.formSubmitted = true;

    if (this.taskForm.invalid) {
      Object.values(this.taskForm.controls).forEach(control => control.markAsTouched());
      return;
    }

    const formValue = this.taskForm.value as {
      title: string;
      description: string;
      category: string;
      startDate: string | null;
      estimatedEndDate: string; // requerido
      realEndDate: string | null;
      tags: string | null;
      statusId: number;
    };

    const taskId =
      this.taskToEdit?.id ??
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? (crypto as any).randomUUID()
        : uuidv4());

    const task: Task = {
      id: taskId,
      title: formValue.title,
      description: formValue.description,
      category: formValue.category,
      createdAt: this.taskToEdit?.createdAt ?? formatDateToLocal(new Date()), // "YYYY-MM-DD"
      startDate: formValue.startDate ?? '',                 // "YYYY-MM-DD" o ''
      estimatedEndDate: formValue.estimatedEndDate,         // "YYYY-MM-DD"
      realEndDate: formValue.realEndDate || undefined,      // string | undefined
      statusId: formValue.statusId,
      tags: formValue.tags ? formValue.tags.split(',').map((t: string) => t.trim()) : [],
      subtaskids: this.subtasks.map(s => s.id)
    };

    // Guardar/actualizar subtareas
    this.subtasks.forEach(sub => {
      const existing = this.taskService.getSubtaskById(sub.id);
      if (existing) {
        this.taskService.updateSubtask(sub);
      } else {
        this.taskService.addSubtask(sub, taskId);
      }
    });

    if (this.taskToEdit) {
      // Eliminar diferido de subtareas marcadas para borrar
      this.subtasksToDelete.forEach(id => this.taskService.deleteSubtask(id));
      this.subtasksToDelete = [];
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

      // Generar un ID único no repetido
      const existingIds = new Set(allExistingSubtasks.map(s => s.id).concat(this.subtasks.map(s => s.id)));
      let newId = 1;
      while (existingIds.has(newId)) newId++;

      this.subtasks.push({
        id: newId,
        text: text.trim(),
        completed: false
      });

      this.newSubtaskText = '';
      this.markDirty();
    }
  }

  removeSubtask(subtaskId: number): void {
    const removed = this.subtasks.find(s => s.id === subtaskId);
    if (removed) {
      this.deletedSubtasksBackup.push(removed);
    }
    this.subtasksToDelete.push(subtaskId);
    this.subtasks = this.subtasks.filter(s => s.id !== subtaskId);
    this.markDirty();
  }

  enableSubtasks(): void {
    if (this.taskForm.valid) {
      this.showSubtaskSection = true;
    }
  }

  handleClose(): void {
    const isEditing = this.taskToEdit !== null;

    const formIsEmpty = !isEditing && Object.entries(this.taskForm.value).every(([_, value]) => {
      return value === null || value === '' || (Array.isArray(value) && value.length === 0);
    });

    const hasUnsavedChanges = this.taskForm.dirty || this.subtasksModified();

    if (!isEditing && formIsEmpty) {
      this.forceClose();
    } else if (hasUnsavedChanges) {
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
          this.visible = true; // reabre el diálogo si el usuario cancela
        }
      });
    } else {
      this.forceClose();
    }
  }

  undoLastSubtaskRemoval(): void {
    if (this.deletedSubtasksBackup.length > 0) {
      const restored = this.deletedSubtasksBackup.pop();
      if (restored) {
        this.subtasks.push(restored);
        this.subtasksToDelete = this.subtasksToDelete.filter(id => id !== restored.id);
        this.markDirty();
      }
    }
  }

  private forceClose(): void {
    this.visibleChange.emit(false);
    // Reset visual y de estado
    this.resetCreateForm();
    // Salimos del modo edición
    this.taskToEdit = null;
  }

  private subtasksModified(): boolean {
    return JSON.stringify(this.subtasks) !== this.initialSubtasksJson;
  }

  private markDirty(): void {
    // Marca el form como sucio cuando cambian subtareas
    if (!this.taskForm.dirty) {
      this.taskForm.markAsDirty();
    }
  }

  // Centraliza el reset del formulario de creación/estado visual
  private resetCreateForm(): void {
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
    this.taskForm.markAsPristine();
    this.formSubmitted = false;

    // Reset subtareas y buffers
    this.subtasks = [];
    this.subtasksToDelete = [];
    this.deletedSubtasksBackup = [];
    this.newSubtaskText = '';
    this.initialSubtasksJson = JSON.stringify(this.subtasks);
    this.showSubtaskSection = false;
  }
}
