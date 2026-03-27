import { Routes } from '@angular/router';

export const mfeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'clientes',
    loadComponent: () =>
      import('./clientes/clientes.component').then(m => m.ClientesComponent),
  },
  {
    path: 'contratos',
    loadComponent: () =>
      import('./contratos/contratos.component').then(m => m.ContratosComponent),
  },
  {
    path: 'empresas',
    loadComponent: () =>
      import('./empresas/empresas.component').then(m => m.EmpresasComponent),
  },
  {
    path: 'cat/reglas-tipo-contrato',
    loadComponent: () =>
      import('./reglas-tipo-contrato/reglas-tipo-contrato.component').then(
        m => m.ReglasTipoContratoComponent,
      ),
  },
  {
    path: 'cat/:name',
    loadComponent: () =>
      import('./catalogo/catalogo.component').then(m => m.CatalogoComponent),
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./usuarios/usuarios.component').then(m => m.UsuariosComponent),
  },
];
