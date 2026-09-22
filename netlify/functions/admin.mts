import type { Config } from "@netlify/functions";

type Action =
  | "login"
  | "submissions.approve"
  | "submissions.unapprove"
  | "submissions.delete"
  | "comments.postAdmin"
  | "comments.delete"
  | "settings.update"
  | "assets.uploadAvatar"
  | "assets.uploadPlaceholder";

type Body = {
  password?: string;
  action?: Action;
  payload?: Record<string, unknown>;
};

const DEFAULT_ADMIN_PASSWORD = "teri123";

function checkPassword(password: string | undefined) {
  const expected = Netlify.env.get("ADMIN_PASSWORD") || DEFAULT_ADMIN_PASSWORD;
  return typeof password === "string" && password === expected;
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; contentType: string; extension: string } {
  const match = /^data:(.+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error("Formato de imagen inválido");
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const extension = contentType.split("/")[1]?.split("+")[0] || "png";
  return { buffer, contentType, extension };
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método no permitido" }, { status: 405 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!checkPassword(body.password)) {
    return Response.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  if (body.action === "login") {
    return Response.json({ ok: true });
  }

  const { supabaseAdmin } = await import("../../src/integrations/supabase/client.server");
  const payload = body.payload ?? {};

  try {
    switch (body.action) {
      case "submissions.approve": {
        const { error } = await supabaseAdmin.from("submissions").update({ approved: true }).eq("id", String(payload.id));
        if (error) throw error;
        return Response.json({ ok: true });
      }
      case "submissions.unapprove": {
        const { error } = await supabaseAdmin.from("submissions").update({ approved: false }).eq("id", String(payload.id));
        if (error) throw error;
        return Response.json({ ok: true });
      }
      case "submissions.delete": {
        const { error: dbError } = await supabaseAdmin.from("submissions").delete().eq("id", String(payload.id));
        if (dbError) throw dbError;
        if (payload.imagePath) await supabaseAdmin.storage.from("drawings").remove([String(payload.imagePath)]);
        return Response.json({ ok: true });
      }
      case "comments.postAdmin": {
        const { data: settings } = await supabaseAdmin.from("site_settings").select("*").eq("id", 1).single();
        const { data, error } = await supabaseAdmin
          .from("comments")
          .insert({
            message: String(payload.message ?? ""),
            parent_id: payload.parentId ? String(payload.parentId) : null,
            emoji: payload.emoji ? String(payload.emoji) : null,
            is_admin: true,
            author: settings?.admin_display_name || "Maxine",
            avatar_path: settings?.admin_avatar_path ?? null,
          })
          .select("*")
          .single();
        if (error) throw error;
        return Response.json({ ok: true, comment: data });
      }
      case "comments.delete": {
        const { error } = await supabaseAdmin.from("comments").delete().eq("id", String(payload.id));
        if (error) throw error;
        return Response.json({ ok: true });
      }
      case "settings.update": {
        const update: Record<string, unknown> = {};
        if (typeof payload.adminDisplayName === "string") update.admin_display_name = payload.adminDisplayName;
        if (Array.isArray(payload.colorPresets)) update.color_presets = payload.colorPresets;
        update.updated_at = new Date().toISOString();
        const { data, error } = await supabaseAdmin.from("site_settings").update(update).eq("id", 1).select("*").single();
        if (error) throw error;
        return Response.json({ ok: true, settings: data });
      }
      case "assets.uploadAvatar": {
        const { buffer, contentType, extension } = dataUrlToBuffer(String(payload.dataUrl));
        const path = `avatar_${Date.now()}.${extension}`;
        const { error: uploadError } = await supabaseAdmin.storage.from("site-assets").upload(path, buffer, { contentType, upsert: true });
        if (uploadError) throw uploadError;
        const { data, error } = await supabaseAdmin
          .from("site_settings")
          .update({ admin_avatar_path: path, updated_at: new Date().toISOString() })
          .eq("id", 1)
          .select("*")
          .single();
        if (error) throw error;
        return Response.json({ ok: true, path, settings: data });
      }
      case "assets.uploadPlaceholder": {
        const key = String(payload.key ?? "");
        if (!key) return Response.json({ error: "Falta la clave del placeholder" }, { status: 400 });
        const { buffer, contentType, extension } = dataUrlToBuffer(String(payload.dataUrl));
        const path = `placeholder_${key}_${Date.now()}.${extension}`;
        const { error: uploadError } = await supabaseAdmin.storage.from("site-assets").upload(path, buffer, { contentType, upsert: true });
        if (uploadError) throw uploadError;
        const { data: current } = await supabaseAdmin.from("site_settings").select("placeholder_images").eq("id", 1).single();
        const placeholderImages = { ...(current?.placeholder_images as Record<string, string> | null), [key]: path };
        const { data, error } = await supabaseAdmin
          .from("site_settings")
          .update({ placeholder_images: placeholderImages, updated_at: new Date().toISOString() })
          .eq("id", 1)
          .select("*")
          .single();
        if (error) throw error;
        return Response.json({ ok: true, path, settings: data });
      }
      default:
        return Response.json({ error: "Acción desconocida" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
};

export const config: Config = {
  path: "/.netlify/functions/admin",
};
