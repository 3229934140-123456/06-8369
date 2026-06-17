export type ShapeCategory = 'flowchart' | 'swimlane' | 'er' | 'sequence' | 'topology' | 'basic';

export interface ShapeDefinition {
  type: string;
  name: string;
  category: ShapeCategory;
  defaultWidth: number;
  defaultHeight: number;
  iconPath: string;
  keywords?: string[];
}

export const SHAPE_LIBRARY: ShapeDefinition[] = [
  { type: 'rectangle', name: '矩形', category: 'basic', defaultWidth: 140, defaultHeight: 80, iconPath: 'M30,20 L170,20 L170,80 L30,80 Z' },
  { type: 'rounded-rect', name: '圆角矩形', category: 'basic', defaultWidth: 140, defaultHeight: 80, iconPath: 'M50,20 L150,20 Q170,20 170,40 L170,60 Q170,80 150,80 L50,80 Q30,80 30,60 L30,40 Q30,20 50,20 Z' },
  { type: 'circle', name: '圆形', category: 'basic', defaultWidth: 100, defaultHeight: 100, iconPath: 'M100,25 A75,75 0 1,1 99.9,25 Z' },
  { type: 'diamond', name: '菱形', category: 'basic', defaultWidth: 120, defaultHeight: 120, iconPath: 'M100,15 L185,75 L100,135 L15,75 Z' },
  { type: 'parallelogram', name: '平行四边形', category: 'basic', defaultWidth: 140, defaultHeight: 80, iconPath: 'M60,20 L180,20 L140,80 L20,80 Z' },
  { type: 'hexagon', name: '六边形', category: 'basic', defaultWidth: 140, defaultHeight: 100, iconPath: 'M55,20 L145,20 L180,60 L145,100 L55,100 L20,60 Z' },
  { type: 'ellipse', name: '椭圆', category: 'basic', defaultWidth: 160, defaultHeight: 80, iconPath: 'M100,20 A80,40 0 1,0 100,80 A80,40 0 1,0 100,20 Z' },

  { type: 'flow-process', name: '处理', category: 'flowchart', defaultWidth: 140, defaultHeight: 70, iconPath: 'M30,20 L170,20 L170,80 L30,80 Z M30,50 L170,50' },
  { type: 'flow-decision', name: '判断', category: 'flowchart', defaultWidth: 140, defaultHeight: 90, iconPath: 'M100,10 L190,55 L100,100 L10,55 Z' },
  { type: 'flow-start', name: '开始/结束', category: 'flowchart', defaultWidth: 140, defaultHeight: 60, iconPath: 'M50,15 L150,15 Q180,15 180,45 L180,55 Q180,85 150,85 L50,85 Q20,85 20,55 L20,45 Q20,15 50,15 Z' },
  { type: 'flow-input', name: '输入/输出', category: 'flowchart', defaultWidth: 140, defaultHeight: 70, iconPath: 'M55,15 L180,15 L145,85 L20,85 Z' },
  { type: 'flow-subprocess', name: '子流程', category: 'flowchart', defaultWidth: 160, defaultHeight: 80, iconPath: 'M50,15 L40,15 L40,85 L50,85 M150,15 L160,15 L160,85 L150,85 M40,15 L160,15 L160,85 L40,85 Z' },
  { type: 'flow-document', name: '文档', category: 'flowchart', defaultWidth: 130, defaultHeight: 90, iconPath: 'M35,15 L165,15 L165,80 L140,95 L35,95 Z M165,80 L140,80 L140,95' },
  { type: 'flow-data', name: '数据库', category: 'flowchart', defaultWidth: 130, defaultHeight: 90, iconPath: 'M100,15 A65,20 0 1,0 99.9,15 M35,15 L35,75 M165,15 L165,75 M100,95 A65,20 0 1,0 99.9,95 M100,55 A65,20 0 1,0 99.9,55' },

  { type: 'swimlane-horizontal', name: '水平泳道', category: 'swimlane', defaultWidth: 600, defaultHeight: 120, iconPath: 'M20,20 L380,20 L380,100 L20,100 Z M120,20 L120,100 M20,60 L380,60' },
  { type: 'swimlane-vertical', name: '垂直泳道', category: 'swimlane', defaultWidth: 120, defaultHeight: 400, iconPath: 'M20,20 L100,20 L100,380 L20,380 Z M20,120 L100,120 M20,240 L100,240 M60,20 L60,380' },
  { type: 'swimlane-title', name: '泳道标题', category: 'swimlane', defaultWidth: 100, defaultHeight: 600, iconPath: 'M20,15 L80,15 L80,485 L20,485 Z M50,60 L50,485' },

  { type: 'er-entity', name: '实体', category: 'er', defaultWidth: 160, defaultHeight: 180, iconPath: 'M30,15 L170,15 L170,165 L30,165 Z M30,45 L170,45 M30,75 L170,75 M30,105 L170,105 M30,135 L170,135' },
  { type: 'er-attribute', name: '属性', category: 'er', defaultWidth: 100, defaultHeight: 70, iconPath: 'M100,15 A50,35 0 1,0 100,85 A50,35 0 1,0 100,15 Z' },
  { type: 'er-relation', name: '关系', category: 'er', defaultWidth: 110, defaultHeight: 110, iconPath: 'M100,10 L190,60 L100,110 L10,60 Z' },
  { type: 'er-key', name: '主键属性', category: 'er', defaultWidth: 110, defaultHeight: 70, iconPath: 'M100,15 A55,35 0 1,0 100,85 A55,35 0 1,0 100,15 Z M65,50 L135,50' },
  { type: 'er-multivalue', name: '多值属性', category: 'er', defaultWidth: 110, defaultHeight: 70, iconPath: 'M100,8 A45,28 0 1,0 100,78 A45,28 0 1,0 100,8 Z M100,22 A58,40 0 1,0 99.9,22' },

  { type: 'seq-actor', name: '参与者', category: 'sequence', defaultWidth: 80, defaultHeight: 80, iconPath: 'M100,15 A25,25 0 1,0 100,65 L55,110 L145,110 L100,65 M55,85 L145,85' },
  { type: 'seq-lifeline', name: '生命线', category: 'sequence', defaultWidth: 40, defaultHeight: 400, iconPath: 'M20,15 L20,385 M10,15 L30,15 L30,25 L10,25 Z' },
  { type: 'seq-activation', name: '激活框', category: 'sequence', defaultWidth: 20, defaultHeight: 120, iconPath: 'M10,15 L30,15 L30,125 L10,125 Z' },
  { type: 'seq-message-box', name: '消息框', category: 'sequence', defaultWidth: 160, defaultHeight: 50, iconPath: 'M20,15 L180,15 L180,55 L35,55 L20,70 L20,55 Z' },
  { type: 'seq-loop', name: '循环/组合片段', category: 'sequence', defaultWidth: 300, defaultHeight: 200, iconPath: 'M20,15 L300,15 L300,200 L20,200 Z M20,50 L90,50 L90,15' },

  { type: 'topo-router', name: '路由器', category: 'topology', defaultWidth: 100, defaultHeight: 80, iconPath: 'M50,15 L150,50 L50,85 Z M150,15 C175,32 175,67 150,85' },
  { type: 'topo-switch', name: '交换机', category: 'topology', defaultWidth: 100, defaultHeight: 60, iconPath: 'M25,15 L175,15 L175,75 L25,75 Z M45,45 L155,45 M45,30 L155,30 M45,60 L155,60' },
  { type: 'topo-server', name: '服务器', category: 'topology', defaultWidth: 90, defaultHeight: 120, iconPath: 'M25,15 L115,15 L115,115 L25,115 Z M25,40 L115,40 M25,65 L115,65 M25,90 L115,90 M40,27 L50,27 M40,52 L50,52 M40,77 L50,77 M40,102 L50,102' },
  { type: 'topo-pc', name: '终端/PC', category: 'topology', defaultWidth: 100, defaultHeight: 80, iconPath: 'M25,15 L125,15 L125,70 L25,70 Z M50,75 L100,75 L95,85 L55,85 Z M40,85 L110,85' },
  { type: 'topo-firewall', name: '防火墙', category: 'topology', defaultWidth: 100, defaultHeight: 100, iconPath: 'M25,15 L125,15 L125,90 L25,90 Z M50,15 L50,90 M75,15 L75,90 M100,15 L100,90 M25,40 L125,40 M25,65 L125,65' },
  { type: 'topo-cloud', name: '云/Internet', category: 'topology', defaultWidth: 140, defaultHeight: 90, iconPath: 'M50,30 A30,25 0 0,1 110,30 A25,20 0 0,1 130,55 A25,20 0 0,1 100,75 L50,75 A30,25 0 0,1 25,55 A25,20 0 0,1 50,30 Z' },
  { type: 'topo-database', name: '数据库集群', category: 'topology', defaultWidth: 110, defaultHeight: 100, iconPath: 'M100,15 A55,18 0 1,0 99.9,15 M45,15 L45,75 M155,15 L155,75 M100,93 A55,18 0 1,0 99.9,93 M100,55 A55,18 0 1,0 99.9,55 M80,35 A20,8 0 1,0 79.9,35 M80,75 A20,8 0 1,0 79.9,75' },
  { type: 'topo-lb', name: '负载均衡', category: 'topology', defaultWidth: 100, defaultHeight: 80, iconPath: 'M100,10 L180,45 L100,80 L20,45 Z M60,45 L140,45' },
];

export const getShapesByCategory = (category: ShapeCategory): ShapeDefinition[] => {
  return SHAPE_LIBRARY.filter(s => s.category === category);
};

export const getShapeDefinition = (type: string): ShapeDefinition | undefined => {
  return SHAPE_LIBRARY.find(s => s.type === type);
};

export const getCategories = (): { key: ShapeCategory; label: string }[] => [
  { key: 'basic', label: '基础形状' },
  { key: 'flowchart', label: '流程图' },
  { key: 'swimlane', label: '泳道图' },
  { key: 'er', label: 'ER图' },
  { key: 'sequence', label: '时序图' },
  { key: 'topology', label: '网络拓扑' },
];
