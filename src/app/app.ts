import { Component, OnInit, signal, effect, inject } from '@angular/core';
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
  private sqliteService = inject(SqliteService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  isSupabaseConfigured = signal(false);
  userProfile = this.supabaseService.currentUserProfile;

  constructor() {}

  async ngOnInit() {
    // 1. Initialize local SQLite
    await this.sqliteService.initialize();

    // 2. Initialize Supabase
    const isOk = await this.supabaseService.initialize();
    this.isSupabaseConfigured.set(isOk);
  }

  async handleSignOut() {
    await this.supabaseService.signOut();
    alert('Has cerrado sesión correctamente.');
    this.router.navigate(['/']);
  }
}
