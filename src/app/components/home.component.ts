import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PokeApiService } from '../services/poke-api.service';
import { SqliteService } from '../services/sqlite.service';
import { SupabaseService } from '../services/supabase.service';
import { DeckService } from '../services/deck.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh]">
      <!-- HEADER / LOGO -->
      <div class="text-center mb-12 animate-fade-in">
        <h1 class="text-5xl md:text-7xl font-black font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-teal-400 title-glow uppercase">
          PokeDuel
        </h1>
        <p class="text-slate-400 mt-3 text-lg font-medium">Juego de Cartas Coleccionables por Turnos</p>
      </div>

      <!-- INITIAL CACHING / LOADING SCREEN -->
      <div *ngIf="isCaching()" class="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-center">
        <div class="animate-spin text-teal-400 text-3xl mb-4">🌀</div>
        <h3 class="text-lg font-semibold mb-2">Preparando Pokédex...</h3>
        <p class="text-xs text-slate-400 mb-4">Descargando y configurando los 151 Pokémon originales en tu SQLite local</p>
        <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div class="bg-gradient-to-r from-teal-400 to-emerald-500 h-full transition-all duration-300" 
               [style.width.%]="cacheProgress() * 100"></div>
        </div>
        <span class="text-xs text-slate-400 mt-2 block font-mono">{{ (cacheProgress() * 100) | number:'1.0-0' }}% completado</span>
      </div>

      <!-- MAIN MENU -->
      <div *ngIf="!isCaching()" class="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <!-- SECCIÓN IZQUIERDA: JUGAR -->
        <div class="flex flex-col gap-4">
          <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between h-full shadow-lg hover:border-teal-500/50 transition-all duration-300">
            <div>
              <span class="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs rounded-full font-semibold uppercase tracking-wider">Offline</span>
              <h2 class="text-2xl font-bold font-display mt-3 mb-2 text-slate-100">Duelo vs CPU</h2>
              <p class="text-sm text-slate-400 mb-6">Enfréntate a la computadora con una IA estratégica. Ideal para practicar y probar tu mazo.</p>
            </div>
            <button (click)="playCpu()" 
                    class="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg hover:shadow-red-600/20 active:scale-98 transition-all duration-200">
              ENTRAR AL DUELO
            </button>
          </div>

          <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between h-full shadow-lg hover:border-teal-500/50 transition-all duration-300">
            <div>
              <div class="flex items-center justify-between">
                <span class="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs rounded-full font-semibold uppercase tracking-wider">Online</span>
                <span *ngIf="!isSupabaseConfigured" class="text-rose-400 text-xs flex items-center gap-1 font-semibold">
                  ⚠️ Sin configurar
                </span>
              </div>
              <h2 class="text-2xl font-bold font-display mt-3 mb-2 text-slate-100">Duelo en Línea</h2>
              <p class="text-sm text-slate-400 mb-6">Enfréntate a otros entrenadores del mundo en tiempo real usando salas remotas.</p>
            </div>
            <button (click)="playOnline()" 
                    [disabled]="!isSupabaseConfigured"
                    class="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-teal-600/20 active:scale-98 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              JUGAR MULTIJUGADOR
            </button>
          </div>
        </div>

        <!-- SECCIÓN DERECHA: COLECCIÓN Y AJUSTES -->
        <div class="flex flex-col gap-4">
          <!-- Colección y Mazos -->
          <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-teal-500/30 transition-all duration-300">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-bold font-display text-slate-200">Colección & Mazo</h3>
              <span class="text-xs font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                {{ deckSize() }} / 25 cartas
              </span>
            </div>
            <p class="text-xs text-slate-400 mb-4">Inspecciona los 151 Pokémon y construye tu mazo de combate definitivo de 25 cartas.</p>
            <div class="flex gap-2">
              <a routerLink="/collection" class="flex-1 text-center py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-all duration-200">
                Colección
              </a>
              <button (click)="generateRandomDeck()" class="flex-1 text-center py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-all duration-200">
                Mazo Rápido
              </button>
            </div>
          </div>

          <!-- Historial -->
          <a routerLink="/history" class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 block hover:border-teal-500/30 transition-all duration-300">
            <h3 class="text-lg font-bold font-display text-slate-200 mb-1">Historial de Partidas</h3>
            <p class="text-xs text-slate-400">Consulta tus estadísticas, victorias locales y emparejamientos en línea.</p>
          </a>

          <!-- Ayuda / Reglas -->
          <a routerLink="/help" class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 block hover:border-teal-500/30 transition-all duration-300">
            <h3 class="text-lg font-bold font-display text-slate-200 mb-1">Guía y Reglas del Juego</h3>
            <p class="text-xs text-slate-400">Aprende cómo invocar, atacar, activar habilidades y dominar el campo de batalla.</p>
          </a>

          <!-- Configuración de Supabase -->
          <a routerLink="/settings" class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 block hover:border-teal-500/30 transition-all duration-300">
            <h3 class="text-lg font-bold font-display text-slate-200 mb-1">Configuración</h3>
            <p class="text-xs text-slate-400">Vincula tu proyecto de Supabase para activar la autenticación y el juego en línea.</p>
          </a>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  isCaching = signal(true);
  cacheProgress = signal(0);
  deckSize = signal(0);
  isSupabaseConfigured = false;

  constructor(
    private sqliteService: SqliteService,
    private pokeApiService: PokeApiService,
    private deckService: DeckService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    // 1. Initialize SQLite
    await this.sqliteService.initialize();
    
    // 2. Initialize Supabase Service
    this.isSupabaseConfigured = await this.supabaseService.initialize();

    // 3. Cache Pokémon from PokeAPI
    this.isCaching.set(true);
    await this.pokeApiService.cache151PokemonIfNeeded((p) => {
      this.cacheProgress.set(p);
    });
    this.isCaching.set(false);

    // 4. Update deck information
    this.updateDeckInfo();
  }

  updateDeckInfo() {
    const deckIds = this.deckService.getLocalDeckIds();
    this.deckSize.set(deckIds.length);
  }

  generateRandomDeck() {
    this.deckService.generateRandomDeck();
    this.updateDeckInfo();
    alert('¡Se ha generado un mazo aleatorio de 25 cartas para ti!');
  }

  playCpu() {
    if (!this.deckService.isDeckValid()) {
      alert('Debes tener exactamente 25 cartas en tu mazo antes de jugar. Puedes usar "Mazo Rápido" en el menú o visitar la sección de Colección.');
      return;
    }
    this.router.navigate(['/game/cpu']);
  }

  playOnline() {
    if (!this.deckService.isDeckValid()) {
      alert('Debes tener exactamente 25 cartas en tu mazo antes de jugar. Puedes usar "Mazo Rápido" en el menú o visitar la sección de Colección.');
      return;
    }
    this.router.navigate(['/game/online']);
  }
}
