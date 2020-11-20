import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, startWith, map } from 'rxjs/operators';

import { UserService } from '@app/core/core.module';
import { User, App } from '@app/shared/models';

@Component({
  selector: 'art-private',
  templateUrl: './private.component.html',
  styleUrls: ['./private.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivateComponent implements OnInit {
  public user$: Observable<User>;
  public activeRoute$: Observable<string>;
  public apps$: Observable<App[]>;
  public appContext$: Observable<App | null>;

  constructor(private router: Router, private userService: UserService) {
    this.userService.initializeUser();
  }

  ngOnInit() {
    this.user$ = this.userService.getUser();
    this.subscribeToRoute();
    this.apps$ = this.userService.getApps();
    this.appContext$ = this.userService.getAppContext();
  }

  private subscribeToRoute() {
    this.activeRoute$ = this.router.events.pipe(
      startWith(new NavigationStart(0, this.router.url)),
      filter(e => e instanceof NavigationStart),
      map((event: NavigationStart) => event.url.replace(/\W/g, '')),
    );
  }
}
