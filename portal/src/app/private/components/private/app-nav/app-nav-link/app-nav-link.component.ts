import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'art-app-nav-link',
  templateUrl: './app-nav-link.component.html',
  styleUrls: ['./app-nav-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNavLinkComponent {
  @Input()
  link: string;
}
