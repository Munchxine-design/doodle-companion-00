-- Site settings (key/value)
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Custom emojis
CREATE TABLE public.custom_emojis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'emoji',
  image_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_emojis TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_emojis TO authenticated;
GRANT ALL ON public.custom_emojis TO service_role;
ALTER TABLE public.custom_emojis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read emojis" ON public.custom_emojis FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage emojis" ON public.custom_emojis FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- About page free-form blocks (strawpage style)
CREATE TABLE public.about_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'text',
  content text NOT NULL DEFAULT '',
  image_path text,
  x numeric NOT NULL DEFAULT 10,
  y numeric NOT NULL DEFAULT 10,
  width numeric NOT NULL DEFAULT 220,
  height numeric NOT NULL DEFAULT 140,
  z_index integer NOT NULL DEFAULT 1,
  rotation numeric NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#cfe3ff',
  font_size numeric NOT NULL DEFAULT 16,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.about_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.about_blocks TO authenticated;
GRANT ALL ON public.about_blocks TO service_role;
ALTER TABLE public.about_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read about blocks" ON public.about_blocks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage about blocks" ON public.about_blocks FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Portfolio artworks managed from admin
CREATE TABLE public.artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Sin titulo',
  category text NOT NULL DEFAULT 'Drawings',
  image_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artworks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artworks TO authenticated;
GRANT ALL ON public.artworks TO service_role;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read artworks" ON public.artworks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage artworks" ON public.artworks FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Contact chat threads and messages (visitors go through service-role server functions)
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL DEFAULT 'Anonimo',
  visitor_contact text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  access_token uuid NOT NULL DEFAULT gen_random_uuid(),
  unread_for_admin boolean NOT NULL DEFAULT true,
  unread_for_visitor boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage threads" ON public.chat_threads FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender text NOT NULL DEFAULT 'visitor',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_thread_idx ON public.chat_messages(thread_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage messages" ON public.chat_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Admin tasks / agenda
CREATE TABLE public.admin_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  notes text NOT NULL DEFAULT '',
  done boolean NOT NULL DEFAULT false,
  due_date date,
  color text NOT NULL DEFAULT '#69a2ff',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_tasks TO authenticated;
GRANT ALL ON public.admin_tasks TO service_role;
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tasks" ON public.admin_tasks FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));