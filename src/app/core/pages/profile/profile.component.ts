import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserSessionService } from '../../services/user-session.service';
import { Router, RouterLink } from '@angular/router';
import { routeDefault } from '../../../app.routes';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.sass'
})
export class ProfileComponent {

  constructor(public sessionService: UserSessionService, private router: Router) {}

  onSignOutRequest(): void {
    this.sessionService.clear();
    console.info('User session cleared.');
    this.router.navigate([routeDefault.path]);
  }
}
