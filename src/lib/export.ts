import { jsPDF } from 'jspdf';
import { useDiagramStore } from '../store/useDiagramStore.js';
import { diagramApi } from './api.js';
import { computeContentBBox } from './geometry.js';

const getSvgRoot = (): SVGSVGElement | null => {
  const store = useDiagramStore.getState();
  const diagram = store.diagram;
  if (!diagram) return null;

  const bbox = diagram.nodes.length > 0
    ? computeContentBBox(diagram.nodes)
    : { x: 0, y: 0, width: 800, height: 600 };
  const pad = 60;
  const w = bbox.width + pad * 2;
  const h = bbox.height + pad * 2;
  const offX = -bbox.x + pad;
  const offY = -bbox.y + pad;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('xmlns', svgNS);
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  const bg = document.createElementNS(svgNS, 'rect');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', '#FFFFFF');
  svg.appendChild(bg);

  const group = document.createElementNS(svgNS, 'g');
  group.setAttribute('transform', `translate(${offX}, ${offY})`);

  const markerDefs = document.createElementNS(svgNS, 'defs');
  const arrowColors = new Set<string>();
  diagram.edges.forEach(e => arrowColors.add(e.style.stroke));

  diagram.edges.forEach((edge, i) => {
    const color = edge.style.stroke;
    const mid = `exp-arrow-${i}-end`;
    const marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', mid);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    path.setAttribute('fill', color);
    marker.appendChild(path);
    markerDefs.appendChild(marker);

    const src = diagram.nodes.find(n => n.id === edge.source);
    const tgt = diagram.nodes.find(n => n.id === edge.target);
    if (!src || !tgt) return;

    const autoPorts = computePorts(src, tgt);
    const sp = edge.sourcePort ?? autoPorts.sourcePort;
    const tp = edge.targetPort ?? autoPorts.targetPort;
    const p1 = getPort(src, sp);
    const p2 = getPort(tgt, tp);
    const d = buildEdgePath(src, tgt, sp, tp, edge.style.curve);

    const line = document.createElementNS(svgNS, 'path');
    line.setAttribute('d', d);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(edge.style.strokeWidth));
    if (edge.style.dashed) line.setAttribute('stroke-dasharray', '8 5');
    if (edge.style.arrowEnd) line.setAttribute('marker-end', `url(#${mid})`);
    group.appendChild(line);

    if (edge.label) {
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const txtBg = document.createElementNS(svgNS, 'rect');
      const len = edge.label.length * 7 + 12;
      txtBg.setAttribute('x', String(midX - len / 2));
      txtBg.setAttribute('y', String(midY - 10));
      txtBg.setAttribute('width', String(len));
      txtBg.setAttribute('height', '20');
      txtBg.setAttribute('rx', '4');
      txtBg.setAttribute('fill', 'white');
      txtBg.setAttribute('stroke', color);
      group.appendChild(txtBg);
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', String(midX));
      t.setAttribute('y', String(midY + 4));
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('fill', color);
      t.setAttribute('font-family', 'Inter');
      t.setAttribute('font-size', '12');
      t.textContent = edge.label;
      group.appendChild(t);
    }
  });

  svg.appendChild(markerDefs);

  diagram.nodes.forEach(node => {
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

    const body = document.createElementNS(svgNS, 'foreignObject');
    body.setAttribute('width', String(node.width));
    body.setAttribute('height', String(node.height));
    body.setAttribute('x', '0');
    body.setAttribute('y', '0');
    const div = document.createElement('div');
    div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.background = node.style.fill;
    div.style.border = `${node.style.strokeWidth}px solid ${node.style.stroke}`;
    div.style.borderRadius = `${node.style.borderRadius}px`;
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.padding = '8px';
    div.style.color = node.style.fontColor;
    div.style.fontFamily = node.style.fontFamily ?? 'Inter';
    div.style.fontSize = `${node.style.fontSize}px`;
    div.style.fontWeight = '500';
    div.style.textAlign = 'center';
    div.style.overflow = 'hidden';
    div.style.boxSizing = 'border-box';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordBreak = 'break-word';
    div.textContent = node.text;
    body.appendChild(div);
    g.appendChild(body);
    group.appendChild(g);
  });

  svg.appendChild(group);
  return svg;
};

function getPort(n: any, port: string) {
  if (port === 'top') return { x: n.x + n.width / 2, y: n.y };
  if (port === 'bottom') return { x: n.x + n.width / 2, y: n.y + n.height };
  if (port === 'left') return { x: n.x, y: n.y + n.height / 2 };
  return { x: n.x + n.width, y: n.y + n.height / 2 };
}

function computePorts(src: any, tgt: any) {
  const ports = ['right', 'bottom', 'left', 'top'] as const;
  let best: any = null;
  for (const sp of ports) {
    for (const tp of ports) {
      const p1 = getPort(src, sp);
      const p2 = getPort(tgt, tp);
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (!best || d < best.d) best = { d, sourcePort: sp, targetPort: tp };
    }
  }
  return best;
}

function buildEdgePath(src: any, tgt: any, sp: any, tp: any, curve: string) {
  const p1 = getPort(src, sp);
  const p2 = getPort(tgt, tp);
  if (curve === 'straight') return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  if (curve === 'orthogonal') {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      const m = (p1.x + p2.x) / 2;
      return `M ${p1.x} ${p1.y} L ${m} ${p1.y} L ${m} ${p2.y} L ${p2.x} ${p2.y}`;
    } else {
      const m = (p1.y + p2.y) / 2;
      return `M ${p1.x} ${p1.y} L ${p1.x} ${m} L ${p2.x} ${m} L ${p2.x} ${p2.y}`;
    }
  }
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const d = Math.hypot(dx, dy);
  const cs = Math.min(d * 0.4, 120);
  const off = (p: string, s: number): [number, number] =>
    ({ right: [s, 0], left: [-s, 0], top: [0, -s], bottom: [0, s] } as any)[p](s);
  const c1 = off(sp, cs), c2 = off(tp, cs);
  return `M ${p1.x} ${p1.y} C ${p1.x + c1[0]} ${p1.y + c1[1]}, ${p2.x + c2[0]} ${p2.y + c2[1]}, ${p2.x} ${p2.y}`;
}

export const exportSvg = () => {
  const svg = getSvgRoot();
  if (!svg) return;
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svg);
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const blob = new Blob([`<?xml version="1.0" standalone="no"?>\r\n` + source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = useDiagramStore.getState().diagram;
  a.href = url;
  a.download = `${d?.name ?? 'diagram'}.svg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

export const exportPng = async () => {
  const svg = getSvgRoot();
  if (!svg) return;
  const w = Number(svg.getAttribute('width'));
  const h = Number(svg.getAttribute('height'));
  const serializer = new XMLSerializer();
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serializer.serializeToString(svg));
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = src;
  });
  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  const d = useDiagramStore.getState().diagram;
  a.href = url;
  a.download = `${d?.name ?? 'diagram'}.png`;
  a.click();
};

export const exportPdf = async () => {
  const svg = getSvgRoot();
  if (!svg) return;
  const w = Number(svg.getAttribute('width'));
  const h = Number(svg.getAttribute('height'));
  const serializer = new XMLSerializer();
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serializer.serializeToString(svg));
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = src;
  });
  const orientation = w > h ? 'l' : 'p';
  const maxW = w > h ? 280 : 200;
  const ratio = Math.min(maxW / w, 180 / h);
  const dw = w * ratio;
  const dh = h * ratio;
  const pdf = new (jsPDF as any)({ orientation, unit: 'mm', format: [dw + 20, dh + 20] });
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0);
  const data = canvas.toDataURL('image/png');
  pdf.addImage(data, 'PNG', 10, 10, dw, dh);
  const d = useDiagramStore.getState().diagram;
  pdf.save(`${d?.name ?? 'diagram'}.pdf`);
};

export const getEmbedCode = async () => {
  try {
    const d = useDiagramStore.getState().diagram;
    if (!d) return;
    const info = await diagramApi.getEmbed(d.id);
    const ta = document.createElement('textarea');
    ta.value = info.embedCode;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('嵌入代码已复制到剪贴板');
  } catch (e) {
    showToast('复制失败');
  }
};

function showToast(msg: string) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 bg-graphite-800 text-white px-5 py-2.5 rounded-lg shadow-lg z-[9999] text-sm font-medium animate-fade-in';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
