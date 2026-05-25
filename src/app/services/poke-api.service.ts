import { Injectable } from '@angular/core';
import { SqliteService } from './sqlite.service';

export interface Card {
  id: number;
  name: string;
  hp: number;
  maxHp: number; // for in-game state
  attack: number;
  defense: number;
  type: string;
  image: string;
  skillName: string;
  skillDesc: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Legendary';
  position?: 'attack' | 'defense'; // in-game state
  paralyzed?: boolean; // in-game state
}

@Injectable({
  providedIn: 'root'
})
export class PokeApiService {
  constructor(private sqliteService: SqliteService) {}

  /**
   * Checks if cards are already cached. If not, fetches the 151 Pokémon from PokeAPI
   * and caches them in the SQLite local database.
   */
  async cache151PokemonIfNeeded(onProgress: (progress: number) => void): Promise<void> {
    // Check if we already have 151 cards
    const existing = this.sqliteService.select('SELECT COUNT(*) as count FROM local_cards');
    const count = existing.length > 0 ? existing[0].count : 0;

    if (count === 151) {
      console.log('151 cards already cached in SQLite');
      onProgress(1.0);
      return;
    }

    console.log('Caching 151 Pokémon from PokeAPI...');
    // If some cards exist, clear them to avoid duplicates or partial caches
    this.sqliteService.run('DELETE FROM local_cards');

    const totalPokemon = 151;
    let completed = 0;
    const batchSize = 15;

    for (let i = 1; i <= totalPokemon; i += batchSize) {
      const currentBatch = [];
      for (let j = i; j < i + batchSize && j <= totalPokemon; j++) {
        currentBatch.push(this.fetchAndStorePokemon(j));
      }

      await Promise.all(currentBatch);
      completed += currentBatch.length;
      onProgress(completed / totalPokemon);
    }

    // Save SQLite state to IndexedDB after all are stored
    await this.sqliteService.saveToIndexedDB();
    console.log('Caching completed!');
  }

  private async fetchAndStorePokemon(id: number): Promise<void> {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      // Extract stats
      const stats = data.stats;
      const baseHp = stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 50;
      const baseAttack = stats.find((s: any) => s.stat.name === 'attack')?.base_stat || 50;
      const baseDefense = stats.find((s: any) => s.stat.name === 'defense')?.base_stat || 50;
      const baseSpAttack = stats.find((s: any) => s.stat.name === 'special-attack')?.base_stat || 50;
      const baseSpDefense = stats.find((s: any) => s.stat.name === 'special-defense')?.base_stat || 50;
      const baseSpeed = stats.find((s: any) => s.stat.name === 'speed')?.base_stat || 50;

      // Scale stats to fit game card ranges (e.g. 400 - 1500 for HP, 100 - 1000 for ATK/DEF)
      const hp = Math.round(baseHp * 12 + 200);
      const attack = Math.round(baseAttack * 8 + 100);
      const defense = Math.round(baseDefense * 8 + 100);

      // Determine type
      const type = data.types[0]?.type?.name || 'normal';

      // Assign skill according to primary type
      const skill = this.getSkillForType(type);

      // Determine Rarity based on base stat total
      const statTotal = baseHp + baseAttack + baseDefense + baseSpAttack + baseSpDefense + baseSpeed;
      let rarity: 'Common' | 'Rare' | 'Legendary' = 'Common';
      if (statTotal >= 500) {
        rarity = 'Legendary';
      } else if (statTotal >= 400) {
        rarity = 'Rare';
      }

      const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
      const image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
      const description = `Un Pokémon de tipo ${type.toUpperCase()} con una fuerza base total de ${statTotal}.`;

      // Insert card into local_cards table
      this.sqliteService.run(
        `INSERT INTO local_cards (id, name, hp, attack, defense, type, image, skill_name, skill_desc, description, rarity) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, hp, attack, defense, type, image, skill.name, skill.desc, description, rarity]
      );
    } catch (error) {
      console.error(`Failed to fetch and cache Pokémon #${id}:`, error);
    }
  }

  /**
   * Maps Pokémon type to a convenient card skill.
   */
  private getSkillForType(type: string): { name: string; desc: string } {
    switch (type) {
      case 'fire':
        return {
          name: 'Llamarada',
          desc: 'Inflige 300 puntos de daño directo a los LP del oponente.'
        };
      case 'water':
      case 'ice':
        return {
          name: 'Hidrobomba',
          desc: 'Cura 400 LP a tus puntos de vida generales.'
        };
      case 'grass':
      case 'bug':
        return {
          name: 'Drenado',
          desc: 'Roba 1 carta adicional de tu mazo.'
        };
      case 'electric':
        return {
          name: 'Impactrueno',
          desc: 'Paraliza a un Pokémon oponente (no puede actuar el próximo turno).'
        };
      case 'psychic':
      case 'ghost':
      case 'fairy':
        return {
          name: 'Escudo Psíquico',
          desc: 'Aumenta permanentemente la DEF de este Pokémon en 500 puntos.'
        };
      case 'dragon':
      case 'normal':
      case 'flying':
      case 'fighting':
      case 'poison':
      case 'ground':
      case 'rock':
      case 'steel':
      default:
        return {
          name: 'Furia Dragón',
          desc: 'Aumenta permanentemente el ATK de este Pokémon en 400 puntos.'
        };
    }
  }

  /**
   * Gets all cached cards from the SQLite database.
   */
  getAllCards(): Card[] {
    const rows = this.sqliteService.select('SELECT * FROM local_cards ORDER BY id ASC');
    return rows.map(r => this.mapRowToCard(r));
  }

  /**
   * Gets a specific card by ID.
   */
  getCardById(id: number): Card | null {
    const rows = this.sqliteService.select('SELECT * FROM local_cards WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return this.mapRowToCard(rows[0]);
  }

  /**
   * Maps a database row back to a TypeScript Card object.
   */
  private mapRowToCard(r: any): Card {
    return {
      id: r.id,
      name: r.name,
      hp: r.hp,
      maxHp: r.hp, // set initial maxHp same as hp
      attack: r.attack,
      defense: r.defense,
      type: r.type,
      image: r.image,
      skillName: r.skill_name,
      skillDesc: r.skill_desc,
      description: r.description,
      rarity: r.rarity as any
    };
  }
}
