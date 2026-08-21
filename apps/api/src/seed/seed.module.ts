import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
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
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
