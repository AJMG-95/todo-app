export interface Subtask {
  id: number;
  text: string;
  completed: boolean;
}

export interface Status {
  id: number;
  nameStatus: 'Pendiente' | 'En proceso' | 'Completada' | 'Cancelada';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: string; // ISO string (e.g. "2025-07-18T16:10:00.000Z")
  startDate: string; // ISO string (e.g. "2025-07-18T16:10:00.000Z")
  estimatedEndDate: string; // ISO string (e.g. "2025-07-18T16:10:00.000Z")
  realEndDate?: string; // ISO string (e.g. "2025-07-18T16:10:00.000Z")
  category: string;
  statusId: number;
  tags: string[];
  subtaskids: number[];
}
