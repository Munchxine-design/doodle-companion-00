import { useEffect, useRef, useState, type PointerEvent, type ChangeEvent, createContext, useContext } from "react";
import { Brush, Check, ChevronDown, Coffee, CornerDownRight, Eraser, Eye, Folder, Image as ImageIcon, LockKeyhole, Menu, MessageCircle, Minus, Orbit, Paintbrush, Play, RotateCcw, Send, Smile, Sparkles, Square, Trash2, X, Plus, Calendar as CalendarIcon, MessageSquare } from "lucide-react";
import avatarAsset from "@/assets/teridayo-avatar.png.asset.json";
import orcaAsset from "@/assets/orca-credential.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Page = "inicio" | "portafolio" | "comunidad" | "sobre-mi" | "contacto";

// --- CONTEXTO GLOBAL PARA DATOS LOCALES Y ADMIN ---
const SiteContext = createContext<any>(null);

function useSiteData() {
  const [profileName, setProfileName] = useState(() => localStorage.getItem("site_name") || "Maxine");
  const [profileAvatar, setProfileAvatar] = useState(() => localStorage.getItem("site_avatar") || avatarAsset.url);
  const [credentialImg, setCredentialImg] = useState(() => localStorage.getItem("site_credential") || orcaAsset.url);
  const [emojis, setEmojis] = useState(() => JSON.parse(localStorage.getItem("site_emojis") || '["♡", "✨", "🎨", "💕", "🌟", "🌈", "🥺", "😭", "💖", "🐛"]'));
  const [strawBlocks, setStrawBlocks] = useState(() => JSON.parse(localStorage.getItem("site_strawblocks") || "[]"));
  const [todos, setTodos] = useState(() => JSON.parse(localStorage.getItem("site_todos") || "[]"));
  const [chatMessages, setChatMessages] = useState(() => JSON.parse(localStorage.getItem("site_chats") || "[]"));

  const saveState = (key: string, value: any, setter: any) => {
    setter(value);
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  };

  return {
    profileName, setProfileName: (v: string) => saveState("site_name", v, setProfileName),
    profileAvatar, setProfileAvatar: (v: string) => saveState("site_avatar", v, setProfileAvatar),
    credentialImg, setCredentialImg: (v: string) => saveState("site_credential", v, setCredentialImg),
    emojis, setEmojis: (v: string[]) => saveState("site_emojis", v, setEmojis),
    strawBlocks, setStrawBlocks: (v: any[]) => saveState("site_strawblocks", v, setStrawBlocks),
    todos, setTodos: (v: any[]) => saveState("site_todos", v, setTodos),
    chatMessages, setChatMessages: (v: any[]) => saveState("site_chats", v, setChatMessages),
  };
}

// --- UTILIDAD PARA LEER IMÁGENES LOCALES (PC) ---
const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { if (ev.target?.result) callback(ev.target.result as string); };
  reader.readAsDataURL(file);
};

// --- COMPONENTES BÁSICOS ---
function Window({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`station-window ${className}`}>
      <div className="window-bar">
        <span><Sparkles size={12} /> {title}</span>
        <div className="window-controls"><Minus /><Square /><X /></div>
      </div>
      {children}
    </section>
  );
}

function Header({ page, setPage, onAdminAccess }: { page: Page; setPage: (page: Page) => void; onAdminAccess: () => void }) {
  const [open, setOpen] = useState(false);
  const nav: Array<{ id: Page; label: string }> = [
    { id: "inicio", label: "Inicio" }, { id: "portafolio", label: "Portafolio" },
    { id: "comunidad", label: "Comunidad" }, { id: "sobre-mi", label: "Sobre mí" }, { id: "contacto", label: "Contacto" },
  ];
  return (
    <>
      <header className="site-header">
        <button className="brand" onClick={() => setPage("inicio")}><Orbit /> Munchxine!</button>
        <Button variant="ghost" size="icon" className="mobile-menu" onClick={() => setOpen(!open)}><Menu /></Button>
        <nav className={open ? "nav-list is-open" : "nav-list"}>
          {nav.map((item) => (
            <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => { setPage(item.id); setOpen(false); }}>{item.label}</button>
          ))}
          <button onClick={onAdminAccess}><LockKeyhole size={14} /> Admin</button>
        </nav>
      </header>
    </>
  );
}

// --- PERFIL LATERAL ---
function ProfileBand() {
  const { profileName, profileAvatar } = useContext(SiteContext);
  return (
    <section className="profile-band">
      <Window title="Munchxine_profile.exe">
        <div className="profile-content">
          <img src={profileAvatar} alt="Avatar" style={{ borderRadius: '8px' }} />
          <div>
            <p className="eyebrow">HIYAAA!!</p>
            <h2>{profileName}</h2>
            <p>Artista chileno • Arte 2D y 3D • ESP / ENG</p>
          </div>
        </div>
      </Window>
    </section>
  );
}

// --- LIENZO 100% FUNCIONAL ---
function PaintCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [color, setColor] = useState("#69a2ff");
  const [eraser, setEraser] = useState(false);
  const [brushSize, setBrushSize] = useState(4);
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const colorPresets = ["#69a2ff", "#ff6b9d", "#4ade80", "#fb923c", "#facc15", "#a78bfa", "#22d3ee", "#ffffff", "#1a1a2e"];

  const getCtx = () => canvasRef.current?.getContext("2d");

  const start = (e: PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    ctx.beginPath();
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.moveTo((e.clientX - rect.left) * (canvasRef.current.width / rect.width), (e.clientY - rect.top) * (canvasRef.current.height / rect.height));
  };

  const draw = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canvasRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
    ctx.strokeStyle = eraser ? "rgba(0,0,0,1)" : color;
    ctx.lineTo((e.clientX - rect.left) * (canvasRef.current.width / rect.width), (e.clientY - rect.top) * (canvasRef.current.height / rect.height));
    ctx.stroke();
  };

  const clear = () => getCtx()?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

  const submit = () => {
    if (!canvasRef.current) return;
    const base64 = canvasRef.current.toDataURL("image/png");
    // Respaldo local garantizado
    const localSubs = JSON.parse(localStorage.getItem("local_submissions") || "[]");
    localSubs.push({ id: Date.now().toString(), image_path: base64, note, author: author || "Anónimo", approved: false, created_at: new Date().toISOString() });
    localStorage.setItem("local_submissions", JSON.stringify(localSubs));
    
    setStatus({ type: "success", msg: "¡Dibujo guardado! Búscalo en Envíos de Admin." });
    clear(); setNote(""); setAuthor("");
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <Window title="Paint" className="paint-window">
      <div className="paint-tools">
        <div className="color-palette" style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
          {colorPresets.map((c) => (
            <button key={c} style={{ width: '20px', height: '20px', background: c, border: color === c && !eraser ? '2px solid white' : 'none', borderRadius: '4px' }} onClick={() => { setColor(c); setEraser(false); }} />
          ))}
          <input type="color" value={color} onChange={(e) => { setColor(e.target.value); setEraser(false); }} />
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button variant={eraser ? "signal" : "station"} size="sm" onClick={() => setEraser(!eraser)}><Eraser size={14} /> Borrador</Button>
          <Button variant={!eraser ? "signal" : "station"} size="sm" onClick={() => setEraser(false)}><Brush size={14} /> Pincel</Button>
          <input type="range" min={1} max={30} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
          <Button variant="station" size="sm" onClick={clear}><RotateCcw size={14} /> Limpiar</Button>
        </div>
        <label className="upload-button" style={{ display: 'flex', gap: '5px', marginTop: '10px', cursor: 'pointer', color: '#69a2ff' }}>
          <ImageIcon size={16} /> Subir imagen de PC
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileUpload(e, (b64) => {
            const img = new Image();
            img.onload = () => getCtx()?.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
            img.src = b64;
          })} />
        </label>
      </div>
      <canvas ref={canvasRef} width={440} height={220} style={{ touchAction: "none", background: 'white', borderRadius: '4px', marginTop: '10px', width: '100%' }} onPointerDown={start} onPointerMove={draw} onPointerUp={() => drawingRef.current = false} onPointerLeave={() => drawingRef.current = false} />
      <Input placeholder="Tu nombre..." value={author} onChange={(e) => setAuthor(e.target.value)} style={{ marginTop: '10px' }} />
      <Textarea placeholder="Notita para Teri..." value={note} onChange={(e) => setNote(e.target.value)} style={{ marginTop: '5px', marginBottom: '10px' }} />
      {status && <p style={{ color: status.type === 'success' ? '#4ade80' : '#ef4444' }}>{status.msg}</p>}
      <Button variant="signal" onClick={submit}><Send size={14} /> Enviar dibujo</Button>
    </Window>
  );
}

// --- STRAWPAGE DRAGGABLE COMPONENT ---
function DraggableBlock({ block, adminMode }: { block: any; adminMode: boolean }) {
  const { strawBlocks, setStrawBlocks } = useContext(SiteContext);
  const [pos, setPos] = useState({ x: block.x || 0, y: block.y || 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPos(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    };
    const handleUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      const updated = strawBlocks.map((b: any) => b.id === block.id ? { ...b, x: pos.x, y: pos.y } : b);
      setStrawBlocks(updated);
    };
    if (isDragging) { window.addEventListener("mousemove", handleMove); window.addEventListener("mouseup", handleUp); }
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [isDragging, pos, strawBlocks]);

  return (
    <div style={{ position: 'absolute', left: pos.x, top: pos.y, cursor: adminMode ? 'move' : 'default', padding: '5px', border: adminMode ? '1px dashed #69a2ff' : 'none' }} onMouseDown={() => adminMode && setIsDragging(true)}>
      {adminMode && <button onClick={() => setStrawBlocks(strawBlocks.filter((b: any) => b.id !== block.id))} style={{ position: 'absolute', top: -10, right: -10, background: 'red', color: 'white', borderRadius: '50%', width: '20px' }}>X</button>}
      {block.type === 'text' ? <p style={{ color: 'white', fontWeight: 'bold' }}>{block.content}</p> : <img src={block.content} alt="Straw block" style={{ maxWidth: '150px', borderRadius: '8px' }} />}
    </div>
  );
}

// --- SECCIONES PRINCIPALES ---
function About({ adminMode }: { adminMode: boolean }) {
  const { strawBlocks, setStrawBlocks } = useContext(SiteContext);
  return (
    <main className="page-shell narrow">
      <div className="page-heading">
        <p className="eyebrow">PROFILE://ABOUT</p>
        <h1>Sobre Mí.</h1>
        <p>Mi rincón libre tipo Strawpage</p>
      </div>
      <Window title="INTERESTS.LOG" className="strawpage-container" style={{ position: 'relative', height: '600px', overflow: 'hidden', background: '#0a192f' }}>
        {adminMode && (
          <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', gap: '10px' }}>
            <Button variant="signal" size="sm" onClick={() => setStrawBlocks([...strawBlocks, { id: Date.now(), type: 'text', content: 'Nuevo texto', x: 50, y: 50 }])}>+ Texto</Button>
            <label className="upload-button"><ImageIcon size={14}/> + Imagen<input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, (b64) => setStrawBlocks([...strawBlocks, { id: Date.now(), type: 'image', content: b64, x: 100, y: 100 }]))}/></label>
          </div>
        )}
        {strawBlocks.map((b: any) => <DraggableBlock key={b.id} block={b} adminMode={adminMode} />)}
      </Window>
    </main>
  );
}

function Contact() {
  const { profileName, profileAvatar, credentialImg, chatMessages, setChatMessages } = useContext(SiteContext);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");

  const send = () => {
    if (!msg.trim()) return;
    setChatMessages([...chatMessages, { id: Date.now(), sender: "Visitante", text: msg, date: new Date().toLocaleString() }]);
    setMsg("");
    alert("¡Correo simulado enviado a Teri! Revisa el panel de admin.");
  };

  return (
    <main className="page-shell narrow">
      <button className="credential-button" onClick={() => setOpen(true)}><img src={credentialImg} alt="Credencial" /><span>[ ABRIR CHAT ]</span></button>
      {open && (
        <Window title="Chat en Vivo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <img src={profileAvatar} width={40} style={{ borderRadius: '50%' }} /> <strong>{profileName}</strong>
          </div>
          <div style={{ height: '200px', overflowY: 'auto', background: '#0f203b', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
            {chatMessages.map((c: any) => (
              <div key={c.id} style={{ textAlign: c.sender === "Admin" ? "right" : "left", marginBottom: '10px' }}>
                <strong style={{ color: c.sender === "Admin" ? "#4ade80" : "#69a2ff" }}>{c.sender}</strong>
                <p style={{ background: '#1e3a8a', padding: '8px', borderRadius: '8px', display: 'inline-block' }}>{c.text}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escribe tu mensaje..." />
            <Button variant="signal" onClick={send}><Send size={14} /></Button>
          </div>
        </Window>
      )}
    </main>
  );
}

// --- PANEL DE ADMINISTRACIÓN COMPLETO ---
function AdminPanel({ onClose }: { onClose: () => void }) {
  const { profileName, setProfileName, profileAvatar, setProfileAvatar, credentialImg, setCredentialImg, emojis, setEmojis, todos, setTodos, chatMessages, setChatMessages } = useContext(SiteContext);
  const [activeTab, setActiveTab] = useState("perfil");
  const [localDrawings, setLocalDrawings] = useState(() => JSON.parse(localStorage.getItem("local_submissions") || "[]"));
  const [newEmoji, setNewEmoji] = useState("");
  const [adminReply, setAdminReply] = useState("");

  const deleteDrawing = (id: string) => {
    const updated = localDrawings.filter((d: any) => d.id !== id);
    setLocalDrawings(updated);
    localStorage.setItem("local_submissions", JSON.stringify(updated));
  };

  return (
    <div className="admin-panel" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 9999, overflowY: 'auto', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', background: '#0a192f', padding: '20px', borderRadius: '12px', border: '1px solid #1e3a8a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2><LockKeyhole size={18} /> Panel Admin</h2>
          <Button variant="destructive" onClick={onClose}><X size={14} /> Cerrar</Button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {["envios", "perfil", "imagenes", "emojis", "chat", "organizador"].map(t => (
            <Button key={t} variant={activeTab === t ? "signal" : "station"} onClick={() => setActiveTab(t)}>{t.toUpperCase()}</Button>
          ))}
        </div>

        {activeTab === "perfil" && (
          <div>
            <h3>Datos de Perfil Global</h3>
            <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} style={{ margin: '10px 0' }} />
            <img src={profileAvatar} width={100} style={{ borderRadius: '8px', display: 'block', marginBottom: '10px' }} />
            <label className="upload-button"><ImageIcon size={14}/> Cambiar Avatar <input type="file" style={{display:'none'}} onChange={(e) => handleFileUpload(e, setProfileAvatar)}/></label>
          </div>
        )}

        {activeTab === "imagenes" && (
          <div>
            <h3>Credencial de Contacto</h3>
            <img src={credentialImg} width={150} style={{ borderRadius: '8px', display: 'block', margin: '10px 0' }} />
            <label className="upload-button"><ImageIcon size={14}/> Cambiar Credencial <input type="file" style={{display:'none'}} onChange={(e) => handleFileUpload(e, setCredentialImg)}/></label>
          </div>
        )}

        {activeTab === "emojis" && (
          <div>
            <h3>Tus Emojis (Comunidad)</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <Input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} placeholder="Pega un emoji o texto corto..." />
              <Button variant="signal" onClick={() => { if(newEmoji) { setEmojis([newEmoji, ...emojis]); setNewEmoji(""); } }}>Agregar</Button>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {emojis.map((e: string, i: number) => (
                <div key={i} style={{ background: '#1e3a8a', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{e}</span>
                  <button onClick={() => setEmojis(emojis.filter((_, index) => index !== i))} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer' }}>X</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div>
            <h3>Mensajes de Contacto</h3>
            <div style={{ background: '#0f203b', padding: '15px', borderRadius: '8px', height: '300px', overflowY: 'auto', marginBottom: '10px' }}>
              {chatMessages.map((c: any) => (
                <p key={c.id} style={{ color: c.sender === "Admin" ? '#4ade80' : 'white', marginBottom: '5px' }}>
                  <strong>[{c.date}] {c.sender}:</strong> {c.text}
                </p>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Input value={adminReply} onChange={(e) => setAdminReply(e.target.value)} placeholder="Responder al usuario..." />
              <Button variant="signal" onClick={() => { setChatMessages([...chatMessages, { id: Date.now(), sender: "Admin", text: adminReply, date: new Date().toLocaleString() }]); setAdminReply(""); }}>Responder</Button>
            </div>
          </div>
        )}

        {activeTab === "envios" && (
          <div>
            <h3>Galería Local (Lienzo)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {localDrawings.map((d: any) => (
                <div key={d.id} style={{ background: '#0f203b', padding: '10px', borderRadius: '8px' }}>
                  <img src={d.image_path} width="100%" style={{ background: 'white' }} />
                  <p><strong>{d.author}</strong>: {d.note}</p>
                  <Button variant="destructive" size="sm" onClick={() => deleteDrawing(d.id)}><Trash2 size={12}/> Eliminar</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "organizador" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3>🗓️ Mi Calendario</h3>
              <input type="date" style={{ background: '#1e3a8a', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', marginBottom: '10px' }} />
              <Textarea placeholder="Notas de este día..." style={{ height: '150px' }} />
            </div>
            <div>
              <h3>✅ To-Do List</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <Input id="newTodo" placeholder="Nueva tarea..." />
                <Button variant="signal" onClick={() => { const el = document.getElementById("newTodo") as HTMLInputElement; if(el.value) { setTodos([...todos, { id: Date.now(), text: el.value, done: false }]); el.value = ""; } }}>Add</Button>
              </div>
              {todos.map((t: any) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <input type="checkbox" checked={t.done} onChange={() => setTodos(todos.map((x: any) => x.id === t.id ? { ...x, done: !x.done } : x))} />
                  <span style={{ textDecoration: t.done ? 'line-through' : 'none', flex: 1 }}>{t.text}</span>
                  <button onClick={() => setTodos(todos.filter((x: any) => x.id !== t.id))} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer' }}>X</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export function TeriApp() {
  const siteData = useSiteData();
  const [page, setPageState] = useState<Page>("inicio");
  const [adminMode, setAdminMode] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  
  const setPage = (next: Page) => { setPageState(next); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <SiteContext.Provider value={siteData}>
      <div className="app-shell">
        <Header page={page} setPage={setPage} onAdminAccess={() => adminMode ? setAdminMode(false) : setLoginOpen(true)} />
        {adminMode && <AdminPanel onClose={() => setAdminMode(false)} />}
        
        {page === "inicio" && <><section style={{padding: '50px', textAlign: 'center'}}><h1>Bienvenido al Estudio</h1><Button variant="signal" onClick={() => setPage("portafolio")}>Ver portafolio</Button></section><ProfileBand /></>}
        {page === "portafolio" && <main className="page-shell"><div className="page-heading"><h1>Portafolio interactivo</h1></div><div style={{display:'flex', gap: '20px'}}><PaintCanvas /><ProfileBand/></div></main>}
        {page === "comunidad" && <main className="page-shell"><h1>Comunidad y Muro</h1><p>En construcción con DB...</p><ProfileBand /></main>}
        {page === "sobre-mi" && <About adminMode={adminMode} />}
        {page === "contacto" && <Contact />}

        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent className="station-dialog">
            <DialogHeader><DialogTitle>admin_login.exe</DialogTitle></DialogHeader>
            <Input type="password" placeholder="Contraseña: teri123" id="pwd" onKeyDown={(e) => { if(e.key === 'Enter' && (e.target as HTMLInputElement).value === 'teri123') { setAdminMode(true); setLoginOpen(false); } }} />
            <Button variant="signal" onClick={() => { if((document.getElementById("pwd") as HTMLInputElement).value === 'teri123') { setAdminMode(true); setLoginOpen(false); } }}>Entrar</Button>
          </DialogContent>
        </Dialog>
      </div>
    </SiteContext.Provider>
  );
}
