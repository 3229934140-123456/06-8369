export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
}

export type MemberRole = 'admin' | 'editor' | 'viewer';

export interface ProjectMember {
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  coverThumbnail?: string;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  ownerId: string;
}

export type DiagramType = 'flowchart' | 'swimlane' | 'er' | 'sequence' | 'topology';

export interface NodeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  opacity: number;
}

export interface DiagramNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  style: NodeStyle;
  data?: Record<string, any>;
  zIndex: number;
}

export type PortType = 'top' | 'right' | 'bottom' | 'left';
export type EdgeCurve = 'straight' | 'bezier' | 'orthogonal';

export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  dashed: boolean;
  arrowStart: boolean;
  arrowEnd: boolean;
  curve: EdgeCurve;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: PortType;
  targetPort?: PortType;
  label?: string;
  style: EdgeStyle;
  points?: { x: number; y: number }[];
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Diagram {
  id: string;
  projectId: string;
  name: string;
  type: DiagramType;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: Viewport;
}

export interface DiagramVersion {
  id: string;
  diagramId: string;
  version: number;
  name?: string;
  snapshot: Pick<Diagram, 'nodes' | 'edges' | 'viewport'>;
  createdBy: string;
  createdAt: string;
  message?: string;
}

export interface CommentReply {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  mentions: string[];
}

export interface Comment {
  id: string;
  diagramId: string;
  nodeId?: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
  replies: CommentReply[];
}

export interface CursorPayload {
  x: number;
  y: number;
  viewport: Viewport;
  selectedNodeId?: string;
}

type NodeUpdateChanges = Omit<Partial<DiagramNode>, 'style'> & { style?: Partial<NodeStyle> };
type EdgeUpdateChanges = Omit<Partial<DiagramEdge>, 'style'> & { style?: Partial<EdgeStyle> };

export type Operation =
  | { type: 'node:add'; node: DiagramNode }
  | { type: 'node:update'; nodeId: string; changes: NodeUpdateChanges }
  | { type: 'node:delete'; nodeId: string }
  | { type: 'edge:add'; edge: DiagramEdge }
  | { type: 'edge:update'; edgeId: string; changes: EdgeUpdateChanges }
  | { type: 'edge:delete'; edgeId: string }
  | { type: 'viewport:update'; viewport: Viewport };

export interface OperationPayload {
  opId: string;
  operations: Operation[];
}

export interface PresencePayload {
  user: User;
  online: boolean;
}

export type CollabMessageType = 'cursor' | 'op' | 'join' | 'leave' | 'presence';

export interface CollabMessage {
  type: CollabMessageType;
  userId: string;
  diagramId: string;
  payload: CursorPayload | OperationPayload | PresencePayload;
  timestamp: number;
}

export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  type: DiagramType;
  thumbnail: string;
  category: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export const DEFAULT_NODE_STYLE: NodeStyle = {
  fill: '#FFFFFF',
  stroke: '#334155',
  strokeWidth: 1.5,
  borderRadius: 8,
  fontSize: 14,
  fontColor: '#0F172A',
  fontFamily: 'Inter',
  opacity: 1,
};

export const DEFAULT_EDGE_STYLE: EdgeStyle = {
  stroke: '#475569',
  strokeWidth: 2,
  dashed: false,
  arrowStart: false,
  arrowEnd: true,
  curve: 'bezier',
};

export const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const DIAGRAM_TYPE_LABELS: Record<DiagramType, string> = {
  flowchart: '流程图',
  swimlane: '泳道图',
  er: 'ER图',
  sequence: '时序图',
  topology: '网络拓扑图',
};
