import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "service_categories_rels" ADD COLUMN "solutions_id" integer;
  ALTER TABLE "_service_categories_v_rels" ADD COLUMN "solutions_id" integer;
  ALTER TABLE "solutions" ADD COLUMN "order" numeric;
  ALTER TABLE "_solutions_v" ADD COLUMN "version_order" numeric;
  ALTER TABLE "service_categories_rels" ADD CONSTRAINT "service_categories_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_service_categories_v_rels" ADD CONSTRAINT "_service_categories_v_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "service_categories_rels_solutions_id_idx" ON "service_categories_rels" USING btree ("solutions_id");
  CREATE INDEX "_service_categories_v_rels_solutions_id_idx" ON "_service_categories_v_rels" USING btree ("solutions_id");
  CREATE INDEX "solutions_order_idx" ON "solutions" USING btree ("order");
  CREATE INDEX "_solutions_v_version_version_order_idx" ON "_solutions_v" USING btree ("version_order");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "service_categories_rels" DROP CONSTRAINT "service_categories_rels_solutions_fk";
  
  ALTER TABLE "_service_categories_v_rels" DROP CONSTRAINT "_service_categories_v_rels_solutions_fk";
  
  DROP INDEX "service_categories_rels_solutions_id_idx";
  DROP INDEX "_service_categories_v_rels_solutions_id_idx";
  DROP INDEX "solutions_order_idx";
  DROP INDEX "_solutions_v_version_version_order_idx";
  ALTER TABLE "service_categories_rels" DROP COLUMN "solutions_id";
  ALTER TABLE "_service_categories_v_rels" DROP COLUMN "solutions_id";
  ALTER TABLE "solutions" DROP COLUMN "order";
  ALTER TABLE "_solutions_v" DROP COLUMN "version_order";`)
}
