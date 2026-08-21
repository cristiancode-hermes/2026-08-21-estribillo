import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoomsService } from '../core/rooms.service';
import type { Room } from '../shared/models';
import { FormatBase } from '../shared/format';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <div class="page home-page">
      <div class="container">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">Estribillo · karaoke en cabina</p>
            <h1>La cabina es el<span class="accent-inline"> producto.</span></h1>
            <p class="lead">
              Siete cabinas privadas, cola de canciones y bar. Elige día y franja,
              retiene 15 minutos y canta con ticket QR en el móvil.
            </p>
            <div class="hero-actions">
              <a routerLink="/cabinas" class="btn btn-primary btn-lg">Reservar cabina</a>
              <a routerLink="/cabinas" class="btn btn-secondary btn-lg">Ver plano</a>
            </div>
            <div class="hero-ticker" aria-label="Estadística rápida">
              <span class="ticker-pip"></span>
              <span>Retención de <strong>15 min</strong> sin pagar</span>
            </div>
          </div>
          <aside class="hero-visual" aria-hidden="true">
            <div class="hero-photo-wrap">
              <img
                class="hero-photo"
                src="/assets/rooms/hero.jpg"
                alt=""
                width="640"
                height="440"
                loading="eager"
              />
              <span class="hero-chip chip-free">● 4 cabinas libres ahora</span>
            </div>
            <div class="hero-panel">
              <h3>Horario hoy</h3>
              <ul class="hours-list">
                <li><span class="day">Lun — Jue</span><span class="time">16:00 – 23:00</span></li>
                <li><span class="day">Vie — Sáb</span><span class="time">16:00 – 00:00</span></li>
                <li><span class="day">Domingo</span><span class="time">16:00 – 22:00</span></li>
              </ul>
              <p class="text-sm text-muted mt-3 mb-0">Sesiones de 60 min · Europe/Madrid</p>
            </div>
          </aside>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <p class="eyebrow">Esta noche</p>
              <h2>Cabinas destacadas</h2>
            </div>
            <a routerLink="/cabinas" class="link-arrow">Catálogo completo →</a>
          </div>

          @if (loading()) {
            <div class="card-grid">
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="card room-card"><div class="skeleton" style="height: 200px"></div></div>
              }
            </div>
          } @else if (error()) {
            <div class="error-state">
              <h3>No se pudieron cargar las cabinas</h3>
              <p>{{ error() }}</p>
              <button type="button" class="btn btn-primary" (click)="load()">Reintentar</button>
            </div>
          } @else if (featured().length === 0) {
            <div class="empty-state">
              <h3>Hoy no hay franjas publicadas</h3>
              <a routerLink="/cabinas" class="btn btn-primary">Ver cabinas</a>
            </div>
          } @else {
            <div class="card-grid">
              @for (room of featured(); track room.id) {
                <a class="card room-card" [routerLink]="['/cabinas', room.id]">
                  <div class="room-swatch">
                    <img
                      class="room-photo"
                      [src]="roomImg(room)"
                      [alt]="room.name"
                      width="480"
                      height="270"
                      loading="lazy"
                    />
                    <span class="room-num-badge">{{ room.type }}</span>
                    @if (!room.maintenance && (room.freeSlotsToday ?? 0) > 0) {
                      <span class="room-free-dot"><span class="dot"></span>{{ room.freeSlotsToday }} huecos</span>
                    }
                  </div>
                  <div class="room-card-body">
                    <div class="room-card-top">
                      <h3>{{ room.name }}</h3>
                      @if (room.maintenance) {
                        <span class="badge">Mantenimiento</span>
                      } @else if ((room.freeSlotsToday ?? 0) > 0) {
                        <span class="badge chip-free">Libre</span>
                      } @else {
                        <span class="badge chip-busy">Ocupada</span>
                      }
                    </div>
                    <p class="text-sm text-muted mb-0">Máx. {{ room.maxPlayers }} jugadores</p>
                    <div class="room-card-foot">
                      <span class="price">desde {{ eur(room.priceCents) }}</span>
                      @if (room.ratingAvg != null) {
                        <span class="text-sm text-muted">★ {{ room.ratingAvg.toFixed(1) }}</span>
                      }
                    </div>
                  </div>
                </a>
              }
            </div>
          }
        </section>

        <section class="section cta-band">
          <div class="cta-band-inner">
            <div>
              <h2 class="mb-0">¿Con quién cantas esta noche?</h2>
              <p class="mb-0 mt-2">
                Elige cabina, franja y canciones. Retén 15 minutos y confirma con QR.
              </p>
            </div>
            <a routerLink="/cabinas" class="btn btn-primary btn-lg">Elegir cabina</a>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class HomePageComponent extends FormatBase implements OnInit {
  private readonly roomsApi = inject(RoomsService);
  protected readonly featured = signal<Room[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

  protected roomImg(room: Room): string {
    return room.imageUrl || `/assets/rooms/${room.slug || room.imageKey || 'eco'}.jpg`;
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.roomsApi.featured().subscribe({
      next: (items) => {
        this.featured.set(items.slice(0, 8));
        this.loading.set(false);
      },
      error: () => {
        this.roomsApi.list().subscribe({
          next: (res) => {
            this.featured.set(res.items.slice(0, 4));
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set(err?.error?.message || 'Error de red');
            this.loading.set(false);
          },
        });
      },
    });
  }
}
