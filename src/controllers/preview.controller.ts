import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { PreviewService } from '../services/preview.service';
import * as path from 'path';
import * as fs from 'fs-extra';

@Controller('api/preview')
export class PreviewController {
  private readonly logger = new Logger(PreviewController.name);

  constructor(private readonly previewService: PreviewService) {}

  @Get()
  async previewWebsite(@Query('path') buildPath: string, @Res() res: Response) {
    try {
      this.logger.log(`Preview requested for path: ${buildPath}`);

      if (!buildPath) {
        throw new Error('Build path is required');
      }

      const absolutePath = path.resolve(process.cwd(), buildPath);
      
      // Verify the path exists
      if (!await fs.pathExists(absolutePath)) {
        this.logger.error(`Build path does not exist: ${absolutePath}`);
        return res.status(404).json({ error: 'Build path not found' });
      }

      // Start Hugo server and get preview URL
      const previewUrl = await this.previewService.previewHugoSite(absolutePath);
      
      this.logger.log(`Preview URL generated: ${previewUrl}`);
      return res.json({ previewUrl });
    } catch (error) {
      this.logger.error('Preview failed:', error);
      return res.status(400).json({ 
        error: error.message,
        details: error.stack
      });
    }
  }

  @Get('stop')
  async stopPreview(@Res() res: Response) {
    try {
      await this.previewService.stopHugoServer();
      return res.json({ message: 'Preview server stopped' });
    } catch (error) {
      this.logger.error('Failed to stop preview:', error);
      return res.status(400).json({ error: error.message });
    }
  }
}
