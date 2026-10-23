import { useState } from 'react';
import ListActionMenu from './ListActionMenu';
import CardItem from './CardItem';

export default function BoardColumn({ column, onUpdateTitle, onDeleteList, onCreateCard,
  onOpenCard, onEditCard, onMoveCard, onToggleCardComplete, }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);

    try {
      const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
      if (dragData.cardId && dragData.sourceColumnId) {
        onMoveCard(dragData.sourceColumnId, column.id, dragData.cardId);
      }
    } catch {
      // Ignore drops that do not come from a board card.
    }
  };

  const handleTitleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onUpdateTitle(column.id, title);
    } else {
      setTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  const handleCreateCard = (event) => {
    event.preventDefault();

    const cardTitle = newCardTitle.trim();
    if (!cardTitle) return;

    onCreateCard(column.id, cardTitle);
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  const showCardForm = () => {
    setIsAddingCard(true);
    setShowMenu(false);
  };

  const cancelCreateCard = () => {
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  return (
    <section
      className={`board-column ${isDragOver ? 'is-drop-target' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="board-column-heading">
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit} className="board-column-title-form">
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              className="board-column-title-input"
            />
          </form>
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            className="board-column-title"
          >
            {column.title}
          </h2>
        )}

        <div className="board-column-meta">
          <span className="board-card-count">{column.cards.length}</span>
          <button
            onClick={() => setShowMenu((isOpen) => !isOpen)}
            className="board-column-menu-button"
            aria-label={`Tùy chọn danh sách ${column.title}`}
            aria-expanded={showMenu}
          >
            •••
          </button>
        </div>
      </div>

      {showMenu && (
        <ListActionMenu
          onClose={() => setShowMenu(false)}
          onAddCard={showCardForm}
          onDeleteList={() => {
            onDeleteList(column.id);
            setShowMenu(false);
          }}
        />
      )}

      <div className="board-column-cards">
        {column.cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            columnId={column.id}
            onClick={() => onOpenCard(column.id, card)}
            onEdit={() => onEditCard(column.id, card)}
            onToggleComplete={onToggleCardComplete}
          />
        ))}
      </div>
      {isAddingCard ? (
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
      ) : (
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
      )}
    </section>
  );
}
