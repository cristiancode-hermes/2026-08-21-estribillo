import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoomsService } from '../core/rooms.service';
import type { Room } from '../shared/models';
import { FormatBase } from '../shared/format';

@Component({
  selector: 'app-rooms-catalogue-page',
  imports: [RouterLink, FormsModule, DecimalPipe],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Cabinas</h1>
          <p class="page-subtitle text-muted mb-0">Plano del local · elige y reserva</p>
        </div>
      </div>

      <div class="filters-bar">
        <div class="form-group">
          <label class="form-label" for="q">Buscar</label>
          <input
            id="q"
            class="input"
            type="search"
            placeholder="Nombre o número"
            [ngModel]="query()"
            (ngModelChange)="query.set($event); load()"
          />
        </div>
        <label class="check-row" style="margin-bottom: 0">
          <input
            type="checkbox"
            [checked]="onlyFree()"
            (change)="onlyFree.set($any($event.target).checked); load()"
          />
          Solo libres hoy
        </label>
      </div>

      @if (loading()) {
        <div class="card-grid">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="card"><div class="skeleton" style="height: 180px"></div></div>
          }
        </div>
      } @else if (error()) {
        <div class="error-state">
          <h3>Error al cargar</h3>
          <p>{{ error() }}</p>
          <button type="button" class="btn btn-primary" (click)="load()">Reintentar</button>
        </div>
      } @else if (rooms().length === 0) {
        <div class="empty-state">
          <h3>{{ onlyFree() ? 'Ninguna cabina libre hoy' : 'No hay cabinas activas' }}</h3>
          @if (onlyFree()) {
            <button type="button" class="btn btn-secondary" (click)="onlyFree.set(false); load()">
              Quitar filtro
            </button>
          }
        </div>
      } @else {
        <div class="card-grid">
          @for (room of rooms(); track room.id) {
            <a
              class="card room-card"
              [routerLink]="room.maintenance || !room.active ? null : ['/cabinas', room.id]"
              [class.disabled]="room.maintenance || !room.active"
              (click)="room.maintenance && $event.preventDefault()"
            >
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
              </div>
              <div class="room-card-body">
                <div class="between">
                  <h3>{{ room.name }}</h3>
                  @if (room.maintenance || !room.active) {
                    <span class="badge">Mantenimiento</span>
                  } @else if ((room.freeSlotsToday ?? 0) > 0) {
                    <span class="badge chip-free">Libre</span>
                  } @else {
                    <span class="badge chip-busy">Ocupada</span>
                  }
                </div>
                <p class="text-sm mb-0">Hasta {{ room.maxPlayers }} jugadores</p>
                <div class="room-card-foot">
                  <span class="price">{{ eur(room.priceCents) }}/h</span>
                  <span class="text-sm text-muted">{{ room.freeSlotsToday ?? 0 }} huecos hoy</span>
                  @if (room.ratingAvg != null) {
                    <span class="text-sm text-muted">★ {{ room.ratingAvg | number: '1.1-1' }}</span>
                  }
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class RoomsCataloguePageComponent extends FormatBase implements OnInit {
  private readonly roomsApi = inject(RoomsService);
  protected readonly rooms = signal<Room[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly query = signal('');
  protected readonly onlyFree = signal(false);

  ngOnInit(): void {
    this.load();
  }

  protected roomImg(room: Room): string {
    return room.imageUrl || `/assets/rooms/${room.slug || room.imageKey || 'eco'}.jpg`;
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.roomsApi
      .list({
        availableToday: this.onlyFree() ? true : undefined,
        q: this.query().trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.rooms.set(res.items);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Error de red');
          this.loading.set(false);
        },
      });
  }
}
