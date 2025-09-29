import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'todo',
    loadChildren: () => import('./features/todo/todo.routes').then(m => m.TODO_ROUTES)
  },
  {
    path: '',
    redirectTo: 'todo',
    pathMatch: 'full'
  }
];
