import { Routes } from '@angular/router';
import { OrdersListPageComponent } from './pages/orders-list-page.component';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    component: OrdersListPageComponent,
  },
];
