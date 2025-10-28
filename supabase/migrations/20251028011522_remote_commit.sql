


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_tle";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."calculate_profile_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$declare
  total_fields int := 12; -- Número total de campos de datos a verificar
  completed_fields int := 0;
  data_score float := 0;
  
  -- Requerimientos de fotos
  cover_req int := 1;
  back_cover_req int := 3;
  portfolio_req int := 3;
  
  -- Puntuaciones de fotos
  cover_score float := 0;
  back_cover_score float := 0;
  portfolio_score float := 0;
  photo_score float := 0; -- ✨ VARIABLE CORREGIDA Y AÑADIDA ✨

  -- Conteo real de fotos
  cover_count int;
  back_cover_count int;
  portfolio_count int;

  -- Pesos (Datos 50%, Fotos 50%)
  data_weight float := 0.5;
  photo_weight float := 0.5;
  
  final_completion float;
begin
  -- 1. Calcular puntuación de los DATOS
  if NEW.alias is not null then completed_fields := completed_fields + 1; end if;
  if NEW.full_name is not null then completed_fields := completed_fields + 1; end if;
  if NEW.country is not null then completed_fields := completed_fields + 1; end if;
  if NEW.birth_date is not null then completed_fields := completed_fields + 1; end if;
  if NEW.height_cm is not null then completed_fields := completed_fields + 1; end if;
  if NEW.waist_cm is not null then completed_fields := completed_fields + 1; end if;
  if NEW.hips_cm is not null then completed_fields := completed_fields + 1; end if;
  if NEW.shoe_size_us is not null then completed_fields := completed_fields + 1; end if;
  if NEW.eye_color is not null then completed_fields := completed_fields + 1; end if;
  if NEW.hair_color is not null then completed_fields := completed_fields + 1; end if;
  if NEW.instagram is not null then completed_fields := completed_fields + 1; end if;
  if NEW.phone_number is not null then completed_fields := completed_fields + 1; end if;
  
  data_score := (completed_fields::float / total_fields::float);

  -- 2. Calcular puntuación de las FOTOS
  cover_count := count_files_in_storage('models', NEW.id || '/Portada/');
  back_cover_count := count_files_in_storage('models', NEW.id || '/Contraportada/');
  portfolio_count := count_files_in_storage('models', NEW.id || '/Portafolio/');
  
  if cover_count = cover_req then cover_score := 1; end if;
  if back_cover_count >= back_cover_req then back_cover_score := 1; end if;
  if portfolio_count >= portfolio_req then portfolio_score := 1; end if;
  
  -- Promedio de las 3 carpetas de fotos
  photo_score := (cover_score + back_cover_score + portfolio_score) / 3.0;
  
  -- 3. Calcular el porcentaje final ponderado
  final_completion := ((data_score * data_weight) + (photo_score * photo_weight)) * 100;
  
  -- Actualizar el campo 'profile_completion' en la tabla
  NEW.profile_completion := final_completion;
  
  return NEW;
end;$$;


ALTER FUNCTION "public"."calculate_profile_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."client_completes_project"("project_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Esta función es segura porque SOLO puede hacer una cosa:
  -- Cambiar el estado a 'completed' y poner la fecha de fin.
  -- El "WHERE" asegura que solo pueda hacerlo en proyectos
  -- que estén 'sent' o 'in-review', no en 'draft' o 'archived'.
  UPDATE public.projects
  SET 
    status = 'completed',
    end_date = now() -- Asigna la fecha de finalización
  WHERE 
    id = project_uuid
    AND (status = 'sent' OR status = 'in-review');
END;
$$;


ALTER FUNCTION "public"."client_completes_project"("project_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_files_in_storage"("bucket_name" "text", "folder_path" "text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
declare
  file_count integer;
  project_url text := 'https://wawumdjwerletgkiewyk.supabase.co';
  service_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhd3VtZGp3ZXJsZXRna2lld3lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4Mjg1MywiZXhwIjoyMDc0OTU4ODUzfQ._780AMD_FN3KuXpH0zC1alWC_pjFss1xiihD4wMV7r8';
  auth_header text := 'apikey ' || service_key;
  request_url text := project_url || '/storage/v1/object/list/' || bucket_name;
  response jsonb;
begin
  select content into response from extensions.http_post(
    request_url,
    jsonb_build_object('prefix', folder_path, 'limit', 100), -- Limitamos a 100 por seguridad
    'application/json',
    array[extensions.http_header('Authorization', auth_header)]
  );
  
  file_count := jsonb_array_length(response);
  
  -- La API de listado a veces incluye la propia carpeta como un objeto. Lo filtramos.
  if file_count > 0 then
    if (response->0->>'name') = split_part(folder_path, '/', -1) then
      return file_count - 1;
    end if;
  end if;

  return file_count;
exception when others then
  return 0;
end;
$$;


ALTER FUNCTION "public"."count_files_in_storage"("bucket_name" "text", "folder_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_model_report"() RETURNS TABLE("alias" "text", "full_name" "text", "tiene_portada" boolean, "tiene_portafolio" boolean, "comp_card_paths" "text"[])
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    m.alias,
    m.full_name,
    (m.cover_path IS NOT NULL) AS tiene_portada,
    (m.portfolio_path IS NOT NULL) AS tiene_portafolio,
    m.comp_card_paths
  FROM
    public.models m
  ORDER BY
    m.alias;
$$;


ALTER FUNCTION "public"."get_model_report"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_model_fts_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Cambiamos 'simple' por 'public.spanish_unaccent'
  NEW.fts_search_vector :=
    setweight(to_tsvector('public.spanish_unaccent', coalesce(NEW.alias, '')), 'A');
    -- Si habías vuelto a añadir full_name, asegúrate que aquí también use 'public.spanish_unaccent'
    -- || setweight(to_tsvector('public.spanish_unaccent', coalesce(NEW.full_name, '')), 'B');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_model_fts_vector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_model_profile_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    completed_fields INTEGER := 0;
    -- El número total de campos que cuentan para el perfil completado.
    -- Ajústalo si añades o quitas campos en el futuro.
    total_fields INTEGER := 22;
BEGIN
    -- Se suma 1 por cada campo que no esté vacío.
    IF NEW.alias IS NOT NULL AND NEW.alias <> '' THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.full_name IS NOT NULL AND NEW.full_name <> '' THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.gender IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.birth_date IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.country IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.height_cm IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.shoulders_cm IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.chest_cm IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.bust_cm IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.waist_cm IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.hips_cm IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.top_size IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;

    -- === LA CORRECCIÓN CLAVE ESTÁ AQUÍ ===
    -- Se asegura de tratar 'pants_size' como texto antes de comparar.
    IF NEW.pants_size IS NOT NULL AND NEW.pants_size::text <> '' THEN completed_fields := completed_fields + 1; END IF;
    
    IF NEW.shoe_size_us IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.eye_color IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.hair_color IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.instagram IS NOT NULL AND NEW.instagram <> '' THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.tiktok IS NOT NULL AND NEW.tiktok <> '' THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.email IS NOT NULL AND NEW.email <> '' THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.phone_number IS NOT NULL AND NEW.phone_number <> '' THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.status IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF NEW.date_joined_agency IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;

    -- Calcula el porcentaje y lo asigna al campo 'profile_completion'.
    NEW.profile_completion := (completed_fields::FLOAT / total_fields::FLOAT) * 100;
    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_model_profile_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_completeness"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$DECLARE
  completeness_score integer := 0;
BEGIN
  -- Asignar puntos por cada campo completado. Total: 100 puntos.
  
  -- Información Crítica (8 puntos cada uno, total 40)
  IF NEW.full_name IS NOT NULL AND NEW.full_name <> '' THEN completeness_score := completeness_score + 8; END IF;
  IF NEW.national_id IS NOT NULL AND NEW.national_id <> '' THEN completeness_score := completeness_score + 8; END IF;
  IF NEW.phone_e164 IS NOT NULL AND NEW.phone_e164 <> '' THEN completeness_score := completeness_score + 8; END IF;
  IF NEW.email IS NOT NULL AND NEW.email <> '' THEN completeness_score := completeness_score + 8; END IF;
  -- CORRECCIÓN: Se usa height_cm
  IF NEW.height_cm IS NOT NULL AND NEW.height_cm > 0 THEN completeness_score := completeness_score + 8; END IF;
  
  -- Información Esencial (6 puntos cada uno, total 30)
  IF NEW.gender IS NOT NULL AND NEW.gender <> '' THEN completeness_score := completeness_score + 6; END IF;
  IF NEW.birth_date IS NOT NULL THEN completeness_score := completeness_score + 6; END IF;
  IF NEW.top_size IS NOT NULL AND NEW.top_size <> '' THEN completeness_score := completeness_score + 6; END IF;
  -- CORRECCIÓN: Se usa pants_size
  IF NEW.pants_size IS NOT NULL AND NEW.pants_size > 0 THEN completeness_score := completeness_score + 6; END IF;
  -- CORRECCIÓN: Se usa shoe_size_us
  IF NEW.shoe_size_us IS NOT NULL AND NEW.shoe_size_us > 0 THEN completeness_score := completeness_score + 6; END IF;
  
  -- Medidas Detalladas (3 puntos cada una, total 15)
  IF NEW.waist_cm IS NOT NULL AND NEW.waist_cm > 0 THEN completeness_score := completeness_score + 3; END IF;
  -- CORRECCIÓN: Se usa hips_cm
  IF NEW.hips_cm IS NOT NULL AND NEW.hips_cm > 0 THEN completeness_score := completeness_score + 3; END IF;
  IF NEW.shoulders_cm IS NOT NULL AND NEW.shoulders_cm > 0 THEN completeness_score := completeness_score + 3; END IF;
  IF NEW.chest_cm IS NOT NULL AND NEW.chest_cm > 0 THEN completeness_score := completeness_score + 3; END IF;
  IF NEW.bust_cm IS NOT NULL AND NEW.bust_cm > 0 THEN completeness_score := completeness_score + 3; END IF;

  -- Apariencia y Redes Sociales (5 puntos cada uno, total 15)
  IF NEW.eye_color IS NOT NULL AND NEW.eye_color <> '' THEN completeness_score := completeness_score + 5; END IF;
  IF NEW.hair_color IS NOT NULL AND NEW.hair_color <> '' THEN completeness_score := completeness_score + 5; END IF;
  IF NEW.instagram IS NOT NULL AND NEW.instagram <> '' THEN completeness_score := completeness_score + 5; END IF;
  
  -- Limitar el puntaje máximo a 100
  IF completeness_score > 100 THEN
    completeness_score := 100;
  END IF;

  -- Actualizar la columna del modelo con el nuevo puntaje
  NEW.profile_completeness := completeness_score;
  
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_profile_completeness"() OWNER TO "postgres";


CREATE TEXT SEARCH CONFIGURATION "public"."spanish_unaccent" (
    PARSER = "pg_catalog"."default" );

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "asciiword" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "word" WITH "public"."unaccent", "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "numword" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "email" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "url" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "host" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "sfloat" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "version" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "hword_numpart" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "hword_part" WITH "public"."unaccent", "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "hword_asciipart" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "numhword" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "asciihword" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "hword" WITH "public"."unaccent", "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "url_path" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "file" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "float" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "int" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent"
    ADD MAPPING FOR "uint" WITH "simple";


ALTER TEXT SEARCH CONFIGURATION "public"."spanish_unaccent" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "alias" "text",
    "full_name" "text" NOT NULL,
    "birth_date" "date",
    "national_id" character varying(13),
    "phone_e164" character varying(20),
    "email" "text",
    "gender" "text",
    "country" "text" DEFAULT 'Guatemala'::"text",
    "eye_color" "text",
    "hair_color" "text",
    "height_cm" integer,
    "shoulders_cm" integer,
    "chest_cm" integer,
    "bust_cm" integer,
    "waist_cm" integer,
    "hips_cm" integer,
    "top_size" "text",
    "pants_size" integer,
    "shoe_size_us" numeric,
    "instagram" "text",
    "tiktok" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "date_joined_agency" "date",
    "user_id" "uuid",
    "profile_completeness" integer DEFAULT 0,
    "cover_path" "text",
    "portfolio_path" "text",
    "comp_card_paths" "text"[],
    "fts_search_vector" "tsvector"
);


ALTER TABLE "public"."models" OWNER TO "postgres";


COMMENT ON COLUMN "public"."models"."height_cm" IS 'Estatura en centímetros. Ej: 183';



COMMENT ON COLUMN "public"."models"."chest_cm" IS 'Medida de pecho en cm, usualmente para modelos masculinos.';



COMMENT ON COLUMN "public"."models"."bust_cm" IS 'Medida de busto en cm, usualmente para modelos femeninos.';



COMMENT ON COLUMN "public"."models"."user_id" IS 'Vincula el modelo al usuario (administrador) que lo creó.';



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "project_name" "text" NOT NULL,
    "client_name" "text",
    "description" "text",
    "start_date" "date",
    "end_date" "date",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "public_id" "text" DEFAULT SUBSTRING("md5"(("random"())::"text") FROM 1 FOR 8) NOT NULL,
    "password" "text"
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects_models" (
    "project_id" "uuid" NOT NULL,
    "model_id" "uuid" NOT NULL,
    "client_selection" "text" DEFAULT 'pending'::"text" NOT NULL,
    "client_selection_date" timestamp with time zone
);


ALTER TABLE "public"."projects_models" OWNER TO "postgres";


ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_national_id_key" UNIQUE ("national_id");



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects_models"
    ADD CONSTRAINT "projects_models_pkey" PRIMARY KEY ("project_id", "model_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_public_id_key" UNIQUE ("public_id");



CREATE INDEX "idx_models_cover_path" ON "public"."models" USING "btree" ("cover_path");



CREATE INDEX "models_fts_search_idx" ON "public"."models" USING "gin" ("fts_search_vector");



CREATE OR REPLACE TRIGGER "on_model_insert_or_update" BEFORE INSERT OR UPDATE ON "public"."models" FOR EACH ROW EXECUTE FUNCTION "public"."update_profile_completeness"();



CREATE OR REPLACE TRIGGER "on_model_search_update" BEFORE INSERT OR UPDATE ON "public"."models" FOR EACH ROW EXECUTE FUNCTION "public"."update_model_fts_vector"();



ALTER TABLE ONLY "public"."projects_models"
    ADD CONSTRAINT "fk_projects_models_model" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects_models"
    ADD CONSTRAINT "fk_projects_models_project" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects_models"
    ADD CONSTRAINT "projects_models_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow admin delete on models" ON "public"."models" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow admin delete on projects" ON "public"."projects" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow admin insert on models" ON "public"."models" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow admin insert on projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow admin to link models to projects" ON "public"."projects_models" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "projects_models"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Allow admin to unlink models from projects" ON "public"."projects_models" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "projects_models"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Allow admin to update model selection" ON "public"."projects_models" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Allow admin update on models" ON "public"."models" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow admin update on projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow anon to set project in-review" ON "public"."projects" FOR UPDATE TO "anon" USING (("status" = 'sent'::"text")) WITH CHECK (("status" = 'in-review'::"text"));



CREATE POLICY "Allow public read-only access to models" ON "public"."models" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow public read-only access to project-models" ON "public"."projects_models" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow public read-only access to projects" ON "public"."projects" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Permitir actualización (UPDATE) a usuarios autenticados" ON "public"."models" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir borrado (DELETE) a usuarios autenticados" ON "public"."models" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir creación (INSERT) a usuarios autenticados" ON "public"."models" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects_models" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";









SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;













































SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;








































































SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;




































GRANT ALL ON FUNCTION "public"."calculate_profile_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_profile_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_profile_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."client_completes_project"("project_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."client_completes_project"("project_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."client_completes_project"("project_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_files_in_storage"("bucket_name" "text", "folder_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."count_files_in_storage"("bucket_name" "text", "folder_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_files_in_storage"("bucket_name" "text", "folder_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_model_report"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_model_report"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_model_report"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_model_fts_vector"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_model_fts_vector"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_model_fts_vector"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_model_profile_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_model_profile_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_model_profile_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_completeness"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_completeness"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_completeness"() TO "service_role";


















GRANT ALL ON TABLE "public"."models" TO "anon";
GRANT ALL ON TABLE "public"."models" TO "authenticated";
GRANT ALL ON TABLE "public"."models" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."projects_models" TO "anon";
GRANT ALL ON TABLE "public"."projects_models" TO "authenticated";
GRANT ALL ON TABLE "public"."projects_models" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;

  create policy "Allow authenticated delete"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'Book_Completo_iZ_Management'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Allow authenticated insert"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'Book_Completo_iZ_Management'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Allow authenticated update"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'Book_Completo_iZ_Management'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Allow public read access to Book_Completo_iZ_Management"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'Book_Completo_iZ_Management'::text));



