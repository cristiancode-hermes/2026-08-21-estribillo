import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StaffGuard } from '../auth/current-user';

@ApiTags('stats')
@Controller('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('overview')
  overview() {
    return this.stats.overview();
  }

  @Get('revenue-series')
  revenueSeries(@Query('days') days?: string) {
    return this.stats.revenueSeries(days ? Number(days) : 7);
  }

  @Get('revenue')
  revenue(@Query('days') days?: string) {
    return this.stats.revenueSeries(days ? Number(days) : 7).then((r) => ({
      series: r.points.map((p) => ({ date: p.date, cents: p.revenueCents })),
    }));
  }

  @Get('occupancy')
  occupancy(@Query('date') date?: string) {
    return this.stats.overview().then((o) => ({
      occupied: o.kpis.booked,
      total: o.kpis.slotsTotal,
      pct: o.kpis.occupancyPct,
      date: date || o.kpis.date,
    }));
  }

  @Get('day-board')
  dayBoard(@Query('date') date?: string) {
    return this.stats.dayBoard(date);
  }
}
