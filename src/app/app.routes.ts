import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './components/register/register';import { MyApplications } from './my-applications/my-applications';
import { Applications } from './my-applications/applications/applications';
import { Drafts } from './my-applications/drafts/drafts';
import { ApplicationView } from './my-applications/application-view/application-view';
import { AuthService } from './services/auth';
import { ApplicationForm } from './my-applications/application-form/application-form';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.currentUser()) {
    return router.createUrlTree(['/login']);
  }

  return true;
};

export const applicantOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return router.createUrlTree(['/my-applications/applications']);
  }

  return true;
};

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: 'my-applications',
    component: MyApplications,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'applications', pathMatch: 'full' },
      { path: 'applications', component: Applications },
      { path: 'applications/:id', component: ApplicationView },
      {
        path: 'drafts',
        component: Drafts,
        canActivate: [applicantOnlyGuard],
      },
      {
        path: 'new',
        component: ApplicationForm,
        canActivate: [applicantOnlyGuard],
      },
      {
        path: 'new/:permitCode',
        component: ApplicationForm,
        canActivate: [applicantOnlyGuard],
      },
      {
        path: 'drafts/:id/edit',
        component: ApplicationForm,
        canActivate: [applicantOnlyGuard],
      },
    ],
  },
];
