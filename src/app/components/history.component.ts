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
    <div class="max-w-4xl mx-auto px-4 py-8 text-slate-100">
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/" class="text-slate-400 hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 mb-1.5">
          <span>←</span> <span>Volver al Inicio</span>
        </a>
      </div>

      <div class="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-850 pb-6">
          <div class="space-y-1">
            <h2 class="text-2xl font-black font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 uppercase">
              HISTORIAL DE PARTIDAS
            </h2>
            <p class="text-xs text-slate-400 font-semibold leading-relaxed">Mira tu progreso y resultados en combates locales y online.</p>
          </div>

          <!-- TABS -->
          <div class="flex bg-slate-950 p-1 rounded-xl border border-slate-850 self-start md:self-auto shrink-0">
            <button (click)="activeTab.set('local')"
                    [class]="activeTab() === 'local' ? 'bg-slate-900 text-indigo-400 border border-slate-800 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-300 border border-transparent font-semibold'"
                    class="px-4 py-2 text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all duration-200 cursor-pointer">
              Local (vs CPU)
            </button>
            <button (click)="activeTab.set('online')"
                    [class]="activeTab() === 'online' ? 'bg-slate-900 text-indigo-400 border border-slate-800 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-300 border border-transparent font-semibold'"
                    class="px-4 py-2 text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all duration-200 cursor-pointer">
              Online (PvP)
            </button>
          </div>
        </div>

        <!-- STATS SUMMARY -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Card 1: Total -->
          <div class="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl text-center relative overflow-hidden group transition-all hover:bg-slate-900/40 shadow-inner">
            <div class="absolute -right-2 -bottom-2 text-slate-800/20 text-5xl font-bold select-none transition-transform group-hover:scale-110">⚔️</div>
            <span class="block text-slate-550 text-[10px] uppercase font-black tracking-wider mb-1">Partidas</span>
            <span class="text-3xl font-extrabold font-mono text-slate-205">{{ stats().total }}</span>
          </div>
          <!-- Card 2: Wins -->
          <div class="bg-emerald-950/20 border border-emerald-500/20 p-5 rounded-2xl text-center relative overflow-hidden group transition-all hover:bg-emerald-950/30 shadow-inner">
            <div class="absolute -right-2 -bottom-2 text-emerald-500/10 text-5xl font-bold select-none transition-transform group-hover:scale-110">🏆</div>
            <span class="block text-emerald-450 text-[10px] uppercase font-black tracking-wider mb-1">Victorias</span>
            <span class="text-3xl font-extrabold font-mono text-emerald-400">{{ stats().wins }}</span>
          </div>
          <!-- Card 3: Losses -->
          <div class="bg-rose-950/20 border border-rose-500/20 p-5 rounded-2xl text-center relative overflow-hidden group transition-all hover:bg-rose-950/30 shadow-inner">
            <div class="absolute -right-2 -bottom-2 text-rose-500/10 text-5xl font-bold select-none transition-transform group-hover:scale-110">💀</div>
            <span class="block text-rose-450 text-[10px] uppercase font-black tracking-wider mb-1">Derrotas</span>
            <span class="text-3xl font-extrabold font-mono text-rose-400">{{ stats().losses }}</span>
          </div>
        </div>

        <!-- HISTORIAL LOCAL -->
        <div *ngIf="activeTab() === 'local'" class="space-y-3">
          <div *ngFor="let m of localMatches()" 
               class="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-2xl transition-all duration-200 gap-4"
               [ngClass]="m.winner === 'Jugador' 
                 ? 'border-emerald-500/20 bg-emerald-950/5 hover:border-emerald-500/30 text-slate-100' 
                 : 'border-rose-500/20 bg-rose-950/5 hover:border-rose-500/30 text-slate-100'">
            <div class="flex items-start gap-3.5">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner border shrink-0"
                   [ngClass]="m.winner === 'Jugador' ? 'bg-emerald-950/45 border-emerald-500/20 text-emerald-400' : 'bg-rose-950/45 border-rose-500/20 text-rose-455'">
                {{ m.winner === 'Jugador' ? '🏆' : '💀' }}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider"
                        [ngClass]="m.winner === 'Jugador' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'">
                    {{ m.winner === 'Jugador' ? 'VICTORIA' : 'DERROTA' }}
                  </span>
                  <span class="text-xs text-slate-400 font-semibold">{{ m.date | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <h4 class="text-sm font-bold mt-1.5 text-slate-200">Duelo contra Computadora ({{ m.opponent_name }})</h4>
              </div>
            </div>
            <div class="flex sm:flex-col justify-between items-center sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-850 shrink-0">
              <span class="block text-slate-550 font-bold uppercase tracking-wider text-[8px] font-mono">Vida Final:</span>
              <div class="flex items-center gap-1.5 font-mono text-xs">
                <span class="font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-550/20 px-2 py-0.5 rounded-lg shadow-sm">Tú: {{ m.player_lp }}</span>
                <span class="text-slate-600 font-bold">vs</span>
                <span class="font-extrabold text-rose-400 bg-rose-500/10 border border-rose-550/20 px-2 py-0.5 rounded-lg shadow-sm">CPU: {{ m.opponent_lp }}</span>
              </div>
            </div>
          </div>

          <div *ngIf="localMatches().length === 0" class="py-12 text-center text-slate-500 font-semibold italic text-xs">
            Aún no has jugado partidas locales contra la CPU en este dispositivo.
          </div>
        </div>

        <!-- HISTORIAL ONLINE -->
        <div *ngIf="activeTab() === 'online'" class="space-y-3">
          <div *ngIf="!isSupabaseConfigured" class="py-10 text-center bg-slate-950/40 border border-dashed border-slate-850 rounded-3xl px-6">
            <span class="text-3xl block mb-2">☁️</span>
            <p class="text-slate-400 text-sm font-bold">Supabase no está configurado.</p>
            <p class="text-xs text-slate-550 mt-1 mb-4 font-semibold">Conecta tu base de datos para registrar tus duelos en línea.</p>
            <a routerLink="/settings" class="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 inline-block">Configurar Conexión →</a>
          </div>

          <div *ngIf="isSupabaseConfigured && !userProfile()" class="py-10 text-center bg-slate-950/40 border border-dashed border-slate-850 rounded-3xl px-6">
            <span class="text-3xl block mb-2">🔑</span>
            <p class="text-slate-400 text-sm font-bold">Se requiere iniciar sesión.</p>
            <p class="text-xs text-slate-550 mt-1 mb-4 font-semibold">Inicia sesión en la plataforma para ver tu historial remoto.</p>
            <a routerLink="/auth" class="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 inline-block">Iniciar Sesión →</a>
          </div>

          <div *ngIf="isSupabaseConfigured && userProfile()">
            <div *ngFor="let m of remoteMatches()" 
                 class="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-2xl transition-all duration-200 gap-4 mb-3"
                 [ngClass]="isWinner(m) 
                   ? 'border-emerald-500/20 bg-emerald-950/5 hover:border-emerald-500/30 text-slate-100' 
                   : 'border-rose-500/20 bg-rose-950/5 hover:border-rose-500/30 text-slate-100'">
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner border shrink-0"
                     [ngClass]="isWinner(m) ? 'bg-emerald-955/25 border-emerald-500/20 text-emerald-400' : 'bg-rose-955/25 border-rose-500/20 text-rose-455'">
                  {{ isWinner(m) ? '🏆' : '💀' }}
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[9px] font-bold font-mono uppercase rounded px-2 py-0.5 border"
                          [ngClass]="isWinner(m) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'">
                      {{ isWinner(m) ? 'VICTORIA' : 'DERROTA' }}
                    </span>
                    <span class="text-xs text-slate-400 font-semibold">{{ m.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <h4 class="text-sm font-bold mt-1.5 text-slate-200">
                    Duelo: {{ m.player_1?.username }} <span class="text-indigo-400 font-bold">vs</span> {{ m.player_2?.username || 'Computadora' }}
                  </h4>
                </div>
              </div>
              <div class="flex sm:flex-col justify-between items-center sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-850 shrink-0">
                <span class="block text-slate-550 font-bold uppercase tracking-wider text-[8px] font-mono">Ganador:</span>
                <span class="font-bold text-slate-200 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-lg font-mono text-xs shadow-inner">
                  {{ m.winner?.username || 'Empate/CPU' }}
                </span>
              </div>
            </div>

            <div *ngIf="remoteMatches().length === 0" class="py-12 text-center text-slate-500 font-semibold italic text-xs">
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

