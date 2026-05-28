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
    <div class="max-w-7xl mx-auto space-y-8 animate-fade-in px-2 sm:px-4">
      
      <!-- 1. WELCOME LOBBY HERO BANNER -->
      <div class="bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-slate-100 shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- Background decorative blur elements -->
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute left-1/4 -top-20 w-80 h-80 bg-slate-800/15 rounded-full blur-3xl pointer-events-none"></div>

        <div class="lg:col-span-8 space-y-5 relative z-10">
          <div class="flex flex-wrap gap-2 items-center">
            <span class="px-3 py-1 bg-indigo-650/15 text-indigo-400 border border-indigo-500/20 text-[10px] rounded-full font-bold uppercase tracking-wider">
              PokeGame Lobby
            </span>
            <span class="px-3 py-1 bg-slate-850 text-slate-400 border border-slate-800 text-[10px] rounded-full font-bold uppercase tracking-wider">
              Versión 2.0
            </span>
          </div>
          
          <h1 class="text-3xl md:text-5xl font-black tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-50 to-slate-350">
            ¡BIENVENIDO, ENTRENADOR!
          </h1>
          <p class="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-xl">
            Prepárate para la arena en PokeGame. Gestiona tu colección, crea un mazo letal de 25 cartas y enfréntate a la IA en combates tácticos o desafía a jugadores reales en salas multijugador remotas.
          </p>

          <!-- Status badges grid -->
          <div class="grid grid-cols-3 gap-3 pt-2 max-w-md">
            <div class="bg-slate-950/45 border border-slate-850 p-2.5 rounded-2xl text-center">
              <span class="block text-[9px] text-slate-550 font-bold uppercase tracking-wider">Pokédex</span>
              <span class="font-mono text-sm font-bold text-slate-205">151 Cargas</span>
            </div>
            <div class="bg-slate-950/45 border border-slate-850 p-2.5 rounded-2xl text-center">
              <span class="block text-[9px] text-slate-550 font-bold uppercase tracking-wider">Base de Datos</span>
              <span class="font-mono text-sm font-bold text-slate-205">SQLite WASM</span>
            </div>
            <div class="bg-slate-950/45 border border-slate-850 p-2.5 rounded-2xl text-center">
              <span class="block text-[9px] text-slate-550 font-bold uppercase tracking-wider">Red Remota</span>
              <span class="font-mono text-sm font-bold text-slate-205">Supabase Realtime</span>
            </div>
          </div>
        </div>

        <!-- Right Side: 3D Mascot Floating Card (Visible on Desktop) -->
        <div class="lg:col-span-4 hidden lg:flex items-center justify-center relative w-full h-full py-4">
          <!-- Floating card backglow -->
          <div class="absolute w-44 h-44 bg-indigo-600/15 rounded-full blur-2xl animate-pulse"></div>
          
          <div class="w-56 h-80 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-105 hover:border-indigo-500/40 group card-shadow-premium transform -rotate-3 hover:rotate-0">
            <!-- Card Type Header -->
            <div class="flex justify-between items-center mb-2">
              <span class="text-[9px] font-black uppercase tracking-widest text-slate-500">Mascota Oficial</span>
              <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20 font-mono">Eléctrico</span>
            </div>
            <!-- Card Image Area with custom slate frame -->
            <div class="w-full h-36 bg-slate-950/90 rounded-xl flex items-center justify-center p-2 mb-3 border border-slate-850 shadow-inner group-hover:bg-slate-950 transition-colors">
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" 
                   class="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(234,179,8,0.2)] group-hover:scale-110 transition-transform duration-300">
            </div>
            <!-- Card Details -->
            <div class="space-y-1.5">
              <h3 class="font-bold text-sm tracking-wide text-slate-100 uppercase font-display flex justify-between items-center">
                <span>Pikachu</span>
                <span class="text-xs font-mono font-bold text-amber-400">HP 60</span>
              </h3>
              <div class="text-[10px] text-slate-400 leading-relaxed font-semibold">
                <span class="text-indigo-400 font-bold">⚡ Impactrueno:</span> Lanza una descarga eléctrica que inflige 30 de daño.
              </div>
            </div>
          </div>
        </div>
      </div>
 
      <!-- 2. INITIAL CACHING SCREEN -->
      <div *ngIf="isCaching()" class="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl text-center space-y-6">
        <div class="relative w-16 h-16 mx-auto">
          <div class="absolute inset-0 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
          <div class="absolute inset-2 bg-slate-950 rounded-full flex items-center justify-center text-xs">🌀</div>
        </div>
        <div>
          <h3 class="text-lg font-bold text-slate-200 mb-1 font-display">Preparando Pokédex...</h3>
          <p class="text-xs text-slate-400 font-medium">Descargando y configurando los 151 Pokémon originales en tu base de datos local SQLite</p>
        </div>
        <div class="space-y-2">
          <div class="w-full bg-slate-950 border border-slate-850 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div class="bg-indigo-600 h-full rounded-full transition-all duration-300" 
                 [style.width.%]="cacheProgress() * 100"></div>
          </div>
          <span class="text-xs text-slate-400 block font-mono font-bold">{{ (cacheProgress() * 100) | number:'1.0-0' }}% completado</span>
        </div>
      </div>

      <!-- 3. DASHBOARD MAIN CONTENT -->
      <div *ngIf="!isCaching()" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- LEFT: PLAY MODES (8 cols) -->
        <div class="lg:col-span-8 space-y-6">
          <h2 class="text-xs font-black text-slate-500 uppercase tracking-widest px-1">CAMPOS DE BATALLA</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- CPU PLAY CARD -->
            <div class="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-2xl hover:border-rose-500/25 transition-all duration-300 group transform hover:-translate-y-1 relative overflow-hidden">
              <div class="absolute -right-8 -top-8 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all"></div>
              
              <div class="space-y-4 relative z-10">
                <div class="flex items-center justify-between">
                  <div class="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 text-2xl shadow-inner">
                    🤖
                  </div>
                  <span class="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] rounded-full font-bold uppercase tracking-wider">Local CPU</span>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-slate-200 font-display">SIMULACIÓN DE PRÁCTICA</h3>
                  <p class="text-xs text-slate-400 font-semibold leading-relaxed mt-2">
                    Enfréntate a la computadora impulsada por una IA estratégica. Es el campo ideal para testear el balance de tus cartas, practicar sin esperas y afinar tus combos de juego.
                  </p>
                </div>
              </div>
              
              <button (click)="playCpu()" 
                      class="w-full mt-8 py-3.5 bg-rose-600 hover:bg-rose-550 text-white font-bold rounded-xl shadow-md hover:shadow-rose-950/20 transition-all duration-200 tracking-wide text-xs uppercase cursor-pointer">
                Iniciar Partida Local
              </button>
            </div>

            <!-- ONLINE PLAY CARD -->
            <div class="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-2xl hover:border-indigo-500/25 transition-all duration-300 group transform hover:-translate-y-1 relative overflow-hidden">
              <div class="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all"></div>
              
              <div class="space-y-4 relative z-10">
                <div class="flex items-center justify-between">
                  <div class="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 text-2xl shadow-inner">
                    ⚔️
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span *ngIf="!isSupabaseConfigured" class="text-rose-400 text-[8px] bg-rose-550/10 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-bold">Offline</span>
                    <span class="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] rounded-full font-bold uppercase tracking-wider">Multijugador</span>
                  </div>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-slate-200 font-display">ARENA COMPETITIVA</h3>
                  <p class="text-xs text-slate-400 font-semibold leading-relaxed mt-2">
                    Conéctate y desafía a otros entrenadores del mundo en tiempo real. Utiliza el matchmaking por código de sala respaldado por las conexiones de sincronización en la nube de Supabase.
                  </p>
                </div>
              </div>
              
              <button (click)="playOnline()" 
                      [disabled]="!isSupabaseConfigured"
                      class="w-full mt-8 py-3.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-indigo-950/20 transition-all duration-200 tracking-wide text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                Entrar a Emparejamiento
              </button>
            </div>
          </div>
        </div>

        <!-- RIGHT: WIDGETS & STATS (4 cols) -->
        <div class="lg:col-span-4 space-y-6">
          <h2 class="text-xs font-black text-slate-500 uppercase tracking-widest px-1">LICENCIA DE ENTRENADOR</h2>
          
          <!-- Deck Summary Widget -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">🎴</span>
                <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">Estado de tu Mazo</span>
              </div>
              <span class="text-xs font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-400">
                {{ deckSize() }} / 25
              </span>
            </div>
            
            <p class="text-[11px] text-slate-450 font-semibold leading-relaxed">
              Necesitas armar un mazo compuesto por exactamente 25 cartas de Pokémon para poder entrar a los campos de batalla.
            </p>
            
            <!-- Quick Progress Bar of Deck -->
            <div class="w-full bg-slate-950 border border-slate-850 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div class="bg-indigo-500 h-full rounded-full transition-all duration-300" [style.width.%]="(deckSize() / 25) * 100"></div>
            </div>

            <div class="flex gap-2 pt-2">
              <a routerLink="/collection" class="flex-1 text-center py-2 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-all duration-200 shadow-sm">
                Colección
              </a>
              <button (click)="generateRandomDeck()" class="flex-1 text-center py-2 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-sm">
                Mazo Rápido
              </button>
            </div>
          </div>

          <!-- Shortcuts -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
            <h4 class="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 px-1">Lobby Directo</h4>
            
            <a routerLink="/history" class="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-950/40 border border-transparent hover:border-slate-850 transition-all group">
              <div class="flex items-center gap-3">
                <span class="text-lg">📊</span>
                <div class="text-xs">
                  <span class="block font-bold text-slate-200">Historial y Estadísticas</span>
                  <span class="text-[10px] text-slate-500 block mt-0.5 font-semibold">Resultados de tus duelos</span>
                </div>
              </div>
              <span class="text-slate-500 group-hover:text-slate-350 group-hover:translate-x-0.5 transition-all">→</span>
            </a>

            <a routerLink="/help" class="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-950/40 border border-transparent hover:border-slate-850 transition-all group">
              <div class="flex items-center gap-3">
                <span class="text-lg">📖</span>
                <div class="text-xs">
                  <span class="block font-bold text-slate-200">Manual y Reglas Oficiales</span>
                  <span class="text-[10px] text-slate-500 block mt-0.5 font-semibold">Aprende mecánicas de combate</span>
                </div>
              </div>
              <span class="text-slate-500 group-hover:text-slate-350 group-hover:translate-x-0.5 transition-all">→</span>
            </a>

            <a routerLink="/settings" class="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-950/40 border border-transparent hover:border-slate-850 transition-all group">
              <div class="flex items-center gap-3">
                <span class="text-lg">⚙️</span>
                <div class="text-xs">
                  <span class="block font-bold text-slate-200">Configurar Servidores</span>
                  <span class="text-[10px] text-slate-500 block mt-0.5 font-semibold">Ajustes y consolas de base de datos</span>
                </div>
              </div>
              <span class="text-slate-500 group-hover:text-slate-350 group-hover:translate-x-0.5 transition-all">→</span>
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
