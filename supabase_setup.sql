-- ============================================================================
-- 🛡️ OKUL PLANLAMA PLATFORMU - SAVUNMACI SUPABASE ŞEMASI (supabase_setup.sql)
-- Supabase Dashboard -> SQL Editor ekranına yapıştırıp "Run" butonuna basın.
-- ============================================================================

-- 1. Gerekli Uzantılar
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Kriptografik Olarak Güvenli, Okunabilir Paylaşım Kodu Üretici
CREATE OR REPLACE FUNCTION public.generate_safe_share_code(prefix text DEFAULT 'okul')
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  clean_prefix text;
  random_suffix text;
BEGIN
  clean_prefix := lower(regexp_replace(coalesce(prefix, 'okul'), '[^a-zA-Z0-9]+', '-', 'g'));
  clean_prefix := trim(both '-' from substring(clean_prefix from 1 for 18));
  IF clean_prefix = '' THEN
    clean_prefix := 'okul';
  END IF;
  -- 6 karakterlik kriptografik rastgele hex eki
  random_suffix := encode(gen_random_bytes(3), 'hex');
  RETURN clean_prefix || '-' || random_suffix;
END;
$$;

-- 3. Ana Tablo: schools (Tek Satır / JSONB + Optimistic Locking Version)
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name text NOT NULL DEFAULT 'Okul Ders Programı',
  share_code text NOT NULL UNIQUE DEFAULT public.generate_safe_share_code('okul'),
  app_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  kelebek_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_mobile jsonb NOT NULL DEFAULT '{}'::jsonb,
  version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schools_owner_unique UNIQUE (owner_id),
  -- 🛡️ Boyut koruması: 10MB üstü JSONB payloadlarını reddet (DoS koruması)
  CONSTRAINT app_state_max_size CHECK (pg_column_size(app_state) <= 10485760),
  CONSTRAINT kelebek_state_max_size CHECK (pg_column_size(kelebek_state) <= 10485760)
);

CREATE INDEX IF NOT EXISTS idx_schools_owner_id ON public.schools(owner_id);
CREATE INDEX IF NOT EXISTS idx_schools_share_code ON public.schools(share_code);

-- 4. Hassas Verileri Ayıklayıp published_mobile Üreten Güvenlik Trigger'ı
-- Öğretmenlerin mobil görünümde ihtiyaç duyduğu veriler DIŞINDAKİ hiçbir veriyi
-- (öğrenci listesi, kelebek planı, öğretmen kapalı saat mazeretleri vb.) dışarı sızdırmaz.
CREATE OR REPLACE FUNCTION public.sync_published_mobile_payload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sanitized_teachers jsonb := '[]'::jsonb;
  sanitized_classrooms jsonb := '[]'::jsonb;
BEGIN
  -- Sadece öğretmen id, isim ve branş bilgisini al (unavailable / kısıtlar SIZDIRILMAZ)
  IF jsonb_typeof(NEW.app_state->'teachers') = 'array' THEN
    SELECT coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', t->>'id',
          'name', t->>'name',
          'branch', coalesce(t->>'branch', '')
        )
      ),
      '[]'::jsonb
    )
    INTO sanitized_teachers
    FROM jsonb_array_elements(NEW.app_state->'teachers') AS t;
  END IF;

  -- Sadece sınıf id, isim ve ders yükü özetini al
  IF jsonb_typeof(NEW.app_state->'classrooms') = 'array' THEN
    SELECT coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', c->>'id',
          'name', c->>'name',
          'courses', coalesce(c->'courses', '[]'::jsonb)
        )
      ),
      '[]'::jsonb
    )
    INTO sanitized_classrooms
    FROM jsonb_array_elements(NEW.app_state->'classrooms') AS c;
  END IF;

  -- Okul adını settings içinden senkronize et
  IF coalesce(NEW.app_state #>> '{settings,schoolName}', '') <> '' THEN
    NEW.school_name := left(NEW.app_state #>> '{settings,schoolName}', 150);
  END IF;

  -- Sterilize edilmiş mobil paketi otomatik oluştur:
  NEW.published_mobile := jsonb_build_object(
    'schoolName', NEW.school_name,
    'settings', jsonb_build_object(
      'schoolName', NEW.school_name,
      'days', coalesce(NEW.app_state #> '{settings,days}', '["Pazartesi","Salı","Çarşamba","Perşembe","Cuma"]'::jsonb),
      'periodsPerDay', coalesce(NEW.app_state #> '{settings,periodsPerDay}', '8'::jsonb),
      'lunchAfter', coalesce(NEW.app_state #> '{settings,lunchAfter}', '4'::jsonb)
    ),
    'teachers', sanitized_teachers,
    'classrooms', sanitized_classrooms,
    'timetable', coalesce(NEW.app_state->'timetable', '{}'::jsonb),
    'dykSettings', coalesce(NEW.app_state->'dykSettings', '{}'::jsonb),
    'dykGroups', coalesce(NEW.app_state->'dykGroups', '[]'::jsonb),
    'dykSchedule', coalesce(NEW.app_state->'dykSchedule', 'null'::jsonb),
    'examSettings', coalesce(NEW.app_state->'examSettings', '{}'::jsonb),
    'examSchedule', coalesce(NEW.app_state->'examSchedule', 'null'::jsonb),
    'examSupervisors', coalesce(NEW.app_state->'examSupervisors', 'null'::jsonb),
    'updatedAt', to_jsonb(now())
  );

  NEW.updated_at := now();
  IF TG_OP = 'UPDATE' THEN
    NEW.version := coalesce(OLD.version, 1) + 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schools_sanitize_mobile ON public.schools;
CREATE TRIGGER trg_schools_sanitize_mobile
BEFORE INSERT OR UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.sync_published_mobile_payload();

-- 5. Row Level Security (RLS) - Sıfır Anonim Tablo Erişimi!
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schools_owner_select" ON public.schools;
DROP POLICY IF EXISTS "schools_owner_insert" ON public.schools;
DROP POLICY IF EXISTS "schools_owner_update" ON public.schools;
DROP POLICY IF EXISTS "schools_owner_delete" ON public.schools;

-- Yalnızca okulun sahibi olan idareci kendi satırını okuyabilir ve yazabilir
CREATE POLICY "schools_owner_select"
  ON public.schools FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "schools_owner_insert"
  ON public.schools FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "schools_owner_update"
  ON public.schools FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "schools_owner_delete"
  ON public.schools FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- 6. Öğretmen Mobil Görünümü İçin Güvenli RPC (Sadece published_mobile döner!)
-- Anonim kullanıcılar tabloyu sorgulayamaz, sadece share_code ile bu fonksiyonu çağırabilir.
CREATE OR REPLACE FUNCTION public.get_published_school_by_share_code(p_share_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned_code text;
  result_payload jsonb;
BEGIN
  cleaned_code := lower(trim(coalesce(p_share_code, '')));
  IF length(cleaned_code) < 4 OR length(cleaned_code) > 64 THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'school_name', s.school_name,
    'share_code', s.share_code,
    'updated_at', s.updated_at,
    'version', s.version,
    'published_mobile', s.published_mobile
  )
  INTO result_payload
  FROM public.schools s
  WHERE lower(s.share_code) = cleaned_code
  LIMIT 1;

  RETURN result_payload;
END;
$$;

-- RPC İzinleri
REVOKE ALL ON FUNCTION public.get_published_school_by_share_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_school_by_share_code(text) TO anon, authenticated;

-- 7. Paylaşım Kodunu Yenileme (İdareci eski linki iptal etmek isterse)
CREATE OR REPLACE FUNCTION public.rotate_school_share_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  s_name text;
BEGIN
  SELECT school_name INTO s_name FROM public.schools WHERE owner_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Okul kaydı bulunamadı.';
  END IF;

  new_code := public.generate_safe_share_code(s_name);
  UPDATE public.schools
  SET share_code = new_code, updated_at = now()
  WHERE owner_id = auth.uid();

  RETURN new_code;
END;
$$;

REVOKE ALL ON FUNCTION public.rotate_school_share_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rotate_school_share_code() TO authenticated;
