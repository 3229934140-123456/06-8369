import type { User, Project, Diagram, DiagramVersion, Comment, DiagramTemplate, DiagramNode, DiagramEdge, DEFAULT_NODE_STYLE, DEFAULT_EDGE_STYLE, DEFAULT_VIEWPORT } from '../shared/types.js';
import type { DiagramType } from '../shared/types.js';
import { DEFAULT_NODE_STYLE as DNS, DEFAULT_EDGE_STYLE as DES, DEFAULT_VIEWPORT as DV } from '../shared/types.js';

export const now = () => new Date().toISOString();
export const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();
export const daysAgo = (d: number) => new Date(Date.now() - d * 86400 * 1000).toISOString();

export const USERS: User[] = [
  { id: 'u-1', name: '张三', email: 'zhangsan@example.com', avatar: 'ZS', color: '#3B82F6' },
  { id: 'u-2', name: '李四', email: 'lisi@example.com', avatar: 'LS', color: '#10B981' },
  { id: 'u-3', name: '王五', email: 'wangwu@example.com', avatar: 'WW', color: '#F59E0B' },
  { id: 'u-4', name: '赵六', email: 'zhaoliu@example.com', avatar: 'ZL', color: '#F43F5E' },
];

const node = (id: string, type: string, x: number, y: number, text: string, w = 140, h = 70, z = 1, styleOverrides = {}): DiagramNode => ({
  id, type, x, y, width: w, height: h, text, zIndex: z,
  style: { ...DNS, ...styleOverrides },
});

const edge = (id: string, source: string, target: string, label?: string, overrides = {}): DiagramEdge => ({
  id, source, target, label,
  style: { ...DES, ...overrides },
});

const FLOWCHART_NODES: DiagramNode[] = [
  node('n-f1', 'flow-start', 360, 40, '用户发起下单', 160, 60, 1, { fill: '#DCFCE7', stroke: '#059669' }),
  node('n-f2', 'flow-process', 350, 160, '校验库存充足', 180, 70, 2),
  node('n-f3', 'flow-decision', 350, 290, '库存是否充足?', 180, 100, 3, { fill: '#FEF3C7', stroke: '#D97706' }),
  node('n-f4', 'flow-process', 130, 460, '返回缺货提示', 160, 70, 4),
  node('n-f5', 'flow-process', 570, 460, '扣减库存生成订单', 180, 70, 4),
  node('n-f6', 'flow-process', 570, 590, '调用支付接口', 180, 70, 5),
  node('n-f7', 'flow-decision', 570, 720, '支付是否成功?', 180, 100, 6, { fill: '#FEF3C7', stroke: '#D97706' }),
  node('n-f8', 'flow-process', 350, 890, '回滚库存 关闭订单', 180, 70, 7),
  node('n-f9', 'flow-process', 790, 890, '通知商家发货', 180, 70, 7),
  node('n-f10', 'flow-start', 570, 1040, '流程结束', 160, 60, 8, { fill: '#FEE2E2', stroke: '#DC2626' }),
];

const FLOWCHART_EDGES: DiagramEdge[] = [
  edge('e-f1', 'n-f1', 'n-f2'),
  edge('e-f2', 'n-f2', 'n-f3'),
  edge('e-f3', 'n-f3', 'n-f4', '否', { stroke: '#DC2626' }),
  edge('e-f4', 'n-f3', 'n-f5', '是', { stroke: '#059669' }),
  edge('e-f5', 'n-f5', 'n-f6'),
  edge('e-f6', 'n-f6', 'n-f7'),
  edge('e-f7', 'n-f7', 'n-f8', '否', { stroke: '#DC2626' }),
  edge('e-f8', 'n-f7', 'n-f9', '是', { stroke: '#059669' }),
  edge('e-f9', 'n-f8', 'n-f10'),
  edge('e-f10', 'n-f9', 'n-f10'),
  edge('e-f11', 'n-f4', 'n-f10'),
];

const SWIMLANE_NODES: DiagramNode[] = [
  node('n-s0', 'swimlane-title', 20, 40, '用户', 80, 700, 0, { fill: '#EFF6FF', stroke: '#2563EB' }),
  node('n-s00', 'swimlane-title', 100, 40, 'APP', 80, 700, 0, { fill: '#F0FDFA', stroke: '#0D9488' }),
  node('n-s000', 'swimlane-title', 180, 40, '支付网关', 80, 700, 0, { fill: '#FEF3C7', stroke: '#D97706' }),
  node('n-s0000', 'swimlane-title', 260, 40, '订单服务', 80, 700, 0, { fill: '#FDF2F8', stroke: '#DB2777' }),
  node('n-s1', 'rounded-rect', 370, 60, '浏览商品', 120, 60, 1, { fill: '#EFF6FF' }),
  node('n-s2', 'rounded-rect', 370, 170, '加入购物车', 120, 60, 2, { fill: '#EFF6FF' }),
  node('n-s3', 'rounded-rect', 540, 280, '提交订单请求', 140, 60, 3, { fill: '#F0FDFA' }),
  node('n-s4', 'rounded-rect', 750, 380, '创建待支付订单', 140, 60, 4, { fill: '#FDF2F8' }),
  node('n-s5', 'rounded-rect', 540, 490, '跳转支付页面', 140, 60, 5, { fill: '#F0FDFA' }),
  node('n-s6', 'rounded-rect', 370, 600, '完成支付输入', 120, 60, 6, { fill: '#EFF6FF' }),
  node('n-s7', 'rounded-rect', 750, 600, '异步回调通知', 140, 60, 7, { fill: '#FEF3C7' }),
  node('n-s8', 'rounded-rect', 960, 600, '更新订单状态', 140, 60, 8, { fill: '#FDF2F8' }),
];

const SWIMLANE_EDGES: DiagramEdge[] = [
  edge('e-s1', 'n-s1', 'n-s2'),
  edge('e-s2', 'n-s2', 'n-s3'),
  edge('e-s3', 'n-s3', 'n-s4'),
  edge('e-s4', 'n-s4', 'n-s5'),
  edge('e-s5', 'n-s5', 'n-s6'),
  edge('e-s6', 'n-s6', 'n-s7'),
  edge('e-s7', 'n-s7', 'n-s8'),
];

const ER_NODES: DiagramNode[] = [
  node('n-e1', 'er-entity', 80, 120, '用户\nid PK\nusername\npassword\nemail\ncreated_at', 170, 200, 1, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 12 }),
  node('n-e2', 'er-entity', 340, 60, '订单\nid PK\nuser_id FK\ntotal_amount\nstatus\ncreated_at', 170, 190, 2, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 12 }),
  node('n-e3', 'er-entity', 340, 340, '商品\nid PK\nname\nprice\nstock\ncategory_id', 170, 190, 3, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 12 }),
  node('n-e4', 'er-entity', 600, 200, '订单项\nid PK\norder_id FK\nproduct_id FK\nquantity\nprice', 170, 200, 4, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 12 }),
  node('n-e5', 'er-entity', 860, 120, '分类\nid PK\nname\nparent_id\ndescription', 160, 180, 5, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 12 }),
  node('n-e6', 'er-relation', 250, 220, '1:N', 90, 80, 6, { fill: '#FEF3C7', stroke: '#D97706', fontSize: 13 }),
  node('n-e7', 'er-relation', 500, 360, 'M:N', 90, 80, 7, { fill: '#FEF3C7', stroke: '#D97706', fontSize: 13 }),
  node('n-e8', 'er-relation', 770, 280, 'N:1', 90, 80, 8, { fill: '#FEF3C7', stroke: '#D97706', fontSize: 13 }),
];

const ER_EDGES: DiagramEdge[] = [
  edge('e-e1', 'n-e1', 'n-e6'),
  edge('e-e2', 'n-e6', 'n-e2'),
  edge('e-e3', 'n-e2', 'n-e7'),
  edge('e-e4', 'n-e7', 'n-e3'),
  edge('e-e5', 'n-e7', 'n-e4'),
  edge('e-e6', 'n-e4', 'n-e8'),
  edge('e-e7', 'n-e8', 'n-e5'),
];

const SEQ_NODES: DiagramNode[] = [
  node('n-q1', 'seq-actor', 80, 40, '用户', 80, 90, 1, { fontSize: 13 }),
  node('n-q2', 'seq-actor', 280, 40, '客户端', 80, 90, 1, { fontSize: 13 }),
  node('n-q3', 'seq-actor', 480, 40, 'API网关', 80, 90, 1, { fontSize: 13 }),
  node('n-q4', 'seq-actor', 680, 40, '支付服务', 80, 90, 1, { fontSize: 13 }),
  node('n-q5', 'seq-actor', 880, 40, '第三方支付', 80, 90, 1, { fontSize: 13 }),
  node('n-q1l', 'seq-lifeline', 105, 170, '', 10, 450, 99),
  node('n-q2l', 'seq-lifeline', 305, 170, '', 10, 450, 99),
  node('n-q3l', 'seq-lifeline', 505, 170, '', 10, 450, 99),
  node('n-q4l', 'seq-lifeline', 705, 170, '', 10, 450, 99),
  node('n-q5l', 'seq-lifeline', 905, 170, '', 10, 450, 99),
  node('n-q2a', 'seq-activation', 295, 220, '', 20, 90, 100, { fill: '#DBEAFE' }),
  node('n-q3a', 'seq-activation', 495, 270, '', 20, 180, 100, { fill: '#DBEAFE' }),
  node('n-q4a', 'seq-activation', 695, 330, '', 20, 120, 100, { fill: '#DBEAFE' }),
];

const SEQ_EDGES: DiagramEdge[] = [
  edge('e-q1', 'n-q1', 'n-q2', '点击支付', { curve: 'straight' }),
  edge('e-q2', 'n-q2', 'n-q3', '创建支付单', { curve: 'straight' }),
  edge('e-q3', 'n-q3', 'n-q4', '请求签名', { curve: 'straight' }),
  edge('e-q4', 'n-q4', 'n-q5', '调起支付', { curve: 'straight' }),
  edge('e-q5', 'n-q5', 'n-q4', '支付结果', { curve: 'straight', dashed: true }),
  edge('e-q6', 'n-q4', 'n-q3', '同步回调', { curve: 'straight', dashed: true }),
  edge('e-q7', 'n-q3', 'n-q2', '更新状态', { curve: 'straight', dashed: true }),
  edge('e-q8', 'n-q5', 'n-q4', '异步通知', { curve: 'straight', dashed: true, stroke: '#059669' }),
];

const TOPO_NODES: DiagramNode[] = [
  node('n-t1', 'topo-cloud', 460, 40, 'Internet', 160, 100, 1, { fill: '#F0FDFA', stroke: '#0D9488', fontSize: 13 }),
  node('n-t2', 'topo-firewall', 480, 180, '防火墙', 120, 110, 2, { fill: '#FEF3C7', stroke: '#D97706', fontSize: 12 }),
  node('n-t3', 'topo-lb', 480, 330, 'Nginx LB', 120, 90, 3, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 12 }),
  node('n-t4', 'topo-server', 200, 470, 'APP Server\n192.168.1.11', 110, 140, 4, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 11 }),
  node('n-t5', 'topo-server', 400, 470, 'APP Server\n192.168.1.12', 110, 140, 4, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 11 }),
  node('n-t6', 'topo-server', 600, 470, 'APP Server\n192.168.1.13', 110, 140, 4, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 11 }),
  node('n-t7', 'topo-server', 800, 470, 'Auth Service', 110, 140, 4, { fill: '#FDF2F8', stroke: '#DB2777', fontSize: 11 }),
  node('n-t8', 'topo-database', 280, 660, 'MySQL主库', 130, 110, 5, { fill: '#FEF3C7', stroke: '#D97706', fontSize: 12 }),
  node('n-t9', 'topo-database', 480, 660, 'Redis集群', 130, 110, 5, { fill: '#FEE2E2', stroke: '#DC2626', fontSize: 12 }),
  node('n-t10', 'topo-database', 700, 660, 'ES搜索', 130, 110, 5, { fill: '#ECFDF5', stroke: '#059669', fontSize: 12 }),
  node('n-t11', 'topo-pc', 60, 80, '客户端A', 100, 80, 0, { fontSize: 11 }),
  node('n-t12', 'topo-pc', 230, 80, '客户端B', 100, 80, 0, { fontSize: 11 }),
];

const TOPO_EDGES: DiagramEdge[] = [
  edge('e-t1', 'n-t11', 'n-t1'),
  edge('e-t2', 'n-t12', 'n-t1'),
  edge('e-t3', 'n-t1', 'n-t2'),
  edge('e-t4', 'n-t2', 'n-t3'),
  edge('e-t5', 'n-t3', 'n-t4'),
  edge('e-t6', 'n-t3', 'n-t5'),
  edge('e-t7', 'n-t3', 'n-t6'),
  edge('e-t8', 'n-t3', 'n-t7'),
  edge('e-t9', 'n-t4', 'n-t8'),
  edge('e-t10', 'n-t5', 'n-t8'),
  edge('e-t11', 'n-t6', 'n-t8'),
  edge('e-t12', 'n-t4', 'n-t9'),
  edge('e-t13', 'n-t5', 'n-t9'),
  edge('e-t14', 'n-t6', 'n-t10'),
];

export const PROJECTS: Project[] = [
  {
    id: 'p-1',
    name: '电商平台重构',
    description: '新版电商系统架构设计与业务流程梳理，包含用户端、商户端、管理后台各模块。',
    coverThumbnail: '',
    createdAt: daysAgo(30),
    updatedAt: hoursAgo(2),
    ownerId: 'u-1',
    members: [
      { userId: 'u-1', role: 'admin', joinedAt: daysAgo(30) },
      { userId: 'u-2', role: 'editor', joinedAt: daysAgo(28) },
      { userId: 'u-3', role: 'editor', joinedAt: daysAgo(25) },
      { userId: 'u-4', role: 'viewer', joinedAt: daysAgo(20) },
    ],
  },
  {
    id: 'p-2',
    name: '微服务基础设施',
    description: '公司级微服务架构设计，含K8s集群、服务网格、监控告警等基础设施方案。',
    coverThumbnail: '',
    createdAt: daysAgo(60),
    updatedAt: hoursAgo(5),
    ownerId: 'u-2',
    members: [
      { userId: 'u-2', role: 'admin', joinedAt: daysAgo(60) },
      { userId: 'u-1', role: 'editor', joinedAt: daysAgo(58) },
      { userId: 'u-3', role: 'viewer', joinedAt: daysAgo(45) },
    ],
  },
];

export const DIAGRAMS: Diagram[] = [
  {
    id: 'd-1',
    projectId: 'p-1',
    name: '用户下单主流程',
    type: 'flowchart' as DiagramType,
    createdAt: daysAgo(20),
    updatedAt: hoursAgo(2),
    updatedBy: 'u-1',
    viewport: { ...DV, zoom: 0.85 },
    nodes: FLOWCHART_NODES,
    edges: FLOWCHART_EDGES,
    share: { scope: 'public_readonly', allowedMemberIds: [], updatedAt: hoursAgo(2), updatedBy: 'u-1' },
  },
  {
    id: 'd-2',
    projectId: 'p-1',
    name: '订单处理泳道图',
    type: 'swimlane' as DiagramType,
    createdAt: daysAgo(18),
    updatedAt: hoursAgo(6),
    updatedBy: 'u-2',
    viewport: { ...DV, zoom: 0.75 },
    nodes: SWIMLANE_NODES,
    edges: SWIMLANE_EDGES,
    share: { scope: 'team', allowedMemberIds: [], updatedAt: hoursAgo(6), updatedBy: 'u-2' },
  },
  {
    id: 'd-3',
    projectId: 'p-1',
    name: '电商数据模型ER图',
    type: 'er' as DiagramType,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(2),
    updatedBy: 'u-1',
    viewport: { ...DV, zoom: 0.88 },
    nodes: ER_NODES,
    edges: ER_EDGES,
    share: { scope: 'private', allowedMemberIds: [], updatedAt: daysAgo(2), updatedBy: 'u-1' },
  },
  {
    id: 'd-4',
    projectId: 'p-1',
    name: '支付回调时序图',
    type: 'sequence' as DiagramType,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
    updatedBy: 'u-3',
    viewport: { ...DV, zoom: 0.9 },
    nodes: SEQ_NODES,
    edges: SEQ_EDGES,
    share: { scope: 'team', allowedMemberIds: [], updatedAt: daysAgo(3), updatedBy: 'u-3' },
  },
  {
    id: 'd-5',
    projectId: 'p-2',
    name: 'K8s集群网络拓扑',
    type: 'topology' as DiagramType,
    createdAt: daysAgo(40),
    updatedAt: hoursAgo(5),
    updatedBy: 'u-2',
    viewport: { ...DV, zoom: 0.8 },
    nodes: TOPO_NODES,
    edges: TOPO_EDGES,
    share: { scope: 'specified', allowedMemberIds: ['u-1', 'u-2'], updatedAt: hoursAgo(5), updatedBy: 'u-2' },
  },
  {
    id: 'd-6',
    projectId: 'p-2',
    name: '服务网格调用链路',
    type: 'flowchart' as DiagramType,
    createdAt: daysAgo(35),
    updatedAt: daysAgo(7),
    updatedBy: 'u-1',
    viewport: { ...DV },
    nodes: [
      node('n-g1', 'flow-start', 300, 60, '入口流量', 160, 60, 1, { fill: '#DCFCE7', stroke: '#059669' }),
      node('n-g2', 'flow-process', 270, 180, 'Istio Ingress', 220, 70, 2, { fill: '#EFF6FF' }),
      node('n-g3', 'topo-lb', 330, 310, 'Envoy Sidecar', 100, 80, 3, { fill: '#FEF3C7', stroke: '#D97706', fontSize: 12 }),
      node('n-g4', 'flow-process', 100, 460, '服务A', 140, 70, 4, { fill: '#EFF6FF' }),
      node('n-g5', 'flow-process', 330, 460, '服务B', 140, 70, 4, { fill: '#EFF6FF' }),
      node('n-g6', 'flow-process', 560, 460, '服务C', 140, 70, 4, { fill: '#EFF6FF' }),
    ],
    edges: [
      edge('e-g1', 'n-g1', 'n-g2'),
      edge('e-g2', 'n-g2', 'n-g3'),
      edge('e-g3', 'n-g3', 'n-g4'),
      edge('e-g4', 'n-g3', 'n-g5'),
      edge('e-g5', 'n-g3', 'n-g6'),
    ],
    share: { scope: 'private', allowedMemberIds: [], updatedAt: daysAgo(7), updatedBy: 'u-1' },
  },
];

const snapFromDiagram = (d: Diagram) => ({ nodes: d.nodes, edges: d.edges, viewport: d.viewport });

export const VERSIONS: DiagramVersion[] = [
  { id: 'v-1', diagramId: 'd-1', version: 1, name: '初始版本', snapshot: snapFromDiagram(DIAGRAMS[0]), createdBy: 'u-1', createdAt: daysAgo(20), message: '创建用户下单流程初稿' },
  { id: 'v-2', diagramId: 'd-1', version: 2, snapshot: snapFromDiagram(DIAGRAMS[0]), createdBy: 'u-1', createdAt: daysAgo(15) },
  { id: 'v-3', diagramId: 'd-1', version: 3, name: '增加库存校验分支', snapshot: snapFromDiagram(DIAGRAMS[0]), createdBy: 'u-2', createdAt: daysAgo(8), message: '李四补充了库存不足的处理逻辑' },
  { id: 'v-4', diagramId: 'd-1', version: 4, snapshot: snapFromDiagram(DIAGRAMS[0]), createdBy: 'u-1', createdAt: daysAgo(3) },
  { id: 'v-5', diagramId: 'd-1', version: 5, snapshot: snapFromDiagram(DIAGRAMS[0]), createdBy: 'u-3', createdAt: hoursAgo(2) },
  { id: 'v-6', diagramId: 'd-5', version: 1, snapshot: snapFromDiagram(DIAGRAMS[4]), createdBy: 'u-2', createdAt: daysAgo(40) },
  { id: 'v-7', diagramId: 'd-5', version: 2, name: '新增ES搜索节点', snapshot: snapFromDiagram(DIAGRAMS[4]), createdBy: 'u-2', createdAt: daysAgo(20), message: '补充ES集群与APP Server的连接' },
];

export const COMMENTS: Comment[] = [
  {
    id: 'c-1', diagramId: 'd-1', nodeId: 'n-f3', authorId: 'u-2',
    content: '这里库存校验逻辑是否要考虑分布式锁？并发场景可能会超卖。',
    createdAt: hoursAgo(26), updatedAt: hoursAgo(24), resolved: false,
    replies: [
      { id: 'cr-1', authorId: 'u-1', content: '好问题！我在想是否先做Redis原子操作，后续再加Redisson。', createdAt: hoursAgo(24), mentions: ['u-2'] },
      { id: 'cr-2', authorId: 'u-3', content: '我觉得可以先加一层缓存判断，数据库层面再加乐观锁，更稳妥。', createdAt: hoursAgo(18), mentions: [] },
    ],
  },
  {
    id: 'c-2', diagramId: 'd-1', nodeId: 'n-f7', authorId: 'u-4',
    content: '支付失败是否需要重试机制？建议区分用户取消和真正失败两种情况。',
    createdAt: daysAgo(3), updatedAt: daysAgo(3), resolved: false, replies: [],
  },
  {
    id: 'c-3', diagramId: 'd-1', authorId: 'u-1',
    content: '这个流程整体逻辑清楚，下一步考虑把优惠券和积分抵扣也加进来。',
    createdAt: daysAgo(5), updatedAt: daysAgo(5), resolved: true, replies: [],
  },
  {
    id: 'c-4', diagramId: 'd-5', nodeId: 'n-t8', authorId: 'u-1',
    content: 'MySQL主库是否需要从库？读写分离场景下建议至少一主一从。',
    createdAt: daysAgo(8), updatedAt: daysAgo(7), resolved: true,
    replies: [
      { id: 'cr-3', authorId: 'u-2', content: '已经在部署方案里补充了两从库，这里拓扑图可以简化。', createdAt: daysAgo(7), mentions: ['u-1'] },
    ],
  },
];

export const TEMPLATES: DiagramTemplate[] = [
  {
    id: 'tpl-1', name: '登录注册流程', description: '用户登录注册的标准业务流程，含验证码、密码找回等分支',
    type: 'flowchart' as DiagramType, category: '业务流程', thumbnail: '',
    nodes: [
      node('t1', 'flow-start', 340, 40, '开始', 140, 55, 1, { fill: '#DCFCE7', stroke: '#059669' }),
      node('t2', 'flow-input', 320, 140, '输入手机号', 180, 70, 2),
      node('t3', 'flow-decision', 320, 260, '新用户?', 160, 90, 3, { fill: '#FEF3C7', stroke: '#D97706' }),
      node('t4', 'flow-process', 140, 400, '发送验证码', 160, 70, 4),
      node('t5', 'flow-process', 500, 400, '输入密码登录', 160, 70, 4),
      node('t6', 'flow-process', 320, 530, '验证成功', 180, 70, 5, { fill: '#DCFCE7' }),
    ],
    edges: [
      edge('et1', 't1', 't2'), edge('et2', 't2', 't3'),
      edge('et3', 't3', 't4', '是'), edge('et4', 't3', 't5', '否'),
      edge('et5', 't4', 't6'), edge('et6', 't5', 't6'),
    ],
  },
  {
    id: 'tpl-2', name: '微服务架构概览', description: '典型的微服务分层架构模板：网关-服务-数据',
    type: 'flowchart' as DiagramType, category: '系统架构', thumbnail: '',
    nodes: [
      node('m1', 'topo-cloud', 380, 30, '客户端/浏览器', 160, 90, 1, { fill: '#F0FDFA', stroke: '#0D9488' }),
      node('m2', 'topo-lb', 400, 160, 'API网关/CDN', 120, 80, 2, { fill: '#EFF6FF', stroke: '#2563EB' }),
      node('m3', 'topo-firewall', 400, 290, 'WAF/鉴权', 120, 90, 3, { fill: '#FEF3C7', stroke: '#D97706' }),
      node('m4', 'flow-process', 130, 430, '用户服务', 140, 70, 4, { fill: '#EFF6FF' }),
      node('m5', 'flow-process', 320, 430, '订单服务', 140, 70, 4, { fill: '#EFF6FF' }),
      node('m6', 'flow-process', 510, 430, '商品服务', 140, 70, 4, { fill: '#EFF6FF' }),
      node('m7', 'flow-process', 700, 430, '支付服务', 140, 70, 4, { fill: '#EFF6FF' }),
      node('m8', 'er-entity', 320, 570, 'MySQL / PostgreSQL', 160, 100, 5, { fill: '#FEF3C7', stroke: '#D97706', fontSize: 13 }),
      node('m9', 'topo-database', 540, 570, 'Redis缓存', 130, 100, 5, { fill: '#FEE2E2', stroke: '#DC2626', fontSize: 12 }),
    ],
    edges: [
      edge('em1', 'm1', 'm2'), edge('em2', 'm2', 'm3'),
      edge('em3', 'm3', 'm4'), edge('em4', 'm3', 'm5'),
      edge('em5', 'm3', 'm6'), edge('em6', 'm3', 'm7'),
      edge('em7', 'm4', 'm8'), edge('em8', 'm5', 'm8'),
      edge('em9', 'm6', 'm8'), edge('em10', 'm4', 'm9'),
      edge('em11', 'm5', 'm9'), edge('em12', 'm6', 'm9'),
    ],
  },
  {
    id: 'tpl-3', name: '标准数据库ER图', description: '用户-订单-商品三表经典关系，适合快速搭建电商数据模型',
    type: 'er' as DiagramType, category: '数据建模', thumbnail: '',
    nodes: [
      node('er1', 'er-entity', 60, 100, '用户\nid PK\nusername\nemail\nphone\ncreated_at', 160, 180, 1, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 11 }),
      node('er2', 'er-entity', 320, 60, '订单\nid PK\nuser_id FK\nstatus\ntotal\ncreated_at', 160, 170, 2, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 11 }),
      node('er3', 'er-entity', 320, 310, '商品\nid PK\nname\nprice\nstock\ncategory_id', 160, 170, 3, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 11 }),
      node('er4', 'er-entity', 580, 180, '订单项\nid PK\norder_id FK\nproduct_id FK\nquantity\nunit_price', 160, 190, 4, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 11 }),
      node('er5', 'er-relation', 225, 190, '1:N', 80, 70, 5, { fill: '#FEF3C7', stroke: '#D97706', fontSize: 12 }),
      node('er6', 'er-relation', 490, 320, '1:N', 80, 70, 6, { fill: '#FEF3C7', stroke: '#D97706', fontSize: 12 }),
    ],
    edges: [
      edge('eer1', 'er1', 'er5'), edge('eer2', 'er5', 'er2'),
      edge('eer3', 'er2', 'er4'), edge('eer4', 'er3', 'er6'),
      edge('eer5', 'er6', 'er4'),
    ],
  },
  {
    id: 'tpl-4', name: '三栏水平泳道', description: '用户-系统-后台三栏水平泳道，适合多角色业务流程',
    type: 'swimlane' as DiagramType, category: '业务流程', thumbnail: '',
    nodes: [
      node('sw0', 'swimlane-horizontal', 20, 40, '用户', 620, 120, 0, { fill: '#EFF6FF', stroke: '#2563EB', fontSize: 16 }),
      node('sw00', 'swimlane-horizontal', 20, 200, '应用系统', 620, 120, 0, { fill: '#F0FDFA', stroke: '#0D9488', fontSize: 16 }),
      node('sw000', 'swimlane-horizontal', 20, 360, '运营后台', 620, 120, 0, { fill: '#FEF3C7', stroke: '#D97706', fontSize: 16 }),
      node('sw1', 'rounded-rect', 100, 70, '发起申请', 120, 55, 1, { fill: '#DBEAFE' }),
      node('sw2', 'rounded-rect', 350, 230, '记录并推送', 120, 55, 2, { fill: '#D1FAE5' }),
      node('sw3', 'rounded-rect', 560, 390, '审核处理', 120, 55, 3, { fill: '#FDE68A' }),
    ],
    edges: [edge('esw1', 'sw1', 'sw2'), edge('esw2', 'sw2', 'sw3')],
  },
  {
    id: 'tpl-5', name: 'API请求时序', description: '客户端到后端服务的标准API调用时序图模板',
    type: 'sequence' as DiagramType, category: '接口设计', thumbnail: '',
    nodes: [
      node('sq1', 'seq-actor', 70, 40, 'Client', 80, 80, 1),
      node('sq2', 'seq-actor', 280, 40, 'Gateway', 80, 80, 1),
      node('sq3', 'seq-actor', 490, 40, 'Service', 80, 80, 1),
      node('sq4', 'seq-actor', 700, 40, 'Database', 80, 80, 1),
      node('sql1', 'seq-lifeline', 95, 160, '', 10, 400, 99),
      node('sql2', 'seq-lifeline', 305, 160, '', 10, 400, 99),
      node('sql3', 'seq-lifeline', 515, 160, '', 10, 400, 99),
      node('sql4', 'seq-lifeline', 725, 160, '', 10, 400, 99),
    ],
    edges: [
      edge('esq1', 'sq1', 'sq2', 'HTTP Request', { curve: 'straight' }),
      edge('esq2', 'sq2', 'sq3', '路由调用', { curve: 'straight' }),
      edge('esq3', 'sq3', 'sq4', 'SQL Query', { curve: 'straight' }),
      edge('esq4', 'sq4', 'sq3', 'Result', { curve: 'straight', dashed: true }),
      edge('esq5', 'sq3', 'sq2', 'Response', { curve: 'straight', dashed: true }),
      edge('esq6', 'sq2', 'sq1', 'HTTP 200 OK', { curve: 'straight', dashed: true }),
    ],
  },
  {
    id: 'tpl-6', name: '单机房网络拓扑', description: '标准单IDC三层架构：接入-核心-接入-服务器',
    type: 'topology' as DiagramType, category: '基础设施', thumbnail: '',
    nodes: [
      node('tp1', 'topo-cloud', 360, 30, 'ISP/Internet', 160, 85, 1, { fill: '#F0FDFA', stroke: '#0D9488' }),
      node('tp2', 'topo-router', 390, 150, '边界路由器', 110, 75, 2, { fill: '#FEF3C7', stroke: '#D97706' }),
      node('tp3', 'topo-firewall', 380, 260, '核心防火墙', 130, 90, 3, { fill: '#FEE2E2', stroke: '#DC2626' }),
      node('tp4', 'topo-switch', 390, 380, '核心交换机', 110, 60, 4, { fill: '#EFF6FF', stroke: '#2563EB' }),
      node('tp5', 'topo-switch', 120, 490, '接入交换机', 110, 60, 5, { fill: '#EFF6FF', stroke: '#2563EB' }),
      node('tp6', 'topo-switch', 400, 490, '接入交换机', 110, 60, 5, { fill: '#EFF6FF', stroke: '#2563EB' }),
      node('tp7', 'topo-switch', 680, 490, '接入交换机', 110, 60, 5, { fill: '#EFF6FF', stroke: '#2563EB' }),
    ],
    edges: [
      edge('etp1', 'tp1', 'tp2'), edge('etp2', 'tp2', 'tp3'),
      edge('etp3', 'tp3', 'tp4'), edge('etp4', 'tp4', 'tp5'),
      edge('etp5', 'tp4', 'tp6'), edge('etp6', 'tp4', 'tp7'),
    ],
  },
  {
    id: 'tpl-7', name: '审批工作流', description: '标准多级审批流程，含通过/驳回/转交等分支逻辑',
    type: 'flowchart' as DiagramType, category: '业务流程', thumbnail: '',
    nodes: [
      node('ap1', 'flow-start', 330, 40, '提交申请', 160, 55, 1, { fill: '#DCFCE7', stroke: '#059669' }),
      node('ap2', 'flow-process', 320, 140, '直属上级审批', 180, 70, 2),
      node('ap3', 'flow-decision', 320, 260, '通过?', 160, 90, 3, { fill: '#FEF3C7', stroke: '#D97706' }),
      node('ap4', 'flow-process', 110, 400, '驳回通知申请人', 180, 70, 4),
      node('ap5', 'flow-process', 540, 400, '财务审批', 160, 70, 4),
      node('ap6', 'flow-decision', 540, 530, '财务通过?', 160, 90, 5, { fill: '#FEF3C7', stroke: '#D97706' }),
      node('ap7', 'flow-start', 330, 680, '流程归档', 160, 55, 6, { fill: '#DBEAFE', stroke: '#2563EB' }),
    ],
    edges: [
      edge('eap1', 'ap1', 'ap2'), edge('eap2', 'ap2', 'ap3'),
      edge('eap3', 'ap3', 'ap4', '驳回'), edge('eap4', 'ap3', 'ap5', '通过'),
      edge('eap5', 'ap5', 'ap6'), edge('eap6', 'ap6', 'ap4', '驳回'),
      edge('eap7', 'ap6', 'ap7', '通过'), edge('eap8', 'ap4', 'ap7'),
    ],
  },
  {
    id: 'tpl-8', name: 'CI/CD流水线', description: '代码提交到生产发布的标准DevOps流程',
    type: 'flowchart' as DiagramType, category: 'DevOps', thumbnail: '',
    nodes: [
      node('ci1', 'flow-start', 300, 40, '代码推送 Git', 180, 60, 1, { fill: '#DCFCE7', stroke: '#059669' }),
      node('ci2', 'flow-process', 300, 150, '触发 CI Pipeline', 200, 70, 2, { fill: '#EFF6FF' }),
      node('ci3', 'flow-process', 300, 260, '静态检查 + 单测', 200, 70, 3, { fill: '#EFF6FF' }),
      node('ci4', 'flow-decision', 300, 370, '通过?', 160, 90, 4, { fill: '#FEF3C7', stroke: '#D97706' }),
      node('ci5', 'flow-process', 90, 520, '通知开发者修复', 180, 70, 5, { fill: '#FEE2E2' }),
      node('ci6', 'flow-process', 510, 520, '构建镜像 推送到仓库', 200, 70, 5, { fill: '#EFF6FF' }),
      node('ci7', 'flow-process', 510, 630, '部署到 Staging', 200, 70, 6, { fill: '#EFF6FF' }),
      node('ci8', 'flow-process', 510, 740, '集成测试', 200, 70, 7, { fill: '#EFF6FF' }),
      node('ci9', 'flow-start', 510, 870, '生产灰度发布', 200, 60, 8, { fill: '#FEF3C7', stroke: '#D97706' }),
    ],
    edges: [
      edge('eci1', 'ci1', 'ci2'), edge('eci2', 'ci2', 'ci3'),
      edge('eci3', 'ci3', 'ci4'), edge('eci4', 'ci4', 'ci5', '失败'),
      edge('eci5', 'ci4', 'ci6', '通过'), edge('eci6', 'ci6', 'ci7'),
      edge('eci7', 'ci7', 'ci8'), edge('eci8', 'ci8', 'ci9'),
    ],
  },
];
