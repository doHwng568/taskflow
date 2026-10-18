import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Container, Form, Modal } from "react-bootstrap";
import "../styles/MainWorkspace.css";

const STORAGE_KEY = "taskflow-demo-cards";

const STATUSES = [
  { id: "todo", label: "To do" },
  { id: "in-progress", label: "In progress" },
  { id: "done", label: "Done" },
];

const SAMPLE_CARDS = [
  { id: "sample-1", content: "Draft the card creation form", status: "todo" },
  { id: "sample-2", content: "Review the information shown on each card", status: "todo" },
  { id: "sample-3", content: "Build the card management screen", status: "in-progress" },
  { id: "sample-4", content: "Set up the frontend project", status: "done" },
];

function readCardsFromStorage() {
  try {
    const savedCards = localStorage.getItem(STORAGE_KEY);

    if (savedCards === null) {
      return SAMPLE_CARDS;
    }

    const cards = JSON.parse(savedCards);
    return Array.isArray(cards) ? cards : SAMPLE_CARDS;
  } catch {
    return SAMPLE_CARDS;
  }
}

function MainWorkspace() {
  const [cards, setCards] = useState(readCardsFromStorage);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [formData, setFormData] = useState({ content: "", status: "todo" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  const openCreateModal = () => {
    setEditingCard(null);
    setFormData({ content: "", status: "todo" });
    setFormError("");
    setShowCardModal(true);
  };

  const openEditModal = (card) => {
    setEditingCard(card);
    setFormData({ content: card.content, status: card.status });
    setFormError("");
    setShowCardModal(true);
  };

  const closeCardModal = () => {
    setShowCardModal(false);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFormError("");
  };

  const handleSaveCard = (event) => {
    event.preventDefault();
    const content = formData.content.trim();

    if (!content) {
      setFormError("Enter some text for this card.");
      return;
    }

    if (editingCard) {
      setCards((currentCards) =>
        currentCards.map((card) =>
          card.id === editingCard.id
            ? { ...card, content, status: formData.status }
            : card,
        ),
      );
    } else {
      const id = globalThis.crypto?.randomUUID?.() ?? `card-${Date.now()}`;
      setCards((currentCards) => [
        ...currentCards,
        { id, content, status: formData.status },
      ]);
    }

    closeCardModal();
  };

  const handleDeleteCard = () => {
    if (!cardToDelete) {
      return;
    }

    setCards((currentCards) =>
      currentCards.filter((card) => card.id !== cardToDelete.id),
    );
    setCardToDelete(null);
  };

  return (
    <main className="workspace-page">
      <Container className="workspace-container">
        <div className="workspace-heading">
          <div>
            <p className="workspace-eyebrow">TASK FLOW / WORKSPACE</p>
            <h1>Card management</h1>
            <p className="workspace-subtitle">
              Create, edit, and delete cards in your workspace.
            </p>
          </div>
          <Button variant="primary" onClick={openCreateModal}>
            Create card
          </Button>
        </div>
        <div className="workspace-board">
          {STATUSES.map((status) => {
            const columnCards = cards.filter(
              (card) => card.status === status.id,
            );

            return (
              <section
                className="workspace-column"
                key={status.id}
                aria-labelledby={`column-${status.id}`}
              >
                <div className="workspace-column-heading">
                  <h2 id={`column-${status.id}`}>{status.label}</h2>
                  <Badge bg="secondary" pill>
                    {columnCards.length}
                  </Badge>
                </div>

                <div className="workspace-column-cards">
                  {columnCards.length === 0 ? (
                    <p className="workspace-empty-message">No cards here yet.</p>
                  ) : (
                    columnCards.map((card) => (
                      <Card className="workspace-task-card" key={card.id}>
                        <Card.Body>
                          <p className="workspace-card-content">
                            {card.content}
                          </p>
                          <div className="workspace-card-actions">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => openEditModal(card)}
                              aria-label={`Edit card: ${card.content}`}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => setCardToDelete(card)}
                              aria-label={`Delete card: ${card.content}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </Container>

      <Modal show={showCardModal} onHide={closeCardModal} centered>
        <Form onSubmit={handleSaveCard}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingCard ? "Edit card" : "Create card"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="card-content">
              <Form.Label>Card content</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="content"
                value={formData.content}
                onChange={handleFormChange}
                placeholder="Describe the work for this card"
                autoFocus
              />
            </Form.Group>

            <Form.Group controlId="card-status">
              <Form.Label>Area</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
              >
                {STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {formError && (
              <p className="workspace-form-error" role="alert">
                {formError}
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={closeCardModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingCard ? "Save changes" : "Create card"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={Boolean(cardToDelete)}
        onHide={() => setCardToDelete(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete card?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This will remove “{cardToDelete?.content}” from this browser.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setCardToDelete(null)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteCard}>
            Delete card
          </Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}

export default MainWorkspace;