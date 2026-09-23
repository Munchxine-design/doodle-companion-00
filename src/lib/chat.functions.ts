import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const startSchema = z.object({
  name: z.string().trim().max(80).default("Anónimo"),
  contact: z.string().trim().max(160).default(""),
  subject: z.string().trim().max(160).default(""),
  message: z.string().trim().min(1).max(2000),
});

const threadSchema = z.object({
  threadId: z.string().uuid(),
  token: z.string().uuid(),
});

const sendSchema = threadSchema.extend({
  content: z.string().trim().min(1).max(2000),
});

export const startChatThread = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => startSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: thread, error } = await supabaseAdmin
      .from("chat_threads")
      .insert({
        visitor_name: data.name || "Anónimo",
        visitor_contact: data.contact,
        subject: data.subject,
      })
      .select("id, access_token")
      .single();
    if (error || !thread) throw new Error(error?.message ?? "No se pudo abrir el chat");

    const { error: msgError } = await supabaseAdmin.from("chat_messages").insert({
      thread_id: thread.id,
      sender: "visitor",
      content: data.message,
    });
    if (msgError) throw new Error(msgError.message);

    return { threadId: thread.id as string, token: thread.access_token as string };
  });

export const getChatMessages = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => threadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: thread } = await supabaseAdmin
      .from("chat_threads")
      .select("id")
      .eq("id", data.threadId)
      .eq("access_token", data.token)
      .maybeSingle();
    if (!thread) return { messages: [] as Array<{ id: string; sender: string; content: string; created_at: string }> };

    await supabaseAdmin.from("chat_threads").update({ unread_for_visitor: false }).eq("id", data.threadId);

    const { data: messages } = await supabaseAdmin
      .from("chat_messages")
      .select("id, sender, content, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at");
    return { messages: messages ?? [] };
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => sendSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: thread } = await supabaseAdmin
      .from("chat_threads")
      .select("id")
      .eq("id", data.threadId)
      .eq("access_token", data.token)
      .maybeSingle();
    if (!thread) throw new Error("Conversación no encontrada");

    const { error } = await supabaseAdmin.from("chat_messages").insert({
      thread_id: data.threadId,
      sender: "visitor",
      content: data.content,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("chat_threads")
      .update({ unread_for_admin: true, last_message_at: new Date().toISOString() })
      .eq("id", data.threadId);

    return { ok: true };
  });
