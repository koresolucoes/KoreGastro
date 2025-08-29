import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
// FIX: Updated to modern RxJS import path.
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive]
})
export class AppComponent {
  // FIX: Explicitly type `router` to resolve an issue where its type was inferred as `unknown`.
  router: Router = inject(Router);
  currentTitle = signal('Carregando...');

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Access route data from the first child of the activated route snapshot
      let route = this.router.routerState.snapshot.root;
      let title = '';
      while (route.firstChild) {
        route = route.firstChild;
        if (route.data['title']) {
          title = route.data['title'];
        }
      }
      this.currentTitle.set(title || 'Sistema de Gestão');
    });
  }
}