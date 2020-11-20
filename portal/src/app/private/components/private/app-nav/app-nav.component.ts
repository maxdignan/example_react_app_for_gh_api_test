import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { User, App } from '@app/shared/models';

@Component({
  selector: 'art-app-nav',
  templateUrl: './app-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNavComponent {
  @Input()
  user: User;

  @Input()
  activeRoute: string;

  @Input()
  apps: App[];

  @Input()
  appContext: App | null;
}
