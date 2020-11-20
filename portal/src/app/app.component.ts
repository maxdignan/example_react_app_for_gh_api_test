import { Component, OnInit, ViewContainerRef } from '@angular/core';

import { ModalService } from '@app/core/core.module';

@Component({
  selector: 'art-root',
  template: ` <router-outlet></router-outlet> `,
})
export class AppComponent implements OnInit {
  constructor(
    private vcRef: ViewContainerRef,
    private modalService: ModalService,
  ) {}

  ngOnInit() {
    this.modalService.init(this.vcRef);
  }
}
