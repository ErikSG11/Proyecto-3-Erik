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
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <a routerLink="/" class="text-slate-400 hover:text-slate-100 text-sm transition-colors mb-2 inline-block">← Volver al Inicio</a>
          <h2 class="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
            CONSTRUCTOR DE MAZOS & COLECCIÓN
          </h2>
          <p class="text-slate-400 text-sm mt-1">Inspecciona el catálogo completo de cartas y selecciona 25 para tu mazo de combate.</p>
        </div>
        <div class="flex gap-2">
          <button (click)="generateRandom()" 
                  class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition-all duration-200">
            🎲 Mazo Aleatorio
          </button>
          <button (click)="clearDeck()" 
                  class="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold rounded-xl border border-rose-500/20 transition-all duration-200">
            🗑️ Vaciar Mazo
          </button>
        </div>
      </div>

      <!-- MAIN CONTAINER: TWO PANEL LAYOUT -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- LEFT: COLLECTION & FILTERS (8 columns) -->
        <div class="lg:col-span-8 space-y-6">
          
          <!-- FILTERS BAR -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between shadow-md">
            <!-- Search -->
            <div class="flex-1 min-w-[200px]">
              <input type="text" [(ngModel)]="searchQuery" (input)="filterCards()"
                     placeholder="Buscar Pokémon..."
                     class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-all">
            </div>

            <!-- Type Filter -->
            <div class="min-w-[140px]">
              <select [(ngModel)]="selectedType" (change)="filterCards()"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-all">
                <option value="">Todos los Tipos</option>
                <option *ngFor="let type of pokemonTypes" [value]="type">{{ type | titlecase }}</option>
              </select>
            </div>

            <!-- Rarity Filter -->
            <div class="min-w-[140px]">
              <select [(ngModel)]="selectedRarity" (change)="filterCards()"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-all">
                <option value="">Todas las Rarezas</option>
                <option value="Common">Común</option>
                <option value="Rare">Rara</option>
                <option value="Legendary">Legendaria</option>
              </select>
            </div>
          </div>

          <!-- CARDS GRID -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-[72vh] overflow-y-auto pr-2 pb-6">
            <div *ngFor="let card of filteredCards" 
                 (click)="addToDeck(card)"
                 class="relative p-1 rounded-[22px] shadow-lg group cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-[380px]"
                 [ngClass]="[
                   getCardFrameClass(card.type),
                   isCardInDeck(card.id) ? 'ring-4 ring-teal-400' : ''
                 ]">
              
              <!-- Selected Overlay Indicator -->
              <div *ngIf="isCardInDeck(card.id)" 
                   class="absolute top-3 right-3 z-20 w-7 h-7 bg-teal-400 text-slate-950 font-black rounded-full flex items-center justify-center text-xs shadow-md border-2 border-slate-950 animate-pulse">
                ✓
              </div>

              <!-- Inner Card Body -->
              <div class="bg-slate-950/95 w-full h-full rounded-[18px] p-3 flex flex-col justify-between overflow-hidden relative">
                <!-- Glowing type background behind everything -->
                <div class="absolute inset-0 opacity-[0.03] filter blur-2xl pointer-events-none transition-all duration-300"
                     [ngClass]="getTypeBgClass(card.type)"></div>

                <!-- 1. Header (Name & Element symbol) -->
                <div class="flex justify-between items-center z-10">
                  <h4 class="font-black text-sm tracking-wide truncate text-slate-100 uppercase max-w-[130px]">{{ card.name }}</h4>
                  <span class="text-[9px] px-2 py-0.5 rounded-full font-extrabold border"
                        [ngClass]="getTypeBadgeClass(card.type)">
                    {{ getTypeEmoji(card.type) }}
                  </span>
                </div>

                <!-- 2. Rarity stars (representation of level) -->
                <div class="text-left text-[10px] text-amber-400 font-bold z-10 tracking-widest mt-0.5">
                  {{ getRarityStars(card.rarity) }}
                </div>

                <!-- 3. Artwork image box -->
                <div class="h-28 flex items-center justify-center p-2 rounded-xl mt-1.5 relative overflow-hidden bg-slate-900/60 border border-slate-900">
                  <!-- Glow behind artwork -->
                  <div class="absolute inset-0 opacity-[0.12] filter blur-xl transition-all duration-300"
                       [ngClass]="getTypeBgClass(card.type)"></div>
                  <img [src]="card.image" [alt]="card.name" class="h-24 w-auto z-10 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-300">
                </div>

                <!-- 4. Text / Ability Box -->
                <div class="flex-1 mt-2 p-2 bg-slate-900/50 border border-slate-900/80 rounded-xl flex flex-col justify-between gap-1 overflow-hidden z-10 min-h-[90px]">
                  <div>
                    <h5 class="text-[10px] font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wide">
                      ⚡ {{ card.skillName }}
                    </h5>
                    <p class="text-[10px] text-slate-400 leading-normal font-medium mt-0.5 line-clamp-2">
                      {{ card.skillDesc }}
                    </p>
                  </div>
                  <p *ngIf="card.description" class="text-[9px] text-slate-500 italic line-clamp-1 border-t border-slate-900/40 pt-0.5 leading-tight">
                    "{{ card.description }}"
                  </p>
                </div>

                <!-- 5. Footer Stats -->
                <div class="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-900/60 text-[9px] font-mono font-bold text-center z-10">
                  <div class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg py-1 shadow-inner">
                    <span class="block text-[7px] text-slate-500 uppercase tracking-widest leading-none mb-0.5">HP</span>
                    <span class="text-sm font-black leading-none">{{ card.hp }}</span>
                  </div>
                  <div class="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg py-1 shadow-inner">
                    <span class="block text-[7px] text-slate-500 uppercase tracking-widest leading-none mb-0.5">ATK</span>
                    <span class="text-sm font-black leading-none">{{ card.attack }}</span>
                  </div>
                  <div class="bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg py-1 shadow-inner">
                    <span class="block text-[7px] text-slate-500 uppercase tracking-widest leading-none mb-0.5">DEF</span>
                    <span class="text-sm font-black leading-none">{{ card.defense }}</span>
                  </div>
                </div>

              </div>
            </div>
            
            <div *ngIf="filteredCards.length === 0" class="col-span-full py-16 text-center text-slate-500 font-medium">
              No se encontraron Pokémon con los filtros actuales.
            </div>
          </div>

        </div>

        <!-- RIGHT: CURRENT DECK PANEL (4 columns) -->
        <div class="lg:col-span-4">
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 sticky top-6 shadow-xl flex flex-col h-[76vh]">
            <!-- Deck Header -->
            <div class="border-b border-slate-800 pb-4 mb-4">
              <div class="flex justify-between items-center mb-1">
                <h3 class="text-xl font-bold font-display text-slate-100 flex items-center gap-2">
                  🎴 Tu Mazo
                </h3>
                <span class="text-xs font-mono font-bold bg-teal-500/10 border border-teal-500/35 px-2.5 py-1 rounded-full text-teal-400">
                  {{ deckSize() }} / 25
                </span>
              </div>
              <p class="text-xs text-slate-400">Haz clic en una carta de la colección para agregarla, o haz clic aquí para removerla.</p>
              
              <!-- Validation Alert -->
              <div class="mt-3 p-2 text-xs rounded-xl"
                   [ngClass]="{
                     'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20': deckSize() === 25,
                     'bg-amber-500/15 text-amber-400 border border-amber-500/20': deckSize() < 25
                   }">
                <span class="font-semibold" *ngIf="deckSize() === 25">✓ ¡Mazo completo y listo para el duelo!</span>
                <span class="font-semibold" *ngIf="deckSize() < 25">⚠️ Faltan {{ 25 - deckSize() }} cartas para poder jugar.</span>
              </div>
            </div>

            <!-- DECK LIST -->
            <div class="flex-1 overflow-y-auto pr-1 space-y-2 pb-4">
              <div *ngFor="let card of currentDeck" 
                   (click)="removeFromDeck(card.id)"
                   class="flex items-center justify-between bg-slate-950 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-500/30 rounded-xl p-2 cursor-pointer transition-all duration-200 group">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center p-1">
                    <img [src]="card.image" [alt]="card.name" class="max-h-full max-w-full">
                  </div>
                  <div>
                    <h5 class="text-xs font-bold text-slate-200 group-hover:text-slate-100">{{ card.name }}</h5>
                    <div class="flex gap-2 text-[9px] font-mono text-slate-500">
                      <span>HP:{{ card.hp }}</span>
                      <span>AT:{{ card.attack }}</span>
                      <span>DF:{{ card.defense }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[9px] px-1 bg-slate-900 border border-slate-800 rounded font-semibold text-slate-400 uppercase">{{ card.type }}</span>
                  <span class="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold mr-2">✕</span>
                </div>
              </div>

              <div *ngIf="deckSize() === 0" class="h-full flex flex-col items-center justify-center text-center text-slate-500 py-16">
                <span class="text-4xl mb-2">🎴</span>
                <span class="text-xs font-semibold">El mazo está vacío.</span>
                <span class="text-[10px] text-slate-600 mt-1">Agrega cartas desde la colección o haz clic en Mazo Aleatorio.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class DeckComponent implements OnInit {
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
}
