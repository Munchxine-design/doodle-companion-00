import { useState, useRef, type ChangeEvent } from "react";
import { Check, Eye, ImageIcon, LockKeyhole, Plus, Smile, Trash2, Upload, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSite, IMAGE_LIST, fileToDataUrl, placeholderImg } from "@/context/SiteContext";

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const {
    submissions, approveSubmission, deleteSubmission,
    profile, setProfile,
    siteImages, setSiteImage,
    portfolioWorks, addPortfolioWork, removePortfolioWork,
    customEmojis, addEmoji, removeEmoji,
  } = useSite();

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2><LockKeyhole size={18} /> Panel de Administración</h2>
        <Button variant="station" size="sm" onClick={onClose}><X size={14} /> Cerrar</Button>
      </div>
      <div className="admin-tabs-wrapper">
        <Tabs defaultValue="submissions">
          <TabsList className="admin-tabs-list">
            <TabsTrigger value="submissions">Envíos</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="images">Imágenes</TabsTrigger>
            <TabsTrigger value="emojis">Emojis</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <SubmissionsTab
              submissions={submissions}
              approve={approveSubmission}
              remove={deleteSubmission}
            />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab
              profile={profile}
              setProfile={setProfile}
            />
          </TabsContent>

          <TabsContent value="images">
            <ImagesTab
              siteImages={siteImages}
              setSiteImage={setSiteImage}
              portfolioWorks={portfolioWorks}
              addPortfolioWork={addPortfolioWork}
              removePortfolioWork={removePortfolioWork}
            />
          </TabsContent>

          <TabsContent value="emojis">
            <EmojisTab
              emojis={customEmojis}
              addEmoji={addEmoji}
              removeEmoji={removeEmoji}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SubmissionsTab({ submissions, approve, remove }: {
  submissions: ReturnType<typeof useSite>["submissions"];
  approve: (id: string, v: boolean) => void;
  remove: (id: string) => void;
}) {
  if (submissions.length === 0)
    return <p className="admin-empty">No hay envíos todavía.</p>;

  return (
    <div className="admin-grid">
      {submissions.map((s) => (
        <article key={s.id} className={`admin-card ${s.approved ? "approved" : "pending"}`}>
          <div className="admin-card-image">
            <img src={s.imageData} alt={`Dibujo de ${s.author}`} />
            <span className={`admin-badge ${s.approved ? "badge-approved" : "badge-pending"}`}>
              {s.approved ? "APROBADO" : "PENDIENTE"}
            </span>
          </div>
          <div className="admin-card-info">
            <strong>{s.author}</strong>
            {s.note && <p>{s.note}</p>}
            <span className="admin-date">{new Date(s.createdAt).toLocaleString("es")}</span>
          </div>
          <div className="admin-card-actions">
            {!s.approved ? (
              <Button variant="signal" size="sm" onClick={() => approve(s.id, true)}><Check size={14} /> Aprobar</Button>
            ) : (
              <Button variant="station" size="sm" onClick={() => approve(s.id, false)}><Eye size={14} /> Ocultar</Button>
            )}
            <Button variant="destructive" size="sm" onClick={() => remove(s.id)}><Trash2 size={14} /> Eliminar</Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProfileTab({ profile, setProfile }: {
  profile: { username: string; avatar: string };
  setProfile: (p: { username: string; avatar: string }) => void;
}) {
  const [username, setUsername] = useState(profile.username);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setProfile({ ...profile, avatar: dataUrl });
  };

  const save = () => {
    setProfile({ username: username.trim() || "Maxine", avatar: profile.avatar });
  };

  return (
    <div className="admin-section">
      <h3 className="admin-section-title"><User size={16} /> Datos de perfil</h3>
      <div className="admin-profile-edit">
        <div className="admin-avatar-preview">
          <img src={profile.avatar} alt="Avatar" />
          <button className="admin-upload-btn" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Cambiar foto
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: "none" }} />
        </div>
        <div className="admin-profile-form">
          <label className="admin-label">Nombre de usuario</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Maxine" />
          <Button variant="signal" onClick={save}>Guardar perfil</Button>
          <p className="admin-hint">Este nombre y foto aparecerán en comentarios y secciones del sitio.</p>
        </div>
      </div>
    </div>
  );
}

function ImagesTab({ siteImages, setSiteImage, portfolioWorks, addPortfolioWork, removePortfolioWork }: {
  siteImages: Record<string, string>;
  setSiteImage: (key: string, url: string) => void;
  portfolioWorks: ReturnType<typeof useSite>["portfolioWorks"];
  addPortfolioWork: (title: string, imageData: string) => void;
  removePortfolioWork: (id: string) => void;
}) {
  const handleUpload = (key: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileToDataUrl(file).then((url) => setSiteImage(key, url));
  };

  const [newTitle, setNewTitle] = useState("");
  const portfolioFileRef = useRef<HTMLInputElement>(null);

  const handlePortfolioUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileToDataUrl(file).then((url) => {
      addPortfolioWork(newTitle.trim() || "Sin título", url);
      setNewTitle("");
    });
  };

  return (
    <div className="admin-section">
      <h3 className="admin-section-title"><ImageIcon size={16} /> Imágenes del sitio</h3>
      <div className="admin-images-grid">
        {IMAGE_LIST.map((img) => (
          <div className="admin-image-card" key={img.key}>
            <img src={siteImages[img.key]} alt={img.label} />
            <span>{img.label}</span>
            <button className="admin-upload-btn" onClick={() => document.getElementById(`img-${img.key}`)?.click()}>
              <Upload size={14} /> Cambiar
            </button>
            <input id={`img-${img.key}`} type="file" accept="image/*" onChange={(e) => handleUpload(img.key, e)} style={{ display: "none" }} />
          </div>
        ))}
      </div>

      <h3 className="admin-section-title" style={{ marginTop: "32px" }}><Plus size={16} /> Galería del portafolio</h3>
      <div className="admin-portfolio-add">
        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título de la obra..." />
        <Button variant="station" onClick={() => portfolioFileRef.current?.click()}>
          <Upload size={14} /> Subir obra
        </Button>
        <input ref={portfolioFileRef} type="file" accept="image/*" onChange={handlePortfolioUpload} style={{ display: "none" }} />
      </div>
      <div className="admin-portfolio-grid">
        {portfolioWorks.map((w) => (
          <div className="admin-portfolio-item" key={w.id}>
            <img src={w.imageData} alt={w.title} />
            <span>{w.title}</span>
            <button className="admin-remove-btn" onClick={() => removePortfolioWork(w.id)}>
              <Trash2 size={12} /> Quitar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmojisTab({ emojis, addEmoji, removeEmoji }: {
  emojis: ReturnType<typeof useSite>["customEmojis"];
  addEmoji: (name: string, image: string) => void;
  removeEmoji: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileToDataUrl(file).then((url) => {
      addEmoji(name.trim() || "emoji", url);
      setName("");
    });
  };

  return (
    <div className="admin-section">
      <h3 className="admin-section-title"><Smile size={16} /> Emojis personalizados</h3>
      <div className="admin-emoji-add">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del emoji..." />
        <Button variant="station" onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> Subir emoji
        </Button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
      </div>
      {emojis.length === 0 ? (
        <p className="admin-empty">No hay emojis personalizados todavía. ¡Sube el primero! ♡</p>
      ) : (
        <div className="admin-emoji-grid">
          {emojis.map((e) => (
            <div className="admin-emoji-item" key={e.id}>
              <img src={e.image} alt={e.name} />
              <span>{e.name}</span>
              <button className="admin-remove-btn" onClick={() => removeEmoji(e.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
