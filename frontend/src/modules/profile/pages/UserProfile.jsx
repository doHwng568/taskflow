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

  // State cho form cập nhật thông tin cá nhân
  const [fullName, setFullName] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // State cho form đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // 1. Tải thông tin cá nhân từ Backend
  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/users/profile");
      const data = res.data.data;
      setProfile(data);
      setFullName(data.fullName || "");
    } catch (err) {
      setProfileMessage({
        type: "danger",
        text: err.response?.data?.message || "Không thể tải thông tin cá nhân.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // 2. Xử lý lưu họ và tên
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileMessage({ type: "danger", text: "Họ và tên không được để trống." });
      return;
    }

    try {
      setUpdatingProfile(true);
      setProfileMessage(null);
      const res = await api.put("/api/users/profile", { fullName: fullName.trim() });
      setProfile(res.data.data);
      setProfileMessage({ type: "success", text: "Cập nhật họ và tên thành công!" });
    } catch (err) {
      setProfileMessage({
        type: "danger",
        text: err.response?.data?.message || "Lỗi khi cập nhật thông tin cá nhân.",
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  // 3. Xử lý đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!oldPassword) {
      setPasswordMessage({ type: "danger", text: "Vui lòng nhập mật khẩu hiện tại." });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ type: "danger", text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "danger", text: "Mật khẩu mới và xác nhận mật khẩu không khớp." });
      return;
    }

    try {
      setChangingPassword(true);
      await api.put("/api/users/change-password", {
        oldPassword,
        newPassword,
      });

      setPasswordMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage({
        type: "danger",
        text: err.response?.data?.message || "Lỗi khi đổi mật khẩu.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <div className="mt-2 text-muted">Đang tải thông tin hồ sơ...</div>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: "860px" }}>
      {/* Header trang */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-primary mb-1">Hồ Sơ Cá Nhân</h3>
          <p className="text-muted small mb-0">Quản lý thông tin tài khoản và đổi mật khẩu</p>
        </div>
        <Link to="/home" className="btn btn-outline-secondary btn-sm">
          ← Về Trang Chủ
        </Link>
      </div>

      <Row className="g-4">
        {/* Phần 1: Thông tin cá nhân */}
        <Col md={6}>
          <Card className="shadow-sm border-0 rounded-3 h-100">
            <Card.Header className="bg-white py-3 border-bottom">
              <h5 className="fw-bold mb-0 text-dark">Thông Tin Tài Khoản</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {profileMessage && (
                <Alert variant={profileMessage.type} dismissible onClose={() => setProfileMessage(null)}>
                  {profileMessage.text}
                </Alert>
              )}

              <Form onSubmit={handleUpdateProfile}>
                {/* Tên đăng nhập (Read-only) */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-muted">Tên Đăng Nhập</Form.Label>
                  <Form.Control type="text" value={profile?.username || ""} disabled className="bg-light" />
                </Form.Group>

                {/* Vai trò (Read-only) */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-muted">Role</Form.Label>
                  <div>
                    <Badge bg={ROLE_BADGE_VARIANT[profile?.role] || "secondary"} className="fs-6 px-3 py-2">
                      {profile?.role}
                    </Badge>
                  </div>
                </Form.Group>

                {/* Email (Read-only) */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-muted">Địa Chỉ Email</Form.Label>
                  <Form.Control type="email" value={profile?.email || "Chưa cập nhật"} disabled className="bg-light" />
                </Form.Group>

                {/* Họ và tên (Cho phép sửa) */}
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-semibold text-dark">Họ và Tên</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập họ và tên của bạn..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Form.Group>

                <Button variant="primary" type="submit" disabled={updatingProfile} className="w-100">
                  {updatingProfile ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu Họ và Tên"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Phần 2: Đổi mật khẩu */}
        <Col md={6}>
          <Card className="shadow-sm border-0 rounded-3 h-100">
            <Card.Header className="bg-white py-3 border-bottom">
              <h5 className="fw-bold mb-0 text-dark">Đổi Mật Khẩu</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {passwordMessage && (
                <Alert variant={passwordMessage.type} dismissible onClose={() => setPasswordMessage(null)}>
                  {passwordMessage.text}
                </Alert>
              )}

              <Form onSubmit={handleChangePassword}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-dark">Mật Khẩu Hiện Tại</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nhập mật khẩu hiện tại..."
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-dark">Mật Khẩu Mới</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-semibold text-dark">Xác Nhận Mật Khẩu Mới</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nhập lại mật khẩu mới..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Form.Group>

                <Button variant="warning" type="submit" disabled={changingPassword} className="w-100 fw-semibold">
                  {changingPassword ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Đổi Mật Khẩu"
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

