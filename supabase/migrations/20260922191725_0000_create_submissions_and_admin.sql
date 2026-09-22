/*
# Create community submissions system with admin moderation

## Purpose
Allows visitors to submit drawings (canvas or uploaded images) with a note.
The site owner (admin) reviews submissions through a private panel and
chooses which ones appear publicly on the community page.

## 1. New Tables

### `submissions`
- `id` (uuid, PK, auto-generated)
- `image_path` (text, not null) — path in the `drawings` storage bucket
- `note` (text, default '') — optional message from the visitor
- `author` (text, default 'Anónimo') — visitor name
- `approved` (boolean, default false) — only approved submissions show publicly
- `created_at` (timestamptz, default now())

### `user_roles`
- `id` (uuid, PK)
- `user_id` (uuid, not null)
- `role` (app_role enum: 'admin' | 'user')
- `created_at` (timestamptz, default now())
- Unique constraint on (user_id, role)

## 2. Enums
- `app_role`: 'admin' | 'user'

## 3. Functions
- `has_role(_user_id, _role)` — SECURITY DEFINER, checks if a user has a role
- `grant_first_user_admin()` — trigger on auth.users: first user becomes admin, subsequent users get 'user' role

## 4. Security (RLS)
- `submissions`: anyone can read approved; anyone can insert (pending); admins can read all, update, delete
- `user_roles`: users can read only their own roles
- Storage `drawings` bucket: anyone can upload/read; admins can delete

## 5. Important Notes
1. This is a public-submission app — no sign-in required to submit drawings.
2. Admin access is gated by a password check in the frontend that calls Supabase with the service role key via the admin client.
3. The first user account created becomes the admin automatically.
4. Submissions default to `approved = false` — they only appear after admin approval.
*/

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- The very first account created becomes the admin (the site owner).
CREATE OR REPLACE FUNCTION public.grant_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_role ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_first_user_admin();

-- Community submissions
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path text NOT NULL,
  note text NOT NULL DEFAULT '',
  author text NOT NULL DEFAULT 'Anónimo',
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved submissions" ON public.submissions;
CREATE POLICY "Anyone can read approved submissions"
ON public.submissions FOR SELECT TO anon, authenticated
USING (approved = true);

DROP POLICY IF EXISTS "Anyone can send a submission" ON public.submissions;
CREATE POLICY "Anyone can send a submission"
ON public.submissions FOR INSERT TO anon, authenticated
WITH CHECK (approved = false);

DROP POLICY IF EXISTS "Admins can read every submission" ON public.submissions;
CREATE POLICY "Admins can read every submission"
ON public.submissions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update submissions" ON public.submissions;
CREATE POLICY "Admins can update submissions"
ON public.submissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete submissions" ON public.submissions;
CREATE POLICY "Admins can delete submissions"
ON public.submissions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for drawings
INSERT INTO storage.buckets (id, name, public)
VALUES ('drawings', 'drawings', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can upload a drawing" ON storage.objects;
CREATE POLICY "Anyone can upload a drawing"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'drawings');

DROP POLICY IF EXISTS "Anyone can read drawings" ON storage.objects;
CREATE POLICY "Anyone can read drawings"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'drawings');

DROP POLICY IF EXISTS "Admins can delete drawings" ON storage.objects;
CREATE POLICY "Admins can delete drawings"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'drawings' AND public.has_role(auth.uid(), 'admin'));
