import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SongsService } from './songs.service';

@ApiTags('songs')
@Controller('songs')
export class SongsController {
  constructor(private readonly songs: SongsService) {}

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('genre') genre?: string,
    @Query('lang') lang?: string,
  ) {
    return this.songs.findAll({ q, genre, lang });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.songs.findOne(id);
  }
}
