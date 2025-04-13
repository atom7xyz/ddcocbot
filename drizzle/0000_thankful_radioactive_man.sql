CREATE TYPE "public"."role" AS ENUM('leader', 'coleader', 'elder', 'member', 'none');--> statement-breakpoint
CREATE TABLE "clash_profiles" (
	"tag" char(10) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role"
);
--> statement-breakpoint
CREATE TABLE "telegram_profiles" (
	"id" bigint PRIMARY KEY NOT NULL,
	"username" varchar(255) DEFAULT '',
	"first_name" varchar(255) DEFAULT '',
	"last_name" varchar(255) DEFAULT '',
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_profile_id" integer,
	"clash_profile_tag" varchar
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_telegram_profile_id_telegram_profiles_id_fk" FOREIGN KEY ("telegram_profile_id") REFERENCES "public"."telegram_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clash_profile_tag_clash_profiles_tag_fk" FOREIGN KEY ("clash_profile_tag") REFERENCES "public"."clash_profiles"("tag") ON DELETE cascade ON UPDATE no action;