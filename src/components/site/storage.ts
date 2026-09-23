import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

export async function getSignedUrl(bucket: string, path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const key = `${bucket}/${path}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 6)
    .then(({ data }) => {
      const url = data?.signedUrl ?? null;
      if (url) cache.set(key, url);
      inflight.delete(key);
      return url;
    })
    .catch(() => {
      inflight.delete(key);
      return null;
    });
  inflight.set(key, promise);
  return promise;
}

export function useSignedUrl(bucket: string, path: string | null | undefined, fallback?: string) {
  const [url, setUrl] = useState<string | null>(() => (path ? cache.get(`${bucket}/${path}`) ?? null : null));
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(null);
      return;
    }
    getSignedUrl(bucket, path).then((next) => {
      if (alive) setUrl(next);
    });
    return () => {
      alive = false;
    };
  }, [bucket, path]);
  return url ?? fallback ?? null;
}

export async function uploadToSiteAssets(file: File, folder: string) {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file, {
    contentType: file.type || "image/png",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Small component that resolves a private storage path into an <img>. */
export function useStoredImage(path: string | null | undefined, fallback: string) {
  return useSignedUrl("site-assets", path, fallback) ?? fallback;
}
