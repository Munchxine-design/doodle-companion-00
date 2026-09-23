import { useEffect, useRef, useState, type PointerEvent, type ChangeEvent } from "react";
import { Brush, Check, ChevronDown, Coffee, CornerDownRight, Eraser, Eye, Folder, Image as ImageIcon, LockKeyhole, Menu, MessageCircle, Minus, Orbit, Paintbrush, Play, RotateCcw, Send, Smile, Sparkles, Square, Trash2, X, Music, LogOut, Terminal, Type, MousePointer2, Plus, Calendar, Kanban, Inbox } from "lucide-react";
import avatarAsset from "@/assets/maxine-avatar.png.asset.json";
import orcaAsset from "@/assets/orca-credential.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// --- TIPOS BASE ---
type Page = "inicio" | "portafolio" | "comunidad" | "sobre-mi" | "contacto";

type StrawElement = {
  id: string;
  type: "text" | "image";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
};

type ChatMessage = {
  id: string;
  sender: "user" | "admin";
  text: string;
  timestamp: string;
};

type ChatThread = {
  id: string;
  userName: string;
  contactInfo: string;
  unreadAdmin: boolean;
  unreadUser: boolean;
  messages: ChatMessage[];
};

type KanbanTask = {
  id: string;
  text: string;
  status: "todo" | "doing" | "done";
};

type CalendarEvent = {
  date: string; // YYYY-MM-DD
  note: string;
};

// --- CONFIGURACIÓN E INICIALIZACIÓN ---
const nav: Array<{ id: Page; label: string }> = [
  { id: "inicio", label: "Inicio" },
  { id: "portafolio", label: "Portafolio" },
  { id: "comunidad", label: "Comunidad" },
  { id: "sobre-mi", label: "Sobre mí" },
  { id: "contacto", label: "Contacto" },
];

const ADMIN_PASSWORD = "maxine123"; // Puedes cambiarla cuando quieras

const getStoredProfile = () => JSON.parse(localStorage.getItem("site_profile") || JSON.stringify({ name: "Maxine", avatar: avatarAsset.url }));
const getStoredImagesConfig = () => JSON.parse(localStorage.getItem("site_images_config") || JSON.stringify({ homeProfile: avatarAsset.url, homeDirects: avatarAsset.url, homeIntro: avatarAsset.url, aboutMain: avatarAsset.url, credential: orcaAsset.url }));
const getStoredEmojis = () => JSON.parse(localStorage.getItem("site_custom_emojis") || JSON.stringify([{ name: "corazon", url: avatarAsset.url }]));
const getStoredPortfolio = () => JSON.parse(localStorage.getItem("site_portfolio") || "[]");
const getStoredSpotify = () => localStorage.getItem("site_spotify_url") || "";

// --- SISTEMA SHIMEJI ---
const getStoredShimejiConfig = () => {
  const saved = localStorage.getItem("site_shimeji_states");
  const def = [avatarAsset.url];
  return saved ? JSON.parse(saved) : { walk: def, climb: def, fall: def, drag: def, idle: def, click1: def, click2: def };
};

function VirtualShimeji() {
  const [config, setConfig] = useState(getStoredShimejiConfig);
  const [pos, setPos] = useState({ x: 120, y: window.innerHeight - 90 });
  const [state, setState] = useState<"walk" | "climb" | "fall" | "drag" | "idle" | "click1" | "click2">("walk");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const dragOffsetRef = useRef({ x: 32, y: 32 });

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    const handleStorage = () => setConfig(getStoredShimejiConfig());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const currentFrames = config[state] && config[state].length > 0 ? config[state] : [avatarAsset.url];

  useEffect(() => {
    const interval = setInterval(() => setFrameIndex((prev) => (prev + 1) % currentFrames.length), 150);
    return () => clearInterval(interval);
  }, [currentFrames.length, state]);

  useEffect(() => {
    if (isDragging || isJumping) return;
    const timer = setInterval(() => {
      setState((currentState) => {
        if (currentState === "click1" || currentState === "click2") return "walk";
        if (currentState === "walk" && Math.random() < 0.15) return "idle";
        if (currentState === "idle" && Math.random() < 0.4) return "walk";
        return currentState;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [isDragging, isJumping]);

  useEffect(() => {
    if (isDragging || isJumping) return;
    const physicsInterval = setInterval(() => {
      setPos((prev) => {
        const groundLevel = window.innerHeight - 90;
        const rightLimit = window.innerWidth - 70;
        let nextX = prev.x, nextY = prev.y, nextDir = direction, nextState = state;

        if (state === "fall") {
          nextY += 10;
          if (nextY >= groundLevel) { nextY = groundLevel; nextState = "walk"; }
        } else if (state === "climb") {
          nextY -= 2;
          if (nextY <= 50) nextState = "fall";
        } else if (state === "walk") {
          nextX += direction * 2;
          if (nextX >= rightLimit) { nextX = rightLimit; nextDir = -1; if (Math.random() < 0.5) nextState = "climb"; }
          else if (nextX <= 10) { nextX = 10; nextDir = 1; if (Math.random() < 0.5) nextState = "climb"; }
        }
        if (nextDir !== direction) setDirection(nextDir);
        if (nextState !== state) setState(nextState);
        return { x: nextX, y: nextY };
      });
    }, 40);
    return () => clearInterval(physicsInterval);
  }, [state, direction, isDragging, isJumping]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (isTouchDevice) return;
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true); setState("drag");
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (isTouchDevice || !isDragging) return;
    setPos({ x: e.clientX - dragOffsetRef.current.x, y: e.clientY - dragOffsetRef.current.y });
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (isTouchDevice || !isDragging) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    setIsDragging(false); setState("fall");
  };

  const triggerJump = () => {
    if (isJumping) return;
    setIsJumping(true); setState(Math.random() < 0.5 ? "click1" : "click2"); setFrameIndex(0);
    const startY = pos.y; let jumpProgress = 0;
    const jumpInterval = setInterval(() => {
      jumpProgress += 0.15;
      setPos(p => ({ ...p, y: startY - (Math.sin(jumpProgress * Math.PI) * 45) }));
      if (jumpProgress >= 1) { clearInterval(jumpInterval); setPos(p => ({ ...p, y: startY })); setIsJumping(false); setState("walk"); }
    }, 30);
  };

  return (
    <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onClick={triggerJump}
      style={{ position: 'fixed', left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 9998, width: '64px', height: '64px', userSelect: 'none', cursor: isTouchDevice ? 'pointer' : (isDragging ? 'grabbing' : 'grab'), transform: direction === -1 && state !== "drag" ? 'scaleX(-1)' : 'scaleX(1)', touchAction: 'none' }} title="¡Shimeji interactivo!">
      <img src={currentFrames[frameIndex % currentFrames.length] || avatarAsset.url} alt="Shimeji" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))', pointerEvents: 'none' }} />
    </div>
  );
}

// --- LIENZO STRAWPAGE (SOBRE MÍ) ---
function StrawpageCanvas({ adminMode }: { adminMode: boolean }) {
  const [elements, setElements] = useState<StrawElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setElements(JSON.parse(localStorage.getItem("site_straw_elements") || "[]"));
  }, []);

  const saveElements = (newElements: StrawElement[]) => {
    setElements(newElements);
    localStorage.setItem("site_straw_elements", JSON.stringify(newElements));
  };

  const addElement = (type: "text" | "image") => {
    const newEl: StrawElement = {
      id: Date.now().toString(),
      type,
      content: type === "text" ? "Nuevo texto..." : avatarAsset.url,
      x: 50, y: 50, width: 150, height: type === "text" ? 50 : 150, z: elements.length + 1
    };
    saveElements([...elements, newEl]);
  };

  const updateElement = (id: string, partial: Partial<StrawElement>) => {
    saveElements(elements.map(el => el.id === id ? { ...el, ...partial } : el));
  };

  const removeElement = (id: string) => {
    saveElements(elements.filter(el => el.id !== id));
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!adminMode) return;
    e.stopPropagation();
    const el = elements.find(x => x.id === id);
    if (!el || !containerRef.current) return;
    
    // Traer al frente
    const maxZ = Math.max(...elements.map(e => e.z), 0);
    updateElement(id, { z: maxZ + 1 });

    const rect = containerRef.current.getBoundingClientRect();
    setDraggingId(id);
    dragOffset.current = { x: e.clientX - rect.left - el.x, y: e.clientY - rect.top - el.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!adminMode || !draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    updateElement(draggingId, { x: e.clientX - rect.left - dragOffset.current.x, y: e.clientY - rect.top - dragOffset.current.y });
  };

  const handlePointerUp = () => setDraggingId(null);

  const handleImageUpload = (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) updateElement(id, { content: ev.target.result as string }); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="strawpage-wrapper" style={{ border: adminMode ? '2px dashed #69a2ff' : 'none', borderRadius: '8px', padding: adminMode ? '10px' : '0' }}>
      {adminMode && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', background: '#0a192f', padding: '10px', borderRadius: '6px' }}>
          <Button variant="signal" size="sm" onClick={() => addElement("text")}><Type size={14} /> Añadir Texto</Button>
          <Button variant="signal" size="sm" onClick={() => addElement("image")}><ImageIcon size={14} /> Añadir Imagen/GIF</Button>
          <span style={{ fontSize: '11px', color: '#8892b0', alignSelf: 'center' }}><MousePointer2 size={12} style={{ display:'inline' }}/> Arrastra los elementos para organizarlos.</span>
        </div>
      )}
      <div 
        ref={containerRef} 
        onPointerMove={handlePointerMove} 
        onPointerUp={handlePointerUp} 
        onPointerLeave={handlePointerUp}
        style={{ position: 'relative', width: '100%', minHeight: '600px', background: adminMode ? 'rgba(0,0,0,0.2)' : 'transparent', overflow: 'hidden', touchAction: 'none' }}
      >
        {elements.map(el => (
          <div 
            key={el.id} 
            onPointerDown={(e) => handlePointerDown(e, el.id)}
            style={{ position: 'absolute', left: el.x, top: el.y, zIndex: el.z, cursor: adminMode ? 'grab' : 'default', border: adminMode ? '1px dotted rgba(255,255,255,0.5)' : 'none', padding: adminMode ? '4px' : '0' }}
          >
            {adminMode && (
              <button onClick={() => removeElement(el.id)} style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', border: 'none', cursor: 'pointer', zIndex: 10 }}>✕</button>
            )}
            
            {el.type === "text" ? (
              adminMode ? (
                <textarea 
                  value={el.content} 
                  onChange={(e) => updateElement(el.id, { content: e.target.value })} 
                  style={{ background: 'transparent', color: '#fff', border: 'none', resize: 'both', width: el.width, height: el.height, fontFamily: 'Tahoma', fontSize: '14px' }}
                  onMouseUp={(e) => updateElement(el.id, { width: e.currentTarget.offsetWidth, height: e.currentTarget.offsetHeight })}
                />
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', color: '#fff', fontSize: '14px', fontFamily: 'Tahoma', maxWidth: '300px' }}>{el.content}</div>
              )
            ) : (
              <div style={{ width: el.width, height: el.height, position: 'relative' }}>
                <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                {adminMode && (
                  <>
                    <label style={{ position: 'absolute', bottom: 0, left: 0, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', padding: '2px 5px', cursor: 'pointer' }}>
                      Cambiar <input type="file" accept="image/*" onChange={(e) => handleImageUpload(el.id, e)} style={{ display: 'none' }} />
                    </label>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '15px', height: '15px', background: 'rgba(255,255,255,0.5)', cursor: 'nwse-resize' }} 
                         onPointerDown={(e) => {
                           e.stopPropagation();
                           const startX = e.clientX; const startY = e.clientY; const startW = el.width; const startH = el.height;
                           const onMove = (ev: PointerEvent) => updateElement(el.id, { width: Math.max(50, startW + ev.clientX - startX), height: Math.max(50, startH + ev.clientY - startY) });
                           const onUp = () => { window.removeEventListener('pointermove', onMove as any); window.removeEventListener('pointerup', onUp); };
                           window.addEventListener('pointermove', onMove as any); window.addEventListener('pointerup', onUp);
                         }} />
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- PÁGINAS PRINCIPALES ---
function About({ adminMode }: { adminMode: boolean }) {
  const images = getStoredImagesConfig();
  return (
    <main className="page-shell narrow">
      <div className="page-heading">
        <p className="eyebrow">PROFILE://ABOUT</p>
        <h1>Sobre Mí.</h1>
        <p>Mi pequeño rincón personal estilo Strawpage</p>
      </div>
      <Window title="MY_UNIVERSE.EXE">
        <StrawpageCanvas adminMode={adminMode} />
      </Window>
      <ProfileBand />
    </main>
  );
}

function Contact() {
  const profile = getStoredProfile();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(localStorage.getItem("user_active_chat"));
  const [threads, setThreads] = useState<ChatThread[]>(JSON.parse(localStorage.getItem("site_chat_threads") || "[]"));
  
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [initialMsg, setInitialMsg] = useState("");
  const [replyMsg, setReplyMsg] = useState("");

  useEffect(() => {
    // Escuchar cambios para sincronizar chat si admin responde
    const interval = setInterval(() => {
      setThreads(JSON.parse(localStorage.getItem("site_chat_threads") || "[]"));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const startChat = () => {
    if (!name.trim() || !initialMsg.trim()) return;
    const newThread: ChatThread = {
      id: Date.now().toString(),
      userName: name,
      contactInfo: contactInfo,
      unreadAdmin: true,
      unreadUser: false,
      messages: [{ id: Date.now().toString(), sender: "user", text: initialMsg, timestamp: new Date().toISOString() }]
    };
    const updated = [...threads, newThread];
    localStorage.setItem("site_chat_threads", JSON.stringify(updated));
    localStorage.setItem("user_active_chat", newThread.id);
    setThreads(updated);
    setActiveThreadId(newThread.id);
  };

  const sendReply = () => {
    if (!replyMsg.trim() || !activeThread) return;
    const updatedThreads = threads.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          unreadAdmin: true,
          messages: [...t.messages, { id: Date.now().toString(), sender: "user", text: replyMsg, timestamp: new Date().toISOString() }]
        };
      }
      return t;
    });
    localStorage.setItem("site_chat_threads", JSON.stringify(updatedThreads));
    setThreads(updatedThreads);
    setReplyMsg("");
  };

  return (
    <main className="page-shell narrow">
      <div className="page-heading">
        <p className="eyebrow">MAXINE.CONTACT // CHAT_SYSTEM</p>
        <h1>Contacto Directo</h1>
      </div>
      
      {!activeThreadId ? (
        <Window title="Maxine_contact_form.exe" className="contact-card">
          <div className="contact-identity">
            <img src={getStoredImagesConfig().homeProfile} alt="Avatar" />
            <div>
              <p className="eyebrow">@Munchxine_</p>
              <h2>{profile.name}</h2>
              <p>Escríbeme y hablemos en directo ✨</p>
            </div>
          </div>
          <Input placeholder="Tu nombre o apodo..." value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Tu correo o red social (opcional)..." value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
          <Textarea placeholder="¡Hola Maxine! Me gustaría..." value={initialMsg} onChange={e => setInitialMsg(e.target.value)} />
          <Button variant="signal" onClick={startChat} disabled={!name.trim() || !initialMsg.trim()}>
            <Send /> Iniciar Chat
          </Button>
        </Window>
      ) : (
        <Window title={`Chat con Maxine`} className="contact-card">
          <div style={{ height: '300px', overflowY: 'auto', background: '#0a192f', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeThread?.messages.map(msg => (
              <div key={msg.id} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", background: msg.sender === "user" ? "#1e3a8a" : "#164e63", padding: '8px 12px', borderRadius: '8px', maxWidth: '80%' }}>
                <span style={{ fontSize: '10px', color: '#caddff', display: 'block', marginBottom: '2px' }}>{msg.sender === "user" ? "Tú" : profile.name}</span>
                <p style={{ margin: 0, fontSize: '14px', color: 'white' }}>{msg.text}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
            <Input value={replyMsg} onChange={e => setReplyMsg(e.target.value)} placeholder="Escribe un mensaje..." onKeyDown={e => e.key === "Enter" && sendReply()} />
            <Button variant="signal" onClick={sendReply}><Send size={16}/></Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem("user_active_chat"); setActiveThreadId(null); }} style={{ marginTop: '10px', width: '100%', fontSize: '10px' }}>Cerrar sesión de chat actual</Button>
        </Window>
      )}
      <ProfileBand />
    </main>
  );
}

// --- PANEL DE ADMIN INTEGRADO (Notion-style) ---
function AdminPanel({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"chat" | "organizador" | "perfil" | "imagenes" | "shimeji" | "comunidad">("chat");
  const profile = getStoredProfile();

  // Chat State
  const [threads, setThreads] = useState<ChatThread[]>(JSON.parse(localStorage.getItem("site_chat_threads") || "[]"));
  const [adminReply, setAdminReply] = useState("");

  // Organizer State (Notion style)
  const [tasks, setTasks] = useState<KanbanTask[]>(JSON.parse(localStorage.getItem("admin_kanban_tasks") || "[]"));
  const [newTaskText, setNewTaskText] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>(JSON.parse(localStorage.getItem("admin_calendar_events") || "[]"));
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [eventNote, setEventNote] = useState("");

  useEffect(() => {
    if (activeTab === "chat") {
      const interval = setInterval(() => setThreads(JSON.parse(localStorage.getItem("site_chat_threads") || "[]")), 2000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const replyToThread = (threadId: string) => {
    if (!adminReply.trim()) return;
    const updated = threads.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          unreadUser: true,
          unreadAdmin: false,
          messages: [...t.messages, { id: Date.now().toString(), sender: "admin", text: adminReply, timestamp: new Date().toISOString() }]
        };
      }
      return t;
    });
    localStorage.setItem("site_chat_threads", JSON.stringify(updated));
    setThreads(updated);
    setAdminReply("");
  };

  const deleteThread = (threadId: string) => {
    const updated = threads.filter(t => t.id !== threadId);
    localStorage.setItem("site_chat_threads", JSON.stringify(updated));
    setThreads(updated);
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTasks = [...tasks, { id: Date.now().toString(), text: newTaskText, status: "todo" as const }];
    setTasks(newTasks); localStorage.setItem("admin_kanban_tasks", JSON.stringify(newTasks));
    setNewTaskText("");
  };

  const updateTaskStatus = (id: string, status: "todo" | "doing" | "done") => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, status } : t);
    setTasks(newTasks); localStorage.setItem("admin_kanban_tasks", JSON.stringify(newTasks));
  };

  const saveEvent = () => {
    const newEvents = [...events.filter(e => e.date !== selectedDate)];
    if (eventNote.trim()) newEvents.push({ date: selectedDate, note: eventNote.trim() });
    setEvents(newEvents); localStorage.setItem("admin_calendar_events", JSON.stringify(newEvents));
  };

  return (
    <div className="admin-panel" style={{ zIndex: 10000 }}>
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2><LockKeyhole size={18} /> Consola de Maxine</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="destructive" size="sm" onClick={onLogout}><LogOut size={14} /> Salir</Button>
          <Button variant="station" size="sm" onClick={onClose}><X size={14} /></Button>
        </div>
      </div>

      <div className="admin-tabs-nav" style={{ display: 'flex', gap: '5px', background: '#0a192f', padding: '8px', borderRadius: '6px', marginBottom: '20px', overflowX: 'auto' }}>
        <Button variant={activeTab === "chat" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("chat")}><Inbox size={14}/> Inbox Mensajes</Button>
        <Button variant={activeTab === "organizador" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("organizador")}><Kanban size={14}/> Organizador</Button>
        <Button variant={activeTab === "imagenes" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("imagenes")}>Galería</Button>
      </div>

      {activeTab === "chat" && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', height: '500px' }}>
          <div style={{ background: '#0f203b', padding: '10px', borderRadius: '8px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Conversaciones</h3>
            {threads.length === 0 && <p style={{ fontSize: '12px', color: '#889' }}>No hay mensajes nuevos.</p>}
            {threads.map(t => (
              <div key={t.id} style={{ background: '#0a192f', padding: '10px', borderRadius: '6px', marginBottom: '8px', borderLeft: t.unreadAdmin ? '3px solid #4ade80' : '3px solid transparent' }}>
                <strong style={{ display: 'block', fontSize: '13px' }}>{t.userName}</strong>
                <span style={{ fontSize: '10px', color: '#889' }}>{t.contactInfo}</span>
                <details style={{ marginTop: '5px', fontSize: '12px' }}>
                  <summary style={{ cursor: 'pointer', color: '#69a2ff' }}>Ver / Responder</summary>
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {t.messages.map(m => (
                      <div key={m.id} style={{ background: m.sender === 'admin' ? '#164e63' : '#1e3a8a', padding: '5px', borderRadius: '4px' }}>
                        <b style={{ fontSize: '10px' }}>{m.sender.toUpperCase()}:</b> <br/>{m.text}
                      </div>
                    ))}
                    <Textarea value={adminReply} onChange={e => setAdminReply(e.target.value)} placeholder="Responder..." style={{ minHeight: '60px', marginTop: '5px' }} />
                    <Button variant="signal" size="sm" onClick={() => replyToThread(t.id)}>Enviar</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteThread(t.id)}>Borrar Chat</Button>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "organizador" && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* TO-DO KANBAN STYLE */}
          <div style={{ background: '#0f203b', padding: '15px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}><Kanban size={16}/> Tareas (Notion Style)</h3>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
              <Input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="Nueva idea/tarea..." />
              <Button variant="signal" onClick={handleAddTask}><Plus size={16}/></Button>
            </div>
            {["todo", "doing", "done"].map(status => (
              <div key={status} style={{ marginBottom: '15px' }}>
                <h4 style={{ fontSize: '12px', color: '#69a2ff', textTransform: 'uppercase', marginBottom: '5px' }}>{status}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {tasks.filter(t => t.status === status).map(t => (
                    <div key={t.id} style={{ background: '#0a192f', padding: '8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', textDecoration: status === 'done' ? 'line-through' : 'none' }}>{t.text}</span>
                      <select value={t.status} onChange={e => updateTaskStatus(t.id, e.target.value as any)} style={{ background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '3px', fontSize: '10px', padding: '2px' }}>
                        <option value="todo">To Do</option>
                        <option value="doing">Doing</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* MINI CALENDARIO */}
          <div style={{ background: '#0f203b', padding: '15px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={16}/> Calendario</h3>
            <Input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setEventNote(events.find(ev => ev.date === e.target.value)?.note || ""); }} style={{ marginBottom: '10px' }} />
            <Textarea value={eventNote} onChange={e => setEventNote(e.target.value)} placeholder="Notas para este día..." style={{ height: '120px', marginBottom: '10px' }} />
            <Button variant="signal" onClick={saveEvent} style={{ width: '100%' }}>Guardar Nota del Día</Button>
            
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '12px', color: '#69a2ff', marginBottom: '10px' }}>Próximos Eventos</h4>
              {events.slice(0, 5).map(e => (
                <div key={e.date} style={{ background: '#0a192f', padding: '8px', borderRadius: '4px', marginBottom: '5px', fontSize: '12px' }}>
                  <b style={{ color: '#4ade80' }}>{e.date}:</b> {e.note}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- COMPONENTES COMPARTIDOS DE UI (Simplificados para brevedad) ---
function Window({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`station-window ${className}`}>
      <div className="window-bar"><span><Sparkles size={12} /> {title}</span><div className="window-controls"><Minus /><Square /><X /></div></div>
      {children}
    </section>
  );
}

function Header({ page, setPage, onAdminAccess }: { page: Page; setPage: (page: Page) => void; onAdminAccess: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="site-header">
        <button className="brand" onClick={() => setPage("inicio")}><Orbit /> Munchxine!</button>
        <nav className={open ? "nav-list is-open" : "nav-list"}>
          {nav.map((item) => <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => { setPage(item.id); setOpen(false); }}>{item.label}</button>)}
          <button onClick={onAdminAccess}><LockKeyhole size={14} /> Admin</button>
        </nav>
      </header>
    </>
  );
}

function ProfileBand() {
  const profile = getStoredProfile();
  return (
    <section className="profile-band">
      <Window title="Maxine_profile.exe"><div className="profile-content"><img src={getStoredImagesConfig().homeProfile} alt="Avatar pixel art" /><div><h2>{profile.name}</h2><p>Artista chileno de 19 años • Arte 2D y 3D</p></div></div></Window>
    </section>
  );
}

// --- APLICACIÓN PRINCIPAL ---
export function MaxineApp() {
  const [page, setPageState] = useState<Page>("inicio");
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(() => localStorage.getItem("site_admin_logged") === "true");

  const setPage = (next: Page) => { setPageState(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const handleAdminAccess = () => adminMode ? setAdminPanelOpen(true) : setAdminLoginOpen(true);
  const handleLogoutAdmin = () => { localStorage.removeItem("site_admin_logged"); setAdminMode(false); setAdminPanelOpen(false); };

  return (
    <div className={`app-shell`}>
      <div className="ambient-grid" />
      <div className="scanline" />

      <Header page={page} setPage={setPage} onAdminAccess={handleAdminAccess} />
      {adminPanelOpen && <AdminPanel onClose={() => setAdminPanelOpen(false)} onLogout={handleLogoutAdmin} />}
      
      {page === "inicio" && <main className="page-shell narrow"><div className="page-heading"><h1>Inicio (En construcción visual)</h1></div><ProfileBand /></main>}
      {page === "sobre-mi" && <About adminMode={adminMode} />}
      {page === "contacto" && <Contact />}
      
      <VirtualShimeji />
      <footer className="system-footer"><span>MUNCHINE ONLINE!</span><span>ES</span></footer>
      
      <Dialog open={adminLoginOpen} onOpenChange={setAdminLoginOpen}>
        <DialogContent className="station-dialog">
          <DialogHeader><DialogTitle>admin_login.exe</DialogTitle></DialogHeader>
          <Input type="password" placeholder="Contraseña (maxine123)" onKeyDown={(e) => { if (e.key === "Enter" && e.currentTarget.value === ADMIN_PASSWORD) { localStorage.setItem("site_admin_logged", "true"); setAdminMode(true); setAdminLoginOpen(false); setAdminPanelOpen(true); } }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
