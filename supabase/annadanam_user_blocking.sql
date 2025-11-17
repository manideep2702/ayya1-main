-- Annadanam User Blocking System
-- Run this in Supabase SQL editor
-- Tracks users who miss consecutive bookings and blocks them automatically

-- Table to track blocked users
CREATE TABLE IF NOT EXISTS public."Annadanam-Blocked-Users" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  blocked_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz NOT NULL, -- 7 days from blocked_at by default
  reason text NOT NULL DEFAULT 'Missed 2 consecutive bookings',
  missed_booking_ids uuid[] NOT NULL DEFAULT '{}', -- Array of booking IDs that were missed
  consecutive_misses integer NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unblocked')),
  unblocked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  unblocked_at timestamptz,
  notes text
);

CREATE INDEX IF NOT EXISTS blocked_users_user_id_idx ON public."Annadanam-Blocked-Users"(user_id);
CREATE INDEX IF NOT EXISTS blocked_users_status_idx ON public."Annadanam-Blocked-Users"(status);
CREATE INDEX IF NOT EXISTS blocked_users_blocked_until_idx ON public."Annadanam-Blocked-Users"(blocked_until);

ALTER TABLE public."Annadanam-Blocked-Users" ENABLE ROW LEVEL SECURITY;

-- Users can view their own block status
DO $$
BEGIN
  CREATE POLICY blocked_users_select_own ON public."Annadanam-Blocked-Users"
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Service role can manage everything
DO $$
BEGIN
  CREATE POLICY blocked_users_service_all ON public."Annadanam-Blocked-Users"
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Function to check if a user is currently blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public."Annadanam-Blocked-Users"
    WHERE user_id = p_user_id
      AND status = 'active'
      AND blocked_until > now()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get user's block details
CREATE OR REPLACE FUNCTION public.get_user_block_info(p_user_id uuid)
RETURNS TABLE (
  is_blocked boolean,
  blocked_until timestamptz,
  reason text,
  days_remaining integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS is_blocked,
    b.blocked_until,
    b.reason,
    GREATEST(0, EXTRACT(DAY FROM (b.blocked_until - now()))::integer) AS days_remaining
  FROM public."Annadanam-Blocked-Users" b
  WHERE b.user_id = p_user_id
    AND b.status = 'active'
    AND b.blocked_until > now()
  ORDER BY b.blocked_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::timestamptz, NULL::text, 0;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check for consecutive no-shows and auto-block users
-- Call this after attendance marking or periodically
CREATE OR REPLACE FUNCTION public.check_and_block_no_show_users()
RETURNS TABLE (
  blocked_user_id uuid,
  blocked_email text,
  missed_count integer
) AS $$
DECLARE
  enforcement_start_date date := '2025-11-15';
  user_rec RECORD;
  recent_bookings RECORD;
  consecutive_misses integer;
  missed_ids uuid[];
BEGIN
  -- Only enforce from Nov 15, 2025 onwards
  IF CURRENT_DATE < enforcement_start_date THEN
    RETURN;
  END IF;

  -- Find users with recent bookings
  FOR user_rec IN (
    SELECT DISTINCT b.user_id, b.email
    FROM public."Bookings" b
    WHERE b.user_id IS NOT NULL
      AND b.status = 'confirmed'
      AND b.date >= enforcement_start_date
      AND b.date < CURRENT_DATE -- Only check past bookings
    ORDER BY b.user_id
  )
  LOOP
    -- Get last 3 bookings for this user ordered by date DESC
    consecutive_misses := 0;
    missed_ids := ARRAY[]::uuid[];
    
    FOR recent_bookings IN (
      SELECT b.id, b.date, b.session, b.attended_at
      FROM public."Bookings" b
      WHERE b.user_id = user_rec.user_id
        AND b.status = 'confirmed'
        AND b.date >= enforcement_start_date
        AND b.date < CURRENT_DATE
      ORDER BY b.date DESC, b.created_at DESC
      LIMIT 3
    )
    LOOP
      -- Check if session end time has passed
      -- If attended_at is NULL after session ended, it's a no-show
      IF recent_bookings.attended_at IS NULL THEN
        consecutive_misses := consecutive_misses + 1;
        missed_ids := array_append(missed_ids, recent_bookings.id);
      ELSE
        -- Attended - break the streak
        EXIT;
      END IF;
    END LOOP;
    
    -- If 2 or more consecutive misses, block the user
    IF consecutive_misses >= 2 THEN
      -- Check if not already blocked
      IF NOT EXISTS (
        SELECT 1 
        FROM public."Annadanam-Blocked-Users"
        WHERE user_id = user_rec.user_id
          AND status = 'active'
          AND blocked_until > now()
      ) THEN
        -- Block for 7 days
        INSERT INTO public."Annadanam-Blocked-Users" (
          user_id,
          email,
          blocked_at,
          blocked_until,
          reason,
          missed_booking_ids,
          consecutive_misses
        ) VALUES (
          user_rec.user_id,
          user_rec.email,
          now(),
          now() + interval '7 days',
          'Missed ' || consecutive_misses || ' consecutive bookings',
          missed_ids,
          consecutive_misses
        );
        
        blocked_user_id := user_rec.user_id;
        blocked_email := user_rec.email;
        missed_count := consecutive_misses;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function for admins to manually unblock a user
CREATE OR REPLACE FUNCTION public.unblock_user(
  p_user_id uuid,
  p_admin_user_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public."Annadanam-Blocked-Users"
  SET 
    status = 'unblocked',
    unblocked_by = p_admin_user_id,
    unblocked_at = now(),
    notes = COALESCE(p_notes, notes)
  WHERE user_id = p_user_id
    AND status = 'active'
    AND blocked_until > now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to list all blocked users (for admin panel)
CREATE OR REPLACE FUNCTION public.list_blocked_users()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  blocked_at timestamptz,
  blocked_until timestamptz,
  reason text,
  consecutive_misses integer,
  status text,
  days_remaining integer,
  unblocked_by uuid,
  unblocked_at timestamptz,
  notes text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    b.email,
    b.blocked_at,
    b.blocked_until,
    b.reason,
    b.consecutive_misses,
    b.status,
    GREATEST(0, EXTRACT(DAY FROM (b.blocked_until - now()))::integer) AS days_remaining,
    b.unblocked_by,
    b.unblocked_at,
    b.notes
  FROM public."Annadanam-Blocked-Users" b
  ORDER BY 
    CASE WHEN b.status = 'active' THEN 0 ELSE 1 END,
    b.blocked_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Automated trigger to check no-shows after attendance is marked
-- This runs the blocking check whenever attended_at is updated
CREATE OR REPLACE FUNCTION public.trigger_check_no_shows()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if we're past the booking date
  IF NEW.date < CURRENT_DATE AND NEW.attended_at IS NULL THEN
    PERFORM public.check_and_block_no_show_users();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on Bookings table (only if it doesn't exist)
DO $$
BEGIN
  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS check_no_shows_trigger ON public."Bookings";
  
  -- Create new trigger
  CREATE TRIGGER check_no_shows_trigger
    AFTER UPDATE OF attended_at ON public."Bookings"
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_no_shows();
END $$;

-- Daily scheduled check (you can set this up in Supabase Edge Functions or pg_cron)
-- For now, admins can manually call: SELECT * FROM public.check_and_block_no_show_users();

COMMENT ON TABLE public."Annadanam-Blocked-Users" IS 'Tracks users blocked from booking due to consecutive no-shows. Enforced from Nov 15, 2025.';
COMMENT ON FUNCTION public.is_user_blocked(uuid) IS 'Returns true if the user is currently blocked from booking';
COMMENT ON FUNCTION public.get_user_block_info(uuid) IS 'Returns detailed block information for a user';
COMMENT ON FUNCTION public.check_and_block_no_show_users() IS 'Checks all users for consecutive no-shows and blocks them automatically';
COMMENT ON FUNCTION public.unblock_user(uuid, uuid, text) IS 'Allows admins to manually unblock a user';
COMMENT ON FUNCTION public.list_blocked_users() IS 'Lists all blocked users for admin panel';

