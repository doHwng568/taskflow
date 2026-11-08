import { useState } from 'react';
import '../styles/Card.css';

export default function AddCardForm({
  columnId,
  onCreateCard,
  isAddingCard,
  setIsAddingCard,
}) {
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleCreateCard = (event) => {
    event.preventDefault();

    const cardTitle = newCardTitle.trim();
    if (!cardTitle) return;

    onCreateCard(columnId, cardTitle);
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  const cancelCreateCard = () => {
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  if (isAddingCard) {
    return (
      <form onSubmit={handleCreateCard} className="board-add-card-form">
        <textarea
          autoFocus
          value={newCardTitle}
          onChange={(event) => setNewCardTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Nhập tiêu đề hoặc dán liên kết"
          className="board-add-card-input"
          rows={2}
        />

        <div className="board-add-card-actions">
          <button type="submit" className="board-add-card-submit">
            Thêm thẻ
          </button>
          <button
            type="button"
            onClick={cancelCreateCard}
            className="board-add-card-cancel"
            aria-label="Hủy thêm thẻ"
          >
            ✕
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="board-column-footer">
      <button
        className="board-add-card-button"
        onClick={() => setIsAddingCard(true)}
      >
        <span aria-hidden="true">＋</span> Thêm thẻ
      </button>
      <button
        className="board-create-card-button"
        aria-label="Tạo thẻ"
        onClick={() => setIsAddingCard(true)}
      >
        ↗
      </button>
    </div>
  );
}
