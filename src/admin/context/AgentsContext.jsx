import { createContext, useContext, useEffect, useState } from "react";
import * as agentsApi from "@/admin/api/agents";
import { removeStoredImages } from "@/admin/api/imageStorage";
import { useToast } from "@/admin/context/ToastContext";
import { runQueriesWithRetry } from "@/shared/lib/runQueriesWithRetry";

const AgentsContext = createContext(null);

export function AgentsProvider({ children }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const [{ data, error }] = await runQueriesWithRetry([agentsApi.fetchAgents]);
      if (!active) return;
      if (error) {
        console.error(error);
        showToast("Could not load agents.", "error");
      } else {
        setAgents(data.map(agentsApi.normalizeAgent));
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [showToast]);

  async function addAgent({ name, phone, avatar_url }) {
    const data = await agentsApi.insertAgent({ name, phone, avatar_url });
    const agent = agentsApi.normalizeAgent(data);
    setAgents((current) => [...current, agent]);
    return agent.id;
  }

  async function updateAgent(id, patch, expectedUpdatedAt) {
    const data = await agentsApi.updateAgent(id, patch, expectedUpdatedAt);
    const agent = agentsApi.normalizeAgent(data);
    setAgents((current) => current.map((existing) => (existing.id === id ? agent : existing)));
    return agent;
  }

  async function deleteAgent(id) {
    // Read the avatar's URL before the row is gone — afterwards there's no way
    // to know which Storage file was theirs.
    const avatarUrl = agents.find((agent) => agent.id === id)?.avatar_url;

    await agentsApi.deleteAgent(id);
    setAgents((current) => current.filter((agent) => agent.id !== id));

    // Deleting the row never touched Storage, so every deleted agent used to
    // leave their avatar behind. Not awaited, so a slow or failing Storage
    // call can't turn a successful delete into a reported failure — but if it
    // does fail the admin is told, since the file is then orphaned.
    if (avatarUrl) {
      removeStoredImages([avatarUrl]).catch((storageError) => {
        console.error("Failed to remove agent avatar from storage:", storageError);
        showToast("The agent was deleted, but their photo could not be removed from storage.", "error");
      });
    }
  }

  const value = { agents, loading, addAgent, updateAgent, deleteAgent };

  return <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>;
}

export function useAgents() {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error("useAgents must be used within an AgentsProvider");
  }
  return context;
}
