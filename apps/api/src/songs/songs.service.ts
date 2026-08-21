import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Song } from '../entities/entities';

@Injectable()
export class SongsService {
  constructor(@InjectRepository(Song) private readonly songs: Repository<Song>) {}

  async findAll(q?: { q?: string; genre?: string; lang?: string }) {
    const where: any = { active: true };
    if (q?.genre) where.genre = q.genre;
    if (q?.lang) where.lang = q.lang;
    let items: Song[];
    if (q?.q) {
      items = await this.songs.find({
        where: [
          { ...where, title: Like(`%${q.q}%`) },
          { ...where, artist: Like(`%${q.q}%`) },
        ],
        order: { title: 'ASC' },
      });
    } else {
      items = await this.songs.find({ where, order: { title: 'ASC' } });
    }
    return { items, total: items.length };
  }

  async findOne(id: number) {
    const song = await this.songs.findOne({ where: { id } });
    return { song };
  }
}
