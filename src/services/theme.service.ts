import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { CreateThemeDataDto } from '../dto/create-theme-data.dto';
import { existsSync } from 'fs';
import { ThemeMetadata, Theme } from '../types/theme.types';

@Injectable()
export class ThemeService {
  private readonly logger = new Logger(ThemeService.name);
  private readonly themesDirectory = path.resolve(__dirname, '../../themes');

  async getAllThemes() {
    try {
      const themeDirectories = await fs.readdir(this.themesDirectory);
      
      const themes = await Promise.all(themeDirectories.map(async directory => {
        const metadataPath = path.join(this.themesDirectory, directory, 'metadata.json');
        let metadata: ThemeMetadata;
        
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          metadata = JSON.parse(metadataContent);
        } catch (error) {
          this.logger.warn(`No metadata found for theme ${directory}`);
          metadata = {
            theme: directory,
            displayName: directory,
            pages: {}
          };
        }

        return {
          id: directory,
          name: metadata.displayName || directory,
          previewPath: `/images/themes/${directory}/preview.jpg`,
          metadata
        };
      }));

      return themes;
    } catch (error) {
      this.logger.error(`Failed to read themes directory: ${error.message}`);
      throw new Error('Failed to fetch available themes');
    }
  }

  async generateTheme(themeData: CreateThemeDataDto) {
    try {
      const { themeFolderPath, temporaryFolderPath, buildFolderPath, tempThemesPath } = 
        await this.createPaths(themeData);

      // Verify and prepare directories
      await this.verifyAndPrepareDirectories(themeFolderPath, temporaryFolderPath, tempThemesPath);

      // Generate site structure
      await this.generateSiteStructure(temporaryFolderPath, themeData);

      // Build the site
      const buildResult = await this.buildSite(temporaryFolderPath, buildFolderPath);

      return {
        status: 'success',
        message: 'Theme generated successfully',
        buildPath: buildFolderPath,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to generate theme: ${error.message}`);
      throw error;
    }
  }

  private async createPaths(themeData: CreateThemeDataDto) {
    const theme = themeData.themeName;
    const siteName = (themeData.data.home?.hero?.title || 'my-website')
      .toLowerCase()
      .replace(/\s+/g, '-');
    const temporaryFolderName = `temp-${siteName}-${Date.now()}`;

    return {
      themeFolderPath: path.resolve(__dirname, '../../themes', theme),
      temporaryFolderPath: path.resolve(__dirname, '../../', temporaryFolderName),
      buildFolderPath: path.resolve(__dirname, '../../', temporaryFolderName, 'finalBuild'),
      tempThemesPath: path.resolve(__dirname, '../../', temporaryFolderName, 'themes', theme)
    };
  }

  private async verifyAndPrepareDirectories(
    themeFolderPath: string, 
    temporaryFolderPath: string, 
    tempThemesPath: string
  ) {
    // Verify theme exists
    if (!existsSync(themeFolderPath)) {
      this.logger.error(`Theme folder not found: ${themeFolderPath}`);
      throw new NotFoundException(`Theme "${path.basename(themeFolderPath)}" not found`);
    }

    // Create temporary directories
    try {
      await fs.mkdir(path.dirname(tempThemesPath), { recursive: true });
      this.logger.log(`Created temporary directory: ${path.dirname(tempThemesPath)}`);
    } catch (error) {
      this.logger.error(`Failed to create temporary directory: ${error}`);
      throw error;
    }
    
    // Copy theme files
    try {
      await fs.cp(themeFolderPath, tempThemesPath, { recursive: true });
      this.logger.log(`Theme files copied successfully to ${tempThemesPath}`);

      // List copied files for verification
      const files = await fs.readdir(tempThemesPath);
      this.logger.log('Copied theme files:', files);
    } catch (error) {
      this.logger.error(`Failed to copy theme files: ${error}`);
      throw new Error(`Failed to copy theme files: ${error.message}`);
    }
  }

  private async generateSiteStructure(temporaryFolderPath: string, themeData: CreateThemeDataDto) {
    try {
      // Create data directory and write site data
      await this.createDataDirectory(temporaryFolderPath, themeData);

      // Create config file
      await this.createConfigFile(temporaryFolderPath, themeData);

      // Create content structure
      await this.createContentStructure(temporaryFolderPath, themeData);

      this.logger.log('Site structure generated successfully');
    } catch (error) {
      throw new Error(`Failed to generate site structure: ${error.message}`);
    }
  }

  private async createDataDirectory(temporaryFolderPath: string, themeData: CreateThemeDataDto) {
    const dataDir = path.resolve(temporaryFolderPath, 'data');
    await fs.mkdir(dataDir, { recursive: true });

    const dataJsonPath = path.resolve(dataDir, 'data.json');
    await fs.writeFile(
      dataJsonPath, 
      JSON.stringify({
        name: themeData.data.home?.hero?.title || 'My Website',
        description: themeData.data.home?.hero?.subtitle || 'My Website Description',
        author: 'Anonymous',
        createdAt: new Date().toISOString(),
        ...themeData.data  // Include all form data
      }, null, 2)
    );
  }

  private async createConfigFile(temporaryFolderPath: string, themeData: CreateThemeDataDto) {
    const configPath = path.resolve(temporaryFolderPath, 'config.toml');
    const configContent = `
baseURL = '/'
languageCode = 'en-us'
title = '${themeData.data.home?.hero?.title || 'My Website'}'
theme = '${themeData.themeName}'

[params]
  description = "${themeData.data.home?.hero?.subtitle || 'My Website Description'}"
  author = "Anonymous"
  
[menu]
  [[menu.main]]
    identifier = "home"
    name = "Home"
    url = "/"
    weight = 1
  [[menu.main]]
    identifier = "about"
    name = "About"
    url = "/about/"
    weight = 2
  [[menu.main]]
    identifier = "contact"
    name = "Contact"
    url = "/contact/"
    weight = 3
`;
    await fs.writeFile(configPath, configContent.trim());
  }

  private async createContentStructure(temporaryFolderPath: string, themeData: CreateThemeDataDto) {
    const contentDir = path.resolve(temporaryFolderPath, 'content');
    await fs.mkdir(contentDir, { recursive: true });

    // Create pages
    const pages = {
      'about': 'About Us',
      'contact': 'Contact Us',
      'privacy': 'Privacy Policy',
      'terms': 'Terms of Service'
    };

    for (const [slug, title] of Object.entries(pages)) {
      const pageDir = path.resolve(contentDir, slug);
      await fs.mkdir(pageDir, { recursive: true });
      await fs.writeFile(
        path.resolve(pageDir, '_index.md'),
        `---
title: "${title}"
date: ${new Date().toISOString()}
draft: false
---

This is the ${title} page for ${themeData.data.home?.hero?.title || 'My Website'}.
`
      );
    }
  }

  private async buildSite(temporaryFolderPath: string, buildFolderPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Remove the --verbose flag
      const hugoCommand = `cd "${temporaryFolderPath}" && hugo -d finalBuild`;
      
      this.logger.log(`Executing command: ${hugoCommand}`);
      this.logger.log(`Working directory: ${temporaryFolderPath}`);

      // Log directory structure before running Hugo
      this.logger.log('Theme directory structure:');
      exec('dir /s /b', { cwd: temporaryFolderPath }, (error, stdout) => {
        this.logger.log(stdout);
      });

      exec(hugoCommand, async (error, stdout, stderr) => {
        if (error) {
          this.logger.error('Hugo build error:', { 
            error, 
            stdout,
            stderr,
            command: hugoCommand,
            cwd: temporaryFolderPath
          });

          // Check config.toml content
          try {
            const configContent = await fs.readFile(path.join(temporaryFolderPath, 'config.toml'), 'utf-8');
            this.logger.log('config.toml content:', configContent);
          } catch (e) {
            this.logger.error('Failed to read config.toml:', e);
          }

          // Check theme directory structure
          try {
            const themeFiles = await fs.readdir(path.join(temporaryFolderPath, 'themes', 'exampleTheme', 'layouts'));
            this.logger.log('Theme layouts directory contents:', themeFiles);
          } catch (e) {
            this.logger.error('Failed to read theme layouts directory:', e);
          }

          await this.cleanup(temporaryFolderPath);
          reject(new Error(`Failed to generate static files: ${stderr || stdout || error.message}`));
          return;
        }

        if (stdout) this.logger.log('Hugo build output:', stdout);
        if (stderr) this.logger.warn('Hugo build warnings:', stderr);

        resolve({
          status: 'success',
          message: 'Theme generated successfully',
          buildPath: path.join(temporaryFolderPath, 'finalBuild'),
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  private async cleanup(temporaryFolderPath: string) {
    try {
      await fs.rm(temporaryFolderPath, { recursive: true, force: true });
      this.logger.log(`Cleaned up temporary folder: ${temporaryFolderPath}`);
    } catch (error) {
      this.logger.error(`Failed to clean up temporary folder: ${error.message}`);
    }
  }

  async getThemeMetadata(themeId: string): Promise<ThemeMetadata> {
    const metadataPath = path.join(this.themesDirectory, themeId, 'metadata.json');
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(metadataContent);
    } catch (error) {
      throw new NotFoundException(`Theme metadata not found for ${themeId}`);
    }
  }
}