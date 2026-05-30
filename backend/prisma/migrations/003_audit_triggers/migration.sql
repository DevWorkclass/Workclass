-- ============================================================================
-- Migration 003 — Triggers d'audit sur tables sensibles
-- Log automatique des INSERT / UPDATE / DELETE dans audit_logs.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Fonction générique d'audit (capture l'action, la ressource et l'acteur)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resource_id UUID;
  v_action      TEXT;
  v_actor_id    UUID;
BEGIN
  v_action := lower(TG_OP);

  IF TG_OP = 'DELETE' THEN
    v_resource_id := OLD.id;
  ELSE
    v_resource_id := NEW.id;
  END IF;

  -- Tente de récupérer auth.uid() (NULL si appelé hors session auth)
  BEGIN
    v_actor_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_actor_id := NULL;
  END;

  INSERT INTO public.audit_logs (
    actor_id,
    actor_role,
    action,
    resource_type,
    resource_id,
    result,
    metadata
  )
  VALUES (
    v_actor_id,
    NULLIF(current_setting('request.jwt.claims', TRUE), '')::JSONB ->> 'role',
    v_action,
    TG_TABLE_NAME,
    v_resource_id,
    'success',
    jsonb_build_object('schema', TG_TABLE_SCHEMA)
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_trigger_fn IS
  'Fonction trigger générique pour audit_logs. À attacher sur les tables sensibles.';

-- ----------------------------------------------------------------------------
-- Attachement des triggers d'audit sur tables sensibles
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_audit_bookings
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER trg_audit_tickets
  AFTER INSERT OR UPDATE OR DELETE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER trg_audit_participants
  AFTER INSERT OR UPDATE OR DELETE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER trg_audit_events
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER trg_audit_ticket_types
  AFTER INSERT OR UPDATE OR DELETE ON public.ticket_types
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER trg_audit_feedback_responses
  AFTER INSERT OR UPDATE OR DELETE ON public.feedback_responses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
