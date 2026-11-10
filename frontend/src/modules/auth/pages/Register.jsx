import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Alert } from "react-bootstrap";
import api from "../../../services/api";
import Header from "../../../layouts/Header";

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
                    <div className="auth-modal-header">
                        <h2 className="auth-modal-title">
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            Register
                        </h2>

                        <Link
                            to="/home"
                            className="auth-modal-close"
                            aria-label="Close"
                            title="Back to Home"
                        >
                            ×
                        </Link>
                    </div>

                    <div className="auth-modal-body">
                        {response?.code === "USER_002" && (
                            <Alert variant="danger" className="py-2 small mb-3">
                                {response.message}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="auth-field-group">
                                <label
                                    htmlFor="registerUsername"
                                    className="auth-field-label"
                                >
                                    Username
                                </label>
                                <input
                                    id="registerUsername"
                                    type="text"
                                    name="username"
                                    className="auth-input"
                                    placeholder="Enter username"
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

                            <div className="auth-field-group">
                                <label
                                    htmlFor="registerPassword"
                                    className="auth-field-label"
                                >
                                    Password
                                </label>
                                <div className="auth-password-group">
                                    <input
                                        id="registerPassword"
                                        type="password"
                                        name="password"
                                        className="auth-input"
                                        placeholder="Enter password"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {passwordError && (
                                    <div className="auth-field-error">
                                        {passwordError}
                                    </div>
                                )}
                            </div>

                            <div className="auth-switch-row mt-3">
                                Already have an account?{" "}
                                <Link to="/login" className="auth-switch-link">
                                    Login
                                </Link>
                            </div>

                            <button type="submit" className="auth-submit-btn">
                                Register
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;