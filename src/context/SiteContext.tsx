import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface CustomEmoji {
  id: string;
  name: string;
  image: string;
}

export interface Reply {
  id: string;
  author: string;
  avatar: string;
  text: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  isAdmin: boolean;
  createdAt: string;
  replies: Reply[];
}

export interface Submission {
  id: string;
  imageData: string;
  note: string;
  author: string;
  approved: boolean;
  createdAt: string;
}

export interface PortfolioWork {
  id: string;
  title: string;
  imageData: string;
}

export const IMAGE_LIST = [
  { key: "avatar", label: "Foto de perfil / Avatar" },
  { key: "orca", label: "Credencial de contacto" },
] as const;

export function placeholderImg(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#1a1a2e"/><rect width="200" height="200" fill="#69a2ff" opacity="0.08"/><text x="100" y="100" text-anchor="middle" dy=".35em" fill="#69a2ff" opacity="0.4" font-family="monospace" font-size="12">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const DEFAULT_AVATAR = placeholderImg("AVATAR");
const DEFAULT_ORCA = placeholderImg("ORCA");

interface SiteContextValue {
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  profile: { username: string; avatar: string };
  setProfile: (p: { username: string; avatar: string }) => void;
  siteImages: Record<string, string>;
  setSiteImage: (key: string, url: string) => void;
  portfolioWorks: PortfolioWork[];
  addPortfolioWork: (title: string, imageData: string) => void;
  removePortfolioWork: (id: string) => void;
  customEmojis: CustomEmoji[];
  addEmoji: (name: string, image: string) => void;
  removeEmoji: (id: string) => void;
  comments: Comment[];
  addComment: (c: { author: string; avatar: string; text: string; isAdmin: boolean }) => void;
  addReply: (commentId: string, r: { author: string; avatar: string; text: string }) => void;
  submissions: Submission[];
  addSubmission: (s: { imageData: string; note: string; author: string }) => void;
  approveSubmission: (id: string, approved: boolean) => void;
  deleteSubmission: (id: string) => void;
}

const SiteContext = createContext<SiteContextValue | null>(null);

function usePersistentState<T>(key: string, defaultValue: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(defaultValue);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setState(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [key]);
  const update = (value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };
  return [state, update];
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = usePersistentState("teri_profile", { username: "Maxine", avatar: DEFAULT_AVATAR });
  const [siteImages, setSiteImages] = usePersistentState("teri_images", { avatar: DEFAULT_AVATAR, orca: DEFAULT_ORCA });
  const [portfolioWorks, setPortfolioWorks] = usePersistentState<PortfolioWork[]>("teri_portfolio", [
    { id: "w1", title: "MEGAMAN!!!", imageData: placeholderImg("MEGAMAN") },
  ]);
  const [customEmojis, setCustomEmojis] = usePersistentState<CustomEmoji[]>("teri_emojis", []);
  const [comments, setComments] = usePersistentState<Comment[]>("teri_comments", [
    { id: "c0", author: "Maxine", avatar: DEFAULT_AVATAR, text: "¡Haii! Bienvenidos al muro oficial de la web.", isAdmin: true, createdAt: "2026-09-14T00:24:00.000Z", replies: [] },
  ]);
  const [submissions, setSubmissions] = usePersistentState<Submission[]>("teri_submissions", []);

  const value: SiteContextValue = {
    isAdmin,
    setIsAdmin,
    profile,
    setProfile,
    siteImages,
    setSiteImage: (key, url) => setSiteImages((prev) => ({ ...prev, [key]: url })),
    portfolioWorks,
    addPortfolioWork: (title, imageData) => setPortfolioWorks((prev) => [...prev, { id: uid(), title, imageData }]),
    removePortfolioWork: (id) => setPortfolioWorks((prev) => prev.filter((w) => w.id !== id)),
    customEmojis,
    addEmoji: (name, image) => setCustomEmojis((prev) => [...prev, { id: uid(), name, image }]),
    removeEmoji: (id) => setCustomEmojis((prev) => prev.filter((e) => e.id !== id)),
    comments,
    addComment: (c) => setComments((prev) => [...prev, { ...c, id: uid(), createdAt: new Date().toISOString(), replies: [] }]),
    addReply: (commentId, r) => setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, replies: [...c.replies, { ...r, id: uid(), createdAt: new Date().toISOString() }] } : c))),
    submissions,
    addSubmission: (s) => setSubmissions((prev) => [...prev, { ...s, id: uid(), createdAt: new Date().toISOString(), approved: false }]),
    approveSubmission: (id, approved) => setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, approved } : s))),
    deleteSubmission: (id) => setSubmissions((prev) => prev.filter((s) => s.id !== id)),
  };

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used within SiteProvider");
  return ctx;
}

export function renderTextWithEmojis(text: string, emojis: CustomEmoji[]) {
  const parts = text.split(/(\[:[^\]]+:\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[:([^\]]+):\]$/);
    if (match) {
      const emoji = emojis.find((e) => e.id === match[1]);
      if (emoji) return <img key={i} src={emoji.image} alt={emoji.name} className="comment-emoji" />;
    }
    return <span key={i}>{part}</span>;
  });
}
