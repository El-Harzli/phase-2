import { useState } from "react";
import { IoPencilOutline, IoTrashOutline, IoPeopleOutline, IoStar, IoCallOutline } from "react-icons/io5";
import AgentForm from "@/admin/components/AgentForm";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import ContentSpinner from "@/admin/components/ContentSpinner";
import EmptyState from "@/admin/components/EmptyState";
import IconButton from "@/admin/components/IconButton";
import Modal from "@/admin/components/Modal";
import PageHeader from "@/admin/components/PageHeader";
import { useAgents } from "@/admin/context/AgentsContext";
import { useProperties } from "@/admin/context/PropertiesContext";
import { useToast } from "@/admin/context/ToastContext";
import { handleSaveError } from "@/admin/lib/handleSaveError";
import { syncImages } from "@/admin/lib/syncImages";

export default function AgentsPage() {
  const { agents, loading, addAgent, updateAgent, deleteAgent } = useAgents();
  const { getPropertyCountForAgent } = useProperties();
  const { showToast } = useToast();

  const [formState, setFormState] = useState(null); // null | { mode: 'create' } | { mode: 'edit', agent }
  const [pendingDelete, setPendingDelete] = useState(null);

  const assignedCount = pendingDelete ? getPropertyCountForAgent(pendingDelete?.id) : 0;

  function openCreate() {
    setFormState({ mode: "create" });
  }

  function openEdit(agent) {
    setFormState({ mode: "edit", agent });
  }

  function closeForm() {
    setFormState(null);
  }

  async function handleSubmit({ name, phone, avatar_url, avatarFile }) {
    try {
      // Same safe sequence as property and neighborhood photos (see
      // syncImages): a new avatar is compressed and uploaded before the
      // database write and removed again if that write fails, and a replaced
      // or removed avatar's old file is deleted only after the write
      // succeeds. Avatars get no resized copies — they only ever render as
      // small circles, so extra files would save almost nothing (see the
      // per-bucket table in shared/uploadFile.js).
      const previousAvatarUrl = formState?.mode === "edit" ? formState?.agent?.avatar_url : null;
      const images = avatarFile ? [{ file: avatarFile }] : avatar_url ? [{ url: avatar_url }] : [];

      const { cleanupFailed } = await syncImages({
        bucket: "agent-avatars",
        images,
        previousUrls: previousAvatarUrl ? [previousAvatarUrl] : [],
        commit: async (finalImages) => {
          const finalAvatarUrl = finalImages[0]?.url ?? "";

          if (formState?.mode === "create") {
            await addAgent({ name, phone, avatar_url: finalAvatarUrl || null });
          } else {
            await updateAgent(
              formState?.agent?.id,
              { name, phone, avatar_url: finalAvatarUrl || null },
              formState?.agent?.updated_at,
            );
          }
        },
      });

      const message = formState?.mode === "create" ? "Agent added." : "Agent updated.";
      showToast(cleanupFailed ? `${message} The replaced photo file could not be deleted from storage.` : message);
      closeForm();
    } catch (error) {
      handleSaveError(error, { showToast, closeForm, fallbackMessage: "Something went wrong saving this agent." });
    }
  }

  async function handleDelete() {
    if (assignedCount > 0) return;
    try {
      await deleteAgent(pendingDelete?.id);
      showToast("Agent deleted.");
      setPendingDelete(null);
    } catch (error) {
      console.error(error);
      showToast("Could not delete this agent.", "error");
    }
  }

  if (loading) {
    return <ContentSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="The team shown on listings and assignable to properties."
        actionLabel="Add agent"
        onAction={openCreate}
      />

      {agents.length === 0 ? (
        <EmptyState
          icon={IoPeopleOutline}
          title="No agents yet"
          description="Add an agent to start assigning them to listings."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-[12px] bg-accent-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
            >
              Add agent
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const listingCount = getPropertyCountForAgent(agent.id);

            return (
              <div
                key={agent.id}
                className="rounded-[16px] border border-accent-500/10 bg-white p-5 transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary-600">
                      {agent.avatar_url ? (
                        <img src={agent.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-trenary">
                          <IoPeopleOutline size={18} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-main">{agent.name}</h3>
                      <p className="flex items-center gap-1 truncate text-xs text-trenary">
                        <IoCallOutline size={12} className="shrink-0" />
                        {agent.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <IconButton label={`Edit ${agent.name}`} onClick={() => openEdit(agent)}>
                      <IoPencilOutline size={18} />
                    </IconButton>
                    <IconButton label={`Delete ${agent.name}`} onClick={() => setPendingDelete(agent)}>
                      <IoTrashOutline size={18} />
                    </IconButton>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="flex items-center gap-1 rounded-full bg-gold-500/20 px-3 py-1 text-xs font-medium text-main">
                    <IoStar size={12} />
                    {agent.rating.toFixed(1)} · {agent.reviews_count} reviews
                  </span>
                  <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-secondary">
                    {listingCount} listing{listingCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={formState !== null}
        onClose={closeForm}
        title={formState?.mode === "edit" ? "Edit agent" : "Add agent"}
      >
        {formState && (
          <AgentForm
            key={formState.mode === "edit" ? formState.agent.id : "create"}
            initialAgent={formState.mode === "edit" ? formState.agent : null}
            onCancel={closeForm}
            onSubmit={handleSubmit}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={assignedCount > 0 ? `Can't delete "${pendingDelete?.name}"` : `Delete "${pendingDelete?.name}"?`}
        description={
          assignedCount > 0
            ? `${assignedCount} listing${assignedCount === 1 ? " is" : "s are"} still assigned to this agent. Reassign ${assignedCount === 1 ? "it" : "them"} to someone else from the Properties page, then come back to delete this agent.`
            : "This removes the agent. This can't be undone."
        }
        confirmLabel="Delete"
        blocked={assignedCount > 0}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
