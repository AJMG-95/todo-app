// src/app/features/todo/todo.routes.ts
import { Routes } from '@angular/router';
import { TodoPageComponent } from './pages/todo-page/todo-page.component';
import { StatsPageComponent } from './pages/stats-page/stats-page.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';


export const TODO_ROUTES: Routes = [
  {
    path: '',
    component: TodoPageComponent
  },
  {
    path: 'stats',
    component: StatsPageComponent
  },
  {
    path: 'about',
    component: AboutPageComponent,
  },
];
