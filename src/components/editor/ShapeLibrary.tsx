import React, { useState } from 'react';
import { getCategories, SHAPE_LIBRARY, type ShapeCategory } from '@shared/shape-types.js';
import { ChevronDown, Search, Grid3X3, Blocks, GitBranch, Database, Activity, Network, Layers } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const ICONS: Record<ShapeCategory, any> = {
  basic: Grid3X3,
  flowchart: Blocks,
  swimlane: GitBranch,
  er: Database,
  sequence: Activity,
  topology: Network,
};

export const ShapeLibrary: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ShapeCategory>('basic');
  const [query, setQuery] = useState('');
  const cats = getCategories();

  const items = SHAPE_LIBRARY.filter(s => s.category === activeCategory)
    .filter(s => !query || s.name.includes(query) || (s.keywords ?? []).some(k => k.includes(query)));

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-graphite-200">
      <div className="px-4 py-3 border-b border-graphite-200">
        <h2 className="font-display font-semibold text-graphite-800 text-sm flex items-center gap-2">
          <Layers size={16} className="text-electric-500" />
          形状库
        </h2>
      </div>

      <div className="px-3 py-2 border-b border-graphite-100">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-graphite-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索形状..."
            className="input pl-8 py-1.5 text-xs"
          />
        </div>
      </div>

      <div className="flex flex-col overflow-hidden flex-1">
        <div className="px-2 py-2 space-y-1 border-b border-graphite-100">
          {cats.map(({ key, label }) => {
            const Icon = ICONS[key];
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                  activeCategory === key
                    ? 'bg-electric-50 text-electric-600 shadow-sm'
                    : 'text-graphite-600 hover:bg-graphite-50 hover:text-graphite-900'
                )}
              >
                <Icon size={16} />
                <span>{label}</span>
                <span className="ml-auto text-xs text-graphite-400">
                  {SHAPE_LIBRARY.filter(s => s.category === key).length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar p-3">
          <div className="grid grid-cols-2 gap-2">
            {items.map(shape => (
              <div
                key={shape.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-flowsync-shape', shape.type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="shape-item group flex-col h-[84px]"
                title={shape.name}
              >
                <svg width="100%" height="52" viewBox="0 0 200 100" className="flex-shrink-0">
                  <path
                    d={shape.iconPath}
                    fill="white"
                    stroke="#475569"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    className="group-hover:stroke-electric-500 transition-colors"
                  />
                </svg>
                <span className="text-[11px] mt-1 text-graphite-600 font-medium truncate w-full text-center">
                  {shape.name}
                </span>
              </div>
            ))}
          </div>
          {items.length === 0 && (
            <div className="text-center py-12 text-graphite-400 text-sm">未找到匹配的形状</div>
          )}
        </div>
      </div>
    </div>
  );
};
