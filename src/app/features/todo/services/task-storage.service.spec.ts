// Importamos el entorno de pruebas de Angular
import { TestBed } from '@angular/core/testing';

// Importamos el servicio y los modelos necesarios
import { TaskStorageService } from './task-storage.service';
import { Task, Subtask, Status } from '../../../core/models/task.model';

// Iniciamos el bloque de pruebas para TaskStorageService
describe('TaskStorageService', () => {
  let service: TaskStorageService;

  // Creamos datos de prueba reutilizables para las tareas, subtareas y estados
  const sampleTask: Task = {
    id: '1',
    title: 'Sample Task',
    description: 'Description',
    createdAt: '2025-07-18',
    estimatedEndDate: '2025-07-20',
    statusId: 1,
    startDate: '2025-07-18',
    category: 'Work',
    tags: ['angular', 'test'],
    subtaskids: [1]
  };

  const sampleSubtask: Subtask = {
    id: 1,
    text: 'Subtask 1',
    completed: false
  };

  const sampleStatus: Status = {
    id: 1,
    nameStatus: 'pendiente'
  };

  // Este bloque se ejecuta antes de cada prueba individual
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskStorageService);
    localStorage.clear(); // Limpiamos localStorage antes de cada prueba
  });

  // --- TASKS ---

  it('should add and retrieve a task', (done) => {
    // Primero debemos asegurarnos que las subtareas referenciadas existen
    localStorage.setItem('subtasks', JSON.stringify([sampleSubtask]));
    service.addTask(sampleTask); // Agregamos una tarea con la subtarea 1

    service.getTasks().subscribe(tasks => {
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Sample Task');
      done();
    });
  });

  it('should throw error if subtasks do not exist when adding task', () => {
    // Aquí no creamos ninguna subtarea en localStorage
    expect(() => service.addTask(sampleTask)).toThrowError('Some subtasks referenced in the task do not exist.');
  });

  it('should update a task and keep data consistent', (done) => {
    localStorage.setItem('subtasks', JSON.stringify([sampleSubtask]));
    service.addTask(sampleTask);

    const updatedTask = { ...sampleTask, title: 'Updated Title' };
    service.updateTask(updatedTask);

    service.getTaskById('1').subscribe(task => {
      expect(task?.title).toBe('Updated Title');
      done();
    });
  });

  it('should delete a task and keep subtasks intact', (done) => {
    localStorage.setItem('subtasks', JSON.stringify([sampleSubtask]));
    service.addTask(sampleTask);

    service.deleteTask('1');

    service.getTaskById('1').subscribe(task => {
      expect(task).toBeUndefined();
      done();
    });
  });

  it('should delete all tasks and also delete all subtasks', (done) => {
    localStorage.setItem('subtasks', JSON.stringify([sampleSubtask]));
    service.addTask(sampleTask);
    service.deleteAllTasks();

    // Verificamos que tareas y subtareas fueron borradas
    service.getTasks().subscribe(tasks => {
      expect(tasks.length).toBe(0);

      service.getSubtasks().subscribe(subtasks => {
        expect(subtasks.length).toBe(0);
        done();
      });
    });
  });

  // --- SUBTASKS ---

  it('should add a subtask and associate it to a task', (done) => {
    // Guardamos una tarea vacía primero
    localStorage.setItem('tasks', JSON.stringify([{ ...sampleTask, subtaskids: [] }]));

    // Añadimos una subtarea y asociamos automáticamente a la tarea '1'
    service.addSubtask(sampleSubtask, '1');

    service.getSubtasks().subscribe(subtasks => {
      expect(subtasks.length).toBe(1);
      expect(subtasks[0].text).toBe('Subtask 1');

      // Verificamos que también fue añadida al array de subtaskids de la tarea
      service.getTaskById('1').subscribe(task => {
        expect(task?.subtaskids.includes(1)).toBeTrue();
        done();
      });
    });
  });

  it('should delete all subtasks of a specific task', (done) => {
    localStorage.setItem('subtasks', JSON.stringify([sampleSubtask]));
    localStorage.setItem('tasks', JSON.stringify([sampleTask]));

    service.deleteAllSubtasksForTask('1');

    service.getSubtasks().subscribe(subtasks => {
      expect(subtasks.length).toBe(0);

      service.getTaskById('1').subscribe(task => {
        expect(task?.subtaskids.length).toBe(0);
        done();
      });
    });
  });

  it('should remove subtask from task when subtask is deleted', (done) => {
    localStorage.setItem('subtasks', JSON.stringify([sampleSubtask]));
    localStorage.setItem('tasks', JSON.stringify([sampleTask]));

    service.deleteSubtask(1);

    service.getSubtasks().subscribe(subtasks => {
      expect(subtasks.length).toBe(0);

      service.getTaskById('1').subscribe(task => {
        expect(task?.subtaskids.includes(1)).toBeFalse();
        done();
      });
    });
  });

  // --- STATUSES ---

  it('should retrieve a status by ID', (done) => {
    localStorage.setItem('statuses', JSON.stringify([sampleStatus]));
    service.getStatusById(1).subscribe(status => {
      expect(status?.nameStatus).toBe('pendiente');
      done();
    });
  });

  it('should retrieve all statuses', (done) => {
    localStorage.setItem('statuses', JSON.stringify([sampleStatus]));
    service.getStatuses().subscribe(statuses => {
      expect(statuses.length).toBe(1);
      expect(statuses[0].nameStatus).toBe('pendiente');
      done();
    });
  });
});
