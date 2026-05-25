import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { SupabaseService } from './services/supabase.service';
import { SqliteService } from './services/sqlite.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  isSupabaseConfigured = signal(false);
  userProfile = signal<any>(null);

  constructor(
    private sqliteService: SqliteService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    // 1. Initialize local SQLite
    await this.sqliteService.initialize();

    // 2. Initialize Supabase
    const isOk = await this.supabaseService.initialize();
    this.isSupabaseConfigured.set(isOk);

    if (isOk) {
      this.checkSession();
    }
  }

  async checkSession() {
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        const profile = await this.supabaseService.getUserProfile(user.id);
        this.userProfile.set(profile);
      } else {
        this.userProfile.set(null);
      }
    } catch (e) {
      console.warn('Session check failed:', e);
      this.userProfile.set(null);
    }
  }

  async handleSignOut() {
    await this.supabaseService.signOut();
    this.userProfile.set(null);
    alert('Has cerrado sesión correctamente.');
    this.router.navigate(['/']);
  }
}
