import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Container,
    Row,
    Col,
    Card,
    Form,
    Button,
    Alert,
} from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import api from "../../../services/api";

function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const [response, setResponse] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setResponse(null);

        try {
            const res = await api.post("/auth/login", form);

            console.log("FULL LOGIN RESPONSE:", res.data);

            // ApiResponse của backend có cấu trúc { code, message, data }
            const loginData = res.data?.data;

            if (!loginData?.accessToken) {
                throw new Error("Backend did not return accessToken.");
            }

            const token = loginData.accessToken;

            // Ưu tiên lấy role từ response
            let role = loginData.role;

            // Nếu response không có role thì đọc từ JWT
            if (!role) {
                const decoded = jwtDecode(token);
                role = decoded.role;
            }

            // Chuẩn hóa ROLE_PM thành PM
            if (role?.startsWith("ROLE_")) {
                role = role.substring(5);
            }

            if (!role) {
                throw new Error(
                    "Cannot find user role in login response or JWT token."
                );
            }

            // Lưu thông tin đăng nhập
            localStorage.setItem("accessToken", token);
            localStorage.setItem(
                "username",
                loginData.username || form.username
            );
            localStorage.setItem("userRole", role);

            console.log("LOGIN USERNAME:", loginData.username || form.username);
            console.log("LOGIN ROLE:", role);
            console.log("SAVED USER ROLE:", localStorage.getItem("userRole"));

            navigate("/home");
        } catch (err) {
            console.error("LOGIN ERROR:", err);

            setResponse({
                message:
                    err.response?.data?.message ||
                    err.message ||
                    "Login failed.",
                errors: err.response?.data?.errors || [],
            });
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center bg-light py-5">
            <Container>
                <Row className="justify-content-center">
                    <Col xs={12} sm={10} md={8} lg={5} xl={4}>
                        <Card className="shadow-sm border-0 rounded-4">
                            <Card.Body className="p-4 p-sm-5">
                                <div className="text-center mb-4">
                                    <h2 className="fw-bold text-primary mb-1">
                                        Login
                                    </h2>
                                </div>

                                {response?.message && (
                                    <Alert variant="danger" className="py-2 small">
                                        {response.message}
                                    </Alert>
                                )}

                                <Form onSubmit={handleSubmit}>
                                    <Form.Group
                                        className="mb-3"
                                        controlId="loginUsername"
                                    >
                                        <Form.Label className="fw-semibold">
                                            Username
                                        </Form.Label>

                                        <Form.Control
                                            type="text"
                                            placeholder="Username"
                                            name="username"
                                            value={form.username}
                                            onChange={handleChange}
                                            required
                                        />

                                        {response?.errors?.map((item, index) =>
                                            item.field === "username" ? (
                                                <div
                                                    key={index}
                                                    className="text-danger small mt-1"
                                                >
                                                    {item.message}
                                                </div>
                                            ) : null
                                        )}
                                    </Form.Group>

                                    <Form.Group
                                        className="mb-4"
                                        controlId="loginPassword"
                                    >
                                        <Form.Label className="fw-semibold">
                                            Password
                                        </Form.Label>

                                        <Form.Control
                                            type="password"
                                            placeholder="Password"
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            required
                                        />

                                        {response?.errors?.map((item, index) =>
                                            item.field === "password" ? (
                                                <div
                                                    key={index}
                                                    className="text-danger small mt-1"
                                                >
                                                    {item.message}
                                                </div>
                                            ) : null
                                        )}
                                    </Form.Group>

                                    <Button
                                        variant="primary"
                                        type="submit"
                                        className="w-100 py-2 fw-semibold rounded-3 mb-3"
                                    >
                                        Login
                                    </Button>
                                </Form>

                                <div className="text-center small mt-3">
                                    <span className="text-muted">
                                        Don't have an account?{" "}
                                    </span>

                                    <Link
                                        to="/register"
                                        className="fw-semibold text-decoration-none"
                                    >
                                        Sign up
                                    </Link>
                                </div>

                                <div className="text-center mt-3">
                                    <Link
                                        to="/home"
                                        className="text-muted small text-decoration-none"
                                    >
                                        Back to Home
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

export default Login;