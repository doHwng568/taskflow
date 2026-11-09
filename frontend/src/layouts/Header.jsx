import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import ThemeToggle from "../shared/components/ThemeToggle";

function getInitialAuth() {
    const token = localStorage.getItem("accessToken");

    if (token) {
        try {
            const decoded = jwtDecode(token);

            if (decoded.exp > Date.now() / 1000) {
                let role =
                    decoded.role ||
                    localStorage.getItem("userRole") ||
                    "";

                if (role.startsWith("ROLE_")) {
                    role = role.substring(5);
                }

                if (role) {
                    localStorage.setItem("userRole", role);
                }

                return {
                    isLogged: true,
                    username:
                        decoded.sub ||
                        localStorage.getItem("username") ||
                        "",
                    role,
                };
            }
        } catch (error) {
            console.error("Cannot decode JWT:", error);
        }
    }

    return {
        isLogged: false,
        username: "",
        role: "",
    };
}

function Header() {
    const navigate = useNavigate();

    const [{ isLogged, username, role }] = useState(getInitialAuth);

    const isPM = role === "PM";

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("username");
        localStorage.removeItem("userRole");

        navigate("/login");
        window.location.reload();
    };

    return (
        <Navbar expand="lg" className="tf-navbar">
            <Container>
                <Link to="/home" className="tf-brand">
                    TaskFlow
                </Link>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto align-items-center gap-2 flex-wrap">
                        {!isLogged ? (
                            <>
                                <Link to="/login" className="tf-header-btn">
                                    Đăng nhập
                                </Link>

                                <Link to="/register" className="tf-header-btn">
                                    Đăng ký
                                </Link>

                                <ThemeToggle />
                            </>
                        ) : (
                            <>
                                <span className="tf-header-greeting">
                                    Hello, <strong>{username}</strong>
                                    {role && (
                                        <span className="tf-role-badge">
                                            {role}
                                        </span>
                                    )}
                                </span>

                                <Link to="/workspace" className="tf-header-btn">
                                    My Workspaces
                                </Link>

                                {isPM && (
                                    <>
                                        <Link to="/users" className="tf-header-btn">
                                            Quản lý nhân viên
                                        </Link>

                                        <Link to="/permissions" className="tf-header-btn">
                                            Phân quyền
                                        </Link>
                                    </>
                                )}

                                <Link to="/profile" className="tf-header-btn">
                                    Hồ sơ
                                </Link>

                                <ThemeToggle />

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="tf-header-btn tf-header-btn-logout"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;