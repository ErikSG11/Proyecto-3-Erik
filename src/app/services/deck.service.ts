import { Injectable } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { Card, PokeApiService } from './poke-api.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class DeckService {
  private readonly MAX_DECK_SIZE = 25;

  constructor(
    private sqliteService: SqliteService,
    private pokeApiService: PokeApiService,
    private supabaseService: SupabaseService
  ) {}

  /**
   * Gets the list of card IDs currently in the user's local deck.
   */
  getLocalDeckIds(): number[] {
    const rows = this.sqliteService.select('SELECT card_id FROM local_deck');
    return rows.map(r => r.card_id);
  }

  /**
   * Gets the fully hydrated Card objects in the local deck.
   */
  getLocalDeck(): Card[] {
    const ids = this.getLocalDeckIds();
    const deck: Card[] = [];
    for (const id of ids) {
      const card = this.pokeApiService.getCardById(id);
      if (card) deck.push(card);
    }
    return deck;
  }

  /**
   * Adds a card to the local deck.
   */
  addCardToDeck(cardId: number): { success: boolean; message: string } {
    const currentIds = this.getLocalDeckIds();
    
    if (currentIds.length >= this.MAX_DECK_SIZE) {
      return { success: false, message: `El mazo ya tiene el límite máximo de ${this.MAX_DECK_SIZE} cartas.` };
    }

    if (currentIds.includes(cardId)) {
      return { success: false, message: 'Esta carta ya está en tu mazo.' };
    }

    try {
      this.sqliteService.run('INSERT INTO local_deck (card_id) VALUES (?)', [cardId]);
      this.syncDeckWithSupabase();
      return { success: true, message: 'Carta agregada al mazo correctamente.' };
    } catch (e) {
      console.error('Error adding card to deck:', e);
      return { success: false, message: 'Error al agregar la carta al mazo.' };
    }
  }

  /**
   * Removes a card from the local deck.
   */
  removeCardFromDeck(cardId: number): { success: boolean; message: string } {
    try {
      this.sqliteService.run('DELETE FROM local_deck WHERE card_id = ?', [cardId]);
      this.syncDeckWithSupabase();
      return { success: true, message: 'Carta eliminada del mazo.' };
    } catch (e) {
      console.error('Error removing card from deck:', e);
      return { success: false, message: 'Error al eliminar la carta del mazo.' };
    }
  }

  /**
   * Checks if the deck is valid (must have exactly 25 cards).
   */
  isDeckValid(): boolean {
    return this.getLocalDeckIds().length === this.MAX_DECK_SIZE;
  }

  /**
   * Generates a random starter deck of 25 cards.
   */
  generateRandomDeck(): void {
    this.sqliteService.run('DELETE FROM local_deck');
    const allCards = this.pokeApiService.getAllCards();
    const shuffled = [...allCards].sort(() => 0.5 - Math.random());
    const selectedIds = shuffled.slice(0, this.MAX_DECK_SIZE).map(c => c.id);

    for (const id of selectedIds) {
      this.sqliteService.run('INSERT INTO local_deck (card_id) VALUES (?)', [id]);
    }
    this.sqliteService.saveToIndexedDB();
    this.syncDeckWithSupabase();
  }

  /**
   * Syncs the local deck with Supabase (if user is authenticated).
   */
  private async syncDeckWithSupabase(): Promise<void> {
    if (!this.supabaseService.isConfigured()) return;
    
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) return;

      const deckIds = this.getLocalDeckIds();
      
      // Update deck in profiles table or custom column if needed
      await this.supabaseService.client
        .from('profiles')
        .update({
          deck: deckIds
        })
        .eq('id', user.id);

      console.log('Deck synced to Supabase successfully');
    } catch (e) {
      console.warn('Could not sync deck to Supabase:', e);
    }
  }
}
