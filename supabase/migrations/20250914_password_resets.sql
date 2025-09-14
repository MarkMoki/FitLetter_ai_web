-- Password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_resets (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL,
  used_at BIGINT,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()))::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON public.password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON public.password_resets(expires_at);

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
-- No RLS policies required since server uses service role for inserts/selects/updates on this table.
