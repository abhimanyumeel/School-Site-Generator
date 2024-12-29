import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Document } from './document.entity';
import { SchoolWebsite } from './school-website.entity';

@Entity('document_groups')
export class DocumentGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accessor: string;

  @Column()
  schoolWebsiteId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => SchoolWebsite, website => website.documentGroups)
  schoolWebsite: SchoolWebsite;

  @OneToMany(() => Document, document => document.documentGroup)
  documents: Document[];
} 