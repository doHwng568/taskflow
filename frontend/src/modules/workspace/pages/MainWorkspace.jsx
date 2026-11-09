
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import workspaceService from "../services/workspaceService";

const EMPTY_FORM = {
    name: "",
    description: "",
};

function MainWorkspace() {
    const navigate = useNavigate();

    // Lấy role từ localStorage hoặc JWT
const getCurrentUserRole = () => {
    const savedRole = localStorage.getItem("userRole");

    if (savedRole) {
        return savedRole.startsWith("ROLE_")
            ? savedRole.substring(5)
            : savedRole;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) return "";

    try {
        const decoded = jwtDecode(token);
        let role = decoded.role || "";

        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }

        if (role) {
            localStorage.setItem("userRole", role);
        }

        return role;
    } catch (error) {
        console.error("Cannot get user role:", error);
        return "";
    }
};

const userRole = getCurrentUserRole();
const isPM = userRole === "PM";

    const [workspaces, setWorkspaces] = useState([]);
    const [search, setSearch] = useState("");

    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);

    const [showModal, setShowModal] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =====================================
    // LOAD WORKSPACES
    // =====================================

    const loadWorkspaces = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await workspaceService.getAll();

            setWorkspaces(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Cannot load Workspaces."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadWorkspaces();
    }, [loadWorkspaces]);

    // =====================================
    // SEARCH
    // =====================================

    const filteredWorkspaces = useMemo(() => {
        return workspaces.filter((workspace) =>
            `${workspace.name || ""} ${workspace.description || ""}`
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [workspaces, search]);

    // =====================================
    // OPEN CREATE MODAL
    // =====================================

    const openCreate = () => {
        if (!isPM) return;

        setForm(EMPTY_FORM);
        setEditingId(null);
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // =====================================
    // OPEN EDIT MODAL
    // =====================================

    const openEdit = (workspace) => {
        if (!isPM) return;

        setForm({
            name: workspace.name || "",
            description: workspace.description || "",
        });

        setEditingId(workspace.id);
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // =====================================
    // CLOSE MODAL
    // =====================================

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setForm(EMPTY_FORM);
        setEditingId(null);
        setError("");
    };

    // =====================================
    // CREATE / UPDATE WORKSPACE
    // =====================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!isPM) {
            setError("You do not have permission to manage Workspaces.");
            return;
        }

        if (!form.name.trim()) {
            setError("Workspace name is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const data = {
                name: form.name.trim(),
                description: form.description.trim(),
            };

            if (editingId !== null) {
                await workspaceService.update(editingId, data);
                setSuccess("Workspace updated successfully.");
            } else {
                await workspaceService.create(data);
                setSuccess("Workspace created successfully.");
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

    // =====================================
    // DELETE WORKSPACE
    // =====================================

    const handleDelete = async (workspace) => {
        if (!isPM) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete Workspace "${workspace.name}"?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");
            setSaving(true);

            await workspaceService.delete(workspace.id);

            setSuccess("Workspace deleted successfully.");

            await loadWorkspaces();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete Workspace. Please check whether it contains Areas."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================
    // RENDER
    // =====================================

    return (
        <Container className="py-5">

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">

                <div>
                    <h2 className="fw-bold">
                        My Workspaces
                    </h2>

                    <p className="text-secondary mb-0">
                        Manage your workspaces in TaskFlow.
                    </p>

                    <small className="text-muted">
                        Your role: <strong>{userRole || "Unknown"}</strong>
                    </small>
                </div>

                {isPM && (
                    <Button onClick={openCreate}>
                        + Create Workspace
                    </Button>
                )}

            </div>

            {/* ERROR */}
            {error && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}

            {/* SUCCESS */}
            {success && (
                <Alert
                    variant="success"
                    dismissible
                    onClose={() => setSuccess("")}
                >
                    {success}
                </Alert>
            )}

            {/* SEARCH */}
            <Form.Control
                className="mb-4"
                style={{ maxWidth: 420 }}
                placeholder="Search Workspace..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {/* LOADING */}
            {loading ? (

                <div className="text-center py-5">
                    <Spinner animation="border" />

                    <p className="mt-2">
                        Loading Workspaces...
                    </p>
                </div>

            ) : filteredWorkspaces.length === 0 ? (

                /* EMPTY STATE */

                <div className="border rounded-4 text-center p-5">

                    <h5>
                        {search
                            ? "No matching Workspaces"
                            : "No Workspaces found"}
                    </h5>

                    <p className="text-secondary">
                        {search
                            ? "Try another search keyword."
                            : "You have not joined any Workspace yet."}
                    </p>

                    {!search && isPM && (
                        <Button onClick={openCreate}>
                            Create Workspace
                        </Button>
                    )}

                </div>

            ) : (

                /* WORKSPACE LIST */

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

                                    {/* WORKSPACE NAME + ROLE */}

                                    <div className="d-flex justify-content-between align-items-start gap-2">

                                        <Card.Title className="fw-bold">
                                            {workspace.name}
                                        </Card.Title>

                                        <span className="badge bg-primary">
                                            {workspace.currentUserRole || userRole}
                                        </span>

                                    </div>

                                    {/* DESCRIPTION */}

                                    <Card.Text className="text-secondary flex-grow-1">
                                        {workspace.description ||
                                            "No description provided."}
                                    </Card.Text>

                                    {/* WORKSPACE INFORMATION */}

                                    <div className="mb-3">

                                        <small className="text-secondary d-block">
                                            Owner: {workspace.ownerUsername || "-"}
                                        </small>

                                        <small className="text-secondary d-block">
                                            Members: {workspace.memberCount || 0}
                                        </small>

                                    </div>

                                    {/* ACTIONS */}

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

                                        {isPM && (
                                            <>
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={() =>
                                                        openEdit(workspace)
                                                    }
                                                >
                                                    Edit
                                                </Button>

                                                <Button
                                                    variant="outline-danger"
                                                    disabled={saving}
                                                    onClick={() =>
                                                        handleDelete(workspace)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </>
                                        )}

                                    </div>

                                </Card.Body>

                            </Card>

                        </Col>

                    ))}

                </Row>

            )}

            {/* CREATE / UPDATE MODAL */}

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
                                placeholder="Enter Workspace name"
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
                                placeholder="Enter Workspace description"
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
                            {saving ? (
                                <>
                                    <Spinner
                                        size="sm"
                                        className="me-2"
                                    />
                                    Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>

                    </Modal.Footer>

                </Form>

            </Modal>

        </Container>
    );
}

export default MainWorkspace;
