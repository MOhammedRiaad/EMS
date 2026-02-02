import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCascadeToAnnouncementRead1769681843729 implements MigrationInterface {
  name = 'AddCascadeToAnnouncementRead1769681843729';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "announcement_reads" DROP CONSTRAINT "FK_77c99446ffea2d8edb5b751e6aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_reads" ADD CONSTRAINT "FK_77c99446ffea2d8edb5b751e6aa" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "announcement_reads" DROP CONSTRAINT "FK_77c99446ffea2d8edb5b751e6aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_reads" ADD CONSTRAINT "FK_77c99446ffea2d8edb5b751e6aa" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
