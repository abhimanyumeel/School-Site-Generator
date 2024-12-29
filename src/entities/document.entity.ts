import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { DocumentGroup } from './document-group.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column()
  path: string;

  @Column()
  url: string;

  @Column()
  order: number;

  @Column()
  name: string;

  @Column()
  mimeType: string;

  @Column()
  documentGroupId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => DocumentGroup, group => group.documents)
  documentGroup: DocumentGroup;
} 