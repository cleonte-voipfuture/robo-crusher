import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, RouterLinkActive } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MainNavBarComponent } from "./core/components/main-nav-bar/main-nav-bar.component";
import { LogoBadgeComponent } from "./core/components/logo-badge/logo-badge.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    RouterLinkActive,
    MatSlideToggleModule,
    MainNavBarComponent,
    LogoBadgeComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent { }
