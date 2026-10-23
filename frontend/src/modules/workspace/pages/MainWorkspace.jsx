
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import workspaceService from "../services/workspaceService";

const EMPTY_FORM = { name: "", description: "" };

function MainWorkspace() {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const loadWorkspaces = () => {
    setWorkspaces(workspaceService.getAll());
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const filteredWorkspaces = workspaces.filter((workspace) =>
    `${workspace.name} ${workspace.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  const openEdit = (workspace) => {
    setForm({
      name: workspace.name,
      description: workspace.description,
    });
    setEditingId(workspace.id);
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setError("Workspace name is required.");
      return;
    }

    const duplicate = workspaces.some(
      (workspace) =>
        workspace.name.toLowerCase() === name.toLowerCase() &&
        workspace.id !== editingId
    );

    if (duplicate) {
      setError("A Workspace with this name already exists.");
      return;
    }

    try {
      if (editingId) {
        workspaceService.update(editingId, { name, description });
      } else {
        workspaceService.create({ name, description });
      }

      loadWorkspaces();
      closeModal();
    } catch {
      setError("Unable to save Workspace. Please try again.");
    }
  };

  const handleDelete = (workspace) => {
    const confirmed = window.confirm(
      `Delete Workspace "${workspace.name}"?`
    );

    if (!confirmed) return;

    try {
      workspaceService.delete(workspace.id);
      loadWorkspaces();
    } catch {
      setError("Unable to delete Workspace.");
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold">My Workspaces</h2>
          <p className="text-secondary mb-0">
            Manage your workspaces in TaskFlow.
          </p>
        </div>

        <Button onClick={openCreate}>+ Create Workspace</Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Form.Control
        className="mb-4"
        style={{ maxWidth: 420 }}
        placeholder="Search workspaces..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {filteredWorkspaces.length === 0 ? (
        <div className="border rounded-4 text-center p-5">
          <h5>{search ? "No matching workspaces" : "No workspaces yet"}</h5>
          <p className="text-secondary">
            {search
              ? "Try another search keyword."
              : "Create your first Workspace to get started."}
          </p>
          {!search && (
            <Button onClick={openCreate}>Create Workspace</Button>
          )}
        </div>
      ) : (
        <Row className="g-4">
          {filteredWorkspaces.map((workspace) => (
            <Col key={workspace.id} xs={12} md={6} xl={4}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="fw-bold">
                    {workspace.name}
                  </Card.Title>

                  <Card.Text className="text-secondary flex-grow-1">
                    {workspace.description || "No description provided."}
                  </Card.Text>

                  <small className="text-secondary mb-3">
                    Created{" "}
                    {new Date(workspace.createdAt).toLocaleDateString()}
                  </small>

                  <div className="d-flex flex-wrap gap-2">
                    <Button
                      className="flex-grow-1"
                      onClick={() =>
                        navigate(`/workspace/${workspace.id}`)
                      }
                    >
                      Open Workspace
                    </Button>

                    <Button
                      variant="outline-primary"
                      onClick={() => openEdit(workspace)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outline-danger"
                      onClick={() => handleDelete(workspace)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={closeModal} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingId ? "Update Workspace" : "Create Workspace"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Workspace name *</Form.Label>
              <Form.Control
                required
                maxLength={100}
                value={form.name}
                placeholder="Enter workspace name"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                maxLength={500}
                value={form.description}
                placeholder="Enter description"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? "Save changes" : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default MainWorkspace;
