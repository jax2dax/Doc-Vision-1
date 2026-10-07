"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const WorkspacesContext = createContext(null);

export function WorkspacesProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load workspaces");
      setWorkspaces(json.workspaces);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch-on-mount: intentional, not a derived-state anti-pattern,
  // this loads the workspace list once when the provider mounts.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const createWorkspace = useCallback(
    async ({ name, description }) => {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create workspace");
      await refresh();
      return json.workspace;
    },
    [refresh]
  );

  return (
    <WorkspacesContext.Provider value={{ workspaces, loading, error, refresh, createWorkspace }}>
      {children}
    </WorkspacesContext.Provider>
  );
}

export function useWorkspaces() {
  const ctx = useContext(WorkspacesContext);
  if (!ctx) throw new Error("useWorkspaces must be used within a WorkspacesProvider");
  return ctx;
}