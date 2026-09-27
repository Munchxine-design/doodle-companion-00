import { useEffect, useState } from 'react';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updatePosition = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        setVisible(false);
        return;
      }
      setPosition({ x: e.clientX, y: e.clientY });
      setVisible(e.pointerType === 'pen' || e.pointerType === 'mouse');
    };
    const hideOnTouch = (e: PointerEvent) => {
      if (e.pointerType === 'touch') setVisible(false);
    };
    const hideOnExit = () => setVisible(false);
    window.addEventListener('pointermove', updatePosition);
    window.addEventListener('pointerdown', hideOnTouch);
    document.addEventListener('pointerleave', hideOnExit);
    return () => {
      window.removeEventListener('pointermove', updatePosition);
      window.removeEventListener('pointerdown', hideOnTouch);
      document.removeEventListener('pointerleave', hideOnExit);
    };
  }, []);

  if (!visible) return null;

  return (
    <img
      className="custom-cursor"
      src="/cursor-medusa.png"
      alt=""
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        pointerEvents: 'none',
        zIndex: 30000,
        width: '50px', /* Ajusta este valor si lo quieres más grande o pequeño */
        transform: 'translate(-2px, -2px)', /* Ajuste para que la punta de la flecha encaje con el clic */
      }}
    />
  );
}
