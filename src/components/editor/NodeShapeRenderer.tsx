import React from 'react';
import type { DiagramNode } from '@shared/types.js';
import { roundRectPath, polygonPoints } from '../../lib/geometry.js';

interface Props {
  node: DiagramNode;
  selected: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onPortMouseDown?: (port: 'top' | 'right' | 'bottom' | 'left', e: React.MouseEvent) => void;
}

const PORT_RADIUS = 5;

export const NodeShapeRenderer: React.FC<Props> = ({ node, selected, onMouseDown, onDoubleClick, onPortMouseDown }) => {
  const { x, y, width: w, height: h, style, type, text } = node;
  const { fill, stroke, strokeWidth, borderRadius, fontColor, fontSize, fontFamily, opacity } = style;

  const portPositions = {
    top: { cx: x + w / 2, cy: y },
    right: { cx: x + w, cy: y + h / 2 },
    bottom: { cx: x + w / 2, cy: y + h },
    left: { cx: x, cy: y + h / 2 },
  };

  const renderBody = (): React.ReactNode => {
    const bodyStyle = {
      fill, stroke, strokeWidth, opacity,
    } as React.CSSProperties;

    switch (type) {
      case 'rectangle':
      case 'flow-process':
        return <path className="node-body" d={roundRectPath(x, y, w, h, borderRadius)} style={bodyStyle} />;

      case 'rounded-rect':
      case 'flow-start':
        return <path className="node-body" d={roundRectPath(x, y, w, h, Math.min(borderRadius * 2, h / 2))} style={bodyStyle} />;

      case 'circle':
      case 'er-attribute':
      case 'er-key':
      case 'er-multivalue':
        return (
          <g>
            <ellipse className="node-body" cx={x + w / 2} cy={y + h / 2} rx={w / 2 - strokeWidth} ry={h / 2 - strokeWidth} style={bodyStyle} />
            {type === 'er-key' && (
              <line x1={x + w * 0.2} y1={y + h / 2} x2={x + w * 0.8} y2={y + h / 2} stroke={stroke} strokeWidth={strokeWidth} />
            )}
            {type === 'er-multivalue' && (
              <ellipse className="node-body" cx={x + w / 2} cy={y + h / 2} rx={w / 2 - strokeWidth - 4} ry={h / 2 - strokeWidth - 4}
                fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
            )}
          </g>
        );

      case 'diamond':
      case 'flow-decision':
      case 'er-relation':
      case 'topo-lb': {
        const pts = [
          `${x + w / 2},${y}`,
          `${x + w},${y + h / 2}`,
          `${x + w / 2},${y + h}`,
          `${x},${y + h / 2}`,
        ].join(' ');
        return <polygon className="node-body" points={pts} style={bodyStyle} />;
      }

      case 'parallelogram':
      case 'flow-input': {
        const skew = Math.min(20, w * 0.15);
        const pts = [
          `${x + skew},${y}`,
          `${x + w},${y}`,
          `${x + w - skew},${y + h}`,
          `${x},${y + h}`,
        ].join(' ');
        return <polygon className="node-body" points={pts} style={bodyStyle} />;
      }

      case 'hexagon': {
        const hx = Math.min(25, w * 0.18);
        const pts = [
          `${x + hx},${y}`, `${x + w - hx},${y}`,
          `${x + w},${y + h / 2}`, `${x + w - hx},${y + h}`,
          `${x + hx},${y + h}`, `${x},${y + h / 2}`,
        ].join(' ');
        return <polygon className="node-body" points={pts} style={bodyStyle} />;
      }

      case 'ellipse':
        return <ellipse className="node-body" cx={x + w / 2} cy={y + h / 2} rx={w / 2 - strokeWidth} ry={h / 2 - strokeWidth} style={bodyStyle} />;

      case 'flow-subprocess': {
        const bar = 10;
        return (
          <g>
            <path className="node-body" d={roundRectPath(x, y, w, h, borderRadius)} style={bodyStyle} />
            <line x1={x + bar} y1={y} x2={x + bar} y2={y + h} stroke={stroke} strokeWidth={strokeWidth} />
            <line x1={x + w - bar} y1={y} x2={x + w - bar} y2={y + h} stroke={stroke} strokeWidth={strokeWidth} />
          </g>
        );
      }

      case 'flow-document': {
        const fold = 18;
        const pts = [
          `${x},${y}`, `${x + w},${y}`,
          `${x + w},${y + h - fold}`,
          `${x + w - fold},${y + h}`,
          `${x},${y + h}`,
        ].join(' ');
        return (
          <g>
            <polygon className="node-body" points={pts} style={bodyStyle} />
            <line x1={x + w} y1={y + h - fold} x2={x + w - fold} y2={y + h - fold} stroke={stroke} strokeWidth={strokeWidth} />
            <line x1={x + w - fold} y1={y + h - fold} x2={x + w - fold} y2={y + h} stroke={stroke} strokeWidth={strokeWidth} />
          </g>
        );
      }

      case 'flow-data':
      case 'topo-database': {
        const rx = (w - strokeWidth) / 2;
        const ry = Math.min(22, h * 0.14);
        const bodyR = 18;
        return (
          <g>
            <ellipse cx={x + w / 2} cy={y + ry} rx={rx} ry={ry} style={bodyStyle} />
            <path className="node-body"
              d={`M ${x + strokeWidth} ${y + ry} L ${x + strokeWidth} ${y + h - ry}
                  A ${rx} ${ry} 0 0 0 ${x + w - strokeWidth} ${y + h - ry}
                  L ${x + w - strokeWidth} ${y + ry}`}
              style={bodyStyle} />
            <ellipse className="node-body" cx={x + w / 2} cy={y + h / 2} rx={rx * 0.7} ry={ry * 0.7}
              fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.8} opacity={opacity * 0.6} />
            {type === 'topo-database' && (
              <>
                <line x1={x + w * 0.2} y1={y + h * 0.35} x2={x + w * 0.32} y2={y + h * 0.35} stroke={stroke} strokeWidth={strokeWidth} />
                <line x1={x + w * 0.2} y1={y + h * 0.5} x2={x + w * 0.32} y2={y + h * 0.5} stroke={stroke} strokeWidth={strokeWidth} />
                <line x1={x + w * 0.2} y1={y + h * 0.75} x2={x + w * 0.32} y2={y + h * 0.75} stroke={stroke} strokeWidth={strokeWidth} />
              </>
            )}
          </g>
        );
      }

      case 'er-entity': {
        const lines = 4;
        const lineH = h / (lines + 1);
        return (
          <g>
            <path className="node-body" d={roundRectPath(x, y, w, h, borderRadius * 0.5)} style={bodyStyle} />
            {Array.from({ length: lines }).map((_, i) => (
              <line key={i} x1={x} y1={y + lineH * (i + 1)} x2={x + w} y2={y + lineH * (i + 1)}
                stroke={stroke} strokeWidth={strokeWidth * 0.7} opacity={0.6} />
            ))}
          </g>
        );
      }

      case 'swimlane-horizontal':
      case 'swimlane-title': {
        const sep = Math.min(100, w * 0.15);
        return (
          <g>
            <path className="node-body" d={roundRectPath(x, y, w, h, borderRadius)} style={bodyStyle} />
            <line x1={x + sep} y1={y} x2={x + sep} y2={y + h} stroke={stroke} strokeWidth={strokeWidth * 1.2} strokeDasharray="4 3" opacity={0.5} />
            {type === 'swimlane-horizontal' && (
              <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={stroke} strokeWidth={strokeWidth * 0.8} strokeDasharray="6 4" opacity={0.4} />
            )}
          </g>
        );
      }

      case 'swimlane-vertical': {
        return (
          <g>
            <path className="node-body" d={roundRectPath(x, y, w, h, borderRadius)} style={bodyStyle} />
            <line x1={x} y1={y + h * 0.15} x2={x + w} y2={y + h * 0.15} stroke={stroke} strokeWidth={strokeWidth * 1.2} strokeDasharray="4 3" opacity={0.5} />
            <line x1={x} y1={y + h * 0.5} x2={x + w} y2={y + h * 0.5} stroke={stroke} strokeWidth={strokeWidth * 0.8} strokeDasharray="6 4" opacity={0.4} />
            <line x1={x} y1={y + h * 0.85} x2={x + w} y2={y + h * 0.85} stroke={stroke} strokeWidth={strokeWidth * 0.8} strokeDasharray="6 4" opacity={0.4} />
            <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={stroke} strokeWidth={strokeWidth * 0.8} strokeDasharray="4 4" opacity={0.4} />
          </g>
        );
      }

      case 'seq-actor': {
        const r = Math.min(w * 0.3, h * 0.3);
        return (
          <g>
            <circle className="node-body" cx={x + w / 2} cy={y + r} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            <line x1={x + w / 2} y1={y + r * 2} x2={x + w / 2} y2={y + h * 0.65} stroke={stroke} strokeWidth={strokeWidth} />
            <line x1={x + w * 0.25} y1={y + h * 0.5} x2={x + w * 0.75} y2={y + h * 0.5} stroke={stroke} strokeWidth={strokeWidth} />
            <line x1={x + w / 2} y1={y + h * 0.65} x2={x + w * 0.25} y2={y + h} stroke={stroke} strokeWidth={strokeWidth} />
            <line x1={x + w / 2} y1={y + h * 0.65} x2={x + w * 0.75} y2={y + h} stroke={stroke} strokeWidth={strokeWidth} />
          </g>
        );
      }

      case 'seq-lifeline': {
        const head = Math.min(20, w);
        return (
          <g>
            <path className="node-body" d={roundRectPath(x, y, w, head, borderRadius * 0.3)} style={bodyStyle} />
            <line x1={x + w / 2} y1={y + head} x2={x + w / 2} y2={y + h}
              stroke={stroke} strokeWidth={strokeWidth * 0.8} strokeDasharray="2 6" opacity={0.7} />
          </g>
        );
      }

      case 'seq-activation':
        return <path className="node-body" d={roundRectPath(x, y, w, h, 2)} style={bodyStyle} />;

      case 'seq-message-box': {
        const fold = 12;
        const pts = [
          `${x},${y}`, `${x + w},${y}`, `${x + w},${y + h - fold}`,
          `${x + w - fold},${y + h}`, `${x + fold},${y + h}`,
          `${x},${y + h - fold}`,
        ].join(' ');
        return <polygon className="node-body" points={pts} style={bodyStyle} />;
      }

      case 'seq-loop': {
        const corner = Math.min(70, w * 0.25);
        return (
          <g>
            <path className="node-body" d={roundRectPath(x, y, w, h, borderRadius)} style={bodyStyle} />
            <polyline points={`${x},${y + corner * 0.3} ${x + corner * 0.3},${y + corner * 0.3} ${x + corner * 0.3},${y}`}
              fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          </g>
        );
      }

      case 'topo-router': {
        const pts = [
          `${x + w * 0.15},${y + h / 2}`,
          `${x + w * 0.6},${y + strokeWidth}`,
          `${x + w * 0.6},${y + h - strokeWidth}`,
        ].join(' ');
        return (
          <g>
            <polygon className="node-body" points={pts} style={bodyStyle} />
            <path className="node-body"
              d={`M ${x + w * 0.6} ${y + strokeWidth}
                  C ${x + w + strokeWidth} ${y + h * 0.35}, ${x + w + strokeWidth} ${y + h * 0.65}, ${x + w * 0.6} ${y + h - strokeWidth}`}
              style={bodyStyle} />
          </g>
        );
      }

      case 'topo-switch': {
        const lineY = [h * 0.3, h * 0.5, h * 0.7];
        return (
          <g>
            <path className="node-body" d={roundRectPath(x, y, w, h, borderRadius * 0.5)} style={bodyStyle} />
            {lineY.map((ly, i) => (
              <line key={i} x1={x + w * 0.2} y1={y + ly} x2={x + w * 0.8} y2={y + ly}
                stroke={stroke} strokeWidth={strokeWidth * 0.8} />
            ))}
          </g>
        );
      }

      case 'topo-server': {
        const dividers = 3;
        return (
          <g>
            <path className="node-body" d={roundRectPath(x, y, w, h, borderRadius * 0.5)} style={bodyStyle} />
            {Array.from({ length: dividers }).map((_, i) => (
              <line key={i} x1={x} y1={y + (h / (dividers + 1)) * (i + 1)}
                x2={x + w} y2={y + (h / (dividers + 1)) * (i + 1)}
                stroke={stroke} strokeWidth={strokeWidth * 0.5} opacity={0.5} />
            ))}
            {Array.from({ length: dividers + 1 }).map((_, i) => (
              <g key={`d${i}`}>
                <circle cx={x + w * 0.2} cy={y + (h / (dividers + 1)) * (i + 0.5)} r={3} fill={stroke} opacity={0.8} />
                <circle cx={x + w * 0.3} cy={y + (h / (dividers + 1)) * (i + 0.5)} r={3} fill={stroke} opacity={0.5} />
              </g>
            ))}
          </g>
        );
      }

      case 'topo-pc': {
        const stand = Math.min(14, h * 0.18);
        return (
          <g>
            <path className="node-body" d={roundRectPath(x, y, w, h - stand, borderRadius)} style={bodyStyle} />
            <path d={`M ${x + w * 0.35} ${y + h - stand}
                      L ${x + w * 0.65} ${y + h - stand}
                      L ${x + w * 0.55} ${y + h}
                      L ${x + w * 0.45} ${y + h} Z`}
              fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
          </g>
        );
      }

      case 'topo-firewall': {
        const cols = 3, rows = 2;
        return (
          <g>
            <path className="node-body" d={roundRectPath(x, y, w, h, borderRadius * 0.5)} style={bodyStyle} />
            {Array.from({ length: cols + 1 }).map((_, i) => (
              <line key={`vc${i}`} x1={x + (w / (cols + 1)) * (i + 1) * 0.7 + w * 0.1}
                y1={y} x2={x + (w / (cols + 1)) * (i + 1) * 0.7 + w * 0.1} y2={y + h}
                stroke={stroke} strokeWidth={strokeWidth * 0.6} opacity={0.5} />
            ))}
            {Array.from({ length: rows }).map((_, i) => (
              <line key={`hr${i}`} x1={x} y1={y + (h / (rows + 1)) * (i + 1)}
                x2={x + w} y2={y + (h / (rows + 1)) * (i + 1)}
                stroke={stroke} strokeWidth={strokeWidth * 0.6} opacity={0.5} />
            ))}
          </g>
        );
      }

      case 'topo-cloud': {
        const cx = x + w / 2, cy = y + h / 2;
        const rx = w * 0.36, ry = h * 0.3;
        return (
          <g>
            <ellipse className="node-body" cx={cx - rx * 0.6} cy={cy + ry * 0.2} rx={rx * 0.7} ry={ry * 0.7} style={bodyStyle} />
            <ellipse className="node-body" cx={cx + rx * 0.6} cy={cy + ry * 0.1} rx={rx * 0.8} ry={ry * 0.8} style={bodyStyle} />
            <ellipse className="node-body" cx={cx} cy={cy - ry * 0.4} rx={rx} ry={ry * 0.9} style={bodyStyle} />
            <ellipse className="node-body" cx={cx} cy={cy + ry * 0.4} rx={rx * 1.2} ry={ry * 0.7} style={bodyStyle} />
          </g>
        );
      }

      default:
        return <path className="node-body" d={roundRectPath(x, y, w, h, borderRadius)} style={bodyStyle} />;
    }
  };

  const renderText = () => {
    if (!text) return null;
    const padding = 8;
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.3;
    const textStartY = y + h / 2 - ((lines.length - 1) * lineHeight) / 2;

    if (type === 'swimlane-horizontal' || type === 'swimlane-title') {
      const sep = Math.min(100, w * 0.15);
      return (
        <text
          x={x + sep / 2}
          y={y + h / 2}
          fill={fontColor}
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontWeight={600}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ userSelect: 'none', writingMode: type === 'swimlane-title' ? 'vertical-rl' : 'horizontal-tb' } as any}
        >
          {text}
        </text>
      );
    }

    if (type === 'swimlane-vertical') {
      const head = h * 0.15;
      return (
        <text
          x={x + w / 2}
          y={y + head / 2}
          fill={fontColor}
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontWeight={600}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ userSelect: 'none' }}
        >
          {text}
        </text>
      );
    }

    return (
      <foreignObject
        x={x + padding}
        y={y + padding}
        width={w - padding * 2}
        height={h - padding * 2}
        style={{ pointerEvents: 'none', overflow: 'hidden' }}
      >
        <div style={{
          width: '100%', height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: fontColor,
          fontFamily,
          fontSize,
          fontWeight: 500,
          lineHeight: 1.3,
          textAlign: 'center',
          wordBreak: 'break-word',
          overflow: 'hidden',
          userSelect: 'none',
        }}>
          {lines.map((ln, i) => <div key={i}>{ln}</div>)}
        </div>
      </foreignObject>
    );
  };

  return (
    <g
      className={`node-shape ${selected ? 'node-selected' : ''}`}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      style={{
        filter: selected
          ? 'drop-shadow(0 8px 30px rgba(59, 130, 246, 0.25))'
          : 'drop-shadow(0 4px 20px rgba(30, 58, 95, 0.12))',
        zIndex: node.zIndex,
      }}
    >
      {renderBody()}
      {renderText()}
      {onPortMouseDown && (
        <g className="ports">
          {(['top', 'right', 'bottom', 'left'] as const).map(port => (
            <circle
              key={port}
              className="connection-port"
              cx={portPositions[port].cx}
              cy={portPositions[port].cy}
              r={PORT_RADIUS}
              onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(port, e); }}
            />
          ))}
        </g>
      )}
      {selected && (
        <g className="resize-handles">
          {([
            ['nw', x, y], ['ne', x + w, y],
            ['sw', x, y + h], ['se', x + w, y + h],
          ] as const).map(([dir, cx, cy]) => (
            <rect
              key={dir}
              className="control-point"
              x={cx - 5}
              y={cy - 5}
              width={10}
              height={10}
              rx={2}
            />
          ))}
        </g>
      )}
    </g>
  );
};
