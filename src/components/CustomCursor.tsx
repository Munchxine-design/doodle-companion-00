import { useEffect, useState } from 'react';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Esta función actualiza la posición del GIF cada vez que mueves el mouse
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updatePosition);
    
    return () => {
      window.removeEventListener('mousemove', updatePosition);
    };
  }, []);

  return (
    <img
      src="/cursor-animado.gif"
      alt="cursor"
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        pointerEvents: 'none', /* ¡Súper importante! Permite que tus clics traspasen el GIF y toquen los botones */
        zIndex: 9999, /* Asegura que el cursor siempre esté por encima de todo */
        width: '35px', /* Puedes hacer este número más grande o pequeño según prefieras */
        transform: 'translate(0, 0)', /* Ajusta esto si la "punta" de tu cursor no coincide con el clic exacto */
      }}
    />
  );
}
