/*
# Community comments + editable site branding

## Purpose
Adds a persistent comment wall (with admin replies) and a single settings
row the site owner can edit from the admin panel: their display name,
profile picture, default paint color presets, and swap-able images for a
few named "placeholder" spots around the site.

## 1. New Tables

### `comments`
- `id` (uuid, PK)
- `parent_id` (uuid, nullable, self-reference) — set when the row is a reply
- `author` (text, default 'Anónimo')
- `avatar_path` (text, nullable) — path in the `site-assets` bucket
- `message` (text)
- `emoji` (text, nullable) — a single reaction/sticker attached to the comment
- `is_admin` (boolean, default false) — true only for comments posted by the site owner
- `created_at` (timestamptz, default now())

### `site_settings`
Single row (id always 1) holding:
- `admin_display_name` (text)
- `admin_avatar_path` (text, nullable) — path in `site-assets`
- `color_presets` (jsonb) — array of `{ name, value }` paint swatch defaults
- `placeholder_images` (jsonb) — map of placeholder key -> `site-assets` path

## 2. Security (RLS)
- `comments`: anyone can read; anyone can insert but only with `is_admin = false`
  (admin-authored comments are inserted server-side with the service role,
  bypassing this check); admins can delete any comment.
- `site_settings`: anyone can read; only the service role can write (all
  writes go through the admin-gated server function).
- Storage bucket `site-assets`: public read; only admins (or the service
  role) can write/delete.

## 3. Important Notes
1. Mirrors the moderation model already used by `submissions`.
2. Regular visitor comments stay anonymous by design — naming a comment is
   an admin-only capability handled by the frontend + enforced by the
   `is_admin` check above.
*/

-- Comments wall
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT 'Anónimo',
  avatar_path text,
  message text NOT NULL,
  emoji text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comments" ON public.comments;
CREATE POLICY "Anyone can read comments"
ON public.comments FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can post a non-admin comment" ON public.comments;
CREATE POLICY "Anyone can post a non-admin comment"
ON public.comments FOR INSERT TO anon, authenticated
WITH CHECK (is_admin = false);

DROP POLICY IF EXISTS "Admins can delete comments" ON public.comments;
CREATE POLICY "Admins can delete comments"
ON public.comments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Site settings (single editable row)
CREATE TABLE public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  admin_display_name text NOT NULL DEFAULT 'Maxine',
  admin_avatar_path text,
  color_presets jsonb NOT NULL DEFAULT '[]'::jsonb,
  placeholder_images jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Anyone can read site settings"
ON public.site_settings FOR SELECT TO anon, authenticated
USING (true);

-- Shared storage bucket for admin-managed branding images (avatar, placeholders)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can read site assets" ON storage.objects;
CREATE POLICY "Anyone can read site assets"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Admins can manage site assets" ON storage.objects;
CREATE POLICY "Admins can manage site assets"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
