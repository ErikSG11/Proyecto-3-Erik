import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { SqliteService } from './sqlite.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient | null = null;
  private supabaseUrl: string = '';
  private supabaseKey: string = '';
  
  currentUserProfile = signal<any>(null);

  constructor(private sqliteService: SqliteService) {}

  /**
   * Initializes Supabase client from settings in SQLite database.
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('SupabaseService: Leyendo credenciales de SQLite...');
      const urlSetting = this.sqliteService.select("SELECT value FROM local_settings WHERE key = 'supabase_url'");
      const keySetting = this.sqliteService.select("SELECT value FROM local_settings WHERE key = 'supabase_key'");

      const url = urlSetting.length > 0 ? urlSetting[0].value : '';
      const key = keySetting.length > 0 ? keySetting[0].value : '';

      if (url && key) {
        this.supabaseUrl = url;
        this.supabaseKey = key;
        console.log('SupabaseService: Inicializando cliente con URL:', url);
        this.supabase = createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
        
        // Listen to Auth State Changes to update profile reactive signal
        this.supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('SupabaseService: onAuthStateChange event:', event, 'session:', session?.user?.id);
          if (session?.user) {
            try {
              console.log('SupabaseService: Cargando perfil para usuario:', session.user.id);
              const profile = await this.getUserProfile(session.user.id);
              console.log('SupabaseService: Perfil cargado con éxito:', profile);
              this.currentUserProfile.set(profile);
            } catch (e) {
              console.warn('SupabaseService: Error al cargar perfil, usando fallback:', e);
              this.currentUserProfile.set({
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'Entrenador'
              });
            }
          } else {
            console.log('SupabaseService: No hay sesión activa. Limpiando perfil.');
            this.currentUserProfile.set(null);
          }
        });

        console.log('Supabase client successfully initialized with saved settings');
        return true;
      }
    } catch (e) {
      console.error('Error reading Supabase settings from SQLite:', e);
    }
    console.warn('Supabase credentials not configured. Online mode will be unavailable.');
    return false;
  }

  /**
   * Updates credentials in SQLite and reinitializes client.
   */
  async updateCredentials(url: string, key: string): Promise<boolean> {
    try {
      console.log('SupabaseService: Actualizando credenciales...');
      this.sqliteService.run(
        "INSERT OR REPLACE INTO local_settings (key, value) VALUES ('supabase_url', ?)",
        [url]
      );
      this.sqliteService.run(
        "INSERT OR REPLACE INTO local_settings (key, value) VALUES ('supabase_key', ?)",
        [key]
      );

      this.supabaseUrl = url;
      this.supabaseKey = key;
      this.supabase = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });

      this.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('SupabaseService (Updated): onAuthStateChange event:', event, 'session:', session?.user?.id);
        if (session?.user) {
          try {
            console.log('SupabaseService (Updated): Cargando perfil para usuario:', session.user.id);
            const profile = await this.getUserProfile(session.user.id);
            console.log('SupabaseService (Updated): Perfil cargado con éxito:', profile);
            this.currentUserProfile.set(profile);
          } catch (e) {
            console.warn('SupabaseService (Updated): Error al cargar perfil:', e);
            this.currentUserProfile.set({
              id: session.user.id,
              username: session.user.email?.split('@')[0] || 'Entrenador'
            });
          }
        } else {
          console.log('SupabaseService (Updated): No hay sesión activa.');
          this.currentUserProfile.set(null);
        }
      });

      console.log('Supabase client reinitialized with new credentials');
      return true;
    } catch (e) {
      console.error('Failed to update Supabase credentials:', e);
      return false;
    }
  }

  get client(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Please configure it in settings.');
    }
    return this.supabase;
  }

  isConfigured(): boolean {
    return this.supabase !== null;
  }

  // --- AUTH METHODS ---

  async signUp(email: string, username: string, secret: string) {
    console.log('SupabaseService: signUp llamado para', email);
    if (!this.supabase) throw new Error('Supabase no configurado');
    
    // Create Auth User
    console.log('SupabaseService: Enviando petición de signUp a auth...');
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password: secret
    });

    if (authError) {
      console.error('SupabaseService: Error en auth.signUp:', authError);
      throw authError;
    }
    if (!authData.user) throw new Error('No se pudo registrar el usuario');
    console.log('SupabaseService: Usuario de auth creado:', authData.user.id);

    // Create profile
    console.log('SupabaseService: Insertando en la tabla profiles...');
    const { error: profileError } = await this.supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: username
      });

    if (profileError) {
      console.error('Error al guardar el perfil en la base de datos:', profileError);
    } else {
      console.log('SupabaseService: Registro de perfil completado con éxito.');
    }

    return authData.user;
  }

  async signIn(email: string, secret: string) {
    console.log('SupabaseService: signIn llamado para', email);
    if (!this.supabase) throw new Error('Supabase no configurado');
    console.log('SupabaseService: Enviando petición de signIn a auth...');
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: secret
    });
    if (error) {
      console.error('SupabaseService: Error en auth.signIn:', error);
      throw error;
    }
    console.log('SupabaseService: Inicio de sesión de auth exitoso para:', data.user?.id);
    return data.user;
  }

  async signOut() {
    console.log('SupabaseService: signOut llamado');
    if (!this.supabase) return;
    await this.supabase.auth.signOut();
  }

  async getUserProfile(userId: string) {
    console.log('SupabaseService: getUserProfile llamado para', userId);
    if (!this.supabase) throw new Error('Supabase no configurado');
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('SupabaseService: Error en getUserProfile:', error);
      throw error;
    }
    return data;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.supabase) return null;
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  // --- ONLINE PVP METHODS (Salas de Juego) ---

  async createRoom(player1Id: string, deckIds: number[]): Promise<any> {
    if (!this.supabase) throw new Error('Supabase no configurado');
    
    // Generate simple 6-character room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialState = {
      p1: { id: player1Id, lp: 4000, deck: deckIds, hand: [], field: [], discarded: [], ready: false },
      p2: { id: null, lp: 4000, deck: [], hand: [], field: [], discarded: [], ready: false },
      status: 'waiting',
      turn: player1Id,
      phase: 'draw',
      actions: []
    };

    const { data, error } = await this.supabase
      .from('game_rooms')
      .insert({
        room_code: roomCode,
        player_1_id: player1Id,
        status: 'waiting',
        current_turn_id: player1Id,
        game_state: initialState
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async joinRoom(roomCode: string, player2Id: string, deckIds: number[]): Promise<any> {
    if (!this.supabase) throw new Error('Supabase no configurado');

    // Get current room details
    const { data: room, error: fetchError } = await this.supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .eq('status', 'waiting')
      .single();

    if (fetchError || !room) {
      throw new Error('La sala no existe o ya no está disponible');
    }

    if (room.player_1_id === player2Id) {
      throw new Error('No puedes unirte a tu propia sala como oponente');
    }

    const updatedState = {
      ...room.game_state,
      p2: {
        id: player2Id,
        lp: 4000,
        deck: deckIds,
        hand: [],
        field: [],
        discarded: [],
        ready: false
      },
      status: 'playing'
    };

    const { data, error } = await this.supabase
      .from('game_rooms')
      .update({
        player_2_id: player2Id,
        status: 'playing',
        game_state: updatedState
      })
      .eq('room_code', roomCode)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateGameState(roomId: string, gameState: any, currentTurnId: string): Promise<void> {
    if (!this.supabase) throw new Error('Supabase no configurado');

    await this.supabase
      .from('game_rooms')
      .update({
        game_state: gameState,
        current_turn_id: currentTurnId
      })
      .eq('id', roomId);
  }

  async finishRoomMatch(roomId: string, winnerId: string | null): Promise<void> {
    if (!this.supabase) throw new Error('Supabase no configurado');

    // Update room status
    await this.supabase
      .from('game_rooms')
      .update({
        status: 'finished'
      })
      .eq('id', roomId);

    // Get Room Info to write match history
    const { data: room } = await this.supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (room) {
      // Record match results
      await this.supabase
        .from('match_history')
        .insert({
          player_1_id: room.player_1_id,
          player_2_id: room.player_2_id,
          winner_id: winnerId,
          mode: 'online'
        });
    }
  }

  async recordCPUMatch(playerId: string, won: boolean): Promise<void> {
    if (!this.supabase) return; // Silent return if not configured

    await this.supabase
      .from('match_history')
      .insert({
        player_1_id: playerId,
        player_2_id: null,
        winner_id: won ? playerId : null,
        mode: 'cpu'
      });
  }

  async getRemoteMatchHistory(userId: string): Promise<any[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('match_history')
      .select(`
        id,
        mode,
        created_at,
        player_1:player_1_id ( username ),
        player_2:player_2_id ( username ),
        winner:winner_id ( username )
      `)
      .or(`player_1_id.eq.${userId},player_2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching remote history:', error);
      return [];
    }
    return data || [];
  }
}
