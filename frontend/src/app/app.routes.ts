import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/tasks',
    pathMatch: 'full',
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import(
        './features/task-management/pages/task-list/task-list.component'
      ).then((m) => m.TaskListComponent),
  },
  {
    path: '**',
    redirectTo: '/tasks',
  },
];
