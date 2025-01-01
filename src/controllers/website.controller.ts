import { Controller, Get, UseGuards } from '@nestjs/common';
import { WebsiteService } from '../services/website.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';

@Controller('websites')
@UseGuards(JwtAuthGuard)
export class WebsiteController {
  constructor(private websiteService: WebsiteService) {}

  @Get('my-websites')
  async getMyWebsites(@User() user) {
    return this.websiteService.getUserWebsites(user.id);
  }
}
