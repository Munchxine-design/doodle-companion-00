import { Sparkles, Minus, Square, X } from "lucide-react";
import type { ReactNode } from "react";

export function Window({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
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
