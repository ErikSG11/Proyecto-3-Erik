import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SqliteService } from '../services/sqlite.service';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/" class="text-slate-500 hover:text-indigo-650 text-sm font-semibold transition-colors flex items-center gap-1.5 group">
          <span class="transition-transform group-hover:-translate-x-1">←</span> Volver al Inicio
        </a>
      </div>

      <div class="bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100/80 pb-6">
          <div>
            <h2 class="text-3xl sm:text-4xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-650 tracking-tight">
              HISTORIAL DE PARTIDAS
            </h2>
            <p class="text-slate-500 text-sm font-medium mt-1">Mira tu progreso y resultados en combates locales y online.</p>
          </div>

          <!-- TABS -->
          <div class="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 self-start md:self-auto">
            <button (click)="activeTab.set('local')"
                    [class]="activeTab() === 'local' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800 font-semibold'"
                    class="px-4 py-2 text-xs uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer">
              Local (vs CPU)
            </button>
            <button (click)="activeTab.set('online')"
                    [class]="activeTab() === 'online' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800 font-semibold'"
                    class="px-4 py-2 text-xs uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer">
              Online (PvP)
            </button>
          </div>
        </div>

        <!-- STATS SUMMARY -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Card 1: Total -->
          <div class="bg-slate-50/60 border border-slate-200/60 p-5 rounded-2xl text-center relative overflow-hidden group transition-all hover:bg-slate-50">
            <div class="absolute -right-2 -bottom-2 text-slate-200/30 text-5xl font-bold select-none transition-transform group-hover:scale-110">⚔️</div>
            <span class="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Partidas</span>
            <span class="text-3xl font-bold font-display text-slate-700">{{ stats().total }}</span>
          </div>
          <!-- Card 2: Wins -->
          <div class="bg-emerald-50/40 border border-emerald-100/80 p-5 rounded-2xl text-center relative overflow-hidden group transition-all hover:bg-emerald-50/60">
            <div class="absolute -right-2 -bottom-2 text-emerald-100/30 text-5xl font-bold select-none transition-transform group-hover:scale-110">🏆</div>
            <span class="block text-emerald-600/70 text-[10px] uppercase font-bold tracking-wider mb-1">Victorias</span>
            <span class="text-3xl font-bold font-display text-emerald-650">{{ stats().wins }}</span>
          </div>
          <!-- Card 3: Losses -->
          <div class="bg-rose-50/40 border border-rose-100/80 p-5 rounded-2xl text-center relative overflow-hidden group transition-all hover:bg-rose-50/60">
            <div class="absolute -right-2 -bottom-2 text-rose-100/30 text-5xl font-bold select-none transition-transform group-hover:scale-110">💀</div>
            <span class="block text-rose-600/70 text-[10px] uppercase font-bold tracking-wider mb-1">Derrotas</span>
            <span class="text-3xl font-bold font-display text-rose-650">{{ stats().losses }}</span>
          </div>
        </div>

        <!-- HISTORIAL LOCAL -->
        <div *ngIf="activeTab() === 'local'" class="space-y-3">
          <div *ngFor="let m of localMatches()" 
               class="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-2xl transition-all duration-205 gap-3"
               [ngClass]="m.winner === 'Jugador' 
                 ? 'border-emerald-100 bg-emerald-50/20 hover:border-emerald-250 hover:bg-emerald-50/30 text-slate-800' 
                 : 'border-rose-100 bg-rose-50/20 hover:border-rose-250 hover:bg-rose-50/30 text-slate-800'">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-xs border"
                   [ngClass]="m.winner === 'Jugador' ? 'bg-emerald-100/60 border-emerald-200 text-emerald-600' : 'bg-rose-100/60 border-rose-200 text-rose-600'">
                {{ m.winner === 'Jugador' ? '🏆' : '💀' }}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider"
                        [ngClass]="m.winner === 'Jugador' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50' : 'bg-rose-100 text-rose-800 border border-rose-200/50'">
                    {{ m.winner === 'Jugador' ? 'VICTORIA' : 'DERROTA' }}
                  </span>
                  <span class="text-xs text-slate-400 font-semibold">{{ m.date | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <h4 class="text-sm font-bold mt-1 text-slate-700">Duelo contra Computadora ({{ m.opponent_name }})</h4>
              </div>
            </div>
            <div class="flex sm:flex-col justify-between items-center sm:items-end gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span class="block text-slate-400 font-bold uppercase tracking-wider text-[8px] font-mono">Puntos de Vida Finales:</span>
              <div class="flex items-center gap-1.5 font-mono text-xs">
                <span class="font-extrabold text-indigo-650 bg-indigo-50/80 border border-indigo-100/50 px-2 py-0.5 rounded-lg shadow-xs">Tú: {{ m.player_lp }}</span>
                <span class="text-slate-350 font-bold">vs</span>
                <span class="font-extrabold text-rose-650 bg-rose-50/80 border border-rose-100/50 px-2 py-0.5 rounded-lg shadow-xs">CPU: {{ m.opponent_lp }}</span>
              </div>
            </div>
          </div>

          <div *ngIf="localMatches().length === 0" class="py-12 text-center text-slate-400 font-semibold italic">
            Aún no has jugado partidas locales contra la CPU en este dispositivo.
          </div>
        </div>

        <!-- HISTORIAL ONLINE -->
        <div *ngIf="activeTab() === 'online'" class="space-y-3">
          <div *ngIf="!isSupabaseConfigured" class="py-10 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl px-6">
            <span class="text-3xl block mb-2">☁️</span>
            <p class="text-slate-500 text-sm font-bold">Supabase no está configurado.</p>
            <p class="text-xs text-slate-400 mt-1 mb-3">Conecta tu base de datos para registrar tus duelos en línea.</p>
            <a routerLink="/settings" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-200 inline-block">Configurar Conexión →</a>
          </div>

          <div *ngIf="isSupabaseConfigured && !userProfile()" class="py-10 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl px-6">
            <span class="text-3xl block mb-2">🔑</span>
            <p class="text-slate-500 text-sm font-bold">Se requiere iniciar sesión.</p>
            <p class="text-xs text-slate-400 mt-1 mb-3">Inicia sesión en la plataforma para ver tu historial remoto.</p>
            <a routerLink="/auth" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-200 inline-block">Iniciar Sesión →</a>
          </div>

          <div *ngIf="isSupabaseConfigured && userProfile()">
            <div *ngFor="let m of remoteMatches()" 
                 class="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-2xl transition-all duration-205 gap-3 mb-3"
                 [ngClass]="isWinner(m) 
                   ? 'border-emerald-100 bg-emerald-50/20 hover:border-emerald-250 hover:bg-emerald-50/30 text-slate-800' 
                   : 'border-rose-100 bg-rose-50/20 hover:border-rose-250 hover:bg-rose-50/30 text-slate-800'">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-xs border"
                     [ngClass]="isWinner(m) ? 'bg-emerald-100/60 border-emerald-200 text-emerald-600' : 'bg-rose-100/60 border-rose-200 text-rose-600'">
                  {{ isWinner(m) ? '🏆' : '💀' }}
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[9px] font-bold font-mono uppercase rounded px-2 py-0.5 border"
                          [ngClass]="isWinner(m) ? 'bg-emerald-100 text-emerald-800 border-emerald-200/50' : 'bg-rose-100 text-rose-800 border-rose-200/50'">
                      {{ isWinner(m) ? 'VICTORIA' : 'DERROTA' }}
                    </span>
                    <span class="text-xs text-slate-400 font-semibold">{{ m.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <h4 class="text-sm font-bold mt-1 text-slate-700">
                    Duelo: {{ m.player_1?.username }} <span class="text-indigo-500 font-extrabold">vs</span> {{ m.player_2?.username || 'Computadora' }}
                  </h4>
                </div>
              </div>
              <div class="flex sm:flex-col justify-between items-center sm:items-end gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span class="block text-slate-400 font-bold uppercase tracking-wider text-[8px] font-mono">Ganador:</span>
                <span class="font-extrabold text-slate-700 bg-slate-100/80 border border-slate-200/50 px-2 py-0.5 rounded-lg font-mono text-xs">
                  {{ m.winner?.username || 'Empate/CPU' }}
                </span>
              </div>
            </div>

            <div *ngIf="remoteMatches().length === 0" class="py-12 text-center text-slate-400 font-semibold italic">
              No tienes partidas registradas en la nube.
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class HistoryComponent implements OnInit {
  activeTab = signal<'local' | 'online'>('local');
  localMatches = signal<any[]>([]);
  remoteMatches = signal<any[]>([]);
  isSupabaseConfigured = false;
  userProfile = signal<any>(null);

  stats = computed(() => {
    let wins = 0;
    let losses = 0;

    if (this.activeTab() === 'local') {
      wins = this.localMatches().filter(m => m.winner === 'Jugador').length;
      losses = this.localMatches().filter(m => m.winner !== 'Jugador').length;
    } else {
      if (this.userProfile()) {
        wins = this.remoteMatches().filter(m => this.isWinner(m)).length;
        losses = this.remoteMatches().filter(m => !this.isWinner(m)).length;
      }
    }

    return {
      total: wins + losses,
      wins,
      losses
    };
  });

  constructor(
    private sqliteService: SqliteService,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    await this.sqliteService.initialize();
    this.isSupabaseConfigured = await this.supabaseService.initialize();

    await this.loadLocalMatches();
    if (this.isSupabaseConfigured) {
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        const profile = await this.supabaseService.getUserProfile(user.id);
        this.userProfile.set(profile);
        await this.loadRemoteMatches(user.id);
      }
    }
  }

  async loadLocalMatches() {
    const matches = this.sqliteService.select(
      'SELECT * FROM local_match_history ORDER BY id DESC'
    );
    this.localMatches.set(matches);
  }

  async loadRemoteMatches(userId: string) {
    const matches = await this.supabaseService.getRemoteMatchHistory(userId);
    this.remoteMatches.set(matches);
  }

  isWinner(m: any): boolean {
    if (!this.userProfile()) return false;
    const currentUsername = this.userProfile().username;
    return m.winner?.username === currentUsername;
  }
}

