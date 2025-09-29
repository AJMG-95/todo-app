import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-task-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarModule, DropdownModule, InputTextModule],
  templateUrl: './task-filters.component.html',
})
export class TaskFiltersComponent {
  @Input() filters!: {
    title?: string;
    category?: string;
    createdAt?: Date | null;
    startDate?: Date | null;
    statusId?: number;
  };

  @Input() statusOptions: { label: string; value: number }[] = [];

  @Output() filtersChanged = new EventEmitter<void>();


  onChange(): void {
    this.filtersChanged.emit();
  }
}
