import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as express from 'express';
import * as http from 'http';
import * as fs from 'fs-extra';
import * as path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class PreviewService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PreviewService.name);
  private previewServer: http.Server;
  private previewApp: express.Express;
  private previewPort: number = 3500;
  private hugoProcess: any = null;

  async onModuleInit() {
    this.previewApp = express();
    this.setupPreviewServer();
  }

  async onModuleDestroy() {
    if (this.previewServer) {
      await new Promise((resolve) => this.previewServer.close(resolve));
    }
    await this.stopHugoServer();
  }

  private setupPreviewServer() {
    this.previewApp.use(express.static('public'));
    this.previewServer = this.previewApp.listen(this.previewPort);
  }

  async previewHugoSite(buildPath: string): Promise<string> {
    try {
      this.logger.log(`Attempting to preview Hugo site at: ${buildPath}`);

      // Get the parent directory (where config.toml is located)
      const parentDir = path.dirname(buildPath);
      this.logger.log(`Parent directory: ${parentDir}`);

      // Check if Hugo is installed
      try {
        const { stdout } = await execAsync('hugo version');
        this.logger.log(`Hugo version: ${stdout}`);
      } catch (error) {
        this.logger.error('Hugo is not installed or not in PATH');
        throw new Error('Hugo is not installed');
      }

      // Verify config.toml exists in parent directory
      const configPath = path.join(parentDir, 'config.toml');
      if (!await fs.pathExists(configPath)) {
        this.logger.error(`Hugo config not found at: ${configPath}`);
        throw new Error('Hugo config not found');
      }

      // Stop any existing Hugo server
      await this.stopHugoServer();

      // Start the Hugo server as a background process
      this.logger.log('Starting Hugo server...');
      
      if (process.platform === 'win32') {
        this.hugoProcess = spawn('hugo', ['server', '-D', '--port', '1313', '--bind', '0.0.0.0'], {
          cwd: parentDir,
          detached: true,
          stdio: 'pipe'
        });
      } else {
        this.hugoProcess = spawn('hugo', ['server', '-D', '--port', '1313', '--bind', '0.0.0.0'], {
          cwd: parentDir,
          stdio: 'pipe'
        });
      }

      // Handle process output
      this.hugoProcess.stdout.on('data', (data) => {
        this.logger.log(`Hugo server output: ${data}`);
      });

      this.hugoProcess.stderr.on('data', (data) => {
        this.logger.warn(`Hugo server warning: ${data}`);
      });

      // Wait for the server to start
      await new Promise((resolve) => setTimeout(resolve, 2000));

      this.logger.log('Hugo server started successfully');
      return 'http://localhost:1313';
    } catch (error) {
      this.logger.error('Failed to start Hugo server:', error);
      throw new Error(`Failed to start Hugo server: ${error.message}`);
    }
  }

  async stopHugoServer() {
    this.logger.log('Stopping Hugo server...');
    try {
      if (this.hugoProcess) {
        if (process.platform === 'win32') {
          this.hugoProcess.kill();
          await execAsync('taskkill /F /IM hugo.exe');
        } else {
          this.hugoProcess.kill();
          await execAsync('pkill hugo');
        }
        this.hugoProcess = null;
      }
      this.logger.log('Hugo server stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping Hugo server:', error);
      // Don't throw the error here, just log it
    }
  }
}
