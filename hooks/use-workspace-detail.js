"use client";

import { useCallback, useEffect, useState } from "react";

export function useWorkspaceDetail(workspaceId) {
  const [workspace, setWorkspace] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load workspace");
      setWorkspace(json.workspace);
      setAssets(json.assets);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Fetch-on-mount: intentional, not a derived-state anti-pattern,
  // this is the one place that kicks off loading data from the server.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const uploadAsset = useCallback(
    async (file, description) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspaceId", workspaceId);
      formData.append("description", description ?? "");

      const res = await fetch("/api/assets/upload", { method: "POST", body: formData });
      const json = await res.json();
      // 201 = fully succeeded, 207 = asset saved but ingestion failed, both refresh the list
      if (res.status !== 201 && res.status !== 207) {
        throw new Error(json.error ?? "Upload failed");
      }
      await refresh();
      // 207: the file was saved but couldn't be indexed, surface why.
      if (json.error) throw new Error(json.error);
      return json;
    },
    [workspaceId, refresh]
  );

  const deleteAsset = useCallback(
    async (assetId) => {
      const res = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Delete failed");
      }
      await refresh();
    },
    [refresh]
  );

  const askQuestion = useCallback(
    async (question) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not get an answer");
      return json;
    },
    [workspaceId]
  );

  return { workspace, assets, loading, error, refresh, uploadAsset, deleteAsset, askQuestion };
}