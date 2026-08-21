import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, Room, RoomSlot, Review } from '../entities/entities';
import { CreateReviewDto } from './reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    @InjectRepository(RoomSlot) private readonly slots: Repository<RoomSlot>,
  ) {}

  async listForRoom(roomId: number, page = 1) {
    const take = 20;
    const skip = (Math.max(1, page) - 1) * take;
    const [items, count] = await this.reviews.findAndCount({
      where: { roomId },
      order: { createdAt: 'DESC' },
      skip,
      take,
      relations: { user: true },
    });
    const all = await this.reviews.find({ where: { roomId } });
    const avg =
      all.length === 0
        ? 0
        : Math.round((all.reduce((a, r) => a + r.rating, 0) / all.length) * 10) /
          10;
    return {
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt,
        user: r.user
          ? { id: r.user.id, username: r.user.username }
          : null,
      })),
      avg,
      count,
    };
  }

  async create(userId: number, roomId: number, dto: CreateReviewDto) {
    const room = await this.rooms.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Cabina no encontrada');

    const existing = await this.reviews.findOne({ where: { userId, roomId } });
    if (existing) throw new ConflictException('Ya has reseñado esta cabina');

    // Must have completed booking on this room
    const userBookings = await this.bookings.find({
      where: { userId, status: 'completed' },
      relations: { slot: true },
    });
    const ok = userBookings.some((b) => b.slot?.roomId === roomId);
    if (!ok) {
      throw new ForbiddenException(
        'Solo puedes reseñar cabinas con sesión completada',
      );
    }

    const review = (await this.reviews.save({
      userId,
      roomId,
      rating: dto.rating,
      body: dto.body || '',
    } as any)) as Review;
    return { review };
  }
}
