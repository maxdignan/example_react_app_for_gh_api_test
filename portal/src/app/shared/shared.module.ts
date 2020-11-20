import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { ProgressButtonComponent } from './components/progress-button/progress-button.component';
import { LoadingIndicatorComponent } from './components/loading-indicator/loading-indicator.component';
import { PageContentComponent } from './components/page-content/page-content.component';
import { ModalComponent } from './components/modal/modal.component';
import { FormFieldErrorComponent } from './components/form-field-error/form-field-error.component';
import { FormStatusErrorComponent } from './components/form-status-error/form-status-error.component';
import { InputComponent } from './components/input/input.component';
import { SelectMenuComponent } from './components/select-menu/select-menu.component';

export * from './components/loading-indicator/loading-indicator.component';
export * from './components/modal/modal.component';
export * from './components/page-content/page-content.component';
export * from './components/page-not-found/page-not-found.component';
export * from './components/progress-button/progress-button.component';
export * from './components/form-field-error/form-field-error.component';
export * from './components/form-status-error/form-status-error.component';
export * from './components/input/input.component';
export * from './components/select-menu/select-menu.component';

@NgModule({
  imports: [CommonModule, RouterModule],
  declarations: [
    PageNotFoundComponent,
    ProgressButtonComponent,
    LoadingIndicatorComponent,
    PageContentComponent,
    ModalComponent,
    FormFieldErrorComponent,
    FormStatusErrorComponent,
    InputComponent,
    SelectMenuComponent,
  ],
  exports: [
    PageNotFoundComponent,
    ProgressButtonComponent,
    LoadingIndicatorComponent,
    PageContentComponent,
    ModalComponent,
    FormFieldErrorComponent,
    FormStatusErrorComponent,
    InputComponent,
    SelectMenuComponent,
  ],
})
export class SharedModule {}
