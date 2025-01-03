import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeBuildPathNullable1710000000000 implements MigrationInterface {
    name = 'MakeBuildPathNullable1710000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "website_versions" 
            ALTER COLUMN "buildPath" DROP NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "website_versions" 
            ALTER COLUMN "buildPath" SET NOT NULL
        `);
    }
} 