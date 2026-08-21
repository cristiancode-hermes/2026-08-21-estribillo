import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { RoomsService } from '../core/rooms.service';
import { AuthService } from '../core/auth.service';
import type { Room, Review, SlotView } from '../shared/models';
import { FormatBase, addDaysISO, todayISO } from '../shared/format';

@Component({
  selector: 'app-room-detail-page',
  imports: [RouterLink, FormsModule, DecimalPipe],
  template: `
    <div class="container page">
      @if (loading()) {
        <div class="skeleton" style="height: 280px"></div>
      } @else if (error()) {
        <div class="error-state">
          <h3>Cabina no disponible</h3>
          <p>{{ error() }}</p>
          <a routerLink="/cabinas" class="btn btn-primary">Volver al catálogo</a>
        </div>
      } @else if (room()) {
        <div class="room-hero">
          <img
            class="room-hero-photo"
            [src]="roomImg(room()!)"
            [alt]="room()!.name"
            width="1120"
            height="420"
            loading="eager"
          />
          <span class="room-num-badge hero">{{ room()!.number }}</span>
        </div>

        <div class="page-header">
          <div>
            <p class="eyebrow">Cabina {{ room()!.number }}</p>
            <h1>{{ room()!.name }}</h1>
            <p class="page-subtitle">{{ room()!.description || 'Cabina de karaoke · sesión 60 min' }}</p>
          </div>
          <div class="stack-end">
            <span class="price">{{ eur(room()!.priceCents) }}/h</span>
            @if (ratingAvg() != null) {
              <span class="text-sm text-muted">★ {{ ratingAvg() | number: '1.1-1' }} ({{ ratingCount() }})</span>
            }
            <span class="text-sm text-muted">{{ room()!.freeSlotsToday ?? 0 }} huecos hoy</span>
          </div>
        </div>

        <div class="detail-grid">
          <section class="card">
            <div class="between mb-3">
              <h2 class="mb-0">Franjas</h2>
              <input
                class="input"
                type="date"
                [ngModel]="date()"
                (ngModelChange)="onDate($event)"
                [attr.min]="minDate"
                [attr.max]="maxDate"
              />
            </div>
            <p class="text-sm text-muted">Máx. {{ room()!.maxPlayers }} cantantes · {{ room()!.type }}</p>
            @if (slotsLoading()) {
              <div class="skeleton" style="height: 120px"></div>
            } @else if (slots().length === 0) {
              <div class="empty-state">
                <h3>Sin franjas este día</h3>
                <p>Prueba otra fecha.</p>
              </div>
            } @else {
              <div class="slot-grid">
                @for (s of slots(); track s.id) {
                  @let st = slotState(s);
                  <button
                    type="button"
                    class="slot-btn"
                    [class.free]="st === 'free'"
                    [class.busy]="st === 'busy' || st === 'booked'"
                    [class.held]="st === 'held'"
                    [class.blocked]="st === 'blocked'"
                    [disabled]="st !== 'free'"
                    (click)="book(s)"
                  >
                    <span class="time">{{ s.startTime }}–{{ s.endTime }}</span>
                    <span class="seats">{{
                      st === 'free' ? 'Libre' : st === 'blocked' ? 'Bloqueada' : st === 'held' ? 'En hold' : 'Ocupada'
                    }}</span>
                  </button>
                }
              </div>
            }
          </section>

          <aside class="stack">
            <div class="card">
              <h3>Detalles</h3>
              <ul class="meta-list">
                <li><span>Precio base</span><strong>{{ eur(room()!.priceCents) }}</strong></li>
                <li><span>Jugadores</span><strong>1–{{ room()!.maxPlayers }}</strong></li>
                <li><span>Hold</span><strong>15 min</strong></li>
              </ul>
              <a class="btn btn-secondary btn-block mt-3" [routerLink]="['/cabinas', room()!.id, 'resena']">Escribir reseña</a>
            </div>
            <div class="card">
              <h3>Reseñas</h3>
              @if (reviews().length === 0) {
                <p class="text-sm text-muted mb-0">Aún no hay reseñas.</p>
              } @else {
                @for (r of reviews(); track r.id) {
                  <div class="review-row">
                    <strong>★ {{ r.rating }}</strong>
                    <p class="text-sm mb-0">{{ r.body }}</p>
                    <span class="text-sm text-muted">{{ r.user?.username || 'jugador' }}</span>
                  </div>
                }
              }
            </div>
          </aside>
        </div>
      }
    </div>
  `,
})
export class RoomDetailPageComponent extends FormatBase implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roomsApi = inject(RoomsService);
  public readonly auth = inject(AuthService);

  protected readonly room = signal<Room | null>(null);
  protected readonly ratingAvg = signal<number | null>(null);
  protected readonly ratingCount = signal(0);
  protected readonly slots = signal<SlotView[]>([]);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly loading = signal(true);
  protected readonly slotsLoading = signal(false);
  protected readonly error = signal('');
  protected readonly date = signal(todayISO());
  protected readonly minDate = todayISO();
  protected readonly maxDate = addDaysISO(todayISO(), 14);
  private roomId: string | number = '';

  ngOnInit(): void {
    this.auth.bootstrap();
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    this.loadRoom();
  }

  protected roomImg(room: Room): string {
    return room.imageUrl || `/assets/rooms/${room.slug || room.imageKey || 'eco'}.jpg`;
  }

  protected onDate(v: string): void {
    this.date.set(v);
    this.loadSlots();
  }

  private loadRoom(): void {
    this.loading.set(true);
    this.error.set('');
    this.roomsApi.detail(this.roomId).subscribe({
      next: (d) => {
        this.room.set(d.room);
        this.ratingAvg.set(d.ratingAvg ?? d.room.ratingAvg ?? null);
        this.ratingCount.set(d.ratingCount ?? d.room.ratingCount ?? 0);
        this.loading.set(false);
        this.loadSlots();
        this.roomsApi.reviews(this.roomId).subscribe({
          next: (r) => this.reviews.set(r.items.slice(0, 6)),
          error: () => this.reviews.set([]),
        });
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No encontrada');
        this.loading.set(false);
      },
    });
  }

  private loadSlots(): void {
    this.slotsLoading.set(true);
    this.roomsApi.slots(this.roomId, this.date()).subscribe({
      next: (s) => {
        this.slots.set(s);
        this.slotsLoading.set(false);
      },
      error: () => {
        this.slots.set([]);
        this.slotsLoading.set(false);
      },
    });
  }

  protected book(s: SlotView): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/checkout/${s.id}` },
      });
      return;
    }
    void this.router.navigate(['/checkout', s.id]);
  }
}
