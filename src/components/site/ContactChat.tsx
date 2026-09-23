import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getChatMessages, sendChatMessage, startChatThread } from "@/lib/chat.functions";

type Message = { id: string; sender: string; content: string; created_at: string };

const STORAGE_KEY = "munchxine_chat_session";

function loadSession(): { threadId: string; token: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { threadId: string; token: string }) : null;
  } catch {
    return null;
  }
}

export function ContactChat({ displayName }: { displayName: string }) {
  const [session, setSession] = useState<{ threadId: string; token: string } | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  const refresh = useCallback(async (current: { threadId: string; token: string }) => {
    try {
      const result = await getChatMessages({ data: current });
      setMessages(result.messages as Message[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    void refresh(session);
    const timer = window.setInterval(() => void refresh(session), 10000);
    return () => window.clearInterval(timer);
  }, [session, refresh]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const openChat = async () => {
    if (!message.trim()) {
      setError("Escribe tu mensaje primero ♡");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await startChatThread({
        data: { name: name.trim() || "Anónimo", contact: contact.trim(), subject: subject.trim(), message: message.trim() },
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      setSession(result);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el chat");
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!session || !message.trim()) return;
    setBusy(true);
    try {
      await sendChatMessage({ data: { ...session, content: message.trim() } });
      setMessage("");
      await refresh(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setBusy(false);
    }
  };

  const closeSession = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setMessages([]);
  };

  if (!session) {
    return (
      <div className="chat-form">
        <h3><MessageCircle size={16} /> ¡Hablemos de arte o proyectos! 💬</h3>
        <Input placeholder="Tu nombre o redes..." value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Tu correo o usuario para contactarte..." value={contact} onChange={(e) => setContact(e.target.value)} />
        <Input placeholder="Asunto (commission, dudas, saludo...)" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Textarea placeholder="Escribe tu mensaje aquí..." value={message} onChange={(e) => setMessage(e.target.value)} />
        {error && <p className="submit-status error">{error}</p>}
        <Button variant="signal" onClick={openChat} disabled={busy}>
          <Send /> {busy ? "Abriendo chat..." : "Abrir chat y enviar ♡"}
        </Button>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span><MessageCircle size={14} /> Chat con {displayName}</span>
        <button className="comment-action-btn" onClick={closeSession}>Cerrar conversación</button>
      </div>
      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 && <p className="window-copy">Cargando mensajes...</p>}
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.sender === "admin" ? "from-admin" : "from-visitor"}`}>
            <strong>{m.sender === "admin" ? displayName : "Tú"}</strong>
            <p>{m.content}</p>
            <span>{new Date(m.created_at).toLocaleString("es")}</span>
          </div>
        ))}
      </div>
      <Textarea placeholder="Escribe un mensaje..." value={message} onChange={(e) => setMessage(e.target.value)} />
      {error && <p className="submit-status error">{error}</p>}
      <Button variant="signal" onClick={send} disabled={busy || !message.trim()}><Send /> Enviar</Button>
      <p className="window-copy">Guarda esta pestaña: tus respuestas aparecerán aquí mismo.</p>
    </div>
  );
}
