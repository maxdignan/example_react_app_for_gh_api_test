import {
  Component,
  ChangeDetectionStrategy,
  HostBinding,
} from '@angular/core';

@Component({
  selector: 'art-page-content',
  template: ` <ng-content></ng-content> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageContentComponent {
  @HostBinding('class')
  cls = 'w-full pt-12 pl-12 pr-12 lg:pl-0 lg:pr-0 lg:w-2/3 block m-auto';
}
