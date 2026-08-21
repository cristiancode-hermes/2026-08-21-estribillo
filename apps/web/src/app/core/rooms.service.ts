import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import type { Room, RoomDetail, Review, SlotView } from '../shared/models';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class RoomsService {
  private readonly http = inject(HttpClient);

  list(q: { availableToday?: boolean | string; q?: string; page?: number } = {}): Observable<{
    items: Room[];
    total: number;
  }> {
    let params = new HttpParams();
    if (q.availableToday != null && q.availableToday !== '') {
      params = params.set('availableToday', String(q.availableToday));
    }
    if (q.q) params = params.set('q', q.q);
    if (q.page != null) params = params.set('page', String(q.page));
    return this.http.get<Room[] | { items: Room[]; total: number }>(`${API}/rooms`, { params }).pipe(
      map((res) => {
        if (Array.isArray(res)) return { items: res, total: res.length };
        return { items: res.items ?? [], total: res.total ?? res.items?.length ?? 0 };
      }),
    );
  }

  featured(): Observable<Room[]> {
    return this.http.get<Room[] | { items: Room[] }>(`${API}/rooms/featured`).pipe(
      map((res) => (Array.isArray(res) ? res : res.items ?? [])),
    );
  }

  detail(id: string | number): Observable<RoomDetail> {
    return this.http.get<Room | RoomDetail>(`${API}/rooms/${id}`).pipe(
      map((res) => {
        if (res && typeof res === 'object' && 'room' in res) return res as RoomDetail;
        const room = res as Room;
        return {
          room,
          ratingAvg: room.ratingAvg,
          ratingCount: room.ratingCount,
        };
      }),
    );
  }

  slots(roomId: string | number, date: string): Observable<SlotView[]> {
    const params = new HttpParams().set('date', date);
    return this.http
      .get<SlotView[] | { slots: SlotView[] }>(`${API}/rooms/${roomId}/slots`, { params })
      .pipe(map((res) => (Array.isArray(res) ? res : res.slots ?? [])));
  }

  getSlot(id: string | number): Observable<{ slot: SlotView; room: Room }> {
    return this.http
      .get<{ slot: SlotView; room: Room } | (SlotView & { room?: Room })>(`${API}/slots/${id}`)
      .pipe(
        map((res) => {
          if (res && typeof res === 'object' && 'slot' in res) {
            return res as { slot: SlotView; room: Room };
          }
          const s = res as SlotView & { room?: Room };
          return { slot: s, room: s.room as Room };
        }),
      );
  }

  create(body: Partial<Room>): Observable<Room> {
    return this.http.post<Room | { room: Room }>(`${API}/rooms`, body).pipe(
      map((res) => ('room' in (res as object) ? (res as { room: Room }).room : (res as Room))),
    );
  }

  update(id: string | number, body: Partial<Room>): Observable<Room> {
    return this.http.patch<Room | { room: Room }>(`${API}/rooms/${id}`, body).pipe(
      map((res) => ('room' in (res as object) ? (res as { room: Room }).room : (res as Room))),
    );
  }

  remove(id: string | number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${API}/rooms/${id}`);
  }

  generateSlots(
    roomId: string | number,
    body: { date: string; times: string[] },
  ): Observable<{ created: number }> {
    return this.http.post<{ created: number }>(`${API}/rooms/${roomId}/slots/generate`, body);
  }

  blockSlot(id: string | number, blocked: boolean): Observable<SlotView> {
    return this.http
      .patch<SlotView | { slot: SlotView }>(`${API}/slots/${id}/block`, { blocked })
      .pipe(
        map((res) =>
          'slot' in (res as object) ? (res as { slot: SlotView }).slot : (res as SlotView),
        ),
      );
  }

  reviews(roomId: string | number): Observable<{ items: Review[]; avg?: number; count?: number }> {
    return this.http
      .get<Review[] | { items: Review[]; avg?: number; count?: number }>(
        `${API}/rooms/${roomId}/reviews`,
      )
      .pipe(
        map((res) => {
          if (Array.isArray(res)) return { items: res, count: res.length };
          return { items: res.items ?? [], avg: res.avg, count: res.count };
        }),
      );
  }

  createReview(
    roomId: string | number,
    body: { rating: number; body: string },
  ): Observable<Review> {
    return this.http
      .post<Review | { review: Review }>(`${API}/rooms/${roomId}/reviews`, body)
      .pipe(
        map((res) =>
          'review' in (res as object) ? (res as { review: Review }).review : (res as Review),
        ),
      );
  }
}
