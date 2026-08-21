import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, Room, RoomSlot } from '../entities/entities';
import { isLivePending, slotIsBusy } from '../common/booking-rules';

const DEFAULT_TIMES = [
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
  const endH = (h + 1) % 24;
  return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(RoomSlot) private readonly slots: Repository<RoomSlot>,
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
  ) {}

  async listForRoom(roomId: number, date: string) {
    const room = await this.rooms.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Cabina no encontrada');
    const rows = await this.slots.find({
      where: { roomId, date },
      order: { startTime: 'ASC' },
    });
    const slots = [];
    for (const s of rows) {
      slots.push(await this.toView(s, room));
    }
    return { slots };
  }

  async findOne(id: number) {
    const slot = await this.slots.findOne({ where: { id }, relations: { room: true } });
    if (!slot) throw new NotFoundException('Franja no encontrada');
    const view = await this.toView(slot, slot.room);
    return { slot: view, room: slot.room };
  }

  async generate(roomId: number, date: string, times?: string[]) {
    const room = await this.rooms.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Cabina no encontrada');
    const list = times?.length ? times : DEFAULT_TIMES;
    let created = 0;
    for (const startTime of list) {
      const exists = await this.slots.findOne({
        where: { roomId, date, startTime },
      });
      if (exists) continue;
      await this.slots.save({
        roomId,
        date,
        startTime,
        endTime: endOf(startTime),
        blocked: false,
      } as any);
      created += 1;
    }
    return { created };
  }

  async setBlocked(id: number, blocked: boolean) {
    const slot = await this.slots.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Franja no encontrada');
    slot.blocked = blocked;
    await this.slots.save(slot);
    return { slot };
  }

  private async toView(s: RoomSlot, room?: Room) {
    const bks = await this.bookings.find({ where: { slotId: s.id } });
    const status = slotIsBusy(
      s.blocked,
      bks.map((b) => ({ status: b.status, expiresAt: b.expiresAt })),
    );
    return {
      id: s.id,
      roomId: s.roomId,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      blocked: s.blocked,
      status,
      room: room
        ? {
            id: room.id,
            slug: room.slug,
            type: room.type,
            name: room.name,
            priceCents: room.priceCents,
            maxPlayers: room.maxPlayers,
          }
        : undefined,
    };
  }
}
