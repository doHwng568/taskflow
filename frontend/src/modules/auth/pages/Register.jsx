import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import api from "../../../services/api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [response, setResponse] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      console.log(err.response?.data);
      setResponse(err.response?.data || "");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((pre) => ({
      ...pre,
      [name]: value,
    }));
  };

  useEffect(() => {
    console.log("giá trị hiện tại của form ", form);
  }, [form]);

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light py-5">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={5} xl={4}>
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Body className="p-4 p-sm-5">
                {/* Tiêu đề */}
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-primary mb-1">Register</h2>
                </div>

                {response.code === "USER_002" && (
                  <Alert variant="danger" className="py-2 small">
                    {response.message}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="registerUsername">
                    <Form.Label className="fw-semibold small">Username</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Username"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                    />
                    {response.errors?.map((item, index) => {
                      if (item.field === "username") {
                        return (
                          <div key={index} className="text-danger small mt-1">
                            {item.message}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="registerPassword">
                    <Form.Label className="fw-semibold small">Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                    />
                    {response.errors?.map((item, index) => {
                      if (item.field === "password") {
                        return (
                          <div key={index} className="text-danger small mt-1">
                            {item.message}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2 fw-semibold rounded-3 mb-3"
                  >
                    Register
                  </Button>
                </Form>

                <div className="text-center small mt-3">
                  <span className="text-muted">Have account? </span>
                  <Link to="/login" className="fw-semibold text-decoration-none">
                    Login
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Register;