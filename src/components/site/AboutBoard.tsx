import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Image as ImageIcon, Move, Plus, Save, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSignedUrl, uploadToSiteAssets } from "./storage";
import { useAboutBlocks, type AboutBlock } from "./useSiteData";

function BlockImage({ path, alt }: { path: string | null; alt: string }) {
  const url = useSignedUrl("site-assets", path);
  if (!url) return <div className="board-image-placeholder">Sin imagen</div>;
  return <img src={url} alt={alt} draggable={false} />;
}

export function AboutBoard({ adminMode }: { adminMode: boolean }) {
  const { blocks, setBlocks, reload } = useAboutBlocks();
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number; mode: "move" | "resize" } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const patchLocal = (id: string, patch: Partial<AboutBlock>) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const persist = async (block: AboutBlock) => {
    setSaving(true);
    await supabase
      .from("about_blocks")
      .update({
        content: block.content,
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
        rotation: block.rotation,
        color: block.color,
        font_size: block.font_size,
        z_index: block.z_index,
      })
      .eq("id", block.id);
    setSaving(false);
  };

  const onPointerDown = (event: ReactPointerEvent, block: AboutBlock, mode: "move" | "resize") => {
    if (!adminMode) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSelected(block.id);
    dragRef.current = {
      id: block.id,
      mode,
      offsetX: event.clientX - rect.left - block.x,
      offsetY: event.clientY - rect.top - block.y,
    };
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    const drag = dragRef.current;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const block = blocks.find((b) => b.id === drag.id);
    if (!block) return;
    if (drag.mode === "move") {
      patchLocal(drag.id, {
        x: Math.max(0, Math.min(localX - drag.offsetX, rect.width - 40)),
        y: Math.max(0, Math.min(localY - drag.offsetY, rect.height - 30)),
      });
    } else {
      patchLocal(drag.id, {
        width: Math.max(60, localX - block.x),
        height: Math.max(40, localY - block.y),
      });
    }
  };

  const onPointerUp = async () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    const block = blocks.find((b) => b.id === drag.id);
    if (block) await persist(block);
  };

  const addBlock = async (kind: "text" | "image", imagePath?: string) => {
    const maxZ = blocks.reduce((acc, b) => Math.max(acc, b.z_index), 0);
    const { data } = await supabase
      .from("about_blocks")
      .insert({
        kind,
        content: kind === "text" ? "Escribe aquí ♡" : "",
        image_path: imagePath ?? null,
        x: 40,
        y: 40,
        width: kind === "text" ? 240 : 200,
        height: kind === "text" ? 90 : 200,
        z_index: maxZ + 1,
      })
      .select("*")
      .single();
    if (data) setBlocks((prev) => [...prev, data as AboutBlock]);
  };

  const onUpload = async (file: File) => {
    try {
      const path = await uploadToSiteAssets(file, "about");
      await addBlock("image", path);
    } catch {
      /* ignore */
    }
  };

  const removeBlock = async (id: string) => {
    await supabase.from("about_blocks").delete().eq("id", id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelected(null);
  };

  const active = blocks.find((b) => b.id === selected) ?? null;

  return (
    <div className="about-board-wrap">
      {adminMode && (
        <div className="board-toolbar">
          <Button variant="station" size="sm" onClick={() => addBlock("text")}><Type size={14} /> Texto</Button>
          <label className="upload-button small">
            <ImageIcon size={14} />
            <span>Imagen / GIF</span>
            <input
              type="file"
              accept="image/*,image/gif"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUpload(file);
                e.target.value = "";
              }}
            />
          </label>
          {active && (
            <>
              <label className="board-field">
                <span>Color</span>
                <input
                  type="color"
                  value={active.color}
                  onChange={(e) => patchLocal(active.id, { color: e.target.value })}
                  onBlur={() => persist({ ...active })}
                />
              </label>
              <label className="board-field">
                <span>Tamaño texto</span>
                <input
                  type="range"
                  min={10}
                  max={48}
                  value={active.font_size}
                  onChange={(e) => patchLocal(active.id, { font_size: Number(e.target.value) })}
                  onPointerUp={() => persist({ ...active })}
                />
              </label>
              <label className="board-field">
                <span>Giro</span>
                <input
                  type="range"
                  min={-25}
                  max={25}
                  value={active.rotation}
                  onChange={(e) => patchLocal(active.id, { rotation: Number(e.target.value) })}
                  onPointerUp={() => persist({ ...active })}
                />
              </label>
              <Button variant="station" size="sm" onClick={() => persist(active)}><Save size={14} /> Guardar</Button>
              <Button variant="destructive" size="sm" onClick={() => removeBlock(active.id)}><Trash2 size={14} /> Borrar</Button>
            </>
          )}
          <span className="board-hint">{saving ? "Guardando..." : "Arrastra los recuadros para moverlos"}</span>
        </div>
      )}
      <div
        className={`about-board ${adminMode ? "editing" : ""}`}
        ref={boardRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {blocks.length === 0 && (
          <p className="board-empty">
            {adminMode ? "Agrega textos, imágenes o GIFs con los botones de arriba ♡" : "Este rincón todavía está vacío ♡"}
          </p>
        )}
        {blocks.map((block) => (
          <div
            key={block.id}
            className={`board-block ${selected === block.id && adminMode ? "selected" : ""}`}
            style={{
              left: block.x,
              top: block.y,
              width: block.width,
              height: block.kind === "text" ? "auto" : block.height,
              zIndex: block.z_index,
              transform: `rotate(${block.rotation}deg)`,
              color: block.color,
              fontSize: block.font_size,
            }}
            onPointerDown={(e) => onPointerDown(e, block, "move")}
          >
            {block.kind === "text" ? (
              adminMode ? (
                <textarea
                  value={block.content}
                  style={{ color: block.color, fontSize: block.font_size }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) => patchLocal(block.id, { content: e.target.value })}
                  onBlur={() => persist({ ...block })}
                />
              ) : (
                <p>{block.content}</p>
              )
            ) : (
              <BlockImage path={block.image_path} alt={block.content || "Imagen del panel"} />
            )}
            {adminMode && (
              <>
                <span className="board-grip"><Move size={12} /></span>
                <span className="board-resize" onPointerDown={(e) => onPointerDown(e, block, "resize")} />
              </>
            )}
          </div>
        ))}
      </div>
      {adminMode && (
        <div className="board-footer">
          <Button variant="station" size="sm" onClick={() => reload()}><Plus size={14} /> Recargar panel</Button>
        </div>
      )}
    </div>
  );
}
