import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
  Booking,
  BookingLine,
  EmailLog,
  Favorite,
  MenuItem,
  QueueEntry,
  Review,
  Room,
  RoomSlot,
  Song,
  User,
} from '../entities/entities';
import {
  POINTS_PER_PLAYER,
  addDaysYmd,
  madridDate,
  sumLines,
} from '../common/booking-rules';

const ROOM_DEFS = [
  { slug: 'eco', name: 'Cabina Eco', type: 'standard', maxPlayers: 4, priceCents: 2400, description: 'Cabina íntima para dúos y tríos. Micrófonos dinámicos y monitor de letra nítido.', sortOrder: 1 },
  { slug: 'coral', name: 'Cabina Coral', type: 'standard', maxPlayers: 6, priceCents: 2800, description: 'Estandar amplia con sofá lineal y luces cálidas. Perfecta para afterwork.', sortOrder: 2 },
  { slug: 'verso', name: 'Cabina Verso', type: 'standard', maxPlayers: 6, priceCents: 2600, description: 'Acústica seca y reverb corta. La favorita de quienes afinan de verdad.', sortOrder: 3 },
  { slug: 'estribillo', name: 'Cabina Estribillo', type: 'party', maxPlayers: 8, priceCents: 3600, description: 'Party room con luces de escenario y barra de faders a la vista.', sortOrder: 4 },
  { slug: 'coro', name: 'Cabina Coro', type: 'party', maxPlayers: 8, priceCents: 3400, description: 'Ocho plazas, dos pantallas y un subwoofer que se siente en el pecho.', sortOrder: 5 },
  { slug: 'aria', name: 'Cabina Aria', type: 'vip', maxPlayers: 12, priceCents: 5200, description: 'VIP con lounge, micrófonos extra y servicio de barra en cabina.', sortOrder: 6 },
  { slug: 'coda', name: 'Cabina Coda', type: 'vip', maxPlayers: 12, priceCents: 4800, description: 'La más alta. Cristal tintado, latón en los faders y cola de canciones en 4K.', sortOrder: 7 },
];

const MENU_DEFS = [
  { name: 'Tinto de verano', kind: 'drink', description: 'Jarra 50cl', priceCents: 450 },
  { name: 'Cerveza 33cl', kind: 'drink', description: 'Lager de barril', priceCents: 320 },
  { name: 'Agua con gas', kind: 'drink', description: '50cl', priceCents: 180 },
  { name: 'Patatas bravas', kind: 'snack', description: 'Ración para compartir', priceCents: 490 },
  { name: 'Nachos cheddar', kind: 'snack', description: 'Con jalapeños', priceCents: 520 },
  { name: 'Micrófono extra', kind: 'gear', description: 'Inalámbrico adicional', priceCents: 400 },
  { name: 'Pack cumpleaños', kind: 'pack', description: 'Tarta + luces + 4 bebidas', priceCents: 1890 },
];

const SONG_DEFS = [
  { title: 'La Flaca', artist: 'Jarabe de Palo', genre: 'pop', lang: 'es', durationSec: 248 },
  { title: 'Resistiré', artist: 'Dúo Dinámico', genre: 'pop', lang: 'es', durationSec: 231 },
  { title: 'Corazón partío', artist: 'Alejandro Sanz', genre: 'pop', lang: 'es', durationSec: 267 },
  { title: 'Devuélveme a mi chica', artist: 'Hombres G', genre: 'rock', lang: 'es', durationSec: 215 },
  { title: '20 de abril', artist: 'Celtas Cortos', genre: 'rock', lang: 'es', durationSec: 242 },
  { title: 'La ramona', artist: 'Estopa', genre: 'rumba', lang: 'es', durationSec: 198 },
  { title: 'Aserejé', artist: 'Las Ketchup', genre: 'pop', lang: 'es', durationSec: 213 },
  { title: 'Bailando', artist: 'Enrique Iglesias', genre: 'pop', lang: 'es', durationSec: 243 },
  { title: 'Vivir mi vida', artist: 'Marc Anthony', genre: 'salsa', lang: 'es', durationSec: 252 },
  { title: 'La camisa negra', artist: 'Juanes', genre: 'pop', lang: 'es', durationSec: 216 },
  { title: 'Bohemian Rhapsody', artist: 'Queen', genre: 'rock', lang: 'en', durationSec: 355 },
  { title: 'Don\'t Stop Believin\'', artist: 'Journey', genre: 'rock', lang: 'en', durationSec: 250 },
  { title: 'I Wanna Dance with Somebody', artist: 'Whitney Houston', genre: 'pop', lang: 'en', durationSec: 291 },
  { title: 'Billie Jean', artist: 'Michael Jackson', genre: 'pop', lang: 'en', durationSec: 294 },
  { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', genre: 'rock', lang: 'en', durationSec: 356 },
  { title: 'Someone Like You', artist: 'Adele', genre: 'soul', lang: 'en', durationSec: 285 },
  { title: 'Blinding Lights', artist: 'The Weeknd', genre: 'pop', lang: 'en', durationSec: 200 },
  { title: 'Levitating', artist: 'Dua Lipa', genre: 'pop', lang: 'en', durationSec: 203 },
  { title: 'Take On Me', artist: 'a-ha', genre: 'pop', lang: 'en', durationSec: 225 },
  { title: 'Africa', artist: 'Toto', genre: 'pop', lang: 'en', durationSec: 295 },
  { title: 'Volare', artist: 'Gipsy Kings', genre: 'rumba', lang: 'other', durationSec: 218 },
  { title: 'Ai Se Eu Te Pego', artist: 'Michel Teló', genre: 'pop', lang: 'other', durationSec: 169 },
  { title: 'Despacito', artist: 'Luis Fonsi', genre: 'pop', lang: 'es', durationSec: 229 },
  { title: 'Waka Waka', artist: 'Shakira', genre: 'pop', lang: 'es', durationSec: 202 },
  { title: 'Macarena', artist: 'Los del Río', genre: 'pop', lang: 'es', durationSec: 238 },
  { title: 'Livin\' on a Prayer', artist: 'Bon Jovi', genre: 'rock', lang: 'en', durationSec: 249 },
];

const TIMES = [
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
  '00:00',
];

function endOf(start: string): string {
  const [h, m] = start.split(':').map(Number);
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger('Seed');

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    @InjectRepository(RoomSlot) private readonly slots: Repository<RoomSlot>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(BookingLine) private readonly lines: Repository<BookingLine>,
    @InjectRepository(MenuItem) private readonly menu: Repository<MenuItem>,
    @InjectRepository(Song) private readonly songs: Repository<Song>,
    @InjectRepository(QueueEntry) private readonly queue: Repository<QueueEntry>,
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(EmailLog) private readonly emails: Repository<EmailLog>,
    @InjectRepository(Favorite) private readonly favs: Repository<Favorite>,
  ) {}

  async onModuleInit() {
    const count = await this.users.count();
    if (count > 0) {
      this.logger.log('DB already seeded — skip');
      return;
    }
    await this.seed();
  }

  async seed() {
    this.logger.log('Seeding Estribillo…');
    const hash = await bcrypt.hash('demo1234', 10);

    const demo = (await this.users.save({
      username: 'demo',
      email: 'demo@estribillo.dev',
      passwordHash: hash,
      role: 'player',
      points: 0,
    } as any)) as User;

    const staff = (await this.users.save({
      username: 'staff',
      email: 'staff@estribillo.dev',
      passwordHash: hash,
      role: 'staff',
      points: 0,
    } as any)) as User;

    const rooms: Room[] = [];
    for (const def of ROOM_DEFS) {
      rooms.push(
        (await this.rooms.save({
          ...def,
          imageKey: def.slug,
          active: true,
        } as any)) as Room,
      );
    }

    const menuItems: MenuItem[] = [];
    for (const def of MENU_DEFS) {
      menuItems.push((await this.menu.save({ ...def, active: true } as any)) as MenuItem);
    }

    const songs: Song[] = [];
    for (const def of SONG_DEFS) {
      songs.push((await this.songs.save({ ...def, active: true } as any)) as Song);
    }

    const today = madridDate();
    const allSlots: RoomSlot[] = [];
    for (let d = 0; d < 8; d++) {
      const date = addDaysYmd(today, d);
      for (const room of rooms) {
        for (const startTime of TIMES) {
          allSlots.push(
            (await this.slots.save({
              roomId: room.id,
              date,
              startTime,
              endTime: endOf(startTime),
              blocked: false,
            } as any)) as RoomSlot,
          );
        }
      }
    }

    const drink = menuItems[0];
    const snack = menuItems[3];

    const slotTodayFree = allSlots.find(
      (s) => s.date === today && s.startTime === '20:00' && s.roomId === rooms[0].id,
    )!;
    const slotTodayHold = allSlots.find(
      (s) => s.date === today && s.startTime === '21:00' && s.roomId === rooms[3].id,
    )!;
    const slotPast = allSlots.find(
      (s) => s.date === addDaysYmd(today, -1) || (s.date === today && s.startTime === '16:00' && s.roomId === rooms[1].id),
    )!;
    const slotConfirmed = allSlots.find(
      (s) => s.date === addDaysYmd(today, 2) && s.startTime === '19:00' && s.roomId === rooms[5].id,
    )!;
    const slotExpired = allSlots.find(
      (s) => s.date === today && s.startTime === '18:00' && s.roomId === rooms[2].id,
    )!;

    // completed — points derived
    const completed = await this.saveBooking({
      userId: demo.id,
      slot: slotPast,
      room: rooms.find((r) => r.id === slotPast.roomId)!,
      partySize: 3,
      status: 'completed',
      extraHour: false,
      addons: [drink],
      songs: [songs[0], songs[10], songs[7]],
      completedAt: new Date(),
      confirmedAt: new Date(),
    });

    // confirmed future (cancellable)
    await this.saveBooking({
      userId: demo.id,
      slot: slotConfirmed,
      room: rooms.find((r) => r.id === slotConfirmed.roomId)!,
      partySize: 4,
      status: 'confirmed',
      extraHour: true,
      addons: [snack],
      songs: [songs[11], songs[12]],
      confirmedAt: new Date(),
      code: true,
    });

    // live pending hold
    await this.saveBooking({
      userId: demo.id,
      slot: slotTodayHold,
      room: rooms.find((r) => r.id === slotTodayHold.roomId)!,
      partySize: 2,
      status: 'pending',
      extraHour: false,
      addons: [],
      songs: [songs[1]],
      expiresAt: new Date(Date.now() + 12 * 60 * 1000),
    });

    // expired pending (sweeper)
    await this.saveBooking({
      userId: demo.id,
      slot: slotExpired,
      room: rooms.find((r) => r.id === slotExpired.roomId)!,
      partySize: 2,
      status: 'pending',
      extraHour: false,
      addons: [],
      songs: [],
      expiresAt: new Date(Date.now() - 5 * 60 * 1000),
    });

    // cancelled
    const slotCancel = allSlots.find(
      (s) => s.date === addDaysYmd(today, 3) && s.startTime === '17:00' && s.roomId === rooms[4].id,
    )!;
    await this.saveBooking({
      userId: demo.id,
      slot: slotCancel,
      room: rooms.find((r) => r.id === slotCancel.roomId)!,
      partySize: 5,
      status: 'cancelled',
      extraHour: false,
      addons: [],
      songs: [],
      cancelledAt: new Date(),
    });

    demo.points = POINTS_PER_PLAYER * completed.partySize;
    await this.users.save(demo);

    await this.reviews.save({
      userId: demo.id,
      roomId: slotPast.roomId,
      rating: 5,
      body: 'La cabina se oía de cine. Volveremos a por el estribillo.',
    } as any);

    await this.favs.save({ userId: demo.id, roomId: rooms[3].id, songId: null } as any);
    await this.favs.save({ userId: demo.id, roomId: null, songId: songs[0].id } as any);

    await this.emails.save({
      userId: demo.id,
      bookingId: completed.id,
      toEmail: demo.email,
      subject: `Estribillo — Reserva confirmada ${completed.code}`,
      body: 'Tu noche está lista.',
      type: 'confirm',
    } as any);

    this.logger.log(
      `Seeded demo@estribillo.dev / demo1234 · staff@estribillo.dev / demo1234 · rooms=${rooms.length} songs=${songs.length}`,
    );
    void staff;
    void slotTodayFree;
  }

  private async saveBooking(opts: {
    userId: number;
    slot: RoomSlot;
    room: Room;
    partySize: number;
    status: Booking['status'];
    extraHour: boolean;
    addons: MenuItem[];
    songs: Song[];
    expiresAt?: Date;
    confirmedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    code?: boolean;
  }): Promise<Booking> {
    const lineDefs: {
      kind: 'base' | 'addon' | 'extra';
      label: string;
      qty: number;
      unitPriceCents: number;
      menuItemId: number | null;
    }[] = [
      {
        kind: 'base',
        label: `${opts.room.name} — ${opts.slot.startTime}`,
        qty: 1,
        unitPriceCents: opts.room.priceCents,
        menuItemId: null,
      },
    ];
    if (opts.extraHour) {
      lineDefs.push({
        kind: 'extra',
        label: 'Hora extra',
        qty: 1,
        unitPriceCents: opts.room.priceCents,
        menuItemId: null,
      });
    }
    for (const item of opts.addons) {
      lineDefs.push({
        kind: 'addon',
        label: item.name,
        qty: 1,
        unitPriceCents: item.priceCents,
        menuItemId: item.id,
      });
    }
    const totalCents = sumLines(lineDefs);
    const now = new Date();
    const code =
      opts.status === 'confirmed' || opts.status === 'completed' || opts.code
        ? 'EST-' + randomBytes(3).toString('hex').toUpperCase()
        : null;
    const qrToken = code ? randomBytes(16).toString('hex') : null;

    const booking = (await this.bookings.save({
      userId: opts.userId,
      slotId: opts.slot.id,
      partySize: opts.partySize,
      status: opts.status,
      totalCents,
      extraHour: opts.extraHour,
      expiresAt: opts.expiresAt ?? null,
      confirmedAt: opts.confirmedAt ?? null,
      completedAt: opts.completedAt ?? null,
      cancelledAt: opts.cancelledAt ?? null,
      code,
      qrToken,
      createdAt: now,
      updatedAt: now,
    } as any)) as Booking;

    for (const ld of lineDefs) {
      await this.lines.save({
        bookingId: booking.id,
        kind: ld.kind,
        label: ld.label,
        qty: ld.qty,
        unitPriceCents: ld.unitPriceCents,
        amountCents: ld.qty * ld.unitPriceCents,
        menuItemId: ld.menuItemId,
      } as any);
    }

    let pos = 1;
    for (const song of opts.songs) {
      await this.queue.save({
        bookingId: booking.id,
        songId: song.id,
        position: pos,
      } as any);
      pos += 1;
    }
    return booking;
  }
}
