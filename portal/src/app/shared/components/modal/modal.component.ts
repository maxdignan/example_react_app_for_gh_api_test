import { Component, HostListener, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { ModalService } from '@app/core/services/modal.service';
import { ModalConfig, ActionStatus } from '@app/shared/models';

@Component({
  selector: 'art-modal',
  templateUrl: './modal.component.html',
  styles: [
    `
      art-progress-button + .btn {
        margin-top: -4px;
      }
    `,
  ],
})
export class ModalComponent {
  @Input()
  config: ModalConfig;

  @Input()
  form?: FormGroup;

  @Input()
  status?: ActionStatus;

  public readonly statuses = ActionStatus;

  constructor(private modalService: ModalService) {}

  @HostListener('document:keydown.escape')
  closeModal() {
    this.modalService.closeModal();
  }
}
