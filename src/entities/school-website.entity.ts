import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { School } from './school.entity';
import { DocumentGroup } from './document-group.entity';
import { FormSubmission } from './form-submission.entity';
import { User } from './user.entity';
import { WebsiteVersion } from './website-version.entity';

@Entity('school_websites')
export class SchoolWebsite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  schoolId: string;

  @Column({ type: 'varchar' })
  themeId: string;

  @Column('jsonb', { nullable: true })
  data: any;

  @Column({ nullable: true })
  remarks: string;

  @Column({ default: 'inactive' })
  status: 'active' | 'inactive';

  @Column({ default: 1 })
  currentVersion: number;

  @Column({ nullable: true })
  currentBuildPath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => School, school => school.websites, { nullable: true })
  school: School;

  // @ManyToOne(() => Theme, theme => theme.websites)
  // theme: Theme;

  @OneToMany(() => DocumentGroup, group => group.schoolWebsite)
  documentGroups: DocumentGroup[];

  @OneToMany(() => FormSubmission, submission => submission.schoolWebsite)
  formSubmissions: FormSubmission[];

  @Column()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @OneToMany(() => WebsiteVersion, version => version.website)
  versions: WebsiteVersion[];

  // Helper methods for version management
  getLatestVersion(): WebsiteVersion | undefined {
    if (!this.versions || this.versions.length === 0) return undefined;
    return this.versions.reduce((latest, current) => {
      return current.versionNumber > latest.versionNumber ? current : latest;
    });
  }

  getActiveVersion(): WebsiteVersion | undefined {
    if (!this.versions) return undefined;
    return this.versions.find(version => version.isActive);
  }

  hasVersion(versionNumber: number): boolean {
    return this.versions?.some(version => version.versionNumber === versionNumber) ?? false;
  }
} 