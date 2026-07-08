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
} from "./nodes";
import {
  autoObjectPosition,
  OBJECT_DEFAULT_HEIGHT,
  OBJECT_DEFAULT_WIDTH,
  type FixturePositions,
  type XY,
} from "./canvasLayout";

const nodeTypes: NodeTypes = {
  detailCard: DetailCardNode,
  chatWindow: ChatWindowNode,
  deliverableObject: DeliverableObjectNode,
};

const DETAIL_SIZE = { width: 340, height: 300 };
const CHAT_SIZE = { width: 400, height: 520 };

const OBJECT_ID_PREFIX = "obj:";

interface CanvasWorkspaceProps {
  objects: DeliverableObject[];
  fixturePositions: FixturePositions;
  onFixtureMoved: (which: "detail" | "chat", pos: XY) => void;
  onObjectMoved: (objectId: string, pos: XY) => void;
  onObjectResized: (objectId: string, size: { width: number; height: number }) => void;
  onSelectionChange: (objectIds: string[]) => void;
}

function buildNodes(
  objects: DeliverableObject[],
  fixtures: FixturePositions
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
  return [detail, chat, ...objectNodes];
}

function CanvasWorkspaceInner({
  objects,
  fixturePositions,
  onFixtureMoved,
  onObjectMoved,
  onObjectResized,
  onSelectionChange,
}: CanvasWorkspaceProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

  // Rebuild only when the object set or fixture positions change (not during drag,
  // since object drags are persisted fire-and-forget without refetching).
  useEffect(() => {
    setNodes(buildNodes(objects, fixturePositions));
  }, [objects, fixturePositions, setNodes]);

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
      if (node.id === "detail") {
        onFixtureMoved("detail", pos);
      } else if (node.id === "chat") {
        onFixtureMoved("chat", pos);
      } else if (node.id.startsWith(OBJECT_ID_PREFIX)) {
        onObjectMoved(node.id.slice(OBJECT_ID_PREFIX.length), pos);
      }
    },
    [onFixtureMoved, onObjectMoved]
  );

  // Modifier-free toggle selection: a plain click adds/removes an object from the
  // reference set. We fully control selection (elementsSelectable={false}) so RF's
  // default "click replaces selection" behavior doesn't fight the toggle.
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!node.id.startsWith(OBJECT_ID_PREFIX)) return;
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

  // Report the selected object ids upward, but only when the set actually changes
  // (drag/resize also mutate `nodes`, and we don't want to churn on those).
  const reportedSelectionRef = useRef("");
  useEffect(() => {
    const ids = nodes
      .filter((n) => n.selected && n.id.startsWith(OBJECT_ID_PREFIX))
      .map((n) => n.id.slice(OBJECT_ID_PREFIX.length));
    const key = ids.join(",");
    if (key !== reportedSelectionRef.current) {
      reportedSelectionRef.current = key;
      onSelectionChange(ids);
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
