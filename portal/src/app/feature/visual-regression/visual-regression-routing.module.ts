import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VisualRegressionOverviewComponent } from './components/visual-regression-overview/visual-regression-overview.component';
import { VisualRegressionDetailsComponent } from './components/visual-regression-details/visual-regression-details.component';
import { VisualRegressionComponent } from './components/visual-regression/visual-regression.component';

const routes: Routes = [
  {
    path: 'vr/:id',
    component: VisualRegressionComponent,
    children: [
      {
        path: '',
        component: VisualRegressionOverviewComponent,
      },
      {
        path: ':name',
        component: VisualRegressionDetailsComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VisualRegressionRoutingModule {}
