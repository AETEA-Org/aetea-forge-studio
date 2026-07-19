import type { Asset, AssetFolder } from "@/types/api";

/** Group assets by folder_id (or "__none__" when missing). */
export function buildAssetsByFolder(assets: Asset[]): Map<string, Asset[]> {
  const map = new Map<string, Asset[]>();
  for (const asset of assets) {
    const key = asset.folder_id ?? "__none__";
    const list = map.get(key) ?? [];
    list.push(asset);
    map.set(key, list);
  }
  return map;
}

/**
 * Top-level folders for the tree UI.
 * Prefer children of the system "Assets" root to avoid an Assets/Assets nest.
 */
export function getTopFolders(folders: AssetFolder[]): AssetFolder[] {
  const roots = folders.filter((f) => !f.parent_folder_id);
  const assetsRoot = roots.find((f) => f.name === "Assets");
  if (!assetsRoot) return roots;
  const children = folders.filter((f) => f.parent_folder_id === assetsRoot.id);
  return children.length > 0 ? children : roots;
}

export function childFoldersOf(
  folders: AssetFolder[],
  parentId: string
): AssetFolder[] {
  return folders.filter((f) => f.parent_folder_id === parentId);
}
