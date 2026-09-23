import { useSyncExternalStore } from "react";

export type Submission = {
  id: string;
  image: string;
  note: string;
  author: string;
  approved: boolean;
  created_at: string;
};

export type Reply = {
  id: string;
  text: string;
  author: string;
  avatar: string;
  created_at: string;
};

export type Comment = {
  id: string;
  text: string;
  author: string;
  avatar: string;
  isAdmin: boolean;
  created_at: string;
  replies: Reply[];
};

export type ColorPreset = { name: string; value: string };

export type StoreData = {
  submissions: Submission[];
  comments: Comment[];
  adminUsername: string;
  siteImages: Record<string, string>;
  colorPresets: ColorPreset[];
};

const KEY = "munchxine_store_v1";

const defaultColorPresets: ColorPreset[] = [
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

const defaultData: StoreData = {
  submissions: [],
  comments: [],
  adminUsername: "Maxine",
  siteImages: {},
  colorPresets: defaultColorPresets,
};

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

function load(): StoreData {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      ...defaultData,
      ...parsed,
      colorPresets:
        parsed.colorPresets && parsed.colorPresets.length > 0
          ? parsed.colorPresets
          : defaultColorPresets,
    };
  } catch {
    return defaultData;
  }
}

let data: StoreData = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    console.log("[v0] Failed to persist community store:", err);
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return data;
}

export function setData(updater: (prev: StoreData) => StoreData) {
  data = updater(data);
  persist();
}

export function useCommunityStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/* ---- actions ---- */

export function addSubmission(input: { image: string; note: string; author: string }) {
  setData((prev) => ({
    ...prev,
    submissions: [
      {
        id: uid(),
        image: input.image,
        note: input.note,
        author: input.author,
        approved: false,
        created_at: new Date().toISOString(),
      },
      ...prev.submissions,
    ],
  }));
}

export function setSubmissionApproved(id: string, approved: boolean) {
  setData((prev) => ({
    ...prev,
    submissions: prev.submissions.map((s) => (s.id === id ? { ...s, approved } : s)),
  }));
}

export function removeSubmission(id: string) {
  setData((prev) => ({
    ...prev,
    submissions: prev.submissions.filter((s) => s.id !== id),
  }));
}

export function addComment(input: { text: string; author: string; avatar: string; isAdmin: boolean }) {
  setData((prev) => ({
    ...prev,
    comments: [
      ...prev.comments,
      {
        id: uid(),
        text: input.text,
        author: input.author,
        avatar: input.avatar,
        isAdmin: input.isAdmin,
        created_at: new Date().toISOString(),
        replies: [],
      },
    ],
  }));
}

export function removeComment(id: string) {
  setData((prev) => ({
    ...prev,
    comments: prev.comments.filter((c) => c.id !== id),
  }));
}

export function addReply(commentId: string, input: { text: string; author: string; avatar: string }) {
  setData((prev) => ({
    ...prev,
    comments: prev.comments.map((c) =>
      c.id === commentId
        ? {
            ...c,
            replies: [
              ...c.replies,
              {
                id: uid(),
                text: input.text,
                author: input.author,
                avatar: input.avatar,
                created_at: new Date().toISOString(),
              },
            ],
          }
        : c,
    ),
  }));
}

export function setAdminUsername(username: string) {
  setData((prev) => ({ ...prev, adminUsername: username }));
}

export function setSiteImage(slot: string, dataUrl: string) {
  setData((prev) => ({ ...prev, siteImages: { ...prev.siteImages, [slot]: dataUrl } }));
}

export function clearSiteImage(slot: string) {
  setData((prev) => {
    const next = { ...prev.siteImages };
    delete next[slot];
    return { ...prev, siteImages: next };
  });
}

export function setColorPresets(presets: ColorPreset[]) {
  setData((prev) => ({ ...prev, colorPresets: presets }));
}

/* ---- helpers ---- */

export const SITE_IMAGE_SLOTS: Array<{ key: string; label: string }> = [
  { key: "profileAvatar", label: "Foto de perfil / avatar" },
  { key: "heroFinal", label: "Ilustración final (Inicio)" },
  { key: "portfolioArt", label: "Obra destacada (Portafolio)" },
  { key: "aboutArt", label: "Arte (Sobre mí)" },
];

export const CUSTOM_EMOJIS: Array<{ name: string; char: string }> = [
  { name: "corazón", char: "♡" },
  { name: "estrella", char: "☆" },
  { name: "chispa", char: "✧" },
  { name: "gatito", char: "(=^･ω･^=)" },
  { name: "feliz", char: "(๑˃ᴗ˂)" },
  { name: "orca", char: "🐋" },
];

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
