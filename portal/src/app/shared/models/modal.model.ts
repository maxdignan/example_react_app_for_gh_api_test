import { Type } from '@angular/core';

export interface ModalConfig {
  title?: string;
  footer?: boolean;
  size?: 'sm' | 'md' | 'lg';
  primaryButtonText?: string;
  /** Toggle visibility of the button next to the primary/ */
  hideSecondButton?: boolean;
  /** Form validation will be skipped if both exist and this is `false` */
  primaryButtonDisabled?: boolean;
  /** Callback that handles a successful form submit. */
  handleSubmit?: (form: { [key: string]: any }) => void;
}

export class Modal {
  readonly id: string;
  readonly component: () => Type<unknown>;
  readonly config: ModalConfig | null;
  readonly data?: { [key: string]: any };

  constructor(params: { [K in keyof Modal]: any }) {
    this.id = params.id;
    this.component = params.component;
    this.config = params.config;
    this.data = params.data;
  }
}

export type ModalWithoutId = Pick<Modal, Exclude<keyof Modal, 'id'>>;
