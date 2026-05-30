-- ============================================================================
-- Migration 002 — Row Level Security (RLS) policies
-- Active RLS sur toutes les tables publiques et crée les policies par rôle.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Activation RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_links     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles     ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE events
-- Lecture publique des événements publiés / écriture admin uniquement.
-- ============================================================================
CREATE POLICY events_public_select
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY events_admin_all
  ON public.events FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- TABLE ticket_types
-- Lecture publique pour types actifs d'événements publiés.
-- ============================================================================
CREATE POLICY ticket_types_public_select
  ON public.ticket_types FOR SELECT
  TO anon, authenticated
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = ticket_types.event_id AND e.status = 'published'
    )
  );

CREATE POLICY ticket_types_admin_all
  ON public.ticket_types FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- TABLE bookings
-- INSERT public autorisé (création réservation côté Edge Function).
-- SELECT uniquement par admin (la consultation par référence passe par Edge Function).
-- ============================================================================
CREATE POLICY bookings_public_insert
  ON public.bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending' AND payment_status = 'pending');

CREATE POLICY bookings_admin_all
  ON public.bookings FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- TABLE participants
-- INSERT public (lié à création booking). Lecture/maj admin uniquement.
-- ============================================================================
CREATE POLICY participants_public_insert
  ON public.participants FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

CREATE POLICY participants_admin_all
  ON public.participants FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- TABLE tickets
-- Aucune lecture/écriture publique : tout passe par Edge Functions (Service Role).
-- Admin a accès complet.
-- ============================================================================
CREATE POLICY tickets_admin_all
  ON public.tickets FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- TABLE feedback_links
-- Lecture publique par token (Edge Function), gestion admin complète.
-- ============================================================================
CREATE POLICY feedback_links_admin_all
  ON public.feedback_links FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- TABLE feedback_responses
-- INSERT public via Edge Function (validation token).
-- SELECT et modération admin uniquement.
-- ============================================================================
CREATE POLICY feedback_responses_admin_all
  ON public.feedback_responses FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- TABLE audit_logs
-- Lecture admin uniquement. Écriture via Service Role (Edge Functions).
-- ============================================================================
CREATE POLICY audit_logs_admin_select
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- TABLE admin_profiles
-- Chaque admin lit son propre profil. Super-admin peut tout gérer.
-- ============================================================================
CREATE POLICY admin_profiles_self_select
  ON public.admin_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY admin_profiles_super_admin_all
  ON public.admin_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
    )
  );
