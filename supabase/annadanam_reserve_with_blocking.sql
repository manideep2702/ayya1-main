-- Update reserve_annadanam_by_date function to check for blocked users
-- Run this AFTER annadanam_user_blocking.sql

CREATE OR REPLACE FUNCTION public.reserve_annadanam_by_date(
  d date,
  s text,
  user_id uuid,
  name text,
  email text,
  phone text,
  qty integer
)
RETURNS public."Bookings" AS $$
DECLARE
  slot_rec RECORD;
  booked int;
  new_row public."Bookings";
  start_local time;
  end_local time;
  start_at timestamptz;
  last_start timestamptz;
  group_total int := 0;
  is_afternoon boolean := false;
  now_ist timestamp := (now() AT TIME ZONE 'Asia/Kolkata');
  now_ist_time time := (now() AT TIME ZONE 'Asia/Kolkata')::time;
  block_info RECORD;
BEGIN
  -- **NEW**: Check if user is blocked (enforced from Nov 15, 2025)
  IF d >= DATE '2025-11-15' THEN
    SELECT * INTO block_info 
    FROM public.get_user_block_info(user_id) 
    LIMIT 1;
    
    IF block_info.is_blocked THEN
      RAISE EXCEPTION 'You are blocked from booking until %. Reason: %. Days remaining: %', 
        block_info.blocked_until::date,
        block_info.reason,
        block_info.days_remaining
      USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Enforce season window
  IF NOT (d BETWEEN DATE '2025-11-05' AND DATE '2026-01-07'
          OR d = DATE '2025-10-31'
          OR d = DATE '2025-11-04') THEN
    RAISE EXCEPTION 'Date % is outside the allowed season', d;
  END IF;

  -- Enforce single-person bookings
  IF qty <> 1 THEN
    RAISE EXCEPTION 'Quantity must be exactly 1';
  END IF;

  -- Check if user already has a booking for this date/session
  IF EXISTS (
    SELECT 1 FROM public."Bookings"
    WHERE date = d AND session = s AND user_id = reserve_annadanam_by_date.user_id
      AND status = 'confirmed'
  ) THEN
    RAISE EXCEPTION 'You already have a booking for % - %', d, s;
  END IF;

  -- Map session label to time window
  CASE s
    WHEN '1:00 PM - 1:30 PM'  THEN start_local := '13:00'; end_local := '13:30';
    WHEN '1:30 PM - 2:00 PM'  THEN start_local := '13:30'; end_local := '14:00';
    WHEN '2:00 PM - 2:30 PM'  THEN start_local := '14:00'; end_local := '14:30';
    WHEN '2:30 PM - 3:00 PM'  THEN start_local := '14:30'; end_local := '15:00';
    WHEN '8:30 PM - 9:00 PM'  THEN start_local := '20:30'; end_local := '21:00';
    WHEN '9:00 PM - 9:30 PM'  THEN start_local := '21:00'; end_local := '21:30';
    WHEN '9:30 PM - 10:00 PM' THEN start_local := '21:30'; end_local := '22:00';
    ELSE RAISE EXCEPTION 'Invalid session: %', s;
  END CASE;

  is_afternoon := (s LIKE '1:%' OR s LIKE '2:%');
  start_at := (d + start_local)::timestamptz;

  -- Same-day booking only
  IF d <> CURRENT_DATE THEN
    RAISE EXCEPTION 'Same-day booking only';
  END IF;

  -- Check booking window
  IF is_afternoon THEN
    IF now_ist_time < '05:00'::time OR now_ist_time > '11:30'::time THEN
      RAISE EXCEPTION 'Afternoon booking window: 5:00 AM – 11:30 AM IST';
    END IF;
  ELSE
    IF now_ist_time < '15:00'::time OR now_ist_time > '19:30'::time THEN
      RAISE EXCEPTION 'Evening booking window: 3:00 PM – 7:30 PM IST';
    END IF;
  END IF;

  -- Close booking at session start
  IF now_ist >= (d + start_local) THEN
    RAISE EXCEPTION 'Booking closed (session started)';
  END IF;

  -- Check group-level capacity (150 per group)
  SELECT COUNT(*) INTO group_total
  FROM public."Bookings" b
  WHERE b.date = d
    AND b.status = 'confirmed'
    AND CASE 
      WHEN is_afternoon THEN (b.session LIKE '1:%' OR b.session LIKE '2:%')
      ELSE (b.session LIKE '8:%' OR b.session LIKE '9:%' OR b.session = '10:00 PM - 10:30 PM')
    END;

  IF group_total >= 150 THEN
    RAISE EXCEPTION 'Session group full (max 150)';
  END IF;

  -- Check slot-level capacity (dynamic or default 50)
  SELECT s.capacity, COALESCE(c.booked_count, 0)
  INTO slot_rec
  FROM public."Slots" s
  LEFT JOIN public.slot_booked_counts c ON c.date = s.date AND c.session = s.session
  WHERE s.date = d AND s.session = reserve_annadanam_by_date.s;

  IF NOT FOUND THEN
    slot_rec.capacity := 50;
    booked := 0;
  ELSE
    booked := slot_rec.booked_count;
  END IF;

  IF booked >= slot_rec.capacity THEN
    RAISE EXCEPTION 'Slot full';
  END IF;

  -- Insert booking
  INSERT INTO public."Bookings" (date, session, user_id, name, email, phone, qty)
  VALUES (d, s, user_id, name, email, phone, qty)
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$ LANGUAGE plpgsql;

-- Also update dev_insert_annadanam_booking to respect blocking
CREATE OR REPLACE FUNCTION public.dev_insert_annadanam_booking(
  d date,
  s text,
  p_user_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_qty integer,
  dev_time text
)
RETURNS public."Bookings" AS $$
DECLARE
  slot_rec RECORD;
  booked int;
  new_row public."Bookings";
  start_local time;
  end_local time;
  start_at timestamptz;
  last_start timestamptz;
  group_total int := 0;
  is_afternoon boolean := false;
  simulated_ist_time time;
  simulated_ist timestamp;
  block_info RECORD;
BEGIN
  -- **NEW**: Check if user is blocked (enforced from Nov 15, 2025)
  IF d >= DATE '2025-11-15' THEN
    SELECT * INTO block_info 
    FROM public.get_user_block_info(p_user_id) 
    LIMIT 1;
    
    IF block_info.is_blocked THEN
      RAISE EXCEPTION 'User is blocked from booking until %. Reason: %', 
        block_info.blocked_until::date,
        block_info.reason
      USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Parse dev_time (HH:MM format)
  BEGIN
    simulated_ist_time := dev_time::time;
    simulated_ist := (d + simulated_ist_time);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid dev_time format: %. Use HH:MM (e.g. "10:00")', dev_time;
  END;

  -- Enforce season window
  IF NOT (d BETWEEN DATE '2025-11-05' AND DATE '2026-01-07'
          OR d = DATE '2025-10-31'
          OR d = DATE '2025-11-04') THEN
    RAISE EXCEPTION 'Date % is outside the allowed season', d;
  END IF;

  -- Enforce single-person bookings
  IF p_qty <> 1 THEN
    RAISE EXCEPTION 'Quantity must be exactly 1';
  END IF;

  -- Check if user already has a booking
  IF EXISTS (
    SELECT 1 FROM public."Bookings"
    WHERE date = d AND session = s AND user_id = p_user_id
      AND status = 'confirmed'
  ) THEN
    RAISE EXCEPTION 'User already has a booking for % - %', d, s;
  END IF;

  -- Map session label to time window
  CASE s
    WHEN '1:00 PM - 1:30 PM'  THEN start_local := '13:00'; end_local := '13:30';
    WHEN '1:30 PM - 2:00 PM'  THEN start_local := '13:30'; end_local := '14:00';
    WHEN '2:00 PM - 2:30 PM'  THEN start_local := '14:00'; end_local := '14:30';
    WHEN '2:30 PM - 3:00 PM'  THEN start_local := '14:30'; end_local := '15:00';
    WHEN '8:30 PM - 9:00 PM'  THEN start_local := '20:30'; end_local := '21:00';
    WHEN '9:00 PM - 9:30 PM'  THEN start_local := '21:00'; end_local := '21:30';
    WHEN '9:30 PM - 10:00 PM' THEN start_local := '21:30'; end_local := '22:00';
    ELSE RAISE EXCEPTION 'Invalid session: %', s;
  END CASE;

  is_afternoon := (s LIKE '1:%' OR s LIKE '2:%');
  start_at := (d + start_local)::timestamptz;

  -- Dev mode: use simulated time for window checks
  IF is_afternoon THEN
    IF simulated_ist_time < '05:00'::time OR simulated_ist_time > '11:30'::time THEN
      RAISE EXCEPTION '[DEV] Afternoon booking window: 5:00 AM – 11:30 AM IST (simulated: %)', simulated_ist_time;
    END IF;
  ELSE
    IF simulated_ist_time < '15:00'::time OR simulated_ist_time > '19:30'::time THEN
      RAISE EXCEPTION '[DEV] Evening booking window: 3:00 PM – 7:30 PM IST (simulated: %)', simulated_ist_time;
    END IF;
  END IF;

  -- Check group-level capacity
  SELECT COUNT(*) INTO group_total
  FROM public."Bookings" b
  WHERE b.date = d
    AND b.status = 'confirmed'
    AND CASE 
      WHEN is_afternoon THEN (b.session LIKE '1:%' OR b.session LIKE '2:%')
      ELSE (b.session LIKE '8:%' OR b.session LIKE '9:%')
    END;

  IF group_total >= 150 THEN
    RAISE EXCEPTION 'Session group full (max 150)';
  END IF;

  -- Check slot-level capacity
  SELECT s.capacity, COALESCE(c.booked_count, 0)
  INTO slot_rec
  FROM public."Slots" s
  LEFT JOIN public.slot_booked_counts c ON c.date = s.date AND c.session = s.session
  WHERE s.date = d AND s.session = dev_insert_annadanam_booking.s;

  IF NOT FOUND THEN
    slot_rec.capacity := 50;
    booked := 0;
  ELSE
    booked := slot_rec.booked_count;
  END IF;

  IF booked >= slot_rec.capacity THEN
    RAISE EXCEPTION 'Slot full';
  END IF;

  -- Insert booking
  INSERT INTO public."Bookings" (date, session, user_id, name, email, phone, qty)
  VALUES (d, s, p_user_id, p_name, p_email, p_phone, p_qty)
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.reserve_annadanam_by_date IS 'Books an Annadanam slot with automatic blocking check for consecutive no-shows';
COMMENT ON FUNCTION public.dev_insert_annadanam_booking IS 'Dev version with time simulation that also checks for blocked users';

