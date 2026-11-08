
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
    Spinner,
} from "react-bootstrap";

import { useNavigate } from "react-router-dom";
import workspaceService from "../services/workspaceService";

const EMPTY_FORM = {
    name: "",
    description: "",
};

function MainWorkspace() {
    const navigate = useNavigate();

    const [workspaces, setWorkspaces] = useState([]);
    const [search, setSearch] = useState("");

    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);

    const [showModal, setShowModal] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    // Load Workspace
    const loadWorkspaces = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await workspaceService.getAll();

            setWorkspaces(data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Cannot load Workspaces."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWorkspaces();
    }, []);

    // Search
    const filteredWorkspaces = workspaces.filter((workspace) =>
        `${workspace.name} ${workspace.description || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    // Open Create
    const openCreate = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setError("");
        setShowModal(true);
    };

    // Open Edit
    const openEdit = (workspace) => {
        setForm({
            name: workspace.name || "",
            description: workspace.description || "",
        });

        setEditingId(workspace.id);
        setError("");
        setShowModal(true);
    };

    // Close Modal
    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    // Create / Update
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.name.trim()) {
            setError("Workspace name is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const data = {
                name: form.name.trim(),
                description: form.description.trim(),
            };

            if (editingId !== null) {
                await workspaceService.update(editingId, data);
            } else {
                await workspaceService.create(data);
            }

            setShowModal(false);
            setForm(EMPTY_FORM);
            setEditingId(null);

            await loadWorkspaces();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to save Workspace."
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete
    const handleDelete = async (workspace) => {
        const confirmed = window.confirm(
            `Delete Workspace "${workspace.name}"?`
        );

        if (!confirmed) return;

        try {
            setError("");

            await workspaceService.delete(workspace.id);

            await loadWorkspaces();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete Workspace."
            );
        }
    };

    return (
        <Container className="py-5">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="fw-bold">
                        My Workspaces
                    </h2>

                    <p className="text-secondary">
                        Manage your workspaces in TaskFlow.
                    </p>
                </div>

                <Button onClick={openCreate}>
                    + Create Workspace
                </Button>

            </div>

            {/* Error */}
            {error && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}

            {/* Search */}
            <Form.Control
                className="mb-4"
                style={{ maxWidth: 420 }}
                placeholder="Search Workspace..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {/* Loading */}
            {loading ? (

                <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p className="mt-2">Loading Workspaces...</p>
                </div>

            ) : filteredWorkspaces.length === 0 ? (

                <div className="border rounded-4 text-center p-5">

                    <h5>No Workspaces found</h5>

                    <p className="text-secondary">
                        Create your first Workspace.
                    </p>

                    {!search && (
                        <Button onClick={openCreate}>
                            Create Workspace
                        </Button>
                    )}

                </div>

            ) : (

                <Row className="g-4">

                    {filteredWorkspaces.map((workspace) => (

                        <Col
                            key={workspace.id}
                            xs={12}
                            md={6}
                            xl={4}
                        >

                            <Card className="h-100 shadow-sm">

                                <Card.Body className="d-flex flex-column">

                                    <div className="d-flex justify-content-between">

                                        <Card.Title className="fw-bold">
                                            {workspace.name}
                                        </Card.Title>

                                        <span className="badge bg-primary">
                                            {workspace.currentUserRole}
                                        </span>

                                    </div>

                                    <Card.Text className="text-secondary flex-grow-1">
                                        {workspace.description ||
                                            "No description provided."}
                                    </Card.Text>

                                    <small className="text-secondary mb-3">
                                        Members: {workspace.memberCount || 0}
                                    </small>

                                    <div className="d-flex flex-wrap gap-2">

                                        <Button
                                            className="flex-grow-1"
                                            onClick={() =>
                                                navigate(
                                                    `/workspace/${workspace.id}`
                                                )
                                            }
                                        >
                                            Open
                                        </Button>

                                        {(workspace.currentUserRole === "OWNER" ||
                                            workspace.currentUserRole === "ADMIN") && (
                                            <Button
                                                variant="outline-primary"
                                                onClick={() => openEdit(workspace)}
                                            >
                                                Edit
                                            </Button>
                                        )}

                                        {workspace.currentUserRole === "OWNER" && (
                                            <Button
                                                variant="outline-danger"
                                                onClick={() => handleDelete(workspace)}
                                            >
                                                Delete
                                            </Button>
                                        )}

                                    </div>

                                </Card.Body>

                            </Card>

                        </Col>

                    ))}

                </Row>

            )}

            {/* Create / Update Modal */}
            <Modal
                show={showModal}
                onHide={closeModal}
                centered
            >

                <Form onSubmit={handleSubmit}>

                    <Modal.Header closeButton>
                        <Modal.Title>
                            {editingId !== null
                                ? "Update Workspace"
                                : "Create Workspace"}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>

                        {error && (
                            <Alert variant="danger">
                                {error}
                            </Alert>
                        )}

                        <Form.Group className="mb-3">

                            <Form.Label>
                                Workspace Name *
                            </Form.Label>

                            <Form.Control
                                required
                                maxLength={150}
                                value={form.name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        name: e.target.value,
                                    })
                                }
                            />

                        </Form.Group>

                        <Form.Group>

                            <Form.Label>
                                Description
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                            />

                        </Form.Group>

                    </Modal.Body>

                    <Modal.Footer>

                        <Button
                            variant="secondary"
                            onClick={closeModal}
                            disabled={saving}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save"}
                        </Button>

                    </Modal.Footer>

                </Form>

            </Modal>

        </Container>
    );
}

export default MainWorkspace;
