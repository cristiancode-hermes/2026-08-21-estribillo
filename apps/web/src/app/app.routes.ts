import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';

/**
 * Auth routes MUST be declared BEFORE the shell (`path: ''`) whose children
 * end with `path: '**'`. Otherwise the shell wildcard swallows /login and
 * /registro and the SPA shows NotFound (hold → /login?returnUrl=… also 404).
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login.page').then((m) => m.LoginPageComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/register.page').then((m) => m.RegisterPageComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home.page').then((m) => m.HomePageComponent),
      },
      {
        path: 'cabinas',
        loadComponent: () =>
          import('./pages/rooms-catalogue.page').then((m) => m.RoomsCataloguePageComponent),
      },
      {
        path: 'cabinas/:id',
        loadComponent: () =>
          import('./pages/room-detail.page').then((m) => m.RoomDetailPageComponent),
      },
      {
        path: 'cabinas/:id/resena',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/review-form.page').then((m) => m.ReviewFormPageComponent),
      },
      {
        path: 'checkout/:slotId',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/checkout.page').then((m) => m.CheckoutPageComponent),
      },
      {
        path: 'reservas/:id/confirmacion',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/confirmation.page').then((m) => m.ConfirmationPageComponent),
      },
      {
        path: 'mis-noches',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/my-bookings.page').then((m) => m.MyBookingsPageComponent),
      },
      {
        path: 'mis-noches/:id',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/booking-detail.page').then((m) => m.BookingDetailPageComponent),
      },
      {
        path: 'canciones',
        loadComponent: () =>
          import('./pages/songs-catalogue.page').then((m) => m.SongsCataloguePageComponent),
      },
      {
        path: 'cuenta',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/account.page').then((m) => m.AccountPageComponent),
      },
      {
        path: 'staff',
        canActivate: [authGuard, roleGuard(['staff', 'admin'])],
        loadComponent: () =>
          import('./pages/staff-dashboard.page').then((m) => m.StaffDashboardPageComponent),
      },
      {
        path: 'staff/cabinas',
        canActivate: [authGuard, roleGuard(['staff', 'admin'])],
        loadComponent: () =>
          import('./pages/room-admin.page').then((m) => m.RoomAdminPageComponent),
      },
      {
        path: 'staff/franjas',
        canActivate: [authGuard, roleGuard(['staff', 'admin'])],
        loadComponent: () =>
          import('./pages/slot-admin.page').then((m) => m.SlotAdminPageComponent),
      },
      {
        path: '**',
        loadComponent: () =>
          import('./pages/not-found.page').then((m) => m.NotFoundPageComponent),
      },
    ],
  },
];
