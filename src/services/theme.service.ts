import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { CreateThemeDataDto } from '../dto/create-theme-data.dto';
import { existsSync } from 'fs';

@Injectable()
export class ThemeService {
  private readonly logger = new Logger(ThemeService.name);
  private readonly themesDirectory = path.resolve(__dirname, '../../themes');

  async getAllThemes() {
    try {
      // Read all directories in the themes folder
      const themeDirectories = await fs.readdir(this.themesDirectory);
      
      // Map each directory to a theme object
      const themes = themeDirectories.map(directory => ({
        id: directory,
        name: directory,
        previewPath: `/themes/${directory}/images/preview.png` // Assuming each theme has a preview image
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

      return buildResult;
    } catch (error) {
      this.logger.error(`Failed to generate theme: ${error.message}`);
      throw error;
    }
  }

  private async createPaths(themeData: CreateThemeDataDto) {
    const theme = themeData.themeName;
    const siteName = themeData.name.toLowerCase().replace(/\s+/g, '-');
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
      throw new NotFoundException(`Theme "${path.basename(themeFolderPath)}" not found`);
    }

    // Create temporary directories
    await fs.mkdir(path.dirname(tempThemesPath), { recursive: true });
    
    // Copy theme files
    try {
      await fs.cp(themeFolderPath, tempThemesPath, { recursive: true });
      this.logger.log(`Theme files copied successfully to ${tempThemesPath}`);
    } catch (error) {
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
          name: themeData.name,
          description: themeData.description,
          author: themeData.author,
          createdAt: new Date().toISOString()
      }, null, 2)
    );
  }

  private async createConfigFile(temporaryFolderPath: string, themeData: CreateThemeDataDto) {
    const configPath = path.resolve(temporaryFolderPath, 'config.toml');
    const configContent = `
baseURL = '/'
languageCode = 'en-us'
title = '${themeData.name}'
theme = '${themeData.themeName}'

[params]
  description = "${themeData.description}"
  author = "${themeData.author}"
  
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

This is the ${title} page for ${themeData.name}.
`
      );
    }
  }

  private async buildSite(temporaryFolderPath: string, buildFolderPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const hugoCommand = `hugo -s ${temporaryFolderPath} -d ${buildFolderPath}`;
      
      exec(hugoCommand, {
        cwd: temporaryFolderPath
      }, async (error, stdout, stderr) => {
        if (error) {
          this.logger.error('Hugo build error:', { error, stderr });
          await this.cleanup(temporaryFolderPath);
          reject(new Error(`Failed to generate static files: ${stderr || error.message}`));
          return;
        }

        if (stdout) this.logger.log('Hugo build output:', stdout);
        if (stderr) this.logger.warn('Hugo build warnings:', stderr);

        resolve({
          status: 'success',
          message: 'Theme generated successfully',
          buildPath: buildFolderPath,
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
}