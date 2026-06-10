import { useState } from 'react';

export default function MSWindow({ id, title, x, y, width, height, active, onClose, onFocus, children, resizable = false }) {
  const [pos, setPos] = useState({ x, y });

  const handleMouseDown = (e) => {
    if (e.target.closest('.ms-ctrl-btn')) return;
    onFocus(id);
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = pos.x;
    const initialY = pos.y;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setPos({
        x: Math.max(0, initialX + dx),
        y: Math.max(0, initialY + dy)
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`ms-window ms-bevel-out ${active ? 'active' : 'inactive'} ${resizable ? 'ms-window-resizable' : ''}`}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
        zIndex: active ? 1000 : 100,
        position: 'absolute'
      }}
      onClick={() => onFocus(id)}
    >
      <div className="ms-window-header" onMouseDown={handleMouseDown}>
        <div className="ms-window-title">
          <span>{title}</span>
        </div>
        <div className="ms-window-controls">
          <button className="ms-ctrl-btn ms-ctrl-btn-close" onClick={() => onClose(id)}>×</button>
        </div>
      </div>
      <div className="ms-window-body">
        {children}
      </div>
    </div>
  );
}
