import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import "../styles/MainWorkspace.css";

const LISTS_STORAGE_KEY = "taskflow-demo-lists";
const CARDS_STORAGE_KEY = "taskflow-demo-cards";
const WORKSPACE_NAME_STORAGE_KEY = "taskflow-demo-workspace-name";

const INITIAL_LISTS = [
  { id: "todo", name: "Kế hoạch" },
  { id: "in-progress", name: "Đang làm" },
  { id: "done", name: "Đã xong" },
];

const INITIAL_CARDS = [
  { id: "card-1", content: "Học SP", listId: "todo" },
  { id: "card-2", content: "ngủ", listId: "todo" },
  { id: "card-3", content: "đi bộ", listId: "in-progress" },
  { id: "card-4", content: "ăn", listId: "done" },
];

function createId(prefix) {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function readLists() {
  try {
    const savedLists = localStorage.getItem(LISTS_STORAGE_KEY);

    if (savedLists === null) {
      return INITIAL_LISTS;
    }

    const parsedLists = JSON.parse(savedLists);

    if (!Array.isArray(parsedLists)) {
      return INITIAL_LISTS;
    }

    return parsedLists.filter(
      (list) =>
        list &&
        typeof list.id === "string" &&
        typeof list.name === "string",
    );
  } catch {
    return INITIAL_LISTS;
  }
}

function readCards() {
  try {
    const savedCards = localStorage.getItem(CARDS_STORAGE_KEY);

    if (savedCards === null) {
      return INITIAL_CARDS;
    }

    const parsedCards = JSON.parse(savedCards);

    if (!Array.isArray(parsedCards)) {
      return INITIAL_CARDS;
    }

    // Đọc cả dữ liệu cũ đã lưu bằng trường status.
    return parsedCards
      .filter(
        (card) =>
          card &&
          (typeof card.id === "string" || typeof card.id === "number") &&
          typeof card.content === "string",
      )
      .map((card) => ({
        ...card,
        listId: card.listId ?? card.status ?? "todo",
      }));
  } catch {
    return INITIAL_CARDS;
  }
}

function MainWorkspace() {
  const [lists, setLists] = useState(readLists);
  const [cards, setCards] = useState(readCards);

  const [workspaceName, setWorkspaceName] = useState(
    () =>
      localStorage.getItem(WORKSPACE_NAME_STORAGE_KEY) ||
      "Workspace Trên lớp",
  );

  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [formData, setFormData] = useState({ content: "", listId: "todo" });
  const [formError, setFormError] = useState("");

  const [showListForm, setShowListForm] = useState(false);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(WORKSPACE_NAME_STORAGE_KEY, workspaceName);
  }, [workspaceName]);

  const openCreateCard = (listId) => {
    setEditingCard(null);
    setFormData({ content: "", listId });
    setFormError("");
    setShowCardModal(true);
  };

  const openEditCard = (card) => {
    setEditingCard(card);
    setFormData({
      content: card.content,
      listId: card.listId,
    });
    setFormError("");
    setShowCardModal(true);
  };

  const closeCardModal = () => {
    setShowCardModal(false);
    setEditingCard(null);
    setFormError("");
  };

  const handleCardFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
  };

  const handleSaveCard = (event) => {
    event.preventDefault();

    const content = formData.content.trim();

    if (!content) {
      setFormError("Bạn hãy nhập nội dung cho thẻ.");
      return;
    }

    if (editingCard) {
      setCards((currentCards) =>
        currentCards.map((card) =>
          card.id === editingCard.id
            ? {
                ...card,
                content,
                listId: formData.listId,
                status: formData.listId,
              }
            : card,
        ),
      );
    } else {
      const newCard = {
        id: createId("card"),
        content,
        listId: formData.listId,
        status: formData.listId,
      };

      setCards((currentCards) => [...currentCards, newCard]);
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

  const handleAddList = (event) => {
    event.preventDefault();

    const name = newListName.trim();

    if (!name) {
      return;
    }

    setLists((currentLists) => [
      ...currentLists,
      { id: createId("list"), name },
    ]);

    setNewListName("");
    setShowListForm(false);
  };

  return (
    <main className="workspace-page">
      <div className="workspace-topbar">
        <input
          className="workspace-name-input"
          type="text"
          aria-label="Tên workspace"
          value={workspaceName}
          onChange={(event) => setWorkspaceName(event.target.value)}
          onBlur={() =>
            setWorkspaceName((name) => name.trim() || "Workspace Trên lớp")
          }
          placeholder="Nhập tên workspace"
          maxLength={60}
        />
      </div>

      <div className="workspace-board">
        {lists.map((list) => {
          const listCards = cards.filter((card) => card.listId === list.id);

          return (
            <section className="workspace-list" key={list.id}>
              <div className="workspace-list-heading">
                <h2>{list.name}</h2>
                <span className="workspace-card-count">{listCards.length}</span>
                <span className="workspace-list-menu" aria-hidden="true">
                  ⋯
                </span>
              </div>

              <div className="workspace-list-cards">
                {listCards.map((card) => (
                  <article className="workspace-card" key={card.id}>
                    <p>{card.content}</p>

                    <div className="workspace-card-actions">
                      <button
                        type="button"
                        onClick={() => openEditCard(card)}
                        aria-label={`Sửa thẻ ${card.content}`}
                        title="Sửa thẻ"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardToDelete(card)}
                        aria-label={`Xóa thẻ ${card.content}`}
                        title="Xóa thẻ"
                      >
                        ×
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <button
                className="workspace-add-card"
                type="button"
                onClick={() => openCreateCard(list.id)}
              >
                <span aria-hidden="true">＋</span> Thêm thẻ
              </button>
            </section>
          );
        })}

        <div className="workspace-add-list-area">
          {showListForm ? (
            <Form className="workspace-add-list-form" onSubmit={handleAddList}>
              <Form.Control
                autoFocus
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                placeholder="Nhập tên danh sách"
                aria-label="Tên danh sách mới"
              />

              <div className="workspace-add-list-actions">
                <Button type="submit" size="sm">
                  Thêm danh sách
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setShowListForm(false);
                    setNewListName("");
                  }}
                >
                  Hủy
                </Button>
              </div>
            </Form>
          ) : (
            <button
              className="workspace-add-list-button"
              type="button"
              onClick={() => setShowListForm(true)}
            >
              <span aria-hidden="true">＋</span> Thêm danh sách khác
            </button>
          )}
        </div>
      </div>

      <Modal show={showCardModal} onHide={closeCardModal} centered>
        <Form onSubmit={handleSaveCard}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingCard ? "Sửa thẻ" : "Thêm thẻ"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Group className="mb-3" controlId="card-content">
              <Form.Label>Nội dung thẻ</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="content"
                value={formData.content}
                onChange={handleCardFormChange}
                placeholder="Nhập nội dung thẻ"
                autoFocus
              />
            </Form.Group>

            <Form.Group controlId="card-list">
              <Form.Label>Danh sách</Form.Label>
              <Form.Select
                name="listId"
                value={formData.listId}
                onChange={handleCardFormChange}
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
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
            <Button
              type="button"
              variant="outline-secondary"
              onClick={closeCardModal}
            >
              Hủy
            </Button>
            <Button type="submit" variant="secondary">
              {editingCard ? "Lưu thay đổi" : "Thêm thẻ"}
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
          <Modal.Title>Xóa thẻ?</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Bạn có chắc muốn xóa thẻ “{cardToDelete?.content}” không?
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setCardToDelete(null)}
          >
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDeleteCard}>
            Xóa thẻ
          </Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}

export default MainWorkspace;