import { Routes } from '@angular/router';
import { PdvComponent } from './app/pdv/pdv.component';
import { KdsComponent } from './app/kds/kds.component';

export const APP_ROUTES: Routes = [
  {
    path: 'pdv',
    component: PdvComponent,
    data: { title: 'PDV - Ponto de Venda' }
  },
  {
    path: 'kds',
    component: KdsComponent,
    data: { title: 'KDS - Cozinha e Bar' }
  },
  {
    path: '',
    redirectTo: '/pdv',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/pdv'
  }
];