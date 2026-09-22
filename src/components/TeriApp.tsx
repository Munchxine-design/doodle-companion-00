import { useEffect, useRef, useState } from "react";
import { ChevronDown, Coffee, Folder, LockKeyhole, Menu, Orbit, Play, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Window } from "@/components/Window";
import { SiteProvider, useSite } from "@/context/SiteContext";
import { PaintCanvas } from "@/components/community/PaintCanvas";
import { GalleryDisplay } from "@/components/community/GalleryDisplay";
import { CommentWall } from "@/components/community/CommentWall";
import { AdminPanel } from "@/components/admin/AdminPanel";

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
  const { siteImages } = useSite();
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
                <div className={`stage-art final ${stage === 2 ? "visible" : ""}`}><img src={siteImages.avatar} alt="Ilustración final de Teri" /></div>
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
  const { profile, siteImages } = useSite();
  return (
    <section className="profile-band">
      <Window title="Munchxine_profile.exe"><div className="profile-content"><img src={siteImages.avatar} alt={`Avatar de ${profile.username}`} /><div><p className="eyebrow">HIYAAA!!</p><h2>{profile.username}</h2><p>Artista digital • Arte 2D y 3D • ESP / ENG</p><div className="tags"><span>Roblox</span><span>ARGs</span><span>Pokemon</span></div></div></div></Window>
      <Window title="ACCESOS_DIRECTOS"><div className="online-content"><h2>{profile.username} Online!</h2><div className="social-row"><Button variant="station"><X /> Twitter / X</Button><Button variant="station"><Coffee /> Ko-fi</Button></div><div className="online-art"><img src={siteImages.avatar} alt={profile.username} /><span>@Munchxine_</span></div></div></Window>
    </section>
  );
}

function Home({ setPage }: { setPage: (page: Page) => void }) {
  const { siteImages } = useSite();
  return <><TabletExperience setPage={setPage} /><section className="intro-band"><Window title="Munchxine.txt"><div className="intro-copy"><img src={siteImages.avatar} alt="Avatar de Teri" /><div><p className="eyebrow">WELCOME_NOTE.LOG</p><h2>¡Haii! Mi nombre es Maxine.</h2><p>Soy un artista digital enfocado en el arte 2D, tando ilustracion como modelos Vtuber/Pngtuber. </p></div></div></Window></section><ProfileBand /></>;
}

function Portfolio() {
  const { portfolioWorks } = useSite();
  const [category, setCategory] = useState("Todas las obras");
  return <main className="page-shell"><div className="page-heading"><p className="eyebrow">ARCHIVE://VISUAL_WORKS</p><h1>Portafolio de arte</h1><p>Dibujos, GIFs, videos, ideas y universos guardados en carpetas.</p></div><div className="portfolio-layout"><Window title="Carpetas de Maxine" className="folder-window">{["Todas las obras", "Drawings", "Doodles", "Renders"].map((name) => <Button key={name} variant={category === name ? "signal" : "station"} onClick={() => setCategory(name)}><Folder />{name}</Button>)}</Window><Window title={category} className="gallery-window"><div className="gallery-grid">{portfolioWorks.map((w, i) => <article className="art-card" key={w.id}><div className="art-preview"><img src={w.imageData} alt={w.title} /></div><strong>{w.title}</strong><span>DIGITAL_ARCHIVE_{String(i + 1).padStart(3, "0")}</span></article>)}</div></Window></div><ProfileBand /></main>;
}

function Community() {
  return <main className="page-shell"><div className="page-heading"><p className="eyebrow">COMMUNITY://ONLINE</p><h1>Mi rincón en internet ♡</h1><p>Updates, pensamientos, comentarios y dibujitos de la comunidad.</p></div><div className="community-grid"><CommentWall /><div className="community-side"><Window title="Bocetos y rayones"><p className="window-copy">Favoritos elegidos por Maxi</p><GalleryDisplay /></Window><PaintCanvas /><Window title="Notita"><p className="window-copy">Los dibujos y comentarios aparecen cuando Maxine los aprueba. Después él puede responderte.</p></Window></div></div><ProfileBand /></main>;
}

function About() {
  const { siteImages } = useSite();
  return <main className="page-shell narrow"><div className="page-heading"><p className="eyebrow">PROFILE://ABOUT</p><h1>Sobre Mí.</h1><p>Mi pequeño rincón personal estilo Strawpage</p></div><div className="about-stack"><Window title="ABOUT_TERIDAYO.TXT"><div className="about-note"><img src={siteImages.avatar} alt="Avatar TeriDayo" /><p>✨ ¡Haii! Bienvenidos a mi Strawpage personal. Aquí comparto un poco sobre mí, mis gustos y rayones favoritos.</p></div></Window><Window title="INTERESTS.LOG"><div className="large-art"><img src={siteImages.avatar} alt="Arte pixel de TeriDayo" /></div></Window></div><ProfileBand /></main>;
}

function Contact() {
  const { siteImages, profile } = useSite();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  return <main className="page-shell narrow"><div className="page-heading"><p className="eyebrow">TERIDAYO.CONTACT // SYSTEM.EXE</p><h1>Contacto</h1><p>Haz clic en el póster de credencial para abrir el canal directo con Teri.</p></div><button className="credential-button" onClick={() => setOpen(true)}><img src={siteImages.orca} alt="Credencial de orcas" /><span>[ ABRIR CREDENCIAL ]</span></button>{open && <Window title="TeriDayo_contact.exe" className="contact-card"><div className="contact-identity"><img src={siteImages.avatar} alt="Avatar" /><div><p className="eyebrow">@TeriDayo_</p><h2>{profile.username}</h2><p>Artista digital 2D + modelador 3D (ESP / ENG)</p></div></div><div className="info-grid"><span><b>Nombre</b>Anthony Benjamin</span><span><b>Pronombres</b>He / Him</span><span><b>Edad</b>20 y/o</span><span><b>Ubicación</b>México 🇲🇽</span></div><h3>¡Hablemos de arte o proyectos! 💬</h3><Input placeholder="Tu nombre o redes..." /><Textarea placeholder="Escribe tu mensaje aquí..." /><Button variant="signal" onClick={() => setSent(true)}><Send />{sent ? "¡Mensaje enviado!" : "Enviar mensaje ♡"}</Button></Window>}<ProfileBand /></main>;
}

function TeriAppInner() {
  const { isAdmin, setIsAdmin } = useSite();
  const [page, setPageState] = useState<Page>("inicio");
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const setPage = (next: Page) => { setPageState(next); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleAdminAccess = () => {
    if (isAdmin) {
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
      {adminPanelOpen && isAdmin && <AdminPanel onClose={() => setAdminPanelOpen(false)} />}
      {page === "inicio" && <Home setPage={setPage} />}
      {page === "portafolio" && <Portfolio />}
      {page === "comunidad" && <Community />}
      {page === "sobre-mi" && <About />}
      {page === "contacto" && <Contact />}
      <footer className="system-footer"><span>MUNCHINE ONLINE!</span><span>ENLACES VERIFICADOS · ES · 01:23 P.M.</span><div><Play size={12} /> DEEP_SEA_SIGNAL.WAV</div></footer>
      <AdminLoginDialog
        open={adminLoginOpen}
        onOpenChange={setAdminLoginOpen}
        onSuccess={() => { setIsAdmin(true); setAdminPanelOpen(true); setAdminLoginOpen(false); }}
      />
    </div>
  );
}

export function TeriApp() {
  return (
    <SiteProvider>
      <TeriAppInner />
    </SiteProvider>
  );
}
