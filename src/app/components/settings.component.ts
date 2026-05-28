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
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/" class="text-slate-400 hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5">
          <span>←</span> <span>Volver al Inicio</span>
        </a>
      </div>

      <div class="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div>
          <h2 class="text-2xl font-black font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 uppercase mb-2">
            CONFIGURACIÓN
          </h2>
          <p class="text-xs text-slate-400 font-medium leading-relaxed">
            Vincula tu proyecto de Supabase para activar la base de datos remota, la autenticación y el modo de juego multijugador en línea.
          </p>
        </div>

        <!-- SETTINGS SECTIONS TABS -->
        <div class="flex bg-slate-950 p-1 rounded-xl border border-slate-850 mb-6">
          <button type="button" (click)="activeSettingsTab.set('credentials')"
                  [class]="activeSettingsTab() === 'credentials' ? 'bg-slate-900 text-indigo-400 border border-slate-800 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-350 hover:bg-slate-900/20 border border-transparent'"
                  class="flex-1 py-2.5 text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all cursor-pointer">
            Credenciales
          </button>
          <button type="button" (click)="activeSettingsTab.set('sql')"
                  [class]="activeSettingsTab() === 'sql' ? 'bg-slate-900 text-indigo-400 border border-slate-800 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-350 hover:bg-slate-900/20 border border-transparent'"
                  class="flex-1 py-2.5 text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all cursor-pointer">
            Tablas SQL
          </button>
        </div>

        <div *ngIf="activeSettingsTab() === 'credentials'">
          <form (ngSubmit)="saveSettings()" class="space-y-4">
            <div>
              <label for="supabaseUrlInput" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Supabase Project URL
              </label>
              <input type="text" id="supabaseUrlInput" [(ngModel)]="supabaseUrl" name="supabaseUrl" required
                     placeholder="https://your-project-id.supabase.co"
                     class="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all font-mono placeholder:text-slate-650">
            </div>

            <div>
              <label for="supabaseKeyInput" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Supabase Anon Key
              </label>
              <textarea id="supabaseKeyInput" [(ngModel)]="supabaseKey" name="supabaseKey" required rows="4"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        class="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all font-mono placeholder:text-slate-650"></textarea>
            </div>

            <div *ngIf="successMessage()" class="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-medium leading-relaxed">
              {{ successMessage() }}
            </div>

            <div *ngIf="errorMessage()" class="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium leading-relaxed">
              {{ errorMessage() }}
            </div>

            <button type="submit" [disabled]="isSaving()"
                    class="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-indigo-950/30 active:scale-98 transition-all duration-200 disabled:opacity-50 cursor-pointer">
              {{ isSaving() ? 'Guardando...' : 'GUARDAR Y CONECTAR' }}
            </button>
          </form>
        </div>

        <div *ngIf="activeSettingsTab() === 'sql'" class="space-y-4 animate-fade-in">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-350">Instrucciones de Configuración</h3>
          <ol class="list-decimal list-inside text-xs text-slate-455 space-y-3 leading-relaxed">
            <li>Regístrate o inicia sesión en <a href="https://supabase.com" target="_blank" class="text-indigo-400 hover:text-indigo-300 font-bold hover:underline">supabase.com</a>.</li>
            <li>Crea un nuevo proyecto en Supabase (tarda ~1 minuto).</li>
            <li>Copia la <strong>Project URL</strong> y la <strong>API Anon Key</strong> desde tu Dashboard (Settings -> API).</li>
            <li>Pega las credenciales en la pestaña de Credenciales y haz clic en Guardar.</li>
            <li>
              Crea las tablas requeridas ejecutando el siguiente SQL en el <strong>SQL Editor</strong> de Supabase:
              <pre class="bg-slate-950 border border-slate-850 p-4 rounded-xl mt-2 overflow-x-auto text-[10px] leading-relaxed text-slate-350 font-mono shadow-inner">
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
  activeSettingsTab = signal<'credentials' | 'sql'>('credentials');
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
