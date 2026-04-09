import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { UsersListPageComponent } from './pages/users-list-page.component';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    component: UsersListPageComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
  },
];
