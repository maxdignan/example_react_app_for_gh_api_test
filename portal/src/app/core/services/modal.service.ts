import {
  Injectable,
  ViewContainerRef,
  ComponentFactoryResolver,
  ComponentRef,
} from '@angular/core';
import {
  createFeatureSelector,
  createSelector,
  select,
  Store,
} from '@ngrx/store';
import { first, filter, delay } from 'rxjs/operators';

import { Modal, ModalWithoutId, ModalConfig } from '@app/shared/models';
import * as actions from '@app/store/modal/modal.actions';
import * as reducer from '@app/store/modal/modal.reducer';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private ref: ViewContainerRef;
  private featureSelector = createFeatureSelector<reducer.State>('modal');
  private modal = createSelector(this.featureSelector, s => s.modal);
  private id = 0;
  private componentRef: ComponentRef<unknown>;

  constructor(
    private store: Store<reducer.State>,
    private cfResolver: ComponentFactoryResolver,
  ) {}

  public init(ref: ViewContainerRef) {
    this.ref = ref;
  }

  public getModal() {
    return this.store.pipe(select(this.modal));
  }

  public showModal(modal: ModalWithoutId): Modal {
    this.getModal()
      .pipe(
        filter(m => !!m),
        first(),
        delay(0),
      )
      .subscribe(m => this.createModal(m));
    const instance = new Modal({
      ...modal,
      id: ++this.id,
    });
    this.store.dispatch(actions.showModal({ modal: instance }));
    return instance;
  }

  private createModal(modal: Modal) {
    if (!this.ref) {
      return console.warn('modal : no ref found');
    }
    // Create component and inject into view
    const factory = this.cfResolver.resolveComponentFactory(
      modal.component(),
    );
    this.componentRef = this.ref.createComponent(factory);
    const instance = this.componentRef.instance as any;
    // Define modal config defaults
    const modalConfig = modal.config || {};
    const baseConfig: ModalConfig = {
      size: 'sm',
    };
    const mergedConfig = {
      ...baseConfig,
      ...modalConfig,
    };
    // Set config and data via `@Input()`
    instance.config = mergedConfig;
    instance.data = modal.data;
  }

  public closeModal() {
    this.store.dispatch(actions.closeModal());
    this.componentRef.destroy();
  }
}
