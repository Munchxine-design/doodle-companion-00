import { useRef, useState, useEffect, type PointerEvent, type ChangeEvent } from "react";
import { Brush, Eraser, ImageIcon, Paintbrush, Plus, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Window } from "@/components/Window";
import { useSite } from "@/context/SiteContext";

const DEFAULT_PRESETS = [
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

export function PaintCanvas() {
  const { addSubmission } = useSite();
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

  const [presets, setPresets] = useState(DEFAULT_PRESETS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("teri_presets");
      if (stored) setPresets(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const savePresets = (next: typeof DEFAULT_PRESETS) => {
    setPresets(next);
    try { localStorage.setItem("teri_presets", JSON.stringify(next)); } catch { /* ignore */ }
  };

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

  const addPreset = () => {
    savePresets([...presets, { name: "Custom", value: color }]);
  };

  const removePreset = (index: number) => {
    savePresets(presets.filter((_, i) => i !== index));
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("No canvas");

      const isEmpty = (() => {
        const context = getCtx();
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

      const dataUrl = canvas.toDataURL("image/png");

      addSubmission({
        imageData: dataUrl,
        note: note.trim(),
        author: author.trim() || "Anónimo",
      });

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
          {presets.map((c, i) => (
            <button
              key={`${c.value}-${i}`}
              className={`color-swatch ${color === c.value && !eraser ? "active" : ""}`}
              style={{ background: c.value }}
              onClick={() => { setColor(c.value); setEraser(false); }}
              title={c.name}
              aria-label={c.name}
            >
              <span className="swatch-remove" onClick={(e) => { e.stopPropagation(); removePreset(i); }}>
                <X size={8} />
              </span>
            </button>
          ))}
          <label className="color-custom" title="Color personalizado">
            <Paintbrush size={14} />
            <input
              type="color"
              value={color}
              onChange={(e) => { setColor(e.target.value); setEraser(false); }}
            />
          </label>
          <button className="color-add" onClick={addPreset} title="Agregar color a presets">
            <Plus size={14} />
          </button>
        </div>
      </div>
      <div className="paint-controls">
        <Button variant={eraser ? "signal" : "station"} size="sm" onClick={() => setEraser(!eraser)}><Eraser size={14} /> Borrador</Button>
        <Button variant={eraser ? "signal" : "station"} size="sm" onClick={() => setEraser(false)}><Brush size={14} /> Pincel</Button>
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
      <canvas ref={canvasRef} width={440} height={220} onPointerDown={start} onPointerMove={draw} onPointerUp={() => drawingRef.current = false} onPointerLeave={() => drawingRef.current = false} />
      <Input className="paint-author" placeholder="Tu nombre (opcional)..." value={author} onChange={(e) => setAuthor(e.target.value)} />
      <Textarea placeholder="Una notita para Teri..." value={note} onChange={(e) => setNote(e.target.value)} />
      {submitStatus && <p className={`submit-status ${submitStatus.type}`}>{submitStatus.msg}</p>}
      <Button variant="signal" onClick={submit} disabled={submitting}><Send />{submitting ? "Enviando..." : "Enviar dibujo ♡"}</Button>
    </Window>
  );
}
