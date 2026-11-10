import { Link } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import Header from "../../layouts/Header";

function getLoggedIn() {
    const token = localStorage.getItem("accessToken");

    if (!token) return false;

    try {
        const decoded = jwtDecode(token);
        return decoded.exp > Date.now() / 1000;
    } catch {
        return false;
    }
}

function Home() {
    const isLogged = getLoggedIn();

    return (
        <div className="min-vh-100 d-flex flex-column bg-light">
            <Header />

            <Container className="py-5 text-center my-auto">
                <Row className="justify-content-center">
                    <Col md={10} lg={8}>
                        <h1 className="display-4 fw-bold text-dark mb-3">
                            Smart task management with{" "}
                            <span className="text-primary">TaskFlow</span>
                        </h1>

                        <p className="text-secondary fs-5 mb-4">
                            Organize your work, collaborate with your team,
                            and manage your tasks efficiently.
                        </p>

                        {isLogged ? (
                            <Button
                                as={Link}
                                to="/workspace"
                                variant="primary"
                                size="lg"
                                className="px-4"
                            >
                                Go to My Workspaces
                            </Button>
                        ) : (
                            <div className="d-flex justify-content-center gap-3">
                                <Button
                                    as={Link}
                                    to="/login"
                                    variant="primary"
                                    size="lg"
                                >
                                    Login
                                </Button>

                                <Button
                                    as={Link}
                                    to="/register"
                                    variant="outline-primary"
                                    size="lg"
                                >
                                    Register
                                </Button>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Home;