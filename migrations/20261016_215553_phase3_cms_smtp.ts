import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_smtp_settings_port" AS ENUM('587', '465', '25', '2525');
  CREATE TYPE "public"."enum_smtp_settings_security" AS ENUM('starttls', 'tls');
  CREATE TABLE "smtp_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"host" varchar,
  	"port" "enum_smtp_settings_port",
  	"security" "enum_smtp_settings_security",
  	"username" varchar,
  	"password_encrypted" varchar,
  	"password_updated_at" timestamp(3) with time zone,
  	"updated_by" varchar,
  	"last_test_at" timestamp(3) with time zone,
  	"last_test_ok" boolean,
  	"last_test_message" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "smtp_settings" CASCADE;
  DROP TYPE "public"."enum_smtp_settings_port";
  DROP TYPE "public"."enum_smtp_settings_security";`)
}
