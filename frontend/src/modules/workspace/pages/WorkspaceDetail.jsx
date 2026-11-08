
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
  const [currentUserRole, setCurrentUserRole] = useState("");

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

  const [memberForm, setMemberForm] = useState({
    email: "",
    role: "MEMBER",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Load workspace detail
      const workspaceData = await workspaceService.getById(id);

      setWorkspace(workspaceData);
      setCurrentUserRole(workspaceData.currentUserRole || "");

      setEditForm({
        name: workspaceData.name || "",
        description: workspaceData.description || "",
      });

      // Load members
      const memberData = await workspaceService.getMembers(id);

      setMembers(Array.isArray(memberData) ? memberData : []);
    } catch (err) {
      console.error("Load workspace error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load workspace information."
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

  // =========================
  // WORKSPACE UPDATE
  // =========================

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

  // =========================
  // WORKSPACE DELETE
  // =========================

  const handleDeleteWorkspace = async () => {
    clearMessages();

    try {
      setSaving(true);

      await workspaceService.delete(id);

      setShowDeleteModal(false);

      // App.jsx khai báo route /workspace
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

  // =========================
  // ADD MEMBER BY EMAIL
  // =========================

  const handleAddMember = async (event) => {
    event.preventDefault();
    clearMessages();

    const email = memberForm.email.trim();

    if (!email) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);

      await workspaceService.addMember(id, {
        email,
        role: memberForm.role,
      });

      setShowAddModal(false);

      setMemberForm({
        email: "",
        role: "MEMBER",
      });

      setSuccess("Member added successfully.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to add member. Please check the email."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // CHANGE MEMBER ROLE
  // =========================

  const handleChangeRole = async (userId, newRole) => {
    clearMessages();

    try {
      setSaving(true);

      // Service nhận role dạng string
      await workspaceService.updateMemberRole(
        id,
        userId,
        newRole
      );

      setSuccess("Member role updated successfully.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update member role."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // REMOVE MEMBER
  // =========================

  const handleRemoveMember = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this member?"
    );

    if (!confirmed) return;

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

  // =========================
  // TRANSFER OWNERSHIP
  // =========================

  const handleTransferOwnership = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to transfer workspace ownership?"
    );

    if (!confirmed) return;

    clearMessages();

    try {
      setSaving(true);

      // Service nhận userId trực tiếp
      await workspaceService.transferOwnership(id, userId);

      setSuccess("Workspace ownership transferred successfully.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to transfer workspace ownership."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // ROLE PERMISSIONS
  // =========================

  const isOwner = currentUserRole === "OWNER";
  const isAdmin = currentUserRole === "ADMIN";
  const canEdit = isOwner || isAdmin;

  const getRoleBadge = (role) => {
    const variants = {
      OWNER: "danger",
      ADMIN: "primary",
      MEMBER: "secondary",
    };

    return (
      <Badge bg={variants[role] || "secondary"}>
        {role || "MEMBER"}
      </Badge>
    );
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading workspace...</p>
      </Container>
    );
  }

  // =========================
  // NOT FOUND
  // =========================

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

  // =========================
  // MAIN UI
  // =========================

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

          <p className="text-muted mb-0">
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

          {canEdit && (
            <Button
              variant="outline-primary"
              onClick={() => {
                clearMessages();
                setShowEditModal(true);
              }}
            >
              Edit Workspace
            </Button>
          )}

          {isOwner && (
            <Button
              variant="outline-danger"
              onClick={() => {
                clearMessages();
                setShowDeleteModal(true);
              }}
            >
              Delete Workspace
            </Button>
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
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Body>
              <h5>Workspace Information</h5>

              <Row className="mt-3">
                <Col md={4}>
                  <p className="text-muted mb-1">
                    Workspace ID
                  </p>
                  <strong>{workspace.id}</strong>
                </Col>

                <Col md={4}>
                  <p className="text-muted mb-1">
                    Workspace Name
                  </p>
                  <strong>{workspace.name}</strong>
                </Col>

                <Col md={4}>
                  <p className="text-muted mb-1">
                    Your Role
                  </p>
                  {getRoleBadge(currentUserRole)}
                </Col>
              </Row>

              <hr />

              <p className="text-muted mb-1">
                Description
              </p>

              <p className="mb-0">
                {workspace.description || "No description provided."}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* MEMBERS */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">

          <div>
            <h5 className="mb-0">Workspace Members</h5>

            <small className="text-muted">
              {members.length} member(s)
            </small>
          </div>

          {/* OWNER AND ADMIN CAN ADD MEMBER */}
          {canEdit && (
            <Button
              variant="primary"
              onClick={() => {
                clearMessages();

                setMemberForm({
                  email: "",
                  role: "MEMBER",
                });

                setShowAddModal(true);
              }}
            >
              + Add Member
            </Button>
          )}
        </Card.Header>

        <Card.Body>
          {members.length === 0 ? (
            <p className="text-muted text-center py-3">
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
                  <th>Role</th>
                  <th>Joined At</th>
                  {(isOwner || isAdmin) && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {members.map((member, index) => {
                  const isOwnerMember = member.role === "OWNER";

                  // Owner can manage Admin and Member.
                  // Admin can only manage Member.
                  const canManageMember =
                    (isOwner && !isOwnerMember) ||
                    (isAdmin && member.role === "MEMBER");

                  return (
                    <tr key={member.id || member.userId}>
                      <td>{index + 1}</td>

                      <td>{member.username || "-"}</td>

                      <td>{member.fullName || "-"}</td>

                      <td>{member.email || "-"}</td>

                      <td>{getRoleBadge(member.role)}</td>

                      <td>
                        {member.joinedAt
                          ? new Date(member.joinedAt).toLocaleDateString()
                          : "-"}
                      </td>

                      {(isOwner || isAdmin) && (
                        <td>
                          {canManageMember && (
                            <div className="d-flex gap-2 flex-wrap">

                              <Form.Select
                                size="sm"
                                style={{ width: "120px" }}
                                value={member.role}
                                disabled={saving}
                                onChange={(e) =>
                                  handleChangeRole(
                                    member.userId,
                                    e.target.value
                                  )
                                }
                              >
                                {isOwner && (
                                  <>
                                    <option value="ADMIN">
                                      ADMIN
                                    </option>

                                    <option value="MEMBER">
                                      MEMBER
                                    </option>
                                  </>
                                )}

                                {isAdmin && (
                                  <option value="MEMBER">
                                    MEMBER
                                  </option>
                                )}
                              </Form.Select>

                              {isOwner && (
                                <Button
                                  size="sm"
                                  variant="outline-warning"
                                  disabled={saving}
                                  onClick={() =>
                                    handleTransferOwnership(
                                      member.userId
                                    )
                                  }
                                >
                                  Transfer
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline-danger"
                                disabled={saving}
                                onClick={() =>
                                  handleRemoveMember(member.userId)
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* EDIT WORKSPACE MODAL */}
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
                type="text"
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
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>

              <Form.Control
                type="email"
                placeholder="Enter registered email"
                value={memberForm.email}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    email: e.target.value,
                  })
                }
                required
              />

              <Form.Text className="text-muted">
                The user must already have a TaskFlow account
                registered with this email.
              </Form.Text>
            </Form.Group>

            <Form.Group>
              <Form.Label>Workspace Role</Form.Label>

              <Form.Select
                value={memberForm.role}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    role: e.target.value,
                  })
                }
              >
                {isOwner && (
                  <option value="ADMIN">ADMIN</option>
                )}

                <option value="MEMBER">MEMBER</option>
              </Form.Select>
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

      {/* DELETE WORKSPACE MODAL */}
      <Modal
        show={showDeleteModal}
        onHide={() => !saving && setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Workspace</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Are you sure you want to delete workspace{" "}
          <strong>{workspace.name}</strong>?

          <p className="text-danger mt-2 mb-0">
            This action cannot be undone. The backend may reject
            deletion if the Workspace still contains Areas.
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
