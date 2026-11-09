import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Modal,
    Row,
    Spinner,
    Table,
} from "react-bootstrap";

import workspaceService from "../services/workspaceService";

function WorkspaceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
    });

    const [memberEmail, setMemberEmail] = useState("");

    const userRole = localStorage.getItem("userRole");
    const isPM = userRole === "PM";

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const workspaceData = await workspaceService.getById(id);
            const memberData = await workspaceService.getMembers(id);

            setWorkspace(workspaceData);
            setMembers(Array.isArray(memberData) ? memberData : []);

            setEditForm({
                name: workspaceData.name || "",
                description: workspaceData.description || "",
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load workspace."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    // UPDATE WORKSPACE
    const handleUpdateWorkspace = async (event) => {
        event.preventDefault();
        clearMessages();

        if (!editForm.name.trim()) {
            setError("Workspace name is required.");
            return;
        }

        try {
            setSaving(true);

            await workspaceService.update(id, {
                name: editForm.name.trim(),
                description: editForm.description.trim(),
            });

            setShowEditModal(false);
            setSuccess("Workspace updated successfully.");

            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update workspace."
            );
        } finally {
            setSaving(false);
        }
    };

    // DELETE WORKSPACE
    const handleDeleteWorkspace = async () => {
        clearMessages();

        try {
            setSaving(true);

            await workspaceService.delete(id);

            navigate("/workspace", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete workspace. It may still contain Areas."
            );
            setShowDeleteModal(false);
        } finally {
            setSaving(false);
        }
    };

    // ADD MEMBER
    const handleAddMember = async (event) => {
        event.preventDefault();
        clearMessages();

        if (!memberEmail.trim()) {
            setError("Email is required.");
            return;
        }

        try {
            setSaving(true);

            await workspaceService.addMember(
                id,
                memberEmail.trim()
            );

            setMemberEmail("");
            setShowAddModal(false);
            setSuccess("Member added successfully.");

            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to add member. Check whether this email is registered."
            );
        } finally {
            setSaving(false);
        }
    };

    // REMOVE MEMBER
    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Remove this member from Workspace?")) {
            return;
        }

        clearMessages();

        try {
            setSaving(true);

            await workspaceService.removeMember(id, userId);

            setSuccess("Member removed successfully.");

            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to remove member."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <p className="mt-3">Loading workspace...</p>
            </Container>
        );
    }

    if (!workspace) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    {error || "Workspace not found."}
                </Alert>

                <Button onClick={() => navigate("/workspace")}>
                    Back to Workspaces
                </Button>
            </Container>
        );
    }

    return (
        <Container className="py-4">

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <Button
                        variant="outline-secondary"
                        className="mb-3"
                        onClick={() => navigate("/workspace")}
                    >
                        ← Back to Workspaces
                    </Button>

                    <h2 className="fw-bold">{workspace.name}</h2>

                    <p className="text-muted">
                        {workspace.description || "No description"}
                    </p>
                </div>

                <div className="d-flex gap-2 flex-wrap">
                    <Button
                        variant="primary"
                        onClick={() => navigate(`/board/${id}`)}
                    >
                        Open Board
                    </Button>

                    {isPM && (
                        <>
                            <Button
                                variant="outline-primary"
                                onClick={() => {
                                    clearMessages();
                                    setShowEditModal(true);
                                }}
                            >
                                Edit Workspace
                            </Button>

                            <Button
                                variant="outline-danger"
                                onClick={() => {
                                    clearMessages();
                                    setShowDeleteModal(true);
                                }}
                            >
                                Delete Workspace
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* ALERTS */}
            {error && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}

            {success && (
                <Alert
                    variant="success"
                    dismissible
                    onClose={() => setSuccess("")}
                >
                    {success}
                </Alert>
            )}

            {/* WORKSPACE INFORMATION */}
            <Card className="mb-4">
                <Card.Body>
                    <h5>Workspace Information</h5>

                    <Row className="mt-3">
                        <Col md={4}>
                            <p className="text-muted mb-1">Workspace ID</p>
                            <strong>{workspace.id}</strong>
                        </Col>

                        <Col md={4}>
                            <p className="text-muted mb-1">Owner</p>
                            <strong>{workspace.ownerUsername || "-"}</strong>
                        </Col>

                        <Col md={4}>
                            <p className="text-muted mb-1">Your User Role</p>
                            <Badge bg="primary">
                                {workspace.currentUserRole || userRole || "-"}
                            </Badge>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* MEMBERS */}
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-0">Workspace Members</h5>
                        <small className="text-muted">
                            {members.length} member(s)
                        </small>
                    </div>

                    {isPM && (
                        <Button
                            onClick={() => {
                                clearMessages();
                                setMemberEmail("");
                                setShowAddModal(true);
                            }}
                        >
                            + Add Member
                        </Button>
                    )}
                </Card.Header>

                <Card.Body>
                    {members.length === 0 ? (
                        <p className="text-center text-muted">
                            No members found.
                        </p>
                    ) : (
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Username</th>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>User Role</th>
                                    <th>Joined At</th>
                                    {isPM && <th>Action</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {members.map((member, index) => (
                                    <tr key={member.id || member.userId}>
                                        <td>{index + 1}</td>
                                        <td>{member.username || "-"}</td>
                                        <td>{member.fullName || "-"}</td>
                                        <td>{member.email || "-"}</td>

                                        <td>
                                            <Badge bg="secondary">
                                                {member.userRole || "MEMBER"}
                                            </Badge>
                                        </td>

                                        <td>
                                            {member.joinedAt
                                                ? new Date(member.joinedAt)
                                                    .toLocaleDateString()
                                                : "-"}
                                        </td>

                                        {isPM && (
                                            <td>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    disabled={saving}
                                                    onClick={() =>
                                                        handleRemoveMember(
                                                            member.userId
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* EDIT MODAL */}
            <Modal
                show={showEditModal}
                onHide={() => !saving && setShowEditModal(false)}
                centered
            >
                <Form onSubmit={handleUpdateWorkspace}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Workspace</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Workspace Name</Form.Label>

                            <Form.Control
                                value={editForm.name}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        name: e.target.value,
                                    })
                                }
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Description</Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={editForm.description}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowEditModal(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* ADD MEMBER MODAL */}
            <Modal
                show={showAddModal}
                onHide={() => !saving && setShowAddModal(false)}
                centered
            >
                <Form onSubmit={handleAddMember}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add Workspace Member</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>Email Address</Form.Label>

                            <Form.Control
                                type="email"
                                placeholder="Enter registered email"
                                value={memberEmail}
                                onChange={(e) =>
                                    setMemberEmail(e.target.value)
                                }
                                required
                            />

                            <Form.Text className="text-muted">
                                User must already have a TaskFlow account.
                                Their existing User role will be retained.
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowAddModal(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={saving}>
                            {saving ? "Adding..." : "Add Member"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* DELETE MODAL */}
            <Modal
                show={showDeleteModal}
                onHide={() => !saving && setShowDeleteModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Delete Workspace</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    Are you sure you want to delete
                    {" "}<strong>{workspace.name}</strong>?
                    <p className="text-danger mt-2 mb-0">
                        This action cannot be undone.
                        Workspace must not contain Areas.
                    </p>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="danger"
                        onClick={handleDeleteWorkspace}
                        disabled={saving}
                    >
                        {saving ? "Deleting..." : "Delete"}
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
}

export default WorkspaceDetail;