import React from 'react';
import type { DiagramEdge, DiagramNode } from '@shared/types.js';
import { buildEdgePath, computeAutoPorts } from '../../lib/geometry.js';

interface Props {
  edge: DiagramEdge;
  nodes: DiagramNode[];
  selected: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
}

const MARKER_DEF_ID = 'arrow-marker-defs';

export const EdgeRenderer: React.FC<Props> = ({ edge, nodes, selected, onMouseDown }) => {
  const source = nodes.find(n => n.id === edge.source);
  const target = nodes.find(n => n.id === edge.target);
  if (!source || !target) return null;

  let { sourcePort, targetPort } = edge;
  if (!sourcePort || !targetPort) {
    const auto = computeAutoPorts(source, target);
    sourcePort = sourcePort ?? auto.sourcePort;
    targetPort = targetPort ?? auto.targetPort;
  }

  const path = buildEdgePath(source, target, sourcePort, targetPort, edge.style.curve);

  const strokeColor = selected ? '#3B82F6' : edge.style.stroke;
  const strokeWidth = selected ? edge.style.strokeWidth + 1.5 : edge.style.strokeWidth;

  const { label } = edge;
  const midX = (source.x + source.width / 2 + target.x + target.width / 2) / 2;
  const midY = (source.y + source.height / 2 + target.y + target.height / 2) / 2;

  const markerEnd = edge.style.arrowEnd ? `url(#arrow-end-${edge.id})` : undefined;
  const markerStart = edge.style.arrowStart ? `url(#arrow-start-${edge.id})` : undefined;

  return (
    <g onMouseDown={onMouseDown} style={{ cursor: 'pointer' }}>
      <defs>
        <marker
          id={`arrow-end-${edge.id}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
        </marker>
        <marker
          id={`arrow-start-${edge.id}`}
          viewBox="0 0 10 10"
          refX="2"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 10 0 L 0 5 L 10 10 z" fill={strokeColor} />
        </marker>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(16, strokeWidth + 12)}
      />
      <path
        className="edge-path"
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={edge.style.dashed ? '8 5' : undefined}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {label && (
        <g>
          <rect
            x={midX - (label.length * 7) / 2 - 6}
            y={midY - 10}
            width={label.length * 7 + 12}
            height={20}
            rx={4}
            fill="white"
            stroke={strokeColor}
            strokeWidth={1}
            opacity={0.95}
          />
          <text
            className="edge-label"
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            fill={strokeColor}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
};

export const ArrowMarkerDefs = () => (
  <defs id={MARKER_DEF_ID}>
    <marker id="default-arrow-end" viewBox="0 0 10 10" refX="8" refY="5"
      markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
    </marker>
  </defs>
);
