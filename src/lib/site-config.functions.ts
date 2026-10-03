import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Guarda un ajuste del sitio (imágenes, perfil, emojis, etc.) en la base de
 * datos para que sea visible para todos los visitantes. La lectura es pública
 * (política "Anyone can read settings"); la escritura pasa por aquí y exige la
 * contraseña de administración, verificada en el servidor.
 */
export const saveSiteSetting = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        key: z.string().min(1).max(100),
        value: z.unknown(),
        password: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const expected = process.env["SITE_ADMIN_PASSWORD"] || "maxine123";
    if (data.password !== expected) {
      throw new Error("No autorizado");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: data.key, value: data.value as never, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
