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
        <a routerLink="/" class="text-slate-400 hover:text-slate-100 transition-colors">← Volver al Inicio</a>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              HISTORIAL DE PARTIDAS
            </h2>
            <p class="text-slate-400 text-sm">Mira tu progreso y resultados en combates locales y online.</p>
          </div>

          <!-- TABS -->
          <div class="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
            <button (click)="activeTab.set('local')"
                    [class]="activeTab() === 'local' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'"
                    class="px-4 py-2 text-xs uppercase tracking-wider rounded-lg transition-all">
              Local (vs CPU)
            </button>
            <button (click)="activeTab.set('online')"
                    [class]="activeTab() === 'online' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'"
                    class="px-4 py-2 text-xs uppercase tracking-wider rounded-lg transition-all">
              Online (PvP)
            </button>
          </div>
        </div>

        <!-- STATS SUMMARY -->
        <div class="grid grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-850">
          <div class="text-center">
            <span class="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Partidas</span>
            <span class="text-2xl font-bold font-display text-slate-200">{{ stats().total }}</span>
          </div>
          <div class="text-center">
            <span class="block text-slate-500 text-[10px] uppercase font-bold tracking-wider text-emerald-400">Victorias</span>
            <span class="text-2xl font-bold font-display text-emerald-400">{{ stats().wins }}</span>
          </div>
          <div class="text-center">
            <span class="block text-slate-500 text-[10px] uppercase font-bold tracking-wider text-rose-400">Derrotas</span>
            <span class="text-2xl font-bold font-display text-rose-400">{{ stats().losses }}</span>
          </div>
        </div>

        <!-- HISTORIAL LOCAL -->
        <div *ngIf="activeTab() === 'local'" class="space-y-3">
          <div *ngFor="let m of localMatches()" 
               class="flex items-center justify-between p-4 bg-slate-950 border rounded-2xl transition-all"
               [ngClass]="m.winner === 'Jugador' ? 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5'">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold px-2 py-0.5 rounded font-mono uppercase"
                      [ngClass]="m.winner === 'Jugador' ? 'bg-emerald-500/25 text-emerald-400' : 'bg-rose-500/25 text-rose-400'">
                  {{ m.winner === 'Jugador' ? 'VICTORIA' : 'DERROTA' }}
                </span>
                <span class="text-xs text-slate-400">{{ m.date | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <h4 class="text-sm font-bold mt-1.5 text-slate-200">Encuentro contra Computadora ({{ m.opponent_name }})</h4>
            </div>
            <div class="text-right font-mono text-xs">
              <span class="block text-slate-400">Vidas Finales:</span>
              <span class="font-bold text-slate-200">Tú: {{ m.player_lp }} LP | CPU: {{ m.opponent_lp }} LP</span>
            </div>
          </div>

          <div *ngIf="localMatches().length === 0" class="py-12 text-center text-slate-500 font-medium">
            Aún no has jugado partidas locales contra la CPU en este dispositivo.
          </div>
        </div>

        <!-- HISTORIAL ONLINE -->
        <div *ngIf="activeTab() === 'online'" class="space-y-3">
          <div *ngIf="!isSupabaseConfigured" class="py-6 text-center bg-slate-950 border border-dashed border-slate-800 rounded-2xl">
            <p class="text-slate-400 text-sm">Supabase no está configurado.</p>
            <a routerLink="/settings" class="text-teal-400 text-xs font-semibold hover:underline mt-2 inline-block">Configurar Conexión →</a>
          </div>

          <div *ngIf="isSupabaseConfigured && !userProfile()" class="py-6 text-center bg-slate-950 border border-dashed border-slate-800 rounded-2xl">
            <p class="text-slate-400 text-sm">Inicia sesión en la plataforma para ver tu historial remoto.</p>
            <a routerLink="/auth" class="text-teal-400 text-xs font-semibold hover:underline mt-2 inline-block">Iniciar Sesión →</a>
          </div>

          <div *ngIf="isSupabaseConfigured && userProfile()">
            <div *ngFor="let m of remoteMatches()" 
                 class="flex items-center justify-between p-4 bg-slate-950 border rounded-2xl transition-all mb-3"
                 [ngClass]="isWinner(m) ? 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5'">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold font-mono uppercase rounded px-2 py-0.5"
                        [ngClass]="isWinner(m) ? 'bg-emerald-500/25 text-emerald-400' : 'bg-rose-500/25 text-rose-400'">
                    {{ isWinner(m) ? 'VICTORIA' : 'DERROTA' }}
                  </span>
                  <span class="text-xs text-slate-400">{{ m.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <h4 class="text-sm font-bold mt-1.5 text-slate-200">
                  Duelo: {{ m.player_1?.username }} vs {{ m.player_2?.username || 'CPU' }}
                </h4>
              </div>
              <div class="text-right font-mono text-xs">
                <span class="block text-slate-400">Ganador:</span>
                <span class="font-bold text-slate-200">{{ m.winner?.username || 'Empate/CPU' }}</span>
              </div>
            </div>

            <div *ngIf="remoteMatches().length === 0" class="py-12 text-center text-slate-500 font-medium">
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

