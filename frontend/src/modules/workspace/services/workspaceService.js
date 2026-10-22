
const STORAGE_KEY = "taskflow_workspaces";

const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const readWorkspaces = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveWorkspaces = (workspaces) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
};

const workspaceService = {
  getAll() {
    return readWorkspaces();
  },

  create({ name, description }) {
    const workspaces = readWorkspaces();

    const workspace = {
      id: createId(),
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };

    saveWorkspaces([workspace, ...workspaces]);
    return workspace;
  },

  update(id, { name, description }) {
    const workspaces = readWorkspaces();

    const updated = workspaces.map((workspace) =>
      workspace.id === id
        ? {
            ...workspace,
            name: name.trim(),
            description: description.trim(),
          }
        : workspace
    );

    saveWorkspaces(updated);
    return updated.find((workspace) => workspace.id === id) ?? null;
  },

  delete(id) {
    const workspaces = readWorkspaces();
    const updated = workspaces.filter((workspace) => workspace.id !== id);

    saveWorkspaces(updated);
  },
};

export default workspaceService;
