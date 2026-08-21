import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  lang: string;
  durationSec: number;
}

@Component({
  selector: 'app-songs-catalogue-page',
  imports: [FormsModule],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Canciones</h1>
          <p class="lead">Catálogo del local. Añádelas a la cola en el checkout.</p>
        </div>
      </div>
      <div class="filters-bar mb-4">
        <input class="input" placeholder="Buscar título o artista" [ngModel]="q()" (ngModelChange)="q.set($event); load()" />
        <select class="input" [ngModel]="lang()" (ngModelChange)="lang.set($event); load()">
          <option value="">Todos los idiomas</option>
          <option value="es">Español</option>
          <option value="en">Inglés</option>
          <option value="other">Otros</option>
        </select>
      </div>
      @if (loading()) {
        <p class="text-muted">Cargando catálogo…</p>
      } @else if (error()) {
        <div class="error-state"><p>{{ error() }}</p><button class="btn btn-primary" type="button" (click)="load()">Reintentar</button></div>
      } @else if (items().length === 0) {
        <div class="empty-state"><h3>Sin temas</h3><p>Prueba otra búsqueda.</p></div>
      } @else {
        <div class="table-container">
          <table>
            <thead><tr><th>Tema</th><th>Artista</th><th>Género</th><th>Idioma</th><th>Duración</th></tr></thead>
            <tbody>
              @for (s of items(); track s.id) {
                <tr>
                  <td><strong>{{ s.title }}</strong></td>
                  <td>{{ s.artist }}</td>
                  <td>{{ s.genre }}</td>
                  <td class="mono">{{ s.lang }}</td>
                  <td class="mono">{{ mmss(s.durationSec) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class SongsCataloguePageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly items = signal<Song[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly q = signal('');
  protected readonly lang = signal('');

  ngOnInit(): void {
    this.load();
  }

  protected mmss(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    let params = new HttpParams();
    if (this.q()) params = params.set('q', this.q());
    if (this.lang()) params = params.set('lang', this.lang());
    this.http.get<{ items: Song[] }>('/api/songs', { params }).subscribe({
      next: (res) => {
        this.items.set(res.items || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo');
        this.loading.set(false);
      },
    });
  }
}
