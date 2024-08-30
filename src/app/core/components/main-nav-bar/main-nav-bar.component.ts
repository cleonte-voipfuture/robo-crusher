import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule, MatTabLink } from '@angular/material/tabs';
import { routePlay, routeSignIn, routeProfile } from "../../../app.routes";
import { RouterModule, RouterLink, Route } from '@angular/router';
import { UserSessionService } from '../../services/user-session.service';

type CustomAppRoute = Route & {
  label: string,
}

@Component({
  selector: 'app-main-nav-bar',
  standalone: true,
  imports: [ MatTabsModule, MatTabLink, MatButtonModule, RouterLink, RouterModule ],
  templateUrl: './main-nav-bar.component.html',
  styleUrl: './main-nav-bar.component.sass'
})
export class MainNavBarComponent {
  links: CustomAppRoute[] = [];
  constructor(sessionService: UserSessionService) {
    this.links.push({ ...routePlay, label: 'Play' });
    if (sessionService.isAuthenticated()) {
      this.links.push({ ...routeProfile, label: sessionService.username() as string });
    } else {
      this.links.push({ ...routeSignIn, label: 'Sign in' });
    }
  }
}
