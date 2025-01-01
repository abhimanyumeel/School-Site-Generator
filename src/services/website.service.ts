import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolWebsite } from '../entities/school-website.entity';

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(SchoolWebsite)
    private websiteRepository: Repository<SchoolWebsite>
  ) {}

  async getUserWebsites(userId: string) {
    return this.websiteRepository.find({
      where: { userId },
      relations: ['school', 'user', 'documentGroups', 'formSubmissions'],
      order: { createdAt: 'DESC' }
    });
  }
}
