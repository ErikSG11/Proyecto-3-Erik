import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { SqliteService } from '../services/sqlite.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-xl mx-auto px-4 py-8">
      <div class="flex items-center gap-4 mb-8">
        <a routerLink="/" class="text-slate-400 hover:text-slate-100 transition-colors">← Volver al Inicio</a>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 class="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-2">
          CONFIGURACIÓN
        </h2>
        <p class="text-sm text-slate-400 mb-6">
          Vincula tu proyecto de Supabase para activar la base de datos remota, la autenticación y el modo de juego multijugador en línea.
        </p>

        <form (ngSubmit)="saveSettings()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Supabase Project URL
            </label>
            <input type="text" [(ngModel)]="supabaseUrl" name="supabaseUrl" required
                   placeholder="https://your-project-id.supabase.co"
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono">
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Supabase Anon Key
            </label>
            <textarea [(ngModel)]="supabaseKey" name="supabaseKey" required rows="4"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"></textarea>
          </div>

          <div *ngIf="successMessage()" class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
            {{ successMessage() }}
          </div>

          <div *ngIf="errorMessage()" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium">
            {{ errorMessage() }}
          </div>

          <button type="submit" [disabled]="isSaving()"
                  class="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-teal-600/20 active:scale-98 transition-all duration-200 disabled:opacity-50">
            {{ isSaving() ? 'Guardando...' : 'GUARDAR Y CONECTAR' }}
          </button>
        </form>

        <div class="mt-8 border-t border-slate-800 pt-6">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Instrucciones de Configuración</h3>
          <ol class="list-decimal list-inside text-xs text-slate-400 space-y-2">
            <li>Regístrate o inicia sesión en <a href="https://supabase.com" target="_blank" class="text-teal-400 hover:underline">supabase.com</a>.</li>
            <li>Crea un nuevo proyecto en Supabase (tarda ~1 minuto).</li>
            <li>Copia la <strong>Project URL</strong> y la <strong>API Anon Key</strong> desde tu Dashboard (Settings -> API).</li>
            <li>Pega las credenciales arriba y haz clic en Guardar.</li>
            <li>
              Crea las tablas requeridas ejecutando el siguiente SQL en el <strong>SQL Editor</strong> de Supabase:
              <pre class="bg-slate-950 p-3 rounded-lg mt-2 overflow-x-auto text-[10px] leading-relaxed text-slate-300 font-mono">
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  deck INTEGER[] DEFAULT '&#123;&#125;'::INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE match_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_1_id UUID REFERENCES profiles(id),
  player_2_id UUID REFERENCES profiles(id),
  winner_id UUID REFERENCES profiles(id),
  mode TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE game_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code VARCHAR(6) UNIQUE NOT NULL,
  player_1_id UUID REFERENCES profiles(id) NOT NULL,
  player_2_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'waiting' NOT NULL,
  current_turn_id UUID REFERENCES profiles(id),
  game_state JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
              </pre>
            </li>
          </ol>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  supabaseUrl = '';
  supabaseKey = '';
  successMessage = signal('');
  errorMessage = signal('');
  isSaving = signal(false);

  constructor(
    private sqliteService: SqliteService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.sqliteService.initialize();
    
    // Load from SQLite
    const urlSetting = this.sqliteService.select("SELECT value FROM local_settings WHERE key = 'supabase_url'");
    const keySetting = this.sqliteService.select("SELECT value FROM local_settings WHERE key = 'supabase_key'");

    this.supabaseUrl = urlSetting.length > 0 ? urlSetting[0].value : '';
    this.supabaseKey = keySetting.length > 0 ? keySetting[0].value : '';
  }

  async saveSettings() {
    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      const ok = await this.supabaseService.updateCredentials(this.supabaseUrl.trim(), this.supabaseKey.trim());
      if (ok) {
        // Try to connect to Supabase
        const configured = await this.supabaseService.initialize();
        if (configured) {
          this.successMessage.set('¡Configuración guardada y conexión exitosa con Supabase!');
          setTimeout(() => this.router.navigate(['/']), 1500);
        } else {
          this.errorMessage.set('Las credenciales se guardaron, pero no pudimos conectar. Revisa la URL y la Key.');
        }
      } else {
        this.errorMessage.set('No se pudo guardar en la base de datos SQLite.');
      }
    } catch (e: any) {
      this.errorMessage.set('Error: ' + (e.message || e));
    } finally {
      this.isSaving.set(false);
    }
  }
}
