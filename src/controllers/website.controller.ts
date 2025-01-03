import { Controller, Get, UseGuards, Post, Param, Body } from '@nestjs/common';
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

  @Get(':id')
  async getWebsite(@Param('id') id: string) {
    return this.websiteService.findOne(id);
  }

  @Get(':id/versions')
  async getVersions(@Param('id') id: string) {
    return this.websiteService.getVersions(id);
  }

  @Post(':id/versions')
  async createVersion(
    @Param('id') id: string,
    @Body() data: { data: any; changeDescription: string },
    @User() user
  ) {
    return this.websiteService.createVersion(
      id, 
      data.data, 
      data.changeDescription,
      user.id
    );
  }

  @Post(':id/versions/:versionId/activate')
  async activateVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string
  ) {
    return this.websiteService.activateVersion(id, versionId);
  }
}
