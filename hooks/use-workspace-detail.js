"use client";

import { useCallback, useEffect, useState } from "react";

export function useWorkspaceDetail(workspaceId) {
  const [workspace, setWorkspace] = useState(null);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [members, setMembers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [equipped, setEquipped] = useState([]);
  const [dates, setDates] = useState([]);
  const [datesError, setDatesError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load workspace");
      setWorkspace(json.workspace);
      setRole(json.role);
      setUserId(json.userId);
      setAssets(json.assets);
      setEquipped(json.equippedIntellects ?? []);
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

  const refreshDates = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/deadlines`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load due dates");
      setDates(json.dates);
      setDatesError(null);
    } catch (err) {
      setDatesError(err.message);
    }
  }, [workspaceId]);

  // Fetch-on-mount, same as the workspace itself.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshDates();
  }, [refreshDates]);

  const rescanDates = useCallback(
    async (assetId) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/deadlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetId ? { assetId } : {}),
      });
      const json = await res.json();
      await refreshDates();
      if (!res.ok || json.failed?.length) {
        throw new Error(json.failed?.[0]?.error ?? json.error ?? "Rescan failed");
      }
      return json;
    },
    [workspaceId, refreshDates]
  );

  // The catalog of available intellects is static per deploy: load once.
  useEffect(() => {
    fetch("/api/intellects")
      .then((r) => r.json())
      .then((j) => setCatalog(j.intellects ?? []))
      .catch(() => {});
  }, []);

  const updateEquipped = useCallback(
    async (keys) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/intellects`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipped: keys }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not update intellects");
      setEquipped(json.equipped);
      // Un-equipping a type can leave files pointing at it; reload so the list is truthful.
      await refresh();
    },
    [workspaceId, refresh]
  );

  const setAssetType = useCallback(
    async (assetId, intellectKey) => {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intellectKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not change document type");
      setAssets((list) => list.map((a) => (a.id === assetId ? { ...a, intellect_key: intellectKey } : a)));
      await refreshDates();
    },
    [refreshDates]
  );

  const uploadAsset = useCallback(
    async (file, description, intellectKey) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspaceId", workspaceId);
      formData.append("description", description ?? "");
      if (intellectKey) formData.append("intellectKey", intellectKey);

      const res = await fetch("/api/assets/upload", { method: "POST", body: formData });
      const json = await res.json();
      // 201 = fully succeeded, 207 = asset saved but ingestion failed, both refresh the list
      if (res.status !== 201 && res.status !== 207) {
        throw new Error(json.error ?? "Upload failed");
      }
      await Promise.all([refresh(), refreshDates()]);
      // 207: the file was saved but couldn't be indexed, surface why.
      if (json.error) throw new Error(json.error);
      return json;
    },
    [workspaceId, refresh, refreshDates]
  );

  const refreshMembers = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/members`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Could not load members");
    setMembers(json.members);
  }, [workspaceId]);

  // Fetch-on-mount, same as the workspace itself.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshMembers().catch(() => {});
  }, [refreshMembers]);

  const addMember = useCallback(
    async (email) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not add that person");
      await refreshMembers();
    },
    [workspaceId, refreshMembers]
  );

  const removeMember = useCallback(
    async (memberId) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not remove that person");
      await refreshMembers();
    },
    [workspaceId, refreshMembers]
  );

  const [google, setGoogle] = useState({ configured: false, email: null });
  useEffect(() => {
    fetch("/api/google-sheets")
      .then((r) => r.json())
      .then(setGoogle)
      .catch(() => {});
  }, []);

  const linkGoogleSheet = useCallback(
    async ({ url, description, intellectKey }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/google-sheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, description, intellectKey }),
      });
      const json = await res.json();
      await Promise.all([refresh(), refreshDates()]);
      if (res.status !== 201 && res.status !== 207) throw new Error(json.error ?? "Could not link the sheet");
      if (json.error) throw new Error(json.error);
      return json;
    },
    [workspaceId, refresh, refreshDates]
  );

  const syncAsset = useCallback(
    async (assetId, force = false) => {
      const res = await fetch(`/api/assets/${assetId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const json = await res.json();
      await Promise.all([refresh(), refreshDates()]);
      if (!res.ok) throw new Error(json.error ?? "Sync failed");
      return json;
    },
    [refresh, refreshDates]
  );

  const deleteAsset = useCallback(
    async (assetId) => {
      const res = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Delete failed");
      }
      await Promise.all([refresh(), refreshDates()]);
    },
    [refresh, refreshDates]
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

  return {
    workspace,
    assets,
    catalog,
    equipped,
    loading,
    error,
    refresh,
    uploadAsset,
    deleteAsset,
    askQuestion,
    dates,
    datesError,
    rescanDates,
    updateEquipped,
    setAssetType,
    google,
    linkGoogleSheet,
    syncAsset,
    role,
    userId,
    members,
    addMember,
    removeMember,
  };
}