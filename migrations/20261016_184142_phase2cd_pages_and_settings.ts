import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_page_content_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_content_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "page_content_about_intro_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_content_about_principles_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "page_content_academy_intention_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_content_academy_topics_groups_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "page_content_academy_topics_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "page_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"about_hero_label" varchar,
  	"about_hero_heading" varchar,
  	"about_hero_description" varchar,
  	"about_image_id" integer,
  	"about_image_caption" varchar,
  	"about_intro_eyebrow" varchar,
  	"about_intro_heading" varchar,
  	"about_intro_lead" varchar,
  	"about_vision_label" varchar,
  	"about_vision_heading" varchar,
  	"about_vision_body" varchar,
  	"about_mission_label" varchar,
  	"about_mission_heading" varchar,
  	"about_mission_body" varchar,
  	"about_principles_enabled" boolean DEFAULT true,
  	"about_principles_eyebrow" varchar,
  	"about_principles_title" varchar,
  	"about_direction_enabled" boolean DEFAULT true,
  	"about_direction_eyebrow" varchar,
  	"about_direction_heading" varchar,
  	"about_direction_body" varchar,
  	"about_direction_link_label" varchar,
  	"about_direction_link_href" varchar,
  	"about_cta_title" varchar,
  	"about_cta_description" varchar,
  	"about_cta_service" varchar,
  	"about_seo_title" varchar,
  	"about_seo_description" varchar,
  	"academy_hero_eyebrow" varchar,
  	"academy_hero_heading" varchar,
  	"academy_hero_heading_accent" varchar,
  	"academy_hero_description" varchar,
  	"academy_hero_status_label" varchar,
  	"academy_hero_image_id" integer,
  	"academy_intention_enabled" boolean DEFAULT true,
  	"academy_intention_eyebrow" varchar,
  	"academy_intention_heading" varchar,
  	"academy_topics_enabled" boolean DEFAULT true,
  	"academy_topics_eyebrow" varchar,
  	"academy_topics_title" varchar,
  	"academy_next_enabled" boolean DEFAULT true,
  	"academy_next_eyebrow" varchar,
  	"academy_next_heading" varchar,
  	"academy_next_body" varchar,
  	"academy_next_link_label" varchar,
  	"academy_next_link_href" varchar,
  	"academy_seo_title" varchar,
  	"academy_seo_description" varchar,
  	"contact_hero_eyebrow" varchar,
  	"contact_hero_heading" varchar,
  	"contact_hero_description" varchar,
  	"contact_section_eyebrow" varchar,
  	"contact_section_heading" varchar,
  	"contact_section_details_intro" varchar,
  	"contact_section_note" varchar,
  	"contact_next_enabled" boolean DEFAULT true,
  	"contact_next_eyebrow" varchar,
  	"contact_next_heading" varchar,
  	"contact_next_body" varchar,
  	"contact_seo_title" varchar,
  	"contact_seo_description" varchar,
  	"services_hero_label" varchar,
  	"services_hero_heading" varchar,
  	"services_hero_description" varchar,
  	"services_hero_button" varchar,
  	"services_cta_title" varchar,
  	"services_cta_description" varchar,
  	"services_cta_service" varchar,
  	"services_seo_title" varchar,
  	"services_seo_description" varchar,
  	"solutions_hero_label" varchar,
  	"solutions_hero_heading" varchar,
  	"solutions_hero_description" varchar,
  	"solutions_opening_label" varchar,
  	"solutions_opening_body" varchar,
  	"solutions_opening_link_label" varchar,
  	"solutions_opening_link_href" varchar,
  	"solutions_cta_title" varchar,
  	"solutions_cta_description" varchar,
  	"solutions_cta_service" varchar,
  	"solutions_seo_title" varchar,
  	"solutions_seo_description" varchar,
  	"portfolio_hero_label" varchar,
  	"portfolio_hero_heading" varchar,
  	"portfolio_hero_description" varchar,
  	"portfolio_note_status_label" varchar,
  	"portfolio_note_body" varchar,
  	"portfolio_cta_title" varchar,
  	"portfolio_cta_description" varchar,
  	"portfolio_cta_service" varchar,
  	"portfolio_seo_title" varchar,
  	"portfolio_seo_description" varchar,
  	"updated_by_id" integer,
  	"_status" "enum_page_content_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_content_v_version_about_intro_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_content_v_version_about_principles_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_content_v_version_academy_intention_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_content_v_version_academy_topics_groups_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_content_v_version_academy_topics_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_content_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_about_hero_label" varchar,
  	"version_about_hero_heading" varchar,
  	"version_about_hero_description" varchar,
  	"version_about_image_id" integer,
  	"version_about_image_caption" varchar,
  	"version_about_intro_eyebrow" varchar,
  	"version_about_intro_heading" varchar,
  	"version_about_intro_lead" varchar,
  	"version_about_vision_label" varchar,
  	"version_about_vision_heading" varchar,
  	"version_about_vision_body" varchar,
  	"version_about_mission_label" varchar,
  	"version_about_mission_heading" varchar,
  	"version_about_mission_body" varchar,
  	"version_about_principles_enabled" boolean DEFAULT true,
  	"version_about_principles_eyebrow" varchar,
  	"version_about_principles_title" varchar,
  	"version_about_direction_enabled" boolean DEFAULT true,
  	"version_about_direction_eyebrow" varchar,
  	"version_about_direction_heading" varchar,
  	"version_about_direction_body" varchar,
  	"version_about_direction_link_label" varchar,
  	"version_about_direction_link_href" varchar,
  	"version_about_cta_title" varchar,
  	"version_about_cta_description" varchar,
  	"version_about_cta_service" varchar,
  	"version_about_seo_title" varchar,
  	"version_about_seo_description" varchar,
  	"version_academy_hero_eyebrow" varchar,
  	"version_academy_hero_heading" varchar,
  	"version_academy_hero_heading_accent" varchar,
  	"version_academy_hero_description" varchar,
  	"version_academy_hero_status_label" varchar,
  	"version_academy_hero_image_id" integer,
  	"version_academy_intention_enabled" boolean DEFAULT true,
  	"version_academy_intention_eyebrow" varchar,
  	"version_academy_intention_heading" varchar,
  	"version_academy_topics_enabled" boolean DEFAULT true,
  	"version_academy_topics_eyebrow" varchar,
  	"version_academy_topics_title" varchar,
  	"version_academy_next_enabled" boolean DEFAULT true,
  	"version_academy_next_eyebrow" varchar,
  	"version_academy_next_heading" varchar,
  	"version_academy_next_body" varchar,
  	"version_academy_next_link_label" varchar,
  	"version_academy_next_link_href" varchar,
  	"version_academy_seo_title" varchar,
  	"version_academy_seo_description" varchar,
  	"version_contact_hero_eyebrow" varchar,
  	"version_contact_hero_heading" varchar,
  	"version_contact_hero_description" varchar,
  	"version_contact_section_eyebrow" varchar,
  	"version_contact_section_heading" varchar,
  	"version_contact_section_details_intro" varchar,
  	"version_contact_section_note" varchar,
  	"version_contact_next_enabled" boolean DEFAULT true,
  	"version_contact_next_eyebrow" varchar,
  	"version_contact_next_heading" varchar,
  	"version_contact_next_body" varchar,
  	"version_contact_seo_title" varchar,
  	"version_contact_seo_description" varchar,
  	"version_services_hero_label" varchar,
  	"version_services_hero_heading" varchar,
  	"version_services_hero_description" varchar,
  	"version_services_hero_button" varchar,
  	"version_services_cta_title" varchar,
  	"version_services_cta_description" varchar,
  	"version_services_cta_service" varchar,
  	"version_services_seo_title" varchar,
  	"version_services_seo_description" varchar,
  	"version_solutions_hero_label" varchar,
  	"version_solutions_hero_heading" varchar,
  	"version_solutions_hero_description" varchar,
  	"version_solutions_opening_label" varchar,
  	"version_solutions_opening_body" varchar,
  	"version_solutions_opening_link_label" varchar,
  	"version_solutions_opening_link_href" varchar,
  	"version_solutions_cta_title" varchar,
  	"version_solutions_cta_description" varchar,
  	"version_solutions_cta_service" varchar,
  	"version_solutions_seo_title" varchar,
  	"version_solutions_seo_description" varchar,
  	"version_portfolio_hero_label" varchar,
  	"version_portfolio_hero_heading" varchar,
  	"version_portfolio_hero_description" varchar,
  	"version_portfolio_note_status_label" varchar,
  	"version_portfolio_note_body" varchar,
  	"version_portfolio_cta_title" varchar,
  	"version_portfolio_cta_description" varchar,
  	"version_portfolio_cta_service" varchar,
  	"version_portfolio_seo_title" varchar,
  	"version_portfolio_seo_description" varchar,
  	"version_updated_by_id" integer,
  	"version__status" "enum__page_content_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "contact_postal_address_street" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "contact_postal_address_locality" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "contact_postal_address_region" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "contact_postal_address_postal_code" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "contact_postal_address_country" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "footer_location_label" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_contact_postal_address_street" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_contact_postal_address_locality" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_contact_postal_address_region" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_contact_postal_address_postal_code" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_contact_postal_address_country" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_footer_location_label" varchar;
  ALTER TABLE "page_content_about_intro_paragraphs" ADD CONSTRAINT "page_content_about_intro_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_content_about_principles_items" ADD CONSTRAINT "page_content_about_principles_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_content_academy_intention_paragraphs" ADD CONSTRAINT "page_content_academy_intention_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_content_academy_topics_groups_items" ADD CONSTRAINT "page_content_academy_topics_groups_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_content_academy_topics_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_content_academy_topics_groups" ADD CONSTRAINT "page_content_academy_topics_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_content" ADD CONSTRAINT "page_content_about_image_id_media_id_fk" FOREIGN KEY ("about_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_content" ADD CONSTRAINT "page_content_academy_hero_image_id_media_id_fk" FOREIGN KEY ("academy_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_content" ADD CONSTRAINT "page_content_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_content_v_version_about_intro_paragraphs" ADD CONSTRAINT "_page_content_v_version_about_intro_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_content_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_content_v_version_about_principles_items" ADD CONSTRAINT "_page_content_v_version_about_principles_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_content_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_content_v_version_academy_intention_paragraphs" ADD CONSTRAINT "_page_content_v_version_academy_intention_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_content_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_content_v_version_academy_topics_groups_items" ADD CONSTRAINT "_page_content_v_version_academy_topics_groups_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_content_v_version_academy_topics_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_content_v_version_academy_topics_groups" ADD CONSTRAINT "_page_content_v_version_academy_topics_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_content_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_content_v" ADD CONSTRAINT "_page_content_v_version_about_image_id_media_id_fk" FOREIGN KEY ("version_about_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_content_v" ADD CONSTRAINT "_page_content_v_version_academy_hero_image_id_media_id_fk" FOREIGN KEY ("version_academy_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_content_v" ADD CONSTRAINT "_page_content_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "page_content_about_intro_paragraphs_order_idx" ON "page_content_about_intro_paragraphs" USING btree ("_order");
  CREATE INDEX "page_content_about_intro_paragraphs_parent_id_idx" ON "page_content_about_intro_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "page_content_about_principles_items_order_idx" ON "page_content_about_principles_items" USING btree ("_order");
  CREATE INDEX "page_content_about_principles_items_parent_id_idx" ON "page_content_about_principles_items" USING btree ("_parent_id");
  CREATE INDEX "page_content_academy_intention_paragraphs_order_idx" ON "page_content_academy_intention_paragraphs" USING btree ("_order");
  CREATE INDEX "page_content_academy_intention_paragraphs_parent_id_idx" ON "page_content_academy_intention_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "page_content_academy_topics_groups_items_order_idx" ON "page_content_academy_topics_groups_items" USING btree ("_order");
  CREATE INDEX "page_content_academy_topics_groups_items_parent_id_idx" ON "page_content_academy_topics_groups_items" USING btree ("_parent_id");
  CREATE INDEX "page_content_academy_topics_groups_order_idx" ON "page_content_academy_topics_groups" USING btree ("_order");
  CREATE INDEX "page_content_academy_topics_groups_parent_id_idx" ON "page_content_academy_topics_groups" USING btree ("_parent_id");
  CREATE INDEX "page_content_about_about_image_idx" ON "page_content" USING btree ("about_image_id");
  CREATE INDEX "page_content_academy_hero_academy_hero_image_idx" ON "page_content" USING btree ("academy_hero_image_id");
  CREATE INDEX "page_content_updated_by_idx" ON "page_content" USING btree ("updated_by_id");
  CREATE INDEX "page_content__status_idx" ON "page_content" USING btree ("_status");
  CREATE INDEX "_page_content_v_version_about_intro_paragraphs_order_idx" ON "_page_content_v_version_about_intro_paragraphs" USING btree ("_order");
  CREATE INDEX "_page_content_v_version_about_intro_paragraphs_parent_id_idx" ON "_page_content_v_version_about_intro_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_page_content_v_version_about_principles_items_order_idx" ON "_page_content_v_version_about_principles_items" USING btree ("_order");
  CREATE INDEX "_page_content_v_version_about_principles_items_parent_id_idx" ON "_page_content_v_version_about_principles_items" USING btree ("_parent_id");
  CREATE INDEX "_page_content_v_version_academy_intention_paragraphs_order_idx" ON "_page_content_v_version_academy_intention_paragraphs" USING btree ("_order");
  CREATE INDEX "_page_content_v_version_academy_intention_paragraphs_parent_id_idx" ON "_page_content_v_version_academy_intention_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_page_content_v_version_academy_topics_groups_items_order_idx" ON "_page_content_v_version_academy_topics_groups_items" USING btree ("_order");
  CREATE INDEX "_page_content_v_version_academy_topics_groups_items_parent_id_idx" ON "_page_content_v_version_academy_topics_groups_items" USING btree ("_parent_id");
  CREATE INDEX "_page_content_v_version_academy_topics_groups_order_idx" ON "_page_content_v_version_academy_topics_groups" USING btree ("_order");
  CREATE INDEX "_page_content_v_version_academy_topics_groups_parent_id_idx" ON "_page_content_v_version_academy_topics_groups" USING btree ("_parent_id");
  CREATE INDEX "_page_content_v_version_about_version_about_image_idx" ON "_page_content_v" USING btree ("version_about_image_id");
  CREATE INDEX "_page_content_v_version_academy_hero_version_academy_her_idx" ON "_page_content_v" USING btree ("version_academy_hero_image_id");
  CREATE INDEX "_page_content_v_version_version_updated_by_idx" ON "_page_content_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_page_content_v_version_version__status_idx" ON "_page_content_v" USING btree ("version__status");
  CREATE INDEX "_page_content_v_created_at_idx" ON "_page_content_v" USING btree ("created_at");
  CREATE INDEX "_page_content_v_updated_at_idx" ON "_page_content_v" USING btree ("updated_at");
  CREATE INDEX "_page_content_v_latest_idx" ON "_page_content_v" USING btree ("latest");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "page_content_about_intro_paragraphs" CASCADE;
  DROP TABLE "page_content_about_principles_items" CASCADE;
  DROP TABLE "page_content_academy_intention_paragraphs" CASCADE;
  DROP TABLE "page_content_academy_topics_groups_items" CASCADE;
  DROP TABLE "page_content_academy_topics_groups" CASCADE;
  DROP TABLE "page_content" CASCADE;
  DROP TABLE "_page_content_v_version_about_intro_paragraphs" CASCADE;
  DROP TABLE "_page_content_v_version_about_principles_items" CASCADE;
  DROP TABLE "_page_content_v_version_academy_intention_paragraphs" CASCADE;
  DROP TABLE "_page_content_v_version_academy_topics_groups_items" CASCADE;
  DROP TABLE "_page_content_v_version_academy_topics_groups" CASCADE;
  DROP TABLE "_page_content_v" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "contact_postal_address_street";
  ALTER TABLE "site_settings" DROP COLUMN "contact_postal_address_locality";
  ALTER TABLE "site_settings" DROP COLUMN "contact_postal_address_region";
  ALTER TABLE "site_settings" DROP COLUMN "contact_postal_address_postal_code";
  ALTER TABLE "site_settings" DROP COLUMN "contact_postal_address_country";
  ALTER TABLE "site_settings" DROP COLUMN "footer_location_label";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_contact_postal_address_street";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_contact_postal_address_locality";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_contact_postal_address_region";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_contact_postal_address_postal_code";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_contact_postal_address_country";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_footer_location_label";
  DROP TYPE "public"."enum_page_content_status";
  DROP TYPE "public"."enum__page_content_v_version_status";`)
}
