import { useSite } from "@/context/SiteContext";

export function GalleryDisplay() {
  const { submissions } = useSite();
  const approved = submissions.filter((s) => s.approved);

  if (approved.length === 0)
    return <p className="window-copy">Aún no hay dibujos aprobados. ¡Sé el primero en enviar uno! ♡</p>;

  return (
    <div className="community-gallery">
      {approved.map((s) => (
        <article className="community-art" key={s.id}>
          <img src={s.imageData} alt={`Dibujo de ${s.author}`} />
          <div className="community-art-info">
            <strong>{s.author}</strong>
            {s.note && <p>{s.note}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}
