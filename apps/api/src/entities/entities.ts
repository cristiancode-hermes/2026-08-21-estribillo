import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export type UserRole = 'player' | 'staff' | 'admin';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'no_show';
export type BookingLineKind = 'base' | 'addon' | 'extra';
export type SlotStatus = 'free' | 'busy' | 'blocked';
export type RoomType = 'standard' | 'party' | 'vip';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 40, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 200 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 16, default: 'player' })
  role: UserRole;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => Booking, (b: Booking) => b.user)
  bookings?: Booking[];
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'varchar', length: 16, default: 'standard' })
  type: RoomType;

  @Column({ type: 'varchar', length: 2000, default: '' })
  description: string;

  @Column({ type: 'int', default: 8 })
  maxPlayers: number;

  @Column({ type: 'int' })
  priceCents: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'varchar', length: 120, nullable: true })
  imageKey: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => RoomSlot, (s: RoomSlot) => s.room)
  slots?: RoomSlot[];
}

@Entity('room_slots')
@Unique(['roomId', 'date', 'startTime'])
export class RoomSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  roomId: number;

  @ManyToOne(() => Room, (r: Room) => r.slots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room?: Room;

  @Column({ type: 'varchar', length: 10 })
  date: string;

  @Column({ type: 'varchar', length: 5 })
  startTime: string;

  @Column({ type: 'varchar', length: 5 })
  endTime: string;

  @Column({ type: 'boolean', default: false })
  blocked: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => Booking, (b: Booking) => b.slot)
  bookings?: Booking[];
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, (u: User) => u.bookings)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'int' })
  slotId: number;

  @ManyToOne(() => RoomSlot, (s: RoomSlot) => s.bookings)
  @JoinColumn({ name: 'slotId' })
  slot?: RoomSlot;

  @Column({ type: 'int' })
  partySize: number;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: BookingStatus;

  @Column({ type: 'int' })
  totalCents: number;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true, unique: true })
  qrToken: string | null;

  @Column({ type: 'varchar', length: 24, nullable: true })
  code: string | null;

  @Column({ type: 'boolean', default: false })
  extraHour: boolean;

  @Column({ type: 'datetime', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => BookingLine, (l: BookingLine) => l.booking)
  lines?: BookingLine[];

  @OneToMany(() => QueueEntry, (q: QueueEntry) => q.booking)
  queue?: QueueEntry[];
}

@Entity('booking_lines')
export class BookingLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  bookingId: number;

  @ManyToOne(() => Booking, (b: Booking) => b.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking?: Booking;

  @Column({ type: 'varchar', length: 16 })
  kind: BookingLineKind;

  @Column({ type: 'varchar', length: 120 })
  label: string;

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'int' })
  unitPriceCents: number;

  @Column({ type: 'int' })
  amountCents: number;

  @Column({ type: 'int', nullable: true })
  menuItemId: number | null;
}

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'varchar', length: 16, default: 'drink' })
  kind: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  description: string;

  @Column({ type: 'int' })
  priceCents: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}

@Entity('songs')
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 120 })
  artist: string;

  @Column({ type: 'varchar', length: 32, default: 'pop' })
  genre: string;

  @Column({ type: 'varchar', length: 8, default: 'es' })
  lang: string;

  @Column({ type: 'int', default: 210 })
  durationSec: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}

@Entity('queue_entries')
@Unique(['bookingId', 'songId'])
export class QueueEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  bookingId: number;

  @ManyToOne(() => Booking, (b: Booking) => b.queue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking?: Booking;

  @Column({ type: 'int' })
  songId: number;

  @ManyToOne(() => Song)
  @JoinColumn({ name: 'songId' })
  song?: Song;

  @Column({ type: 'int' })
  position: number;
}

@Entity('reviews')
@Unique(['userId', 'roomId'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'int' })
  roomId: number;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'roomId' })
  room?: Room;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'varchar', length: 2000, default: '' })
  body: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int', nullable: true })
  bookingId: number | null;

  @Column({ type: 'varchar', length: 120 })
  toEmail: string;

  @Column({ type: 'varchar', length: 200 })
  subject: string;

  @Column({ type: 'varchar', length: 4000 })
  body: string;

  @Column({ type: 'varchar', length: 32, default: 'confirm' })
  type: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

@Entity('favorites')
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int', nullable: true })
  roomId: number | null;

  @Column({ type: 'int', nullable: true })
  songId: number | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

export const ALL_ENTITIES = [
  User,
  Room,
  RoomSlot,
  Booking,
  BookingLine,
  MenuItem,
  Song,
  QueueEntry,
  Review,
  EmailLog,
  Favorite,
];
