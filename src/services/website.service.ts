import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolWebsite } from '../entities/school-website.entity';
import { WebsiteVersion } from '../entities/website-version.entity';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(SchoolWebsite)
    private websiteRepository: Repository<SchoolWebsite>,
    @InjectRepository(WebsiteVersion)
    private websiteVersionRepository: Repository<WebsiteVersion>
  ) {}

  async getUserWebsites(userId: string) {
    return this.websiteRepository.find({
      where: { userId },
      relations: ['school', 'user', 'versions'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string) {
    try {
      const website = await this.websiteRepository.findOne({
        where: { id },
        relations: ['versions']
      });

      if (!website) {
        throw new NotFoundException(`Website with ID ${id} not found`);
      }

      // Get the active version's data
      const activeVersion = website.versions?.find(v => v.isActive);
      console.log('Active Version:', activeVersion); // Debug log

      if (activeVersion) {
        website.data = activeVersion.data; // This sets the current active data
        console.log('Setting website data to:', website.data);
      } else {
        console.log('No active version found');
      }

      return website;
    } catch (error) {
      console.error('Error in findOne:', error);
      throw new InternalServerErrorException('Failed to fetch website data');
    }
  }

  async getVersions(websiteId: string) {
    try {
      const website = await this.websiteRepository.findOne({
        where: { id: websiteId },
        relations: ['versions']
      });

      if (!website) {
        throw new NotFoundException(`Website with ID ${websiteId} not found`);
      }

      // If no versions exist, create initial version
      if (!website.versions || website.versions.length === 0) {
        const initialVersion = this.websiteVersionRepository.create({
          websiteId: website.id,
          versionNumber: 1,
          data: website.data || {}, // Ensure data is not null
          changeDescription: 'Initial version',
          isActive: true,
          createdById: website.userId
        });

        await this.websiteVersionRepository.save(initialVersion);
        return [initialVersion];
      }

      return website.versions;
    } catch (error) {
      console.error('Error in getVersions:', error);
      throw new InternalServerErrorException('Failed to fetch website versions');
    }
  }

  async createVersion(
    websiteId: string,
    data: any,
    changeDescription: string,
    userId: string
  ) {
    const queryRunner = this.websiteVersionRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get current website with versions
      const website = await queryRunner.manager.findOne(SchoolWebsite, {
        where: { id: websiteId },
        relations: ['versions']
      });

      if (!website) {
        throw new NotFoundException(`Website with ID ${websiteId} not found`);
      }

      // 2. Get all versions to calculate next version number
      const versions = await queryRunner.manager.find(WebsiteVersion, {
        where: { websiteId },
        order: { versionNumber: 'DESC' },
        take: 1
      });

      // Calculate next version number based on highest existing version
      const nextVersionNumber = versions.length > 0 
        ? versions[0].versionNumber + 1 
        : 1;

      // 3. Deactivate all current versions using raw query
      await queryRunner.query(
        `UPDATE website_versions SET "isActive" = false WHERE "websiteId" = $1`,
        [websiteId]
      );

      // 4. Create new version
      const newVersion = new WebsiteVersion();
      newVersion.websiteId = websiteId;
      newVersion.versionNumber = nextVersionNumber;
      newVersion.data = data;
      newVersion.changeDescription = changeDescription;
      newVersion.isActive = true;
      newVersion.createdById = userId;

      // 5. Save new version using queryRunner
      const savedVersion = await queryRunner.manager.save(WebsiteVersion, newVersion);

      // 6. Update website data and version number using raw query
      await queryRunner.query(
        `UPDATE school_websites 
         SET data = $1, "currentVersion" = $2 
         WHERE id = $3`,
        [data, nextVersionNumber, websiteId]
      );

      // 7. Commit transaction
      await queryRunner.commitTransaction();
      return savedVersion;

    } catch (error) {
      console.error('Error in createVersion:', error);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to create new version');
    } finally {
      await queryRunner.release();
    }
  }

  async activateVersion(websiteId: string, versionId: string) {
    try {
      const [website, version] = await Promise.all([
        this.websiteRepository.findOne({ where: { id: websiteId } }),
        this.websiteVersionRepository.findOne({ 
          where: { id: versionId, websiteId } 
        })
      ]);

      if (!version) {
        throw new NotFoundException(`Version ${versionId} not found`);
      }

      // Deactivate all versions
      await this.websiteVersionRepository.update(
        { websiteId },
        { isActive: false }
      );

      // Activate selected version
      version.isActive = true;
      await this.websiteVersionRepository.save(version);

      // Update website data
      website.data = version.data;
      website.currentVersion = version.versionNumber;
      await this.websiteRepository.save(website);

      // Update the data.json file
      if (website.currentBuildPath) {
        const dataJsonPath = path.join(website.currentBuildPath, 'data.json');
        await fs.writeFile(dataJsonPath, JSON.stringify(version.data, null, 2));
      }

      return version;
    } catch (error) {
      console.error('Error in activateVersion:', error);
      throw new InternalServerErrorException('Failed to activate version');
    }
  }
}
