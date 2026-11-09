import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Alert } from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import api from "../../../services/api";
import Header from "../../../layouts/Header";

function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
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
            const loginData = res.data?.data;

            if (!loginData?.accessToken) {
                throw new Error("Backend did not return accessToken.");
            }

            const token = loginData.accessToken;
            let role = loginData.role;

            if (!role) {
                const decoded = jwtDecode(token);
                role = decoded.role;
            }

            if (role?.startsWith("ROLE_")) {
                role = role.substring(5);
            }

            if (!role) {
                throw new Error(
                    "Cannot find user role in login response or JWT token."
                );
            }

            localStorage.setItem("accessToken", token);
            localStorage.setItem(
                "username",
                loginData.username || form.username
            );
            localStorage.setItem("userRole", role);

            navigate("/home");
        } catch (err) {
            setResponse({
                message:
                    err.response?.data?.message ||
                    err.message ||
                    "Đăng nhập thất bại.",
                errors: err.response?.data?.errors || [],
            });
        }
    };

    const usernameError = response?.errors?.find(
        (item) => item.field === "username"
    )?.message;
    const passwordError = response?.errors?.find(
        (item) => item.field === "password"
    )?.message;

    return (
        <div className="min-vh-100 d-flex flex-column">
            <Header />

            <div className="auth-page-wrapper">
                <div className="auth-modal-card">
                    {/* Thanh tiêu đề giống ảnh mẫu */}
                    <div className="auth-modal-header">
                        <h2 className="auth-modal-title">
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
                            </svg>
                            Đăng nhập
                        </h2>

                        <Link
                            to="/home"
                            className="auth-modal-close"
                            aria-label="Đóng"
                            title="Về trang chủ"
                        >
                            ×
                        </Link>
                    </div>

                    <div className="auth-modal-body">
                        {response?.message && !usernameError && !passwordError && (
                            <Alert variant="danger" className="py-2 small mb-3">
                                {response.message}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Tên đăng nhập */}
                            <div className="auth-field-group">
                                <label
                                    htmlFor="loginUsername"
                                    className="auth-field-label"
                                >
                                    Tên đăng nhập
                                </label>
                                <input
                                    id="loginUsername"
                                    type="text"
                                    name="username"
                                    className="auth-input"
                                    placeholder="Nhập tên đăng nhập"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                />
                                {usernameError && (
                                    <div className="auth-field-error">
                                        {usernameError}
                                    </div>
                                )}
                            </div>

                            {/* Mật khẩu + nút con mắt ẩn/hiện */}
                            <div className="auth-field-group">
                                <label
                                    htmlFor="loginPassword"
                                    className="auth-field-label"
                                >
                                    Mật khẩu
                                </label>
                                <div className="auth-password-group">
                                    <input
                                        id="loginPassword"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        className="auth-input"
                                        placeholder="••••••••••••"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="auth-password-toggle"
                                        onClick={() =>
                                            setShowPassword((prev) => !prev)
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Ẩn mật khẩu"
                                                : "Hiện mật khẩu"
                                        }
                                        title={
                                            showPassword
                                                ? "Ẩn mật khẩu"
                                                : "Hiện mật khẩu"
                                        }
                                    >
                                        <svg
                                            width="15"
                                            height="15"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                            {showPassword && (
                                                <line
                                                    x1="2"
                                                    y1="2"
                                                    x2="22"
                                                    y2="22"
                                                />
                                            )}
                                        </svg>
                                    </button>
                                </div>
                                {passwordError && (
                                    <div className="auth-field-error">
                                        {passwordError}
                                    </div>
                                )}
                            </div>

                            {/* Duy trì đăng nhập */}
                            <label className="auth-remember-row">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) =>
                                        setRememberMe(e.target.checked)
                                    }
                                />
                                <span>Duy trì đăng nhập</span>
                            </label>

                            {/* Chuyển sang Đăng ký */}
                            <div className="auth-switch-row">
                                <Link to="/register" className="auth-switch-link">
                                    Đăng ký
                                </Link>{" "}
                                nếu bạn chưa có tài khoản
                            </div>

                            {/* Nút Đăng nhập màu đỏ cam */}
                            <button type="submit" className="auth-submit-btn">
                                Đăng nhập
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;