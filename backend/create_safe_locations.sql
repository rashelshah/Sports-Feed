-- =====================================================
-- Full Migration (run in Supabase SQL Editor)
-- Creates ALL missing tables for locations & check-ins
-- =====================================================

-- 1) heatmap_data
CREATE TABLE IF NOT EXISTS "public"."heatmap_data" (
    "id" "uuid" NOT NULL,
    "grid_lat" double precision NOT NULL,
    "grid_lng" double precision NOT NULL,
    "activity" character varying(50) NOT NULL,
    "intensity" integer DEFAULT 1 NOT NULL,
    "total_duration" integer DEFAULT 0 NOT NULL,
    "last_activity" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "heatmap_data_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "public"."heatmap_data" OWNER TO "postgres";
ALTER TABLE "public"."heatmap_data" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for service role on heatmap" ON "public"."heatmap_data";
CREATE POLICY "Allow all for service role on heatmap" ON "public"."heatmap_data"
    USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS "idx_heatmap_activity" ON "public"."heatmap_data" USING "btree" ("activity");
CREATE INDEX IF NOT EXISTS "idx_heatmap_grid" ON "public"."heatmap_data" USING "btree" ("grid_lat", "grid_lng");
CREATE INDEX IF NOT EXISTS "idx_heatmap_last_activity" ON "public"."heatmap_data" USING "btree" ("last_activity" DESC);

GRANT ALL ON TABLE "public"."heatmap_data" TO "anon";
GRANT ALL ON TABLE "public"."heatmap_data" TO "authenticated";
GRANT ALL ON TABLE "public"."heatmap_data" TO "service_role";

-- 2) location_checkins
CREATE TABLE IF NOT EXISTS "public"."location_checkins" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "location_name" "text",
    "activity" character varying(50) NOT NULL,
    "duration" integer NOT NULL,
    "notes" "text",
    "checked_in_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "location_checkins_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "public"."location_checkins" OWNER TO "postgres";
ALTER TABLE "public"."location_checkins" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view check-ins" ON "public"."location_checkins";
CREATE POLICY "Anyone can view check-ins" ON "public"."location_checkins"
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create check-ins" ON "public"."location_checkins";
CREATE POLICY "Authenticated users can create check-ins" ON "public"."location_checkins"
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own check-ins" ON "public"."location_checkins";
CREATE POLICY "Users can update own check-ins" ON "public"."location_checkins"
    FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS "idx_location_checkins_user" ON "public"."location_checkins" USING "btree" ("user_id", "checked_in_at" DESC);

GRANT ALL ON TABLE "public"."location_checkins" TO "anon";
GRANT ALL ON TABLE "public"."location_checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."location_checkins" TO "service_role";

-- 3) safe_locations — add new columns (safe if table already exists)
ALTER TABLE "public"."safe_locations"
  ADD COLUMN IF NOT EXISTS "creator_role" character varying(30) DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS "average_rating" numeric(3,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "total_ratings" integer DEFAULT 0 NOT NULL;

-- 4) safe_location_ratings table
CREATE TABLE IF NOT EXISTS "public"."safe_location_ratings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "location_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "safe_location_ratings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "safe_location_ratings_rating_check" CHECK (("rating" >= 1 AND "rating" <= 5)),
    CONSTRAINT "safe_location_ratings_unique" UNIQUE ("location_id", "user_id")
);
ALTER TABLE "public"."safe_location_ratings" OWNER TO "postgres";
ALTER TABLE "public"."safe_location_ratings" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view ratings" ON "public"."safe_location_ratings";
CREATE POLICY "Anyone can view ratings" ON "public"."safe_location_ratings"
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can rate" ON "public"."safe_location_ratings";
CREATE POLICY "Authenticated users can rate" ON "public"."safe_location_ratings"
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own ratings" ON "public"."safe_location_ratings";
CREATE POLICY "Users can update their own ratings" ON "public"."safe_location_ratings"
    FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete their own ratings" ON "public"."safe_location_ratings";
CREATE POLICY "Users can delete their own ratings" ON "public"."safe_location_ratings"
    FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS "idx_safe_location_ratings_location" ON "public"."safe_location_ratings" ("location_id");
CREATE INDEX IF NOT EXISTS "idx_safe_location_ratings_user" ON "public"."safe_location_ratings" ("user_id");

GRANT ALL ON TABLE "public"."safe_location_ratings" TO "anon";
GRANT ALL ON TABLE "public"."safe_location_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."safe_location_ratings" TO "service_role";

-- 5) safe_location_verifications (needed for verify feature)
CREATE TABLE IF NOT EXISTS "public"."safe_location_verifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "location_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "safe_location_verifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "safe_location_verifications_unique" UNIQUE ("location_id", "user_id")
);
ALTER TABLE "public"."safe_location_verifications" OWNER TO "postgres";
ALTER TABLE "public"."safe_location_verifications" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view verifications" ON "public"."safe_location_verifications";
CREATE POLICY "Anyone can view verifications" ON "public"."safe_location_verifications"
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can verify" ON "public"."safe_location_verifications";
CREATE POLICY "Authenticated users can verify" ON "public"."safe_location_verifications"
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can remove own verifications" ON "public"."safe_location_verifications";
CREATE POLICY "Users can remove own verifications" ON "public"."safe_location_verifications"
    FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS "idx_verifications_location" ON "public"."safe_location_verifications" ("location_id");
CREATE INDEX IF NOT EXISTS "idx_verifications_user" ON "public"."safe_location_verifications" ("user_id");

GRANT ALL ON TABLE "public"."safe_location_verifications" TO "anon";
GRANT ALL ON TABLE "public"."safe_location_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."safe_location_verifications" TO "service_role";
