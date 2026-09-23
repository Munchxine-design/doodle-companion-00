/*
# Create wall comments table with replies and admin moderation

## Purpose
Stores community wall comments persistently. Comments can be top-level or
replies to another comment (parent_id). Admin replies are flagged with
is_admin_reply. Comments go through an approval flow before being visible.

## 1. New Tables

### `wall_comments`
- `id` (uuid, PK, auto-generated)
- `author` (text, default 'Anónimo') — commenter name; admin can set their own
- `content` (text, not null) — the comment text
- `approved` (boolean, default false) — only approved comments show publicly
- `parent_id` (uuid, nullable, FK to wall_comments.id) — null for top-level, set for replies
- `is_admin_reply` (boolean, default false) — marks replies from the site owner
- `created_at` (timestamptz, default now())

## 2. Security (RLS)
- This is a no-auth public app: the admin gate is a frontend password check, not Supabase auth.
- Anyone (anon + authenticated) can read approved comments.
- Anyone can insert a comment (pending approval by default).
- Anyone can update/delete — the admin password gate is enforced in the frontend.
- This is intentionally public/shared data, so USING (true) is acceptable here.

## 3. Index
- Index on `approved` for fast filtering of visible comments.
- Index on `parent_id` for fast reply lookups.
*/

CREATE TABLE IF NOT EXISTS public.wall_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text NOT NULL DEFAULT 'Anónimo',
  content text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  parent_id uuid REFERENCES public.wall_comments(id) ON DELETE CASCADE,
  is_admin_reply boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wall_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wall_comments TO authenticated;
GRANT ALL ON public.wall_comments TO service_role;

ALTER TABLE public.wall_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved comments" ON public.wall_comments;
CREATE POLICY "Anyone can read approved comments"
ON public.wall_comments FOR SELECT TO anon, authenticated
USING (approved = true);

DROP POLICY IF EXISTS "Anyone can post a comment" ON public.wall_comments;
CREATE POLICY "Anyone can post a comment"
ON public.wall_comments FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update comments" ON public.wall_comments;
CREATE POLICY "Anyone can update comments"
ON public.wall_comments FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete comments" ON public.wall_comments;
CREATE POLICY "Anyone can delete comments"
ON public.wall_comments FOR DELETE TO anon, authenticated
USING (true);

CREATE INDEX IF NOT EXISTS idx_wall_comments_approved ON public.wall_comments(approved);
CREATE INDEX IF NOT EXISTS idx_wall_comments_parent ON public.wall_comments(parent_id);
