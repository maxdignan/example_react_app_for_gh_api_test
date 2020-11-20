import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@app/shared/shared.module';
import { VisualRegressionRoutingModule } from './visual-regression-routing.module';
import { VisualRegressionComponent } from './components/visual-regression/visual-regression.component';
import { VisualRegressionService } from './services/visual-regression.service';
import { VisualRegressionHttpService } from './services/visual-regression-http.service';
import { VisualRegressionStoreModule } from './store/visual-regression-store.module';
import { VisualRegressionResultComponent } from './components/visual-regression-overview/visual-regression-result/visual-regression-result.component';
import { VisualRegressionMetadataComponent } from './components/visual-regression-overview/visual-regression-metadata/visual-regression-metadata.component';
import { VisualRegressionDetailsComponent } from './components/visual-regression-details/visual-regression-details.component';
import { VisualRegressionOverviewComponent } from './components/visual-regression-overview/visual-regression-overview.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    VisualRegressionRoutingModule,
    VisualRegressionStoreModule,
  ],
  declarations: [
    VisualRegressionComponent,
    VisualRegressionResultComponent,
    VisualRegressionMetadataComponent,
    VisualRegressionDetailsComponent,
    VisualRegressionOverviewComponent,
  ],
  providers: [VisualRegressionService, VisualRegressionHttpService],
})
export class VisualRegressionModule {}
