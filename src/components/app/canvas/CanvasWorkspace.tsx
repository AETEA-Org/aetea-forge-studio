import { useCallback, useEffect, useRef } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  type Node,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DeliverableObject } from "@/types/api";
import {
  DetailCardNode,
  ChatWindowNode,
  DeliverableObjectNode,
  KeyVisualNode,
  type KeyVisualNodeData,
} from "./nodes";
import {
  autoObjectPosition,
  KEY_VISUAL_SIZE,
  OBJECT_DEFAULT_HEIGHT,
  OBJECT_DEFAULT_WIDTH,
  type FixturePositions,
  type XY,
} from "./canvasLayout";

const nodeTypes: NodeTypes = {
  detailCard: DetailCardNode,
  chatWindow: ChatWindowNode,
  deliverableObject: DeliverableObjectNode,
  keyVisual: KeyVisualNode,
};

const DETAIL_SIZE = { width: 340, height: 300 };
const CHAT_SIZE = { width: 400, height: 520 };

const OBJECT_ID_PREFIX = "obj:";
export const KEY_VISUAL_NODE_ID = "keyVisual";

export type KeyVisualProp = {
  assetId: string;
  downloadUrl: string;
} | null;

interface CanvasWorkspaceProps {
  objects: DeliverableObject[];
  keyVisual: KeyVisualProp;
  fixturePositions: FixturePositions;
  onFixtureMoved: (which: keyof FixturePositions, pos: XY) => void;
  onObjectMoved: (objectId: string, pos: XY) => void;
  onObjectResized: (objectId: string, size: { width: number; height: number }) => void;
  /** Selected asset ids (deliverable assets + key visual) for chat references. */
  onSelectionChange: (assetIds: string[]) => void;
}

function buildNodes(
  objects: DeliverableObject[],
  fixtures: FixturePositions,
  keyVisual: KeyVisualProp
): Node[] {
  const detail: Node = {
    id: "detail",
    type: "detailCard",
    position: fixtures.detail,
    style: DETAIL_SIZE,
    dragHandle: ".drag-handle",
    selectable: false,
    data: {},
  };
  const chat: Node = {
    id: "chat",
    type: "chatWindow",
    position: fixtures.chat,
    style: CHAT_SIZE,
    dragHandle: ".drag-handle",
    selectable: false,
    data: {},
  };
  const kvData: KeyVisualNodeData = {
    assetId: keyVisual?.assetId ?? null,
    downloadUrl: keyVisual?.downloadUrl ?? null,
  };
  const keyVisualNode: Node = {
    id: KEY_VISUAL_NODE_ID,
    type: "keyVisual",
    position: fixtures.keyVisual,
    style: KEY_VISUAL_SIZE,
    dragHandle: ".drag-handle",
    selectable: false,
    data: kvData,
  };
  const objectNodes: Node[] = objects.map((obj, index) => {
    const position =
      obj.canvas_x != null && obj.canvas_y != null
        ? { x: obj.canvas_x, y: obj.canvas_y }
        : autoObjectPosition(index);
    return {
      id: `${OBJECT_ID_PREFIX}${obj.id}`,
      type: "deliverableObject",
      position,
      style: {
        width: obj.canvas_width ?? OBJECT_DEFAULT_WIDTH,
        height: obj.canvas_height ?? OBJECT_DEFAULT_HEIGHT,
      },
      dragHandle: ".drag-handle",
      data: { object: obj },
    };
  });
  return [detail, chat, keyVisualNode, ...objectNodes];
}

function CanvasWorkspaceInner({
  objects,
  keyVisual,
  fixturePositions,
  onFixtureMoved,
  onObjectMoved,
  onObjectResized,
  onSelectionChange,
}: CanvasWorkspaceProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const keyVisualRef = useRef(keyVisual);
  keyVisualRef.current = keyVisual;

  // Rebuild only when the object set, fixtures, or key visual identity change.
  // Preserve selection across rebuilds.
  useEffect(() => {
    setNodes((prev) => {
      const selected = new Set(prev.filter((n) => n.selected).map((n) => n.id));
      return buildNodes(objects, fixturePositions, keyVisual).map((n) =>
        selected.has(n.id) ? { ...n, selected: true } : n
      );
    });
  }, [objects, fixturePositions, keyVisual, setNodes]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      for (const change of changes) {
        if (
          change.type === "dimensions" &&
          change.resizing === false &&
          change.dimensions &&
          change.id.startsWith(OBJECT_ID_PREFIX)
        ) {
          onObjectResized(change.id.slice(OBJECT_ID_PREFIX.length), {
            width: Math.round(change.dimensions.width),
            height: Math.round(change.dimensions.height),
          });
        }
      }
    },
    [onNodesChange, onObjectResized]
  );

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const pos = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
      if (node.id === "detail" || node.id === "chat" || node.id === KEY_VISUAL_NODE_ID) {
        onFixtureMoved(node.id === KEY_VISUAL_NODE_ID ? "keyVisual" : node.id, pos);
      } else if (node.id.startsWith(OBJECT_ID_PREFIX)) {
        onObjectMoved(node.id.slice(OBJECT_ID_PREFIX.length), pos);
      }
    },
    [onFixtureMoved, onObjectMoved]
  );

  // Modifier-free toggle selection: click adds/removes from the reference set.
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const isObject = node.id.startsWith(OBJECT_ID_PREFIX);
      const isKv = node.id === KEY_VISUAL_NODE_ID && Boolean(keyVisualRef.current?.assetId);
      if (!isObject && !isKv) return;
      setNodes((nds) =>
        nds.map((n) => (n.id === node.id ? { ...n, selected: !n.selected } : n))
      );
    },
    [setNodes]
  );

  const handlePaneClick = useCallback(() => {
    setNodes((nds) =>
      nds.some((n) => n.selected)
        ? nds.map((n) => (n.selected ? { ...n, selected: false } : n))
        : nds
    );
  }, [setNodes]);

  // Report selected asset ids upward (object.asset_id + key visual asset id).
  const reportedSelectionRef = useRef("");
  useEffect(() => {
    const assetIds: string[] = [];
    for (const n of nodes) {
      if (!n.selected) continue;
      if (n.id === KEY_VISUAL_NODE_ID) {
        const kv = keyVisualRef.current;
        if (kv?.assetId) assetIds.push(kv.assetId);
      } else if (n.id.startsWith(OBJECT_ID_PREFIX)) {
        const obj = (n.data as { object?: DeliverableObject }).object;
        if (obj?.asset_id) assetIds.push(obj.asset_id);
      }
    }
    const key = assetIds.join(",");
    if (key !== reportedSelectionRef.current) {
      reportedSelectionRef.current = key;
      onSelectionChange(assetIds);
    }
  }, [nodes, onSelectionChange]);

  return (
    <ReactFlow
      nodes={nodes}
      nodeTypes={nodeTypes}
      onNodesChange={handleNodesChange}
      onNodeDragStop={handleNodeDragStop}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      edges={[]}
      colorMode="dark"
      minZoom={0.2}
      maxZoom={2}
      defaultViewport={{ x: 24, y: 24, zoom: 0.85 }}
      proOptions={{ hideAttribution: true }}
      elementsSelectable={false}
      deleteKeyCode={null}
    >
      <Background gap={20} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export function CanvasWorkspace(props: CanvasWorkspaceProps) {
  return (
    <ReactFlowProvider>
      <CanvasWorkspaceInner {...props} />
    </ReactFlowProvider>
  );
}
