import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PrivateComponent } from './components/private/private.component';

const routes: Routes = [
  {
    path: '',
    component: PrivateComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('../feature/dashboard/dashboard.module').then(
            m => m.DashboardModule,
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import(
            '../feature/visual-regression/visual-regression.module'
          ).then(m => m.VisualRegressionModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrivateRoutingModule {}
