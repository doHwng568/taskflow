import { useState, useEffect } from "react";
import { Container, Card, Form, Button, Alert, Spinner, Badge, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../../services/api";

const ROLE_BADGE_VARIANT = {
  PM: "danger",
  LEADER: "primary",
  DEV: "success",
  TESTER: "warning",
  MEMBER: "secondary",
};

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // state for information
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // state for change password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // 1. Load user profile from backend
  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/users/profile");
      const data = res.data.data;
      setProfile(data);
      setFullName(data.fullName || "");
      setEmail(data.email || "");
    } catch (err) {
      setProfileMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to load user profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // update information
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileMessage({ type: "danger", text: "Full name cannot be empty." });
      return;
    }
    if (!email.trim()) {
      setProfileMessage({ type: "danger", text: "Email cannot be empty." });
      return;
    }

    try {
      setUpdatingProfile(true);
      setProfileMessage(null);
      const res = await api.put("/api/users/profile", {
        fullName: fullName.trim(),
        email: email.trim(),
      });
      setProfile(res.data.data);
      setProfileMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setProfileMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  // update password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!oldPassword) {
      setPasswordMessage({ type: "danger", text: "Please enter your current password." });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ type: "danger", text: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "danger", text: "New password and confirm password do not match." });
      return;
    }

    try {
      setChangingPassword(true);
      await api.put("/api/users/change-password", {
        oldPassword,
        newPassword,
      });

      setPasswordMessage({ type: "success", text: "Password changed successfully!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to change password.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <div className="mt-2 text-muted">Loading...</div>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: "860px" }}>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-primary mb-1">User Profile</h3>
        </div>
        <Link to="/home" className="btn btn-warning btn-sm">
          Back to Home
        </Link>
      </div>

      <Row className="g-4">
        {/* Profile Information */}
        <Col md={6}>
          <Card className="shadow-sm border-0 rounded-3 h-100">
            <Card.Header className="bg-white py-3 border-bottom">
              <h5 className="fw-bold mb-0 text-dark">Profile Information</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {profileMessage && (
                <Alert variant={profileMessage.type} dismissible onClose={() => setProfileMessage(null)}>
                  {profileMessage.text}
                </Alert>
              )}

              <Form onSubmit={handleUpdateProfile}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-muted">Username</Form.Label>
                  <Form.Control type="text" value={profile?.username || ""} disabled className="bg-light" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-muted">Role</Form.Label>
                  <div>
                    <Badge bg={ROLE_BADGE_VARIANT[profile?.role] || "secondary"} className="fs-6 px-3 py-2">
                      {profile?.role}
                    </Badge>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-dark">Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your full name..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-semibold text-dark">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>

                <Button variant="primary" type="submit" disabled={updatingProfile} className="w-100">
                  {updatingProfile ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Change Password */}
        <Col md={6}>
          <Card className="shadow-sm border-0 rounded-3 h-100">
            <Card.Header className="bg-white py-3 border-bottom">
              <h5 className="fw-bold mb-0 text-dark">Change Password</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {passwordMessage && (
                <Alert variant={passwordMessage.type} dismissible onClose={() => setPasswordMessage(null)}>
                  {passwordMessage.text}
                </Alert>
              )}

              <Form onSubmit={handleChangePassword}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-dark">Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter current password..."
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-dark">New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter new password (at least 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-semibold text-dark">Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Form.Group>

                <Button variant="warning" type="submit" disabled={changingPassword} className="w-100 fw-semibold">
                  {changingPassword ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

