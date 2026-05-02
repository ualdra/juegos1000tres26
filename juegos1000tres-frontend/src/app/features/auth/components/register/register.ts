import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GenericButton } from '../../../../shared/components/generic-button/generic-button';

@Component({
  selector: 'app-register',
  imports: [NgIf, ReactiveFormsModule, RouterLink, GenericButton],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  error: string | null = null;
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.auth.register(this.form.value as any).subscribe({
      next: () => {
        this.error = null;
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.error = 'El email o el nombre ya existen';
        } else {
          this.error = 'Error en el registro';
        }
      }
    });
  }
}
