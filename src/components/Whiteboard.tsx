import { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, Square, Circle, Minus, Type, Trash2, Undo2 } from 'lucide-react';
import { usePeerSync, type SyncMessage } from '@/lib/peer-sync';

type Tool = 'pen' | 'rect' | 'circle' | 'line' | 'text';
type DrawAction = { type: 'path'; points: [number, number][]; color: string; width: number }
  | { type: 'rect'; x: number; y: number; w: number; h: number; color: string }
  | { type: 'circle'; cx: number; cy: number; r: number; color: string }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number; color: string }
  | { type: 'text'; x: number; y: number; text: string; color: string };

const COLORS = ['#00e5ff', '#4fc3f7', '#69f0ae', '#ff6e91', '#ffd740'];

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPath = useRef<[number, number][]>([]);
  const startPos = useRef<[number, number]>([0, 0]);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, { x: number; y: number; color: string }>>(new Map());

  const { broadcast, subscribe } = usePeerSync();

  // Listen for remote whiteboard messages
  useEffect(() => {
    return subscribe((msg: SyncMessage) => {
      if (msg.type === 'whiteboard-action') {
        setActions(prev => [...prev, msg.payload as DrawAction]);
      } else if (msg.type === 'whiteboard-clear') {
        setActions([]);
      } else if (msg.type === 'whiteboard-undo') {
        setActions(prev => prev.slice(0, -1));
      } else if (msg.type === 'cursor-move' && msg.payload.panel === 'whiteboard') {
        setRemoteCursors(prev => {
          const next = new Map(prev);
          next.set(msg.payload.user, { x: msg.payload.x, y: msg.payload.y, color: msg.payload.user.includes('Aryan') ? '#5b8dee' : msg.payload.user.includes('Krishitha') ? '#69f0ae' : '#ff6e91' });
          return next;
        });
      }
    });
  }, [subscribe]);

  const redraw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, extraActions?: DrawAction[]) => {
    ctx.clearRect(0, 0, w, h);
    const allActions = extraActions ? [...actions, ...extraActions] : actions;
    for (const a of allActions) {
      ctx.strokeStyle = a.type === 'text' ? 'transparent' : ('color' in a ? a.color : '#fff');
      ctx.fillStyle = 'color' in a ? a.color : '#fff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (a.type === 'path' && a.points.length > 1) {
        ctx.lineWidth = a.width;
        ctx.beginPath();
        ctx.moveTo(a.points[0][0], a.points[0][1]);
        for (let i = 1; i < a.points.length; i++) {
          ctx.lineTo(a.points[i][0], a.points[i][1]);
        }
        ctx.stroke();
      } else if (a.type === 'rect') {
        ctx.strokeRect(a.x, a.y, a.w, a.h);
      } else if (a.type === 'circle') {
        ctx.beginPath();
        ctx.arc(a.cx, a.cy, a.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (a.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(a.x1, a.y1);
        ctx.lineTo(a.x2, a.y2);
        ctx.stroke();
      } else if (a.type === 'text') {
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText(a.text, a.x, a.y);
      }
    }

    // Draw remote cursors
    remoteCursors.forEach(({ x, y, color: cursorColor }) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = cursorColor;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }, [actions, remoteCursors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (ctx) redraw(ctx, rect.width, rect.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [redraw]);

  const getPos = (e: React.MouseEvent): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const handleDown = (e: React.MouseEvent) => {
    const pos = getPos(e);
    setIsDrawing(true);
    startPos.current = pos;
    if (tool === 'pen') {
      currentPath.current = [pos];
    }
    if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const newAction: DrawAction = { type: 'text', x: pos[0], y: pos[1], text, color };
        setActions(prev => [...prev, newAction]);
        broadcast({ type: 'whiteboard-action', payload: newAction });
      }
      setIsDrawing(false);
    }
  };

  const handleMove = (e: React.MouseEvent) => {
    const pos = getPos(e);

    // Broadcast cursor position (throttled by browser frame rate)
    if (e.buttons === 0 || isDrawing) {
      // We broadcast on move for live cursor tracking
    }

    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pen') {
      currentPath.current.push(pos);
      redraw(ctx, canvas.width, canvas.height, [
        { type: 'path', points: [...currentPath.current], color, width: 2 }
      ]);
    } else if (tool === 'rect') {
      const [sx, sy] = startPos.current;
      redraw(ctx, canvas.width, canvas.height, [
        { type: 'rect', x: sx, y: sy, w: pos[0] - sx, h: pos[1] - sy, color }
      ]);
    } else if (tool === 'circle') {
      const [sx, sy] = startPos.current;
      const r = Math.sqrt((pos[0] - sx) ** 2 + (pos[1] - sy) ** 2);
      redraw(ctx, canvas.width, canvas.height, [
        { type: 'circle', cx: sx, cy: sy, r, color }
      ]);
    } else if (tool === 'line') {
      const [sx, sy] = startPos.current;
      redraw(ctx, canvas.width, canvas.height, [
        { type: 'line', x1: sx, y1: sy, x2: pos[0], y2: pos[1], color }
      ]);
    }
  };

  const handleUp = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const pos = getPos(e);
    let newAction: DrawAction | null = null;

    if (tool === 'pen' && currentPath.current.length > 1) {
      newAction = { type: 'path', points: [...currentPath.current], color, width: 2 };
      currentPath.current = [];
    } else if (tool === 'rect') {
      const [sx, sy] = startPos.current;
      newAction = { type: 'rect', x: sx, y: sy, w: pos[0] - sx, h: pos[1] - sy, color };
    } else if (tool === 'circle') {
      const [sx, sy] = startPos.current;
      const r = Math.sqrt((pos[0] - sx) ** 2 + (pos[1] - sy) ** 2);
      newAction = { type: 'circle', cx: sx, cy: sy, r, color };
    } else if (tool === 'line') {
      const [sx, sy] = startPos.current;
      newAction = { type: 'line', x1: sx, y1: sy, x2: pos[0], y2: pos[1], color };
    }

    if (newAction) {
      setActions(prev => [...prev, newAction]);
      broadcast({ type: 'whiteboard-action', payload: newAction });
    }
  };

  const handleClear = () => {
    setActions([]);
    broadcast({ type: 'whiteboard-clear' });
  };

  const handleUndo = () => {
    setActions(prev => prev.slice(0, -1));
    broadcast({ type: 'whiteboard-undo' });
  };

  const tools: { id: Tool; icon: typeof Pencil; label: string }[] = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'text', icon: Type, label: 'Text' },
  ];

  return (
    <div className="panel-card h-full">
      <div className="panel-header">
        <Pencil className="panel-header-icon" />
        <span>Whiteboard</span>
        {remoteCursors.size > 0 && (
          <span className="text-[10px] text-neon ml-1">
            {remoteCursors.size} live cursor{remoteCursors.size > 1 ? 's' : ''}
          </span>
        )}
        <span className="section-label ml-2 hidden sm:inline">Ideation Canvas</span>
        <div className="ml-auto flex items-center gap-1">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`tool-btn ${tool === t.id ? 'active' : ''}`}
              title={t.label}
            >
              <t.icon size={14} />
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? c : 'transparent',
                boxShadow: color === c ? `0 0 8px ${c}60` : 'none'
              }}
            />
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={handleUndo} className="tool-btn" title="Undo">
            <Undo2 size={14} />
          </button>
          <button onClick={handleClear} className="tool-btn" title="Clear">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="panel-body cursor-crosshair"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          backgroundColor: 'rgba(8, 15, 28, 0.3)',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={() => { if (isDrawing) setIsDrawing(false); }}
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}
