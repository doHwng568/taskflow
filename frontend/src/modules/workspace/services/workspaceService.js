
const STORAGE_KEY = "taskflow_workspaces";

const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function readAll() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveAll(workspaces) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
}

const workspaceService = {
  getAll() {
    return readAll();
  },

  getById(id) {
    return readAll().find((workspace) => workspace.id === id) ?? null;
  },

  create({ name, description }) {
    const workspaces = readAll();

    const workspace = {
      id: createId(),
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };

    saveAll([workspace, ...workspaces]);
    return workspace;
  },

  update(id, { name, description }) {
    const workspaces = readAll();

    const updated = workspaces.map((workspace) =>
      workspace.id === id
        ? { ...workspace, name: name.trim(), description: description.trim() }
        : workspace
    );

    saveAll(updated);
    return updated.find((workspace) => workspace.id === id) ?? null;
  },

  delete(id) {
    saveAll(readAll().filter((workspace) => workspace.id !== id));
  },
};

export default workspaceService;
