import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SchoolWebsite } from './school-website.entity';
import { User } from './user.entity';

@Entity('website_versions')
export class WebsiteVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  websiteId: string;

  @Column()
  versionNumber: number;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ nullable: true })
  buildPath: string;

  @Column({ nullable: true })
  changeDescription: string;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  createdById: string;

  @ManyToOne(() => SchoolWebsite, website => website.versions)
  @JoinColumn({ name: 'websiteId' })
  website: SchoolWebsite;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;
}
