import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatError, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { FlexModule } from '@angular/flex-layout';

export type SignInEvent = {
  username: string,
  authKey: string,
}

@Component({
  selector: 'app-sign-in-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatFormField, MatError, MatLabel, MatInput, MatButton, FlexModule],
  templateUrl: './sign-in-form.component.html',
  styleUrl: './sign-in.component.sass'
})
export class SignInFormComponent {
  @Output() onSignInComplete: EventEmitter<SignInEvent> = new EventEmitter<SignInEvent>();

  signInForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
  ) {
    this.signInForm = this.formBuilder.group({
      username: ['', [
        Validators.required,
        Validators.minLength(4),
        Validators.pattern(/^[a-z0-9]+((\.|-)?[a-z0-9]+)*$/i),
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(4),
      ]],
    });
  }

  onSubmit() {
    if (this.signInForm.valid) {
      const { username, password } = this.signInForm.value;
      let authKey: string;
      this.authService.signIn(username, password).subscribe({
        next: key => {
          console.info('Signed in as:', username);
          authKey = key
        },
        error: e => {
          console.error('Sign-in failed:', e);
        },
        complete: () => {
          console.info('Sign-in complete!');
          this.onSignInComplete.emit({ username, authKey });
        },
      })
    }
  }
}
