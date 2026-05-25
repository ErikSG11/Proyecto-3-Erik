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
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto pr-2 pb-6">
            <div *ngFor="let card of filteredCards" 
                 (click)="addToDeck(card)"
                 class="relative bg-slate-900 border rounded-2xl p-3 shadow-md group cursor-pointer hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                 [ngClass]="{
                   'border-slate-800 hover:border-teal-500/50': !isCardInDeck(card.id),
                   'border-teal-500 ring-2 ring-teal-500/30': isCardInDeck(card.id),
                   'card-glow-legendary ring-2 ring-amber-500/30': card.rarity === 'Legendary',
                   'card-glow-rare': card.rarity === 'Rare'
                 }">
              
              <!-- Selected Overlay Indicator -->
              <div *ngIf="isCardInDeck(card.id)" 
                   class="absolute top-2 right-2 z-10 w-6 h-6 bg-teal-500 text-slate-950 font-black rounded-full flex items-center justify-center text-xs shadow-md">
                ✓
              </div>

              <!-- Rarity Badge -->
              <span class="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider z-10"
                    [ngClass]="{
                      'bg-slate-800 text-slate-400': card.rarity === 'Common',
                      'bg-purple-950/80 text-purple-300 border border-purple-800/40': card.rarity === 'Rare',
                      'bg-amber-950/80 text-amber-300 border border-amber-800/40': card.rarity === 'Legendary'
                    }">
                {{ card.rarity === 'Common' ? 'Común' : card.rarity === 'Rare' ? 'Rara' : 'Leg.' }}
              </span>

              <!-- Image Container -->
              <div class="h-28 flex items-center justify-center p-2 rounded-xl mb-3 relative overflow-hidden bg-slate-950/60">
                <!-- Glowing type background -->
                <div class="absolute inset-0 opacity-10 filter blur-xl transition-all duration-300"
                     [ngClass]="getTypeBgClass(card.type)"></div>
                <img [src]="card.image" [alt]="card.name" class="h-24 w-auto z-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300">
              </div>

              <!-- Stats & Details -->
              <div class="text-center space-y-1">
                <span class="text-xxs uppercase font-semibold text-slate-500 tracking-wide">{{ card.type }}</span>
                <h4 class="font-bold text-sm tracking-wide truncate text-slate-200">{{ card.name }}</h4>
                <div class="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-800/60 text-[10px] font-mono">
                  <div>
                    <span class="block text-slate-500 text-[8px] uppercase">HP</span>
                    <span class="font-bold text-emerald-400">{{ card.hp }}</span>
                  </div>
                  <div>
                    <span class="block text-slate-500 text-[8px] uppercase">ATK</span>
                    <span class="font-bold text-red-400">{{ card.attack }}</span>
                  </div>
                  <div>
                    <span class="block text-slate-500 text-[8px] uppercase">DEF</span>
                    <span class="font-bold text-blue-400">{{ card.defense }}</span>
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
}
