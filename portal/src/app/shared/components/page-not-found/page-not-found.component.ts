import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  HostBinding,
} from '@angular/core';

@Component({
  selector: 'art-page-not-found',
  template: `
    <h1>
      404
    </h1>
    <h2>
      Page not found
    </h2>
  `,
  styleUrls: ['./page-not-found.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageNotFoundComponent {
  @HostBinding('class.Page404')
  true;
}
