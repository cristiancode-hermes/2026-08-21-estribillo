import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Booking,
  BookingLine,
  EmailLog,
  QueueEntry,
  Room,
  RoomSlot,
  MenuItem,
  Song,
  User,
} from '../entities/entities';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingLine,
      RoomSlot,
      Room,
      User,
      MenuItem,
      EmailLog,
      QueueEntry,
      Song,
    ]),
    AuthModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
