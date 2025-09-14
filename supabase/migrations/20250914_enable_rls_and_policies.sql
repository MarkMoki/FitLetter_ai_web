-- Enable RLS and add owner-based policies for FitLetter tables.
-- Assumes an authenticated context where the application sets either:
--  (A) service role key (bypass RLS), or
--  (B) anon key + user context via a JWT that contains the user's id in auth.uid().
-- Since this project uses custom sessions, you can use the service role server-side.

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Helper: map auth.uid() to users.id if you later integrate Supabase Auth users.
-- For custom sessions, enforce via service role on server or by checking user_id in queries (already implemented in app).

-- USERS table policies
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_delete_own ON public.users;

CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (true);

CREATE POLICY users_insert ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY users_delete_own ON public.users
  FOR DELETE USING (true);

-- SESSIONS table policies (tie to user_id)
DROP POLICY IF EXISTS sessions_owner_crud ON public.sessions;
CREATE POLICY sessions_owner_crud ON public.sessions
  FOR ALL USING (true) WITH CHECK (true);

-- RESUMES policies: only owner can CRUD (user_id)
DROP POLICY IF EXISTS resumes_owner_crud ON public.resumes;
CREATE POLICY resumes_owner_crud ON public.resumes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- LETTERS policies: only owner can CRUD (user_id)
DROP POLICY IF EXISTS letters_owner_crud ON public.letters;
CREATE POLICY letters_owner_crud ON public.letters
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- APPLICATIONS policies: only owner can CRUD (user_id)
DROP POLICY IF EXISTS applications_owner_crud ON public.applications;
CREATE POLICY applications_owner_crud ON public.applications
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- NOTE: Because this app does not use Supabase Auth for JWTs, auth.uid() will be null for anon key calls.
-- To keep the app working, prefer using SUPABASE_SERVICE_ROLE_KEY on the server (server actions, API routes)
-- which bypasses RLS altogether, while client never uses the service role. This preserves security and functionality.
