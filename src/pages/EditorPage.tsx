import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDiagramStore } from '../store/useDiagramStore.js';
import { useUserStore } from '../store/useUserStore.js';
import { diagramApi, projectApi } from '../lib/api.js';
import { DiagramCanvas } from '../components/editor/DiagramCanvas.jsx';
import { ShapeLibrary } from '../components/editor/ShapeLibrary.jsx';
import { EditorToolbar } from '../components/editor/EditorToolbar.jsx';
import { RightPanel, type RightPanelTab } from '../components/editor/RightPanel.jsx';
import { Loader } from 'lucide-react';

export const EditorPage: React.FC = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  const navigate = useNavigate();
  const user = useUserStore(s => s.user);
  const diagram = useDiagramStore(s => s.diagram);
  const loadDiagram = useDiagramStore(s => s.loadDiagram);
  const reset = useDiagramStore(s => s.reset);
  const loading = useDiagramStore(s => s.loading);
  const [rightTab, setRightTab] = useState<RightPanelTab>('properties');
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!diagramId || !user) return;
    loadDiagram(diagramId);
    diagramApi.get(diagramId).then(d => setProjectId(d.projectId)).catch(() => {});
    return () => reset();
  }, [diagramId, user?.id]);

  if (loading || !diagram) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-graphite-50">
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin text-electric-500" size={36} />
          <span className="text-sm text-graphite-500">正在加载图表...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-graphite-50 overflow-hidden">
      <EditorToolbar
        rightTab={rightTab}
        onRightTabChange={setRightTab}
        onGoBack={() => projectId && navigate(`/projects/${projectId}`)}
        onGoHome={() => navigate('/dashboard')}
      />
      <div className="flex-1 flex min-h-0">
        <div className="w-72 shrink-0">
          <ShapeLibrary />
        </div>
        <div className="flex-1 relative min-w-0" data-editor-canvas-wrap>
          <DiagramCanvas diagramId={diagramId ?? ''} />
        </div>
        <RightPanel tab={rightTab} />
      </div>
    </div>
  );
};

export default EditorPage;
