import type { DiagramNode, Viewport, PortType, DiagramEdge, EdgeCurve } from '@shared/types.js';

export const viewportToScreen = (vp: Viewport, x: number, y: number) => ({
  x: x * vp.zoom + vp.x,
  y: y * vp.zoom + vp.y,
});

export const screenToViewport = (vp: Viewport, x: number, y: number) => ({
  x: (x - vp.x) / vp.zoom,
  y: (y - vp.y) / vp.zoom,
});

export const getNodeCenter = (n: DiagramNode) => ({
  x: n.x + n.width / 2,
  y: n.y + n.height / 2,
});

export const getPortPosition = (n: DiagramNode, port: PortType) => {
  switch (port) {
    case 'top': return { x: n.x + n.width / 2, y: n.y };
    case 'bottom': return { x: n.x + n.width / 2, y: n.y + n.height };
    case 'left': return { x: n.x, y: n.y + n.height / 2 };
    case 'right': return { x: n.x + n.width, y: n.y + n.height / 2 };
  }
};

const PORTS: PortType[] = ['right', 'bottom', 'left', 'top'];

export const computeAutoPorts = (source: DiagramNode, target: DiagramNode): { sourcePort: PortType; targetPort: PortType } => {
  let best: { d: number; sourcePort: PortType; targetPort: PortType } | null = null;
  for (const sp of PORTS) {
    for (const tp of PORTS) {
      const p1 = getPortPosition(source, sp);
      const p2 = getPortPosition(target, tp);
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (!best || d < best.d) best = { d, sourcePort: sp, targetPort: tp };
    }
  }
  return { sourcePort: best!.sourcePort, targetPort: best!.targetPort };
};

export const buildEdgePath = (
  source: DiagramNode,
  target: DiagramNode,
  sourcePort: PortType,
  targetPort: PortType,
  curve: EdgeCurve,
) => {
  const p1 = getPortPosition(source, sourcePort);
  const p2 = getPortPosition(target, targetPort);

  if (curve === 'straight') {
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  }

  if (curve === 'orthogonal') {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      const midX = (p1.x + p2.x) / 2;
      return `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
    } else {
      const midY = (p1.y + p2.y) / 2;
      return `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
    }
  }

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.hypot(dx, dy);
  const curveStrength = Math.min(distance * 0.4, 120);

  const cpOffset = (port: PortType, strength: number) => {
    switch (port) {
      case 'right': return { dx: strength, dy: 0 };
      case 'left': return { dx: -strength, dy: 0 };
      case 'top': return { dx: 0, dy: -strength };
      case 'bottom': return { dx: 0, dy: strength };
    }
  };

  const cp1 = cpOffset(sourcePort, curveStrength);
  const cp2 = cpOffset(targetPort, curveStrength);

  return `M ${p1.x} ${p1.y} C ${p1.x + cp1.dx} ${p1.y + cp1.dy}, ${p2.x + cp2.dx} ${p2.y + cp2.dy}, ${p2.x} ${p2.y}`;
};

export const snapToGrid = (value: number, gridSize = 20) => Math.round(value / gridSize) * gridSize;

export const roundRectPath = (x: number, y: number, w: number, h: number, r: number) => {
  const radius = Math.min(r, w / 2, h / 2);
  return `M ${x + radius} ${y}
          H ${x + w - radius}
          Q ${x + w} ${y} ${x + w} ${y + radius}
          V ${y + h - radius}
          Q ${x + w} ${y + h} ${x + w - radius} ${y + h}
          H ${x + radius}
          Q ${x} ${y + h} ${x} ${y + h - radius}
          V ${y + radius}
          Q ${x} ${y} ${x + radius} ${y} Z`;
};

export const polygonPoints = (cx: number, cy: number, sides: number, radius: number, rotation = 0) => {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides + rotation - Math.PI / 2;
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return pts.join(' ');
};

export const computeContentBBox = (nodes: DiagramNode[]) => {
  if (nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

export const PORT_POSITIONS: { key: PortType; label: string }[] = [
  { key: 'top', label: '上' }, { key: 'right', label: '右' },
  { key: 'bottom', label: '下' }, { key: 'left', label: '左' },
];

export const getNewZIndex = (nodes: DiagramNode[]) => {
  if (nodes.length === 0) return 1;
  return Math.max(...nodes.map(n => n.zIndex)) + 1;
};

export { };
