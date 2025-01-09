import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { CreateThemeDataDto } from '../dto/create-theme-data.dto';
import { existsSync } from 'fs';
import { ThemeMetadata, Theme } from '../types/theme.types';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { SchoolWebsite } from '../entities/school-website.entity';
import { WebsiteVersion } from '../entities/website-version.entity';
import { UploadService } from './upload.service';

@Injectable()
export class ThemeService {
  private readonly logger = new Logger(ThemeService.name);
  private readonly themesDirectory = path.resolve(__dirname, '../../themes');

  constructor(
    @InjectConnection()
    private connection: Connection,
    private readonly uploadService: UploadService
  ) {}

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

  async generateTheme(themeData: CreateThemeDataDto, userId: string) {
    try {
      const { themeFolderPath, temporaryFolderPath, buildFolderPath, tempThemesPath } = 
        await this.createPaths(themeData);

      // Log the incoming data to verify image URLs
      this.logger.log('Incoming theme data:', JSON.stringify(themeData.data, null, 2));

      // Verify and prepare directories
      await this.verifyAndPrepareDirectories(themeFolderPath, temporaryFolderPath, tempThemesPath);

      // Create website record first to get the ID
      const websiteRepository = this.connection.getRepository(SchoolWebsite);
      const website = websiteRepository.create({
        name: themeData.data.home?.hero?.title || 'Untitled Website',
        themeId: themeData.themeName,
        userId: userId,
        data: themeData.data,
        currentVersion: 1,
        currentBuildPath: buildFolderPath,
        status: 'active',
        schoolId: null
      });

      await websiteRepository.save(website);

      // 1. Create finalBuild/static/uploads directory
      const uploadsPath = path.join(buildFolderPath, 'static', 'uploads');
      await fs.mkdir(uploadsPath, { recursive: true });
      
      // 2. Copy images from temp to website's finalBuild/static/uploads directory
      const tempUploadPath = path.join('public', 'uploads', 'temp');
      const files = await fs.readdir(tempUploadPath);

      // Log found files
      this.logger.log('Found files in temp directory:', files);

      // Copy files to finalBuild
      for (const file of files) {
        await fs.copyFile(
          path.join(tempUploadPath, file),
          path.join(uploadsPath, file)
        );
      }

      // 3. Process data to include image URLs to point to static/uploads
      const processedData = {
        name: themeData.data.home?.hero?.title || 'My Website',
        description: themeData.data.home?.hero?.subtitle || 'My Website Description',
        author: 'Anonymous',
        createdAt: new Date().toISOString(),
        ...JSON.parse(JSON.stringify(themeData.data)),  // Deep clone to avoid reference issues
        images: {}
      };

      // Log the structure before processing
      this.logger.log('Data structure before processing:', JSON.stringify(processedData, null, 2));
      
      // Add image URLs to data - recursive function to handle nested objects
      const processImageFields = (obj: any, path = '') => {
        for (const key in obj) {
          const value = obj[key];
          const currentPath = path ? `${path}.${key}` : key;

          if (typeof value === 'string' && value.startsWith('/uploads/temp/')) {
            // Extract filename and update path to point to static/uploads
            const filename = value.split('/').pop();
            const newPath = `/static/uploads/${filename}`;
            obj[key] = newPath;
            processedData.images[currentPath] = newPath;
            this.logger.log(`Found image URL at ${currentPath}:`, newPath);
          } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (typeof item === 'string' && item.startsWith('/uploads/temp/')) {
                const filename = item.split('/').pop();
                const newPath = `/static/uploads/${filename}`;
                value[index] = newPath;
                processedData.images[`${currentPath}[${index}]`] = newPath;
                this.logger.log(`Found image URL in array at ${currentPath}[${index}]:`, newPath);
              } else if (typeof item === 'object' && item !== null) {
                processImageFields(item, `${currentPath}[${index}]`);
              }
            });
          } else if (typeof value === 'object' && value !== null) {
            processImageFields(value, currentPath);
          }
        }
      };

      // Process all image URLs in the data
      processImageFields(processedData);

      // Log the processed data
      this.logger.log('Processed data:', JSON.stringify(processedData, null, 2));

      // Generate site with processed data
      await this.generateSiteStructure(temporaryFolderPath, {
        ...themeData,
        data: processedData
      });

      // Build the site
      const buildResult = await this.buildSite(temporaryFolderPath, buildFolderPath);

      // Create initial version with processed data
      const versionRepository = this.connection.getRepository(WebsiteVersion);
      const initialVersion = versionRepository.create({
        websiteId: website.id,
        versionNumber: 1,
        data: processedData,
        buildPath: buildFolderPath,
        isActive: true,
        changeDescription: 'Initial version',
        createdById: userId
      });

      await versionRepository.save(initialVersion);

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
    
    // Write the processed data
    await fs.writeFile(
      dataJsonPath, 
      JSON.stringify(themeData.data, null, 2)
    );

    // Log the written data
    this.logger.log('Written data.json content:', await fs.readFile(dataJsonPath, 'utf-8'));
  }

  private async createConfigFile(temporaryFolderPath: string, themeData: CreateThemeDataDto) {
    const configPath = path.resolve(temporaryFolderPath, 'config.toml');
    const configContent = `
# Basic site configuration
baseURL = "/"
languageCode = "en-us"
title = "${themeData.data.home?.hero?.title || 'My Website'}"
theme = "${themeData.themeName}"

# Content configuration
contentDir = "content"
dataDir = "data"

# Static file configuration
staticDir = ["static", "uploads"]

# Output configuration
publishDir = "finalBuild"

# Ensure HTML generation
disableKinds = []

[outputs]
  home = ["HTML"]
  page = ["HTML"]
  section = ["HTML"]

# Static file handling
[module]
  [[module.mounts]]
    source = "static"
    target = "static"
  [[module.mounts]]
    source = "uploads"
    target = "static/uploads"

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

    // Log the config for debugging
    this.logger.log('Created config.toml with content:', configContent);
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
      const hugoCommand = `cd "${temporaryFolderPath}" && hugo --minify -d finalBuild --forceSyncStatic --ignoreCache `;
      
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

            const dataContent = await fs.readFile(path.join(temporaryFolderPath, 'data', 'data.json'), 'utf-8');
            this.logger.log('data.json content:', dataContent);
          } catch (e) {
            this.logger.error('Failed to read theme layouts directory:', e);
          }

          await this.cleanup(temporaryFolderPath);
          reject(new Error(`Failed to generate static files: ${stderr || stdout || error.message}`));
          return;
        }

        // Log build output
        if (stdout) this.logger.log('Hugo build output:', stdout);
        if (stderr) this.logger.warn('Hugo build warnings:', stderr);

        // Verify build output
        try {
          const buildFiles = await fs.readdir(buildFolderPath);
          this.logger.log('Generated files in build directory:', buildFiles);

          // Check for index.html specifically
          const indexPath = path.join(buildFolderPath, 'index.html');
          const indexExists = await fs.access(indexPath)
            .then(() => true)
            .catch(() => false);

          if (!indexExists) {
            this.logger.warn('index.html not found in build directory');
          }

        } catch (error) {
          this.logger.error('Error verifying build output:', error);
        }

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

  private processImageUrls(data: any, websiteId: string): any {
    const processValue = (value: any): any => {
      if (typeof value === 'string' && value.startsWith('/uploads/temp/')) {
        // Update URLs to point to the static directory
        return value.replace('/uploads/temp/', '/static/uploads/');
      }
      if (Array.isArray(value)) {
        return value.map(item => processValue(item));
      }
      if (typeof value === 'object' && value !== null) {
        return processObject(value);
      }
      return value;
    };

    const processObject = (obj: any): any => {
      const processed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        processed[key] = processValue(value);
      }
      return processed;
    };

    return processObject(data);
  }
}