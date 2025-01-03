import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWebsiteVersionEntity1709534000000 implements MigrationInterface {
    name = 'UpdateWebsiteVersionEntity1709534000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing foreign keys if they exist
        await queryRunner.query(`
            ALTER TABLE "website_versions" 
            DROP CONSTRAINT IF EXISTS "FK_website_versions_school_websites",
            DROP CONSTRAINT IF EXISTS "FK_website_versions_users"
        `);

        // Drop the table if it exists and recreate with new schema
        await queryRunner.query(`
            DROP TABLE IF EXISTS "website_versions"
        `);

        // Create the table with updated schema
        await queryRunner.query(`
            CREATE TABLE "website_versions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "websiteId" uuid NOT NULL,
                "versionNumber" integer NOT NULL,
                "data" jsonb NOT NULL,
                "buildPath" character varying,
                "changeDescription" character varying,
                "isActive" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "createdById" uuid NOT NULL,
                CONSTRAINT "PK_website_versions" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "website_versions" 
            ADD CONSTRAINT "FK_website_versions_school_websites" 
            FOREIGN KEY ("websiteId") 
            REFERENCES "school_websites"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "website_versions" 
            ADD CONSTRAINT "FK_website_versions_users" 
            FOREIGN KEY ("createdById") 
            REFERENCES "users"("id") 
            ON DELETE NO ACTION
        `);

        // Add index for better query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_website_versions_websiteId" 
            ON "website_versions"("websiteId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_website_versions_isActive" 
            ON "website_versions"("isActive")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_website_versions_isActive"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_website_versions_websiteId"
        `);

        // Remove foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "website_versions" 
            DROP CONSTRAINT IF EXISTS "FK_website_versions_school_websites"
        `);

        await queryRunner.query(`
            ALTER TABLE "website_versions" 
            DROP CONSTRAINT IF EXISTS "FK_website_versions_users"
        `);

        // Drop the table
        await queryRunner.query(`
            DROP TABLE IF EXISTS "website_versions"
        `);
    }
} 