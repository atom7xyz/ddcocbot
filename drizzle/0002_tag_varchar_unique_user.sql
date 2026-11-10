-- char(10) pads short tags with spaces and cannot hold tags longer than 10 characters.
ALTER TABLE "clash_profiles" ALTER COLUMN "tag" SET DATA TYPE varchar(16) USING rtrim("tag");--> statement-breakpoint
-- Remove duplicate users rows per Telegram profile before adding the unique constraint.
-- Keep the row that has a Clash profile; on a tie keep the oldest row.
DELETE FROM "users" AS "u"
USING "users" AS "d"
WHERE "u"."telegram_profile_id" = "d"."telegram_profile_id"
  AND (
    ("u"."clash_profile_tag" IS NULL AND "d"."clash_profile_tag" IS NOT NULL)
    OR (("u"."clash_profile_tag" IS NULL) = ("d"."clash_profile_tag" IS NULL) AND "u"."id" > "d"."id")
  );--> statement-breakpoint
-- A Clash profile belongs to at most one user: unlink it from every row except the oldest.
UPDATE "users" AS "u"
SET "clash_profile_tag" = NULL
FROM "users" AS "d"
WHERE "u"."clash_profile_tag" = "d"."clash_profile_tag" AND "u"."id" > "d"."id";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_telegram_profile_id_unique" UNIQUE("telegram_profile_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clash_profile_tag_unique" UNIQUE("clash_profile_tag");
