import { Routes } from '@angular/router';
import { HomeComponent } from './components/home.component';
import { SettingsComponent } from './components/settings.component';
import { HelpComponent } from './components/help.component';
import { DeckComponent } from './components/deck.component';
import { HistoryComponent } from './components/history.component';
import { AuthComponent } from './components/auth.component';
import { GameComponent } from './components/game.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'help', component: HelpComponent },
  { path: 'collection', component: DeckComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'game/cpu', component: GameComponent },
  { path: 'game/online', component: GameComponent },
  { path: '**', redirectTo: '' }
];

