import { Routes } from '@angular/router';

export const mfeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./checklist/checklist-list/checklist-list.component').then(
        m => m.ChecklistListComponent,
      ),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./checklist/checklist-form/checklist-form.component').then(
        m => m.ChecklistFormComponent,
      ),
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./checklist/checklist-form/checklist-form.component').then(
        m => m.ChecklistFormComponent,
      ),
  },
];

export const catalogosRoutes: Routes = [];
