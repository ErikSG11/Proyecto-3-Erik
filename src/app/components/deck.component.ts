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
        <div>
          <a routerLink="/" class="text-slate-500 hover:text-indigo-650 text-sm font-semibold transition-colors mb-2 inline-block">← Volver al Inicio</a>
          <h2 class="text-3xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            CONSTRUCTOR DE MAZOS & COLECCIÓN
          </h2>
          <p class="text-slate-500 text-sm mt-1 font-medium">Inspecciona el catálogo completo de cartas y selecciona 25 para tu mazo de combate.</p>
        </div>
      </div>

      <!-- MAIN CONTAINER: FULL WIDTH COLLECTION -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- COLLECTION & FILTERS (Full 12 columns) -->
        <div class="lg:col-span-12 space-y-6">
          
          <!-- FILTERS BAR -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between shadow-sm">
            <!-- Search -->
            <div class="flex-1 min-w-[200px]">
              <input type="text" [(ngModel)]="searchQuery" (input)="filterCards()"
                     placeholder="Buscar Pokémon..."
                     class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all">
            </div>

            <!-- Type Filter -->
            <div class="min-w-[140px]">
              <select [(ngModel)]="selectedType" (change)="filterCards()"
                      class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all">
                <option value="">Todos los Tipos</option>
                <option *ngFor="let type of pokemonTypes" [value]="type">{{ type | titlecase }}</option>
              </select>
            </div>

            <!-- Rarity Filter -->
            <div class="min-w-[140px]">
              <select [(ngModel)]="selectedRarity" (change)="filterCards()"
                      class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all">
                <option value="">Todas las Rarezas</option>
                <option value="Common">Común</option>
                <option value="Rare">Rara</option>
                <option value="Legendary">Legendaria</option>
              </select>
            </div>
          </div>

          <!-- CARDS GRID (Sized for full width) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 max-h-[66vh] overflow-y-auto pr-2 pb-6">
            <div *ngFor="let card of filteredCards" 
                 (click)="addToDeck(card)"
                 class="relative p-1 rounded-[22px] shadow-sm hover:shadow-md group cursor-pointer hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col h-[380px]"
                 [ngClass]="[
                   getCardFrameClass(card.type),
                   isCardInDeck(card.id) ? 'ring-4 ring-indigo-500 shadow-lg shadow-indigo-550/20 animate-none' : ''
                 ]">
              
              <!-- Selected Overlay Indicator -->
              <div *ngIf="isCardInDeck(card.id)" 
                   class="absolute top-3 right-3 z-20 w-7 h-7 bg-indigo-650 text-white font-black rounded-full flex items-center justify-center text-xs shadow-md border-2 border-white">
                ✓
              </div>

              <!-- Inner Card Body -->
              <div class="bg-white w-full h-full rounded-[18px] p-3 flex flex-col justify-between overflow-hidden relative">
                <!-- Glowing type background behind everything -->
                <div class="absolute inset-0 opacity-[0.03] filter blur-2xl pointer-events-none transition-all duration-300"
                     [ngClass]="getTypeBgClass(card.type)"></div>

                <!-- 1. Header (Name & Element symbol) -->
                <div class="flex justify-between items-center z-10">
                  <h4 class="font-extrabold text-sm tracking-wide truncate text-slate-800 uppercase max-w-[120px]">{{ card.name }}</h4>
                  <span class="text-[9px] px-2 py-0.5 rounded-full font-extrabold border"
                        [ngClass]="getTypeBadgeClass(card.type)">
                    {{ getTypeEmoji(card.type) }}
                  </span>
                </div>

                <!-- 2. Rarity stars (representation of level) -->
                <div class="text-left text-[10px] text-amber-500 font-bold z-10 tracking-widest mt-0.5">
                  {{ getRarityStars(card.rarity) }}
                </div>

                <!-- 3. Artwork image box -->
                <div class="h-28 flex items-center justify-center p-2 rounded-xl mt-1.5 relative overflow-hidden bg-slate-50 border border-slate-100">
                  <!-- Glow behind artwork -->
                  <div class="absolute inset-0 opacity-[0.12] filter blur-xl transition-all duration-300"
                       [ngClass]="getTypeBgClass(card.type)"></div>
                  <img [src]="card.image" [alt]="card.name" class="h-24 w-auto z-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] group-hover:scale-110 transition-transform duration-300">
                </div>

                <!-- 4. Text / Ability Box -->
                <div class="flex-1 mt-2 p-2 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between gap-1 overflow-hidden z-10 min-h-[90px]">
                  <div>
                    <h5 class="text-[10px] font-bold text-indigo-650 flex items-center gap-1 uppercase tracking-wide">
                      ⚡ {{ card.skillName }}
                    </h5>
                    <p class="text-[10px] text-slate-600 leading-normal font-semibold mt-0.5 line-clamp-2">
                      {{ card.skillDesc }}
                    </p>
                  </div>
                  <p *ngIf="card.description" class="text-[9px] text-slate-450 italic line-clamp-1 border-t border-slate-200/50 pt-0.5 leading-tight">
                    "{{ card.description }}"
                  </p>
                </div>

                <!-- 5. Footer Stats -->
                <div class="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-[9px] font-mono font-bold text-center z-10">
                  <div class="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg py-1 shadow-sm">
                    <span class="block text-[7px] text-slate-450 uppercase tracking-widest leading-none mb-0.5">HP</span>
                    <span class="text-sm font-black leading-none">{{ card.hp }}</span>
                  </div>
                  <div class="bg-rose-50 border border-rose-100 text-rose-700 rounded-lg py-1 shadow-sm">
                    <span class="block text-[7px] text-slate-450 uppercase tracking-widest leading-none mb-0.5">ATK</span>
                    <span class="text-sm font-black leading-none">{{ card.attack }}</span>
                  </div>
                  <div class="bg-blue-50 border border-blue-100 text-blue-700 rounded-lg py-1 shadow-sm">
                    <span class="block text-[7px] text-slate-450 uppercase tracking-widest leading-none mb-0.5">DEF</span>
                    <span class="text-sm font-black leading-none">{{ card.defense }}</span>
                  </div>
                </div>

              </div>
            </div>
            
            <div *ngIf="filteredCards.length === 0" class="col-span-full py-16 text-center text-slate-400 font-semibold italic">
              No se encontraron Pokémon con los filtros actuales.
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- COLLAPSIBLE HORIZONTAL BOTTOM TRAY FOR CURRENT DECK -->
    <div class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl transition-all duration-300"
         [class.translate-y-[calc(100%-48px)]]="!isDeckTrayOpen()">
         
      <!-- Tray Header / Controller -->
      <div (click)="isDeckTrayOpen.set(!isDeckTrayOpen())" 
           class="flex items-center justify-between px-6 py-3 bg-slate-50/90 border-b border-slate-200/60 cursor-pointer select-none">
        <div class="flex items-center gap-3">
          <span class="text-sm font-bold text-slate-800 flex items-center gap-2">
            🎴 Tu Mazo 
            <span class="text-xs font-mono font-bold bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded-full text-indigo-650">
              {{ deckSize() }} / 25
            </span>
          </span>
          
          <span class="text-[10px] font-bold px-2 py-0.5 rounded transition-all"
                [ngClass]="{
                  'bg-emerald-50 text-emerald-700 border border-emerald-100': deckSize() === 25,
                  'bg-amber-50 text-amber-700 border border-amber-150': deckSize() < 25
                }">
            {{ deckSize() === 25 ? '✓ ¡LISTO PARA EL DUELO!' : '⚠️ Faltan ' + (25 - deckSize()) + ' cartas' }}
          </span>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex gap-2" (click)="$event.stopPropagation()">
            <button (click)="generateRandom()" 
                    class="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-205 shadow-xs transition-all duration-150">
              🎲 Aleatorio
            </button>
            <button (click)="clearDeck()" 
                    class="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg border border-rose-100 shadow-xs transition-all duration-150">
              🗑️ Vaciar
            </button>
          </div>
          
          <span class="text-slate-400 font-bold transition-transform duration-300 text-xs flex items-center"
                [class.rotate-180]="isDeckTrayOpen()">
            ▲ Expandir
          </span>
        </div>
      </div>

      <!-- Tray Content (Horizontal card list) -->
      <div class="p-4 bg-white">
        <div class="flex gap-3 overflow-x-auto py-2 px-1 items-center min-h-[140px] max-h-[160px]">
          <div *ngFor="let card of currentDeck" 
               (click)="removeFromDeck(card.id)"
               class="flex flex-col justify-between p-2 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-rose-50/40 hover:border-rose-250 cursor-pointer transition-all duration-150 shrink-0 w-24 h-32 group relative shadow-xs">
            
            <div class="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4.5 h-4.5 items-center justify-center text-[8px] font-bold shadow-sm hidden group-hover:flex">
              ✕
            </div>

            <div class="flex justify-between items-center">
              <span class="text-[8px] font-extrabold text-slate-700 truncate max-w-[65px] uppercase">{{ card.name }}</span>
            </div>

            <div class="h-14 flex items-center justify-center bg-white border border-slate-150 rounded-lg p-0.5">
              <img [src]="card.image" [alt]="card.name" class="max-h-full max-w-full object-contain">
            </div>

            <div class="flex items-center justify-between text-[7.5px] font-mono text-slate-400 font-bold mt-1">
              <span class="px-1 bg-white border border-slate-205 rounded text-slate-500 uppercase text-[6.5px] leading-none">{{ card.type }}</span>
              <span class="text-slate-500">HP:{{ card.hp }}</span>
            </div>
          </div>

          <div *ngIf="deckSize() === 0" class="w-full h-24 flex flex-col items-center justify-center text-center text-slate-400">
            <span class="text-3xl mb-1">🎴</span>
            <span class="text-xs font-bold">El mazo está vacío.</span>
            <span class="text-[10px] text-slate-400">Selecciona cartas de la colección de arriba para agregarlas.</span>
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
      case 'fire': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'water': return 'bg-blue-50 text-blue-650 border-blue-200';
      case 'grass': return 'bg-emerald-50 text-emerald-650 border-emerald-250';
      case 'electric': return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'psychic': return 'bg-purple-50 text-purple-650 border-purple-200';
      case 'poison': return 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200';
      case 'ground': return 'bg-amber-50 text-amber-800 border-amber-250';
      case 'flying': return 'bg-sky-50 text-sky-600 border-sky-200';
      case 'bug': return 'bg-lime-50 text-lime-650 border-lime-200';
      case 'rock': return 'bg-stone-50 text-stone-605 border-stone-250';
      case 'ghost': return 'bg-indigo-50 text-indigo-650 border-indigo-200';
      case 'dragon': return 'bg-violet-50 text-violet-750 border-violet-250';
      case 'steel': return 'bg-slate-100 text-slate-655 border-slate-250';
      case 'fairy': return 'bg-pink-50 text-pink-600 border-pink-200';
      case 'ice': return 'bg-cyan-50 text-cyan-600 border-cyan-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
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
