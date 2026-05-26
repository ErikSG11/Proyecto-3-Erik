import { Injectable } from '@angular/core';

declare var initSqlJs: any;

@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  private db: any = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private readonly DB_NAME = 'PokemonCardGameDB';
  private readonly STORE_NAME = 'sqlite_store';
  private readonly DB_KEY = 'sqlite_db_file';

  constructor() {}

  /**
   * Initializes the SQLite database by loading WASM and restoring from IndexedDB.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        console.log('Initializing SQLite WASM from global scope...');
        
        const initFunc = (window as any).initSqlJs || (typeof initSqlJs !== 'undefined' ? initSqlJs : null);

        if (!initFunc) {
          throw new Error('initSqlJs no está disponible. Asegúrate de incluir node_modules/sql.js/dist/sql-wasm-browser.js en "scripts" dentro de angular.json.');
        }

        const SQL = await initFunc({
          locateFile: (file: string) => `/${file}`
        });

        const savedBytes = await this.loadFromIndexedDB();
        if (savedBytes && savedBytes.length > 0) {
          this.db = new SQL.Database(new Uint8Array(savedBytes));
          console.log('SQLite DB loaded from IndexedDB');
        } else {
          this.db = new SQL.Database();
          console.log('New SQLite DB created');
        }

        this.createTables();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize SQLite WASM:', error);
        this.initPromise = null; // Permite reintentar si falla
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Helper to open the IndexedDB connection.
   */
  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
      request.onsuccess = (event: any) => resolve(event.target.result);
      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  /**
   * Saves the current database binary state into IndexedDB.
   */
  async saveToIndexedDB(): Promise<void> {
    if (!this.db) return;

    try {
      const binaryData = this.db.export();
      const db = await this.openIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(binaryData, this.DB_KEY);

        request.onsuccess = () => {
          console.log('SQLite DB successfully saved to IndexedDB');
          resolve();
        };
        request.onerror = (event: any) => {
          console.error('Error saving SQLite DB to IndexedDB:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error saving DB:', error);
    }
  }

  /**
   * Loads the database binary state from IndexedDB.
   */
  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    try {
      const db = await this.openIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(this.DB_KEY);

        request.onsuccess = (event: any) => {
          resolve(event.target.result || null);
        };
        request.onerror = (event: any) => {
          console.error('Error reading SQLite DB from IndexedDB:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error loading DB from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Creates the required SQLite schema if it does not exist.
   */
  private createTables(): void {
    if (!this.db) return;

    // Table for cached PokeAPI cards
    this.db.run(`
      CREATE TABLE IF NOT EXISTS local_cards (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        hp INTEGER NOT NULL,
        attack INTEGER NOT NULL,
        defense INTEGER NOT NULL,
        type TEXT NOT NULL,
        image TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        skill_desc TEXT NOT NULL,
        description TEXT,
        rarity TEXT
      );
    `);

    // Table for user local settings
    this.db.run(`
      CREATE TABLE IF NOT EXISTS local_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Pre-populate with default active Supabase project credentials if not present
    const checkUrl = this.db.prepare("SELECT value FROM local_settings WHERE key = 'supabase_url'");
    let hasSettings = false;
    if (checkUrl.step()) {
      hasSettings = true;
    }
    checkUrl.free();

    if (!hasSettings) {
      this.db.run(`
        INSERT INTO local_settings (key, value) VALUES 
        ('supabase_url', 'https://ceysoodnrvimldsczelc.supabase.co'),
        ('supabase_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNleXNvb2RucnZpbWxkc2N6ZWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDIxNTksImV4cCI6MjA5NTMxODE1OX0.GQxX-OiMU8AsaJnmucYtKDEEV_33e3-AvNUbXLxFVow')
      `);
    }

    // Table for local match history (vs CPU)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS local_match_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opponent_name TEXT NOT NULL,
        player_lp INTEGER NOT NULL,
        opponent_lp INTEGER NOT NULL,
        winner TEXT NOT NULL,
        date TEXT NOT NULL
      );
    `);

    // Table for current local deck
    this.db.run(`
      CREATE TABLE IF NOT EXISTS local_deck (
        card_id INTEGER PRIMARY KEY
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS local_collection (
        card_id INTEGER PRIMARY KEY
      );
    `);

    this.saveToIndexedDB();
  }

  /**
   * Runs an action query (INSERT, UPDATE, DELETE, etc.) and auto-saves the database.
   */
  run(sql: string, params: any[] = []): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(sql, params);
    this.saveToIndexedDB();
  }

  /**
   * Runs a selection query and returns the rows as key-value objects.
   */
  select(sql: string, params: any[] = []): any[] {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
}
