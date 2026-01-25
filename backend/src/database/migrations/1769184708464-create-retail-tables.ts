import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRetailTables1769184708464 implements MigrationInterface {
    name = 'CreateRetailTables1769184708464'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "sku" character varying(50), "category" character varying(20) NOT NULL DEFAULT 'other', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sale_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "sale_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" integer NOT NULL, "unit_price" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) NOT NULL, CONSTRAINT "PK_5a7dc5b4562a9e590528b3e08ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "studio_id" uuid, "client_id" uuid, "total_amount" numeric(10,2) NOT NULL, "payment_method" character varying(20) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'completed', "sold_by" uuid NOT NULL, "transaction_id" uuid, CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_stocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "product_id" uuid NOT NULL, "studio_id" uuid, "quantity" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_3e6eefa449c5773c5fe43ab113d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD CONSTRAINT "FK_c210a330b80232c29c2ad68462a" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD CONSTRAINT "FK_4ecae62db3f9e9cc9a368d57adb" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_46d6229421ed38a882ab3367700" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_c49d95226945ca3a93584f912ca" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_7ad6a13e30bc3a852615bc9e90c" FOREIGN KEY ("sold_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_000ae4a84cb4f52cb1bd99e033e" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_stocks" ADD CONSTRAINT "FK_1e17816fecdb81490a1c2ae3682" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_stocks" ADD CONSTRAINT "FK_d9146fb9e21716b1ac2ea6ec1dd" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_stocks" DROP CONSTRAINT "FK_d9146fb9e21716b1ac2ea6ec1dd"`);
        await queryRunner.query(`ALTER TABLE "product_stocks" DROP CONSTRAINT "FK_1e17816fecdb81490a1c2ae3682"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_000ae4a84cb4f52cb1bd99e033e"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_7ad6a13e30bc3a852615bc9e90c"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_c49d95226945ca3a93584f912ca"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_46d6229421ed38a882ab3367700"`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "FK_4ecae62db3f9e9cc9a368d57adb"`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "FK_c210a330b80232c29c2ad68462a"`);
        await queryRunner.query(`DROP TABLE "product_stocks"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP TABLE "sale_items"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
