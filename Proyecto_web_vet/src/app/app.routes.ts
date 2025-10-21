import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/product-list/product-list')
        .then(m => m.ProductListComponent)
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart')
        .then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout/checkout')
        .then(m => m.CheckoutComponent)
  },
  { path: '**', redirectTo: '' }
];
