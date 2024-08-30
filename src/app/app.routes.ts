import { Route, Routes } from '@angular/router';
import { SignInComponent } from "./core/pages/sign-in/sign-in.component";
import { PlayComponent } from "./core/pages/play/play.component";
import { ProfileComponent } from './core/pages/profile/profile.component';
import { IsAuthenticatedGuard } from './features/auth/is-authenticated-guard.service';
import { IsNotAuthenticatedGuard } from './features/auth/is-not-authenticated-guard.service';

export const routePlay: Route = {
  path: 'play', title: 'Play',
  component: PlayComponent,
  canActivate: [ IsAuthenticatedGuard ],
};

export const routeSignIn: Route = {
  path: 'sign-in', title: 'Sign In',
  component: SignInComponent,
  canActivate: [ IsNotAuthenticatedGuard ],
};

export const routeProfile: Route = {
  path: 'profile', title: 'Profile',
  component: ProfileComponent,
  canActivate: [ IsAuthenticatedGuard ],
};

export const routeDefault: Route = { ...routePlay, path: '' }

export const routes: Routes = [
  routeDefault, routePlay, routeSignIn, routeProfile,
];
