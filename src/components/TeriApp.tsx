import { useEffect, useRef, useState, type PointerEvent, type ChangeEvent } from "react";
import { Brush, Check, ChevronDown, Coffee, CornerDownRight, Eraser, Eye, Folder, Image as ImageIcon, LockKeyhole, Menu, MessageCircle, Minus, Orbit, Paintbrush, Play, RotateCcw, Send, Smile, Sparkles, Square, Trash2, X, Music, LogOut, Terminal } from "lucide-react";
import avatarAsset from "@/assets/teridayo-avatar.png.asset.json";
import orcaAsset from "@/assets/orca-credential.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Page = "inicio" | "portafolio" | "comunidad" | "sobre-mi" | "contacto";

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

const ADMIN_PASSWORD = "teri123";

const colorPresets = [
  { name: "Azul", value: "#69a2ff" },
  { name: "Rosa", value: "#ff6b9d" },
  { name: "Verde", value: "#4ade80" },
  { name: "Naranja", value: "#fb923c" },
  { name: "Amarillo", value: "#facc15" },
  { name: "Morado", value: "#a78bfa" },
  { name: "Cian", value: "#22d3ee" },
  { name: "Blanco", value: "#ffffff" },
  { name: "Negro", value: "#1a1a2e" },
];

type Submission = {
  id: string;
  image_path: string;
  note: string;
  author: string;
  approved: boolean;
  created_at: string;
};

type WallComment = {
  id: string;
  author: string;
  content: string;
  approved: boolean;
  parent_id: string | null;
  is_admin_reply: boolean;
  created_at: string;
};

type PortfolioItem = {
  id: string;
  title: string;
  category: string;
  image_path: string;
};

const getStoredProfile = () => {
  return JSON.parse(localStorage.getItem("site_profile") || JSON.stringify({ name: "Maxine", avatar: avatarAsset.url }));
};

const getStoredImagesConfig = () => {
  return JSON.parse(localStorage.getItem("site_images_config") || JSON.stringify({
    homeProfile: avatarAsset.url,
    homeDirects: avatarAsset.url,
    homeIntro: avatarAsset.url,
    aboutMain: avatarAsset.url,
    credential: orcaAsset.url,
  }));
};

const getStoredEmojis = () => {
  return JSON.parse(localStorage.getItem("site_custom_emojis") || JSON.stringify([
    { name: "corazon", url: avatarAsset.url },
    { name: "estrella", url: avatarAsset.url }
  ]));
};

const getStoredPortfolio = () => {
  return JSON.parse(localStorage.getItem("site_portfolio") || JSON.stringify([
    { id: "1", title: "MEGAMAN!!!", category: "Drawings", image_path: avatarAsset.url }
  ]));
};

const getStoredSpotify = () => {
  return localStorage.getItem("site_spotify_url") || "";
};

const getStoredShimejiFrames = (): string[] => {
  const saved = localStorage.getItem("site_shimeji_frames");
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fallback */ }
  }
  return [avatarAsset.url];
};

// --- COMPONENTE SHIMEJI MÓVIL (CAMINA Y SE MUEVE) ---
function VirtualShimeji() {
  const [pos, setPos] = useState({ x: 100, y: window.innerHeight - 90 });
  const [direction, setDirection] = useState<1 | -1>(1);
  const [frameIndex, setFrameIndex] = useState(0);
  const frames = getStoredShimejiFrames();

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 180);
    return () => clearInterval(interval);
  }, [frames.length]);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      setPos((prev) => {
        let nextX = prev.x + direction * 2;
        let nextDir = direction;

        const rightLimit = window.innerWidth - 70;
        const leftLimit = 10;

        if (nextX >= rightLimit) {
          nextX = rightLimit;
          nextDir = -1;
        } else if (nextX <= leftLimit) {
          nextX = leftLimit;
          nextDir = 1;
        }

        if (nextDir !== direction) {
          setDirection(nextDir);
        }

        return { x: nextX, y: window.innerHeight - 90 };
      });
    }, 40);

    return () => clearInterval(moveInterval);
  }, [direction]);

  return (
    <div
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 9998,
        width: '64px',
        height: '64px',
        userSelect: 'none',
        pointerEvents: 'none',
        transform: direction === -1 ? 'scaleX(-1)' : 'scaleX(1)',
      }}
      title="¡Shimeji caminando!"
    >
      <img 
        src={frames[frameIndex % frames.length] || frames[0]} 
        alt="Shimeji" 
        style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))' }} 
      />
    </div>
  );
}

// --- TERMINAL DE CÓDIGOS SECRETOS ---
function SecretCodesWidget({ onTriggerEffect }: { onTriggerEffect: (effectName: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleRedeem = () => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    if (clean === "BUBBLES" || clean === "MAGIC") {
      setFeedback("✨ ¡Efecto mágico de burbujas activado!");
      onTriggerEffect("bubbles");
    } else if (clean === "CYBER" || clean === "MATRIX") {
      setFeedback("💻 ¡Modo Ciberespacio activado!");
      onTriggerEffect("cyber");
    } else if (clean === "BESO" || clean === "KISS") {
      setFeedback("💋 ¡Animación especial del beso activada!");
      onTriggerEffect("kiss");
    } else if (clean === "TERICOMMISSION" || clean === "MAXINE20") {
      setFeedback("🎉 ¡Código válido! 20% de descuento en tu próxima comisión.");
      onTriggerEffect("discount");
    } else {
      setFeedback("❌ Código inválido o secreto oculto aún no descubierto.");
    }
    setCode("");
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 9996 }}>
      {!isOpen ? (
        <Button variant="signal" onClick={() => setIsOpen(true)} style={{ borderRadius: '50%', width: '50px', height: '50px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }} title="Códigos Secretos">
          <Terminal size={22} />
        </Button>
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

// --- WIDGET DE SPOTIFY MOVIBLE ---
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
      setPos({
        x: Math.max(10, Math.min(window.innerWidth - 390, e.clientX - dragRef.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 180, e.clientY - dragRef.current.y)),
      });
    };

    const handleUp = () => {
      if (isDraggingRef.current) setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  return (
    <div style={{ position: 'fixed', left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 9997, width: '380px', background: '#ece9d8', border: '2px solid #0055ea', borderRadius: '5px 5px 0 0', boxShadow: '2px 2px 10px rgba(0,0,0,0.5)', fontFamily: 'Tahoma, sans-serif' }}>
      <div 
        onMouseDown={handleMouseDown}
        style={{ background: 'linear-gradient(to right, #0055ea, #1690ff)', color: 'white', padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 'bold', cursor: 'grab', userSelect: 'none' }}
      >
        <span>🎵 Spotify - WinXP Player (Movible)</span>
        <button onClick={() => setMinimized(!minimized)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>{minimized ? "□" : "_"}</button>
      </div>
      {!minimized && (
        <div style={{ background: '#000', lineHeight: 0 }}>
          <iframe 
            src={embedUrl} 
            width="100%" 
            height="152" 
            frameBorder="0" 
            allow="encrypted-media"
            title="Spotify Player"
            style={{ borderRadius: '0' }}
          />
        </div>
      )}
    </div>
  );
}

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
  return (
    <>
      <header className="site-header">
        <button className="brand" onClick={() => setPage("inicio")} aria-label="Ir a inicio"><Orbit /> Munchxine!</button>
        <Button variant="ghost" size="icon" className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Abrir menú"><Menu /></Button>
        <nav className={open ? "nav-list is-open" : "nav-list"} aria-label="Navegación principal">
          {nav.map((item) => (
            <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => { setPage(item.id); setOpen(false); }}>{item.label}</button>
          ))}
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
  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setError("");
      setPassword("");
      onSuccess();
    } else {
      setError("Contraseña incorrecta");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="station-dialog">
        <DialogHeader><DialogTitle>admin_login.exe</DialogTitle><DialogDescription>Zona restringida de TeriDayo.</DialogDescription></DialogHeader>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }} />
        {error && <p className="admin-error">{error}</p>}
        <Button variant="signal" onClick={handleLogin}>Entrar</Button>
      </DialogContent>
    </Dialog>
  );
}

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
                <div className={`stage-art sketch ${stage === 0 ? "visible" : ""}`}><AvatarBlueprint mode="sketch" /></div>
                <div className={`stage-art lineart ${stage === 1 ? "visible" : ""}`}><AvatarBlueprint mode="line" /></div>
                <div className={`stage-art final ${stage === 2 ? "visible" : ""}`}><img src={images.homeProfile} alt="Ilustración final de Teri" /></div>
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

function AvatarBlueprint({ mode }: { mode: "sketch" | "line" }) {
  return <div className={`blueprint-avatar ${mode}`}><span className="head" /><span className="body" /><span className="arm left" /><span className="arm right" /><span className="leg left" /><span className="leg right" /></div>;
}

function ProfileBand() {
  const profile = getStoredProfile();
  const images = getStoredImagesConfig();
  return (
    <section className="profile-band">
      <Window title="Munchxine_profile.exe"><div className="profile-content"><img src={images.homeProfile} alt="Avatar pixel art" /><div><p className="eyebrow">HIYAAA!!</p><h2>{profile.name}</h2><p>Artista chileno de 19 años • Arte 2D y 3D • ESP / ENG</p><div className="tags"><span>Roblox</span><span>ARGs</span><span>Pokemon</span></div></div></div></Window>
      <Window title="ACCESOS_DIRECTOS"><div className="online-content"><h2>Maxine Online!</h2><div className="social-row"><Button variant="station"><X /> Twitter / X</Button><Button variant="station"><Coffee /> Ko-fi</Button></div><div className="online-art"><img src={images.homeDirects} alt="Teri online" /><span>@Munchxine_</span></div></div></Window>
    </section>
  );
}

function Home({ setPage }: { setPage: (page: Page) => void }) {
  const profile = getStoredProfile();
  const images = getStoredImagesConfig();
  return <><TabletExperience setPage={setPage} /><section className="intro-band"><Window title="Munchxine.txt"><div className="intro-copy"><img src={images.homeIntro} alt="Avatar de Teri" /><div><p className="eyebrow">WELCOME_NOTE.LOG</p><h2>¡Haii! Mi nombre es {profile.name}.</h2><p>Soy un artista digital enfocado en el arte 2D, tando ilustracion como modelos Vtuber/Pngtuber. </p></div></div></Window></section><ProfileBand /></>;
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
    if (!file.type.startsWith("image/")) {
      setSubmitStatus({ type: "error", msg: "Solo se permiten imágenes" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const context = getCtx();
      if (context && canvasRef.current && e.target?.result) {
        const img = new Image();
        img.onload = () => {
          context.globalCompositeOperation = "source-over";
          context.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
        };
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
      localSubs.unshift({
        id: Date.now().toString(),
        image_path: dataUrl,
        note: note.trim(),
        author: author.trim() || "Anónimo",
        approved: false,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("local_submissions", JSON.stringify(localSubs));

      setSubmitStatus({ type: "success", msg: "¡Dibujo guardado localmente! Revísalo en el panel de admin ♡" });
      clear();
      setNote("");
      setAuthor("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al enviar";
      setSubmitStatus({ type: "error", msg: `No se pudo enviar: ${message}` });
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
            <button
              key={c.value}
              className={`color-swatch ${color === c.value && !eraser ? "active" : ""}`}
              style={{ background: c.value }}
              onClick={() => { setColor(c.value); setEraser(false); }}
              title={c.name}
              aria-label={c.name}
            />
          ))}
          <label className="color-custom" title="Color personalizado">
            <Paintbrush size={14} />
            <input type="color" value={color} onChange={(e) => { setColor(e.target.value); setEraser(false); }} />
          </label>
        </div>
      </div>
      <div className="paint-controls">
        <Button variant={eraser ? "signal" : "station"} size="sm" onClick={() => setEraser(!eraser)}><Eraser size={14} /> Borrador</Button>
        <Button variant={!eraser ? "signal" : "station"} size="sm" onClick={() => { setEraser(false); }}><Brush size={14} /> Pincel</Button>
        <label className="brush-size-label">
          <span>Tamaño</span>
          <input type="range" min={1} max={30} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
          <span className="brush-size-value">{brushSize}px</span>
        </label>
        <Button variant="station" size="sm" onClick={clear}><RotateCcw size={14} /> Limpiar</Button>
      </div>
      <div className="upload-row">
        <label className="upload-button">
          <ImageIcon size={16} />
          <span>Subir imagen de tu PC</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
        </label>
      </div>
      <canvas ref={canvasRef} width={440} height={220} style={{ touchAction: "none" }} onPointerDown={start} onPointerMove={draw} onPointerUp={() => drawingRef.current = false} onPointerLeave={() => drawingRef.current = false} />
      <Input className="paint-author" placeholder="Tu nombre (opcional)..." value={author} onChange={(e) => setAuthor(e.target.value)} />
      <Textarea placeholder="Una notita para Teri..." value={note} onChange={(e) => setNote(e.target.value)} />
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
    const approved = localSubs.filter((s: Submission) => s.approved);
    setSubmissions(approved);
    setLoading(false);
  }, []);

  if (loading) return <p className="window-copy">Cargando dibujos de la comunidad...</p>;
  if (submissions.length === 0) return <p className="window-copy">Aún no hay dibujos aprobados. ¡Sé el primero en enviar uno! ♡</p>;

  return (
    <div className="community-gallery">
      {submissions.map((s) => (
        <article className="community-art" key={s.id}>
          <img src={s.image_path} alt={`Dibujo de ${s.author}`} />
          <div className="community-art-info">
            <strong>{s.author}</strong>
            {s.note && <p>{s.note}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}

function CommentThread({ comment, replies, adminMode, customEmojis, onReply, onDelete }: {
  comment: WallComment;
  replies: WallComment[];
  adminMode: boolean;
  customEmojis: Array<{ name: string; url: string }>;
  onReply: (parentId: string, content: string, isAdmin: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText, adminMode);
    setReplyText("");
    setShowReplyBox(false);
    setShowEmojiPicker(false);
  };

  const renderFormattedContent = (text: string) => {
    const parts = text.split(/(\[emoji:[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("[emoji:") && part.endsWith("]")) {
        const emojiName = part.slice(7, -1);
        const found = customEmojis.find(e => e.name === emojiName);
        if (found) {
          return <img key={i} src={found.url} alt={emojiName} width={18} height={18} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' }} />;
        }
      }
      return part;
    });
  };

  return (
    <>
      <article className={`comment ${comment.is_admin_reply ? "admin-reply" : ""}`}>
        <div className="comment-header">
          <strong>{comment.author}{comment.is_admin_reply && <small className="admin-tag">ADMIN</small>}</strong>
          <span className="comment-date">{new Date(comment.created_at).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
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
              <div className="comment-header">
                <strong>{reply.author}{reply.is_admin_reply && <small className="admin-tag">ADMIN</small>}</strong>
                <span className="comment-date">{new Date(reply.created_at).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="comment-content">{renderFormattedContent(reply.content)}</p>
              {adminMode && (
                <div className="comment-actions">
                  <button className="comment-action-btn danger" onClick={() => onDelete(reply.id)}><Trash2 size={12} /> Eliminar</button>
                </div>
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
    const local = JSON.parse(localStorage.getItem("local_comments") || "[]");
    setComments(local);
    setLoading(false);
  }, []);

  const sendComment = () => {
    if (!comment.trim()) return;
    const finalAuthor = adminMode ? (author.trim() || profile.name) : (author.trim() || "Anónimo");
    const newC: WallComment = {
      id: Date.now().toString(),
      content: comment.trim(),
      author: finalAuthor,
      approved: adminMode ? true : false,
      is_admin_reply: adminMode ? true : false, // Si es admin, se marca como respuesta/comentario oficial de admin
      parent_id: null,
      created_at: new Date().toISOString(),
    };
    const updated = [newC, ...comments];
    setComments(updated);
    localStorage.setItem("local_comments", JSON.stringify(updated));
    setComment("");
    setAuthor("");
    alert(adminMode ? "¡Comentario de admin publicado directamente!" : "¡Comentario enviado! Aparecerá cuando Maxine lo apruebe.");
  };

  const sendReply = (parentId: string, content: string, isAdmin: boolean) => {
    const replyAuthor = isAdmin ? profile.name : "Anónimo";
    const newReply: WallComment = {
      id: Date.now().toString(),
      content,
      author: replyAuthor,
      approved: true,
      is_admin_reply: isAdmin,
      parent_id: parentId,
      created_at: new Date().toISOString(),
    };
    const updated = [...comments, newReply];
    setComments(updated);
    localStorage.setItem("local_comments", JSON.stringify(updated));
  };

  const deleteComment = (id: string) => {
    const updated = comments.filter((c) => c.id !== id && c.parent_id !== id);
    setComments(updated);
    localStorage.setItem("local_comments", JSON.stringify(updated));
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
            <div className="post-author">
              <img src={images.homeProfile} alt="Teri" />
              <div><strong>{profile.name} <small>ADMIN / DEV :3C</small></strong><span>14 sept 2026, 0:24</span></div>
            </div>
            <p>¡Haii! Bienvenidos al muro oficial de la web.</p>
          </article>
          {loading && <p className="window-copy">Cargando comentarios...</p>}
          {!loading && topLevel.length === 0 && <p className="window-copy">No hay comentarios todavía. ¡Sé el primero! ♡</p>}
          {topLevel.map((c) => (
            <CommentThread
              key={c.id}
              comment={c}
              replies={getReplies(c.id)}
              adminMode={adminMode}
              customEmojis={customEmojis}
              onReply={sendReply}
              onDelete={deleteComment}
            />
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
          <Window title="Bocetos y rayones">
            <p className="window-copy">Favoritos elegidos por Maxi</p>
            <GalleryDisplay />
          </Window>
          <PaintCanvas />
          <Window title="Notita">
            <p className="window-copy">Los comentarios de usuarios aparecen cuando Maxine los aprueba.</p>
          </Window>
        </div>
      </div>
      <ProfileBand />
    </main>
  );
}

function AdminPanel({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"envios" | "comentarios" | "perfil" | "imagenes" | "emojis" | "musica" | "shimeji" | "organizador">("envios");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allComments, setAllComments] = useState<WallComment[]>([]);
  
  const [profile, setProfile] = useState(getStoredProfile());
  const [imagesConfig, setImagesConfig] = useState(getStoredImagesConfig());
  const [emojis, setEmojis] = useState<Array<{ name: string; url: string }>>(getStoredEmojis());
  const [newEmojiName, setNewEmojiName] = useState("");
  const [newEmojiImg, setNewEmojiImg] = useState("");
  
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(getStoredPortfolio());
  const [newArtTitle, setNewArtTitle] = useState("");
  const [newArtCategory, setNewArtCategory] = useState("Drawings");
  const [newArtImage, setNewArtImage] = useState("");

  const [spotifyUrl, setSpotifyUrl] = useState(getStoredSpotify());
  const [shimejiFrames, setShimejiFrames] = useState<string[]>(getStoredShimejiFrames());

  const [todos, setTodos] = useState<{ id: string; text: string; done: boolean }[]>(() => JSON.parse(localStorage.getItem("admin_todos") || "[]"));
  const [newTodoText, setNewTodoText] = useState("");
  const [calendarNote, setCalendarNote] = useState(() => localStorage.getItem("admin_calendar") || "");

  useEffect(() => {
    const localSubs = JSON.parse(localStorage.getItem("local_submissions") || "[]");
    setSubmissions(localSubs);
    const localComms = JSON.parse(localStorage.getItem("local_comments") || "[]");
    setAllComments(localComms);
  }, []);

  const handleImgConfigUpload = (key: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const updated = { ...imagesConfig, [key]: ev.target.result as string };
        setImagesConfig(updated);
        localStorage.setItem("site_images_config", JSON.stringify(updated));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEmojiUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setNewEmojiImg(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addEmoji = () => {
    if (!newEmojiName.trim() || !newEmojiImg) return;
    const updated = [...emojis, { name: newEmojiName.trim().toLowerCase(), url: newEmojiImg }];
    setEmojis(updated);
    localStorage.setItem("site_custom_emojis", JSON.stringify(updated));
    setNewEmojiName("");
    setNewEmojiImg("");
  };

  const removeEmoji = (index: number) => {
    const updated = emojis.filter((_, i) => i !== index);
    setEmojis(updated);
    localStorage.setItem("site_custom_emojis", JSON.stringify(updated));
  };

  const handlePortfolioUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setNewArtImage(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addPortfolio = () => {
    if (!newArtTitle.trim() || !newArtImage) return;
    const item: PortfolioItem = { id: Date.now().toString(), title: newArtTitle.trim(), category: newArtCategory, image_path: newArtImage };
    const updated = [item, ...portfolioItems];
    setPortfolioItems(updated);
    localStorage.setItem("site_portfolio", JSON.stringify(updated));
    setNewArtTitle("");
    setNewArtImage("");
  };

  const removePortfolio = (id: string) => {
    const updated = portfolioItems.filter(i => i.id !== id);
    setPortfolioItems(updated);
    localStorage.setItem("site_portfolio", JSON.stringify(updated));
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2><LockKeyhole size={18} /> Panel de Administración</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="destructive" size="sm" onClick={onLogout}><LogOut size={14} /> Cerrar sesión</Button>
          <Button variant="station" size="sm" onClick={onClose}><X size={14} /> Cerrar</Button>
        </div>
      </div>

      <div className="admin-tabs-nav" style={{ display: 'flex', gap: '5px', background: '#0a192f', padding: '8px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #1e3a8a', flexWrap: 'wrap' }}>
        <Button variant={activeTab === "envios" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("envios")}>Envíos de Arte</Button>
        <Button variant={activeTab === "comentarios" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("comentarios")}>Comentarios Muro</Button>
        <Button variant={activeTab === "perfil" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("perfil")}>Perfil</Button>
        <Button variant={activeTab === "imagenes" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("imagenes")}>Imágenes del sitio</Button>
        <Button variant={activeTab === "emojis" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("emojis")}>Emojis imagen</Button>
        <Button variant={activeTab === "musica" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("musica")}>Música</Button>
        <Button variant={activeTab === "shimeji" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("shimeji")}>Mascota Shimeji</Button>
        <Button variant={activeTab === "organizador" ? "signal" : "ghost"} size="sm" onClick={() => setActiveTab("organizador")}>Organizador</Button>
      </div>

      {activeTab === "envios" && (
        submissions.length === 0 ? (
          <p className="window-copy">No hay envíos de dibujos todavía.</p>
        ) : (
          <div className="admin-grid">
            {submissions.map((s) => (
              <article key={s.id} className={`admin-card ${s.approved ? "approved" : "pending"}`}>
                <div className="admin-card-image">
                  <img src={s.image_path} alt={`Dibujo de ${s.author}`} />
                  <span className={`admin-badge ${s.approved ? "badge-approved" : "badge-pending"}`}>
                    {s.approved ? "APROBADO" : "PENDIENTE"}
                  </span>
                </div>
                <div className="admin-card-info">
                  <strong>{s.author}</strong>
                  {s.note && <p>{s.note}</p>}
                  <span className="admin-date">{new Date(s.created_at).toLocaleString("es")}</span>
                </div>
                <div className="admin-card-actions">
                  {!s.approved ? (
                    <Button variant="signal" size="sm" onClick={() => {
                      const updated = submissions.map(sub => sub.id === s.id ? { ...sub, approved: true } : sub);
                      setSubmissions(updated);
                      localStorage.setItem("local_submissions", JSON.stringify(updated));
                    }}><Check size={14} /> Aprobar</Button>
                  ) : (
                    <Button variant="station" size="sm" onClick={() => {
                      const updated = submissions.map(sub => sub.id === s.id ? { ...sub, approved: false } : sub);
                      setSubmissions(updated);
                      localStorage.setItem("local_submissions", JSON.stringify(updated));
                    }}><Eye size={14} /> Ocultar</Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => {
                    const updated = submissions.filter(sub => sub.id !== s.id);
                    setSubmissions(updated);
                    localStorage.setItem("local_submissions", JSON.stringify(updated));
                  }}><Trash2 size={14} /> Eliminar</Button>
                </div>
              </article>
            ))}
          </div>
        )
      )}

      {activeTab === "comentarios" && (
        <div style={{ padding: '20px', background: '#0f203b', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
          <h3 style={{ marginBottom: '15px' }}>Moderar Comentarios del Muro</h3>
          {allComments.length === 0 ? (
            <p className="window-copy">No hay comentarios en el muro.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allComments.map((c) => (
                <div key={c.id} style={{ background: '#0a192f', padding: '12px', borderRadius: '6px', border: '1px solid #1e3a8a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{c.author}</strong> <span style={{ fontSize: '11px', color: '#8892b0' }}>{new Date(c.created_at).toLocaleString("es")}</span>
                    <p style={{ margin: '5px 0', fontSize: '13px' }}>{c.content}</p>
                    <span style={{ fontSize: '10px', color: c.approved ? '#4ade80' : '#facc15' }}>{c.approved ? "APROBADO" : "PENDIENTE"}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {!c.approved ? (
                      <Button variant="signal" size="sm" onClick={() => {
                        const updated = allComments.map(item => item.id === c.id ? { ...item, approved: true } : item);
                        setAllComments(updated);
                        localStorage.setItem("local_comments", JSON.stringify(updated));
                      }}>Aprobar</Button>
                    ) : (
                      <Button variant="station" size="sm" onClick={() => {
                        const updated = allComments.map(item => item.id === c.id ? { ...item, approved: false } : item);
                        setAllComments(updated);
                        localStorage.setItem("local_comments", JSON.stringify(updated));
                      }}>Ocultar</Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => {
                      const updated = allComments.filter(item => item.id !== c.id);
                      setAllComments(updated);
                      localStorage.setItem("local_comments", JSON.stringify(updated));
                    }}>Eliminar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "perfil" && (
        <div style={{ padding: '20px', background: '#0f203b', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
          <h3 style={{ marginBottom: '20px' }}>Datos de perfil</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '150px', textAlign: 'center' }}>
              <img src={profile.avatar} alt="Profile" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', border: '1px solid #1e3a8a', marginBottom: '10px' }} />
              <label className="upload-button" style={{ display: 'block', background: '#1e3a8a', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                <ImageIcon size={14} /> Cambiar foto
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (ev.target?.result) {
                      const updated = { ...profile, avatar: ev.target.result as string };
                      setProfile(updated);
                      localStorage.setItem("site_profile", JSON.stringify(updated));
                    }
                  };
                  reader.readAsDataURL(file);
                }} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{ fontSize: '10px', color: '#69a2ff', textTransform: 'uppercase', letterSpacing: '1px' }}>Nombre de usuario</label>
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={{ marginTop: '8px', marginBottom: '15px' }} />
              <Button variant="signal" style={{ width: '100%' }} onClick={() => {
                localStorage.setItem("site_profile", JSON.stringify(profile));
                alert("¡Perfil guardado!");
              }}>GUARDAR PERFIL</Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "imagenes" && (
        <div style={{ padding: '20px', background: '#0f203b', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
          <h3 style={{ marginBottom: '15px' }}>Imágenes Independientes del Sitio</h3>
          <p style={{ color: '#8892b0', fontSize: '13px', marginBottom: '20px' }}>Selecciona una imagen diferente para cada sección:</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            {[
              { key: "homeProfile", label: "Munchxine_profile.exe (Inicio)" },
              { key: "homeDirects", label: "Accesos directos (Inicio)" },
              { key: "homeIntro", label: "Munchxine.txt (Inicio)" },
              { key: "aboutMain", label: "About / Strawpage" },
              { key: "credential", label: "Credencial de Contacto" },
            ].map((item) => (
              <div key={item.key} style={{ background: '#0a192f', padding: '10px', borderRadius: '8px', border: '1px solid #1e3a8a', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>{item.label}</span>
                <img src={imagesConfig[item.key]} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', margin: '0 auto 8px', display: 'block' }} />
                <label className="upload-button" style={{ background: '#1e3a8a', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'inline-block' }}>
                  Cambiar
                  <input type="file" accept="image/*" onChange={(e) => handleImgConfigUpload(item.key, e)} style={{ display: 'none' }} />
                </label>
              </div>
            ))}
          </div>

          <h3 style={{ marginBottom: '15px' }}>Gestión de Portafolio</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <Input placeholder="Título de la obra..." value={newArtTitle} onChange={(e) => setNewArtTitle(e.target.value)} />
            <select value={newArtCategory} onChange={(e) => setNewArtCategory(e.target.value)} style={{ background: '#0a192f', color: 'white', padding: '8px', borderRadius: '6px', border: '1px solid #1e3a8a' }}>
              <option value="Drawings">Drawings</option>
              <option value="Doodles">Doodles</option>
              <option value="Renders">Renders</option>
            </select>
            <label className="upload-button" style={{ background: '#1e3a8a', padding: '8px', borderRadius: '6px', cursor: 'pointer', textAlign: 'center' }}>
              <ImageIcon size={14} /> {newArtImage ? "✓ Imagen seleccionada" : "Elegir archivo de imagen"}
              <input type="file" accept="image/*" onChange={handlePortfolioUpload} style={{ display: 'none' }} />
            </label>
            <Button variant="signal" onClick={addPortfolio}>SUBIR AL PORTAFOLIO</Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {portfolioItems.map((p) => (
              <div key={p.id} style={{ background: '#0a192f', padding: '8px', borderRadius: '6px', border: '1px solid #1e3a8a' }}>
                <img src={p.image_path} alt="" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '5px' }} />
                <strong style={{ fontSize: '12px', display: 'block' }}>{p.title}</strong>
                <Button variant="destructive" size="sm" style={{ width: '100%', marginTop: '5px' }} onClick={() => removePortfolio(p.id)}>Eliminar</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "emojis" && (
        <div style={{ padding: '20px', background: '#0f203b', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
          <h3 style={{ marginBottom: '15px' }}>Emojis Personalizados (En formato de Imagen)</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <Input placeholder="Nombre (ej. corazon)..." value={newEmojiName} onChange={(e) => setNewEmojiName(e.target.value)} />
            <label className="upload-button" style={{ background: '#1e3a8a', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ImageIcon size={14} /> {newEmojiImg ? "✓ Imagen lista" : "Subir icono PNG"}
              <input type="file" accept="image/*" onChange={handleEmojiUpload} style={{ display: 'none' }} />
            </label>
            <Button variant="signal" onClick={addEmoji}>AGREGAR EMOJI</Button>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {emojis.map((e, index) => (
              <div key={index} style={{ position: 'relative', width: '60px', height: '60px', background: '#0a192f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid #1e3a8a' }}>
                <img src={e.url} alt={e.name} width={28} height={28} style={{ objectFit: 'contain' }} />
                <span style={{ fontSize: '9px', color: '#8892b0' }}>{e.name}</span>
                <button onClick={() => removeEmoji(index)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "musica" && (
        <div style={{ padding: '20px', background: '#0f203b', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
          <h3 style={{ marginBottom: '15px' }}><Music size={16} /> Widget de Spotify (Playlist / Canción)</h3>
          <p style={{ color: '#8892b0', fontSize: '13px', marginBottom: '15px' }}>Pega el enlace de Spotify de tu playlist (ej: https://open.spotify.com/playlist/...):</p>
          <Input placeholder="Enlace de Spotify..." value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)} style={{ marginBottom: '15px' }} />
          <Button variant="signal" onClick={() => {
            localStorage.setItem("site_spotify_url", spotifyUrl);
            alert("¡Reproductor de Spotify actualizado!");
          }}>GUARDAR REPRODUCTOR</Button>
        </div>
      )}

      {activeTab === "shimeji" && (
        <div style={{ padding: '20px', background: '#0f203b', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
          <h3 style={{ marginBottom: '15px' }}>Mascota Shimeji (Fotogramas)</h3>
          <p style={{ color: '#8892b0', fontSize: '13px', marginBottom: '15px' }}>Sube fotogramas PNG para animar a tu mascota:</p>
          <label className="upload-button" style={{ background: '#1e3a8a', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-block' }}>
            <ImageIcon size={14} /> Seleccionar fotogramas PNG
            <input type="file" accept="image/*" multiple onChange={(e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              const loaded: string[] = [];
              let count = 0;
              Array.from(files).forEach((file) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  if (ev.target?.result) loaded.push(ev.target.result as string);
                  count++;
                  if (count === files.length) {
                    setShimejiFrames(loaded);
                    localStorage.setItem("site_shimeji_frames", JSON.stringify(loaded));
                    alert("¡Shimeji actualizado!");
                  }
                };
                reader.readAsDataURL(file);
              });
            }} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {activeTab === "organizador" && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', background: '#0f203b', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
            <h3 style={{ marginBottom: '15px' }}>🗓️ Calendario / Notas</h3>
            <Textarea value={calendarNote} onChange={(e) => { setCalendarNote(e.target.value); localStorage.setItem("admin_calendar", e.target.value); }} placeholder="Notas importantes..." style={{ height: '150px' }} />
          </div>
          <div style={{ padding: '20px', background: '#0f203b', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
            <h3 style={{ marginBottom: '15px' }}>✅ To-Do List</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              <Input value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)} placeholder="Nueva tarea..." onKeyDown={(e) => {
                if(e.key === 'Enter' && newTodoText.trim()) {
                  const updated = [...todos, { id: Date.now().toString(), text: newTodoText.trim(), done: false }];
                  setTodos(updated);
                  localStorage.setItem("admin_todos", JSON.stringify(updated));
                  setNewTodoText("");
                }
              }} />
              <Button variant="signal" onClick={() => {
                if(!newTodoText.trim()) return;
                const updated = [...todos, { id: Date.now().toString(), text: newTodoText.trim(), done: false }];
                setTodos(updated);
                localStorage.setItem("admin_todos", JSON.stringify(updated));
                setNewTodoText("");
              }}>Añadir</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
              {todos.map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a192f', padding: '6px 10px', borderRadius: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#caddff', cursor: 'pointer', textDecoration: t.done ? 'line-through' : 'none' }}>
                    <input type="checkbox" checked={t.done} onChange={() => {
                      const updated = todos.map(x => x.id === t.id ? { ...x, done: !x.done } : x);
                      setTodos(updated);
                      localStorage.setItem("admin_todos", JSON.stringify(updated));
                    }} /> {t.text}
                  </label>
                  <button onClick={() => {
                    const updated = todos.filter(x => x.id !== t.id);
                    setTodos(updated);
                    localStorage.setItem("admin_todos", JSON.stringify(updated));
                  }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function About() {
  const images = getStoredImagesConfig();
  return (
    <main className="page-shell narrow">
      <div className="page-heading">
        <p className="eyebrow">PROFILE://ABOUT</p>
        <h1>Sobre Mí.</h1>
        <p>Mi pequeño rincón personal estilo Strawpage</p>
      </div>
      <div className="about-stack">
        <Window title="ABOUT_TERIDAYO.TXT">
          <div className="about-note">
            <img src={images.aboutMain} alt="Avatar TeriDayo" />
            <p>✨ ¡Haii! Bienvenidos a mi Strawpage personal. Aquí comparto un poco sobre mí, mis gustos y rayones favoritos.</p>
          </div>
        </Window>
        <Window title="INTERESTS.LOG">
          <div className="large-art"><img src={images.aboutMain} alt="Arte pixel de TeriDayo" /></div>
        </Window>
      </div>
      <ProfileBand />
    </main>
  );
}

function Contact() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const profile = getStoredProfile();
  const images = getStoredImagesConfig();
  return (
    <main className="page-shell narrow">
      <div className="page-heading">
        <p className="eyebrow">TERIDAYO.CONTACT // SYSTEM.EXE</p>
        <h1>Contacto</h1>
        <p>Haz clic en el póster de credencial para abrir el canal directo con Teri.</p>
      </div>
      <button className="credential-button" onClick={() => setOpen(true)}>
        <img src={images.credential} alt="Credencial de orcas" />
        <span>[ ABRIR CREDENCIAL ]</span>
      </button>
      {open && (
        <Window title="TeriDayo_contact.exe" className="contact-card">
          <div className="contact-identity">
            <img src={images.homeProfile} alt="Avatar" />
            <div>
              <p className="eyebrow">@TeriDayo_</p>
              <h2>{profile.name}</h2>
              <p>Artista digital 2D + modelador 3D (ESP / ENG)</p>
            </div>
          </div>
          <div className="info-grid">
            <span><b>Nombre</b>Anthony Benjamin</span>
            <span><b>Pronombres</b>He / Him</span>
            <span><b>Edad</b>20 y/o</span>
            <span><b>Ubicación</b>Penco, Chile 🇨🇱</span>
          </div>
          <h3>¡Hablemos de arte o proyectos! 💬</h3>
          <Input placeholder="Tu nombre o redes..." />
          <Textarea placeholder="Escribe tu mensaje aquí..." />
          <Button variant="signal" onClick={() => setSent(true)}>
            <Send />{sent ? "¡Mensaje enviado!" : "Enviar mensaje ♡"}
          </Button>
        </Window>
      )}
      <ProfileBand />
    </main>
  );
}

export function TeriApp() {
  const [page, setPageState] = useState<Page>("inicio");
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(() => localStorage.getItem("site_admin_logged") === "true");
  const [effectMode, setEffectMode] = useState<"normal" | "bubbles" | "cyber" | "kiss">("normal");

  const setPage = (next: Page) => { setPageState(next); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleAdminAccess = () => {
    if (adminMode) {
      setAdminMode(true);
    } else {
      setAdminLoginOpen(true);
    }
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem("site_admin_logged");
    setAdminMode(false);
  };

  return (
    <div className={`app-shell ${effectMode === "cyber" ? "cyber-theme" : ""}`}>
      <div className="ambient-grid" />
      <div className="scanline" />

      {effectMode === "bubbles" && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', bottom: '-20px', left: `${Math.random() * 100}%`, width: `${15 + Math.random() * 25}px`, height: `${15 + Math.random() * 25}px`, background: 'rgba(105, 162, 255, 0.4)', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.6)', animation: `floatUp ${3 + Math.random() * 4}s linear infinite`, animationDelay: `${Math.random() * 3}s` }} />
          ))}
        </div>
      )}

      {effectMode === "kiss" && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}>
          <img src={avatarAsset.url} alt="Personaje tirando un beso" style={{ width: '220px', height: '220px', objectFit: 'contain', animation: 'bounce 1s infinite', filter: 'drop-shadow(0 0 20px #ff6b9d)' }} />
          <h2 style={{ color: '#ff6b9d', marginTop: '20px', fontFamily: 'Tahoma, sans-serif', textShadow: '0 0 10px #ff6b9d' }}>¡Muuuuchox besitos de Maxine! ♡</h2>
          <Button variant="signal" onClick={() => setEffectMode("normal")} style={{ marginTop: '20px' }}>Cerrar animación</Button>
        </div>
      )}

      <Header page={page} setPage={setPage} onAdminAccess={handleAdminAccess} />
      {adminMode && <AdminPanel onClose={() => setAdminMode(false)} onLogout={handleLogoutAdmin} />}
      {page === "inicio" && <Home setPage={setPage} />}
      {page === "portafolio" && <Portfolio />}
      {page === "comunidad" && <Community adminMode={adminMode} />}
      {page === "sobre-mi" && <About />}
      {page === "contacto" && <Contact />}
      <VirtualShimeji />
      <SpotifyWidget />
      <SecretCodesWidget onTriggerEffect={(eff) => setEffectMode(eff as any)} />
      <footer className="system-footer"><span>MUNCHINE ONLINE!</span><span>ENLACES VERIFICADOS · ES · 01:23 P.M.</span><div><Play size={12} /> DEEP_SEA_SIGNAL.WAV</div></footer>
      <AdminLoginDialog
        open={adminLoginOpen}
        onOpenChange={setAdminLoginOpen}
        onSuccess={() => {
          localStorage.setItem("site_admin_logged", "true");
          setAdminMode(true);
          setAdminLoginOpen(false);
        }}
      />
    </div>
  );
}
