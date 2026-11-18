import { Routes } from '@angular/router';
import { Applications } from './applications/applications';
import { Drafts } from './drafts/drafts';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'applications',
    pathMatch: 'full',
  },
  {
    path: 'applications',
    component: Applications,
  },
  {
    path: 'drafts',
    component: Drafts,
  },
];
