import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-account-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <h1>Tu cuenta</h1>
      @if (auth.user(); as u) {
        <div class="card" style="max-width: 420px">
          <p class="mb-2"><strong>{{ u.username }}</strong></p>
          <p class="text-muted">{{ u.email }}</p>
          <p>Puntos de socio: <strong class="mono">{{ u.points ?? 0 }}</strong></p>
          <p class="text-sm text-muted">8 puntos × tamaño de grupo al completar una noche.</p>
          <a routerLink="/mis-noches" class="btn btn-primary">Mis noches</a>
        </div>
      }
    </div>
  `,
})
export class AccountPageComponent implements OnInit {
  public readonly auth = inject(AuthService);
  ngOnInit(): void {
    this.auth.refreshProfile();
  }
}
