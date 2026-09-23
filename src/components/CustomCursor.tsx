import { useEffect, useState } from 'react';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
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
      src="/cursor-medusa.png"
      alt="cursor"
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        pointerEvents: 'none',
        zIndex: 9999,
        width: '50px', /* Ajusta este valor si lo quieres más grande o pequeño */
        transform: 'translate(-2px, -2px)', /* Ajuste para que la punta de la flecha encaje con el clic */
      }}
    />
  );
}
