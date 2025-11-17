# Quick Setup Guide - Annadanam Blocking System

## 🚀 Installation Steps (5 minutes)

### Step 1: Run Database Migrations

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste **`supabase/annadanam_user_blocking.sql`** ✅
5. Click **Run** (or Cmd/Ctrl + Enter)
6. Wait for success message

7. Click **New Query** again
8. Copy and paste **`supabase/annadanam_reserve_with_blocking.sql`** ✅
9. Click **Run**
10. Wait for success message

### Step 2: Verify Installation

Run this in SQL Editor to verify:

```sql
-- Should return empty table (no errors)
SELECT * FROM "Annadanam-Blocked-Users" LIMIT 1;

-- Should return rows (functions exist)
SELECT proname FROM pg_proc 
WHERE proname IN (
  'is_user_blocked',
  'get_user_block_info', 
  'check_and_block_no_show_users',
  'unblock_user',
  'list_blocked_users'
);
```

Expected output: 5 rows showing the function names ✅

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Test the System

#### Test 1: Check Admin Panel
1. Go to `http://localhost:3000/admin`
2. Sign in as admin
3. Click **"Blocked Users"** card (red border)
4. Should see empty state: "No blocked users found" ✅

#### Test 2: Check User Experience
1. Go to `http://localhost:3000/calendar/annadanam`
2. Try to book a slot
3. Should work normally (no blocks yet) ✅

#### Test 3: Verify Note Display
1. Still on the booking page
2. Check current time (IST)
3. Should see note in correct session:
   - **5:00 AM - 11:30 AM IST**: Note in Afternoon card only
   - **3:00 PM - 7:30 PM IST**: Note in Evening card only
   - **Other times**: Might see Afternoon note ✅

## ✅ Verification Checklist

- [ ] Database migrations ran without errors
- [ ] 5 functions exist in database
- [ ] Blocked users table created
- [ ] Admin panel accessible at `/admin/annadanam/blocked`
- [ ] Booking page loads without errors
- [ ] No console errors in browser
- [ ] Time-based notes showing correctly

## 🧪 Optional: Test Blocking Flow

Want to test the actual blocking? Here's how:

### Create Test Block

```sql
-- In Supabase SQL Editor:
-- Replace 'your-user-id' with an actual user ID from auth.users

INSERT INTO "Annadanam-Blocked-Users" (
  user_id,
  email,
  blocked_at,
  blocked_until,
  reason,
  missed_booking_ids,
  consecutive_misses,
  status
) VALUES (
  'your-user-id'::uuid,
  'test@example.com',
  now(),
  now() + interval '7 days',
  'Test block - 2 consecutive misses',
  ARRAY[]::uuid[],
  2,
  'active'
);
```

Then:
1. Sign in as that test user
2. Go to booking page
3. Should see big red warning banner ✅
4. Try to book → should be blocked ✅

### Remove Test Block

```sql
-- Remove the test block
DELETE FROM "Annadanam-Blocked-Users" 
WHERE email = 'test@example.com';
```

Or use admin panel → Click "Unblock User"

## 📱 What Changed?

### For Users:
- ✅ Time-sensitive note shows in Afternoon or Evening card
- ✅ Blocked users see prominent red warning
- ✅ Cannot book while blocked
- ✅ Clear information about block duration

### For Admins:
- ✅ New "Blocked Users" button on admin dashboard
- ✅ Full management interface at `/admin/annadanam/blocked`
- ✅ Can view all blocks (active and historical)
- ✅ One-click unblock
- ✅ Manual auto-block check button

### Backend:
- ✅ Automatic blocking after 2 consecutive no-shows
- ✅ Enforced from Nov 15, 2025 onwards
- ✅ 7-day block duration
- ✅ All booking functions check for blocks
- ✅ Trigger runs automatically on attendance updates

## 🎯 Next Steps

### Immediate:
1. ✅ Verify everything works in development
2. ✅ Test with your admin account
3. ✅ Review the documentation in `ANNADANAM_BLOCKING_SYSTEM.md`

### Before Production:
1. Test blocking flow with real data
2. Communicate the policy to users
3. Consider adding email notifications for blocks
4. Set up automated daily checks (optional)

### After Launch:
1. Monitor blocked users weekly
2. Be responsive to user complaints
3. Keep notes when unblocking users
4. Review effectiveness after 1 month

## 🆘 Troubleshooting

### SQL Migration Failed

**Error:** "relation already exists"
- **Fix:** Table already created. This is fine! Skip to next step.

**Error:** "function already exists"  
- **Fix:** Functions already created. This is fine! Skip to next step.

**Error:** "permission denied"
- **Fix:** You need service_role key. Use Supabase dashboard instead of local psql.

### Admin Panel Not Loading

1. Check browser console for errors
2. Verify you're signed in as admin
3. Check `NEXT_PUBLIC_ADMIN_EMAILS` in `.env.local`
4. Try: `localStorage.clear()` then refresh

### Booking Page Shows Error

1. Check browser console
2. Verify Supabase connection
3. Check RPC functions exist in database
4. Try: Clear cache and hard refresh (Cmd+Shift+R)

### Notes Not Showing at Right Time

This is for testing time logic:
```
# Add to URL to simulate time
?devTime=10:00  # Shows Afternoon note
?devTime=16:00  # Shows Evening note
?devTime=20:00  # Shows Afternoon note (next day)
```

## 📚 More Information

See **`ANNADANAM_BLOCKING_SYSTEM.md`** for:
- Complete technical documentation
- Database schema details
- API reference
- Configuration options
- Monitoring queries
- Best practices

## ✨ You're Done!

The blocking system is now installed and ready to use. Starting November 15, 2025, users who miss 2 consecutive bookings will automatically be blocked for 7 days.

Admins can manage blocks at any time through the admin panel.

**Questions?** Check the full documentation or contact the development team.

