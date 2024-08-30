import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { UserSessionService } from '../../core/services/user-session.service';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { routePlay } from '../../app.routes';

@Injectable({
  providedIn: 'root'
})
export class IsNotAuthenticatedGuard implements CanActivate {
  constructor(private sessionService: UserSessionService, private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!this.sessionService.isAuthenticated()) {
      return true;
    } else {
      return this.router.createUrlTree([routePlay.path]);
    }
  }
}
