-- ============================================================================
-- Migration 001 — Schéma initial Work Class Gabon v1
-- Crée toutes les tables métier avec contraintes strictes (CHECK, FK, UNIQUE).
-- ============================================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";          -- emails insensibles à la casse

-- ----------------------------------------------------------------------------
-- Fonction utilitaire : mise à jour automatique de updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- TABLE : events — Événements professionnels
-- ============================================================================
CREATE TABLE public.events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT NOT NULL,
  location        TEXT NOT NULL,
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ NOT NULL,
  cover_image     TEXT,
  program         JSONB DEFAULT '[]'::jsonb,
  speakers        JSONB DEFAULT '[]'::jsonb,
  status          TEXT NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT events_status_check
    CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT events_dates_check
    CHECK (end_date >= start_date)
);

CREATE INDEX idx_events_status     ON public.events (status);
CREATE INDEX idx_events_start_date ON public.events (start_date);
CREATE INDEX idx_events_slug       ON public.events (slug);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE : ticket_types — Types de billets par événement
-- ============================================================================
CREATE TABLE public.ticket_types (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(12, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'XAF',
  quota           INTEGER NOT NULL,
  sold_count      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ticket_types_price_check    CHECK (price >= 0),
  CONSTRAINT ticket_types_quota_check    CHECK (quota >= 0),
  CONSTRAINT ticket_types_sold_check     CHECK (sold_count >= 0 AND sold_count <= quota),
  CONSTRAINT ticket_types_currency_check CHECK (char_length(currency) = 3)
);

CREATE INDEX idx_ticket_types_event_id ON public.ticket_types (event_id);
CREATE INDEX idx_ticket_types_active   ON public.ticket_types (is_active);

CREATE TRIGGER trg_ticket_types_updated_at
  BEFORE UPDATE ON public.ticket_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE : bookings — Réservations
-- ============================================================================
CREATE TABLE public.bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  ticket_type_id  UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
  reference       TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending',
  payment_status  TEXT NOT NULL DEFAULT 'pending',
  total_amount    NUMERIC(12, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'XAF',
  options         JSONB DEFAULT '[]'::jsonb,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT bookings_reference_format_check
    CHECK (reference ~ '^WCG-RES-[A-Z0-9]{6}$'),
  CONSTRAINT bookings_status_check
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  CONSTRAINT bookings_payment_status_check
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  CONSTRAINT bookings_amount_check
    CHECK (total_amount >= 0)
);

CREATE INDEX idx_bookings_event_id        ON public.bookings (event_id);
CREATE INDEX idx_bookings_ticket_type_id  ON public.bookings (ticket_type_id);
CREATE INDEX idx_bookings_reference       ON public.bookings (reference);
CREATE INDEX idx_bookings_status          ON public.bookings (status);
CREATE INDEX idx_bookings_payment_status  ON public.bookings (payment_status);
CREATE INDEX idx_bookings_created_at      ON public.bookings (created_at DESC);

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE : participants — Données personnelles (RGPD-like)
-- Une réservation = un participant principal (v1).
-- ============================================================================
CREATE TABLE public.participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           CITEXT NOT NULL,
  phone           TEXT NOT NULL,
  company         TEXT,
  position        TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb,
  consent_given   BOOLEAN NOT NULL DEFAULT FALSE,
  consent_at      TIMESTAMPTZ,
  anonymized_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT participants_email_check
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT participants_phone_check
    CHECK (phone ~ '^\+?\d{8,15}$')
);

CREATE INDEX idx_participants_booking_id ON public.participants (booking_id);
CREATE INDEX idx_participants_email      ON public.participants (email);

CREATE TRIGGER trg_participants_updated_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE : tickets — Billets générés (numéro unique, QR signé)
-- ============================================================================
CREATE TABLE public.tickets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  ticket_number       TEXT NOT NULL UNIQUE,
  qr_code             TEXT NOT NULL,
  pdf_url             TEXT,
  scanned_at          TIMESTAMPTZ,
  scanned_by          UUID,
  certificate_sent    BOOLEAN NOT NULL DEFAULT FALSE,
  certificate_url     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tickets_ticket_number_format_check
    CHECK (ticket_number ~ '^WCG-\d{4}-\d{6}$')
);

CREATE INDEX idx_tickets_booking_id    ON public.tickets (booking_id);
CREATE INDEX idx_tickets_ticket_number ON public.tickets (ticket_number);
CREATE INDEX idx_tickets_scanned_at    ON public.tickets (scanned_at);

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE : feedback_links — Liens privés uniques pour collecte d'avis
-- ============================================================================
CREATE TABLE public.feedback_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  booking_id      UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  token           TEXT NOT NULL UNIQUE,
  used            BOOLEAN NOT NULL DEFAULT FALSE,
  used_at         TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT feedback_links_expires_check
    CHECK (expires_at > created_at)
);

CREATE INDEX idx_feedback_links_token      ON public.feedback_links (token);
CREATE INDEX idx_feedback_links_event_id   ON public.feedback_links (event_id);
CREATE INDEX idx_feedback_links_booking_id ON public.feedback_links (booking_id);
CREATE INDEX idx_feedback_links_used       ON public.feedback_links (used);

-- ============================================================================
-- TABLE : feedback_responses — Réponses aux formulaires d'avis
-- ============================================================================
CREATE TABLE public.feedback_responses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_link_id    UUID NOT NULL UNIQUE REFERENCES public.feedback_links(id) ON DELETE CASCADE,
  event_id            UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ratings             JSONB NOT NULL,
  comment             TEXT,
  moderation_status   TEXT NOT NULL DEFAULT 'pending',
  moderated_at        TIMESTAMPTZ,
  moderated_by        UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT feedback_responses_moderation_check
    CHECK (moderation_status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_feedback_responses_event_id    ON public.feedback_responses (event_id);
CREATE INDEX idx_feedback_responses_moderation  ON public.feedback_responses (moderation_status);

CREATE TRIGGER trg_feedback_responses_updated_at
  BEFORE UPDATE ON public.feedback_responses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE : audit_logs — Traçabilité obligatoire (qui, quand, quoi)
-- IP anonymisée (préfixe seulement), pas de données personnelles en clair.
-- ============================================================================
CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID,
  actor_role      TEXT,
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     UUID,
  result          TEXT NOT NULL,
  ip_prefix       TEXT,
  user_agent      TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT audit_logs_result_check
    CHECK (result IN ('success', 'failure', 'denied'))
);

CREATE INDEX idx_audit_logs_actor_id      ON public.audit_logs (actor_id);
CREATE INDEX idx_audit_logs_resource      ON public.audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_logs_action        ON public.audit_logs (action);
CREATE INDEX idx_audit_logs_created_at    ON public.audit_logs (created_at DESC);

-- ============================================================================
-- TABLE : admin_profiles — Profils administrateurs (lié à auth.users)
-- ============================================================================
CREATE TABLE public.admin_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           CITEXT NOT NULL UNIQUE,
  first_name      TEXT,
  last_name       TEXT,
  role            TEXT NOT NULL DEFAULT 'admin',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT admin_profiles_role_check
    CHECK (role IN ('admin', 'super_admin'))
);

CREATE INDEX idx_admin_profiles_role    ON public.admin_profiles (role);
CREATE INDEX idx_admin_profiles_active  ON public.admin_profiles (is_active);

CREATE TRIGGER trg_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- Fonction utilitaire : vérifier qu'un user est admin actif
-- Utilisée dans les policies RLS (migration 002).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = user_id AND is_active = TRUE
  );
$$;

COMMENT ON FUNCTION public.is_admin IS
  'Retourne TRUE si l''utilisateur est un admin actif. Utilisée dans les policies RLS.';
