import { Component, OnInit, OnDestroy, signal, WritableSignal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PokeApiService, Card } from '../services/poke-api.service';
import { DeckService } from '../services/deck.service';
import { SupabaseService } from '../services/supabase.service';
import { SqliteService } from '../services/sqlite.service';

interface GameState {
  p1: PlayerState;
  p2: PlayerState;
  status: 'waiting' | 'playing' | 'finished';
  turn: string; // userId of current turn player
  phase: 'draw' | 'main' | 'attack' | 'end';
  winner: string | null; // userId or 'CPU' or 'Player'
}

interface PlayerState {
  id: string | null;
  username: string;
  lp: number;
  deck: number[]; // card IDs
  hand: Card[];
  field: Card[]; // max 5 cards
  discarded: Card[];
  ready: boolean;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-4 min-h-[92vh] flex flex-col justify-between">
      
      <!-- 1. MATCHMAKING SCREEN (Only shown in online mode when not playing) -->
      <div *ngIf="isOnlineMode && !isPlaying()" class="max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 w-full">
        <h2 class="text-3xl font-bold font-display text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
          MULTIJUGADOR
        </h2>
        <p class="text-xs text-slate-400 text-center">Crea una sala de duelo o únete a una existente mediante código.</p>

        <div *ngIf="!currentUserProfile()" class="text-center py-4 bg-slate-950 rounded-2xl border border-slate-800">
          <p class="text-sm text-slate-400">Debes iniciar sesión para jugar en línea.</p>
          <a routerLink="/auth" class="text-teal-400 text-xs font-semibold hover:underline mt-2 inline-block">Iniciar Sesión / Registrarse →</a>
        </div>

        <div *ngIf="currentUserProfile()" class="space-y-4">
          <!-- Create Room -->
          <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <h3 class="font-bold text-slate-200 text-sm mb-2">Crear Nueva Sala</h3>
            <button (click)="createOnlineRoom()" [disabled]="loadingOnline()"
                    class="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-sm font-bold rounded-xl active:scale-98 transition-all">
              {{ loadingOnline() ? 'Creando sala...' : 'CREAR SALA' }}
            </button>
          </div>

          <!-- Join Room -->
          <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <h3 class="font-bold text-slate-200 text-sm">Unirse a una Sala</h3>
            <div class="flex gap-2">
              <input type="text" [(ngModel)]="roomCodeToJoin" placeholder="CÓDIGO" maxlength="6"
                     class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center text-slate-100 font-mono font-bold tracking-widest focus:outline-none focus:border-teal-500 uppercase">
              <button (click)="joinOnlineRoom()" [disabled]="loadingOnline() || !roomCodeToJoin"
                      class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition-all">
                UNIRSE
              </button>
            </div>
          </div>

          <!-- Waiting for Opponent -->
          <div *ngIf="currentRoomCode()" class="p-4 bg-teal-500/10 border border-teal-500/20 text-center rounded-2xl space-y-2">
            <p class="text-xs text-slate-400 font-bold uppercase tracking-wider">Código de tu Sala</p>
            <span class="text-3xl font-display font-black text-teal-400 tracking-widest block">{{ currentRoomCode() }}</span>
            <p class="text-xxs text-slate-400">Comparte este código con tu amigo para que pueda unirse a la batalla.</p>
            <div class="animate-pulse text-teal-400 text-xs mt-2">Esperando oponente...</div>
          </div>
        </div>

        <div class="text-center pt-2">
          <a routerLink="/" class="text-xs text-slate-500 hover:text-slate-300">Volver al Menú Principal</a>
        </div>
      </div>

      <!-- 2. GAME ARENA (CPU Mode OR Active Online Mode) -->
      <div *ngIf="isPlaying()" class="flex-1 flex flex-col gap-4">
        
        <!-- TOP: OPPONENT ROW -->
        <div class="bg-slate-900/50 border border-slate-850/60 rounded-3xl p-4 flex flex-col gap-2 relative">
          <!-- Opponent HUD -->
          <div class="flex justify-between items-center px-2">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 text-xl shadow-md">
                🤖
              </div>
              <div>
                <h4 class="font-bold text-sm tracking-wide text-slate-200">{{ opponentState().username }}</h4>
                <span class="text-[9px] px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded font-semibold text-rose-400 uppercase">Enemigo</span>
              </div>
            </div>
            
            <!-- Turn Indicator & Match Status -->
            <div class="text-center">
              <span *ngIf="isMyTurn()" class="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xxs font-bold rounded-full animate-pulse uppercase tracking-wider">Tu Turno</span>
              <span *ngIf="!isMyTurn()" class="px-3 py-1 bg-slate-850 text-slate-400 text-xxs font-bold rounded-full uppercase tracking-wider">Turno Rival</span>
              <div class="text-[10px] text-slate-500 mt-1 font-mono uppercase">Fase: {{ gameState.phase }}</div>
            </div>

            <!-- Life Points -->
            <div class="text-right">
              <span class="text-slate-500 text-[10px] uppercase font-bold tracking-wider font-mono">LP Rival</span>
              <div class="text-3xl font-black font-display tracking-wider" 
                   [ngClass]="opponentState().lp > 1000 ? 'text-red-500' : 'text-red-400 animate-pulse'">
                {{ opponentState().lp }}
              </div>
            </div>
          </div>

          <!-- Opponent Cards on Field (5 Slots) -->
          <div class="grid grid-cols-5 gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-850/60 min-h-[160px] relative">
            <div *ngFor="let slotIdx of [0,1,2,3,4]" 
                 (click)="selectOpponentFieldCard(slotIdx)"
                 class="rounded-xl flex flex-col items-center justify-center p-0.5 relative overflow-hidden transition-all duration-200"
                 [ngClass]="[
                   !opponentState().field[slotIdx] ? 'border border-dashed border-slate-800 bg-slate-900/10' : getCardFrameClass(opponentState().field[slotIdx].type),
                   opponentState().field[slotIdx] && attackingCard() ? 'ring-4 ring-red-500/60 hover:scale-102 cursor-pointer shadow-md' : '',
                   opponentState().field[slotIdx] && !attackingCard() ? 'shadow-md' : '',
                   opponentState().field[slotIdx] ? getCardAnimationClass(myRole === 'p1' ? 'p2' : 'p1', slotIdx) : ''
                 ]">
              
              <!-- If card in slot -->
              <ng-container *ngIf="opponentState().field[slotIdx] as card">
                <div class="relative w-full h-full rounded-[10px] bg-slate-950/95 p-1.5 flex flex-col justify-between items-center text-center overflow-hidden">
                  <div class="absolute inset-0 opacity-[0.03] filter blur-xl pointer-events-none" [ngClass]="getTypeBgClass(card.type)"></div>
                  
                  <!-- Header: Name & Type Icon -->
                  <div class="w-full flex justify-between items-center px-0.5 z-10">
                    <span class="text-[7px] font-black text-slate-300 truncate max-w-[45px] uppercase">{{ card.name }}</span>
                    <span class="text-[7px] font-bold text-amber-400 font-mono tracking-tighter">{{ getRarityStars(card.rarity) }}</span>
                  </div>

                  <!-- Card image (turned sideways if in defense mode) -->
                  <div class="h-16 flex items-center justify-center transition-transform duration-300 z-10"
                       [class.rotate-90]="card.position === 'defense'">
                    <img [src]="card.image" class="h-12 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  </div>

                  <!-- Footer Stats & Mode Badge -->
                  <div class="w-full flex justify-between items-center px-0.5 z-10 border-t border-slate-900/60 pt-1 mt-0.5">
                    <span class="text-[7px] font-bold px-1 py-0.2 rounded font-mono"
                          [ngClass]="card.position === 'attack' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'">
                      {{ card.position === 'attack' ? 'ATK' : 'DEF' }}
                    </span>
                    <div class="flex gap-1 text-[7px] font-mono font-bold text-slate-400">
                      <span *ngIf="card.position === 'attack'" class="text-red-400">A:{{ card.attack }}</span>
                      <span *ngIf="card.position === 'defense'" class="text-blue-400">D:{{ card.defense }}</span>
                    </div>
                  </div>
                </div>
              </ng-container>

              <!-- Empty slot label -->
              <span *ngIf="!opponentState().field[slotIdx]" class="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest">Libre</span>
            </div>
            
            <!-- Direct Attack Indicator Overlay -->
            <div *ngIf="attackingCard() && opponentState().field.length === 0" 
                 (click)="directAttackOpponent()"
                 class="absolute inset-0 bg-red-500/10 border-2 border-red-500/50 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-red-500/20 transition-all">
              <span class="text-sm font-bold text-red-400 font-display animate-pulse tracking-wider">⚔️ ¡HACER ATAQUE DIRECTO!</span>
            </div>
          </div>

          <!-- Opponent Hand Size & Deck/Graveyard Indicator -->
          <div class="flex justify-between items-center text-[10px] px-2 text-slate-400 font-mono">
            <div>Mano: {{ opponentState().hand.length }} cartas</div>
            <div>Mazo: {{ opponentState().deck.length }} | Cementerio: {{ opponentState().discarded.length }}</div>
          </div>
        </div>

        <!-- MIDDLE: SYSTEM LOGS / BANNER -->
        <div class="bg-slate-950 p-2.5 border border-slate-850 rounded-2xl text-center text-xs font-mono text-slate-300">
          🎮 <span class="text-teal-400 font-bold">Estado:</span> {{ logMessage() }}
        </div>

        <!-- BOTTOM: PLAYER ROW -->
        <div class="bg-slate-900/50 border border-slate-850/60 rounded-3xl p-4 flex flex-col gap-2 relative">
          <!-- Player HUD -->
          <div class="flex justify-between items-center px-2">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 text-xl shadow-md">
                👤
              </div>
              <div>
                <h4 class="font-bold text-sm tracking-wide text-slate-200">{{ playerState().username }}</h4>
                <span class="text-[9px] px-1.5 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded font-semibold text-teal-400 uppercase">Tú</span>
              </div>
            </div>

            <!-- Life Points -->
            <div class="text-right">
              <span class="text-slate-500 text-[10px] uppercase font-bold tracking-wider font-mono">Tus LP</span>
              <div class="text-3xl font-black font-display tracking-wider" 
                   [ngClass]="playerState().lp > 1000 ? 'text-teal-400' : 'text-rose-400 animate-pulse'">
                {{ playerState().lp }}
              </div>
            </div>
          </div>
                     <!-- Player Cards on Field (5 Slots) -->
          <div class="grid grid-cols-5 gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-850/60 min-h-[160px]">
            <div *ngFor="let slotIdx of [0,1,2,3,4]" 
                 (click)="selectPlayerFieldCard(slotIdx)"
                 class="rounded-xl flex flex-col items-center justify-center p-0.5 relative overflow-hidden transition-all duration-200"
                 [ngClass]="[
                   !playerState().field[slotIdx] ? 'border border-dashed border-slate-800 bg-slate-900/10' : getCardFrameClass(playerState().field[slotIdx].type),
                   playerState().field[slotIdx] && isMyTurn() ? 'cursor-pointer hover:scale-102 shadow-md' : '',
                   activeFieldSelection()?.slotIdx === slotIdx ? 'ring-4 ring-amber-400' : '',
                   playerState().field[slotIdx] ? getCardAnimationClass(myRole, slotIdx) : ''
                 ]">
              
              <!-- If card in slot -->
              <ng-container *ngIf="playerState().field[slotIdx] as card">
                <div class="relative w-full h-full rounded-[10px] bg-slate-950/95 p-1.5 flex flex-col justify-between items-center text-center overflow-hidden">
                  <div class="absolute inset-0 opacity-[0.03] filter blur-xl pointer-events-none" [ngClass]="getTypeBgClass(card.type)"></div>
                  
                  <!-- Header: Name & Type Icon -->
                  <div class="w-full flex justify-between items-center px-0.5 z-10">
                    <span class="text-[7px] font-black text-slate-300 truncate max-w-[45px] uppercase">{{ card.name }}</span>
                    <span class="text-[7px] font-bold text-amber-400 font-mono tracking-tighter">{{ getRarityStars(card.rarity) }}</span>
                  </div>

                  <!-- Card image (turned sideways if in defense mode) -->
                  <div class="h-16 flex items-center justify-center transition-transform duration-300 z-10"
                       [class.rotate-90]="card.position === 'defense'">
                    <img [src]="card.image" class="h-12 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  </div>

                  <!-- Footer Stats & Mode Badge -->
                  <div class="w-full flex justify-between items-center px-0.5 z-10 border-t border-slate-900/60 pt-1 mt-0.5">
                    <span class="text-[7px] font-bold px-1 py-0.2 rounded font-mono"
                          [ngClass]="card.position === 'attack' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'">
                      {{ card.position === 'attack' ? 'ATK' : 'DEF' }}
                    </span>
                    <div class="flex gap-1 text-[7px] font-mono font-bold text-slate-400">
                      <span *ngIf="card.position === 'attack'" class="text-red-400">A:{{ card.attack }}</span>
                      <span *ngIf="card.position === 'defense'" class="text-blue-400">D:{{ card.defense }}</span>
                    </div>
                  </div>
                </div>
              </ng-container>

              <!-- Empty slot label -->
              <span *ngIf="!playerState().field[slotIdx]" class="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest">Vacio</span>
            </div>
          </div>

          <!-- HAND: Cards in Hand -->
          <div class="bg-slate-950/80 p-3 rounded-2xl border border-slate-850/60 mt-2">
            <span class="text-xxs uppercase tracking-wider text-slate-500 font-bold block mb-2 px-1">Tu Mano (Haz clic para invocar)</span>
            <div class="flex gap-3 overflow-x-auto pb-2 min-h-[155px]">
              <div *ngFor="let card of playerState().hand; let i = index" 
                   (click)="summonCard(card, i)"
                   class="p-0.5 rounded-[14px] min-w-[100px] max-w-[100px] h-[145px] flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-2 hover:shadow-xl shadow-md"
                   [ngClass]="getCardFrameClass(card.type)">
                
                <div class="bg-slate-950/95 w-full h-full rounded-[12px] p-1.5 flex flex-col justify-between relative overflow-hidden">
                  <div class="absolute inset-0 opacity-[0.03] filter blur-xl pointer-events-none" [ngClass]="getTypeBgClass(card.type)"></div>
                  
                  <!-- Header: Name & Type Icon -->
                  <div class="w-full flex justify-between items-center z-10">
                    <span class="text-[7.5px] font-black text-slate-200 truncate max-w-[48px] uppercase">{{ card.name }}</span>
                    <span class="text-[7px] font-bold text-amber-400 font-mono tracking-tighter">{{ getRarityStars(card.rarity) }}</span>
                  </div>

                  <!-- Image Container -->
                  <div class="h-14 bg-slate-900/60 rounded border border-slate-900 flex items-center justify-center relative overflow-hidden z-10">
                    <img [src]="card.image" class="h-10 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  </div>

                  <!-- Footer Stats -->
                  <div class="grid grid-cols-2 gap-0.5 border-t border-slate-900/60 pt-1 text-[7px] font-mono font-bold z-10">
                    <div class="text-red-400">⚔️{{ card.attack }}</div>
                    <div class="text-blue-400">🛡️{{ card.defense }}</div>
                  </div>
                </div>
              </div>

              <div *ngIf="playerState().hand.length === 0" class="w-full text-center py-6 text-slate-600 text-xs italic font-medium">
                No tienes cartas en tu mano.
              </div>
            </div>
          </div>

          <!-- Active Card Action Panel (Only shown when a card on the field is selected) -->
          <div *ngIf="activeFieldSelection()" class="bg-slate-950 border border-slate-800 rounded-2xl p-4 mt-2 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
            <div class="flex items-center gap-3">
              <img [src]="activeFieldSelection()?.card?.image" class="h-12 w-auto">
              <div>
                <h4 class="font-bold text-sm text-slate-200">{{ activeFieldSelection()?.card?.name }}</h4>
                <p class="text-xs text-slate-400 leading-relaxed font-mono">
                  Habilidad: <span class="text-teal-400 font-bold">{{ activeFieldSelection()?.card?.skillName }}</span> - {{ activeFieldSelection()?.card?.skillDesc }}
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
              <!-- Change Position -->
              <button (click)="changePosition()" 
                      class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all">
                Cambiar Modo (ATK/DEF)
              </button>
              
              <!-- Activate Skill -->
              <button (click)="activateSkill()" 
                      [disabled]="hasUsedSkillThisTurn(activeFieldSelection()?.card?.id)"
                      class="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                ⚡ Habilidad
              </button>

              <!-- Attack -->
              <button (click)="startAttack()" 
                      *ngIf="activeFieldSelection()?.card?.position === 'attack'"
                      [disabled]="hasAttackedThisTurn(activeFieldSelection()?.card?.id)"
                      class="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                ⚔️ Atacar
              </button>

              <!-- Close -->
              <button (click)="clearSelection()" 
                      class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg transition-all border border-slate-850">
                ✕
              </button>
            </div>
          </div>

          <!-- Bottom bar: actions & turn controls -->
          <div class="flex justify-between items-center text-[10px] px-2 text-slate-400 font-mono mt-2">
            <div>Mazo: {{ playerState().deck.length }} | Cementerio: {{ playerState().discarded.length }}</div>
            <div class="flex gap-2">
              <button (click)="endPhase()" [disabled]="!isMyTurn()"
                      class="px-4 py-1.5 bg-teal-500 text-slate-950 font-bold rounded-lg hover:bg-teal-400 active:scale-98 transition-all disabled:opacity-40">
                {{ gameState.phase === 'attack' ? 'TERMINAR TURNO' : 'SIGUIENTE FASE' }}
              </button>
              <button (click)="surrender()" 
                      class="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold rounded-lg transition-all">
                RENDIRSE
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- 3. RESULT MODAL -->
      <div *ngIf="showResultModal()" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div class="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl animate-scale-up">
          <div class="text-6xl">{{ winner() === 'player' ? '🏆' : '💀' }}</div>
          <h3 class="text-3xl font-black font-display tracking-wider uppercase"
              [ngClass]="winner() === 'player' ? 'text-teal-400' : 'text-rose-500'">
            {{ winner() === 'player' ? '¡VICTORIA!' : '¡DERROTA!' }}
          </h3>
          <p class="text-sm text-slate-400 leading-relaxed">
            {{ winner() === 'player' 
              ? 'Has derrotado a tu oponente con éxito y ganado la partida.' 
              : 'Tu oponente te ha derrotado esta vez. ¡Sigue entrenando y reconstruye tu mazo!' }}
          </p>
          <div class="bg-slate-950 p-4 rounded-2xl border border-slate-850 font-mono text-xs text-left space-y-2">
            <div><span class="text-slate-500">Tus LP Finales:</span> <span class="font-bold text-teal-400">{{ playerState().lp }}</span></div>
            <div><span class="text-slate-500">LP Oponente:</span> <span class="font-bold text-red-400">{{ opponentState().lp }}</span></div>
            <div><span class="text-slate-500">Modo de Juego:</span> <span class="font-bold text-slate-300 uppercase">{{ isOnlineMode ? 'Online PvP' : 'vs Computadora' }}</span></div>
          </div>
          <button (click)="exitGame()" 
                  class="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl active:scale-98 transition-all">
            VOLVER AL MENÚ
          </button>
        </div>
      </div>

    </div>
  `
})
export class GameComponent implements OnInit, OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private pokeApiService = inject(PokeApiService);
  private deckService = inject(DeckService);
  private supabaseService = inject(SupabaseService);
  private sqliteService = inject(SqliteService);
  private router = inject(Router);

  isOnlineMode = false;
  
  // Game state representation
  gameState: GameState = {
    p1: { id: null, username: '', lp: 4000, deck: [], hand: [], field: [], discarded: [], ready: false },
    p2: { id: null, username: 'Computadora', lp: 4000, deck: [], hand: [], field: [], discarded: [], ready: false },
    status: 'waiting',
    turn: 'player',
    phase: 'draw',
    winner: null
  };

  // Online variables
  roomCodeToJoin = '';
  currentRoomCode = signal('');
  roomId = '';
  myRole: 'p1' | 'p2' = 'p1';
  currentUserProfile = this.supabaseService.currentUserProfile;
  loadingOnline = signal(false);
  realtimeSubscription: any = null;

  // Visual cues
  isPlaying = signal(false);
  showResultModal = signal(false);
  winner = signal<string | null>(null);
  logMessage = signal('Iniciando partida...');

  // User input controls
  activeFieldSelection = signal<{ slotIdx: number; card: Card } | null>(null);
  attackingCard = signal<Card | null>(null);
  summonLimitLeft = 1;
  usedSkillsThisTurn: number[] = [];
  attackedCardsThisTurn: number[] = [];

  // Animation tracking
  animatingAttackerRole: 'p1' | 'p2' | null = null;
  animatingAttackerSlot: number | null = null;
  animatingDefenderRole: 'p1' | 'p2' | null = null;
  animatingDefenderSlot: number | null = null;
  animatingDestroyedRole: 'p1' | 'p2' | null = null;
  animatingDestroyedSlot: number | null = null;

  constructor() {}

  async ngOnInit() {
    await this.sqliteService.initialize();
    this.isOnlineMode = this.router.url.includes('online');

    const configured = await this.supabaseService.initialize();
    if (this.isOnlineMode) {
      if (!configured) {
        alert('Supabase no está configurado. Ve a Configuración para enlazar tu base de datos.');
        this.router.navigate(['/settings']);
        return;
      }
      
      // Esperar a que la autenticación de Supabase se haya inicializado por completo
      while (!this.supabaseService.authInitialized()) {
        await new Promise(r => setTimeout(r, 100));
      }

      const user = this.currentUserProfile();
      if (!user) {
        alert('Debes registrarte o iniciar sesión para poder jugar partidas en línea.');
        this.router.navigate(['/auth']);
        return;
      }
    } else {
      // Local CPU game setup
      this.startCpuGame();
    }
  }

  ngOnDestroy() {
    this.cleanupRealtime();
  }

  // --- GETTERS RELATIVE TO ROLE ---
  playerState(): PlayerState {
    return this.myRole === 'p1' ? this.gameState.p1 : this.gameState.p2;
  }

  opponentState(): PlayerState {
    return this.myRole === 'p1' ? this.gameState.p2 : this.gameState.p1;
  }

  isMyTurn(): boolean {
    if (this.isOnlineMode) {
      const user = this.currentUserProfile();
      return this.gameState.turn === user?.id;
    } else {
      return this.gameState.turn === 'player';
    }
  }

  // --- LOCAL GAME LOGIC (vs CPU) ---
  startCpuGame() {
    const deck = this.deckService.getLocalDeck();
    if (deck.length !== 25) {
      alert('Tu mazo es inválido. Debe tener exactamente 25 cartas.');
      this.router.navigate(['/']);
      return;
    }

    // Load full details for CPU deck
    const allCards = this.pokeApiService.getAllCards();
    const cpuDeck = [...allCards].sort(() => 0.5 - Math.random()).slice(0, 25);

    this.gameState = {
      p1: {
        id: 'player',
        username: 'Entrenador',
        lp: 4000,
        deck: deck.map(c => c.id),
        hand: [],
        field: [],
        discarded: [],
        ready: true
      },
      p2: {
        id: 'cpu',
        username: 'Computadora AI',
        lp: 4000,
        deck: cpuDeck.map(c => c.id),
        hand: [],
        field: [],
        discarded: [],
        ready: true
      },
      status: 'playing',
      turn: 'player',
      phase: 'draw',
      winner: null
    };

    this.myRole = 'p1';
    this.isPlaying.set(true);

    // Draw initial 5 cards
    for (let i = 0; i < 5; i++) {
      this.drawCard('p1');
      this.drawCard('p2');
    }

    this.startPlayerTurn();
  }

  startPlayerTurn() {
    this.gameState.turn = 'player';
    this.gameState.phase = 'draw';
    this.summonLimitLeft = 1;
    this.usedSkillsThisTurn = [];
    this.attackedCardsThisTurn = [];
    this.logMessage.set('Tu Fase de Robo: has robado una carta.');
    this.drawCard('p1');

    setTimeout(() => {
      this.gameState.phase = 'main';
      this.logMessage.set('Tu Fase Principal: puedes invocar 1 monstruo o activar habilidades.');
    }, 1200);
  }

  startCpuTurn() {
    this.gameState.turn = 'cpu';
    this.gameState.phase = 'draw';
    this.logMessage.set('Fase de Robo de la Computadora...');
    this.drawCard('p2');

    setTimeout(() => {
      this.gameState.phase = 'main';
      this.logMessage.set('Fase Principal de la Computadora...');
      this.runCpuAiLogic();
    }, 1500);
  }

  // --- CPU AI DECISION ENGINE ---
  runCpuAiLogic() {
    const cpu = this.gameState.p2;

    // 1. SUMMON MONSTER (Max 1 normal summon per turn)
    if (cpu.field.length < 5 && cpu.hand.length > 0) {
      // Find highest stat monster in hand
      let bestIdx = 0;
      let maxStats = -1;
      cpu.hand.forEach((card, idx) => {
        const stats = card.attack + card.defense;
        if (stats > maxStats) {
          maxStats = stats;
          bestIdx = idx;
        }
      });

      const cardToSummon = cpu.hand[bestIdx];
      // Decide position: Defensive if LP is low or Defense stat is higher
      const position = (cpu.lp < 1500 || cardToSummon.defense > cardToSummon.attack) ? 'defense' : 'attack';
      
      // Move card from hand to field
      cardToSummon.position = position;
      cpu.field.push(cardToSummon);
      cpu.hand.splice(bestIdx, 1);
      this.logMessage.set(`La CPU ha invocado a ${cardToSummon.name} en Modo de ${position === 'attack' ? 'Ataque' : 'Defensa'}.`);
    }

    // 2. ACTIVATE SKILLS (If any monster on field)
    setTimeout(() => {
      // Randomly decide to activate a skill for one monster
      if (cpu.field.length > 0) {
        const randomCard = cpu.field[Math.floor(Math.random() * cpu.field.length)];
        this.executeSkillEffect('p2', randomCard);
      }

      // 3. ATTACK PHASE
      setTimeout(() => {
        this.gameState.phase = 'attack';
        this.logMessage.set('La Computadora entra en la Fase de Ataque...');

        // Perform attacks with all Attack position cards on CPU's field
        let attackPromises = Promise.resolve();

        cpu.field.forEach((cpuCard) => {
          if (cpuCard.position === 'attack') {
            attackPromises = attackPromises.then(() => {
              return new Promise<void>((resolve) => {
                setTimeout(() => {
                  this.runCpuCardAttack(cpuCard);
                  resolve();
                }, 1500);
              });
            });
          }
        });

        // 4. END PHASE
        attackPromises.then(() => {
          setTimeout(() => {
            this.gameState.phase = 'end';
            this.logMessage.set('La Computadora finaliza su turno.');
            
            // Check victory condition
            if (!this.checkGameEnded()) {
              this.startPlayerTurn();
            }
          }, 1500);
        });

      }, 1500);
    }, 1500);
  }

  runCpuCardAttack(cpuCard: Card) {
    const player = this.gameState.p1;
    const cpu = this.gameState.p2;
    const cpuIdx = cpu.field.findIndex(c => c.id === cpuCard.id);

    if (cpuIdx === -1) return;

    // Direct attack if Player's field is empty
    if (player.field.length === 0) {
      this.animatingAttackerRole = 'p2';
      this.animatingAttackerSlot = cpuIdx;
      this.logMessage.set(`¡${cpuCard.name} de la CPU declara un ataque directo!`);

      setTimeout(() => {
        this.animatingAttackerRole = null;
        this.animatingAttackerSlot = null;
        player.lp -= cpuCard.attack;
        this.logMessage.set(`¡${cpuCard.name} de la CPU te atacó directamente por ${cpuCard.attack} LP!`);
        this.checkGameEnded();
      }, 800);
      return;
    }

    // Find a target card (prioritize destroying something or targeting lowest defense/attack)
    let bestTargetIdx = 0;
    let maxAdvantage = -9999;

    player.field.forEach((playerCard, idx) => {
      let advantage = 0;
      if (playerCard.position === 'attack') {
        advantage = cpuCard.attack - playerCard.attack;
      } else {
        advantage = cpuCard.attack - playerCard.defense;
      }

      if (advantage > maxAdvantage) {
        maxAdvantage = advantage;
        bestTargetIdx = idx;
      }
    });

    const targetCard = player.field[bestTargetIdx];
    this.logMessage.set(`¡${cpuCard.name} de la CPU ataca a tu ${targetCard.name}!`);

    // 1. Iniciar animación de ataque
    this.animatingAttackerRole = 'p2';
    this.animatingAttackerSlot = cpuIdx;

    // 2. Al impactar (400ms), animar daño en el defensor
    setTimeout(() => {
      this.animatingDefenderRole = 'p1';
      this.animatingDefenderSlot = bestTargetIdx;
    }, 400);

    // 3. Resolver combate tras la animación (800ms)
    setTimeout(() => {
      this.animatingAttackerRole = null;
      this.animatingAttackerSlot = null;
      this.animatingDefenderRole = null;
      this.animatingDefenderSlot = null;

      let isDestroyed = false;
      let diff = 0;

      if (targetCard.position === 'attack') {
        if (cpuCard.attack > targetCard.attack) {
          diff = cpuCard.attack - targetCard.attack;
          player.lp -= diff;
          isDestroyed = true;
        } else if (cpuCard.attack < targetCard.attack) {
          // No damage, no destruction
          this.logMessage.set(`El ataque de ${cpuCard.name} contra tu ${targetCard.name} fue resistido.`);
        } else {
          // Both destroyed
          isDestroyed = true;
          cpu.discarded.push(cpuCard);
          if (cpuIdx !== -1) {
            this.animatingDestroyedRole = 'p2';
            this.animatingDestroyedSlot = cpuIdx;
            setTimeout(() => {
              cpu.field.splice(cpuIdx, 1);
              this.animatingDestroyedRole = null;
              this.animatingDestroyedSlot = null;
            }, 800);
          }
          
          player.discarded.push(targetCard);
          player.field.splice(bestTargetIdx, 1);
          this.logMessage.set(`¡Ambos Pokémon lucharon con la misma fuerza y fueron destruidos!`);
        }
      } else {
        // Defense mode
        if (cpuCard.attack > targetCard.defense) {
          diff = cpuCard.attack - targetCard.defense;
          player.lp -= diff;
          isDestroyed = true;
        } else if (cpuCard.attack < targetCard.defense) {
          this.logMessage.set(`La defensa de tu ${targetCard.name} resistió el ataque. El ataque de la CPU rebota sin daño.`);
        } else {
          this.logMessage.set(`El ataque rebotó en el escudo de tu ${targetCard.name}. Ninguno recibe daño.`);
        }
      }

      if (isDestroyed && targetCard.position === 'attack') {
        this.animatingDestroyedRole = 'p1';
        this.animatingDestroyedSlot = bestTargetIdx;
        this.logMessage.set(`¡Tu ${targetCard.name} fue destruido! Recibes ${diff} LP de daño.`);
        
        setTimeout(() => {
          player.discarded.push(targetCard);
          player.field.splice(bestTargetIdx, 1);
          this.animatingDestroyedRole = null;
          this.animatingDestroyedSlot = null;
          this.checkGameEnded();
        }, 800);
      } else if (isDestroyed && targetCard.position === 'defense') {
        this.animatingDestroyedRole = 'p1';
        this.animatingDestroyedSlot = bestTargetIdx;
        this.logMessage.set(`¡Tu ${targetCard.name} en Modo de Defensa fue destruido! Pierdes ${diff} LP por penetración.`);
        
        setTimeout(() => {
          player.discarded.push(targetCard);
          player.field.splice(bestTargetIdx, 1);
          this.animatingDestroyedRole = null;
          this.animatingDestroyedSlot = null;
          this.checkGameEnded();
        }, 800);
      } else {
        this.checkGameEnded();
      }
    }, 800);
  }

  // --- CORE GAME STATE TRANSACTIONS ---
  drawCard(playerKey: 'p1' | 'p2'): boolean {
    const state = this.gameState[playerKey];
    if (state.deck.length === 0) {
      this.declareWinner(playerKey === 'p1' ? 'opponent' : 'player');
      return false;
    }

    const nextId = state.deck.shift();
    if (nextId) {
      const card = this.pokeApiService.getCardById(nextId);
      if (card) {
        state.hand.push(card);
        return true;
      }
    }
    return false;
  }

  summonCard(card: Card, handIdx: number) {
    if (!this.isMyTurn() || this.gameState.phase !== 'main') {
      alert('No puedes invocar cartas fuera de tu Fase Principal.');
      return;
    }

    if (this.summonLimitLeft <= 0) {
      alert('Ya realizaste tu invocación normal de este turno (límite: 1).');
      return;
    }

    const state = this.playerState();
    if (state.field.length >= 5) {
      alert('Tu campo está lleno. No puedes tener más de 5 monstruos.');
      return;
    }

    const pos = confirm('¿Quieres invocar en Modo de Ataque? (Aceptar = Modo Ataque, Cancelar = Modo Defensa)');
    const cardToSummon = { ...card, position: (pos ? 'attack' : 'defense') as any };

    state.field.push(cardToSummon);
    state.hand.splice(handIdx, 1);
    this.summonLimitLeft--;

    this.logMessage.set(`Has invocado a ${card.name} en Modo de ${cardToSummon.position === 'attack' ? 'Ataque' : 'Defensa'}.`);
    this.clearSelection();

    if (this.isOnlineMode) {
      this.syncOnlineState();
    }
  }

  selectPlayerFieldCard(slotIdx: number) {
    const card = this.playerState().field[slotIdx];
    if (!card) {
      this.clearSelection();
      return;
    }
    this.activeFieldSelection.set({ slotIdx, card });
  }

  selectOpponentFieldCard(slotIdx: number) {
    const opponentCard = this.opponentState().field[slotIdx];
    if (!opponentCard) return;

    const attacker = this.attackingCard();
    if (attacker) {
      // Execute attack from attackingCard onto opponentCard
      this.executeAttack(attacker, opponentCard, slotIdx);
    }
  }

  clearSelection() {
    this.activeFieldSelection.set(null);
    this.attackingCard.set(null);
  }

  changePosition() {
    const sel = this.activeFieldSelection();
    if (!sel || !this.isMyTurn() || this.gameState.phase !== 'main') return;

    const currentPos = sel.card.position;
    sel.card.position = currentPos === 'attack' ? 'defense' : 'attack';
    this.logMessage.set(`${sel.card.name} cambió su posición a Modo de ${sel.card.position === 'attack' ? 'Ataque' : 'Defensa'}.`);
    this.clearSelection();

    if (this.isOnlineMode) {
      this.syncOnlineState();
    }
  }

  activateSkill() {
    const sel = this.activeFieldSelection();
    if (!sel || !this.isMyTurn() || this.gameState.phase !== 'main') return;

    const pKey = this.myRole;
    this.executeSkillEffect(pKey, sel.card);
    this.usedSkillsThisTurn.push(sel.card.id);
    this.clearSelection();

    if (this.isOnlineMode) {
      this.syncOnlineState();
    }
  }

  hasUsedSkillThisTurn(cardId: number | undefined): boolean {
    if (!cardId) return true;
    return this.usedSkillsThisTurn.includes(cardId);
  }

  executeSkillEffect(playerKey: 'p1' | 'p2', card: Card) {
    const player = this.gameState[playerKey];
    const opponent = this.gameState[playerKey === 'p1' ? 'p2' : 'p1'];

    this.logMessage.set(`¡${player.username} activa la habilidad [${card.skillName}] de ${card.name}!`);

    switch (card.skillName) {
      case 'Llamarada':
        opponent.lp -= 300;
        this.logMessage.set(`[Llamarada] infligió 300 de daño a los LP de ${opponent.username}.`);
        break;
      case 'Hidrobomba':
        player.lp = Math.min(4000, player.lp + 400);
        this.logMessage.set(`[Hidrobomba] restauró 400 LP a ${player.username}.`);
        break;
      case 'Drenado':
        const drawn = this.drawCard(playerKey);
        if (drawn) {
          this.logMessage.set(`[Drenado] permitió a ${player.username} robar 1 carta adicional.`);
        }
        break;
      case 'Impactrueno':
        // Paralyze first opponent monster on field
        if (opponent.field.length > 0) {
          opponent.field[0].paralyzed = true;
          this.logMessage.set(`[Impactrueno] paralizó a ${opponent.field[0].name}. No podrá atacar el siguiente turno.`);
        } else {
          this.logMessage.set(`[Impactrueno] falló porque el oponente no tiene Pokémon en el campo.`);
        }
        break;
      case 'Escudo Psíquico':
        card.defense += 500;
        this.logMessage.set(`[Escudo Psíquico] aumentó la DEF de ${card.name} en 500 permanentemente.`);
        break;
      case 'Furia Dragón':
      default:
        card.attack += 400;
        this.logMessage.set(`[Furia Dragón] aumentó el ATK de ${card.name} en 400 permanentemente.`);
        break;
    }

    this.checkGameEnded();
  }

  startAttack() {
    const sel = this.activeFieldSelection();
    if (!sel || !this.isMyTurn() || this.gameState.phase !== 'main') return;

    // Go to attack phase automatically if not already there
    this.gameState.phase = 'attack';
    this.attackingCard.set(sel.card);
    this.logMessage.set(`Selecciona un objetivo del rival para atacar con ${sel.card.name}.`);

    // If opponent has no monsters, direct attack can be made
    if (this.opponentState().field.length === 0) {
      this.logMessage.set(`${sel.card.name} puede atacar directamente. Haz clic en el indicador de ataque directo.`);
    }
  }

  hasAttackedThisTurn(cardId: number | undefined): boolean {
    if (!cardId) return true;
    return this.attackedCardsThisTurn.includes(cardId);
  }

  executeAttack(attacker: Card, defender: Card, targetSlotIdx: number) {
    if (!this.isMyTurn() || this.gameState.phase !== 'attack') return;

    const me = this.playerState();
    const opponent = this.opponentState();
    const attackerSlotIdx = me.field.findIndex(c => c.id === attacker.id);

    if (attackerSlotIdx === -1) return;

    this.logMessage.set(`¡${attacker.name} declara un ataque contra ${defender.name}!`);

    const attackerRole = this.myRole;
    const defenderRole = this.myRole === 'p1' ? 'p2' : 'p1';

    // 1. Iniciar animación de ataque
    this.animatingAttackerRole = attackerRole;
    this.animatingAttackerSlot = attackerSlotIdx;

    // 2. Al impactar (400ms), animar daño en el defensor
    setTimeout(() => {
      this.animatingDefenderRole = defenderRole;
      this.animatingDefenderSlot = targetSlotIdx;
    }, 400);

    // 3. Resolver combate tras la animación de ataque (800ms)
    setTimeout(() => {
      this.animatingAttackerRole = null;
      this.animatingAttackerSlot = null;
      this.animatingDefenderRole = null;
      this.animatingDefenderSlot = null;

      let isDestroyed = false;
      let diff = 0;

      if (defender.position === 'attack') {
        if (attacker.attack > defender.attack) {
          diff = attacker.attack - defender.attack;
          opponent.lp -= diff;
          isDestroyed = true;
        } else if (attacker.attack < defender.attack) {
          // No damage, no destruction
          this.logMessage.set(`El ataque de tu ${attacker.name} fue resistido por ${defender.name}.`);
        } else {
          // both destroyed
          isDestroyed = true;
          const attIdx = me.field.findIndex(c => c.id === attacker.id);
          me.discarded.push(attacker);
          if (attIdx !== -1) {
            this.animatingDestroyedRole = attackerRole;
            this.animatingDestroyedSlot = attIdx;
            setTimeout(() => {
              me.field.splice(attIdx, 1);
              this.animatingDestroyedRole = null;
              this.animatingDestroyedSlot = null;
              if (this.isOnlineMode) this.syncOnlineState();
            }, 800);
          }
          
          opponent.discarded.push(defender);
          opponent.field.splice(targetSlotIdx, 1);
          this.logMessage.set(`¡Ambos monstruos se destruyeron mutuamente!`);
        }
      } else {
        // Defense mode
        if (attacker.attack > defender.defense) {
          diff = attacker.attack - defender.defense;
          opponent.lp -= diff;
          isDestroyed = true;
        } else if (attacker.attack < defender.defense) {
          this.logMessage.set(`La defensa de ${defender.name} resistió el ataque. Tu ataque rebota sin daño.`);
        } else {
          this.logMessage.set(`Ataque bloqueado. Ningún monstruo fue dañado.`);
        }
      }

      if (isDestroyed && defender.position === 'attack') {
        this.animatingDestroyedRole = defenderRole;
        this.animatingDestroyedSlot = targetSlotIdx;
        this.logMessage.set(`¡${defender.name} fue destruido! Oponente pierde ${diff} LP.`);
        
        setTimeout(() => {
          opponent.discarded.push(defender);
          opponent.field.splice(targetSlotIdx, 1);
          this.animatingDestroyedRole = null;
          this.animatingDestroyedSlot = null;
          this.checkGameEnded();
          if (this.isOnlineMode) this.syncOnlineState();
        }, 800);
      } else if (isDestroyed && defender.position === 'defense') {
        this.animatingDestroyedRole = defenderRole;
        this.animatingDestroyedSlot = targetSlotIdx;
        this.logMessage.set(`¡El escudo de ${defender.name} se rompió! Es enviado al cementerio y oponente pierde ${diff} LP por penetración.`);
        
        setTimeout(() => {
          opponent.discarded.push(defender);
          opponent.field.splice(targetSlotIdx, 1);
          this.animatingDestroyedRole = null;
          this.animatingDestroyedSlot = null;
          this.checkGameEnded();
          if (this.isOnlineMode) this.syncOnlineState();
        }, 800);
      } else {
        this.checkGameEnded();
        if (this.isOnlineMode) this.syncOnlineState();
      }

      this.attackedCardsThisTurn.push(attacker.id);
      this.clearSelection();
    }, 800);
  }

  directAttackOpponent() {
    const attacker = this.attackingCard();
    if (!attacker || !this.isMyTurn() || this.gameState.phase !== 'attack') return;

    const me = this.playerState();
    const opponent = this.opponentState();
    const attackerSlotIdx = me.field.findIndex(c => c.id === attacker.id);

    if (attackerSlotIdx === -1) return;

    this.logMessage.set(`¡${attacker.name} declara un ataque directo!`);

    // Iniciar animación de ataque
    this.animatingAttackerRole = this.myRole;
    this.animatingAttackerSlot = attackerSlotIdx;

    setTimeout(() => {
      this.animatingAttackerRole = null;
      this.animatingAttackerSlot = null;

      opponent.lp -= attacker.attack;
      this.logMessage.set(`¡${attacker.name} atacó directamente por ${attacker.attack} LP!`);
      
      this.attackedCardsThisTurn.push(attacker.id);
      this.clearSelection();
      this.checkGameEnded();

      if (this.isOnlineMode) {
        this.syncOnlineState();
      }
    }, 800);
  }

  endPhase() {
    if (!this.isMyTurn()) return;

    if (this.gameState.phase === 'main') {
      this.gameState.phase = 'attack';
      this.logMessage.set('Fase de Ataque: puedes elegir tus monstruos para declarar combates.');
    } else if (this.gameState.phase === 'attack') {
      this.gameState.phase = 'end';
      this.logMessage.set('Finalizando turno...');
      
      setTimeout(() => {
        if (this.isOnlineMode) {
          // Shift turn to opponent
          this.gameState.turn = this.opponentState().id!;
          this.gameState.phase = 'draw';
          // Draw a card for the opponent
          this.drawCard(this.myRole === 'p1' ? 'p2' : 'p1');
          this.syncOnlineState();
        } else {
          this.startCpuTurn();
        }
      }, 1000);
    }
  }

  surrender() {
    if (confirm('¿Estás seguro de que quieres rendirte? Cuenta como derrota.')) {
      this.declareWinner(this.myRole === 'p1' ? 'opponent' : 'player');
    }
  }

  // --- CHECK GAME WINNER ---
  checkGameEnded(): boolean {
    const p1 = this.gameState.p1;
    const p2 = this.gameState.p2;

    if (p1.lp <= 0) {
      this.declareWinner('opponent');
      return true;
    }
    if (p2.lp <= 0) {
      this.declareWinner('player');
      return true;
    }
    return false;
  }

  declareWinner(winnerKey: 'player' | 'opponent') {
    this.gameState.status = 'finished';
    const isPlayerWin = winnerKey === 'player';
    
    this.winner.set(isPlayerWin ? 'player' : 'opponent');
    this.showResultModal.set(true);

    if (this.isOnlineMode) {
      const winnerId = isPlayerWin ? this.currentUserProfile().id : this.opponentState().id;
      this.supabaseService.finishRoomMatch(this.roomId, winnerId);
    } else {
      // Local match record
      try {
        const today = new Date().toISOString();
        const p1Lp = this.gameState.p1.lp;
        const p2Lp = this.gameState.p2.lp;
        this.sqliteService.run(
          `INSERT INTO local_match_history (opponent_name, player_lp, opponent_lp, winner, date) 
           VALUES (?, ?, ?, ?, ?)`,
          ['Computadora AI', p1Lp, p2Lp, isPlayerWin ? 'Jugador' : 'Computadora', today]
        );
        console.log('CPU match result recorded locally');
      } catch (e) {
        console.error('Failed to record match history locally:', e);
      }
    }
  }

  exitGame() {
    this.isPlaying.set(false);
    this.showResultModal.set(false);
    this.router.navigate(['/']);
  }

  // --- ONLINE SUPABASE REALTIME MATCHMAKING ---
  async createOnlineRoom() {
    const deck = this.deckService.getLocalDeckIds();
    const user = this.currentUserProfile();
    if (!user || deck.length !== 25) return;

    this.loadingOnline.set(true);
    try {
      const room = await this.supabaseService.createRoom(user.id, deck);
      this.roomId = room.id;
      this.currentRoomCode.set(room.room_code);
      this.myRole = 'p1';
      this.setupRealtimeSubscription();
    } catch (e: any) {
      alert('Error al crear sala: ' + e.message);
    } finally {
      this.loadingOnline.set(false);
    }
  }

  async joinOnlineRoom() {
    const code = this.roomCodeToJoin.trim().toUpperCase();
    const deck = this.deckService.getLocalDeckIds();
    const user = this.currentUserProfile();
    if (!user || deck.length !== 25 || !code) return;

    this.loadingOnline.set(true);
    try {
      const room = await this.supabaseService.joinRoom(code, user.id, deck);
      this.roomId = room.id;
      this.currentRoomCode.set(room.room_code);
      this.myRole = 'p2';

      // Join successful, initialize our hand
      const initialGameState = room.game_state;
      this.gameState = initialGameState;

      // Draw initial cards
      for (let i = 0; i < 5; i++) {
        this.drawCard('p1');
        this.drawCard('p2');
      }

      this.gameState.status = 'playing';
      // Sync names
      const opponentProfile = await this.supabaseService.getUserProfile(room.player_1_id);
      this.gameState.p1.username = opponentProfile.username;
      this.gameState.p2.username = user.username;

      this.isPlaying.set(true);
      this.logMessage.set('¡Conexión establecida! Comienza el duelo.');

      // Push initial layout to DB
      await this.supabaseService.updateGameState(this.roomId, this.gameState, room.player_1_id);

      this.setupRealtimeSubscription();
    } catch (e: any) {
      alert('Error al unirse: ' + e.message);
    } finally {
      this.loadingOnline.set(false);
    }
  }

  setupRealtimeSubscription() {
    this.cleanupRealtime();

    this.realtimeSubscription = this.supabaseService.client
      .channel(`room:${this.roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${this.roomId}`
      }, async (payload: any) => {
        const newRoom = payload.new;
        if (newRoom) {
          const remoteState = newRoom.game_state;
          
          // Match started when player 2 joined
          if (newRoom.status === 'playing' && !this.isPlaying()) {
            this.gameState = remoteState;
            
            // Set up usernames
            const oppId = this.myRole === 'p1' ? newRoom.player_2_id : newRoom.player_1_id;
            const oppProfile = await this.supabaseService.getUserProfile(oppId);
            const user = this.currentUserProfile();

            this.gameState.p1.username = user.username;
            this.gameState.p2.username = oppProfile.username;

            this.isPlaying.set(true);
            this.logMessage.set('¡Oponente encontrado! La batalla comienza.');
          } else if (newRoom.status === 'finished') {
            // Match finished
            this.gameState = remoteState;
            const isWinner = newRoom.winner_id === this.currentUserProfile().id;
            this.winner.set(isWinner ? 'player' : 'opponent');
            this.showResultModal.set(true);
            this.cleanupRealtime();
          } else {
            // Standard state synchronization during gameplay
            this.gameState = remoteState;
            if (this.isMyTurn()) {
              this.logMessage.set('Es tu turno. Fase Principal.');
              this.summonLimitLeft = 1;
              this.usedSkillsThisTurn = [];
              this.attackedCardsThisTurn = [];
            } else {
              this.logMessage.set('Esperando el movimiento del oponente...');
            }
          }
        }
      })
      .subscribe();
  }

  syncOnlineState() {
    this.supabaseService.updateGameState(this.roomId, this.gameState, this.gameState.turn);
  }

  cleanupRealtime() {
    if (this.realtimeSubscription) {
      this.supabaseService.client.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
    }
  }

  getTypeBgClass(type: string): string {
    switch (type) {
      case 'fire': return 'bg-red-500';
      case 'water': return 'bg-blue-500';
      case 'grass': return 'bg-emerald-500';
      case 'electric': return 'bg-yellow-500';
      case 'psychic': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  }

  getTypeEmoji(type: string): string {
    switch (type.toLowerCase()) {
      case 'fire': return '🔥 FUEGO';
      case 'water': return '💧 AGUA';
      case 'grass': return '🌿 PLANTA';
      case 'electric': return '⚡ ELECT.';
      case 'psychic': return '👁️ PSIC.';
      case 'normal': return '⚙️ NORMAL';
      case 'poison': return '☠️ VENENO';
      case 'ground': return '⛰️ TIERRA';
      case 'flying': return '💨 VOLAD.';
      case 'bug': return '🐛 BICHO';
      case 'rock': return '🪨 ROCA';
      case 'ghost': return '👻 FANT.';
      case 'dragon': return '🐉 DRAGÓN';
      case 'steel': return '⛓️ ACERO';
      case 'fairy': return '✨ HADA';
      case 'ice': return '❄️ HIELO';
      default: return '🛡️ ' + type.toUpperCase();
    }
  }

  getCardFrameClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'fire': return 'bg-gradient-to-br from-red-600 via-orange-500 to-yellow-600 shadow-red-500/15';
      case 'water': return 'bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 shadow-blue-500/15';
      case 'grass': return 'bg-gradient-to-br from-green-600 via-emerald-500 to-teal-600 shadow-green-500/15';
      case 'electric': return 'bg-gradient-to-br from-yellow-500 via-amber-400 to-orange-500 shadow-yellow-500/15';
      case 'psychic': return 'bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-600 shadow-purple-500/15';
      case 'poison': return 'bg-gradient-to-br from-fuchsia-800 via-purple-700 to-violet-800 shadow-purple-800/15';
      case 'ground': return 'bg-gradient-to-br from-amber-800 via-amber-700 to-yellow-800 shadow-amber-800/15';
      case 'flying': return 'bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-400 shadow-indigo-400/15';
      case 'bug': return 'bg-gradient-to-br from-lime-600 via-lime-500 to-emerald-600 shadow-lime-600/15';
      case 'rock': return 'bg-gradient-to-br from-stone-600 via-stone-500 to-stone-700 shadow-stone-600/15';
      case 'ghost': return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 shadow-indigo-950/15';
      case 'dragon': return 'bg-gradient-to-br from-indigo-700 via-red-500 to-amber-500 shadow-indigo-600/15';
      case 'steel': return 'bg-gradient-to-br from-slate-400 via-zinc-400 to-neutral-400 shadow-zinc-400/15';
      case 'fairy': return 'bg-gradient-to-br from-pink-400 via-fuchsia-300 to-rose-400 shadow-pink-300/15';
      case 'ice': return 'bg-gradient-to-br from-cyan-400 via-sky-300 to-blue-400 shadow-cyan-300/15';
      default: return 'bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700 shadow-slate-500/15';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'fire': return 'bg-red-500/20 text-red-300 border-red-500/35';
      case 'water': return 'bg-blue-500/20 text-blue-300 border-blue-500/35';
      case 'grass': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35';
      case 'electric': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/35';
      case 'psychic': return 'bg-purple-500/20 text-purple-300 border-purple-500/35';
      case 'poison': return 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/35';
      case 'ground': return 'bg-amber-700/20 text-amber-300 border-amber-700/35';
      case 'flying': return 'bg-sky-500/20 text-sky-300 border-sky-500/35';
      case 'bug': return 'bg-lime-500/20 text-lime-300 border-lime-500/35';
      case 'rock': return 'bg-stone-500/20 text-stone-300 border-stone-500/35';
      case 'ghost': return 'bg-indigo-950/40 text-indigo-300 border-indigo-800/35';
      case 'dragon': return 'bg-violet-950/40 text-violet-300 border-violet-800/35';
      case 'steel': return 'bg-slate-500/20 text-slate-300 border-slate-500/35';
      case 'fairy': return 'bg-pink-500/20 text-pink-300 border-pink-500/35';
      case 'ice': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/35';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/35';
    }
  }

  getRarityStars(rarity: string): string {
    switch (rarity) {
      case 'Common': return '⭐';
      case 'Rare': return '⭐⭐';
      case 'Legendary': return '⭐⭐⭐';
      default: return '⭐';
    }
  }

  getCardAnimationClass(role: 'p1' | 'p2', slotIdx: number): string {
    // Attack animations
    if (this.animatingAttackerRole === role && this.animatingAttackerSlot === slotIdx) {
      return role === this.myRole ? 'animate-player-attack' : 'animate-cpu-attack';
    }

    // Damage animations
    if (this.animatingDefenderRole === role && this.animatingDefenderSlot === slotIdx) {
      return 'animate-card-damage';
    }

    // Destruction animations
    if (this.animatingDestroyedRole === role && this.animatingDestroyedSlot === slotIdx) {
      return 'animate-card-destroy';
    }

    return '';
  }
}
