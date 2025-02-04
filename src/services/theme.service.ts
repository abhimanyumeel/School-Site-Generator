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
import { title } from 'process';
import * as yaml from 'js-yaml';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from '../entities/document.entity';
import { DocumentGroup } from '../entities/document-group.entity';
import { Repository } from 'typeorm';

interface FieldConfig {
  type: string;
  required?: boolean;
  default?: any;
  items?: any;
  fields?: any;
}

@Injectable()
export class ThemeService {
  private readonly logger = new Logger(ThemeService.name);
  private readonly themesDirectory = path.resolve(__dirname, '../../themes');

  constructor(
    @InjectConnection()
    private connection: Connection,
    private readonly uploadService: UploadService,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(DocumentGroup)
    private documentGroupRepository: Repository<DocumentGroup>
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
            pages: {},
            config: {},
            fieldTypes: {}
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
      this.logger.log('=== Starting Theme Generation ===');
      const paths = await this.createPaths(themeData);
      
      await this.verifyAndPrepareDirectories(
        paths.themeFolderPath,
        paths.temporaryFolderPath,
        paths.tempThemesPath
      );

      this.logger.log('Incoming theme data:', JSON.stringify(themeData.data, null, 2));

      // Create website record first to get the ID
      const websiteRepository = this.connection.getRepository(SchoolWebsite);
      const website = websiteRepository.create({
        name: themeData.data.home?.hero?.title || 'Untitled Website',
        themeId: themeData.themeName,
        userId: userId,
        data: themeData.data,
        currentVersion: 1,
        currentBuildPath: paths.buildFolderPath,
        status: 'active',
        schoolId: null
      });

      await websiteRepository.save(website);
      this.logger.log(`Website created with ID: ${website.id}`);

      // 1. Create finalBuild/static/uploads directory
      const uploadsPath = path.join(paths.buildFolderPath, 'static', 'uploads');
      await fs.mkdir(uploadsPath, { recursive: true });
      
      // 2. Process and upload images
      const tempUploadPath = path.join('public', 'uploads', 'temp');
      const files = await fs.readdir(tempUploadPath);
      this.logger.log('Found files in temp directory:', files);

      // Upload to MinIO and copy files to finalBuild
      for (const file of files) {
        try {
          this.logger.log(`Processing file: ${file}`);
          const filePath = path.join(tempUploadPath, file);
          
          // Upload to MinIO
          const fileBuffer = await fs.readFile(filePath);
          const fileSize = (await fs.stat(filePath)).size;
          
          this.logger.log(`Uploading to MinIO: ${file}`);
          const minioKey = await this.uploadService.uploadToMinIO(
            fileBuffer,
            file,
            fileSize
          );
          this.logger.log(`MinIO upload successful. Key: ${minioKey}`);

          // Copy to finalBuild
          await fs.copyFile(
            filePath,
            path.join(uploadsPath, file)
          );
          this.logger.log(`File copied to finalBuild: ${file}`);
        } catch (error) {
          this.logger.error(`Failed to process file ${file}:`, error);
        }
      }

      await this.uploadService.cleanTempDirectories();

      // 3. Process data to include image URLs
      const processedData = {
        name: themeData.data.home?.hero?.title || 'My Website',
        description: themeData.data.home?.hero?.subtitle || 'My Website Description',
        author: 'Anonymous',
        createdAt: new Date().toISOString(),
        ...JSON.parse(JSON.stringify(themeData.data)),
        images: {}
      };

      this.logger.log('Data structure before processing:', JSON.stringify(processedData, null, 2));
      
      // Add image URLs to data - recursive function to handle nested objects
      const processImageFields = async (obj: any, path = '', websiteId: string) => {
        for (const key in obj) {
          const value = obj[key];
          const currentPath = path ? `${path}.${key}` : key;

          if (typeof value === 'string' && value.startsWith('/uploads/temp/')) {
            const filename = value.split('/').pop();
            const newPath = `/static/uploads/${filename}`;
            const minioKey = `uploads/${Date.now()}-${filename}`; // MinIO path format
            obj[key] = newPath;
            processedData.images[currentPath] = newPath;

            // Add this block to persist image data
            const documentGroup = await this.documentGroupRepository.save({
              schoolWebsiteId: websiteId,
              accessor: currentPath,
            });

            await this.documentRepository.save({
              type: 'image',
              name: filename,
              mimeType: 'image/webp',
              path: minioKey, // Store MinIO key instead of static path
              url: newPath,
              documentGroupId: documentGroup.id,
              order: 0,
            });

            this.logger.log(`Persisted image for ${currentPath}:`, { newPath, minioKey });
          } else if (Array.isArray(value)) {
            for (const [index, item] of value.entries()) {
              if (typeof item === 'string' && item.startsWith('/uploads/temp/')) {
                const filename = item.split('/').pop();
                const newPath = `/static/uploads/${filename}`;
                value[index] = newPath;
                processedData.images[`${currentPath}[${index}]`] = newPath;

                // Add this block to persist array image data
                const documentGroup = await this.documentGroupRepository.save({
                  schoolWebsiteId: websiteId,
                  accessor: `${currentPath}[${index}]`,
                });

                await this.documentRepository.save({
                  type: 'image',
                  name: filename,
                  mimeType: 'image/webp',
                  path: newPath,
                  url: newPath,
                  documentGroupId: documentGroup.id,
                  order: index,
                });

                this.logger.log(`Persisted array image for ${currentPath}[${index}]:`, newPath);
              } else if (typeof item === 'object' && item !== null) {
                await processImageFields(item, `${currentPath}[${index}]`, websiteId);
              }
            }
          } else if (typeof value === 'object' && value !== null) {
            await processImageFields(value, currentPath, websiteId);
          }
        }
      };

      // Process all image URLs in the data
      await processImageFields(processedData, '', website.id);

      // Log the processed data
      this.logger.log('Processed data:', JSON.stringify(processedData, null, 2));

      // Generate site with processed data
      await this.generateSiteStructure(
        paths.temporaryFolderPath, 
        {
          ...themeData,
          data: processedData,
          websiteId: website.id
        },
        website.id
      );

      // Build the site
      const buildResult = await this.buildSite(paths.temporaryFolderPath, paths.buildFolderPath);

      // Create initial version with processed data
      const versionRepository = this.connection.getRepository(WebsiteVersion);
      const initialVersion = versionRepository.create({
        websiteId: website.id,
        versionNumber: 1,
        data: processedData,
        buildPath: paths.buildFolderPath,
        isActive: true,
        changeDescription: 'Initial version',
        createdById: userId
      });

      await versionRepository.save(initialVersion);

      const savedDocuments = await this.documentRepository.find({
        where: { documentGroup: { schoolWebsiteId: website.id } },
        relations: ['documentGroup']
      });
      this.logger.log('All saved documents:', savedDocuments);

      return {
        status: 'success',
        message: 'Theme generated successfully',
        buildPath: paths.buildFolderPath,
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

  private async generateSiteStructure(
    temporaryFolderPath: string, 
    themeData: CreateThemeDataDto,
    websiteId: string
  ) {
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
    try{
      //1. Get theme metadata
      const metadata = await this.getThemeMetadata(themeData.themeName);
      const contentDir = path.resolve(temporaryFolderPath, 'content');
      await fs.mkdir(contentDir, { recursive: true });

      //2. Validate data against theme requirements
      this.validateThemeData(themeData.data, metadata);

      //3. Generate content for each page defined in metadata
      for (const [pageName, pageConfig] of Object.entries(metadata.pages)){
        await this.generatePageContent(
          contentDir, 
          pageName,
          pageConfig,
          themeData.data[pageName] || {},
          metadata
        );
      }

      this.logger.log('Content structure generated successfully');

    }catch(error){
      this.logger.log("Failed to create content structure:", error);
      throw new Error(`Failed to create content structure: ${error.message}`);
    }
  }


  private async generatePageContent(
    contentDir: string,
    pageName: string,
    pageConfig: any, 
    pageData: any,
    metadata: ThemeMetadata
  ) {
    const pageDir = path.resolve(contentDir, pageName);
    await fs.mkdir(pageDir, {recursive: true});

    // Determine if this is a list page based on content structure
    const isListPage = this.determineIfListPage(pageName, pageConfig);
    const fileName = isListPage ? '_index.md' : 'index.md';

    // Check if single.html exists in the page-specific directory
    const singleTemplateExists = existsSync(path.resolve(this.themesDirectory, metadata.theme, 'layouts', pageName , 'single.html'));

    const layout = singleTemplateExists ? `${pageName}/single` : pageName;

    // Create minimal frontmatter - remove pageSpecificData merge
    const frontmatter = {
        title: pageConfig.title,
        layout: layout,
        type: pageName,
        draft: false,
        hideDate: true  // Add this to hide the date
    };

    // Create the markdown file with minimal frontmatter
    const content = `---\n${yaml.dump(frontmatter)}---\n`;
    await fs.writeFile(path.resolve(pageDir, fileName), content);

    this.logger.log(`Generated content for ${pageName}:`, {
        path: path.resolve(pageDir, fileName),
        isListPage,
        content: content
    });
  }

  private determineIfListPage(pageName: string, pageConfig: any): boolean {
    // Special cases that are always single pages
    const singlePageTypes = ['home', 'about', 'contact'];
    if (singlePageTypes.includes(pageName)) {
        return false;
    }

    // Check if the page has array-based content that suggests it's a list
    const hasListContent = Object.values(pageConfig.sections).some((section: any) => {
        const fields = section.fields || {};
        return Object.values(fields).some((field: any) => {
            return field.type === 'array' && 
                   (field.label?.toLowerCase().includes('list') ||
                    field.label?.toLowerCase().includes('items') ||
                    field.label?.toLowerCase().includes('posts') ||
                    field.label?.toLowerCase().includes('articles'));
        });
    });

    return hasListContent;
  }

  private processSectionData(sectionData: any, sectionConfig: any, fieldTypes: any): any {
    const processed: any = {};

    for (const [fieldName, fieldConfigRaw] of Object.entries(sectionConfig.fields)) {
      const fieldValue = sectionData[fieldName];
      const fieldConfig = fieldConfigRaw as FieldConfig;
      const fieldType = fieldTypes[fieldConfig.type];

      if (fieldConfig.required && !fieldValue) {
        // Use default value if available, otherwise throw error
        if ('default' in fieldConfig) {
          processed[fieldName] = fieldConfig.default;
        } else {
          throw new Error(`Required field ${fieldName} is missing`);
        }
      } else {
        // Process field based on its type
        processed[fieldName] = this.processFieldValue(
          fieldValue,
          fieldConfig,
          fieldType
        );
      }
    }

    return processed;
  }

  private processFieldValue(value: any, fieldConfig: any, fieldType: any): any {
    if (!value) return fieldConfig.default || null;

    switch (fieldConfig.type) {
      case 'image':
      case 'image-set':
        // Ensure image paths are correct
        return Array.isArray(value) 
          ? value.map(img => this.processImagePath(img))
          : this.processImagePath(value);
      
      case 'array':
        return Array.isArray(value) 
          ? value.map(item => this.processArrayItem(item, fieldConfig.items))
          : [];

      case 'object':
        return this.processObjectFields(value, fieldConfig.fields);

      default:
        return value;
    }
  }

  private validateThemeData(data: any, metadata: ThemeMetadata) {
    for (const [pageName, pageConfig] of Object.entries(metadata.pages)) {
      const pageData = data[pageName];
      
      if (!pageData) {
        this.logger.warn(`No data provided for page ${pageName}`);
        continue;
      }

      for (const [sectionName, sectionConfig] of Object.entries(pageConfig.sections)) {
        const sectionData = pageData[sectionName];
        
        if (!sectionData && this.isSectionRequired(sectionConfig)) {
          throw new Error(`Required section ${sectionName} is missing in ${pageName}`);
        }

        this.validateSectionData(sectionData, sectionConfig, `${pageName}.${sectionName}`);
      }
    }
  }

  private isSectionRequired(sectionConfig: any): boolean {
    // Check if any required fields exist in the section
    return Object.values(sectionConfig.fields).some(
      (field: any) => field.required
    );
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

  private processImagePath(imagePath: string): string {
    // Convert /uploads/temp/ paths to /static/uploads/
    return imagePath?.replace('/uploads/temp/', '/static/uploads/') || '';
  }

  private processArrayItem(item: any, itemConfig: any): any {
    if (typeof item === 'object') {
      return this.processObjectFields(item, itemConfig.fields);
    }
    return item;
  }

  private processObjectFields(obj: any, fields: any): any {
    const processed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (fields[key]) {
        processed[key] = this.processFieldValue(value, fields[key], fields[key].type);
      }
    }
    return processed;
  }

  private validateSectionData(sectionData: any, sectionConfig: any, path: string) {
    if (!sectionData) return;

    for (const [fieldName, fieldConfig] of Object.entries(sectionConfig.fields)) {
      const value = sectionData[fieldName];
      if ((fieldConfig as FieldConfig).required && !value && !(fieldConfig as FieldConfig).default) {
        throw new Error(`Required field ${path}.${fieldName} is missing`);
      }
    }
  }

  private async persistImages(data: any, websiteId: string): Promise<any> {
    const processValue = async (value: any, path: string) => {
      if (typeof value === 'string' && value.startsWith('/uploads/temp/')) {
        const filename = value.split('/').pop();
        const newPath = `/static/uploads/${filename}`;

        // Create document group and document
        let documentGroup = await this.documentGroupRepository.findOne({
          where: {
            schoolWebsiteId: websiteId,
            accessor: path,
          },
        });

        if (!documentGroup) {
          documentGroup = await this.documentGroupRepository.save({
            schoolWebsiteId: websiteId,
            accessor: path,
          });
        }

        await this.documentRepository.save({
          type: 'image',
          name: filename,
          mimeType: 'image/webp',
          path: newPath,
          url: newPath,
          documentGroupId: documentGroup.id,
          order: 0,
        });

        return newPath;
      }
      return value;
    };

    const processObject = async (obj: any, parentPath = ''): Promise<any> => {
      const result = { ...obj };
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = parentPath ? `${parentPath}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          result[key] = await processObject(value, currentPath);
        } else {
          result[key] = await processValue(value, currentPath);
        }
      }
      return result;
    };

    return processObject(data);
  }
}