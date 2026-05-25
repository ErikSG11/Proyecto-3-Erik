import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="flex items-center gap-4 mb-8">
        <a routerLink="/" class="text-slate-400 hover:text-slate-100 transition-colors">← Volver al Inicio</a>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h2 class="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
          GUÍA Y REGLAS DEL JUEGO
        </h2>

        <!-- INTRO -->
        <section class="space-y-2">
          <h3 class="text-xl font-bold text-slate-100 font-display border-b border-slate-800 pb-2">1. Introducción</h3>
          <p class="text-sm text-slate-400 leading-relaxed">
            <strong>PokeDuel</strong> es un duelo estratégico de cartas por turnos que fusiona el universo de Pokémon con la dinámica competitiva de cartas estilo Yu-Gi-Oh!. Enfréntate a la computadora o a otros jugadores en línea usando tu mazo personalizado.
          </p>
        </section>

        <!-- PREPARACIÓN -->
        <section class="space-y-2">
          <h3 class="text-xl font-bold text-slate-100 font-display border-b border-slate-800 pb-2">2. Preparación</h3>
          <ul class="list-disc list-inside text-sm text-slate-400 space-y-1">
            <li>Cada duelista inicia la partida con <strong>4000 puntos de vida (LP)</strong>.</li>
            <li>El mazo debe tener exactamente <strong>25 cartas</strong> de Pokémon.</li>
            <li>Al inicio del duelo, ambos jugadores barajan su mazo y roban una mano inicial de <strong>5 cartas</strong>.</li>
            <li>El tablero tiene un límite de **5 cartas activas** por jugador.</li>
          </ul>
        </section>

        <!-- SECUENCIA DEL TURNO -->
        <section class="space-y-2">
          <h3 class="text-xl font-bold text-slate-100 font-display border-b border-slate-800 pb-2">3. Secuencia del Turno</h3>
          <p class="text-sm text-slate-400">Cada turno consta de 4 fases consecutivas:</p>
          <ol class="list-decimal list-inside text-sm text-slate-400 space-y-2 pl-2">
            <li>
              <strong class="text-teal-400">Fase de Robo:</strong> 
              Robas automáticamente 1 carta de tu mazo. Si no te quedan cartas que robar, pierdes la partida.
            </li>
            <li>
              <strong class="text-teal-400">Fase Principal:</strong> 
              Puedes colocar hasta un Pokémon de tu mano en el campo (límite: 1 invocación por turno). Al invocarlo, decides su posición:
              <ul class="list-disc list-inside pl-6 mt-1 text-xs">
                <li><strong class="text-amber-400">Modo de Ataque:</strong> Se muestra vertical. Su valor ATK se usará para combatir.</li>
                <li><strong class="text-amber-400">Modo de Defensa:</strong> Se muestra horizontal. Su valor DEF se usará para proteger tus LP.</li>
              </ul>
              También puedes activar la **Habilidad Especial** de cualquiera de tus cartas en juego (una vez por carta).
            </li>
            <li>
              <strong class="text-teal-400">Fase de Ataque:</strong> 
              Tus cartas en Modo de Ataque pueden declarar un ataque contra los Pokémon del oponente. Si el oponente no tiene cartas en el campo, ¡puedes atacar directamente a sus puntos de vida (LP)!
            </li>
            <li>
              <strong class="text-teal-400">Fase Final:</strong> 
              Termina tu turno y se transfiere el control al oponente.
            </li>
          </ol>
        </section>

        <!-- REGLAS DE COMBATE -->
        <section class="space-y-2">
          <h3 class="text-xl font-bold text-slate-100 font-display border-b border-slate-800 pb-2">4. Reglas de Combate</h3>
          <p class="text-sm text-slate-400 leading-relaxed">
            Cuando un Pokémon declara un ataque sobre otro, se comparan sus valores:
          </p>
          <ul class="list-disc list-inside text-sm text-slate-400 space-y-2 pl-2">
            <li>
              <strong>Ataque contra Carta en Modo Ataque:</strong>
              Se compara el ATK de tu carta contra el ATK de la carta rival. El Pokémon con menor ATK es destruido y enviado al cementerio. Su dueño recibe la diferencia en daño directo a sus LP.
            </li>
            <li>
              <strong>Ataque contra Carta en Modo Defensa:</strong>
              Se compara el ATK de tu carta contra el DEF de la carta rival. Si tu ATK supera la DEF rival, el Pokémon defensor es destruido sin daño a los LP del oponente. Si tu ATK es inferior a la DEF rival, la carta defensora sobrevive y tú recibes la diferencia de daño en tus LP.
            </li>
          </ul>
        </section>

        <!-- HABILIDADES ESPECIALES -->
        <section class="space-y-2">
          <h3 class="text-xl font-bold text-slate-100 font-display border-b border-slate-800 pb-2">5. Habilidades Especiales</h3>
          <p class="text-sm text-slate-400 mb-2">Cada tipo de Pokémon posee un efecto único que puede cambiar el rumbo de la partida:</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <strong class="text-red-400 block text-sm">🔥 Llamarada (Fuego / Veneno / Bicho)</strong>
              Inflige 300 puntos de daño directo a los LP del oponente.
            </div>
            <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <strong class="text-blue-400 block text-sm">💧 Hidrobomba (Agua / Hielo)</strong>
              Restaura 400 puntos de tus propios LP.
            </div>
            <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <strong class="text-emerald-400 block text-sm">🍃 Drenado (Planta / Tierra / Roca)</strong>
              Roba 1 carta adicional de tu mazo directamente a tu mano.
            </div>
            <div class="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <strong class="text-yellow-400 block text-sm">⚡ Impactrueno (Eléctrico / Lucha / Acero)</strong>
              Paraliza a un Pokémon enemigo en el campo, impidiéndole atacar el siguiente turno.
            </div>
            <div class="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <strong class="text-purple-400 block text-sm">🔮 Escudo Psíquico (Psíquico / Fantasma / Hada)</strong>
              Otorga +500 de defensa (DEF) permanente a esta carta en juego.
            </div>
            <div class="p-3 bg-slate-500/10 border border-slate-500/20 rounded-xl">
              <strong class="text-slate-400 block text-sm">🐉 Furia Dragón (Dragón / Normal / Volador)</strong>
              Otorga +400 de ataque (ATK) permanente a esta carta en juego.
            </div>
          </div>
        </section>

        <!-- CONDICIÓN DE VICTORIA -->
        <section class="space-y-2">
          <h3 class="text-xl font-bold text-slate-100 font-display border-b border-slate-800 pb-2">6. Condiciones de Victoria</h3>
          <p class="text-sm text-slate-400">Una partida termina inmediatamente cuando:</p>
          <ul class="list-disc list-inside text-sm text-slate-400 space-y-1">
            <li>Los LP de un jugador se reducen a 0 o menos. (Ganador: El jugador con LP restantes).</li>
            <li>Un jugador no puede robar una carta durante su Fase de Robo porque su mazo está vacío.</li>
            <li>Un jugador abandona la partida o cierra la ventana.</li>
          </ul>
        </section>
      </div>
    </div>
  `
})
export class HelpComponent {}
