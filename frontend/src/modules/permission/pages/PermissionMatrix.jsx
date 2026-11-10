import { useState, useEffect, Fragment } from "react";
import { Container, Card, Table, Form, Button, Alert, Spinner, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../../services/api";

const ROLES = ["LEADER", "DEV", "TESTER", "MEMBER"];

const MODULE_NAMES = {
  WORKSPACE: "1. WORKSPACE",
  AREA: "2. AREA",
  CARD: "3. CARD",
};

export default function PermissionMatrix() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [message, setMessage] = useState(null);

  // load data 
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

  // click tick
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

  // save
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
          <h3 className="fw-bold text-primary mb-1">Quản Lý Phân Quyền</h3>
        </div>
        <Link to="/home" className="btn btn-outline-secondary btn-sm">
          Về Trang Chủ
        </Link>
      </div>

      {/* message */}
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
                      {/* header module */}
                      <tr className="table-secondary">
                        <td colSpan={ROLES.length + 1} className="fw-bold py-2 text-uppercase small text-dark">
                          {MODULE_NAMES[mod] || mod}
                        </td>
                      </tr>
                      {/* permission */}
                      {modPerms.map((perm) => (
                        <tr key={perm.id}>
                          <td>
                            <div className="fw-semibold">{perm.description}</div>
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

          {/* save */}
          <Card.Footer className="bg-white p-3 d-flex justify-content-between align-items-center">
            <span className="small text-muted">
            </span>
            <div className="d-flex gap-2">
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu" : "Lưu Thay Đổi Vào DB"}
              </Button>
            </div>
          </Card.Footer>
        </Card>
      )}
    </Container>
  );
}

