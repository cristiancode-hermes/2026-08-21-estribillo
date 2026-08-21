import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite, Room } from '../entities/entities';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite) private readonly favs: Repository<Favorite>,
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
  ) {}

  async list(userId: number) {
    const rows = await this.favs.find({ where: { userId } });
    return { roomIds: rows.map((r) => r.roomId) };
  }

  async add(userId: number, roomId: number) {
    const room = await this.rooms.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Cabina no encontrada');
    const exists = await this.favs.findOne({ where: { userId, roomId } });
    if (!exists) {
      await this.favs.save({ userId, roomId } as any);
    }
    return { ok: true };
  }

  async remove(userId: number, roomId: number) {
    await this.favs.delete({ userId, roomId });
    return { ok: true };
  }
}
