import { useState, useEffect } from "react";
import { Container, Card, Table, Form, Alert, Spinner, Badge, InputGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../../../services/api";
import Header from "../../../layouts/Header";

const ROLES = ["PM", "LEADER", "DEV", "TESTER", "MEMBER"];

const ROLE_BADGE_VARIANT = {
  PM: "danger",
  LEADER: "primary",
  DEV: "success",
  TESTER: "warning",
  MEMBER: "secondary",
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [currentUsername, setCurrentUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUsername(decoded.sub || "");
      } catch {
        setCurrentUsername("");
      }
    }
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await api.get("/api/users");
      setUsers(res.data.data || []);
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Unable to load users.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingId(userId);
      setMessage(null);

      const res = await api.put(`/api/users/${userId}/role`, { role: newRole });
      const updatedUser = res.data.data;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updatedUser.role } : u))
      );

      setMessage({
        type: "success",
        text: `Updated role of "${updatedUser.username}" to "${updatedUser.role}" successfully!`,
      });
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to update user role.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.fullName && u.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      selectedRoleFilter === "ALL" || u.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <>
      <Header />
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 className="fw-bold text-primary mb-1">User Management</h3>
          </div>
          <Link to="/home" className="tf-header-btn">
            ← Back to Home
          </Link>
        </div>

        {message && (
          <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Card className="shadow-sm border-0 rounded-3 mb-3">
          <Card.Body className="py-2 px-3">
            <div className="row g-2 align-items-center">
              <div className="col-md-7">
                <InputGroup size="sm">
                  <Form.Control
                    placeholder="Search by username, full name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </div>
              <div className="col-md-5 d-flex align-items-center gap-2">
                <span className="small text-muted text-nowrap">Role:</span>
                <Form.Select
                  size="sm"
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                >
                  <option value="ALL">All Roles</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>
          </Card.Body>
        </Card>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2 text-muted">Loading users...</div>
          </div>
        ) : (
          <Card className="shadow-sm border-0 rounded-3">
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "80px" }}>ID</th>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th style={{ width: "160px" }}>Current Role</th>
                    <th style={{ width: "200px" }}>Assign Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No matching users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf =
                        u.username.toLowerCase() === currentUsername.toLowerCase();
                      const isUpdating = updatingId === u.id;

                      return (
                        <tr key={u.id}>
                          <td className="text-muted fw-bold">#{u.id}</td>
                          <td>
                            <span className="fw-semibold text-dark">{u.username}</span>
                            {isSelf && (
                              <Badge bg="info" className="ms-2 text-dark">
                                You
                              </Badge>
                            )}
                          </td>
                          <td>{u.fullName || <span className="text-muted fst-italic">Not updated</span>}</td>
                          <td>{u.email || <span className="text-muted fst-italic">Not updated</span>}</td>
                          <td>
                            <Badge
                              bg={ROLE_BADGE_VARIANT[u.role] || "secondary"}
                              className="px-2 py-1"
                            >
                              {u.role}
                            </Badge>
                          </td>
                          <td>
                            {isSelf ? (
                              <span className="text-muted small fst-italic">
                                (Current account)
                              </span>
                            ) : (
                              <div className="d-flex align-items-center gap-2">
                                <Form.Select
                                  size="sm"
                                  value={u.role}
                                  disabled={isUpdating}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  style={{ width: "130px" }}
                                >
                                  {ROLES.map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </Form.Select>
                                {isUpdating && <Spinner size="sm" animation="border" />}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}
      </Container>
    </>
  );
}