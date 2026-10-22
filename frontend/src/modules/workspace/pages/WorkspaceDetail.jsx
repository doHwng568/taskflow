
import { useEffect, useState } from "react";
import { Alert, Button, Card, Container } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import workspaceService from "../services/workspaceService";

function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    setWorkspace(workspaceService.getById(id));
  }, [id]);

  if (!workspace) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Workspace not found. It may have been deleted.
        </Alert>
        <Button onClick={() => navigate("/workspace")}>
          Back to Workspaces
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Button
        variant="outline-secondary"
        className="mb-4"
        onClick={() => navigate("/workspace")}
      >
        ← All Workspaces
      </Button>

      <Card className="mb-4 shadow-sm">
        <Card.Body className="p-4">
          <div className="text-secondary small mb-2">
            WORKSPACE DETAILS
          </div>

          <h2 className="fw-bold">{workspace.name}</h2>

          <p className="text-secondary">
            {workspace.description || "No description provided."}
          </p>

          <small className="text-secondary">
            Created: {new Date(workspace.createdAt).toLocaleString()}
          </small>
        </Card.Body>
      </Card>

      <section>
        <h4 className="fw-bold mb-3">Areas</h4>

        <div className="border rounded-4 text-center p-5">
          <h5>Areas will appear here</h5>
          <p className="text-secondary mb-0">
            Area management will be integrated from the Area module.
          </p>
        </div>
      </section>
    </Container>
  );
}

export default WorkspaceDetail;
