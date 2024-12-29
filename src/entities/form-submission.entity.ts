import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { SchoolWebsite } from './school-website.entity';

@Entity('form_submissions')
export class FormSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  schoolWebsiteId: string;

  @Column()
  type: string;

  @Column('jsonb')
  data: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => SchoolWebsite, website => website.formSubmissions)
  schoolWebsite: SchoolWebsite;
} 