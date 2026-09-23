import { useEffect, useRef, useState, type PointerEvent, type ChangeEvent } from "react";
import {
  Brush,
  Check,
  ChevronDown,
  Coffee,
  Eraser,
  Eye,
  Folder,
  ImageIcon,
  LockKeyhole,
  Menu,
  MessageCircle,
  Minus,
  Orbit,
  Paintbrush,
  Palette,
  Play,
  Plus,
  Reply as ReplyIcon,
  RotateCcw,
  Send,
  Smile,
  Sparkles,
  Square,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import avatarAsset from "@/assets/teridayo-avatar.png.asset.json";
import orcaAsset from "@/assets/orca-credential.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CUSTOM_EMOJIS,
  SITE_IMAGE_SLOTS,
  addComment,
  addReply,
  addSubmission,
  clearSiteImage,
  fileToDataUrl,
  removeComment,
  removeSubmission,
  setAdminUsername,
  setColorPresets,
  setSiteImage,
  setSubmissionApproved,
  useCommunityStore,
  type ColorPreset,
} from "@/lib/communityStore";

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

/* Reads a site image slot from the store, falling back to a bundled asset. */
function SiteImg({ slot, fallback, alt, className }: { slot: string; fallback: string; alt: string; className?: string }) {
  const store = useCommunityStore();
  const src = store.siteImages[slot] ?? fallback;
  return <img src={src} alt={alt} className={className} />;
}

function useProfileAvatar() {
  const store = useCommunityStore();
  return store.siteImages["profileAvatar"] ?? avatarAsset.url;
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
                <div className={`stage-art final ${stage === 2 ? "visible" : ""}`}><SiteImg slot="heroFinal" fallback={avatarAsset.url} alt="Ilustración final de Teri" /></div>
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
  const avatar = useProfileAvatar();
  return (
    <section className="profile-band">
      <Window title="Munchxine_profile.exe"><div className="profile-content"><img src={avatar} alt="Avatar pixel art de TeriDayo" /><div><p className="eyebrow">HIYAAA!!</p><h2>Maxine/ Munchy / Moopy</h2><p>Artista chileno de 19 años • Arte 2D y 3D • ESP / ENG</p><div className="tags"><span>Roblox</span><span>ARGs</span><span>Pokemon</span></div></div></div></Window>
      <Window title="ACCESOS_DIRECTOS"><div className="online-content"><h2>Maxine Online!</h2><div className="social-row"><Button variant="station"><X /> Twitter / X</Button><Button variant="station"><Coffee /> Ko-fi</Button></div><div className="online-art"><img src={avatar} alt="Teri online" /><span>@Munchxine_</span></div></div></Window>
    </section>
  );
}

function Home({ setPage }: { setPage: (page: Page) => void }) {
  const avatar = useProfileAvatar();
  return <><TabletExperience setPage={setPage} /><section className="intro-band"><Window title="Munchxine.txt"><div className="intro-copy"><img src={avatar} alt="Avatar de Teri" /><div><p className="eyebrow">WELCOME_NOTE.LOG</p><h2>¡Haii! Mi nombre es Maxine.</h2><p>Soy un artista digital enfocado en el arte 2D, tando ilustracion como modelos Vtuber/Pngtuber. </p></div></div></Window></section><ProfileBand /></>;
}

function Portfolio() {
  const [category, setCategory] = useState("Todas las obras");
  return <main className="page-shell"><div className="page-heading"><p className="eyebrow">ARCHIVE://VISUAL_WORKS</p><h1>Portafolio de arte</h1><p>Dibujos, GIFs, videos, ideas y universos guardados en carpetas.</p></div><div className="portfolio-layout"><Window title="Carpetas de Maxine" className="folder-window">{["Todas las obras", "Drawings", "Doodles", "Renders"].map((name) => <Button key={name} variant={category === name ? "signal" : "station"} onClick={() => setCategory(name)}><Folder />{name}</Button>)}</Window><Window title={category} className="gallery-window"><div className="gallery-grid"><article className="art-card"><div className="art-preview"><SiteImg slot="portfolioArt" fallback={avatarAsset.url} alt="MEGAMAN" /></div><strong>MEGAMAN!!!</strong><span>DIGITAL_ARCHIVE_001</span></article></div></Window></div><ProfileBand /></main>;
}

function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="emoji-picker">
      <Button type="button" variant="station" size="sm" onClick={() => setOpen((v) => !v)}><Smile size={14} /> Emojis</Button>
      {open && (
        <div className="emoji-tray">
          {CUSTOM_EMOJIS.map((e) => (
            <button key={e.name} type="button" className="emoji-chip" title={e.name} onClick={() => { onPick(e.char); }}>{e.char}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function PaintCanvas() {
  const store = useCommunityStore();
  const colorPresets = store.colorPresets;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const colorRef = useRef<string>("#69a2ff");
  const eraserRef = useRef<boolean>(false);
  const brushSizeRef = useRef<number>(4);

  const [color, setColor] = useState("#69a2ff");
  const [eraser, setEraser] = useState(false);
  const [brushSize, setBrushSize] = useState(4);
  const [editPresets, setEditPresets] = useState(false);
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
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = canvasRef.current!;
          const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          context.globalCompositeOperation = "source-over";
          context.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        };
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  /* ---- editable color presets ---- */
  const updatePreset = (index: number, value: string) => {
    const next = colorPresets.map((c, i) => (i === index ? { ...c, value } : c));
    setColorPresets(next);
    setColor(value);
    setEraser(false);
  };
  const removePreset = (index: number) => {
    setColorPresets(colorPresets.filter((_, i) => i !== index));
  };
  const addPreset = () => {
    const next: ColorPreset[] = [...colorPresets, { name: "Nuevo", value: color }];
    setColorPresets(next);
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("No canvas");

      const context = getCtx();
      const isEmpty = (() => {
        if (!context) return true;
        const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] !== 0) return false;
        }
        return true;
      })();

      if (isEmpty) {
        setSubmitStatus({ type: "error", msg: "¡Dibuja algo primero!" });
        setSubmitting(false);
        return;
      }

      const image = canvas.toDataURL("image/png");
      addSubmission({ image, note: note.trim(), author: author.trim() || "Anónimo" });

      setSubmitStatus({ type: "success", msg: "¡Dibujo enviado! Maxine lo revisará pronto ♡" });
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
          {colorPresets.map((c, index) => (
            editPresets ? (
              <span key={index} className="color-edit">
                <input type="color" value={c.value} onChange={(e) => updatePreset(index, e.target.value)} title={`Editar ${c.name}`} />
                <button type="button" className="color-remove" onClick={() => removePreset(index)} aria-label={`Quitar ${c.name}`}><X size={10} /></button>
              </span>
            ) : (
              <button
                key={index}
                className={`color-swatch ${color === c.value && !eraser ? "active" : ""}`}
                style={{ background: c.value }}
                onClick={() => { setColor(c.value); setEraser(false); }}
                title={c.name}
                aria-label={c.name}
              />
            )
          ))}
          {editPresets && (
            <button type="button" className="color-add" onClick={addPreset} aria-label="Agregar color"><Plus size={12} /></button>
          )}
          <label className="color-custom" title="Color personalizado">
            <Paintbrush size={14} />
            <input type="color" value={color} onChange={(e) => { setColor(e.target.value); setEraser(false); }} />
          </label>
        </div>
        <Button variant={editPresets ? "signal" : "station"} size="sm" onClick={() => setEditPresets((v) => !v)}>
          <Palette size={14} /> {editPresets ? "Listo" : "Editar colores"}
        </Button>
      </div>
      <div className="paint-controls">
        <Button variant={eraser ? "signal" : "station"} size="sm" onClick={() => setEraser(!eraser)}><Eraser size={14} /> Borrador</Button>
        <Button variant={!eraser ? "signal" : "station"} size="sm" onClick={() => setEraser(false)}><Brush size={14} /> Pincel</Button>
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
      <canvas ref={canvasRef} width={440} height={220} onPointerDown={start} onPointerMove={draw} onPointerUp={() => (drawingRef.current = false)} onPointerLeave={() => (drawingRef.current = false)} />
      <Input className="paint-author" placeholder="Tu nombre (opcional)..." value={author} onChange={(e) => setAuthor(e.target.value)} />
      <Textarea placeholder="Una notita para Teri..." value={note} onChange={(e) => setNote(e.target.value)} />
      {submitStatus && <p className={`submit-status ${submitStatus.type}`}>{submitStatus.msg}</p>}
      <Button variant="signal" onClick={submit} disabled={submitting}><Send />{submitting ? "Enviando..." : "Enviar dibujo ♡"}</Button>
    </Window>
  );
}

function GalleryDisplay() {
  const store = useCommunityStore();
  const submissions = store.submissions.filter((s) => s.approved);

  if (submissions.length === 0) return <p className="window-copy">Aún no hay dibujos aprobados. ¡Sé el primero en enviar uno! ♡</p>;

  return (
    <div className="community-gallery">
      {submissions.map((s) => (
        <article className="community-art" key={s.id}>
          <img src={s.image || "/placeholder.svg"} alt={`Dibujo de ${s.author}`} />
          <div className="community-art-info">
            <strong>{s.author}</strong>
            {s.note && <p>{s.note}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}

function CommentCard({ comment, adminMode, avatar, username }: { comment: import("@/lib/communityStore").Comment; adminMode: boolean; avatar: string; username: string }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const sendReply = () => {
    if (!replyText.trim()) return;
    addReply(comment.id, { text: replyText.trim(), author: username, avatar });
    setReplyText("");
    setReplyOpen(false);
  };

  return (
    <article className={`comment ${comment.isAdmin ? "comment-admin" : ""}`}>
      <div className="comment-head">
        <div className="comment-identity">
          {comment.avatar ? <img src={comment.avatar || "/placeholder.svg"} alt={comment.author} /> : <span className="comment-anon"><User size={16} /></span>}
          <div>
            <strong>{comment.author}{comment.isAdmin && <small> ADMIN</small>}</strong>
            <span>{new Date(comment.created_at).toLocaleString("es")}</span>
          </div>
        </div>
        {adminMode && (
          <button className="comment-del" onClick={() => removeComment(comment.id)} aria-label="Eliminar comentario"><Trash2 size={13} /></button>
        )}
      </div>
      <p className="comment-body">{comment.text}</p>

      {comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((r) => (
            <div className="comment-reply" key={r.id}>
              {r.avatar ? <img src={r.avatar || "/placeholder.svg"} alt={r.author} /> : <span className="comment-anon"><User size={13} /></span>}
              <div>
                <strong>{r.author} <small>ADMIN</small></strong>
                <p>{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {adminMode && (
        <div className="comment-reply-tools">
          {!replyOpen ? (
            <Button variant="station" size="sm" onClick={() => setReplyOpen(true)}><ReplyIcon size={13} /> Responder</Button>
          ) : (
            <div className="reply-box">
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Tu respuesta..." />
              <div className="reply-actions">
                <EmojiPicker onPick={(emoji) => setReplyText((t) => t + emoji)} />
                <Button variant="signal" size="sm" onClick={sendReply}><Send size={13} /> Enviar</Button>
                <Button variant="station" size="sm" onClick={() => { setReplyOpen(false); setReplyText(""); }}>Cancelar</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Community({ adminMode }: { adminMode: boolean }) {
  const store = useCommunityStore();
  const avatar = useProfileAvatar();
  const username = store.adminUsername;
  const [anonText, setAnonText] = useState("");
  const [adminText, setAdminText] = useState("");

  const sendAnon = () => {
    if (!anonText.trim()) return;
    addComment({ text: anonText.trim(), author: "Anónimo", avatar: "", isAdmin: false });
    setAnonText("");
  };

  const sendAdmin = () => {
    if (!adminText.trim()) return;
    addComment({ text: adminText.trim(), author: username, avatar, isAdmin: true });
    setAdminText("");
  };

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
              <img src={avatar || "/placeholder.svg"} alt="Teri" />
              <div><strong>{username} <small>ADMIN / DEV :3C</small></strong><span>14 sept 2026, 0:24</span></div>
            </div>
            <p>¡Haii! Bienvenidos al muro oficial de la web.</p>
          </article>

          {store.comments.map((c) => (
            <CommentCard key={c.id} comment={c} adminMode={adminMode} avatar={avatar} username={username} />
          ))}

          {adminMode ? (
            <div className="admin-comment-box">
              <div className="admin-comment-id">
                <img src={avatar || "/placeholder.svg"} alt={username} />
                <span>Comentando como <strong>{username}</strong></span>
              </div>
              <Textarea value={adminText} onChange={(e) => setAdminText(e.target.value)} placeholder={`Escribe como ${username}...`} />
              <div className="reply-actions">
                <EmojiPicker onPick={(emoji) => setAdminText((t) => t + emoji)} />
                <Button variant="signal" onClick={sendAdmin}><MessageCircle size={14} /> Publicar</Button>
              </div>
            </div>
          ) : (
            <div className="anon-comment-box">
              <Textarea value={anonText} onChange={(e) => setAnonText(e.target.value)} placeholder="Tu comentario anónimo..." />
              <Button variant="signal" onClick={sendAnon}><MessageCircle size={14} /> Enviar</Button>
              <p className="window-copy anon-hint">Para comentar con nombre de usuario y responder necesitas acceso admin.</p>
            </div>
          )}
        </Window>
        <div className="community-side">
          <Window title="Bocetos y rayones">
            <p className="window-copy">Favoritos elegidos por Maxi</p>
            <GalleryDisplay />
          </Window>
          <PaintCanvas />
          <Window title="Notita">
            <p className="window-copy">Los dibujos y comentarios aparecen cuando Maxine los aprueba. Después él puede responderte.</p>
          </Window>
        </div>
      </div>
      <ProfileBand />
    </main>
  );
}

type AdminTab = "envios" | "perfil" | "imagenes" | "colores";

function AdminPanel({ onClose }: { onClose: () => void }) {
  const store = useCommunityStore();
  const [tab, setTab] = useState<AdminTab>("envios");
  const pending = store.submissions.filter((s) => !s.approved).length;

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2><LockKeyhole size={18} /> Panel de Administración</h2>
        <Button variant="station" size="sm" onClick={onClose}><X size={14} /> Cerrar</Button>
      </div>
      <div className="admin-tabs">
        <button className={tab === "envios" ? "active" : ""} onClick={() => setTab("envios")}>Envíos {pending > 0 && <span className="tab-count">{pending}</span>}</button>
        <button className={tab === "perfil" ? "active" : ""} onClick={() => setTab("perfil")}>Perfil</button>
        <button className={tab === "imagenes" ? "active" : ""} onClick={() => setTab("imagenes")}>Imágenes</button>
        <button className={tab === "colores" ? "active" : ""} onClick={() => setTab("colores")}>Colores</button>
      </div>
      {tab === "envios" && <AdminSubmissions />}
      {tab === "perfil" && <AdminProfile />}
      {tab === "imagenes" && <AdminImages />}
      {tab === "colores" && <AdminColors />}
    </div>
  );
}

function AdminSubmissions() {
  const store = useCommunityStore();
  const submissions = store.submissions;

  if (submissions.length === 0) return <p className="window-copy admin-body">No hay envíos todavía.</p>;

  return (
    <div className="admin-grid">
      {submissions.map((s) => (
        <article key={s.id} className={`admin-card ${s.approved ? "approved" : "pending"}`}>
          <div className="admin-card-image">
            <img src={s.image || "/placeholder.svg"} alt={`Dibujo de ${s.author}`} />
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
              <Button variant="signal" size="sm" onClick={() => setSubmissionApproved(s.id, true)}><Check size={14} /> Aprobar</Button>
            ) : (
              <Button variant="station" size="sm" onClick={() => setSubmissionApproved(s.id, false)}><Eye size={14} /> Ocultar</Button>
            )}
            <Button variant="destructive" size="sm" onClick={() => removeSubmission(s.id)}><Trash2 size={14} /> Eliminar</Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function AdminProfile() {
  const store = useCommunityStore();
  const [name, setName] = useState(store.adminUsername);
  const [saved, setSaved] = useState(false);
  const avatar = store.siteImages["profileAvatar"] ?? avatarAsset.url;

  const onAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setSiteImage("profileAvatar", dataUrl);
    event.target.value = "";
  };

  const save = () => {
    setAdminUsername(name.trim() || "Maxine");
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="admin-body admin-form">
      <h3>Tu perfil</h3>
      <p className="window-copy">Se usa en tus comentarios, respuestas y en las fotos de perfil de toda la página.</p>
      <div className="admin-avatar-row">
        <img src={avatar || "/placeholder.svg"} alt="Foto de perfil actual" />
        <label className="upload-button">
          <Upload size={16} />
          <span>Cambiar foto de perfil</span>
          <input type="file" accept="image/*" onChange={onAvatar} style={{ display: "none" }} />
        </label>
      </div>
      <label className="admin-field">
        <span>Nombre de usuario</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de usuario" />
      </label>
      <Button variant="signal" onClick={save}><Check size={14} /> {saved ? "¡Guardado!" : "Guardar cambios"}</Button>
    </div>
  );
}

function AdminImages() {
  const store = useCommunityStore();

  const onUpload = (slot: string) => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setSiteImage(slot, dataUrl);
    event.target.value = "";
  };

  return (
    <div className="admin-body">
      <h3>Imágenes de la página</h3>
      <p className="window-copy">Elige la imagen de cada espacio. Si no eliges ninguna, se usa la imagen por defecto.</p>
      <div className="admin-image-grid">
        {SITE_IMAGE_SLOTS.map((slot) => {
          const current = store.siteImages[slot.key];
          return (
            <div className="admin-image-slot" key={slot.key}>
              <div className="admin-image-preview">
                <img src={current || avatarAsset.url} alt={slot.label} />
              </div>
              <strong>{slot.label}</strong>
              <div className="admin-image-actions">
                <label className="upload-button">
                  <Upload size={14} />
                  <span>Elegir imagen</span>
                  <input type="file" accept="image/*" onChange={onUpload(slot.key)} style={{ display: "none" }} />
                </label>
                {current && (
                  <Button variant="station" size="sm" onClick={() => clearSiteImage(slot.key)}><RotateCcw size={13} /> Restaurar</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminColors() {
  const store = useCommunityStore();
  const presets = store.colorPresets;

  const update = (index: number, patch: Partial<ColorPreset>) => {
    setColorPresets(presets.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };
  const remove = (index: number) => setColorPresets(presets.filter((_, i) => i !== index));
  const add = () => setColorPresets([...presets, { name: "Nuevo", value: "#69a2ff" }]);

  return (
    <div className="admin-body">
      <h3>Colores del Paint</h3>
      <p className="window-copy">Edita los presets de color que la comunidad usa para dibujar.</p>
      <div className="admin-color-list">
        {presets.map((c, index) => (
          <div className="admin-color-row" key={index}>
            <input type="color" value={c.value} onChange={(e) => update(index, { value: e.target.value })} />
            <Input value={c.name} onChange={(e) => update(index, { name: e.target.value })} placeholder="Nombre" />
            <Button variant="destructive" size="sm" onClick={() => remove(index)}><X size={13} /></Button>
          </div>
        ))}
      </div>
      <Button variant="signal" size="sm" onClick={add}><Plus size={14} /> Agregar color</Button>
    </div>
  );
}

function About() {
  const avatar = useProfileAvatar();
  return <main className="page-shell narrow"><div className="page-heading"><p className="eyebrow">PROFILE://ABOUT</p><h1>Sobre Mí.</h1><p>Mi pequeño rincón personal estilo Strawpage</p></div><div className="about-stack"><Window title="ABOUT_TERIDAYO.TXT"><div className="about-note"><img src={avatar} alt="Avatar TeriDayo" /><p>✨ ¡Haii! Bienvenidos a mi Strawpage personal. Aquí comparto un poco sobre mí, mis gustos y rayones favoritos.</p></div></Window><Window title="INTERESTS.LOG"><div className="large-art"><SiteImg slot="aboutArt" fallback={avatarAsset.url} alt="Arte pixel de TeriDayo" /></div></Window></div><ProfileBand /></main>;
}

function Contact() {
  const avatar = useProfileAvatar();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  return <main className="page-shell narrow"><div className="page-heading"><p className="eyebrow">TERIDAYO.CONTACT // SYSTEM.EXE</p><h1>Contacto</h1><p>Haz clic en el póster de credencial para abrir el canal directo con Teri.</p></div><button className="credential-button" onClick={() => setOpen(true)}><img src={orcaAsset.url} alt="Credencial de orcas" /><span>[ ABRIR CREDENCIAL ]</span></button>{open && <Window title="TeriDayo_contact.exe" className="contact-card"><div className="contact-identity"><img src={avatar} alt="Avatar" /><div><p className="eyebrow">@TeriDayo_</p><h2>Anthony Benjamin "TeriDayo"</h2><p>Artista digital 2D + modelador 3D (ESP / ENG)</p></div></div><div className="info-grid"><span><b>Nombre</b>Anthony Benjamin</span><span><b>Pronombres</b>He / Him</span><span><b>Edad</b>20 y/o</span><span><b>Ubicación</b>México 🇲🇽</span></div><h3>¡Hablemos de arte o proyectos! 💬</h3><Input placeholder="Tu nombre o redes..." /><Textarea placeholder="Escribe tu mensaje aquí..." /><Button variant="signal" onClick={() => setSent(true)}><Send />{sent ? "¡Mensaje enviado!" : "Enviar mensaje ♡"}</Button></Window>}<ProfileBand /></main>;
}

export function TeriApp() {
  const [page, setPageState] = useState<Page>("inicio");
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const setPage = (next: Page) => { setPageState(next); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleAdminAccess = () => {
    if (adminMode) {
      setAdminPanelOpen(true);
    } else {
      setAdminLoginOpen(true);
    }
  };

  return (
    <div className="app-shell">
      <div className="ambient-grid" />
      <div className="scanline" />
      <Header page={page} setPage={setPage} onAdminAccess={handleAdminAccess} />
      {adminMode && adminPanelOpen && <AdminPanel onClose={() => setAdminPanelOpen(false)} />}
      {page === "inicio" && <Home setPage={setPage} />}
      {page === "portafolio" && <Portfolio />}
      {page === "comunidad" && <Community adminMode={adminMode} />}
      {page === "sobre-mi" && <About />}
      {page === "contacto" && <Contact />}
      <footer className="system-footer"><span>MUNCHINE ONLINE!</span><span>ENLACES VERIFICADOS · ES · 01:23 P.M.</span><div><Play size={12} /> DEEP_SEA_SIGNAL.WAV</div></footer>
      <AdminLoginDialog
        open={adminLoginOpen}
        onOpenChange={setAdminLoginOpen}
        onSuccess={() => { setAdminMode(true); setAdminLoginOpen(false); setAdminPanelOpen(true); }}
      />
    </div>
  );
}
