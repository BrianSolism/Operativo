import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { ShellLayoutComponent } from './layout/shell-layout.component';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { MfeUnavailableComponent } from './layout/mfe-unavailable.component';

const mfeFallback = [{ path: '**', component: MfeUnavailableComponent }];

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'clientes',
        loadChildren: async () => {
          try {
            const m = await loadRemoteModule({
              type: 'module',
              remoteEntry: `${window.location.origin}/mfe/clientesfront/remoteEntry.js`,
              exposedModule: './Routes',
            });
            return m.mfeRoutes;
          } catch {
            return mfeFallback;
          }
        },
      },
      {
        // Montado bajo /checklist para que la navegación interna del componente
        // (/checklist/nuevo, /checklist/editar/:id) funcione sin modificar los componentes
        path: 'checklist',
        loadChildren: async () => {
          try {
            const m = await loadRemoteModule({
              type: 'module',
              remoteEntry: `${window.location.origin}/mfe/almacenfront/remoteEntry.js`,
              exposedModule: './Routes',
            });
            return m.mfeRoutes;
          } catch {
            return mfeFallback;
          }
        },
      },
      {
        // Catálogos de almacén (bodegas, tipos, estados, etc.)
        path: 'catalogos',
        loadChildren: async () => {
          try {
            const m = await loadRemoteModule({
              type: 'module',
              remoteEntry: `${window.location.origin}/mfe/almacenfront/remoteEntry.js`,
              exposedModule: './Routes',
            });
            return m.catalogosRoutes;
          } catch {
            return mfeFallback;
          }
        },
      },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
