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
    <div class="max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      <!-- 1. WELCOME DASHBOARD HERO BANNER -->
      <div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 md:p-8 text-white shadow-sm relative overflow-hidden">
        <!-- Background decorative blur elements -->
        <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute right-1/4 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-xl space-y-3 relative z-10">
          <span class="px-3 py-1 bg-white/20 text-white border border-white/10 text-[10px] rounded-full font-bold uppercase tracking-wider">
            Tablero Principal
          </span>
          <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight">
            ¡Hola, Entrenador!
          </h1>
          <p class="text-white/90 text-sm md:text-base font-semibold leading-relaxed">
            Bienvenido a PokeTese, la plataforma definitiva de duelos Pokémon estratégicos en tiempo real. Inspecciona tu Pokédex, arma tu mazo de combate de 25 cartas y enfréntate a oponentes locales o remotos.
          </p>
        </div>
      </div>

      <!-- 2. INITIAL CACHING SCREEN -->
      <div *ngIf="isCaching()" class="w-full max-w-md mx-auto bg-white border border-slate-200 p-8 rounded-3xl shadow-sm text-center">
        <div class="animate-spin text-indigo-600 text-4xl mb-4 inline-block">🌀</div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">Preparando Pokédex...</h3>
        <p class="text-xs text-slate-500 mb-6 font-semibold">Descargando y configurando los 151 Pokémon originales en tu base de datos local SQLite</p>
        <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-500 to-violet-600 h-full transition-all duration-300" 
               [style.width.%]="cacheProgress() * 100"></div>
        </div>
        <span class="text-xs text-slate-500 mt-3 block font-mono font-bold">{{ (cacheProgress() * 100) | number:'1.0-0' }}% completado</span>
      </div>

      <!-- 3. DASHBOARD MAIN CONTENT -->
      <div *ngIf="!isCaching()" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- LEFT: PLAY MODES (8 cols) -->
        <div class="lg:col-span-8 space-y-6">
          <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Modos de Juego Disponibles</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- CPU PLAY CARD -->
            <div class="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-rose-250 transition-all duration-300 group transform hover:-translate-y-1">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 text-2xl shadow-sm">
                    🤖
                  </div>
                  <span class="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] rounded-full font-bold uppercase tracking-wider">Local CPU</span>
                </div>
                <h3 class="text-xl font-bold text-slate-800">Duelo de Práctica (vs CPU)</h3>
                <p class="text-xs text-slate-550 font-semibold leading-relaxed">
                  Enfréntate a la computadora con una IA estratégica. Excelente modo para poner a prueba tus barajas experimentales, ensayar combos y afinar tus tácticas antes de los duelos reales.
                </p>
              </div>
              <button (click)="playCpu()" 
                      class="w-full mt-8 py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-650 text-white font-bold rounded-2xl shadow-sm hover:shadow-rose-500/10 active:scale-98 transition-all duration-200 tracking-wide text-xs uppercase">
                Iniciar Partida Local
              </button>
            </div>

            <!-- ONLINE PLAY CARD -->
            <div class="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-indigo-250 transition-all duration-300 group transform hover:-translate-y-1">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 text-2xl shadow-sm">
                    ⚔️
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span *ngIf="!isSupabaseConfigured" class="text-rose-650 text-[9px] bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg font-bold">Sin Supabase</span>
                    <span class="px-2.5 py-0.5 bg-indigo-50 text-indigo-650 border border-indigo-100 text-[10px] rounded-full font-bold uppercase tracking-wider">Multijugador</span>
                  </div>
                </div>
                <h3 class="text-xl font-bold text-slate-800">Duelo Multijugador (remoto)</h3>
                <p class="text-xs text-slate-550 font-semibold leading-relaxed">
                  Desafía a otros entrenadores en duelos competitivos en tiempo real con salas dedicadas de conexión mediante Supabase. Pon a prueba tus habilidades de forma seria y escala posiciones.
                </p>
              </div>
              <button (click)="playOnline()" 
                      [disabled]="!isSupabaseConfigured"
                      class="w-full mt-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-555 text-white font-bold rounded-xl shadow-sm hover:shadow-indigo-500/20 active:scale-98 transition-all duration-200 tracking-wide text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed">
                Entrar a Emparejamiento
              </button>
            </div>
          </div>
        </div>

        <!-- RIGHT: WIDGETS & STATS (4 cols) -->
        <div class="lg:col-span-4 space-y-6">
          <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Tu Perfil de Entrenador</h2>
          
          <!-- Deck Summary Widget -->
          <div class="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">🎴</span>
                <span class="text-sm font-bold text-slate-700">Estado de tu Mazo</span>
              </div>
              <span class="text-xs font-mono font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full text-indigo-650">
                {{ deckSize() }} / 25
              </span>
            </div>
            
            <p class="text-xs text-slate-500 font-bold leading-relaxed">
              El mazo de combate debe constar de exactamente 25 cartas de Pokémon para jugar.
            </p>
            
            <!-- Quick Progress Bar of Deck -->
            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div class="bg-indigo-600 h-full transition-all duration-300" [style.width.%]="(deckSize() / 25) * 100"></div>
            </div>

            <div class="flex gap-2 pt-2">
              <a routerLink="/collection" class="flex-1 text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-250 transition-all duration-200">
                Ver Colección
              </a>
              <button (click)="generateRandomDeck()" class="flex-1 text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-250 transition-all duration-200">
                Mazo Rápido
              </button>
            </div>
          </div>

          <!-- Shortcuts -->
          <div class="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Enlaces Rápidos</h4>
            
            <a routerLink="/history" class="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-150 transition-all group">
              <div class="flex items-center gap-3">
                <span class="text-lg">📊</span>
                <div class="text-xs">
                  <span class="block font-bold text-slate-700">Historial y Resultados</span>
                  <span class="text-[10px] text-slate-450 block mt-0.5 font-semibold">Mira tus estadísticas generales</span>
                </div>
              </div>
              <span class="text-slate-400 group-hover:text-slate-650 group-hover:translate-x-0.5 transition-all">→</span>
            </a>

            <a routerLink="/help" class="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-150 transition-all group">
              <div class="flex items-center gap-3">
                <span class="text-lg">📖</span>
                <div class="text-xs">
                  <span class="block font-bold text-slate-700">Guía y Reglas Oficiales</span>
                  <span class="text-[10px] text-slate-450 block mt-0.5 font-semibold">Aprende sobre fases, turnos y habilidades</span>
                </div>
              </div>
              <span class="text-slate-400 group-hover:text-slate-650 group-hover:translate-x-0.5 transition-all">→</span>
            </a>

            <a routerLink="/settings" class="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-150 transition-all group">
              <div class="flex items-center gap-3">
                <span class="text-lg">⚙️</span>
                <div class="text-xs">
                  <span class="block font-bold text-slate-700">Configuración</span>
                  <span class="text-[10px] text-slate-450 block mt-0.5 font-semibold">Vincula tu base de datos remota</span>
                </div>
              </div>
              <span class="text-slate-400 group-hover:text-slate-655 group-hover:translate-x-0.5 transition-all">→</span>
            </a>
          </div>

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
