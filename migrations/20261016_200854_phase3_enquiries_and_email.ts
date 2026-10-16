import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_enquiries_status" AS ENUM('New', 'Contacted', 'In progress', 'Closed');
  CREATE TYPE "public"."enum_enquiries_notification" AS ENUM('Pending', 'Sent', 'Failed');
  CREATE TABLE "enquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_enquiries_status" DEFAULT 'New' NOT NULL,
  	"notification" "enum_enquiries_notification" DEFAULT 'Pending' NOT NULL,
  	"notification_note" varchar,
  	"internal_notes" varchar,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"company" varchar,
  	"service" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"consent" boolean DEFAULT false,
  	"submitted_at" timestamp(3) with time zone NOT NULL,
  	"submission_key" varchar,
  	"updated_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_enquiries_additional_recipients" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_enquiries_additional_recipients" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "enquiries_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "enquiries_accept_online" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "enquiries_notify" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "enquiries_sender_name" varchar DEFAULT 'DeltaWave Technology Website';
  ALTER TABLE "site_settings" ADD COLUMN "enquiries_sender_email" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "enquiries_recipient" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "enquiries_reply_to_visitor" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "enquiries_subject_prefix" varchar DEFAULT 'Website enquiry';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_enquiries_accept_online" boolean DEFAULT false;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_enquiries_notify" boolean DEFAULT true;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_enquiries_sender_name" varchar DEFAULT 'DeltaWave Technology Website';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_enquiries_sender_email" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_enquiries_recipient" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_enquiries_reply_to_visitor" boolean DEFAULT true;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_enquiries_subject_prefix" varchar DEFAULT 'Website enquiry';
  ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_enquiries_additional_recipients" ADD CONSTRAINT "site_settings_enquiries_additional_recipients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_enquiries_additional_recipients" ADD CONSTRAINT "_site_settings_v_version_enquiries_additional_recipients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "enquiries_service_idx" ON "enquiries" USING btree ("service");
  CREATE INDEX "enquiries_submitted_at_idx" ON "enquiries" USING btree ("submitted_at");
  CREATE UNIQUE INDEX "enquiries_submission_key_idx" ON "enquiries" USING btree ("submission_key");
  CREATE INDEX "enquiries_updated_by_idx" ON "enquiries" USING btree ("updated_by_id");
  CREATE INDEX "enquiries_updated_at_idx" ON "enquiries" USING btree ("updated_at");
  CREATE INDEX "enquiries_created_at_idx" ON "enquiries" USING btree ("created_at");
  CREATE INDEX "site_settings_enquiries_additional_recipients_order_idx" ON "site_settings_enquiries_additional_recipients" USING btree ("_order");
  CREATE INDEX "site_settings_enquiries_additional_recipients_parent_id_idx" ON "site_settings_enquiries_additional_recipients" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_enquiries_additional_recipients_order_idx" ON "_site_settings_v_version_enquiries_additional_recipients" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_enquiries_additional_recipients_parent_id_idx" ON "_site_settings_v_version_enquiries_additional_recipients" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enquiries_fk" FOREIGN KEY ("enquiries_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_enquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("enquiries_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "enquiries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_enquiries_additional_recipients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_enquiries_additional_recipients" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "enquiries" CASCADE;
  DROP TABLE "site_settings_enquiries_additional_recipients" CASCADE;
  DROP TABLE "_site_settings_v_version_enquiries_additional_recipients" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_enquiries_fk";
  
  DROP INDEX "payload_locked_documents_rels_enquiries_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "enquiries_id";
  ALTER TABLE "site_settings" DROP COLUMN "enquiries_accept_online";
  ALTER TABLE "site_settings" DROP COLUMN "enquiries_notify";
  ALTER TABLE "site_settings" DROP COLUMN "enquiries_sender_name";
  ALTER TABLE "site_settings" DROP COLUMN "enquiries_sender_email";
  ALTER TABLE "site_settings" DROP COLUMN "enquiries_recipient";
  ALTER TABLE "site_settings" DROP COLUMN "enquiries_reply_to_visitor";
  ALTER TABLE "site_settings" DROP COLUMN "enquiries_subject_prefix";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_enquiries_accept_online";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_enquiries_notify";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_enquiries_sender_name";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_enquiries_sender_email";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_enquiries_recipient";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_enquiries_reply_to_visitor";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_enquiries_subject_prefix";
  DROP TYPE "public"."enum_enquiries_status";
  DROP TYPE "public"."enum_enquiries_notification";`)
}
