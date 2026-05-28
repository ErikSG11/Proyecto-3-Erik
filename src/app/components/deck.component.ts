import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PokeApiService, Card } from '../services/poke-api.service';
import { DeckService } from '../services/deck.service';
import { SqliteService } from '../services/sqlite.service';

@Component({
  selector: 'app-deck',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6 pb-24">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div class="space-y-1.5">
          <a routerLink="/" class="text-slate-400 hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 mb-1.5">
            <span>←</span> <span>Volver al Inicio</span>
          </a>
          <h2 class="text-2xl font-black font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 uppercase">
            COLECCIÓN & CONSTRUCTOR DE MAZOS
          </h2>
          <p class="text-xs text-slate-400 font-semibold leading-relaxed">
            Filtra y explora las cartas disponibles. Haz clic en una carta para añadirla o removerla de tu mazo de combate de 25 cartas.
          </p>
        </div>
      </div>

      <!-- MAIN CONTAINER: FULL WIDTH COLLECTION -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- COLLECTION & FILTERS (Full 12 columns) -->
        <div class="lg:col-span-12 space-y-6">
          
          <!-- FILTERS BAR -->
          <div class="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-2xl">
            <!-- Search -->
            <div class="flex-1 min-w-[220px]">
              <input type="text" [(ngModel)]="searchQuery" (input)="filterCards()"
                     placeholder="Buscar Pokémon..."
                     class="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all font-semibold placeholder:text-slate-650">
            </div>

            <!-- Type Filter -->
            <div class="min-w-[150px]">
              <select [(ngModel)]="selectedType" (change)="filterCards()"
                      class="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-3 text-slate-350 text-xs focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all font-bold">
                <option value="">Todos los Tipos</option>
                <option *ngFor="let type of pokemonTypes" [value]="type">{{ type | titlecase }}</option>
              </select>
            </div>

            <!-- Rarity Filter -->
            <div class="min-w-[150px]">
              <select [(ngModel)]="selectedRarity" (change)="filterCards()"
                      class="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-3 text-slate-350 text-xs focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all font-bold">
                <option value="">Todas las Rarezas</option>
                <option value="Common">Común</option>
                <option value="Rare">Rara</option>
                <option value="Legendary">Legendaria</option>
              </select>
            </div>
          </div>

          <!-- CARDS GRID -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 max-h-[66vh] overflow-y-auto pr-2 pb-6">
            <div *ngFor="let card of filteredCards" 
                 (click)="addToDeck(card)"
                 class="relative rounded-[22px] group cursor-pointer hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-[380px] p-3 overflow-hidden"
                 [ngClass]="[
                   getCardFrameClass(card.type),
                   isCardInDeck(card.id) ? 'ring-2 ring-indigo-500 shadow-2xl shadow-indigo-950/40 bg-slate-900/90' : 'bg-slate-900/60 backdrop-blur-sm'
                 ]">
              
              <!-- Selected Overlay Indicator -->
              <div *ngIf="isCardInDeck(card.id)" 
                   class="absolute top-3.5 right-3.5 z-20 w-6 h-6 bg-indigo-650 text-white font-black rounded-full flex items-center justify-center text-xs shadow-md border-2 border-slate-950">
                ✓
              </div>

              <!-- Inner Card Body -->
              <div class="w-full h-full flex flex-col justify-between overflow-hidden relative">
                <!-- Glowing type background behind everything -->
                <div class="absolute inset-0 opacity-[0.03] filter blur-2xl pointer-events-none transition-all duration-300"
                     [ngClass]="getTypeBgClass(card.type)"></div>

                <!-- 1. Header (Name & Element symbol) -->
                <div class="flex justify-between items-center z-10">
                  <h4 class="font-extrabold text-xs tracking-wide truncate text-slate-100 uppercase max-w-[125px] font-display">{{ card.name }}</h4>
                  <span class="text-[8px] px-2 py-0.5 rounded-full font-extrabold border font-mono"
                        [ngClass]="getTypeBadgeClass(card.type)">
                    {{ getTypeEmoji(card.type) }}
                  </span>
                </div>

                <!-- 2. Rarity stars (representation of level) -->
                <div class="text-left text-[8px] text-amber-500 font-bold z-10 tracking-widest mt-0.5 font-mono">
                  {{ getRarityStars(card.rarity) }}
                </div>

                <!-- 3. Artwork image box -->
                <div class="h-28 flex items-center justify-center p-2 rounded-xl mt-1.5 relative overflow-hidden bg-slate-950/60 border border-slate-850 shadow-inner shrink-0">
                  <img [src]="card.image" [alt]="card.name" class="h-24 w-auto z-10 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-300">
                </div>

                <!-- 4. Text / Ability Box -->
                <div class="flex-1 mt-2.5 p-2 bg-slate-950/40 border border-slate-850 rounded-xl flex flex-col justify-between gap-1 overflow-hidden z-10 min-h-[90px]">
                  <div>
                    <h5 class="text-[9px] font-bold text-indigo-400 flex items-center gap-1 uppercase tracking-wide">
                      ⚡ {{ card.skillName }}
                    </h5>
                    <p class="text-[9px] text-slate-455 leading-relaxed font-semibold mt-0.5 line-clamp-2">
                      {{ card.skillDesc }}
                    </p>
                  </div>
                  <p *ngIf="card.description" class="text-[8px] text-slate-550 italic line-clamp-1 border-t border-slate-850 pt-0.5 leading-tight">
                    "{{ card.description }}"
                  </p>
                </div>

                <!-- 5. Footer Stats -->
                <div class="grid grid-cols-3 gap-1.5 mt-2.5 pt-2.5 border-t border-slate-850 text-[9px] font-mono font-bold text-center z-10">
                  <div class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-lg py-1 shadow-inner">
                    <span class="block text-[6px] text-slate-550 uppercase tracking-widest leading-none mb-0.5">HP</span>
                    <span class="text-xs font-black leading-none font-mono">{{ card.hp }}</span>
                  </div>
                  <div class="bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-lg py-1 shadow-inner">
                    <span class="block text-[6px] text-slate-550 uppercase tracking-widest leading-none mb-0.5">ATK</span>
                    <span class="text-xs font-black leading-none font-mono">{{ card.attack }}</span>
                  </div>
                  <div class="bg-blue-500/10 border border-blue-500/20 text-blue-450 rounded-lg py-1 shadow-inner">
                    <span class="block text-[6px] text-slate-550 uppercase tracking-widest leading-none mb-0.5">DEF</span>
                    <span class="text-xs font-black leading-none font-mono">{{ card.defense }}</span>
                  </div>
                </div>

              </div>
            </div>
            
            <div *ngIf="filteredCards.length === 0" class="col-span-full py-16 text-center text-slate-500 font-semibold italic">
              No se encontraron Pokémon con los filtros actuales.
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- COLLAPSIBLE HORIZONTAL BOTTOM TRAY FOR CURRENT DECK -->
    <div class="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl transition-all duration-300"
         [class.translate-y-[calc(100%-48px)]]="!isDeckTrayOpen()">
         
      <!-- Tray Header / Controller -->
      <div (click)="isDeckTrayOpen.set(!isDeckTrayOpen())" 
           class="flex items-center justify-between px-6 py-3.5 bg-slate-950/90 border-b border-slate-850 cursor-pointer select-none">
        <div class="flex items-center gap-3">
          <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            🎴 Tu Mazo de Batalla
            <span class="text-xs font-mono font-bold bg-indigo-500/15 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-400">
              {{ deckSize() }} / 25
            </span>
          </span>
          
          <span class="text-[9px] font-bold px-2 py-0.5 rounded transition-all font-mono uppercase tracking-wider"
                [ngClass]="{
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': deckSize() === 25,
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20': deckSize() < 25
                }">
            {{ deckSize() === 25 ? '✓ ¡LISTO PARA EL DUELO!' : '⚠️ Faltan ' + (25 - deckSize()) + ' cartas' }}
          </span>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex gap-2" (click)="$event.stopPropagation()">
            <button (click)="generateRandom()" 
                    class="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 shadow-sm transition-all duration-150 cursor-pointer">
              🎲 Aleatorio
            </button>
            <button (click)="clearDeck()" 
                    class="px-3 py-1 bg-rose-955/20 hover:bg-rose-900/40 text-rose-455 text-xs font-bold rounded-lg border border-rose-500/20 shadow-sm transition-all duration-150 cursor-pointer">
              🗑️ Vaciar
            </button>
          </div>
          
          <span class="text-slate-400 font-bold transition-transform duration-300 text-xs flex items-center gap-1.5"
                [class.rotate-180]="isDeckTrayOpen()">
            <span>▲</span> <span>Expandir</span>
          </span>
        </div>
      </div>

      <!-- Tray Content (Horizontal card list) -->
      <div class="p-4 bg-slate-900">
        <div class="flex gap-3 overflow-x-auto py-2 px-1 items-center min-h-[140px] max-h-[160px]">
          <div *ngFor="let card of currentDeck" 
               (click)="removeFromDeck(card.id)"
               class="flex flex-col justify-between p-2 rounded-xl border border-slate-850 bg-slate-950/60 hover:bg-rose-950/20 hover:border-rose-500/30 cursor-pointer transition-all duration-150 shrink-0 w-24 h-32 group relative shadow-inner">
            
            <div class="absolute -top-1 -right-1 bg-rose-650 text-white rounded-full w-4.5 h-4.5 items-center justify-center text-[8px] font-bold shadow-sm hidden group-hover:flex">
              ✕
            </div>

            <div class="flex justify-between items-center">
              <span class="text-[8px] font-extrabold text-slate-200 truncate max-w-[65px] uppercase">{{ card.name }}</span>
            </div>

            <div class="h-14 flex items-center justify-center bg-slate-900/80 border border-slate-850 rounded-lg p-0.5">
              <img [src]="card.image" [alt]="card.name" class="max-h-full max-w-full object-contain">
            </div>

            <div class="flex items-center justify-between text-[7.5px] font-mono text-slate-500 font-bold mt-1">
              <span class="px-1 bg-slate-900 border border-slate-850 rounded text-slate-400 uppercase text-[6.5px] leading-none">{{ card.type }}</span>
              <span class="text-slate-400 font-mono">HP:{{ card.hp }}</span>
            </div>
          </div>

          <div *ngIf="deckSize() === 0" class="w-full h-24 flex flex-col items-center justify-center text-center text-slate-500">
            <span class="text-3xl mb-1">🎴</span>
            <span class="text-xs font-bold">El mazo está vacío.</span>
            <span class="text-[10px] text-slate-550">Selecciona cartas de la colección de arriba para agregarlas.</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DeckComponent implements OnInit {
  isDeckTrayOpen = signal(true);
  allCards: Card[] = [];
  filteredCards: Card[] = [];
  currentDeck: Card[] = [];
  deckSize = signal(0);

  // Filters
  searchQuery = '';
  selectedType = '';
  selectedRarity = '';

  pokemonTypes = [
    'fire', 'water', 'grass', 'electric', 'psychic', 'normal',
    'poison', 'ground', 'flying', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'fairy', 'ice'
  ];

  constructor(
    private sqliteService: SqliteService,
    private pokeApiService: PokeApiService,
    private deckService: DeckService
  ) {}

  async ngOnInit() {
    await this.sqliteService.initialize();
    this.allCards = this.pokeApiService.getAllCards();
    this.filteredCards = [...this.allCards];
    this.loadDeck();
  }

  loadDeck() {
    this.currentDeck = this.deckService.getLocalDeck();
    this.deckSize.set(this.currentDeck.length);
  }

  filterCards() {
    this.filteredCards = this.allCards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesType = this.selectedType === '' || card.type === this.selectedType;
      const matchesRarity = this.selectedRarity === '' || card.rarity === this.selectedRarity;
      return matchesSearch && matchesType && matchesRarity;
    });
  }

  isCardInDeck(cardId: number): boolean {
    return this.currentDeck.some(c => c.id === cardId);
  }

  addToDeck(card: Card) {
    if (this.isCardInDeck(card.id)) {
      this.removeFromDeck(card.id);
      return;
    }

    const res = this.deckService.addCardToDeck(card.id);
    if (!res.success) {
      alert(res.message);
    } else {
      this.loadDeck();
    }
  }

  removeFromDeck(cardId: number) {
    const res = this.deckService.removeCardFromDeck(cardId);
    if (res.success) {
      this.loadDeck();
    }
  }

  generateRandom() {
    this.deckService.generateRandomDeck();
    this.loadDeck();
  }

  clearDeck() {
    this.sqliteService.run('DELETE FROM local_deck');
    this.sqliteService.saveToIndexedDB();
    this.loadDeck();
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
      case 'fire': return 'border border-rose-500/20 bg-slate-950 shadow-md shadow-rose-950/10';
      case 'water': return 'border border-sky-500/20 bg-slate-950 shadow-md shadow-sky-950/10';
      case 'grass': return 'border border-emerald-500/20 bg-slate-950 shadow-md shadow-emerald-950/10';
      case 'electric': return 'border border-amber-500/20 bg-slate-950 shadow-md shadow-amber-950/10';
      case 'psychic': return 'border border-purple-500/20 bg-slate-950 shadow-md shadow-purple-950/10';
      case 'poison': return 'border border-fuchsia-500/20 bg-slate-950 shadow-md shadow-fuchsia-950/10';
      case 'ground': return 'border border-amber-600/20 bg-slate-950 shadow-md shadow-amber-955/10';
      case 'flying': return 'border border-indigo-400/20 bg-slate-950 shadow-md shadow-indigo-950/10';
      case 'bug': return 'border border-lime-500/20 bg-slate-950 shadow-md shadow-lime-950/10';
      case 'rock': return 'border border-stone-500/20 bg-slate-950 shadow-md shadow-stone-950/10';
      case 'ghost': return 'border border-indigo-900/30 bg-slate-950 shadow-md shadow-indigo-950/10';
      case 'dragon': return 'border border-violet-500/20 bg-slate-950 shadow-md shadow-violet-950/10';
      case 'steel': return 'border border-slate-500/20 bg-slate-950 shadow-md shadow-slate-950/10';
      case 'fairy': return 'border border-pink-500/20 bg-slate-950 shadow-md shadow-pink-950/10';
      case 'ice': return 'border border-cyan-500/20 bg-slate-950 shadow-md shadow-cyan-950/10';
      default: return 'border border-slate-700 bg-slate-950 shadow-md';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'fire': return 'bg-rose-950/40 text-rose-400 border-rose-900/30';
      case 'water': return 'bg-sky-950/40 text-sky-400 border-sky-900/30';
      case 'grass': return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
      case 'electric': return 'bg-amber-950/40 text-amber-400 border-amber-900/30';
      case 'psychic': return 'bg-purple-950/40 text-purple-400 border-purple-900/30';
      case 'poison': return 'bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-900/30';
      case 'ground': return 'bg-amber-950/40 text-amber-500 border-amber-900/30';
      case 'flying': return 'bg-sky-950/40 text-sky-400 border-sky-900/30';
      case 'bug': return 'bg-lime-950/40 text-lime-400 border-lime-900/30';
      case 'rock': return 'bg-stone-900/60 text-stone-400 border-stone-850';
      case 'ghost': return 'bg-indigo-950/40 text-indigo-400 border-indigo-900/30';
      case 'dragon': return 'bg-violet-950/40 text-violet-400 border-violet-900/30';
      case 'steel': return 'bg-slate-900 text-slate-400 border-slate-800';
      case 'fairy': return 'bg-pink-955/20 text-pink-400 border-pink-900/30';
      case 'ice': return 'bg-cyan-950/40 text-cyan-400 border-cyan-900/30';
      default: return 'bg-slate-900 text-slate-400 border-slate-800';
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
}
