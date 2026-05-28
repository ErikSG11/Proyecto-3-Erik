import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-md mx-auto px-4 py-12 flex flex-col justify-center min-h-[80vh]">
      <div class="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        
        <!-- Header -->
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-black font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 uppercase">
            {{ isSignUp() ? 'Registro' : 'Iniciar Sesión' }}
          </h2>
          <p class="text-slate-400 text-xs font-medium leading-relaxed">Accede al servidor para guardar tu historial y batallar en línea.</p>
        </div>

        <form (ngSubmit)="handleSubmit()" class="space-y-4">
          <!-- Username (Only for Sign Up) -->
          <div *ngIf="isSignUp()">
            <label for="usernameInput" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nombre de Usuario</label>
            <input type="text" id="usernameInput" [(ngModel)]="username" name="username" required
                   placeholder="Ej: EntrenadorRojo"
                   class="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all placeholder:text-slate-650">
          </div>

          <!-- Email -->
          <div>
            <label for="emailInput" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Correo Electrónico</label>
            <input type="email" id="emailInput" [(ngModel)]="email" name="email" required
                   placeholder="correo@ejemplo.com"
                   class="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all placeholder:text-slate-650">
          </div>

          <!-- Password -->
          <div>
            <label for="passwordInput" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Contraseña</label>
            <input type="password" id="passwordInput" [(ngModel)]="password" name="password" required
                   placeholder="Mínimo 6 caracteres"
                   class="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all placeholder:text-slate-650">
          </div>

          <!-- Messages -->
          <div *ngIf="successMessage()" class="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-medium leading-relaxed">
            {{ successMessage() }}
          </div>
          <div *ngIf="errorMessage()" class="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium leading-relaxed">
            {{ errorMessage() }}
          </div>

          <!-- Submit Button -->
          <button type="submit" [disabled]="loading()"
                  class="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-indigo-950/30 active:scale-98 transition-all duration-200 disabled:opacity-50 cursor-pointer">
            {{ loading() ? 'Procesando...' : (isSignUp() ? 'REGISTRARME' : 'INGRESAR') }}
          </button>
        </form>

        <!-- Toggle Mode Link -->
        <div class="text-center pt-2">
          <button (click)="toggleMode()" class="text-xs text-indigo-400 font-bold hover:text-indigo-300 hover:underline cursor-pointer">
            {{ isSignUp() ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate aquí' }}
          </button>
        </div>

        <div class="text-center border-t border-slate-850 pt-4">
          <a routerLink="/" class="text-xs text-slate-500 hover:text-slate-400 transition-colors">Volver al inicio sin iniciar sesión</a>
        </div>
      </div>
    </div>
  `
})
export class AuthComponent implements OnInit {
  isSignUp = signal(false);
  loading = signal(false);
  
  username = '';
  email = '';
  password = '';

  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    const configured = await this.supabaseService.initialize();
    if (!configured) {
      alert('Debes configurar tu URL y Anon Key de Supabase en la sección de Configuración para poder registrarte o iniciar sesión.');
      this.router.navigate(['/settings']);
    }
  }

  toggleMode() {
    this.isSignUp.set(!this.isSignUp());
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  async handleSubmit() {
    this.successMessage.set('');
    this.errorMessage.set('');

    // Validations
    if (!this.email.trim() || !this.password.trim() || (this.isSignUp() && !this.username.trim())) {
      this.errorMessage.set('Por favor, completa todos los campos del formulario.');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage.set('Por favor, introduce un correo electrónico válido.');
      return;
    }

    this.loading.set(true);

    try {
      if (this.isSignUp()) {
        await this.supabaseService.signUp(this.email.trim(), this.username.trim(), this.password);
        this.successMessage.set('Registro exitoso. Se ha enviado un correo de confirmación (si aplica) o puedes iniciar sesión.');
        this.isSignUp.set(false);
        this.password = '';
      } else {
        await this.supabaseService.signIn(this.email.trim(), this.password);
        this.successMessage.set('¡Inicio de sesión exitoso! Redirigiendo...');
        setTimeout(() => this.router.navigate(['/']), 1000);
      }
    } catch (e: any) {
      console.error(e);
      this.errorMessage.set(e.message || 'Ocurrió un error inesperado durante la autenticación.');
    } finally {
      this.loading.set(false);
    }
  }
}
