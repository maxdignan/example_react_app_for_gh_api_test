import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { User } from '@app/shared/models';

@Component({
  selector: 'art-app-nav-user',
  templateUrl: './app-nav-user.component.html',
  styleUrls: ['./app-nav-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNavUserComponent {
  @Input()
  user: User;
}
