import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { School } from './school.entity';
import { Theme } from './theme.entity';
import { DocumentGroup } from './document-group.entity';
import { FormSubmission } from './form-submission.entity';

@Entity('school_websites')
export class SchoolWebsite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  schoolId: string;

  @Column()
  themeId: string;

  @Column('jsonb', { nullable: true })
  data: any;

  @Column()
  version: string;

  @Column({ nullable: true })
  remarks: string;

  @Column({ default: 'inactive' })
  status: 'active' | 'inactive';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => School, school => school.websites)
  school: School;

  @ManyToOne(() => Theme, theme => theme.websites)
  theme: Theme;

  @OneToMany(() => DocumentGroup, group => group.schoolWebsite)
  documentGroups: DocumentGroup[];

  @OneToMany(() => FormSubmission, submission => submission.schoolWebsite)
  formSubmissions: FormSubmission[];
} 