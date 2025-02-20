import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SchoolWebsite } from './school-website.entity';



export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SINGLE_SCHOOL = 'SINGLE_SCHOOL',
  SCHOOL_ORGANIZATION = 'SCHOOL_ORGANIZATION'
}
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ 
    type: 'enum',
    enum: UserRole,
    default: UserRole.SINGLE_SCHOOL
  })
  role: UserRole;

  @Column({ default: 1 })
  websitesLimit: number;

  @Column({ default: 0})
  websitesCreated: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({nullable: true, type: 'timestamp' })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => SchoolWebsite, website => website.user)
  websites: SchoolWebsite[];
} 