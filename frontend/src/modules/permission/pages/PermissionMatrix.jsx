import { useState, useEffect, Fragment } from "react";
import { Container, Card, Table, Form, Button, Alert, Spinner, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../../services/api";

const ROLES = ["LEADER", "DEV", "TESTER", "MEMBER"];

const MODULE_NAMES = {
  WORKSPACE: "1. MODULE WORKSPACE (Dự án)",
  AREA: "2. MODULE AREA (Cột Kanban)",
  CARD: "3. MODULE CARD (Thẻ công việc)",
};

export default function PermissionMatrix() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [message, setMessage] = useState(null);

  // 1. Tải ma trận quyền từ Backend
  const loadData = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await api.get("/api/permissions/matrix");
      const data = res.data.data;
      setPermissions(data.permissions || []);
      setMatrix(data.matrix || {});
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Không thể tải ma trận phân quyền.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Xử lý khi PM tick / bỏ tick vào checkbox
  const handleToggle = (role, permName) => {
    setMatrix((prev) => {
      const currentPerms = prev[role] || [];
      const isChecked = currentPerms.includes(permName);
      const updatedPerms = isChecked
        ? currentPerms.filter((p) => p !== permName)
        : [...currentPerms, permName];
      return { ...prev, [role]: updatedPerms };
    });
  };

  // 3. Gửi ma trận mới về Backend để lưu vào DB
  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await api.put("/api/permissions/matrix", { matrix });
      setMessage({
        type: "success",
        text: "Lưu phân quyền thành công vào Database!",
      });
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Lỗi khi lưu phân quyền.",
      });
    } finally {
      setSaving(false);
    }
  };

  const modules = ["WORKSPACE", "AREA", "CARD"];

  return (
    <Container className="py-4">
      {/* Header trang */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold text-primary mb-1">Quản Lý Phân Quyền (RBAC)</h3>
          <p className="text-muted small mb-0">
            Dành riêng cho PM. Tick chọn quyền hạn cho từng vai trò rồi bấm Lưu vào Database.
          </p>
        </div>
        <Link to="/home" className="btn btn-outline-secondary btn-sm">
          ← Về Trang Chủ
        </Link>
      </div>

      {/* Thông báo kết quả */}
      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2 text-muted">Đang tải dữ liệu quyền hạn...</div>
        </div>
      ) : (
        <Card className="shadow-sm border-0 rounded-3">
          <Card.Body className="p-0">
            <Table bordered hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "40%" }}>Chức năng (12 Features)</th>
                  {ROLES.map((role) => (
                    <th key={role} className="text-center" style={{ width: "15%" }}>
                      <Badge bg="primary" className="px-2 py-1">
                        {role}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => {
                  const modPerms = permissions.filter((p) => p.module === mod);
                  return (
                    <Fragment key={mod}>
                      {/* Tiêu đề nhóm Module */}
                      <tr className="table-secondary">
                        <td colSpan={ROLES.length + 1} className="fw-bold py-2 text-uppercase small text-dark">
                          {MODULE_NAMES[mod] || mod}
                        </td>
                      </tr>
                      {/* Danh sách 4 quyền thuộc module */}
                      {modPerms.map((perm) => (
                        <tr key={perm.id}>
                          <td>
                            <div className="fw-semibold">{perm.description}</div>
                            <div className="text-muted small font-monospace">({perm.name})</div>
                          </td>
                          {ROLES.map((role) => {
                            const isChecked = matrix[role]?.includes(perm.name) || false;
                            return (
                              <td key={role} className="text-center">
                                <Form.Check
                                  type="checkbox"
                                  className="d-inline-block"
                                  checked={isChecked}
                                  onChange={() => handleToggle(role, perm.name)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>

          {/* Footer nút hành động */}
          <Card.Footer className="bg-white p-3 d-flex justify-content-between align-items-center">
            <span className="small text-muted">
              💡 <em>Lưu ý: Vai trò <strong>PM</strong> luôn mặc định có toàn bộ 12 quyền.</em>
            </span>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm" onClick={loadData} disabled={saving}>
                Khôi phục ban đầu
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu..." : "💾 Lưu Thay Đổi Vào DB"}
              </Button>
            </div>
          </Card.Footer>
        </Card>
      )}
    </Container>
  );
}

