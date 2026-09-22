import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  Brush,
  ChevronDown,
  Coffee,
  Eraser,
  Folder,
  LockKeyhole,
  Menu,
  MessageCircle,
  Minus,
  Orbit,
  Paintbrush,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  X,
} from "lucide-react";
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

function Header({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  return (
    <>
      <header className="site-header">
        <button className="brand" onClick={() => setPage("inicio")} aria-label="Ir a inicio"><Orbit /> Munchxine!</button>
        <Button variant="ghost" size="icon" className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Abrir menú"><Menu /></Button>
        <nav className={open ? "nav-list is-open" : "nav-list"} aria-label="Navegación principal">
          {nav.map((item) => (
            <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => { setPage(item.id); setOpen(false); }}>{item.label}</button>
          ))}
          <button onClick={() => setAdminOpen(true)} aria-label="Administración"><LockKeyhole size={14} /> Admin</button>
        </nav>
      </header>
      <div className="breadcrumb"><Orbit size={12} /><span>Munchxine!</span><span>/</span><span>{page === "inicio" ? "Estudio creativo" : nav.find((item) => item.id === page)?.label}</span><Sparkles size={11} /></div>
      <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
        <DialogContent className="station-dialog">
          <DialogHeader><DialogTitle>admin_login.exe</DialogTitle><DialogDescription>Zona restringida de TeriDayo.</DialogDescription></DialogHeader>
          <Input type="password" placeholder="Contraseña (teri123)" />
          <Button variant="signal">Entrar</Button>
        </DialogContent>
      </Dialog>
    </>
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
                <div className={`stage-art final ${stage === 2 ? "visible" : ""}`}><img src={avatarAsset.url} alt="Ilustración final de Teri" /></div>
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
  return (
    <section className="profile-band">
      <Window title="Munchxine_profile.exe"><div className="profile-content"><img src={avatarAsset.url} alt="Avatar pixel art de TeriDayo" /><div><p className="eyebrow">HIYAAA!!</p><h2>TeriDayo / Anthony / Matt</h2><p>Artista chileno de 19 años • Arte 2D y 3D • ESP / ENG</p><div className="tags"><span>Roblox</span><span>ARGs</span><span>Pokemon</span></div></div></div></Window>
      <Window title="ACCESOS_DIRECTOS"><div className="online-content"><h2>Maxine Online!</h2><div className="social-row"><Button variant="station"><X /> Twitter / X</Button><Button variant="station"><Coffee /> Ko-fi</Button></div><div className="online-art"><img src={avatarAsset.url} alt="Teri online" /><span>@Munchxine_</span></div></div></Window>
    </section>
  );
}

function Home({ setPage }: { setPage: (page: Page) => void }) {
  return <><TabletExperience setPage={setPage} /><section className="intro-band"><Window title="Munchxine.txt"><div className="intro-copy"><img src={avatarAsset.url} alt="Avatar de Teri" /><div><p className="eyebrow">WELCOME_NOTE.LOG</p><h2>¡Haii! Mi nombre es Maxine.</h2><p>Soy un artista digital enfocado en el arte 2D, tando ilustracion como modelos Vtuber/Pngtuber. </p></div></div></Window></section><ProfileBand /></>;
}

function Portfolio() {
  const [category, setCategory] = useState("Todas las obras");
  return <main className="page-shell"><div className="page-heading"><p className="eyebrow">ARCHIVE://VISUAL_WORKS</p><h1>Portafolio de arte</h1><p>Dibujos, GIFs, videos, ideas y universos guardados en carpetas.</p></div><div className="portfolio-layout"><Window title="Carpetas de Teri" className="folder-window">{["Todas las obras", "Drawings", "Doodles", "Renders"].map((name) => <Button key={name} variant={category === name ? "signal" : "station"} onClick={() => setCategory(name)}><Folder />{name}</Button>)}</Window><Window title={category} className="gallery-window"><div className="gallery-grid"><article className="art-card"><div className="art-preview"><img src={avatarAsset.url} alt="MEGAMAN" /></div><strong>MEGAMAN!!!</strong><span>DIGITAL_ARCHIVE_001</span></article></div></Window></div><ProfileBand /></main>;
}

function PaintCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const context = ref.current.getContext("2d");
    if (!context) return;
    context.lineWidth = 3; context.lineCap = "round"; context.strokeStyle = "#69a2ff";
    context.lineTo(event.clientX - rect.left, event.clientY - rect.top); context.stroke();
  };
  const start = (event: PointerEvent<HTMLCanvasElement>) => { drawing.current = true; const context = ref.current?.getContext("2d"); if (context) { context.beginPath(); const rect = event.currentTarget.getBoundingClientRect(); context.moveTo(event.clientX - rect.left, event.clientY - rect.top); } };
  const clear = () => ref.current?.getContext("2d")?.clearRect(0, 0, ref.current.width, ref.current.height);
  return <Window title="Paint para Teri" className="paint-window"><p>Dibuja algo bonito, raro o muy tú.</p><div className="paint-tools"><Brush size={16} /><span>COLOR_#69A2FF</span><Eraser size={16} /></div><canvas ref={ref} width={440} height={220} onPointerDown={start} onPointerMove={draw} onPointerUp={() => drawing.current = false} onPointerLeave={() => drawing.current = false} /><Button variant="station" onClick={clear}><RotateCcw />Limpiar</Button><Textarea placeholder="Una notita para Teri..." /><Button variant="signal"><Send />Enviar dibujo ♡</Button></Window>;
}

function Community() {
  const [comments, setComments] = useState<string[]>([]); const [comment, setComment] = useState("");
  return <main className="page-shell"><div className="page-heading"><p className="eyebrow">COMMUNITY://ONLINE</p><h1>Mi rincón en internet ♡</h1><p>Updates, pensamientos, comentarios y dibujitos de la comunidad.</p></div><div className="community-grid"><Window title="Muro de Teri" className="wall"><article className="post"><div className="post-author"><img src={avatarAsset.url} alt="Teri" /><div><strong>TeriDayo <small>ADMIN / DEV :3C</small></strong><span>14 sept 2026, 0:24</span></div></div><p>¡Haii! Bienvenidos al muro oficial de la web.</p></article>{comments.map((item, index) => <article className="comment" key={`${item}-${index}`}>{item}</article>)}<Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tu comentario anónimo..." /><Button variant="signal" onClick={() => { if (comment.trim()) { setComments([...comments, comment]); setComment(""); } }}><MessageCircle />Enviar</Button></Window><div className="community-side"><Window title="Bocetos y rayones"><p className="window-copy">Favoritos elegidos por Teri.</p><div className="sketch-card"><img src={avatarAsset.url} alt="Boceto destacado" /><strong>Ask me Anything!</strong></div></Window><PaintCanvas /><Window title="Notita"><p className="window-copy">Los dibujos y comentarios aparecen cuando Teri los aprueba. Después él puede responderte.</p></Window></div></div><ProfileBand /></main>;
}

function About() {
  return <main className="page-shell narrow"><div className="page-heading"><p className="eyebrow">PROFILE://ABOUT</p><h1>Sobre Mí.</h1><p>Mi pequeño rincón personal estilo Strawpage</p></div><div className="about-stack"><Window title="ABOUT_TERIDAYO.TXT"><div className="about-note"><img src={avatarAsset.url} alt="Avatar TeriDayo" /><p>✨ ¡Haii! Bienvenidos a mi Strawpage personal. Aquí comparto un poco sobre mí, mis gustos y rayones favoritos.</p></div></Window><Window title="INTERESTS.LOG"><div className="large-art"><img src={avatarAsset.url} alt="Arte pixel de TeriDayo" /></div></Window></div><ProfileBand /></main>;
}

function Contact() {
  const [open, setOpen] = useState(false); const [sent, setSent] = useState(false);
  return <main className="page-shell narrow"><div className="page-heading"><p className="eyebrow">TERIDAYO.CONTACT // SYSTEM.EXE</p><h1>Contacto</h1><p>Haz clic en el póster de credencial para abrir el canal directo con Teri.</p></div><button className="credential-button" onClick={() => setOpen(true)}><img src={orcaAsset.url} alt="Credencial de orcas" /><span>[ ABRIR CREDENCIAL ]</span></button>{open && <Window title="TeriDayo_contact.exe" className="contact-card"><div className="contact-identity"><img src={avatarAsset.url} alt="Avatar" /><div><p className="eyebrow">@TeriDayo_</p><h2>Anthony Benjamin “TeriDayo”</h2><p>Artista digital 2D + modelador 3D (ESP / ENG)</p></div></div><div className="info-grid"><span><b>Nombre</b>Anthony Benjamin</span><span><b>Pronombres</b>He / Him</span><span><b>Edad</b>20 y/o</span><span><b>Ubicación</b>México 🇲🇽</span></div><h3>¡Hablemos de arte o proyectos! 💬</h3><Input placeholder="Tu nombre o redes..." /><Textarea placeholder="Escribe tu mensaje aquí..." /><Button variant="signal" onClick={() => setSent(true)}><Send />{sent ? "¡Mensaje enviado!" : "Enviar mensaje ♡"}</Button></Window>}<ProfileBand /></main>;
}

export function TeriApp() {
  const [page, setPageState] = useState<Page>("inicio");
  const setPage = (next: Page) => { setPageState(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return <div className="app-shell"><div className="ambient-grid" /><div className="scanline" /><Header page={page} setPage={setPage} />{page === "inicio" && <Home setPage={setPage} />}{page === "portafolio" && <Portfolio />}{page === "comunidad" && <Community />}{page === "sobre-mi" && <About />}{page === "contacto" && <Contact />}<footer className="system-footer"><span>TERI ONLINE!</span><span>ENLACES VERIFICADOS · ES · 01:23 P.M.</span><div><Play size={12} /> DEEP_SEA_SIGNAL.WAV</div></footer></div>;
}