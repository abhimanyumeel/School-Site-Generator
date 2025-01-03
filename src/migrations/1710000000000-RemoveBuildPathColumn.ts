import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveBuildPathColumn1710000000000 implements MigrationInterface {
    name = 'RemoveBuildPathColumn1710000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove the buildPath column
        await queryRunner.query(`
            ALTER TABLE "school_websites" 
            DROP COLUMN IF EXISTS "buildPath"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add back the buildPath column if we need to rollback
        await queryRunner.query(`
            ALTER TABLE "school_websites" 
            ADD COLUMN "buildPath" character varying
        `);
    }
} 