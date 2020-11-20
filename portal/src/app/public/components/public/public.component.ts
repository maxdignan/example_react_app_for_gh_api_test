import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'art-public',
  template: ` <router-outlet></router-outlet> `,
  encapsulation: ViewEncapsulation.None,
})
export class PublicComponent {}
