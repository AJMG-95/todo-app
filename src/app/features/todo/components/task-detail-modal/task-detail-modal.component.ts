import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskStorageService } from '../../services/task-storage.service';
import { Subtask, Task } from '../../../../core/models/task.model';

@Component({
  selector: 'task-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    CheckboxModule,
    ButtonModule
  ],
  templateUrl: './task-detail-modal.component.html',
})
export class TaskDetailModalComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() task!: Task; // 🔄 Ahora recibimos la task directamente
  subtasks: Subtask[] = [];

  constructor(private taskService: TaskStorageService) { }

  ngOnInit(): void {
    if (this.task) {
      this.loadSubtasks();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] && this.task) {
      this.loadSubtasks();
    }
  }

  loadSubtasks(): void {
    this.taskService.getSubtasks().subscribe(allSubtasks => {
      this.subtasks = allSubtasks.filter(sub => this.task.subtaskids.includes(sub.id));
    });
  }

  close(): void {
    this.visibleChange.emit(false);
  }

  toggleSubtask(subtask: Subtask): void {
    subtask.completed = !subtask.completed;
    this.taskService.updateSubtask(subtask);
  }
}
