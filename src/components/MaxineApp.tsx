import { useEffect, useRef, useState, type PointerEvent, type ChangeEvent } from "react";
import { Brush, Check, ChevronDown, Coffee, CornerDownRight, Eraser, Eye, Folder, Image as ImageIcon, LockKeyhole, Menu, MessageCircle, Minus, Orbit, Paintbrush, Play, RotateCcw, Send, Smile, Sparkles, Square, Trash2, X, Music, LogOut, Terminal, Type, MousePointer2, Plus, Calendar, Kanban, Inbox } from "lucide-react";
import avatarAsset from "@/assets/maxine-avatar.png.asset.json";
import orcaAsset from "@/assets/orca-credential.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Page = "inicio" | "portafolio" | "comunidad" | "sobre-mi" | "contacto";

// --- TIPOS NUEVOS Y EXISTENTES ---
type Submission = { id: string; image_path: string; note: string; author: string; approved: boolean; created_at: string; };
type WallComment = { id: string; author: string; content: string; approved: boolean; parent_id: string | null; is_admin_reply: boolean; created_at: string; };
type PortfolioItem = { id: string; title: string; category: string; image_path: string; };

type StrawElement = { id: string; type: "text" | "image"; content: string; x: number; y: number; width: number; height: number; z: number; };
type ChatMessage = { id: string; sender: "user" | "admin"; text: string; timestamp: string; };
type ChatThread = { id: string; userName: string; contactInfo: string; unreadAdmin: boolean; unreadUser: boolean; messages: ChatMessage[]; };
type KanbanTask = { id: string; text: string; status: "todo" | "doing" | "done"; };
type CalendarEvent = { date: string; note: string; };

const nav: Array<{ id: Page; label: string }> = [
  { id: "inicio", label: "Inicio" },
  { id: "portafolio", label: "Portafolio" },
  { id: "comunidad", label: "Comunidad" },
  { id: "sobre-mi", label: "Sobre mí" },
  { id: "contacto", label: "Contacto" },
];

const stages = [
  { title: "1. El boceto inicial ♡", copy: "Todo empieza con líneas sueltas, buscando la pose y la idea principal." },
  { title: "2. Lineart y color base ✨", copy: "Se limpian los trazos definitivos y se aplican los colores planos." },
  { title: "3. ¡Ilustración finalizada! 🎨", copy: "Sombras, luces y efectos mágicos listos para exportar." },
];

const ADMIN_PASSWORD = "maxine123";

const colorPresets = [
  { name: "Azul", value: "#69a2ff" }, { name: "Rosa", value: "#ff6b9d" }, { name: "Verde", value: "#4ade80" },
  { name: "Naranja", value: "#fb923c" }, { name: "Amarillo", value: "#facc15" }, { name: "Morado", value: "#a78bfa" },
  { name: "Cian", value: "#22d3ee" }, { name: "Blanco", value: "#ffffff" }, { name: "Negro", value: "#1a1a2e" },
];

const getStoredProfile = () => JSON.parse(localStorage.getItem("site_profile") || JSON.stringify({ name: "Maxine", avatar: avatarAsset.url }));
const getStoredImagesConfig = () => JSON.parse(localStorage.getItem("site_images_config") || JSON.stringify({ homeProfile: avatarAsset.url, homeDirects: avatarAsset.url, homeIntro: avatarAsset.url, aboutMain: avatarAsset.url, credential: orcaAsset.url }));
const getStoredEmojis = () => JSON.parse(localStorage.getItem("site_custom_emojis") || JSON.stringify([{ name: "corazon", url: avatarAsset.url }, { name: "estrella", url: avatarAsset.url }]));
const getStoredPortfolio = () => JSON.parse(localStorage.getItem("site_portfolio") || JSON.stringify([{ id: "1", title: "MEGAMAN!!!", category: "Drawings", image_path: avatarAsset.url }]));
const getStoredSpotify = () => localStorage.getItem("site_spotify_url") || "";
const getStoredShimejiConfig = () => {
  const saved = localStorage.getItem("site_shimeji_states");
  const def = [avatarAsset.url];
  if (saved) { try { return JSON.parse(saved); } catch { /* fallback */ } }
  return { walk: def, climb: def, fall: def, drag: def, idle: def, click1: def, click2: def };
};

// --- COMPONENTE SHIMEJI ADAPTADO PARA PC Y MÓVILES TÁCTILES ---
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
    const interval = setInterval(() => { setFrameIndex((prev) => (prev + 1) % currentFrames.length); }, 150);
    return () => clearInterval(interval);
  }, [currentFrames.length, state]);

  useEffect(() => {
    if (isDragging || isJumping) return;
    const timer = setInterval(() => {
      setState((currentState) => {
        if (currentState === "click1" || currentState === "click2") return "walk";
        if (currentState === "walk") { if (Math.random() < 0.15) return "idle"; }
        else if (currentState === "idle") { if (Math.random() < 0.4) return "walk"; }
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
        const leftLimit = 10;
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
          else if (nextX <= leftLimit) { nextX = leftLimit; nextDir = 1; if (Math.random() < 0.5) nextState = "climb"; }
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
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
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
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    setIsDragging(false); setState("fall");
  };

  const triggerJump = () => {
    if (isJumping) return;
    setIsJumping(true); setState(Math.random() < 0.5 ? "click1" : "click2"); setFrameIndex(0);
    const startY = pos.y; let jumpProgress = 0;
    const jumpInterval = setInterval(() => {
      jumpProgress += 0.15;
      const jumpHeight = Math.sin(jumpProgress * Math.PI) * 45;
      setPos(p => ({ ...p, y: startY - jumpHeight }));
      if (jumpProgress >= 1) { clearInterval(jumpInterval); setPos(p => ({ ...p, y: startY })); setIsJumping(false); setState("walk"); }
    }, 30);
  };

  const activeImage = currentFrames[frameIndex % currentFrames.length] || avatarAsset.url;

  return (
    <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onClick={triggerJump}
      style={{
        position: 'fixed', left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 10005, width: '64px', height: '64px',
        userSelect: 'none', cursor: isTouchDevice ? 'pointer' : (isDragging ? 'grabbing' : 'grab'),
        transform: direction === -1 && state !== "drag" ? 'scaleX(-1)' : 'scaleX(1)', touchAction: 'none',
      }} title="¡Shimeji interactivo!">
      <img src={activeImage} alt="Shimeji" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))', pointerEvents: 'none' }} />
    </div>
  );
}

// --- TERMINAL Y WIDGETS ---
function SecretCodesWidget({ onTriggerEffect }: { onTriggerEffect: (effectName: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleRedeem = () => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    if (clean === "BUBBLES" || clean === "MAGIC") { setFeedback("✨ ¡Efecto mágico de burbujas!"); onTriggerEffect("bubbles"); }
    else if (clean === "CYBER" || clean === "MATRIX") { setFeedback("💻 ¡Modo Ciberespacio activado!"); onTriggerEffect("cyber"); }
    else if (clean === "BESO" || clean === "KISS") { setFeedback("💋 ¡Animación especial del beso!"); onTriggerEffect("kiss"); }
    else if (clean === "MAXINECOMMISSION" || clean === "MAXINE20") { setFeedback("🎉 ¡Código válido! 20% de descuento."); onTriggerEffect("discount"); }
    else { setFeedback("❌ Código inválido."); }
    setCode("");
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 9996 }}>
      {!isOpen ? (
        <Button variant="signal" onClick={() => setIsOpen(true)} style={{ borderRadius: '50%', width: '50px', height: '50px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }} title="Códigos Secretos"><Terminal size={22} /></Button>
      ) : (
        <div style={{ background: '#ece9d8', border: '2px solid #0055ea', borderRadius: '6px', width: '280px', boxShadow: '2px 4px 15px rgba(0,0,0,0.5)', fontFamily: 'Tahoma, sans-serif' }}>
          <div style={{ background: 'linear-gradient(to right, #0055ea, #1690ff)', color: 'white', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 'bold' }}>
            <span>🔑 Códigos Secretos.exe</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
          <div style={{ padding: '12px', background: '#0a192f', color: '#fff' }}>
            <p style={{ fontSize: '11px', color: '#8892b0', marginBottom: '8px' }}>Introduce un código secreto o easter egg:</p>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
              <Input placeholder="Ej. BUBBLES..." value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleRedeem(); }} style={{ fontSize: '12px', background: '#0f203b', color: 'white' }} />
              <Button variant="signal" size="sm" onClick={handleRedeem}>Canjear</Button>
            </div>
            {feedback && <p style={{ fontSize: '11px', color: '#4ade80', marginTop: '5px' }}>{feedback}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function SpotifyWidget() {
  const spotifyUrl = getStoredSpotify();
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 400, y: window.innerHeight - 240 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;

  if (!spotifyUrl) return null;
  let embedUrl = spotifyUrl;
  if (spotifyUrl.includes("spotify.com") && !spotifyUrl.includes("/embed/")) {
    embedUrl = spotifyUrl.replace("spotify.com/", "spotify.com/embed/");
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setPos({ x: Math.max(10, Math.min(window.innerWidth - 390, e.clientX - dragRef.current.x)), y: Math.max(10, Math.min(window.innerHeight - 180, e.clientY - dragRef.current.y)) });
    };
    const handleUp = () => { if (isDraggingRef.current) setIsDragging(false); };
    window.addEventListener("mousemove", handleMove); window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); dragRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; };

  return (
    <div style={{ position: 'fixed', left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 9997, width: '380px', background: '#ece9d8', border: '2px solid #0055ea', borderRadius: '5px 5px 0 0', boxShadow: '2px 2px 10px rgba(0,0,0,0.5)', fontFamily: 'Tahoma, sans-serif' }}>
      <div onMouseDown={handleMouseDown} style={{ background: 'linear-gradient(to right, #0055ea, #1690ff)', color: 'white', padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 'bold', cursor: 'grab', userSelect: 'none' }}>
        <span>🎵 Spotify - WinXP Player (Movible)</span>
        <button onClick={() => setMinimized(!minimized)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>{minimized ? "□" : "_"}</button>
      </div>
      {!minimized && (<div style={{ background: '#000', lineHeight: 0 }}><iframe src={embedUrl} width="100%" height="152" frameBorder="0" allow="encrypted-media" title="Spotify Player" style={{ borderRadius: '0' }} /></div>)}
    </div>
  );
}

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
        <button className="brand" onClick={() => setPage("inicio")} aria-label="Ir a inicio"><Orbit /> Munchxine!</button>
        <Button variant="ghost" size="icon" className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Abrir menú"><Menu /></Button>
        <nav className={open ? "nav-list is-open" : "nav-list"} aria-label="Navegación principal">
          {nav.map((item) => <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => { setPage(item.id); setOpen(false); }}>{item.label}</button>)}
          <button onClick={onAdminAccess} aria-label="Administración"><LockKeyhole size={14} /> Admin</button>
        </nav>
      </header>
      <div className="breadcrumb"><Orbit size={12} /><span>Munchxine!</span><span>/</span><span>{page === "inicio" ? "Estudio creativo" : nav.find((item) => item.id === page)?.label}</span><Sparkles size={11} /></div>
    </>
  );
}

function AdminLoginDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleLogin = () => { if (password === ADMIN_PASSWORD) { setError(""); setPassword(""); onSuccess(); } else { setError("Contraseña incorrecta"); } };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="station-dialog">
        <DialogHeader><DialogTitle>admin_login.exe</DialogTitle><DialogDescription>Zona restringida de Maxine.</DialogDescription></DialogHeader>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }} />
        {error && <p className="admin-error">{error}</p>}
        <Button variant="signal" onClick={handleLogin}>Entrar</Button>
      </DialogContent>
    </Dialog>
  );
}

// --- LIENZO STRAWPAGE (SOBRE MÍ) ---
function StrawpageCanvas({ adminMode }: { adminMode: boolean }) {
  const [elements, setElements] = useState<StrawElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => { setElements(JSON.parse(localStorage.getItem("site_straw_elements") || "[]")); }, []);

  const saveElements = (newElements: StrawElement[]) => {
    setElements(newElements);
    localStorage.setItem("site_straw_elements", JSON.stringify(newElements));
  };

  const addElement = (type: "text" | "image") => {
    const newEl: StrawElement = {
      id: Date.now().toString(), type, content: type === "text" ? "Nuevo texto..." : avatarAsset.url,
      x: 50, y: 50, width: 150, height: type === "text" ? 50 : 150, z: elements.length + 1
    };
    saveElements([...elements, newEl]);
  };

  const updateElement = (id: string, partial: Partial<StrawElement>) => { saveElements(elements.map(el => el.id === id ? { ...el, ...partial } : el)); };
  const removeElement = (id: string) => { saveElements(elements.filter(el => el.id !== id)); };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!adminMode) return;
    e.stopPropagation();
    const el = elements.find(x => x.id === id);
    if (!el || !containerRef.current) return;
    const maxZ = Math.max(...elements.map(e => e.z), 0);
    updateElement(id, { z: maxZ + 1 });
    const rect = containerRef.current.getBoundingClientRect();
    setDraggingId(id); dragOffset.current = { x: e.clientX - rect.left - el.x, y: e.clientY - rect.top - el.y };
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
    if (file.size > 2 * 1024 * 1024) {
      alert("El archivo pesa más de 2MB. Intenta usar un GIF o imagen más ligera para no saturar la memoria local.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) updateElement(id, { content: ev.target.result as string }); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="strawpage-wrapper" style={{ border: adminMode ? '2px dashed rgba(105, 162, 255, 0.5)' : 'none', borderRadius: '8px', padding: adminMode ? '10px' : '0' }}>
      {adminMode && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', background: 'rgba(10, 25, 47, 0.7)', padding: '10px', borderRadius: '6px', flexWrap: 'wrap' }}>
          <Button variant="signal" size="sm" onClick={() => addElement("text")}><Type size={14} /> Añadir Texto</Button>
          <Button variant="signal" size="sm" onClick={() => addElement("image")}><ImageIcon size={14} /> Añadir Imagen/GIF</Button>
          <span style={{ fontSize: '11px', color: '#8892b0', alignSelf: 'center' }}><MousePointer2 size={12} style={{ display:'inline' }}/> Arrastra y redimensiona los elementos libremente.</span>
        </div>
      )}
      <div ref={containerRef} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} style={{ position: 'relative', width: '100%', minHeight: '500px', background: adminMode ? 'rgba(0,0,0,0.1)' : 'transparent', overflow: 'hidden', touchAction: 'none' }}>
        {elements.map(el => (
          <div key={el.id} onPointerDown={(e) => handlePointerDown(e, el.id)} style={{ position: 'absolute', left: el.x, top: el.y, zIndex: el.z, cursor: adminMode ? 'grab' : 'default', border: adminMode ? '1px dotted rgba(255,255,255,0.4)' : 'none', padding: adminMode ? '4px' : '0' }}>
            {adminMode && (<button onClick={() => removeElement(el.id)} style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', border: 'none', cursor: 'pointer', zIndex: 10 }}>✕</button>)}
            {el.type === "text" ? (
              adminMode ? (
                <textarea value={el.content} onChange={(e) => updateElement(el.id, { content: e.target.value })} style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', resize: 'both', width: el.width, height: el.height, fontFamily: 'Tahoma', fontSize: '14px', padding: '5px' }} onMouseUp={(e) => updateElement(el.id, { width: e.currentTarget.offsetWidth, height: e.currentTarget.offsetHeight })} />
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', color: '#fff', fontSize: '14px', fontFamily: 'Tahoma', maxWidth: '300px' }}>{el.content}</div>
              )
            ) : (
              <div style={{ width: el.width, height: el.height, position: 'relative' }}>
                <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                {adminMode && (
                  <>
                    <label style={{ position: 'absolute', bottom: 0, left: 0, background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '10px', padding: '4px 6px', cursor: 'pointer', borderRadius: '4px' }}>
                      Cambiar <input type="file" accept="image/png, image/jpeg, image/webp, image/gif" onChange={(e) => handleImageUpload(el.id, e)} style={{ display: 'none' }} />
                    </label>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '15px', height: '15px', background: 'rgba(255,255,255,0.8)', cursor: 'nwse-resize', clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }} 
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

// --- PAGINAS ORIGINALES ---
function TabletExperience({ setPage }: { setPage: (page: Page) => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const images = getStoredImagesConfig();

  useEffect(() => {
    const update = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
      setProgress(Math.min(Math.max(-rect.top / travel, 0), 1));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const stage = progress < 0.34 ? 0 : progress < 0.67 ? 1 : 2;
  const penX = 18 + progress * 58;
  const penY = 34 + Math.sin(progress * Math.PI * 4) * 17;

  return (
    <div className="tablet-scroll" ref={sectionRef}>
      <div className="tablet-sticky">
        <div className="hero-grid">
          <Window title="FILE_VIEWER: MUNCHXINE.EXE" className="hero-window">
            <div className="hero-copy">
              <div className="hero-logo">Munchxine<br /><em>Safeplace!</em></div>
              <span className="welcome-chip">Welcome to my freaky portfolio page :3</span>
              <p className="eyebrow">DIGITAL ART · PERSONAL UNIVERSE</p>
              <h1>Your idea, your model, brought out of the drawing :3</h1>
              <p className="hero-description">2D illustration and models for VRChat.<br />Welcome to my creative world.</p>
              <Button variant="signal" onClick={() => setPage("portafolio")}>See my work <Send /></Button>
            </div>
            <div className="status-line"><span>STATUS: READY</span><span>STATION_04</span></div>
          </Window>
          <div className="tablet-column">
            <div className="tablet-shell">
              <div className="tablet-keys"><i /><b /><b /><b /><i /></div>
              <div className="tablet-screen">
                <div className="screen-grid" />
                <div className={`stage-art sketch ${stage === 0 ? "visible" : ""}`}><div className={`blueprint-avatar sketch`}><span className="head" /><span className="body" /><span className="arm left" /><span className="arm right" /><span className="leg left" /><span className="leg right" /></div></div>
                <div className={`stage-art lineart ${stage === 1 ? "visible" : ""}`}><div className={`blueprint-avatar line`}><span className="head" /><span className="body" /><span className="arm left" /><span className="arm right" /><span className="leg left" /><span className="leg right" /></div></div>
                <div className={`stage-art final ${stage === 2 ? "visible" : ""}`}><img src={images.homeProfile} alt="Ilustración final de Maxine" /></div>
                <div className="screen-readout"><span>ACTIVE_LAYER: 0{stage + 1}_{["SKETCH", "LINEART", "RENDER"][stage]}</span><span>PRESSURE: {Math.round(52 + progress * 35)}%</span><span>STYLUS: CONNECTED</span></div>
                <div className="stylus" style={{ left: `${penX}%`, top: `${penY}%` }}><span /></div>
              </div>
            </div>
            <div className="stage-panel">
              <div><span className="stage-index">0{stage + 1} / 03</span><h3>{stages[stage]?.title}</h3><p>{stages[stage]?.copy}</p></div>
              <div className="progress-track"><span style={{ width: `${Math.max(progress * 100, 5)}%` }} /></div>
            </div>
          </div>
        </div>
        <div className="scroll-cue"><span>BAJA PARA VER CÓMO EVOLUCIONA EL ARTE</span><ChevronDown /></div>
      </div>
    </div>
  );
}

function Home({ setPage }: { setPage: (page: Page) => void }) {
  const profile = getStoredProfile();
  const images = getStoredImagesConfig();
  return <><TabletExperience setPage={setPage} /><section className="intro-band"><Window title="Munchxine.txt"><div className="intro-copy"><img src={images.homeIntro} alt="Avatar de Maxine" /><div><p className="eyebrow">WELCOME_NOTE.LOG</p><h2>¡Haii! Mi nombre es {profile.name}.</h2><p>Soy un artista digital enfocado en el arte 2D, tando ilustracion como modelos Vtuber/Pngtuber. </p></div></div></Window></section><ProfileBand /></>;
}

function Portfolio() {
  const [category, setCategory] = useState("Todas las obras");
  const items: PortfolioItem[] = getStoredPortfolio();
  const filtered = category === "Todas las obras" ? items : items.filter(i => i.category === category);

  return (
    <main className="page-shell">
      <div className="page-heading"><p className="eyebrow">ARCHIVE://VISUAL_WORKS</p><h1>Portafolio de arte</h1><p>Dibujos, GIFs, videos, ideas y universos guardados en carpetas.</p></div>
      <div className="portfolio-layout">
        <Window title="Carpetas de Maxine" className="folder-window">
          {["Todas las obras", "Drawings", "Doodles", "Renders"].map((name) => (
            <Button key={name} variant={category === name ? "signal" : "station"} onClick={() => setCategory(name)}><Folder />{name}</Button>
          ))}
        </Window>
        <Window title={category} className="gallery-window">
          <div className="gallery-grid">
            {filtered.length === 0 ? (
              <p className="window-copy">No hay obras en esta categoría.</p>
            ) : (
              filtered.map((item) => (
                <article className="art-card" key={item.id}>
                  <div className="art-preview"><img src={item.image_path} alt={item.title} /></div>
                  <strong>{item.title}</strong>
                  <span>{item.category.toUpperCase()}</span>
                </article>
              ))
            )}
          </div>
        </Window>
      </div>
      <ProfileBand />
    </main>
  );
}

function PaintCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const colorRef = useRef<string>("#69a2ff");
  const eraserRef = useRef<boolean>(false);
  const brushSizeRef = useRef<number>(4);

  const [color, setColor] = useState("#69a2ff");
  const [eraser, setEraser] = useState(false);
  const [brushSize, setBrushSize] = useState(4);
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { eraserRef.current = eraser; }, [eraser]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const context = getCtx();
    if (!context) return;
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    context.lineWidth = brushSizeRef.current;
    context.lineCap = "round";
    context.lineJoin = "round";
    if (eraserRef.current) {
      context.globalCompositeOperation = "destination-out";
      context.strokeStyle = "rgba(0,0,0,1)";
    } else {
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = colorRef.current;
    }
    context.lineTo(x, y);
    context.stroke();
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    const context = getCtx();
    if (context) {
      context.beginPath();
      const rect = event.currentTarget.getBoundingClientRect();
      const scaleX = canvasRef.current!.width / rect.width;
      const scaleY = canvasRef.current!.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      context.moveTo(x, y);
    }
  };

  const clear = () => {
    const context = getCtx();
    if (context && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setSubmitStatus({ type: "error", msg: "Solo se permiten imágenes" }); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const context = getCtx();
      if (context && canvasRef.current && e.target?.result) {
        const img = new Image();
        img.onload = () => { context.globalCompositeOperation = "source-over"; context.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height); };
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("No canvas");
      const dataUrl = canvas.toDataURL("image/png");
      const localSubs = JSON.parse(localStorage.getItem("local_submissions") || "[]");
      localSubs.unshift({ id: Date.now().toString(), image_path: dataUrl, note: note.trim(), author: author.trim() || "Anónimo", approved: false, created_at: new Date().toISOString() });
      localStorage.setItem("local_submissions", JSON.stringify(localSubs));
      setSubmitStatus({ type: "success", msg: "¡Dibujo guardado localmente! Revísalo en el panel de admin ♡" });
      clear(); setNote(""); setAuthor("");
    } catch (err) {
      setSubmitStatus({ type: "error", msg: `No se pudo enviar` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Window title="Paint" className="paint-window">
      <p>Dibuja algo bonito que quieras que vea :3</p>
      <div className="paint-tools">
        <div className="color-palette">
          {colorPresets.map((c) => (
            <button key={c.value} className={`color-swatch ${color === c.value && !eraser ? "active" : ""}`} style={{ background: c.value }} onClick={() => { setColor(c.value); setEraser(false); }} title={c.name} aria-label={c.name} />
          ))}
          <label className="color-custom" title="Color personalizado"><Paintbrush size={14} /><input type="color" value={color} onChange={(e) => { setColor(e.target.value); setEraser(false); }} /></label>
        </div>
      </div>
      <div className="paint-controls">
        <Button variant={eraser ? "signal" : "station"} size="sm" onClick={() => setEraser(!eraser)}><Eraser size={14} /> Borrador</Button>
        <Button variant={!eraser ? "signal" : "station"} size="sm" onClick={() => { setEraser(false); }}><Brush size={14} /> Pincel</Button>
        <label className="brush-size-label"><span>Tamaño</span><input type="range" min={1} max={30} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} /><span className="brush-size-value">{brushSize}px</span></label>
        <Button variant="station" size="sm" onClick={clear}><RotateCcw size={14} /> Limpiar</Button>
      </div>
      <div className="upload-row">
        <label className="upload-button"><ImageIcon size={16} /><span>Subir imagen de tu PC</span><input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} /></label>
      </div>
      <canvas ref={canvasRef} width={440} height={220} style={{ touchAction: "none" }} onPointerDown={start} onPointerMove={draw} onPointerUp={() => drawingRef.current = false} onPointerLeave={() => drawingRef.current = false} />
      <Input className="paint-author" placeholder="Tu nombre (opcional)..." value={author} onChange={(e) => setAuthor(e.target.value)} />
      <Textarea placeholder="Una notita para Maxine..." value={note} onChange={(e) => setNote(e.target.value)} />
      {submitStatus && <p className={`submit-status ${submitStatus.type}`}>{submitStatus.msg}</p>}
      <Button variant="signal" onClick={submit} disabled={submitting}><Send />{submitting ? "Enviando..." : "Enviar dibujo ♡"}</Button>
    </Window>
  );
}

function GalleryDisplay() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localSubs = JSON.parse(localStorage.getItem("local_submissions") || "[]");
    setSubmissions(localSubs.filter((s: Submission) => s.approved));
    setLoading(false);
  }, []);

  if (loading) return <p className="window-copy">Cargando dibujos de la comunidad...</p>;
  if (submissions.length === 0) return <p className="window-copy">Aún no hay dibujos aprobados. ¡Sé el primero en enviar uno! ♡</p>;

  return (
    <div className="community-gallery">
      {submissions.map((s) => (
        <article className="community-art" key={s.id}><img src={s.image_path} alt={`Dibujo de ${s.author}`} /><div className="community-art-info"><strong>{s.author}</strong>{s.note && <p>{s.note}</p>}</div></article>
      ))}
    </div>
  );
}

function CommentThread({ comment, replies, adminMode, customEmojis, onReply, onDelete }: { comment: WallComment; replies: WallComment[]; adminMode: boolean; customEmojis: Array<{ name: string; url: string }>; onReply: (parentId: string, content: string, isAdmin: boolean) => void; onDelete: (id: string) => void; }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText, adminMode);
    setReplyText(""); setShowReplyBox(false); setShowEmojiPicker(false);
  };

  const renderFormattedContent = (text: string) => {
    const parts = text.split(/(\[emoji:[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("[emoji:") && part.endsWith("]")) {
        const emojiName = part.slice(7, -1);
        const found = customEmojis.find(e => e.name === emojiName);
        if (found) { return <img key={i} src={found.url} alt={emojiName} width={18} height={18} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' }} />; }
      }
      return part;
    });
  };

  return (
    <>
      <article className={`comment ${comment.is_admin_reply ? "admin-reply" : ""}`}>
        <div className="comment-header"><strong>{comment.author}{comment.is_admin_reply && <small className="admin-tag">ADMIN</small>}</strong><span className="comment-date">{new Date(comment.created_at).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>
        <p className="comment-content">{renderFormattedContent(comment.content)}</p>
        <div className="comment-actions">
          <button className="comment-action-btn" onClick={() => setShowReplyBox(!showReplyBox)}><CornerDownRight size={12} /> Responder</button>
          {adminMode && <button className="comment-action-btn danger" onClick={() => onDelete(comment.id)}><Trash2 size={12} /> Eliminar</button>}
        </div>
        {showReplyBox && (
          <div className="reply-box">
            <div className="emoji-row">
              <button className="emoji-toggle" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Smile size={16} /> Emojis</button>
              {showEmojiPicker && (
                <div className="emoji-picker" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', background: '#0a192f', padding: '8px', borderRadius: '6px' }}>
                  {customEmojis.map((emoji, idx) => (
                    <button key={idx} className="emoji-btn" onClick={() => setReplyText(replyText + ` [emoji:${emoji.name}] `)} style={{ background: 'transparent', border: '1px solid #1e3a8a', borderRadius: '4px', cursor: 'pointer', padding: '4px' }}>
                      <img src={emoji.url} alt={emoji.name} width={20} height={20} style={{ objectFit: 'contain' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Tu respuesta..." className="reply-textarea" />
            <Button variant="signal" size="sm" onClick={handleSendReply}><Send size={14} /> Enviar</Button>
          </div>
        )}
      </article>
      {replies.length > 0 && (
        <div className="reply-thread">
          {replies.map((reply) => (
            <article key={reply.id} className={`comment reply ${reply.is_admin_reply ? "admin-reply" : ""}`}>
              <div className="comment-header"><strong>{reply.author}{reply.is_admin_reply && <small className="admin-tag">ADMIN</small>}</strong><span className="comment-date">{new Date(reply.created_at).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>
              <p className="comment-content">{renderFormattedContent(reply.content)}</p>
              {adminMode && (
                <div className="comment-actions"><button className="comment-action-btn danger" onClick={() => onDelete(reply.id)}><Trash2 size={12} /> Eliminar</button></div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function Community({ adminMode }: { adminMode: boolean }) {
  const [comments, setComments] = useState<WallComment[]>([]);
  const [comment, setComment] = useState("");
  const [author, setAuthor] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const profile = getStoredProfile();
  const images = getStoredImagesConfig();
  const customEmojis = getStoredEmojis();

  useEffect(() => {
    setComments(JSON.parse(localStorage.getItem("local_comments") || "[]"));
    setLoading(false);
  }, []);

  const sendComment = () => {
    if (!comment.trim()) return;
    const finalAuthor = adminMode ? (author.trim() || profile.name) : (author.trim() || "Anónimo");
    const newC: WallComment = { id: Date.now().toString(), content: comment.trim(), author: finalAuthor, approved: true, is_admin_reply: adminMode ? true : false, parent_id: null, created_at: new Date().toISOString() };
    const updated = [newC, ...comments];
    setComments(updated); localStorage.setItem("local_comments", JSON.stringify(updated));
    setComment(""); setAuthor("");
    alert(adminMode ? "¡Comentario de admin publicado!" : "¡Comentario enviado! Aparecerá cuando Maxine lo apruebe.");
  };

  const sendReply = (parentId: string, content: string, isAdmin: boolean) => {
    const replyAuthor = isAdmin ? profile.name : "Anónimo";
    const newReply: WallComment = { id: Date.now().toString(), content, author: replyAuthor, approved: true, is_admin_reply: isAdmin, parent_id: parentId, created_at: new Date().toISOString() };
    const updated = [...comments, newReply];
    setComments(updated); localStorage.setItem("local_comments", JSON.stringify(updated));
  };

  const deleteComment = (id: string) => {
    const updated = comments.filter((c) => c.id !== id && c.parent_id !== id);
    setComments(updated); localStorage.setItem("local_comments", JSON.stringify(updated));
  };

  const topLevel = comments.filter((c) => !c.parent_id && (c.approved || adminMode));
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  return (
    <main className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">COMMUNITY://ONLINE</p>
        <h1>Mi rincón en internet ♡</h1>
        <p>Updates, pensamientos, comentarios y dibujitos de la comunidad.</p>
      </div>
      <div className="community-grid">
        <Window title="Muro de Maxine" className="wall">
          <article className="post">
            <div className="post-author"><img src={images.homeProfile} alt="Maxine" /><div><strong>{profile.name} <small>ADMIN / DEV :3C</small></strong><span>14 sept 2026, 0:24</span></div></div>
            <p>¡Haii! Bienvenidos al muro oficial de la web.</p>
          </article>
          {loading && <p className="window-copy">Cargando comentarios...</p>}
          {!loading && topLevel.length === 0 && <p className="window-copy">No hay comentarios todavía. ¡Sé el primero! ♡</p>}
          {topLevel.map((c) => (
            <CommentThread key={c.id} comment={c} replies={getReplies(c.id)} adminMode={adminMode} customEmojis={customEmojis} onReply={sendReply} onDelete={deleteComment} />
          ))}
          <div style={{ marginTop: '15px' }}>
            <Input className="comment-author-input" placeholder={adminMode ? `Tu nombre (${profile.name} Admin)...` : "Tu nombre..."} value={author} onChange={(e) => setAuthor(e.target.value)} style={{ marginBottom: '8px' }} />
            <div className="emoji-row" style={{ marginBottom: '8px' }}>
              <button className="emoji-toggle" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Smile size={16} /> Emojis personalizados</button>
              {showEmojiPicker && (
                <div className="emoji-picker" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', background: '#0a192f', padding: '8px', borderRadius: '6px', marginTop: '5px' }}>
                  {customEmojis.map((emoji: { name: string; url: string }, idx: number) => (
                    <button key={idx} className="emoji-btn" onClick={() => setComment(comment + ` [emoji:${emoji.name}] `)} style={{ background: 'transparent', border: '1px solid #1e3a8a', borderRadius: '4px', cursor: 'pointer', padding: '4px' }}>
                      <img src={emoji.url} alt={emoji.name} width={20} height={20} style={{ objectFit: 'contain' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tu comentario..." />
            <Button variant="signal" onClick={sendComment} disabled={!comment.trim()} style={{ marginTop: '8px' }}><MessageCircle /> Enviar comentario</Button>
          </div>
        </Window>
        <div className="community-side">
          <Window title="Bocetos y rayones"><p className="window-copy">Favoritos elegidos por Maxi</p><GalleryDisplay /></Window>
          <PaintCanvas />
          <Window title="Notita"><p className="window-copy">Los comentarios de usuarios aparecen cuando Maxine los aprueba.</p></Window>
        </div>
      </div>
      <ProfileBand />
    </main>
  );
}

function About({ adminMode }: { adminMode: boolean }) {
  const images = getStoredImagesConfig();
  return (
    <main className="page-shell narrow">
      <div className="page-heading">
        <p className="eyebrow">PROFILE://ABOUT</p>
        <h1>Sobre Mí.</h1>
        <p>Mi pequeño rincón personal estilo Strawpage</p>
      </div>
      <div className="about-stack">
        <Window title="ABOUT_MAXINE.TXT">
          <div className="about-note">
            <img src={images.aboutMain} alt="Avatar Maxine" />
            <p>✨ ¡Haii! Bienvenidos a mi Strawpage personal. Aquí comparto un poco sobre mí, mis gustos y rayones favoritos.</p>
          </div>
        </Window>
        <Window title="MY_UNIVERSE.EXE">
          <StrawpageCanvas adminMode={adminMode} />
        </Window>
      </div>
      <ProfileBand />
    </main>
  );
}

// --- NUEVA PESTAÑA CONTACTO (CHAT) ---
function Contact() {
  const profile = getStoredProfile();
  const images = getStoredImagesConfig();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(localStorage.getItem("user_active_chat"));
  const [threads, setThreads] = useState<ChatThread[]>(JSON.parse(localStorage.getItem("site_chat_threads") || "[]"));
  
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [initialMsg, setInitialMsg] = useState("");
  const [replyMsg, setReplyMsg] = useState("");

  useEffect(() => {
    const interval = setInterval(() => { setThreads(JSON.parse(localStorage.getItem("site_chat_threads") || "[]")); }, 2000);
    return () => clearInterval(interval);
  }, []);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const startChat = () => {
    if (!name.trim() || !initialMsg.trim()) return;
    const newThread: ChatThread = {
      id: Date.now().toString(), userName: name, contactInfo: contactInfo, unreadAdmin: true, unreadUser: false,
      messages: [{ id: Date.now().toString(), sender: "user", text: initialMsg, timestamp: new Date().toISOString() }]
    };
    const updated = [...threads, newThread];
    localStorage.setItem("site_chat_threads", JSON.stringify(updated));
    localStorage.setItem("user_active_chat", newThread.id);
    setThreads(updated); setActiveThreadId(newThread.id);
  };

  const sendReply = () => {
    if (!replyMsg.trim() || !activeThread) return;
    const updatedThreads = threads.map(t => {
      if (t.id === activeThread.id) {
        return { ...t, unreadAdmin: true, messages: [...t.messages, { id: Date.now().toString(), sender: "user", text: replyMsg, timestamp: new Date().toISOString() }] };
      }
      return t;
    });
    localStorage.setItem("site_chat_threads", JSON.stringify(updatedThreads));
    setThreads(updatedThreads); setReplyMsg("");
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
            <img src={images.homeProfile} alt="Avatar" />
            <div>
              <p className="eyebrow">@Munchxine_</p>
              <h2>{profile.name}</h2>
              <p>Escríbeme y hablemos en directo ✨</p>
            </div>
          </div>
          <div className="info-grid">
            <span><b>Nombre</b>Anthony Benjamin</span><span><b>Pronombres</b>He / Him</span>
            <span><b>Edad</b>20 y/o</span><span><b>Ubicación</b>Penco, Chile 🇨🇱</span>
          </div>
          <Input placeholder="Tu nombre o apodo..." value={name} onChange={e => setName(e.target.value)} style={{ marginTop: '15px' }} />
          <Input placeholder="Tu correo o red social (opcional)..." value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
          <Textarea placeholder="¡Hola Maxine! Me gustaría..." value={initialMsg} onChange={e => setInitialMsg(e.target.value)} />
          <Button variant="signal" onClick={startChat} disabled={!name.trim() || !initialMsg.trim()}>
            <Send /> Iniciar Chat
          </Button>
        </Window>
      ) : (
        <Window title={`Chat con Maxine`} className="contact-card">
          <div style={{ height: '300px', overflowY: 'auto', background: 'rgba(10, 25, 47, 0.5)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {activeThread?.messages.map(msg => (
              <div key={msg.id} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", background: msg.sender === "user" ? "rgba(105, 162, 255, 0.4)" : "rgba(22, 78, 99, 0.7)", padding: '8px 12px', borderRadius: '8px', maxWidth: '80%' }}>
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

// --- ADMIN PANEL CON TODO LO VIEJO Y LO NUEVO ---
function AdminPanel({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"envios" | "comentarios" | "chat" | "organizador" | "perfil" | "imagenes" | "emojis" | "musica" | "shimeji">("chat");
  const profile = getStoredProfile();

  // Estados originales
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allComments, setAllComments] = useState<WallComment[]>([]);
  const [imagesConfig, setImagesConfig] = useState(getStoredImagesConfig());
  const [emojis, setEmojis] = useState<Array<{ name: string; url: string }>>(getStoredEmojis());
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(getStoredPortfolio());
  const [newArtTitle, setNewArtTitle] = useState("");
  const [newArtCategory, setNewArtCategory] = useState("Drawings");
  const [newArtImage, setNewArtImage] = useState("");
  const [newEmojiName, setNewEmojiName] = useState("");
  const [newEmojiImg, setNewEmojiImg] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState(getStoredSpotify());
  const [shimejiConfig, setShimejiConfig] = useState(getStoredShimejiConfig());

  // Estados nuevos (Chat, Organizador)
  const [threads, setThreads] = useState<ChatThread[]>(JSON.parse(localStorage.getItem("site_chat_threads") || "[]"));
  const [adminReply, setAdminReply] = useState("");
  const [tasks, setTasks] = useState<KanbanTask[]>(JSON.parse(localStorage.getItem("admin_kanban_tasks") || "[]"));
  const [newTaskText, setNewTaskText] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>(JSON.parse(localStorage.getItem("admin_calendar_events") || "[]"));
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [eventNote, setEventNote] = useState("");

  useEffect(() => {
    setSubmissions(JSON.parse(localStorage.getItem("local_submissions") || "[]"));
    setAllComments(JSON.parse(localStorage.getItem("local_comments") || "[]"));
  }, []);

  useEffect(() => {
    if (activeTab === "chat") {
      const interval = setInterval(() => setThreads(JSON.parse(localStorage.getItem("site_chat_threads") || "[]")), 2000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Funciones originales
  const handleImgConfigUpload = (key: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) { const updated = { ...imagesConfig, [key]: ev.target.result as string }; setImagesConfig(updated); localStorage.setItem("site_images_config", JSON.stringify(updated)); } };
    reader.readAsDataURL(file);
  };
  const addEmoji = () => {
    if (!newEmojiName.trim() || !newEmojiImg) return;
    const updated = [...emojis, { name: newEmojiName.trim().toLowerCase(), url: newEmojiImg }];
    setEmojis(updated); localStorage.setItem("site_custom_emojis", JSON.stringify(updated)); setNewEmojiName(""); setNewEmojiImg("");
  };
  const addPortfolio = () => {
    if (!newArtTitle.trim() || !newArtImage) return;
    const item: PortfolioItem = { id: Date.now().toString(), title: newArtTitle.trim(), category: newArtCategory, image_path: newArtImage };
    const updated = [item, ...portfolioItems]; setPortfolioItems(updated); localStorage.setItem("site_portfolio", JSON.stringify(updated)); setNewArtTitle(""); setNewArtImage("");
  };

  // Funciones Chat
  const replyToThread = (threadId: string) => {
    if (!adminReply.trim()) return;
    const updated = threads.map(t => {
      if (t.id === threadId) { return { ...t, unreadUser: true, unreadAdmin: false, messages: [...t.messages, { id: Date.now().toString(), sender: "admin", text: adminReply, timestamp: new Date().toISOString() }] }; }
      return t;
    });
    localStorage.setItem("site_chat_threads", JSON.stringify(updated)); setThreads(updated); setAdminReply("");
  };
  const deleteThread = (threadId: string) => {
    const updated = threads.filter(t => t.id !== threadId);
    localStorage.setItem("site_chat_threads", JSON.stringify(updated)); setThreads(updated);
  };

  // Funciones Organizador
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTasks = [...tasks, { id: Date.now().toString(), text: newTaskText, status: "todo" as const }];
    setTasks(newTasks); localStorage.setItem("admin_kanban_tasks", JSON.stringify(newTasks)); setNewTaskText("");
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

  // z-index en 9990 para que el Shimeji (10005) se vea por encima
  return (
    <div className="admin-panel" style={{ zIndex: 9990 }}>
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2><LockKeyhole size={18} /> Panel de Administración</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="destructive" size="sm" onClick={onLogout}><LogOut size={14} /> Cerrar sesión</Button>
          <Button variant="station" size="sm" onClick={onClose}><X size={14} /> Cerrar</Button>
        </div>
      </div>

      <div className="admin-tabs-nav" style={{ display: 'flex', gap: '5px', background: 'rgba(10, 25, 47, 0.8)', padding: '8px', borderRadius: '6px', marginBottom: '20px', border: '1px solid rgba(30, 58, 138, 0.5)', flexWrap: 'wrap' }}>
        <Button variant={activeTab === "chat" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("chat")}><Inbox size={14}/> Bandeja de Chat</Button>
        <Button variant={activeTab === "organizador" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("organizador")}><Kanban size={14}/> Organizador</Button>
        <Button variant={activeTab === "envios" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("envios")}>Envíos de Arte</Button>
        <Button variant={activeTab === "comentarios" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("comentarios")}>Muro</Button>
        <Button variant={activeTab === "perfil" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("perfil")}>Perfil</Button>
        <Button variant={activeTab === "imagenes" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("imagenes")}>Galería e Imágenes</Button>
        <Button variant={activeTab === "emojis" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("emojis")}>Emojis</Button>
        <Button variant={activeTab === "musica" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("musica")}>Música</Button>
        <Button variant={activeTab === "shimeji" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("shimeji")}>Shimeji</Button>
      </div>

      {activeTab === "chat" && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', maxHeight: '500px' }}>
          <div style={{ background: 'rgba(15, 32, 59, 0.8)', padding: '10px', borderRadius: '8px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Conversaciones Activas</h3>
            {threads.length === 0 && <p style={{ fontSize: '12px', color: '#889' }}>No hay mensajes nuevos.</p>}
            {threads.map(t => (
              <div key={t.id} style={{ background: 'rgba(10, 25, 47, 0.8)', padding: '10px', borderRadius: '6px', marginBottom: '8px', borderLeft: t.unreadAdmin ? '3px solid #4ade80' : '3px solid transparent' }}>
                <strong style={{ display: 'block', fontSize: '13px' }}>{t.userName} {t.unreadAdmin && <span style={{ color: '#4ade80', fontSize: '10px' }}>¡Nuevo!</span>}</strong>
                <span style={{ fontSize: '10px', color: '#889' }}>{t.contactInfo}</span>
                <details style={{ marginTop: '5px', fontSize: '12px' }}>
                  <summary style={{ cursor: 'pointer', color: '#69a2ff', fontWeight: 'bold' }}>Ver conversación / Responder</summary>
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {t.messages.map(m => (
                      <div key={m.id} style={{ background: m.sender === 'admin' ? 'rgba(22, 78, 99, 0.7)' : 'rgba(30, 58, 138, 0.5)', padding: '8px', borderRadius: '4px' }}>
                        <b style={{ fontSize: '10px', color: '#caddff' }}>{m.sender === "admin" ? profile.name : t.userName}:</b> <br/><span style={{ fontSize: '13px' }}>{m.text}</span>
                      </div>
                    ))}
                    <Textarea value={adminReply} onChange={e => setAdminReply(e.target.value)} placeholder="Escribe tu respuesta aquí..." style={{ minHeight: '60px', marginTop: '5px' }} />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                      <Button variant="signal" size="sm" onClick={() => replyToThread(t.id)}>Enviar Respuesta</Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteThread(t.id)}>Borrar Chat</Button>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "organizador" && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'rgba(15, 32, 59, 0.8)', padding: '15px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}><Kanban size={16}/> Tareas (Notion Style)</h3>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
              <Input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="Nueva idea/tarea..." />
              <Button variant="signal" onClick={handleAddTask}><Plus size={16}/></Button>
            </div>
            {["todo", "doing", "done"].map(status => (
              <div key={status} style={{ marginBottom: '15px' }}>
                <h4 style={{ fontSize: '12px', color: '#69a2ff', textTransform: 'uppercase', marginBottom: '5px' }}>{status === 'todo' ? 'Por hacer' : status === 'doing' ? 'En proceso' : 'Terminado'}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {tasks.filter(t => t.status === status).map(t => (
                    <div key={t.id} style={{ background: 'rgba(10, 25, 47, 0.6)', padding: '8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(30, 58, 138, 0.5)' }}>
                      <span style={{ fontSize: '13px', textDecoration: status === 'done' ? 'line-through' : 'none', color: status === 'done' ? '#8892b0' : 'white' }}>{t.text}</span>
                      <select value={t.status} onChange={e => updateTaskStatus(t.id, e.target.value as any)} style={{ background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '3px', fontSize: '10px', padding: '4px', cursor: 'pointer' }}>
                        <option value="todo">Por hacer</option>
                        <option value="doing">En proceso</option>
                        <option value="done">Terminado</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(15, 32, 59, 0.8)', padding: '15px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={16}/> Calendario de Comisiones / Notas</h3>
            <Input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setEventNote(events.find(ev => ev.date === e.target.value)?.note || ""); }} style={{ marginBottom: '10px' }} />
            <Textarea value={eventNote} onChange={e => setEventNote(e.target.value)} placeholder="Notas, entregas o ideas para este día..." style={{ height: '120px', marginBottom: '10px' }} />
            <Button variant="signal" onClick={saveEvent} style={{ width: '100%' }}>Guardar Nota del Día</Button>
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '12px', color: '#69a2ff', marginBottom: '10px' }}>Próximos Eventos</h4>
              {events.length === 0 && <p style={{ fontSize: '11px', color: '#8892b0' }}>No hay eventos guardados.</p>}
              {events.slice(0, 5).map(e => (
                <div key={e.date} style={{ background: 'rgba(10, 25, 47, 0.6)', padding: '8px', borderRadius: '4px', marginBottom: '5px', fontSize: '12px', border: '1px solid rgba(30, 58, 138, 0.5)' }}>
                  <b style={{ color: '#4ade80' }}>{new Date(e.date).toLocaleDateString('es')}:</b> {e.note}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESTO DE PESTAÑAS ORIGINALES (MANTENIDAS EXACTAMENTE IGUAL) */}
      {activeTab === "envios" && (
        submissions.length === 0 ? (<p className="window-copy">No hay envíos de dibujos todavía.</p>) : (
          <div className="admin-grid">
            {submissions.map((s) => (
              <article key={s.id} className={`admin-card ${s.approved ? "approved" : "pending"}`}>
                <div className="admin-card-image"><img src={s.image_path} alt={`Dibujo`} /><span className={`admin-badge ${s.approved ? "badge-approved" : "badge-pending"}`}>{s.approved ? "APROBADO" : "PENDIENTE"}</span></div>
                <div className="admin-card-info"><strong>{s.author}</strong>{s.note && <p>{s.note}</p>}<span className="admin-date">{new Date(s.created_at).toLocaleString("es")}</span></div>
                <div className="admin-card-actions">
                  {!s.approved ? (<Button variant="signal" size="sm" onClick={() => { const updated = submissions.map(sub => sub.id === s.id ? { ...sub, approved: true } : sub); setSubmissions(updated); localStorage.setItem("local_submissions", JSON.stringify(updated)); }}><Check size={14} /> Aprobar</Button>) : (<Button variant="station" size="sm" onClick={() => { const updated = submissions.map(sub => sub.id === s.id ? { ...sub, approved: false } : sub); setSubmissions(updated); localStorage.setItem("local_submissions", JSON.stringify(updated)); }}><Eye size={14} /> Ocultar</Button>)}
                  <Button variant="destructive" size="sm" onClick={() => { const updated = submissions.filter(sub => sub.id !== s.id); setSubmissions(updated); localStorage.setItem("local_submissions", JSON.stringify(updated)); }}><Trash2 size={14} /> Eliminar</Button>
                </div>
              </article>
            ))}
          </div>
        )
      )}

      {activeTab === "comentarios" && (
        <div style={{ padding: '20px', background: 'rgba(15, 32, 59, 0.8)', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px' }}>Moderar Comentarios del Muro</h3>
          {allComments.length === 0 ? (<p className="window-copy">No hay comentarios en el muro.</p>) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allComments.map((c) => (
                <div key={c.id} style={{ background: 'rgba(10, 25, 47, 0.6)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(30, 58, 138, 0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><strong>{c.author}</strong> <span style={{ fontSize: '11px', color: '#8892b0' }}>{new Date(c.created_at).toLocaleString("es")}</span><p style={{ margin: '5px 0', fontSize: '13px' }}>{c.content}</p><span style={{ fontSize: '10px', color: c.approved ? '#4ade80' : '#facc15' }}>{c.approved ? "APROBADO" : "PENDIENTE"}</span></div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {!c.approved ? (<Button variant="signal" size="sm" onClick={() => { const updated = allComments.map(item => item.id === c.id ? { ...item, approved: true } : item); setAllComments(updated); localStorage.setItem("local_comments", JSON.stringify(updated)); }}>Aprobar</Button>) : (<Button variant="station" size="sm" onClick={() => { const updated = allComments.map(item => item.id === c.id ? { ...item, approved: false } : item); setAllComments(updated); localStorage.setItem("local_comments", JSON.stringify(updated)); }}>Ocultar</Button>)}
                    <Button variant="destructive" size="sm" onClick={() => { const updated = allComments.filter(item => item.id !== c.id); setAllComments(updated); localStorage.setItem("local_comments", JSON.stringify(updated)); }}>Eliminar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "perfil" && (
        <div style={{ padding: '20px', background: 'rgba(15, 32, 59, 0.8)', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '20px' }}>Datos de perfil</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '150px', textAlign: 'center' }}>
              <img src={profile.avatar} alt="Profile" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', border: '1px solid #1e3a8a', marginBottom: '10px' }} />
            </div>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{ fontSize: '10px', color: '#69a2ff', textTransform: 'uppercase', letterSpacing: '1px' }}>Nombre de usuario</label>
              <Input value={profile.name} onChange={(e) => {
                const updated = { ...profile, name: e.target.value };
                localStorage.setItem("site_profile", JSON.stringify(updated));
              }} style={{ marginTop: '8px', marginBottom: '15px' }} />
              <Button variant="signal" style={{ width: '100%' }} onClick={() => alert("¡Perfil guardado!")}>GUARDAR PERFIL</Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "imagenes" && (
        <div style={{ padding: '20px', background: 'rgba(15, 32, 59, 0.8)', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px' }}>Imágenes del Sitio</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            {[ { key: "homeProfile", label: "Inicio (Perfil)" }, { key: "homeDirects", label: "Inicio (Accesos)" }, { key: "homeIntro", label: "Inicio (Intro)" }, { key: "aboutMain", label: "About" }, { key: "credential", label: "Contacto (Credencial)" }].map((item) => (
              <div key={item.key} style={{ background: 'rgba(10, 25, 47, 0.6)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>{item.label}</span>
                <img src={imagesConfig[item.key]} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', margin: '0 auto 8px', display: 'block' }} />
                <label className="upload-button" style={{ background: '#1e3a8a', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'inline-block' }}>Cambiar<input type="file" accept="image/*" onChange={(e) => handleImgConfigUpload(item.key, e)} style={{ display: 'none' }} /></label>
              </div>
            ))}
          </div>

          <h3 style={{ marginBottom: '15px' }}>Gestión de Portafolio</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <Input placeholder="Título de la obra..." value={newArtTitle} onChange={(e) => setNewArtTitle(e.target.value)} />
            <select value={newArtCategory} onChange={(e) => setNewArtCategory(e.target.value)} style={{ background: '#0a192f', color: 'white', padding: '8px', borderRadius: '6px' }}>
              <option value="Drawings">Drawings</option><option value="
