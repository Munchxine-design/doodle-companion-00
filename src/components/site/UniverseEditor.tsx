import { useCallback, useEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AlignCenter, AlignLeft, AlignRight, Brush, ChevronDown, ChevronUp, Copy, Crop, Eraser, Eye, EyeOff, Image as ImageIcon, Layers3, Lock, Maximize2, MousePointer2, Pencil, Plus, Redo2, Trash2, Type, Undo2, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type LayerType = "text" | "image" | "drawing";
type TextAlign = "left" | "center" | "right";
type Tool = "select" | "brush" | "eraser";

type UniverseLayer = {
  id: string;
  name: string;
  type: LayerType;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: TextAlign;
  color?: string;
  imageScale?: number;
  imageX?: number;
  imageY?: number;
};

type CropDraft = { src: string; name: string; scale: number; x: number; y: number };
type DragState = { id: string; mode: "move" | "resize"; startX: number; startY: number; originX: number; originY: number; originW: number; originH: number };

const STORAGE_KEY = "site_universe_layers_v2";
const LEGACY_KEY = "site_straw_elements";
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 680;
const fonts = ["Manrope", "Sora", "JetBrains Mono", "Georgia", "Courier New", "Trebuchet MS"];

function readLayers(): UniverseLayer[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as UniverseLayer[];
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]") as Array<Record<string, unknown>>;
    return legacy.map((item, index) => ({
      id: String(item.id ?? `legacy-${index}`),
      name: item.type === "text" ? `Texto ${index + 1}` : `Imagen ${index + 1}`,
      type: item.type === "text" ? "text" : "image",
      content: String(item.content ?? ""),
      x: Number(item.x ?? 50), y: Number(item.y ?? 50), width: Number(item.width ?? 180), height: Number(item.height ?? 120),
      z: Number(item.z ?? index + 1), locked: false, visible: true, opacity: 1,
      fontFamily: "Manrope", fontSize: 20, fontWeight: "normal", fontStyle: "normal", textAlign: "left", color: "#dbeafe",
      imageScale: 1, imageX: 50, imageY: 50,
    }));
  } catch {
    return [];
  }
}

function DrawingLayer({ layer, active, tool, color, size, onCommit }: { layer: UniverseLayer; active: boolean; tool: Tool; color: string; size: number; onCommit: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!layer.content) return;
    const image = new Image();
    image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.src = layer.content;
  }, [layer.content]);

  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  };

  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!active || layer.locked || tool === "select") return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = point(event);
    drawingRef.current = true;
    context.beginPath();
    context.moveTo(p.x, p.y);
  };

  const move = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const p = point(event);
    context.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    context.strokeStyle = color;
    context.lineWidth = size;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineTo(p.x, p.y);
    context.stroke();
  };

  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) onCommit(canvas.toDataURL("image/png"));
  };

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="universe-drawing-canvas" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />;
}

export function UniverseEditor({ adminMode }: { adminMode: boolean }) {
  const [layers, setLayers] = useState<UniverseLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [brushColor, setBrushColor] = useState("#69a2ff");
  const [brushSize, setBrushSize] = useState(12);
  const [history, setHistory] = useState<UniverseLayer[][]>([]);
  const [future, setFuture] = useState<UniverseLayer[][]>([]);
  const [cropDraft, setCropDraft] = useState<CropDraft | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => setLayers(readLayers()), []);

  const commit = useCallback((next: UniverseLayer[], remember = true) => {
    setLayers((current) => {
      if (remember) {
        setHistory((items) => [...items.slice(-29), current]);
        setFuture([]);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const update = (id: string, patch: Partial<UniverseLayer>, remember = true) => commit(layers.map((layer) => layer.id === id ? { ...layer, ...patch } : layer), remember);
  const selected = layers.find((layer) => layer.id === selectedId) ?? null;

  const addText = () => {
    const id = crypto.randomUUID();
    const z = Math.max(0, ...layers.map((layer) => layer.z)) + 1;
    commit([...layers, { id, name: "Texto nuevo", type: "text", content: "Escribe algo bonito...", x: 90, y: 80, width: 320, height: 100, z, locked: false, visible: true, opacity: 1, fontFamily: "Sora", fontSize: 28, fontWeight: "bold", fontStyle: "normal", textAlign: "left", color: "#dbeafe" }]);
    setSelectedId(id); setTool("select");
  };

  const addDrawing = () => {
    const id = crypto.randomUUID();
    const z = Math.max(0, ...layers.map((layer) => layer.z)) + 1;
    commit([...layers, { id, name: `Dibujo ${layers.filter((layer) => layer.type === "drawing").length + 1}`, type: "drawing", content: "", x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, z, locked: false, visible: true, opacity: 1 }]);
    setSelectedId(id); setTool("brush");
  };

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert("La imagen supera 8 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setCropDraft({ src: String(reader.result ?? ""), name: file.name, scale: 1, x: 50, y: 50 });
    reader.readAsDataURL(file);
  };

  const insertCrop = () => {
    if (!cropDraft) return;
    const id = crypto.randomUUID();
    const z = Math.max(0, ...layers.map((layer) => layer.z)) + 1;
    commit([...layers, { id, name: cropDraft.name, type: "image", content: cropDraft.src, x: 140, y: 90, width: 360, height: 280, z, locked: false, visible: true, opacity: 1, imageScale: cropDraft.scale, imageX: cropDraft.x, imageY: cropDraft.y }]);
    setSelectedId(id); setCropDraft(null); setTool("select");
  };

  const remove = () => {
    if (!selected) return;
    commit(layers.filter((layer) => layer.id !== selected.id));
    setSelectedId(null);
  };

  const duplicate = () => {
    if (!selected) return;
    const copy = { ...selected, id: crypto.randomUUID(), name: `${selected.name} copia`, x: selected.x + 24, y: selected.y + 24, z: Math.max(0, ...layers.map((layer) => layer.z)) + 1, locked: false };
    commit([...layers, copy]); setSelectedId(copy.id);
  };

  const reorder = (direction: "up" | "down" | "front" | "back") => {
    if (!selected) return;
    const ordered = [...layers].sort((a, b) => a.z - b.z);
    const index = ordered.findIndex((layer) => layer.id === selected.id);
    if (direction === "front") ordered.push(...ordered.splice(index, 1));
    if (direction === "back") ordered.unshift(...ordered.splice(index, 1));
    if (direction === "up" && index < ordered.length - 1) {
      const current = ordered[index]; const next = ordered[index + 1];
      if (current && next) { ordered[index] = next; ordered[index + 1] = current; }
    }
    if (direction === "down" && index > 0) {
      const current = ordered[index]; const previous = ordered[index - 1];
      if (current && previous) { ordered[index] = previous; ordered[index - 1] = current; }
    }
    commit(ordered.map((layer, position) => ({ ...layer, z: position + 1 })));
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((items) => [layers, ...items].slice(0, 30));
    setHistory((items) => items.slice(0, -1));
    setLayers(previous); localStorage.setItem(STORAGE_KEY, JSON.stringify(previous));
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((items) => [...items, layers].slice(-30));
    setFuture((items) => items.slice(1));
    setLayers(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>, layer: UniverseLayer, mode: "move" | "resize") => {
    if (!adminMode || tool !== "select" || layer.locked) return;
    event.preventDefault(); event.stopPropagation(); setSelectedId(layer.id);
    setDrag({ id: layer.id, mode, startX: event.clientX, startY: event.clientY, originX: layer.x, originY: layer.y, originW: layer.width, originH: layer.height });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || !workspaceRef.current) return;
    const scale = workspaceRef.current.getBoundingClientRect().width / CANVAS_WIDTH;
    const dx = (event.clientX - drag.startX) / scale; const dy = (event.clientY - drag.startY) / scale;
    const patch = drag.mode === "move"
      ? { x: Math.max(0, Math.min(CANVAS_WIDTH - 30, drag.originX + dx)), y: Math.max(0, Math.min(CANVAS_HEIGHT - 30, drag.originY + dy)) }
      : { width: Math.max(60, Math.min(CANVAS_WIDTH - drag.originX, drag.originW + dx)), height: Math.max(40, Math.min(CANVAS_HEIGHT - drag.originY, drag.originH + dy)) };
    setLayers((items) => items.map((layer) => layer.id === drag.id ? { ...layer, ...patch } : layer));
  };
  const pointerUp = () => { if (!drag) return; setDrag(null); localStorage.setItem(STORAGE_KEY, JSON.stringify(layers)); };

  const toolButton = (value: Tool, label: string, icon: ReactNode) => <Button variant={tool === value ? "signal" : "station"} size="sm" onClick={() => setTool(value)} title={label}>{icon}<span>{label}</span></Button>;

  return (
    <div className={`universe-editor ${adminMode ? "is-editing" : "is-viewing"}`}>
      {adminMode && <>
        <div className="universe-toolbar">
          <div className="universe-toolgroup">{toolButton("select", "Seleccionar", <MousePointer2 size={15} />)}{toolButton("brush", "Pincel", <Brush size={15} />)}{toolButton("eraser", "Borrador", <Eraser size={15} />)}</div>
          <div className="universe-toolgroup"><Button variant="station" size="sm" onClick={addText}><Type size={15} /> Texto</Button><label className="universe-upload"><ImageIcon size={15} /> Imagen / GIF<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={chooseImage} /></label><Button variant="station" size="sm" onClick={addDrawing}><Pencil size={15} /> Capa de dibujo</Button></div>
          <div className="universe-toolgroup"><label className="universe-color" title="Color del pincel"><input type="color" value={brushColor} onChange={(event) => setBrushColor(event.target.value)} /><span>Color</span></label><label className="universe-range">Grosor <input type="range" min="1" max="64" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} /><b>{brushSize}px</b></label></div>
          <div className="universe-toolgroup"><Button variant="station" size="icon" onClick={undo} disabled={!history.length} title="Deshacer"><Undo2 size={15} /></Button><Button variant="station" size="icon" onClick={redo} disabled={!future.length} title="Rehacer"><Redo2 size={15} /></Button></div>
        </div>
        <div className="universe-status"><span>MY_UNIVERSE.EXE</span><span>{tool === "select" ? "MODO TRANSFORMAR" : tool === "brush" ? "PINCEL ACTIVO" : "BORRADOR ACTIVO"}</span><span>AUTOGUARDADO LOCAL</span></div>
      </>}

      <div className="universe-layout">
        <div className="universe-stage-shell">
          <div ref={workspaceRef} className={`universe-stage tool-${tool}`} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerLeave={pointerUp} onPointerDown={() => setSelectedId(null)}>
            <div className="universe-grid" />
            {[...layers].sort((a, b) => a.z - b.z).filter((layer) => layer.visible).map((layer) => (
              <div key={layer.id} className={`universe-layer ${selectedId === layer.id && adminMode ? "selected" : ""} ${layer.locked ? "locked" : ""} layer-${layer.type}`} style={{ left: `${layer.x / 10}%`, top: `${layer.y / 6.8}%`, width: `${layer.width / 10}%`, height: `${layer.height / 6.8}%`, zIndex: layer.z, opacity: layer.opacity }} onPointerDown={(event) => pointerDown(event, layer, "move")}>
                {layer.type === "text" && <div className="universe-text" style={{ fontFamily: layer.fontFamily, fontSize: `${layer.fontSize}px`, fontWeight: layer.fontWeight, fontStyle: layer.fontStyle, textAlign: layer.textAlign, color: layer.color }}>{layer.content}</div>}
                {layer.type === "image" && <div className="universe-image-viewport"><img src={layer.content} alt={layer.name} draggable={false} style={{ width: `${(layer.imageScale ?? 1) * 100}%`, height: `${(layer.imageScale ?? 1) * 100}%`, objectPosition: `${layer.imageX ?? 50}% ${layer.imageY ?? 50}%` }} /></div>}
                {layer.type === "drawing" && <DrawingLayer layer={layer} active={adminMode && selectedId === layer.id} tool={tool} color={brushColor} size={brushSize} onCommit={(content) => update(layer.id, { content })} />}
                {adminMode && selectedId === layer.id && tool === "select" && !layer.locked && layer.type !== "drawing" && <div className="universe-resize" onPointerDown={(event) => pointerDown(event, layer, "resize")}><Maximize2 size={13} /></div>}
                {adminMode && layer.locked && <Lock className="universe-lockmark" size={14} />}
              </div>
            ))}
            {!layers.length && <div className="universe-empty"><Layers3 /><strong>Tu universo está esperando</strong><span>{adminMode ? "Añade una capa para comenzar." : "Maxine todavía está preparando este rincón."}</span></div>}
          </div>
        </div>

        {adminMode && <aside className="universe-sidebar">
          <div className="universe-panel-title"><Layers3 size={15} /><span>CAPAS</span><b>{layers.length}</b></div>
          <div className="universe-layer-list">
            {[...layers].sort((a, b) => b.z - a.z).map((layer) => <div key={layer.id} className={`universe-layer-row ${selectedId === layer.id ? "active" : ""}`} onClick={() => setSelectedId(layer.id)}>
              <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); update(layer.id, { visible: !layer.visible }); }} title={layer.visible ? "Ocultar capa" : "Mostrar capa"}>{layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}</Button>
              <span className="universe-layer-kind">{layer.type === "text" ? <Type size={14} /> : layer.type === "image" ? <ImageIcon size={14} /> : <Brush size={14} />}</span>
              <span className="universe-layer-name">{layer.name}</span>
              <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); update(layer.id, { locked: !layer.locked }); }} title={layer.locked ? "Desbloquear" : "Bloquear"}>{layer.locked ? <Lock size={14} /> : <Unlock size={14} />}</Button>
            </div>)}
          </div>
          {selected && <div className="universe-properties">
            <div className="universe-panel-title"><span>PROPIEDADES</span></div>
            <label>Nombre<Input value={selected.name} onChange={(event) => update(selected.id, { name: event.target.value }, false)} onBlur={() => localStorage.setItem(STORAGE_KEY, JSON.stringify(layers))} /></label>
            <label>Opacidad <input type="range" min="10" max="100" value={selected.opacity * 100} onChange={(event) => update(selected.id, { opacity: Number(event.target.value) / 100 })} /></label>
            {selected.type === "text" && <>
              <label>Contenido<Textarea value={selected.content} onChange={(event) => update(selected.id, { content: event.target.value }, false)} onBlur={() => localStorage.setItem(STORAGE_KEY, JSON.stringify(layers))} /></label>
              <label>Fuente<select value={selected.fontFamily} onChange={(event) => update(selected.id, { fontFamily: event.target.value })}>{fonts.map((font) => <option key={font}>{font}</option>)}</select></label>
              <label>Tamaño <input type="range" min="10" max="96" value={selected.fontSize} onChange={(event) => update(selected.id, { fontSize: Number(event.target.value) })} /></label>
              <div className="universe-inline-controls"><label className="universe-color"><input type="color" value={selected.color} onChange={(event) => update(selected.id, { color: event.target.value })} /><span>Texto</span></label><Button variant={selected.fontWeight === "bold" ? "signal" : "station"} size="sm" onClick={() => update(selected.id, { fontWeight: selected.fontWeight === "bold" ? "normal" : "bold" })}>B</Button><Button variant={selected.fontStyle === "italic" ? "signal" : "station"} size="sm" onClick={() => update(selected.id, { fontStyle: selected.fontStyle === "italic" ? "normal" : "italic" })}>I</Button></div>
              <div className="universe-inline-controls"><Button variant={selected.textAlign === "left" ? "signal" : "station"} size="icon" onClick={() => update(selected.id, { textAlign: "left" })}><AlignLeft size={14} /></Button><Button variant={selected.textAlign === "center" ? "signal" : "station"} size="icon" onClick={() => update(selected.id, { textAlign: "center" })}><AlignCenter size={14} /></Button><Button variant={selected.textAlign === "right" ? "signal" : "station"} size="icon" onClick={() => update(selected.id, { textAlign: "right" })}><AlignRight size={14} /></Button></div>
            </>}
            {selected.type === "image" && <>
              <label>Zoom <input type="range" min="100" max="300" value={(selected.imageScale ?? 1) * 100} onChange={(event) => update(selected.id, { imageScale: Number(event.target.value) / 100 })} /></label>
              <label>Posición horizontal <input type="range" min="0" max="100" value={selected.imageX ?? 50} onChange={(event) => update(selected.id, { imageX: Number(event.target.value) })} /></label>
              <label>Posición vertical <input type="range" min="0" max="100" value={selected.imageY ?? 50} onChange={(event) => update(selected.id, { imageY: Number(event.target.value) })} /></label>
            </>}
            <div className="universe-order-controls"><Button variant="station" size="icon" onClick={() => reorder("front")} title="Al frente"><ChevronUp size={16} /></Button><Button variant="station" size="icon" onClick={() => reorder("up")} title="Subir una capa"><Plus size={14} /></Button><Button variant="station" size="icon" onClick={() => reorder("down")} title="Bajar una capa"><ChevronDown size={16} /></Button><Button variant="station" size="sm" onClick={() => reorder("back")} title="Al fondo">Fondo</Button></div>
            <div className="universe-order-controls"><Button variant="station" size="sm" onClick={() => update(selected.id, { locked: !selected.locked })}>{selected.locked ? <Unlock size={14} /> : <Lock size={14} />}{selected.locked ? "Desbloquear" : "Bloquear"}</Button><Button variant="station" size="icon" onClick={duplicate} title="Duplicar"><Copy size={14} /></Button><Button variant="destructive" size="icon" onClick={remove} title="Eliminar"><Trash2 size={14} /></Button></div>
          </div>}
        </aside>}
      </div>

      <Dialog open={Boolean(cropDraft)} onOpenChange={(open) => { if (!open) setCropDraft(null); }}>
        <DialogContent className="station-dialog universe-crop-dialog">
          <DialogHeader><DialogTitle><Crop size={18} /> Recortar imagen</DialogTitle><DialogDescription>Ajusta el encuadre antes de añadirla al lienzo.</DialogDescription></DialogHeader>
          {cropDraft && <><div className="universe-crop-preview"><img src={cropDraft.src} alt="Vista previa del recorte" style={{ width: `${cropDraft.scale * 100}%`, height: `${cropDraft.scale * 100}%`, objectPosition: `${cropDraft.x}% ${cropDraft.y}%` }} /></div><label>Zoom <input type="range" min="100" max="300" value={cropDraft.scale * 100} onChange={(event) => setCropDraft({ ...cropDraft, scale: Number(event.target.value) / 100 })} /></label><label>Horizontal <input type="range" min="0" max="100" value={cropDraft.x} onChange={(event) => setCropDraft({ ...cropDraft, x: Number(event.target.value) })} /></label><label>Vertical <input type="range" min="0" max="100" value={cropDraft.y} onChange={(event) => setCropDraft({ ...cropDraft, y: Number(event.target.value) })} /></label><div className="universe-crop-actions"><Button variant="station" onClick={() => setCropDraft(null)}>Cancelar</Button><Button variant="signal" onClick={insertCrop}>Añadir al lienzo</Button></div></>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
