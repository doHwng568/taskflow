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
        <Navbar expand="lg" className="border-bottom py-2">
            <Container>
                <Navbar.Brand
                    as={Link}
                    to="/home"
                    className="fw-bold text-primary fs-4"
                >
                    TaskFlow
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto align-items-center gap-2">
                        {!isLogged ? (
                            <>
                                <Nav.Link
                                    as={Link}
                                    to="/login"
                                    className="btn btn-outline-primary btn-sm px-3"
                                >
                                    Login
                                </Nav.Link>

                                <Nav.Link
                                    as={Link}
                                    to="/register"
                                    className="btn btn-primary btn-sm px-3"
                                >
                                    Register
                                </Nav.Link>

                                <ThemeToggle />
                            </>
                        ) : (
                            <>
                                <span className="navbar-text me-2">
                                    Hello,{" "}
                                    <strong className="text-dark">
                                        {username}
                                    </strong>

                                    {role && (
                                        <span className="badge bg-secondary ms-1">
                                            {role}
                                        </span>
                                    )}
                                </span>

                                <Nav.Link
                                    as={Link}
                                    to="/workspace"
                                    className="btn btn-primary btn-sm px-3"
                                >
                                    My Workspaces
                                </Nav.Link>

                                {isPM && (
                                    <>
                                        <Nav.Link
                                            as={Link}
                                            to="/users"
                                            className="btn btn-outline-primary btn-sm px-3"
                                        >
                                            Quản lý nhân viên
                                        </Nav.Link>

                                        <Nav.Link
                                            as={Link}
                                            to="/permissions"
                                            className="btn btn-outline-primary btn-sm px-3"
                                        >
                                            Phân quyền
                                        </Nav.Link>
                                    </>
                                )}

                                <Nav.Link
                                    as={Link}
                                    to="/profile"
                                    className="btn btn-outline-secondary btn-sm px-3"
                                >
                                    Hồ sơ
                                </Nav.Link>

                                <ThemeToggle />

                                <Nav.Link
                                    as="button"
                                    onClick={handleLogout}
                                    className="btn btn-outline-danger btn-sm px-3"
                                >
                                    Logout
                                </Nav.Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;