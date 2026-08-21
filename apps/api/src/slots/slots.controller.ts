import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { BlockSlotDto, GenerateSlotsDto } from './slots.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StaffGuard } from '../auth/current-user';

@ApiTags('slots')
@Controller()
export class SlotsController {
  constructor(private readonly slots: SlotsService) {}

  @Get('rooms/:roomId/slots')
  listForRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('date') date: string,
  ) {
    return this.slots.listForRoom(roomId, date);
  }

  @Get('slots/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.slots.findOne(id);
  }

  @Post('rooms/:roomId/slots/generate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffGuard)
  generate(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() dto: GenerateSlotsDto,
  ) {
    return this.slots.generate(roomId, dto.date, dto.times);
  }

  @Patch('slots/:id/block')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffGuard)
  block(@Param('id', ParseIntPipe) id: number, @Body() dto: BlockSlotDto) {
    return this.slots.setBlocked(id, dto.blocked);
  }
}
