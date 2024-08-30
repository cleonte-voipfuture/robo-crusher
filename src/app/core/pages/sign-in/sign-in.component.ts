import { Component } from '@angular/core';
import { SignInFormComponent, SignInEvent } from '../../../features/auth/components/sign-in-form/sign-in-form.component';
import { CommonModule } from '@angular/common';
import { UserSessionService } from '../../services/user-session.service';
import { Router, RouterLink } from '@angular/router';
import { routeDefault } from '../../../app.routes';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [SignInFormComponent, CommonModule, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.sass'
})

export class SignInComponent {

  constructor(private sessionService: UserSessionService, private router: Router) {}

  onSignInComplete(event: SignInEvent): void {
    this.sessionService.set(event.username, event.authKey);
    console.info('User session created.');
    this.router.navigate([routeDefault.path]);
  }
}
