import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, Review, Booking, RoomSlot } from '../entities/entities';
import { CreateRoomDto, UpdateRoomDto } from './rooms.dto';
import { madridDate, isLivePending } from '../common/booking-rules';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(RoomSlot) private readonly slots: Repository<RoomSlot>,
  ) {}

  private async freeSlotsFor(roomId: number, date: string): Promise<number> {
    const slots = await this.slots.find({ where: { roomId, date, blocked: false } });
    let free = 0;
    for (const s of slots) {
      const bks = await this.bookings.find({ where: { slotId: s.id } });
      const busy = bks.some(
        (b) =>
          b.status === 'confirmed' ||
          b.status === 'completed' ||
          isLivePending(b.status, b.expiresAt),
      );
      if (!busy) free += 1;
    }
    return free;
  }

  private withImage(room: Room) {
    const key = room.imageKey || `room-${room.slug}`;
    return {
      ...room,
      imageKey: key,
      imageUrl: `/assets/rooms/${key}.jpg`,
      basePriceCents: room.priceCents,
    };
  }

  private async withAvailability(room: Room, today = madridDate()) {
    const freeSlotsToday = await this.freeSlotsFor(room.id, today);
    return {
      ...this.withImage(room),
      freeSlotsToday,
      maintenance: !room.active,
    };
  }

  async findAll(q?: { type?: string; q?: string; date?: string; page?: number }) {
    const page = Math.max(1, Number(q?.page) || 1);
    const take = 50;
    const skip = (page - 1) * take;
    const qb = this.rooms.createQueryBuilder('r').where('r.active = :a', { a: true });
    if (q?.q) {
      qb.andWhere('(r.name LIKE :q OR r.description LIKE :q)', { q: `%${q.q}%` });
    }
    if (q?.type) {
      qb.andWhere('r.type = :type', { type: q.type });
    }
    qb.orderBy('r.sortOrder', 'ASC').skip(skip).take(take);
    const [items, total] = await qb.getManyAndCount();
    const today = q?.date || madridDate();

    const enriched = [];
    let freeSlotsToday = 0;
    for (const room of items) {
      const row = await this.withAvailability(room, today);
      freeSlotsToday += row.freeSlotsToday;
      enriched.push(row);
    }

    return { items: enriched, total, freeSlotsToday };
  }

  async featured(date?: string) {
    const items = await this.rooms.find({
      where: { active: true },
      order: { sortOrder: 'ASC' },
      take: 4,
    });
    const today = date || madridDate();
    const out = [];
    let freeSlotsToday = 0;
    for (const room of items) {
      const row = await this.withAvailability(room, today);
      freeSlotsToday += row.freeSlotsToday;
      out.push(row);
    }
    return { items: out, freeSlotsToday };
  }

  async findOne(id: number) {
    const room = await this.rooms.findOne({ where: { id } });
    if (!room) throw new NotFoundException('Cabina no encontrada');
    const revs = await this.reviews.find({ where: { roomId: id } });
    const ratingCount = revs.length;
    const ratingAvg =
      ratingCount === 0
        ? 0
        : Math.round((revs.reduce((a, r) => a + r.rating, 0) / ratingCount) * 10) / 10;
    const today = madridDate();
    const freeSlotsToday = await this.freeSlotsFor(id, today);
    return {
      room: {
        ...this.withImage(room),
        freeSlotsToday,
        ratingAvg,
        ratingCount,
        maintenance: !room.active,
      },
      ratingAvg,
      ratingCount,
    };
  }

  async create(dto: CreateRoomDto) {
    const exists = await this.rooms.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('Slug de cabina ya existe');
    const room = (await this.rooms.save({
      slug: dto.slug,
      name: dto.name,
      type: (dto.type as any) || 'standard',
      description: dto.description || '',
      maxPlayers: dto.maxPlayers ?? 8,
      priceCents: dto.priceCents,
      active: true,
      imageKey: dto.imageKey ?? null,
      sortOrder: 99,
    } as any)) as Room;
    return { room: this.withImage(room) };
  }

  async update(id: number, dto: UpdateRoomDto) {
    const room = await this.rooms.findOne({ where: { id } });
    if (!room) throw new NotFoundException('Cabina no encontrada');
    if (dto.name !== undefined) room.name = dto.name;
    if (dto.description !== undefined) room.description = dto.description;
    if (dto.maxPlayers !== undefined) room.maxPlayers = dto.maxPlayers;
    if (dto.priceCents !== undefined) room.priceCents = dto.priceCents;
    if (dto.type !== undefined) room.type = dto.type as any;
    if (dto.active !== undefined) room.active = dto.active;
    if (dto.imageKey !== undefined) room.imageKey = dto.imageKey;
    await this.rooms.save(room);
    return { room: this.withImage(room) };
  }

  async softDelete(id: number) {
    const room = await this.rooms.findOne({ where: { id } });
    if (!room) throw new NotFoundException('Cabina no encontrada');
    room.active = false;
    await this.rooms.save(room);
    return { ok: true };
  }
}
