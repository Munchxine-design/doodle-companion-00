import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProfileSettings = {
  displayName: string;
  handle: string;
  roleLine: string;
  tagline: string;
  tags: string[];
  intro: string;
  heroTitle: string;
  heroSubtitle: string;
  welcomeChip: string;
  logoTop: string;
  logoBottom: string;
  avatarPath: string | null;
  credentialPath: string | null;
  contactName: string;
  contactPronouns: string;
  contactAge: string;
  contactLocation: string;
};

export const defaultProfile: ProfileSettings = {
  displayName: "Maxine",
  handle: "@Munchxine_",
  roleLine: "Maxine / Munchy / Moopy",
  tagline: "Artista chileno de 19 años • Arte 2D y 3D • ESP / ENG",
  tags: ["Roblox", "ARGs", "Pokemon"],
  intro: "Soy un artista digital enfocado en el arte 2D, tanto ilustración como modelos Vtuber/Pngtuber.",
  heroTitle: "Your idea, your model, brought out of the drawing :3",
  heroSubtitle: "2D illustration and models for VRChat.",
  welcomeChip: "Welcome to my freaky portfolio page :3",
  logoTop: "Munchxine",
  logoBottom: "Safeplace!",
  avatarPath: null,
  credentialPath: null,
  contactName: "Maxine",
  contactPronouns: "He / Him",
  contactAge: "19 y/o",
  contactLocation: "Chile 🇨🇱",
};

export type CustomEmoji = { id: string; name: string; image_path: string };

export type AboutBlock = {
  id: string;
  kind: string;
  content: string;
  image_path: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  z_index: number;
  rotation: number;
  color: string;
  font_size: number;
};

export type Artwork = { id: string; title: string; category: string; image_path: string };

export function useProfileSettings() {
  const [profile, setProfile] = useState<ProfileSettings>(defaultProfile);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "profile").maybeSingle();
    if (data?.value && typeof data.value === "object") {
      setProfile({ ...defaultProfile, ...(data.value as Partial<ProfileSettings>) });
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(async (next: ProfileSettings) => {
    setProfile(next);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "profile", value: next as unknown as Record<string, unknown>, updated_at: new Date().toISOString() });
    if (error) throw error;
  }, []);

  return { profile, setProfile, save, reload, loaded };
}

export function useCustomEmojis() {
  const [emojis, setEmojis] = useState<CustomEmoji[]>([]);
  const reload = useCallback(async () => {
    const { data } = await supabase.from("custom_emojis").select("id,name,image_path").order("created_at");
    if (data) setEmojis(data as CustomEmoji[]);
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { emojis, reload };
}

export function useAboutBlocks() {
  const [blocks, setBlocks] = useState<AboutBlock[]>([]);
  const reload = useCallback(async () => {
    const { data } = await supabase.from("about_blocks").select("*").order("z_index");
    if (data) setBlocks(data as AboutBlock[]);
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { blocks, setBlocks, reload };
}

export function useArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("artworks")
      .select("id,title,category,image_path")
      .order("created_at", { ascending: false });
    if (data) setArtworks(data as Artwork[]);
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { artworks, reload };
}
