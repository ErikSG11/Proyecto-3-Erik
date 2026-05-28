import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/" class="text-slate-500 hover:text-indigo-650 text-sm font-semibold transition-colors flex items-center gap-1.5 group">
          <span class="transition-transform group-hover:-translate-x-1">←</span> Volver al Inicio
        </a>
      </div>

      <div class="bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
        <h2 class="text-3xl sm:text-4xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-650 tracking-tight">
          GUÍA Y REGLAS DEL JUEGO
        </h2>

        <!-- INTRO -->
        <section class="space-y-3">
          <h3 class="text-lg font-bold text-slate-800 font-display border-b border-slate-100 pb-2 flex items-center gap-2">
            <span class="text-indigo-500 font-black">01.</span> Introducción
          </h3>
          <p class="text-sm text-slate-550 leading-relaxed font-medium">
            <strong>PokeDuel</strong> es un duelo estratégico de cartas por turnos que fusiona el universo de Pokémon con la dinámica competitiva de cartas estilo Yu-Gi-Oh!. Enfréntate a la computadora o a otros jugadores en línea usando tu mazo personalizado.
          </p>
        </section>

        <!-- PREPARACIÓN -->
        <section class="space-y-3">
          <h3 class="text-lg font-bold text-slate-800 font-display border-b border-slate-100 pb-2 flex items-center gap-2">
            <span class="text-indigo-500 font-black">02.</span> Preparación
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 bg-slate-50/60 border border-slate-150 rounded-2xl">
              <span class="block text-indigo-650 font-bold text-xs uppercase tracking-wider mb-1">Puntos de Vida</span>
              <p class="text-xs text-slate-500 font-medium leading-normal">Cada duelista inicia la partida con <strong class="text-slate-700">4000 LP (Puntos de Vida)</strong>. Reducir los LP del oponente a 0 te dará la victoria.</p>
            </div>
            <div class="p-4 bg-slate-50/60 border border-slate-150 rounded-2xl">
              <span class="block text-indigo-650 font-bold text-xs uppercase tracking-wider mb-1">Mazo Requerido</span>
              <p class="text-xs text-slate-500 font-medium leading-normal">Tu mazo de combate debe contener exactamente <strong class="text-slate-700">25 cartas</strong> de Pokémon. Puedes configurarlo en el Deck Builder.</p>
            </div>
            <div class="p-4 bg-slate-50/60 border border-slate-150 rounded-2xl">
              <span class="block text-indigo-650 font-bold text-xs uppercase tracking-wider mb-1">Mano Inicial</span>
              <p class="text-xs text-slate-500 font-medium leading-normal">Al inicio de cada combate, ambos jugadores roban una mano inicial de <strong class="text-slate-700">5 cartas</strong> de sus respectivos mazos.</p>
            </div>
            <div class="p-4 bg-slate-50/60 border border-slate-150 rounded-2xl">
              <span class="block text-indigo-650 font-bold text-xs uppercase tracking-wider mb-1">Límite del Tablero</span>
              <p class="text-xs text-slate-500 font-medium leading-normal">Solo puedes tener un máximo de <strong class="text-slate-700">5 cartas activas</strong> en tu zona del campo simultáneamente.</p>
            </div>
          </div>
        </section>

        <!-- SECUENCIA DEL TURNO -->
        <section class="space-y-3">
          <h3 class="text-lg font-bold text-slate-800 font-display border-b border-slate-100 pb-2 flex items-center gap-2">
            <span class="text-indigo-500 font-black">03.</span> Secuencia del Turno
          </h3>
          <p class="text-sm text-slate-550 font-medium">Cada turno se divide en 4 fases consecutivas que determinan tus acciones posibles:</p>
          <div class="space-y-3 mt-3">
            <div class="flex gap-4 p-4 border border-slate-150 rounded-2xl bg-white shadow-xs">
              <div class="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-sm">1</div>
              <div>
                <strong class="text-slate-800 text-sm block">Fase de Robo (Draw Phase)</strong>
                <span class="text-xs text-slate-500 font-medium leading-relaxed mt-0.5 block">Robas automáticamente 1 carta de tu mazo a tu mano. Si no quedan cartas que robar en tu mazo al inicio de tu turno, pierdes el duelo de forma automática.</span>
              </div>
            </div>
            <div class="flex gap-4 p-4 border border-slate-150 rounded-2xl bg-white shadow-xs">
              <div class="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-sm">2</div>
              <div>
                <strong class="text-slate-800 text-sm block">Fase Principal (Main Phase)</strong>
                <span class="text-xs text-slate-500 font-medium leading-relaxed mt-0.5 block">
                  Puedes colocar 1 Pokémon de tu mano en el campo (límite de 1 invocación por turno). Elige su modo de juego:
                  <span class="block mt-1 font-semibold text-slate-600">⚔️ Modo de Ataque: Se coloca vertical; se combate usando su valor de ATK.</span>
                  <span class="block mt-0.5 font-semibold text-slate-650">🛡️ Modo de Defensa: Se coloca horizontal; protege tus LP usando su valor de DEF.</span>
                  También puedes activar la Habilidad Especial de tus Pokémon en el campo (una vez por turno, por cada carta).
                </span>
              </div>
            </div>
            <div class="flex gap-4 p-4 border border-slate-150 rounded-2xl bg-white shadow-xs">
              <div class="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-sm">3</div>
              <div>
                <strong class="text-slate-800 text-sm block">Fase de Ataque (Battle Phase)</strong>
                <span class="text-xs text-slate-500 font-medium leading-relaxed mt-0.5 block">Tus monstruos en Modo de Ataque pueden declarar un combate contra las cartas en juego del oponente. Si el rival no tiene cartas defensivas, ¡puedes lanzar un ataque directo a sus LP!</span>
              </div>
            </div>
            <div class="flex gap-4 p-4 border border-slate-150 rounded-2xl bg-white shadow-xs">
              <div class="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-sm">4</div>
              <div>
                <strong class="text-slate-800 text-sm block">Fase Final (End Phase)</strong>
                <span class="text-xs text-slate-500 font-medium leading-relaxed mt-0.5 block">Se finalizan los efectos temporales y se cede el control del duelo al oponente, quien inicia su respectiva Fase de Robo.</span>
              </div>
            </div>
          </div>
        </section>

        <!-- REGLAS DE COMBATE -->
        <section class="space-y-3">
          <h3 class="text-lg font-bold text-slate-800 font-display border-b border-slate-100 pb-2 flex items-center gap-2">
            <span class="text-indigo-500 font-black">04.</span> Combate de Cartas
          </h3>
          <p class="text-sm text-slate-550 leading-relaxed font-medium">
            Cuando un Pokémon declara un ataque, su daño y supervivencia se definen según la posición del objetivo:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div class="p-4 border border-emerald-100 bg-emerald-50/10 rounded-2xl">
              <span class="block text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2">⚔️ vs Posición de Ataque</span>
              <p class="text-xs text-slate-550 font-medium leading-relaxed">
                Se compara tu <strong class="text-slate-700">ATK</strong> con el <strong class="text-slate-700">ATK</strong> del rival. El Pokémon con menor valor es destruido. Su dueño recibe daño directo a sus LP por la diferencia de poder.
              </p>
            </div>
            <div class="p-4 border border-blue-100 bg-blue-50/10 rounded-2xl">
              <span class="block text-blue-700 font-bold text-xs uppercase tracking-wider mb-2">🛡️ vs Posición de Defensa</span>
              <p class="text-xs text-slate-550 font-medium leading-relaxed">
                Se compara tu <strong class="text-slate-700">ATK</strong> con la <strong class="text-slate-700">DEF</strong> rival. Si tu ATK supera la DEF, el defensor se destruye sin daño a los LP del oponente. Si tu ATK es inferior, recibes daño igual a la diferencia.
              </p>
            </div>
          </div>
        </section>

        <!-- HABILIDADES ESPECIALES -->
        <section class="space-y-3">
          <h3 class="text-lg font-bold text-slate-800 font-display border-b border-slate-100 pb-2 flex items-center gap-2">
            <span class="text-indigo-500 font-black">05.</span> Habilidades Especiales
          </h3>
          <p class="text-sm text-slate-550 font-medium mb-3">Cada tipo elemental de Pokémon posee un efecto único y estratégico que se puede activar una vez por turno:</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div class="p-3.5 bg-rose-50/50 border border-rose-100/80 rounded-2xl flex flex-col justify-between">
              <div>
                <strong class="text-rose-600 block text-xs font-black uppercase tracking-wider mb-1">🔥 Llamarada</strong>
                <p class="text-slate-500 font-medium leading-normal">Inflige 300 puntos de daño directo a los LP del oponente.</p>
              </div>
              <span class="text-[9px] font-bold text-rose-500 mt-2 block font-mono">FUEGO / VENENO / BICHO</span>
            </div>
            <div class="p-3.5 bg-blue-50/50 border border-blue-100/80 rounded-2xl flex flex-col justify-between">
              <div>
                <strong class="text-blue-600 block text-xs font-black uppercase tracking-wider mb-1">💧 Hidrobomba</strong>
                <p class="text-slate-500 font-medium leading-normal">Restaura 400 puntos de tus propios LP (máx 4000).</p>
              </div>
              <span class="text-[9px] font-bold text-blue-500 mt-2 block font-mono">AGUA / HIELO</span>
            </div>
            <div class="p-3.5 bg-emerald-50/50 border border-emerald-100/80 rounded-2xl flex flex-col justify-between">
              <div>
                <strong class="text-emerald-600 block text-xs font-black uppercase tracking-wider mb-1">🍃 Drenado</strong>
                <p class="text-slate-500 font-medium leading-normal">Roba 1 carta adicional de tu mazo directamente a tu mano.</p>
              </div>
              <span class="text-[9px] font-bold text-emerald-500 mt-2 block font-mono">PLANTA / TIERRA / ROCA</span>
            </div>
            <div class="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex flex-col justify-between">
              <div>
                <strong class="text-amber-700 block text-xs font-black uppercase tracking-wider mb-1">⚡ Impactrueno</strong>
                <p class="text-slate-500 font-medium leading-normal">Paraliza a un Pokémon enemigo, impidiéndole atacar en su siguiente turno.</p>
              </div>
              <span class="text-[9px] font-bold text-amber-600 mt-2 block font-mono">ELÉCTRICO / LUCHA / ACERO</span>
            </div>
            <div class="p-3.5 bg-purple-50/50 border border-purple-100/80 rounded-2xl flex flex-col justify-between">
              <div>
                <strong class="text-purple-600 block text-xs font-black uppercase tracking-wider mb-1">🔮 Escudo Psíquico</strong>
                <p class="text-slate-500 font-medium leading-normal">Otorga +500 de defensa (DEF) permanente a esta carta en juego.</p>
              </div>
              <span class="text-[9px] font-bold text-purple-500 mt-2 block font-mono">PSÍQUICO / FANTASMA / HADA</span>
            </div>
            <div class="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex flex-col justify-between">
              <div>
                <strong class="text-slate-600 block text-xs font-black uppercase tracking-wider mb-1">🐉 Furia Dragón</strong>
                <p class="text-slate-500 font-medium leading-normal">Otorga +400 de ataque (ATK) permanente a esta carta en juego.</p>
              </div>
              <span class="text-[9px] font-bold text-slate-500 mt-2 block font-mono">DRAGÓN / NORMAL / VOLADOR</span>
            </div>
          </div>
        </section>

        <!-- CONDICIÓN DE VICTORIA -->
        <section class="space-y-3 pb-2">
          <h3 class="text-lg font-bold text-slate-800 font-display border-b border-slate-100 pb-2 flex items-center gap-2">
            <span class="text-indigo-500 font-black">06.</span> Condiciones de Victoria
          </h3>
          <p class="text-sm text-slate-550 font-medium">Una partida finaliza de inmediato si ocurre una de las siguientes situaciones:</p>
          <ul class="list-disc list-inside text-xs text-slate-500 font-medium space-y-1.5 pl-2 leading-relaxed">
            <li>Los LP de un duelista se reducen a <strong class="text-rose-600">0 o menos</strong>. (El duelista con LP restantes gana).</li>
            <li>Un jugador no puede robar una carta durante su Fase de Robo porque su <strong class="text-indigo-650">mazo está vacío</strong> (Deck Out).</li>
            <li>Un jugador decide rendirse o se desconecta de la partida.</li>
          </ul>
        </section>
      </div>
    </div>
  `
})
export class HelpComponent {}
