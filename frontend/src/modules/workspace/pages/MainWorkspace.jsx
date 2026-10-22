
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import workspaceService from "../services/workspaceService";

const emptyForm = {
  name: "",
  description: "",
};

function MainWorkspace() {
  const [workspaces, setWorkspaces] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setWorkspaces(workspaceService.getAll());
    } catch {
      setError("Không thể tải danh sách Workspace.");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredWorkspaces = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return workspaces.filter(
      (workspace) =>
        workspace.name.toLowerCase().includes(keyword) ||
        workspace.description.toLowerCase().includes(keyword)
    );
  }, [workspaces, search]);

  const openCreateModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (workspace) => {
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
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setError("Tên Workspace không được để trống.");
      return;
    }

    const duplicated = workspaces.some(
      (workspace) =>
        workspace.name.toLowerCase() === name.toLowerCase() &&
        workspace.id !== editingId
    );

    if (duplicated) {
      setError("Tên Workspace này đã tồn tại.");
      return;
    }

    try {
      if (editingId) {
        const updated = workspaceService.update(editingId, {
          name,
          description,
        });

        if (!updated) {
          setError("Không tìm thấy Workspace cần sửa.");
          return;
        }

        setWorkspaces((current) =>
          current.map((workspace) =>
            workspace.id === editingId ? updated : workspace
          )
        );
      } else {
        const created = workspaceService.create({ name, description });
        setWorkspaces((current) => [created, ...current]);
      }

      closeModal();
    } catch {
      setError("Không thể lưu Workspace. Vui lòng thử lại.");
    }
  };

  const handleDelete = (workspace) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa Workspace "${workspace.name}" không?`
    );

    if (!confirmed) return;

    try {
      workspaceService.delete(workspace.id);
      setWorkspaces((current) =>
        current.filter((item) => item.id !== workspace.id)
      );
    } catch {
      setError("Không thể xóa Workspace. Vui lòng thử lại.");
    }
  };

  return (
    <Container className="py-4 py-md-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-2">My Workspaces</h1>
          <p className="text-secondary mb-0">
            Quản lý các không gian làm việc của bạn trên TaskFlow.
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal}>
          + Create Workspace
        </Button>
      </div>

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={6} lg={5}>
          <Form.Control
            type="search"
            placeholder="Search workspaces..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search workspaces"
          />
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : filteredWorkspaces.length === 0 ? (
        <div className="text-center border rounded-4 p-5">
          <h5 className="fw-semibold">
            {search ? "No workspaces found" : "No workspaces yet"}
          </h5>
          <p className="text-secondary">
            {search
              ? "Thử tìm kiếm bằng từ khóa khác."
              : "Tạo Workspace đầu tiên để bắt đầu quản lý công việc."}
          </p>

          {!search && (
            <Button variant="primary" onClick={openCreateModal}>
              Create your first Workspace
            </Button>
          )}
        </div>
      ) : (
        <Row className="g-3">
          {filteredWorkspaces.map((workspace) => (
            <Col key={workspace.id} xs={12} md={6} xl={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="d-flex flex-column p-4">
                  <div
                    className="rounded-3 mb-3"
                    style={{
                      height: "8px",
                      background:
                        "linear-gradient(90deg, #635bff, #9b8cff)",
                    }}
                  />

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

                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      className="flex-grow-1"
                      onClick={() => openEditModal(workspace)}
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
              <Form.Label>
                Workspace name <span className="text-danger">*</span>
              </Form.Label>

              <Form.Control
                type="text"
                placeholder="Enter workspace name"
                value={form.name}
                maxLength={100}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                autoFocus
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Description</Form.Label>

              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe your workspace..."
                value={form.description}
                maxLength={500}
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
            <Button variant="light" onClick={closeModal}>
              Cancel
            </Button>

            <Button variant="primary" type="submit">
              {editingId ? "Save changes" : "Create Workspace"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default MainWorkspace;
