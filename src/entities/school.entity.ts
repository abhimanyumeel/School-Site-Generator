import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { SchoolGroup } from './school-group.entity';
import { SchoolWebsite } from './school-website.entity';

@Entity('schools')
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  schoolGroupId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => SchoolGroup, schoolGroup => schoolGroup.schools)
  schoolGroup: SchoolGroup;

  @OneToMany(() => SchoolWebsite, website => website.school)
  websites: SchoolWebsite[];
} 